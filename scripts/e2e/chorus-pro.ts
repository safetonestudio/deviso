/**
 * Chorus Pro, ce qui se vérifie sans PISTE (20/11/2026).
 *
 * Le dépôt lui-même ne se prouve qu'en bac à sable (CHORUS_PRO_SANDBOX=true),
 * voir lib/chorus-pro.ts. Ici :
 *   1. le mot de passe du compte technique est chiffré, relisible, et un
 *      chiffré altéré est refusé (contre-épreuve) ;
 *   2. le destinataire public exige un SIRET de 14 chiffres, un SIREN est refusé ;
 *   3. le Factur-X déposé désigne l'administration par son SIRET (schéma 0009),
 *      celui de la Plateforme Agréée reste inchangé (SIREN, 0002) ;
 *   4. ce Factur-X « Chorus » passe le validateur officiel (EN 16931 + règles FR).
 *
 * Lancer : npx -y tsx scripts/e2e/chorus-pro.ts (lit .env.local pour la clé).
 */
import { readFileSync } from "node:fs";
import { verifier, bilan } from "./lib.mjs";

for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

(async () => {
  const C = await import("@/lib/chorus-pro");
  const X = await import("@/lib/invoice-xml");

  console.log("── Mot de passe du compte technique ───────────────────────────");
  const chiffre = C.chiffrerMotDePasse("MotDePasse-Test#1");
  verifier("le mot de passe stocké n'est pas en clair", !chiffre.includes("MotDePasse-Test#1") && chiffre.startsWith("v1:"));
  verifier("il se relit à l'identique", C.dechiffrerMotDePasse(chiffre) === "MotDePasse-Test#1");
  verifier("deux chiffrements du même mot de passe diffèrent (IV aléatoire)", C.chiffrerMotDePasse("x") !== C.chiffrerMotDePasse("x"));
  verifier("une valeur ancienne, en clair, reste lisible", C.dechiffrerMotDePasse("ancien") === "ancien");
  const altere = chiffre.slice(0, -4) + (chiffre.endsWith("AAAA") ? "BBBB" : "AAAA");
  let refuse = false;
  try { C.dechiffrerMotDePasse(altere); } catch { refuse = true; }
  verifier("contre-épreuve : un chiffré altéré est refusé", refuse);
  verifier(
    "l'en-tête cpro-account porte login:mot de passe en base64",
    Buffer.from(C.enteteCompte("TECH_1", chiffre), "base64").toString() === "TECH_1:MotDePasse-Test#1",
  );

  console.log("── Destinataire public ────────────────────────────────────────");
  verifier("un SIRET de 14 chiffres est accepté (espaces tolérés)", C.siretDestinataire("217 500 016 00010") === "21750001600010");
  verifier("un SIREN de 9 chiffres est refusé", C.siretDestinataire("217500016") === null);
  verifier("un identifiant vide est refusé", C.siretDestinataire(null) === null);

  console.log("── Factur-X déposé ────────────────────────────────────────────");
  const facture = {
    id: "test", user_id: "test", invoice_number: "FAC-2026-900", status: "sent", invoice_type: "standard", type_code: "380",
    issue_date: "2026-11-20", due_date: "2026-12-20", payment_terms: "30 jours net", operation_category: "services",
    seller_company: "Atelier Test", seller_siren: "552100554", seller_street: "1 rue de la Paix", seller_postcode: "75002",
    seller_city: "Paris", seller_tva_number: "FR40552100554",
    client_name: "Mairie de Test", client_company: "Mairie de Test", client_siren: "21750001600010",
    client_street: "Place de l'Hôtel de Ville", client_postcode: "75004", client_city: "Paris", client_country: "FR",
    client_email: "compta@mairie-test.fr",
    items: [{ id: "1", description: "Prestation de conseil", quantity: 1, unit: "forfait", unit_price: 500, total: 500 }],
    total_ht: 500, tva_rate: 20, total_ttc: 600,
  } as never;
  const xmlChorus = X.generateFacturXml(facture, null, undefined, undefined, undefined, undefined, null, { siretDestinataire: "21750001600010" });
  const xmlPa = X.generateFacturXml(facture);
  const acheteur = (xml: string) => xml.slice(xml.indexOf("<ram:BuyerTradeParty>"), xml.indexOf("</ram:BuyerTradeParty>"));
  verifier("version Chorus : l'administration est désignée par son SIRET, schéma 0009", acheteur(xmlChorus).includes('schemeID="0009">21750001600010<'));
  verifier("version Chorus : plus de SIREN 0002 côté acheteur", !acheteur(xmlChorus).includes('schemeID="0002"'));
  verifier("version Plateforme Agréée inchangée : SIREN, schéma 0002", acheteur(xmlPa).includes('schemeID="0002">217500016<'));

  // Validateur officiel (le même que test:conformite).
  const fd = new FormData();
  fd.append("file", new Blob([xmlChorus], { type: "application/xml" }), "chorus.xml");
  const r = await fetch("https://api.superpdp.tech/v1.beta/validation_reports", { method: "POST", body: fd });
  const d = await r.json().catch(() => ({}));
  const rapport = d?.data?.[0];
  const erreurs = JSON.stringify(rapport ?? d).match(/"(message|description)":"[^"]{0,200}"/g)?.slice(0, 5) ?? [];
  verifier("le Factur-X « Chorus » passe le validateur officiel", rapport?.is_valid === true, `HTTP ${r.status} ${erreurs.join(" | ") || JSON.stringify(rapport ?? d).slice(0, 300)}`);

  bilan();
})();
