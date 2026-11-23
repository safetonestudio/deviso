/**
 * Cadre de facturation (BT-23), la règle et le document qui part.
 *
 * Jusqu'au 23/11/2026, `B1` (bien) était écrit en dur : les prestations de
 * services ressortaient en `TLB1` dans l'e-reporting au lieu de `TPS1`.
 * Règle et sources : lib/cadre-facturation.ts (DGFiP v3.2, annexes 1, 6, 7).
 *
 * Trois étages :
 *   1. la règle seule, chaque combinaison → le code attendu ;
 *   2. le XML réellement produit par lib/invoice-xml.ts, et la déclaration
 *      d'un achat à l'étranger (lib/superpdp-achats.ts) ;
 *   3. le validateur officiel (POST /validation_reports, public, sans jeton :
 *      aucun compte n'est touché) accepte chaque code produit, et refuse un
 *      code hors de la liste G1.02 (contre-épreuve).
 *
 * Lancer : npx -y tsx scripts/e2e/cadre-facturation.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { verifier, bilan } from "./lib.mjs";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const VALIDATEUR = "https://api.superpdp.tech/v1.beta/validation_reports";

async function valider(xml: string, nom: string) {
  const fd = new FormData();
  fd.append("file", new Blob([xml], { type: "application/xml" }), `${nom}.xml`);
  const r = await fetch(VALIDATEUR, { method: "POST", body: fd });
  const d = await r.json().catch(() => ({}));
  const rapport = d?.data?.[0];
  const erreurs = JSON.stringify(rapport ?? d).match(/"(message|description)":"[^"]{0,220}"/g)?.slice(0, 4) ?? [];
  return { valide: rapport?.is_valid === true, refuse: rapport?.is_valid === false, detail: `HTTP ${r.status} ${erreurs.join(" | ") || JSON.stringify(rapport ?? d).slice(0, 300)}` };
}

(async () => {
  const { cadreFacturation } = await import("@/lib/cadre-facturation");
  const X = await import("@/lib/invoice-xml");

  console.log("── 1. La règle ────────────────────────────────────────────────");
  const cas: [string, Parameters<typeof cadreFacturation>[0], string][] = [
    ["services, facture simple", { categorie: "services", typeFacture: "standard", typeCode: "380" }, "S1"],
    ["biens, facture simple", { categorie: "goods", typeFacture: "standard", typeCode: "380" }, "B1"],
    ["mixte, facture simple", { categorie: "mixed", typeFacture: "standard", typeCode: "380" }, "M1"],
    ["catégorie absente = services (défaut en base, comme le FEC)", { categorie: null }, "S1"],
    ["services, solde qui renvoie à l'acompte", { categorie: "services", typeFacture: "solde", typeCode: "380", renvoieAcompte: true }, "S4"],
    ["biens, solde qui renvoie à l'acompte", { categorie: "goods", typeFacture: "solde", typeCode: "380", renvoieAcompte: true }, "B4"],
    ["mixte, solde qui renvoie à l'acompte", { categorie: "mixed", typeFacture: "solde", renvoieAcompte: true }, "M4"],
    ["solde SANS référence à l'acompte : rien n'établit le 4", { categorie: "services", typeFacture: "solde", renvoieAcompte: false }, "S1"],
    ["facture d'acompte (386)", { categorie: "services", typeFacture: "acompte", typeCode: "386" }, "S1"],
    ["facture d'acompte de biens", { categorie: "goods", typeFacture: "acompte", typeCode: "386" }, "B1"],
    ["G1.60 : un 386 marqué solde ne prend jamais le 4", { categorie: "services", typeFacture: "solde", typeCode: "386", renvoieAcompte: true }, "S1"],
    ["G1.60 : un 503 ne prend jamais le 4", { categorie: "goods", typeFacture: "solde", typeCode: "503", renvoieAcompte: true }, "B1"],
    ["avoir (381) : chiffre 1", { categorie: "services", typeFacture: "avoir", typeCode: "381" }, "S1"],
    ["avoir de biens", { categorie: "goods", typeFacture: "avoir", typeCode: "381" }, "B1"],
    ["avoir repéré par son seul type 381, même marqué solde", { categorie: "services", typeFacture: "solde", typeCode: 381, renvoieAcompte: true }, "S1"],
  ];
  for (const [nom, entree, attendu] of cas) {
    const obtenu = cadreFacturation(entree);
    verifier(`${nom} → ${attendu}`, obtenu === attendu, `obtenu ${obtenu}`);
  }
  // Contre-épreuve : les entrées comptent vraiment (sinon un `return "S1"`
  // passerait la moitié des cas ci-dessus).
  verifier(
    "contre-épreuve : changer la seule catégorie change le code",
    cadreFacturation({ categorie: "services" }) !== cadreFacturation({ categorie: "goods" }),
  );
  verifier(
    "contre-épreuve : la seule référence à l'acompte change le code d'un solde",
    cadreFacturation({ categorie: "services", typeFacture: "solde", renvoieAcompte: false }) !==
      cadreFacturation({ categorie: "services", typeFacture: "solde", renvoieAcompte: true }),
  );
  const tous = new Set(cas.map(([, e]) => cadreFacturation(e)));
  const G102 = ["B1", "S1", "M1", "B2", "S2", "M2", "B4", "S4", "M4", "S5", "S6", "B7", "S7"];
  verifier("tous les codes produits sont dans la liste G1.02", [...tous].every((c) => G102.includes(c)), [...tous].join(","));

  console.log("── 2. Le document produit ─────────────────────────────────────");
  const base = {
    id: "test", user_id: "test", invoice_number: "FAC-2026-901", status: "sent", invoice_type: "standard", type_code: "380",
    issue_date: "2026-11-20", due_date: "2026-12-20", payment_terms: "30 jours net", operation_category: "services",
    payment_on_debit: false,
    seller_company: "Atelier Test", seller_siren: "552100554", seller_street: "1 rue de la Paix", seller_postcode: "75002",
    seller_city: "Paris", seller_tva_number: "FR40552100554",
    client_name: "Client Test", client_company: "Client Test", client_siren: "542065479",
    client_street: "2 avenue de l'Opéra", client_postcode: "75001", client_city: "Paris", client_country: "FR",
    client_email: "compta@client-test.fr",
    items: [{ id: "1", description: "Prestation de conseil", quantity: 1, unit: "forfait", unit_price: 500, total: 500 }],
    total_ht: 500, tva_rate: 20, total_ttc: 600,
  };
  const cadreDe = (xml: string) =>
    xml.match(/<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>([^<]*)<\/ram:ID>/)?.[1] ?? null;
  const doc = (extra: Record<string, unknown>, lie: string | null = null) =>
    X.generateFacturXml({ ...base, ...extra } as never, lie, undefined, undefined, undefined, undefined, lie ? "2026-10-20" : null);

  const documents: [string, string, string][] = [
    ["services", doc({}), "S1"],
    ["biens", doc({ operation_category: "goods", items: [{ id: "1", description: "Cartons d'emballage", quantity: 40, unit: "unité", unit_price: 12.5, total: 500 }] }), "B1"],
    ["services déjà payée (reste S1, voir BR-FR-CO-09)", doc({ status: "paid" }), "S1"],
    ["biens déjà payée (reste B1)", doc({ operation_category: "goods", status: "paid" }), "B1"],
    ["solde de services avec son acompte", doc({ invoice_type: "solde" }, "FAC-2026-900"), "S4"],
    ["solde de biens avec son acompte", doc({ invoice_type: "solde", operation_category: "goods" }, "FAC-2026-900"), "B4"],
    ["acompte de services", doc({ invoice_type: "acompte", type_code: "386" }), "S1"],
  ];
  for (const [nom, xml, attendu] of documents) {
    verifier(`XML « ${nom} » : BT-23 = ${attendu}`, cadreDe(xml) === attendu, `obtenu ${cadreDe(xml)}`);
  }
  verifier("contre-épreuve : plus aucun B1 écrit en dur sur une facture de services", cadreDe(doc({})) !== "B1");
  verifier("solde sans acompte lié : BT-25 absent, donc pas de 4", cadreDe(doc({ invoice_type: "solde" })) === "S1");

  // Déclaration d'un achat à l'étranger (flux 10.1, TT-28).
  const A = await import("@/lib/superpdp-achats");
  const achat = {
    id: "00000000-0000-0000-0000-000000000001", numero: "INV-42", date_facture: "2026-11-10", devise: "EUR",
    fournisseur_pays: "DE", fournisseur_tva: "DE123456789", montant_ht: 100, montant_tva: 0, taux_tva: 0,
    tva_facturee: "aucune" as const,
  };
  const nous = { number: "552100554", scheme_id: "0002", country: "FR", vat: "FR40552100554" };
  const idAchat = (extra: Record<string, unknown>) =>
    (A.construirePayloadB2bint({ ...achat, ...extra } as never, nous, "9930").data[0] as { business_process: { id: string } }).business_process.id;
  verifier("achat de services à l'étranger : TT-28 = S1", idAchat({ categorie: "services" }) === "S1", idAchat({ categorie: "services" }));
  verifier("achat de biens à l'étranger : TT-28 = B1", idAchat({ categorie: "biens" }) === "B1", idAchat({ categorie: "biens" }));
  verifier("avoir d'un fournisseur de services : S1", idAchat({ categorie: "services", est_avoir: true }) === "S1");

  console.log("── 3. Le validateur officiel ──────────────────────────────────");
  for (const [nom, xml, attendu] of documents) {
    const v = await valider(xml, nom.replace(/\W+/g, "-"));
    verifier(`validateur officiel : « ${nom} » (${attendu}) conforme`, v.valide, v.detail);
  }
  // Pourquoi « déjà payée » n'est pas produit : le validateur exige alors un
  // net à payer nul (BR-FR-CO-09), et Deviso écrit le net à payer égal au TTC.
  // Si un jour ce refus disparaît, ce test le dira, et le choix sera à revoir.
  const s2 = doc({ status: "paid" }).replace(/(<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>)[^<]*/, "$1S2");
  const v2 = await valider(s2, "cadre-s2");
  verifier("S2 avec un net à payer non nul est refusé (BR-FR-CO-09), d'où le chiffre 1", v2.refuse && /BR-FR-CO-09/.test(v2.detail), v2.detail);

  const faux = doc({}).replace(/(<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>)[^<]*/, "$1Z9");
  const vf = await valider(faux, "cadre-hors-liste");
  verifier("contre-épreuve : un cadre hors de la liste G1.02 (Z9) est refusé", vf.refuse, vf.detail);
  verifier("le refus du Z9 porte bien sur BT-23", /BT-23|G1\.02|cadre/i.test(vf.detail), vf.detail);

  bilan();
})();
