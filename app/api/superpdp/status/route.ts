import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { pousserRegimeTva } from "@/lib/superpdp-entreprise";
import { getConnection, isSandbox, superpdpConfig, superpdpFetch, lireEtatSession, statutDepuisEtat, saveConnection, messageEtatSession } from "@/lib/superpdp";
import { lireLigneAnnuaire, type EtatLigne } from "@/lib/superpdp-ligne-annuaire";

/**
 * État du raccordement à la Plateforme Agréée, pour l'affichage.
 *
 * Ne renvoie **jamais** le refresh token : c'est toute la raison pour laquelle
 * il vit dans une table sans policy RLS plutôt que dans `profiles`.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!superpdpConfig()) {
    return NextResponse.json({ available: false, connected: false });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const conn = await getConnection(workspaceId);

  // Régime de TVA tel que la Plateforme Agréée le connaît. On le lit chez elle
  // et non chez nous : c'est sa valeur à elle qui commande le calendrier
  // d'e-reporting et qui fait accepter ou refuser les factures aux
  // particuliers. Afficher notre copie masquerait précisément la divergence
  // qu'on veut pouvoir constater.
  // Une vérification en attente ne se débloque pas toute seule.
  //
  // `session_status` est écrit au raccordement, puis n'est relu à la source que
  // par la synchronisation — laquelle n'est montée que pour les comptes DÉJÀ
  // vérifiés. Le cas nominal (KYB en revue au retour du tunnel, validé par le
  // support 24 h plus tard) n'était donc jamais rattrapé : l'utilisateur lisait
  // « Vérification en cours » indéfiniment, sans recevoir la moindre facture,
  // et le seul bouton offert relançait un tunnel d'autorisation complet là où
  // un simple GET suffit.
  let statut = conn?.session_status ?? null;
  let messageStatut: { texte: string; agir: boolean } | null = null;
  if (conn && statut !== "verified") {
    try {
      const etat = await lireEtatSession(workspaceId);
      if (etat) {
        // Ce qu'il faut dire, et surtout si une action est attendue de la
        // personne. « Nous vérifions » invite à attendre ; or une identité non
        // vérifiée attend justement qu'elle fasse quelque chose.
        messageStatut = messageEtatSession(etat);
        const reel = statutDepuisEtat(etat);
        if (reel !== statut) {
          statut = reel;
          await saveConnection(workspaceId, {
            session_status: reel,
            ...(reel === "verified" ? { last_error: null } : {}),
          });

          // La vérification vient d'aboutir : c'est le moment de pousser le
          // régime de TVA.
          //
          // Il n'était poussé qu'au retour du tunnel, et seulement si le compte
          // en ressortait déjà `verified` — c'est-à-dire jamais dans le cas
          // nominal, où la vérification prend un moment. Rien ne le rattrapait
          // ensuite : il fallait que l'utilisateur rouvre son profil et
          // réenregistre. Entre-temps, `vat_regime` restait vide chez Super PDP
          // et toutes ses factures aux particuliers étaient refusées.
          if (reel === "verified") {
            const profil = await getWorkspaceProfile<{
              tva_regime: string | null;
              tva_periodicite: string | null;
            }>(workspaceId, "tva_regime, tva_periodicite");
            if (profil) {
              const r = await pousserRegimeTva(workspaceId, profil);
              if (!r.ok && r.raison !== "inconnu") {
                console.error(`[superpdp/status] régime non poussé : ${r.raison}`);
              }
            }
          }
        }
      }
    } catch {
      // Un raccordement reste affichable même si la plateforme est muette.
    }
  }

  let regimeTva: string | null = null;
  let ligne: EtatLigne | null = null;
  if (statut === "verified") {
    // Être vérifié ne veut pas dire être joignable : c'est la ligne d'annuaire
    // qui rend une entreprise atteignable, et elle peut être absente, en
    // erreur, ou programmée pour plus tard.
    try {
      ligne = await lireLigneAnnuaire(workspaceId);
    } catch {
      // idem
    }
  }
  if (statut === "verified") {
    try {
      const res = await superpdpFetch(workspaceId, "/companies/me");
      if (res.ok) {
        const body = (await res.json()) as { vat_regime?: string | null };
        regimeTva = body.vat_regime?.trim() ? body.vat_regime : null;
      }
    } catch {
      // L'état du raccordement reste affichable sans cette information.
    }
  }

  return NextResponse.json({
    available: true,
    sandbox: isSandbox(),
    connected: Boolean(conn),
    status: statut,
    messageStatut,
    companyId: conn?.company_id ?? null,
    // Ce que l'utilisateur communique à ses clients pour être joignable.
    directoryAddress:
      (ligne && ligne.etat !== "absente" ? ligne.adresse : null) ?? conn?.directory_address ?? null,
    // L'état réel de la ligne de réception : « joignable », « programmee »,
    // « en_cours », « en_erreur » ou « absente ». Sans lui, l'écran promettait
    // une réception que rien ne garantissait.
    ligne: ligne ?? null,
    // Vide = les factures aux particuliers seront refusées. C'est la seule
    // façon pour l'utilisateur de s'en apercevoir avant d'essayer.
    regimeTva,
    lastError: conn?.last_error ?? null,
  });
}
