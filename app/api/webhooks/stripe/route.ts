import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerEncaissementPdp } from "@/lib/superpdp-encaissement";
import type Stripe from "stripe";

// Correspondance price_id → plan (mensuel ET annuel)
function planFromPriceId(priceId: string): "solo" | "pro" | null {
  if (priceId === process.env.STRIPE_SOLO_PRICE_ID) return "solo";
  if (priceId === process.env.STRIPE_SOLO_ANNUAL_PRICE_ID) return "solo";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) return "pro";
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const supabase = createAdminClient();

  /**
   * Idempotence : on LIT la marque avant, on l'ÉCRIT après.
   *
   * Elle était écrite AVANT le traitement, et c'était un piège à événement
   * perdu. `stripe.subscriptions.retrieve` juste en dessous n'est protégé par
   * aucun `try` : au moindre incident réseau ou 500 de Stripe, l'exception
   * remontait, Next renvoyait 500, Stripe réessayait — et la deuxième
   * tentative tombait sur la marque déjà posée et repartait avec
   * « duplicate: true » sans rien faire. Toutes les suivantes aussi, y compris
   * un rejeu manuel depuis le tableau de bord Stripe.
   *
   * Conséquence : le client a payé, son plan reste « free », et rien ne le
   * signale. C'est le pire cas possible pour un webhook de facturation.
   *
   * Dans ce sens-ci, le risque résiduel est le double traitement quand deux
   * livraisons du même événement se croisent. Il est sans conséquence : tous
   * les traitements ci-dessous sont des `update` vers un état fixe, donc
   * idempotents par nature, et l'unique effet non idempotent — la déclaration
   * d'encaissement — porte sa propre réservation atomique
   * (`lib/superpdp-encaissement.ts`).
   */
  const { data: dejaTraite } = await supabase
    .from("stripe_processed_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (dejaTraite) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  /**
   * Le plan porté par un abonnement, quel que soit l'ordre des articles.
   *
   * `sub.items.data[0]` supposait un seul article. Or `lib/stripe-seats.ts`
   * ajoute un SECOND article sur le même abonnement dès qu'un collaborateur
   * est invité, et Stripe ne garantit aucun ordre. Si l'article « siège »
   * arrivait en premier, `planFromPriceId` renvoyait `null` et
   * `customer.subscription.updated` était abandonné en entier — y compris les
   * événements portant `past_due` ou `canceled`. Un client Pro avec un
   * collaborateur pouvait donc cesser de payer sans jamais être déclassé.
   */
  const planDeAbonnement = (sub: Stripe.Subscription): "solo" | "pro" | null => {
    for (const article of sub.items.data) {
      const p = planFromPriceId(article.price.id);
      if (p) return p;
    }
    return null;
  };

  /** Un `update` qui ne touche aucune ligne est un silence, pas un succès. */
  const verifierPortee = (quoi: string, lignes: unknown[] | null, customerId: string) => {
    if (!lignes || lignes.length === 0) {
      console.error(
        `[stripe/webhook] ${quoi} : aucun profil ne porte stripe_customer_id=${customerId}. ` +
          `Le client paie et son plan n'a pas été mis à jour.`
      );
    }
  };

  try {
  switch (event.type) {

    // ── Paiement initial réussi ──────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Cas 1 : lien de paiement facture (mode payment avec invoice_id en metadata)
      if (session.mode !== "subscription") {
        const invoiceId = session.metadata?.invoice_id;
        if (invoiceId && session.payment_status === "paid") {
          // Un paiement par lien est encaissé maintenant, et c'est le seul
          // chemin où la date est connue avec certitude — Stripe vient de nous
          // le dire. On l'inscrit plutôt que de laisser la Plateforme Agréée
          // dater elle-même : c'est cette date qui fixe la période
          // d'exigibilité de la TVA sur les prestations de services.
          const { data: updated, error } = await supabase
            .from("invoices")
            .update({ status: "paid", paid_at: new Date().toISOString().slice(0, 10) })
            .eq("id", invoiceId)
            .select("user_id, superpdp_invoice_id, superpdp_encaisse_at, paid_at")
            .maybeSingle();
          if (error) console.error("checkout.session.completed invoice update error:", error);

          // Paiement encaissé via un lien Deviso : même obligation d'e-reporting
          // (fr:212) que le bouton « Marquer comme payée ». Ce webhook contourne
          // la route PATCH générique, donc sans cet appel une facture payée par
          // lien de paiement ne déclarerait jamais son encaissement à Super PDP.
          if (updated?.superpdp_invoice_id && !updated.superpdp_encaisse_at) {
            const resultat = await envoyerEncaissementPdp(
              updated.user_id,
              invoiceId,
              updated.paid_at ?? null
            );
            if (!resultat.ok && resultat.raison !== "non_transmise") {
              console.error(
                `[stripe webhook] encaissement PDP ${invoiceId} : ${resultat.raison}`,
                resultat.detail ?? ""
              );
            }
          }
        }
        break;
      }

      // Cas 2 : souscription abonnement
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const targetPlan = session.metadata?.target_plan as "solo" | "pro" | null;

      if (!customerId) break;

      // Récupère l'abonnement pour avoir le plan ET le statut réel (trialing si essai sans carte)
      let plan: "solo" | "pro" = targetPlan ?? "solo";
      let subscriptionStatus = "active";
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (!targetPlan) plan = planDeAbonnement(sub) ?? "solo";
      subscriptionStatus = sub.status; // "trialing", "active", etc.

      const { data: touchees, error } = await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: subscriptionStatus,
        })
        .eq("stripe_customer_id", customerId)
        .select("id");

      if (error) throw error;
      verifierPortee("checkout.session.completed", touchees, customerId);
      break;
    }

    // ── Abonnement modifié (upgrade / downgrade / renouvellement) ─────────
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const plan = planDeAbonnement(sub);
      const status = sub.status; // active, past_due, canceled, etc.

      // Un abonnement dont aucun article ne correspond à un plan connu n'est
      // pas ignorable en silence : c'est soit un identifiant de prix mal
      // configuré, soit un plan retiré du catalogue, et dans les deux cas
      // l'utilisateur est bloqué sur un état qu'on ne sait plus lire.
      if (!plan) {
        console.error(
          `[stripe/webhook] abonnement ${sub.id} : aucun article ne correspond à un plan connu ` +
            `(${sub.items.data.map((a) => a.price.id).join(", ")})`
        );
        break;
      }

      // trialing = utilisateur en essai → accès au plan souscrit (pas "free")
      const isActive = status === "active" || status === "trialing";
      const { data: touchees, error } = await supabase
        .from("profiles")
        .update({
          plan: isActive ? plan : "free",
          subscription_status: status,
          stripe_subscription_id: sub.id,
        })
        .eq("stripe_customer_id", customerId)
        .select("id");

      if (error) throw error;
      verifierPortee("customer.subscription.updated", touchees, customerId);
      break;
    }

    // ── Abonnement résilié ────────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: touchees, error } = await supabase
        .from("profiles")
        .update({
          plan: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId)
        .select("id");

      if (error) throw error;
      verifierPortee("customer.subscription.deleted", touchees, customerId);
      break;
    }

    default:
      // Événement non géré — on ignore silencieusement
      break;
  }
  } catch (err) {
    // 500, et surtout PAS de marque d'idempotence : Stripe réessaiera.
    //
    // Toutes les erreurs repartaient en 200 (`console.error` puis `break`).
    // Stripe considérait l'événement remis et n'insistait plus jamais. Une
    // coupure passagère de la base pendant `customer.subscription.deleted`
    // laissait donc un abonnement résilié chez Stripe et un plan Pro actif
    // chez nous, indéfiniment — et l'inverse est vrai aussi.
    console.error(`[stripe/webhook] ${event.type} (${event.id}) :`, err);
    return NextResponse.json({ error: "traitement_echoue" }, { status: 500 });
  }

  // Traité sans exception : on pose la marque. Un échec ici ne coûte qu'un
  // éventuel double traitement idempotent, alors que l'absence de traitement
  // coûte un abonnement fantôme.
  const { error: marqueError } = await supabase
    .from("stripe_processed_events")
    .insert({ event_id: event.id });
  if (marqueError && marqueError.code !== "23505") {
    console.error("[stripe/webhook] marque d'idempotence non posée :", marqueError);
  }

  return NextResponse.json({ received: true });
}
