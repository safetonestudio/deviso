/**
 * Fin du régime simplifié de TVA au 1er janvier 2027 (art. 38 LF 2025,
 * vérifié le 20/11/2026) : les dossiers au RSI passent d'office au
 * trimestriel ; la dernière CA12 (année 2026) est due au plus tard le
 * 4 mai 2027. Ce test fixe ce que montrent le calendrier du cabinet et
 * l'échéance du tableau de bord client.
 *
 * Lancer : npx -y tsx scripts/e2e/tva-2027.ts
 */
import { verifier, bilan } from "./lib.mjs";

(async () => {
  const { echeanceDossier } = await import("@/lib/cabinet-tva-calendrier");
  const { prochaineDeclarationTva } = await import("@/lib/statut-entreprise");
  const d = (s: string) => new Date(`${s}T12:00:00Z`);
  const e = (per: "monthly" | "quarterly" | "simplified", s: string) => echeanceDossier(per, [], d(s));

  console.log("── Régime simplifié, avant et après 2027 ──────────────────────");
  const dec26 = e("simplified", "2026-12-10");
  verifier("décembre 2026 : CA12 de 2025 à déclarer, 2026 en cours", dec26.aDeclarer.cle === "2025" && dec26.enCours.cle === "2026");
  const fev27 = e("simplified", "2027-02-15");
  verifier("février 2027 : 2026 reste à déclarer (dernière CA12)", fev27.aDeclarer.cle === "2026", fev27.aDeclarer.cle);
  verifier("février 2027 : le 1er trimestre 2027 est en cours", fev27.enCours.cle === "2027-T1", fev27.enCours.cle);
  verifier("échéance client : au plus tard le 4 mai 2027", prochaineDeclarationTva("simplified", d("2027-02-15")).depot === "au plus tard le 4 mai 2027");
  const juil27 = e("simplified", "2027-07-15");
  verifier("juillet 2027 : rythme trimestriel (2e trimestre à déclarer)", juil27.aDeclarer.cle === "2027-T2" && juil27.enCours.cle === "2027-T3");
  verifier("juillet 2027 : échéance client trimestrielle", prochaineDeclarationTva("simplified", d("2027-07-15")).depot === prochaineDeclarationTva("quarterly", d("2027-07-15")).depot);

  console.log("── Les autres périodicités ne bougent pas ─────────────────────");
  verifier("trimestriel inchangé", e("quarterly", "2027-02-15").aDeclarer.cle === "2026-T4");
  verifier("mensuel inchangé", e("monthly", "2027-02-15").aDeclarer.cle === "2027-01");

  bilan();
})();
