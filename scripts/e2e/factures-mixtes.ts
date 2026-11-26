/**
 * Factures mixtes (biens + prestations, BT-23 = M1) : où Deviso les laisse
 * partir, et ce qu'il déclare à l'encaissement. Pur, sans réseau.
 *
 * Fondement (docs/superpdp/factures-mixtes.md) :
 *   - essai au bac à sable Super PDP du 24/11/2026 : B2B domestique accepté et
 *     acheminé ; B2C et international refusés au dépôt (400, « M1 (BT-23) ») ;
 *   - fr:212 : Super PDP déclare la facture ENTIÈRE sans détail ; la fiche DGFiP
 *     « Données de paiement » (août 2026) limite ces données à la TVA exigible
 *     à l'encaissement ; Super PDP l'a confirmé par écrit (ticket 9381527) :
 *     seule la part prestations est à déclarer.
 *
 * Lancer : npx -y tsx scripts/e2e/factures-mixtes.ts
 */
import { manquesPourEmission } from "@/lib/superpdp-precontrole";
import { checkInvoiceCompliance } from "@/lib/facturx-helpers";
import { blocsMen, lignesEncaissables } from "@/lib/encaissement-men";
import { readFileSync } from "node:fs";

let ok = 0;
let ko = 0;
function verifier(nom: string, cond: boolean, detail = "") {
  if (cond) { ok++; console.log(`  ✓ ${nom}`); }
  else { ko++; console.log(`  ✗ ${nom}${detail ? `  (${detail})` : ""}`); }
}

// ── Pré-contrôle d'émission ────────────────────────────────────────────────
console.log("\n── Pré-contrôle : où la facture mixte peut partir");
const commun = {
  seller_siren: "315143296", seller_postcode: "33000", seller_city: "Bordeaux",
  seller_tva_number: "FR40315143296", tva_rate: 20,
  client_postcode: "37170", client_city: "Chambray-lès-Tours",
};
const b2b = { ...commun, client_company: "Tricatel", client_name: "Tricatel", client_siren: "315143296", client_country: "FR" };
const b2c = { ...commun, client_name: "Jeanne Martin", client_email: "jeanne@example.fr", client_country: "FR" };
const intl = { ...commun, client_company: "Studio Lumen SRL", client_name: "Studio Lumen", client_country: "BE", client_email: "compta@example.be" };
const mixte = (m: string[]) => m.some((x) => /facture par nature/.test(x));

verifier("B2B domestique mixte : rien ne bloque", manquesPourEmission({ ...b2b, operation_category: "mixed" }).length === 0,
  JSON.stringify(manquesPourEmission({ ...b2b, operation_category: "mixed" })));
verifier("B2C mixte : bloquée, « particulier » nommé", (() => { const m = manquesPourEmission({ ...b2c, operation_category: "mixed" }); return mixte(m) && m.some((x) => /particulier/.test(x)); })());
verifier("international mixte : bloquée, « étranger » nommé", (() => { const m = manquesPourEmission({ ...intl, operation_category: "mixed" }); return mixte(m) && m.some((x) => /étranger/.test(x)); })());
verifier("B2C services : pas de blocage « mixte »", !mixte(manquesPourEmission({ ...b2c, operation_category: "services" })));
verifier("international biens : pas de blocage « mixte »", !mixte(manquesPourEmission({ ...intl, operation_category: "goods" })));

// ── Panneau de conformité (même règle) ─────────────────────────────────────
console.log("\n── Panneau de conformité");
const panneau = (o: { isB2C?: boolean; isInternational?: boolean }) =>
  checkInvoiceCompliance({ sellerSiren: "315143296", sellerAddress: "12 rue des Arts, 33000 Bordeaux", sellerVatNumber: "FR40315143296",
    clientSiren: "315143296", clientAddress: "Avenue de la République, 37170 Chambray", isFranchise: false, operationCategory: "mixed", ...o })
    .find((i) => i.field === "operation_category");
verifier("B2B : signalée, NON bloquante (conseil de deux factures)", panneau({})?.blocking === false && /une facture par nature/.test(panneau({})?.label ?? ""), JSON.stringify(panneau({})));
verifier("B2C : bloquante", panneau({ isB2C: true })?.blocking === true);
verifier("international : bloquante", panneau({ isInternational: true })?.blocking === true);

// ── fr:212 : ce qui est déclaré encaissé ───────────────────────────────────
console.log("\n── fr:212 : montants déclarés");
const essai = {
  operation_category: "mixed", tva_rate: 20, total_ttc: 1200,
  items: [
    { total: 600, tva_rate: 20, nature: "goods" as const },
    { total: 400, tva_rate: 20, nature: "services" as const },
  ],
};
const b1 = blocsMen(essai, "2026-11-20");
verifier("mixte, payée le 20/11 : un bloc de 480,00 € (prestations seules), daté", b1.length === 1 && b1[0].amount === "480.00" && b1[0].value_percent === "20.00" && b1[0].date === "2026-11-20", JSON.stringify(b1));
const b2 = blocsMen(essai, null);
verifier("mixte sans date : le bloc part quand même (480,00 €, sans date)", b2.length === 1 && b2[0].amount === "480.00" && !("date" in b2[0]), JSON.stringify(b2));
const multi = blocsMen({ operation_category: "mixed", tva_rate: 20, total_ttc: 1000, items: [
  { total: 500, tva_rate: 20, nature: "goods" }, { total: 200, tva_rate: 20, nature: "services" }, { total: 100, tva_rate: 10, nature: "services" },
] }, "2026-11-20");
verifier("mixte multi-taux : un bloc par taux des prestations (240,00 à 20 %, 110,00 à 10 %)",
  multi.length === 2 && multi.some((b) => b.value_percent === "20.00" && b.amount === "240.00") && multi.some((b) => b.value_percent === "10.00" && b.amount === "110.00"), JSON.stringify(multi));
verifier("mixte : une ligne sans nature compte comme prestation (lecture historique)",
  lignesEncaissables({ operation_category: "mixed", items: [{ total: 1 }, { total: 2, nature: "goods" }] }).length === 1);
verifier("services sans date : corps minimal inchangé (aucun bloc)", blocsMen({ ...essai, operation_category: "services" }, null).length === 0);
const s = blocsMen({ ...essai, operation_category: "services" }, "2026-11-20");
verifier("services datée : toute la facture (1 200,00 €), comme avant", s.length === 1 && s[0].amount === "1200.00", JSON.stringify(s));

// ── La route d'encaissement utilise bien cette règle ───────────────────────
console.log("\n── Câblage");
const enc = readFileSync("lib/superpdp-encaissement.ts", "utf8");
verifier("superpdp-encaissement lit operation_category", /select\([^)]*operation_category/.test(enc));
verifier("superpdp-encaissement calcule ses blocs par lib/encaissement-men", /from "@\/lib\/encaissement-men"/.test(enc) && /blocsMen_\(/.test(enc));
const page = readFileSync("app/(dashboard)/invoices/new/page.tsx", "utf8");
verifier("écran nouvelle facture : l'ancien « ne traite pas encore » a disparu", !/ne traite pas encore les factures qui mélangent/.test(page));
verifier("écran nouvelle facture : le message distingue particulier / étranger / entreprise", /data-mixte=/.test(page) && /estFrance\(clientCountry\)/.test(page));

console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
