import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe";
import { MESSAGE_DEMO } from "@/lib/stripe-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { synchroniserSieges } from "@/lib/stripe-seats";
import type Stripe from "stripe";

/**
 * Les statuts sous lesquels un abonnement existe encore chez Stripe et
 * continue de porter — ou de reprendre — une facturation. En ouvrir un second
 * pendant que l'un de ceux-là court, c'est facturer deux fois.
 */
const ABONNEMENT_VIVANT = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

/** Tous les identifiants de prix de plan connus, mensuels et annuels. */
function prixDePlan(): Set<string> {
  return new Set(
    [
      PLANS.solo.priceId,
      PLANS.solo.annualPriceId,
      PLANS.pro.priceId,
      PLANS.pro.annualPriceId,
    ].filter(Boolean) as string[]
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Rejet explicite plutôt que repli silencieux. La version précédente écrivait
  // `body.plan === "pro" ? "pro" : "solo"` : n'importe quelle valeur inconnue
  // devenait « solo ». Sur une route qui déclenche un prélèvement, une erreur du
  // client aboutissait à abonner quelqu'un à une formule qu'il n'a pas demandée,
  // sans le moindre message.
  if (body.plan !== "solo" && body.plan !== "pro") {
    return NextResponse.json(
      { error: "Plan invalide", message: "Formule inconnue. Choisissez Solo ou Pro." },
      { status: 400 }
    );
  }
  if (body.billing !== undefined && body.billing !== "monthly" && body.billing !== "annual") {
    return NextResponse.json(
      { error: "Périodicité invalide", message: "Choisissez une facturation mensuelle ou annuelle." },
      { status: 400 }
    );
  }

  const targetPlan: "solo" | "pro" = body.plan;
  const billing: "monthly" | "annual" = body.billing === "annual" ? "annual" : "monthly";
  const priceId = billing === "annual" ? PLANS[targetPlan].annualPriceId : PLANS[targetPlan].priceId;

  if (!priceId) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, email, full_name, is_demo")
    .eq("id", user.id)
    .single();

  // Bloquer les comptes démo, pas d'abonnement réel possible
  if (profile?.is_demo) {
    return NextResponse.json({ error: "DEMO", message: MESSAGE_DEMO }, { status: 403 });
  }

  /**
   * Un abonnement en cours se MODIFIE ; il ne se double pas.
   *
   * Cette route ouvrait un tunnel de paiement quoi qu'il arrive. Un client
   * Solo qui cliquait « Passer à Pro » se retrouvait donc avec DEUX
   * abonnements actifs — 18 € + 34 € tous les mois — et le webhook écrasait
   * `stripe_subscription_id` au passage, si bien que Deviso ne savait même
   * plus que le premier existait, ni comment l'annuler.
   *
   * Ce n'est pas une hypothèse : le 11/07/2026, le client
   * cus_UrZfhGPUjRshd1 a porté un Solo et un Pro en parallèle pendant
   * vingt-huit jours. Les deux essais se sont éteints faute de carte, ce qui
   * est la seule raison pour laquelle personne n'a rien payé.
   *
   * On remplace donc l'ARTICLE DE PLAN de l'abonnement existant. L'article
   * « siège supplémentaire », qui vit sur le même abonnement, n'est pas touché :
   * le remplacer reviendrait à faire perdre ses collaborateurs au client.
   * Une fin d'essai en cours est conservée par Stripe.
   */
  const abonnementExistant = profile?.stripe_subscription_id;
  if (abonnementExistant) {
    let sub: Stripe.Subscription | null = null;
    try {
      sub = await stripe.subscriptions.retrieve(abonnementExistant, { expand: ["items"] });
    } catch {
      // L'abonnement mémorisé n'existe plus chez Stripe (compte de test,
      // migration). On l'oublie et on repart sur un tunnel normal.
      sub = null;
      await supabase
        .from("profiles")
        .update({ stripe_subscription_id: null })
        .eq("id", user.id);
    }

    if (sub && ABONNEMENT_VIVANT.has(sub.status)) {
      const connus = prixDePlan();
      const articlePlan = sub.items.data.find((a) => connus.has(a.price.id));

      if (!articlePlan) {
        // Aucun article ne correspond à un plan connu : on ne sait pas quoi
        // remplacer, et deviner reviendrait à facturer au hasard.
        console.error(
          `[stripe/checkout] abonnement ${sub.id} : aucun article de plan connu ` +
            `(${sub.items.data.map((a) => a.price.id).join(", ")})`
        );
        return NextResponse.json(
          {
            error: "PLAN_ILLISIBLE",
            message:
              "Votre abonnement actuel n'a pas pu être lu. Écrivez-nous à " +
              "support@getdeviso.fr, nous le changeons à la main.",
          },
          { status: 409 }
        );
      }

      /**
       * Redescendre en Solo, c'est renoncer à son équipe — il faut le dire
       * avant, pas le découvrir après.
       *
       * Le chemin Pro → Solo n'existait pas avant le 15/09 ; en l'ouvrant, on a
       * créé deux situations que rien ne traitait. L'article « siège » reste
       * sur l'abonnement, donc un abonné Solo continue de payer 5 € par
       * collaborateur. Et ses collaborateurs gardent leur accès, alors que la
       * page Équipe lui répond « plan insuffisant » : il paie pour des gens
       * qu'il ne peut plus gérer.
       *
       * On demande donc une confirmation explicite, en annonçant le nombre de
       * collaborateurs qui seront retirés. Sans elle, rien n'est modifié.
       */
      const cibleSansEquipe = targetPlan === "solo";
      let membresARetirer = 0;

      if (cibleSansEquipe) {
        const { count } = await supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id)
          .eq("status", "active");
        membresARetirer = count ?? 0;

        if (membresARetirer > 0 && body.confirmerRetraitMembres !== true) {
          return NextResponse.json(
            {
              error: "MEMBRES_A_RETIRER",
              nbMembres: membresARetirer,
              message:
                `La formule Solo ne comporte qu'un seul utilisateur. Passer à Solo ` +
                `retirera ${membresARetirer} collaborateur${membresARetirer > 1 ? "s" : ""} ` +
                `de votre espace : ${membresARetirer > 1 ? "ils perdront" : "il perdra"} ` +
                `immédiatement l'accès. Vos devis et factures, eux, sont conservés.`,
            },
            { status: 409 }
          );
        }
      }

      if (articlePlan.price.id === priceId) {
        return NextResponse.json(
          {
            error: "DEJA_SUR_CE_PLAN",
            message: "Vous êtes déjà sur cette formule.",
          },
          { status: 409 }
        );
      }

      try {
        await stripe.subscriptions.update(sub.id, {
          items: [{ id: articlePlan.id, price: priceId }],
          // La proration est calculée et REPORTÉE sur la prochaine facture.
          // `always_invoice` facturerait sur-le-champ — impossible pendant un
          // essai sans carte, et brutal juste après.
          proration_behavior: "create_prorations",
          metadata: { target_plan: targetPlan, billing },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
        console.error("[stripe/checkout] subscriptions.update error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
      }

      /**
       * Le plan n'est écrit en base QUE si l'abonnement est à jour.
       *
       * `ABONNEMENT_VIVANT` inclut volontairement les impayés : face à un
       * client en retard, on veut MODIFIER son abonnement plutôt que lui en
       * ouvrir un second — c'est tout l'objet de cette branche. Mais modifier
       * n'est pas payer.
       *
       * La version précédente écrivait `plan: targetPlan` sans condition. Un
       * client que le webhook venait de repasser en `free` pour impayé
       * récupérait donc un accès payant d'un seul clic ; et si cette écriture
       * arrivait APRÈS celle du webhook, elle gagnait, sans rien pour la
       * corriger avant le prochain événement Stripe. Trouvé en relecture le
       * 20/09/2026, pas par le banc — qui ne jouait qu'un abonnement à jour.
       *
       * La règle est désormais celle du webhook, mot pour mot : actif ou en
       * essai. Sinon on laisse le plan tel quel et on le dit à l'utilisateur.
       */
      /**
       * La formule est changée : on retire maintenant l'équipe, puis on
       * réaligne les sièges.
       *
       * Dans cet ordre, et après Stripe. Purger d'abord exposerait à supprimer
       * les collaborateurs d'un client dont le changement de formule aurait
       * ensuite échoué. Ici, un échec laisse l'équipe en place, ce qui se
       * répare d'un second clic.
       *
       * `synchroniserSieges` recalcule depuis les membres restants — zéro —
       * et supprime donc l'article « siège » de lui-même. Aucune quantité n'est
       * écrite à la main.
       */
      if (cibleSansEquipe && membresARetirer > 0) {
        const admin = createAdminClient();
        const { error: erreurPurge } = await admin
          .from("team_members")
          .delete()
          .eq("owner_id", user.id);

        if (erreurPurge) {
          console.error(
            `[stripe/checkout] passage à Solo de ${user.id} : les ${membresARetirer} ` +
              `collaborateur(s) n'ont PAS été retirés — ils gardent l'accès et ` +
              `leurs sièges restent facturés.`,
            erreurPurge
          );
        } else {
          await synchroniserSieges(user.id).catch((err) => {
            console.error(
              `[stripe/checkout] passage à Solo de ${user.id} : équipe retirée mais ` +
                `sièges NON réalignés — ils continuent d'être facturés.`,
              err
            );
          });
        }
      }

      const aJour = sub.status === "active" || sub.status === "trialing";
      if (aJour) {
        // L'écran doit refléter le changement tout de suite, sans dépendre du
        // délai d'un webhook.
        await supabase
          .from("profiles")
          .update({ plan: targetPlan })
          .eq("id", user.id);
      }

      return NextResponse.json({
        changed: true,
        plan: targetPlan,
        billing,
        aJour,
        ...(aJour
          ? {}
          : {
              message:
                "Votre formule est modifiée. L'accès reprendra dès le règlement " +
                "de la facture en attente.",
            }),
      });
    }
  }

  let customerId = profile?.stripe_customer_id;

  // Vérifier que le customer existe dans Stripe, sinon en créer un nouveau
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = null;
      await supabase.from("profiles").update({ stripe_customer_id: null }).eq("id", user.id);
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email,
      name: profile?.full_name || undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";

  // L'essai de 14 jours n'est accordé qu'UNE fois par client Stripe.
  //
  // Sans ce contrôle, l'essai était inconditionnel et sans carte
  // (`payment_method_collection: "if_required"`), et le webhook remet
  // `stripe_subscription_id` à null à l'annulation : un utilisateur pouvait
  // donc souscrire → annuler → re-souscrire en boucle et cumuler des essais
  // Pro gratuits à l'infini. On regarde si ce client a DÉJÀ eu un abonnement
  // (quel que soit son état) ; si oui, pas de nouvel essai, et la carte est
  // exigée immédiatement. En cas de doute (erreur Stripe), on refuse l'essai.
  let aDejaEuUnAbonnement = false;
  try {
    const anterieurs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    aDejaEuUnAbonnement = anterieurs.data.length > 0;
  } catch (err) {
    console.error("[stripe/checkout] vérification d'essai antérieur impossible, essai refusé par prudence :", err);
    aDejaEuUnAbonnement = true;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      // Essai (premier abonnement) : pas de carte pendant l'essai. Re-souscription
      // ou changement : carte exigée tout de suite, la période est active.
      payment_method_collection: aDejaEuUnAbonnement ? "always" : "if_required",
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/billing?upgraded=1`,
      cancel_url: `${baseUrl}/billing`,
      locale: "fr",
      subscription_data: {
        ...(aDejaEuUnAbonnement ? {} : { trial_period_days: 14 }),
        metadata: { target_plan: targetPlan, billing },
      },
      metadata: { target_plan: targetPlan, billing },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    console.error("[stripe/checkout] session.create error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
