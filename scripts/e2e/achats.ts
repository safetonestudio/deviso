/**
 * Achats internationaux : classification des refus et garde d'abandon du cron.
 *
 * Ne du 29/09/2026. Une facture polonaise datee du 05/06 restait "en attente" a
 * vie : la Plateforme Agreee la refusait pour date hors fenetre, et le code
 * classait ce refus comme reessayable. Le cron la retentait chaque heure sans
 * qu'elle puisse jamais passer. Meme piege pour un pays absent de la table EAS.
 *
 * Ce que ce script verrouille, contre le VRAI bac a sable :
 *  - une date passee hors fenetre -> action_requise (terminal), PAS en_attente ;
 *  - un pays non couvert          -> action_requise, PAS en_attente ;
 *  - une date courante couverte   -> transmis ;
 *  - la garde d'abandon du cron : au-dela du seuil, un "en_attente" bascule en
 *    action_requise au lieu de boucler indefiniment.
 *
 * Traverse la vraie fonction transmettreAchat et le vrai cron
 * retenterAchatsEnAttente (niveau ou le bug vivait), pas un mock.
 *
 * Usage : npx tsx scripts/e2e/achats.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { verifier, bilan } from "./lib.mjs";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Compte de test raccorde en bac a sable ("Deviso - compte test Super PDP",
// Burger Queen, company 57701). Meme compte que superpdp.mjs. S'il change, ce
// test echoue franchement plutot que de tester dans le vide.
const SANDBOX_USER = process.env.E2E_SANDBOX_USER || "ac3abc18-d1ee-4b21-b0ec-bf6f17767e31";

async function main() {
  const { transmettreAchat, retenterAchatsEnAttente } = await import("@/lib/superpdp-achats");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const base = (o: Record<string, unknown>) => ({
    id: crypto.randomUUID(), user_id: SANDBOX_USER,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    fournisseur_nom: "e2e achats", devise: "EUR", categorie: "services",
    montant_ht: 1000, taux_tva: 0, montant_tva: 0, superpdp_id: null,
    transmission_status: "en_attente", transmission_error: null, transmitted_at: null,
    retry_count: 0, ...o,
  });

  console.log("\n── Classification des refus (vrai bac a sable) ───────────────");

  const couvert = await transmettreAchat(SANDBOX_USER, base({
    fournisseur_pays: "PL", fournisseur_tva: "PL1234567890",
    numero: `E2E-OK-${Date.now()}`, date_facture: today,
  }) as never);
  verifier("un achat PL date du jour est transmis", couvert.ok === true,
    JSON.stringify(couvert));

  const vieux = await transmettreAchat(SANDBOX_USER, base({
    fournisseur_pays: "PL", fournisseur_tva: "PL1234567890",
    numero: `E2E-VIEUX-${Date.now()}`, date_facture: "2026-06-05",
  }) as never);
  verifier("une facture datee hors fenetre passe en action_requise, pas en_attente",
    vieux.ok === false && vieux.suite === "action_requise",
    JSON.stringify(vieux));
  verifier("et son detail garde la cause technique (cannot add invoice at date)",
    vieux.ok === false && /cannot add invoice at date/.test(vieux.detail),
    vieux.ok === false ? vieux.detail : "ok inattendu");

  const paysHorsTable = await transmettreAchat(SANDBOX_USER, base({
    fournisseur_pays: "DK", fournisseur_tva: "DK12345678",
    numero: `E2E-DK-${Date.now()}`, date_facture: today,
  }) as never);
  verifier("un pays hors table EAS passe en action_requise, pas en_attente",
    paysHorsTable.ok === false && paysHorsTable.suite === "action_requise",
    JSON.stringify(paysHorsTable));

  console.log("\n── Garde d'abandon du cron ───────────────────────────────────");

  // TVA absente => suite "reessayer" sans appel reseau : cas ideal pour eprouver
  // la borne d'abandon sans dependre de la disponibilite de la plateforme.
  const seme = await admin.from("superpdp_achats_int").insert([
    base({ fournisseur_pays: "PL", fournisseur_tva: null, numero: `E2E-GIVEUP-167-${Date.now()}`,
           date_facture: today, retry_count: 167, fournisseur_nom: "e2e giveup 167" }),
    base({ fournisseur_pays: "PL", fournisseur_tva: null, numero: `E2E-GIVEUP-0-${Date.now()}`,
           date_facture: today, retry_count: 0, fournisseur_nom: "e2e giveup 0" }),
  ]).select("id,retry_count");

  if (seme.error) {
    verifier("les lignes de test sont semees", false, seme.error.message);
  } else {
    const ids = seme.data.map((r: { id: string }) => r.id);
    const idHaut = seme.data.find((r: { retry_count: number }) => r.retry_count === 167)!.id;
    const idBas = seme.data.find((r: { retry_count: number }) => r.retry_count === 0)!.id;

    await retenterAchatsEnAttente(admin);

    const { data: apres } = await admin.from("superpdp_achats_int")
      .select("id,transmission_status,retry_count,transmission_error").in("id", ids);
    const haut = (apres ?? []).find((r) => r.id === idHaut);
    const bas = (apres ?? []).find((r) => r.id === idBas);

    verifier("au-dela du seuil, l'achat cesse de boucler et passe en action_requise",
      haut?.transmission_status === "action_requise" && haut?.retry_count === 168,
      JSON.stringify(haut));
    verifier("son message dit qu'il a ete abandonne apres N tentatives",
      typeof haut?.transmission_error === "string" && /tentatives/.test(haut.transmission_error),
      String(haut?.transmission_error));
    verifier("sous le seuil, l'achat reste en_attente et son compteur avance",
      bas?.transmission_status === "en_attente" && bas?.retry_count === 1,
      JSON.stringify(bas));

    await admin.from("superpdp_achats_int").delete().in("id", ids);
    console.log("   lignes de test supprimees.");
  }

  process.exit(bilan());
}
main().catch((e) => { console.error(e); process.exit(1); });
