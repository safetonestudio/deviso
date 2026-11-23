/**
 * Identifiant du fournisseur étranger dans l'e-reporting d'achat (23/11/2026).
 *
 * Règle G2.19 de l'annexe 7 des spécifications externes DGFiP v3.2 (et TT-33-1
 * de l'annexe 6) : le vendeur est identifié sous 0002 (SIREN), 0223 (n° de TVA
 * intracommunautaire, UE hors France, 18 caractères au plus) ou 0227 (hors UE :
 * code pays + 16 premiers caractères de la raison sociale, 18 au plus). 9999 et
 * les codes EAS Peppol par pays (9930, 9957...) n'y figurent pas.
 *
 * Test unitaire, sans réseau : identiteVendeur et le corps envoyé à la
 * Plateforme Agréée (construirePayloadB2bint), plus la reconnaissance d'une
 * déclaration déjà envoyée sous l'ancienne forme (rapprocherDeclaration).
 *
 * Usage : npx tsx scripts/e2e/identite-vendeur.ts
 */
import { verifier, bilan } from "./lib.mjs";

async function main() {
  const { identiteVendeur, construirePayloadB2bint, rapprocherDeclaration, SCHEMA_HORS_UE, SCHEMA_UE_HORS_FRANCE, SCHEMA_SIREN } =
    await import("@/lib/superpdp-achats");

  const ok = (r: ReturnType<typeof identiteVendeur>) => (r.ok ? r : null);

  console.log("\n── Les codes eux-mêmes ───────────────────────────────────────");
  verifier("0227 = HORS_UE, 0223 = UE_HORS_FRANCE, 0002 = SIREN", SCHEMA_HORS_UE === "0227" && SCHEMA_UE_HORS_FRANCE === "0223" && SCHEMA_SIREN === "0002");

  console.log("\n── Pays tiers : 0227, code pays + 16 caractères de la raison sociale ──");
  const us = ok(identiteVendeur("US", null, "Cloud Inc"));
  verifier("fournisseur américain sans identifiant : 0227, « USCloud Inc »", us?.scheme_id === "0227" && us.company_id === "USCloud Inc", JSON.stringify(us));
  verifier("hors UE : aucun n° de TVA présenté (TT-34 absent)", us?.tva === null);
  const usId = ok(identiteVendeur("US", "98-7654321", "Cloud Inc"));
  verifier("un identifiant fiscal local saisi n'entre pas dans l'identifiant", usId?.company_id === "USCloud Inc" && usId.tva === null, JSON.stringify(usId));
  const ch = ok(identiteVendeur("ch", "CHE-123.456.789", "Zürich Versicherungs-Gesellschaft AG"));
  verifier("raison sociale longue : tronquée aux 16 premiers caractères (« CHZürich Versicher »)", ch?.company_id === "CHZürich Versicher", JSON.stringify(ch));
  verifier("identifiant tronqué : 18 caractères exactement", ch ? Array.from(ch.company_id).length === 18 : false);
  verifier("code pays en minuscules : remis en majuscules (code ISO)", ch?.company_id.startsWith("CH") === true);
  const espaces = ok(identiteVendeur("GB", null, "   Acme   Ltd  "));
  verifier("espaces de début et de fin retirés, espaces intérieurs et casse conservés", espaces?.company_id === "GBAcme   Ltd", JSON.stringify(espaces));
  const court = ok(identiteVendeur("JP", null, "ABCDEFGHIJKLMNOP"));
  verifier("raison sociale de 16 caractères pile : reprise entière", court?.company_id === "JPABCDEFGHIJKLMNOP");
  const accents = ok(identiteVendeur("MA", null, "Société Générale Marocaine"));
  verifier("une lettre accentuée compte pour un caractère", accents ? Array.from(accents.company_id).length === 18 && accents.company_id === "MASociété Générale" : false, JSON.stringify(accents));
  const wf = ok(identiteVendeur("WF", null, "Pêcherie de Mata-Utu"));
  verifier("Wallis-et-Futuna relève de 0227 (« dont Wallis et Futuna »)", wf?.scheme_id === "0227");
  const sansNom = identiteVendeur("US", null, "  ");
  verifier("hors UE sans raison sociale : non construit, en attente", !sansNom.ok && sansNom.detail === "identite_incomplete");

  console.log("\n── Union européenne : 0223, n° de TVA intracommunautaire ─────");
  const de = ok(identiteVendeur("DE", "de 811 569 869", "Kreativ GmbH"));
  verifier("n° allemand : 0223, majuscules sans espaces", de?.scheme_id === "0223" && de.company_id === "DE811569869" && de.tva === "DE811569869", JSON.stringify(de));
  const dk = ok(identiteVendeur("DK", "DK12345678", "Hygge ApS"));
  verifier("Danemark (ancien trou de la table EAS) : 0223 aussi", dk?.scheme_id === "0223" && dk.company_id === "DK12345678");
  const gr = ok(identiteVendeur("GR", "EL094259216", "Olympos AE"));
  verifier("Grèce : préfixe EL, 0223", gr?.scheme_id === "0223" && gr.company_id === "EL094259216");
  const sansPrefixe = ok(identiteVendeur("GR", "094259216", "Olympos AE"));
  verifier("n° saisi sans préfixe : préfixe du pays ajouté (EL pour la Grèce)", sansPrefixe?.company_id === "EL094259216", JSON.stringify(sansPrefixe));
  const at = ok(identiteVendeur("AT", "U12345678", "Wiener AG"));
  verifier("Autriche sans préfixe (U...) : ATU12345678", at?.company_id === "ATU12345678", JSON.stringify(at));
  const ieAuxUs = ok(identiteVendeur("US", "IE6388047V", "Big Tech Inc"));
  verifier("fournisseur établi hors UE avec un n° irlandais : 0223 sur ce n° (l'État qui l'a attribué)", ieAuxUs?.scheme_id === "0223" && ieAuxUs.company_id === "IE6388047V");
  const sansTva = identiteVendeur("PL", null, "Polska Sp. z o.o.");
  verifier("fournisseur de l'UE sans n° de TVA : non construit, en attente", !sansTva.ok && sansTva.detail === "tva_absente");
  const mauvaisPrefixe = identiteVendeur("DE", "GB123456789", "Mixed GmbH");
  verifier("fournisseur de l'UE avec un n° d'un autre préfixe : refusé, pas maquillé en « DEGB... »", !mauvaisPrefixe.ok && mauvaisPrefixe.detail === "tva_invalide");
  const tropLong = identiteVendeur("NL", "NL1234567890123456789", "Lang BV");
  verifier("n° de plus de 18 caractères : refusé", !tropLong.ok && tropLong.detail === "tva_invalide");

  console.log("\n── n° de TVA française : 0002, SIREN (G1.65) ─────────────────");
  const fr = ok(identiteVendeur("DE", "FR40303265045", "Messe GmbH"));
  verifier("fournisseur allemand immatriculé en France : 0002 + SIREN, TVA en TT-34", fr?.scheme_id === "0002" && fr.company_id === "303265045" && fr.tva === "FR40303265045", JSON.stringify(fr));
  const frIllisible = identiteVendeur("DE", "FR4030326", "Messe GmbH");
  verifier("n° français illisible : refusé", !frIllisible.ok && frIllisible.detail === "tva_invalide");

  console.log("\n── Contre-épreuve : aucun ancien code ne sort plus ──────────");
  const cas: [string, string | null, string][] = [
    ["US", null, "A"], ["US", "98-7654321", "A"], ["CH", "CHE123", "A"], ["GB", "GB123456789", "A"], ["DE", "DE811569869", "A"],
    ["DK", "DK12345678", "A"], ["FI", "FI12345678", "A"], ["SI", "SI12345678", "A"], ["SE", "SE123456789001", "A"],
    ["IT", "IT12345678901", "A"], ["ES", "ESX1234567X", "A"], ["DE", "FR40303265045", "A"], ["WF", null, "A"],
  ];
  const schemas = new Set(cas.map(([p, t, n]) => identiteVendeur(p, t, n)).flatMap((r) => (r.ok ? [r.scheme_id] : [])));
  verifier("seuls 0002, 0223 et 0227 sortent (jamais 9999 ni un code EAS 99xx / 0211)", [...schemas].every((s) => ["0002", "0223", "0227"].includes(s)) && schemas.size === 3, [...schemas].join(","));
  verifier("tous les identifiants tiennent en 18 caractères", cas.map(([p, t, n]) => identiteVendeur(p, t, n)).every((r) => !r.ok || Array.from(r.company_id).length <= 18));

  console.log("\n── Corps envoyé à la Plateforme Agréée ───────────────────────");
  const nous = { number: "552100554", scheme_id: "0002", country: "FR", vat: "FR61552100554" };
  const achat = { fournisseur_pays: "US", fournisseur_tva: null, numero: "INV-1", date_facture: "2026-11-02", devise: "USD", montant_ht: 300, montant_tva: 0, taux_tva: 0, tva_facturee: "aucune" as const, categorie: "services", id: "00000000-0000-0000-0000-000000000000" };
  const sHorsUe = construirePayloadB2bint(achat, nous, us!).data[0].seller as Record<string, unknown>;
  verifier("hors UE : seller 0227 sans tax_registration_id", sHorsUe.company_id_scheme_id === "0227" && sHorsUe.company_id === "USCloud Inc" && !("tax_registration_id" in sHorsUe), JSON.stringify(sHorsUe));
  const sUe = construirePayloadB2bint({ ...achat, fournisseur_pays: "DE", fournisseur_tva: "DE811569869" }, nous, de!).data[0].seller as Record<string, unknown>;
  verifier("UE : seller 0223 avec son n° de TVA (G2.33)", sUe.company_id_scheme_id === "0223" && sUe.company_id === "DE811569869" && sUe.tax_registration_id === "DE811569869", JSON.stringify(sUe));
  const sFr = construirePayloadB2bint({ ...achat, fournisseur_pays: "DE", fournisseur_tva: "FR40303265045" }, nous, fr!).data[0].seller as Record<string, unknown>;
  verifier("TVA française : seller 0002 (SIREN) avec son n° de TVA (G2.33)", sFr.company_id_scheme_id === "0002" && sFr.company_id === "303265045" && sFr.tax_registration_id === "FR40303265045", JSON.stringify(sFr));

  console.log("\n── Doublons : une déclaration déjà envoyée reste reconnue ────");
  const decl = (seller: Record<string, unknown>) => ({ id: 7, number: "INV-1", direction: "in", issue_date: "2026-11-02", seller, total: { tax_exclusive_amount: "300.00" } });
  const a = { numero: "INV-1", id: "x", fournisseur_tva: "98-7654321", fournisseur_pays: "US", fournisseur_nom: "Cloud Inc", date_facture: "2026-11-02", montant_ht: 300 };
  verifier("envoyée sous 0227 (nouvelle forme) : identique", rapprocherDeclaration([decl({ company_id: "USCloud Inc" })], a).etat === "identique");
  verifier("envoyée sous 9999 avec l'identifiant fiscal (ancienne forme) : identique", rapprocherDeclaration([decl({ company_id: "98-7654321" })], a).etat === "identique");
  verifier("même numéro chez un autre fournisseur hors UE : absent", rapprocherDeclaration([decl({ company_id: "USOther Corp" })], a).etat === "absent");
  const aSansPrefixe = { ...a, fournisseur_tva: "094259216", fournisseur_pays: "GR", fournisseur_nom: "Olympos AE" };
  verifier("UE saisi sans préfixe, déclaré avec : identique", rapprocherDeclaration([decl({ company_id: "EL094259216" })], aSansPrefixe).etat === "identique");

  process.exit(bilan());
}
main().catch((e) => { console.error(e); process.exit(1); });
