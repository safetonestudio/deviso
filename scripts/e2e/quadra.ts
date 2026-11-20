/**
 * Export Quadra ASCII et choix du logiciel (20/11/2026), jugés sur le fichier
 * produit, position par position, contre la fiche Cegid KB0014530 (table dans
 * docs/reference/formats-import-logiciels.md).
 *
 * Lancer : npx -y tsx scripts/e2e/quadra.ts
 */
import { verifier, bilan } from "./lib.mjs";

(async () => {
  const { genererQuadra, compteQuadra, auxiliaireQuadra, nomPieceQuadra } = await import("@/lib/export-quadra");
  const { ecrituresComptables } = await import("@/lib/exports-comptables");
  const { LOGICIELS, FORMATS, formatDuLogiciel, logicielConnu } = await import("@/lib/logiciels-comptables");
  const ligne = (pu: number, taux: number) => ({ description: "x", quantity: 1, unit_price: pu, total: pu, tva_rate: taux });
  const base = { tva_rate: 20, client_siren: "552100554", client_company: "Mairie de Sète" };
  const factures = [
    { ...base, invoice_number: "F-2026-001", issue_date: "2026-03-10", status: "paid", paid_at: "2026-04-02", total_ht: 1000, total_ttc: 1200, items: [ligne(1000, 20)], operation_category: "services" },
    { ...base, invoice_number: "F-2026-002", issue_date: "2026-03-05", status: "sent", total_ht: 500, total_ttc: 600, items: [ligne(500, 20)], operation_category: "goods" },
    { ...base, client_siren: null, client_company: "Particulier", invoice_number: "F-2026-003", issue_date: "2026-05-01", status: "sent", total_ht: 100, total_ttc: 120, items: [ligne(100, 20)], operation_category: "services" },
  ];
  const pieces = new Map([["F-2026-001", nomPieceQuadra(0)], ["F-2026-002", nomPieceQuadra(1)], ["F-2026-003", nomPieceQuadra(2)]]);
  const txt = genererQuadra(factures as never, { pieces });
  const lignes = txt.split("\r\n").filter(Boolean);
  const M = lignes.filter((l) => l[0] === "M");
  const C = lignes.filter((l) => l[0] === "C");
  const champ = (l: string, pos: number, long: number) => l.slice(pos - 1, pos - 1 + long);

  console.log("── Forme du fichier ───────────────────────────────────────────");
  verifier("fin de ligne CRLF, rien d'autre", !/\r(?!\n)|(?<!\r)\n/.test(txt));
  verifier("uniquement de l'ASCII imprimable (accents retirés)", lignes.every((l) => /^[\x20-\x7E]*$/.test(l)));
  verifier("les comptes (C) précèdent toutes les écritures (M)", lignes.findIndex((l) => l[0] === "M") > lignes.map((l) => l[0]).lastIndexOf("C"));
  verifier("chaque enregistrement M fait 251 caractères", M.length > 0 && M.every((l) => l.length === 251), String(M.map((l) => l.length)));
  const nbLignesFec = ecrituresComptables(factures as never).reduce((n, e) => n + e.lignes.length, 0);
  verifier("autant de lignes M que de lignes d'écriture du FEC", M.length === nbLignesFec, `${M.length} / ${nbLignesFec}`);

  console.log("── Enregistrement M, positions de la fiche Cegid ──────────────");
  const vente = M.find((l) => champ(l, 232, 20).trim() === "F-2026-001" && champ(l, 10, 2) === "VT" && champ(l, 42, 1) === "D")!;
  verifier("trouvée : la ligne client de la facture F-2026-001", !!vente);
  if (vente) {
    verifier("1 : type M", champ(vente, 1, 1) === "M");
    verifier("2 sur 8 : compte auxiliaire du client, tiré du SIREN", champ(vente, 2, 8) === auxiliaireQuadra("552100554", ""), champ(vente, 2, 8));
    verifier("10 sur 2 : journal", champ(vente, 10, 2) === "VT");
    verifier("12 sur 3 : folio 000", champ(vente, 12, 3) === "000");
    verifier("15 sur 6 : date JJMMAA", champ(vente, 15, 6) === "100326", champ(vente, 15, 6));
    verifier("42 : sens D", champ(vente, 42, 1) === "D");
    verifier("43 sur 13 : montant en centimes signé (1 200,00 = +000000120000)", champ(vente, 43, 13) === "+000000120000", champ(vente, 43, 13));
    verifier("70 sur 2 : code de lettrage", /^[A-Z]{2}$/.test(champ(vente, 70, 2)), champ(vente, 70, 2));
    verifier("108 sur 3 : devise EUR", champ(vente, 108, 3) === "EUR");
    verifier("111 sur 3 : journal sur 3", champ(vente, 111, 3) === "VT ");
    verifier("117 sur 30 : libellé, sans accent", champ(vente, 117, 30).trim() === "Facture F-2026-001 MAIRIE DE SE".trim() || /^Facture F-2026-001/.test(champ(vente, 117, 30)), champ(vente, 117, 30));
    verifier("182 sur 12 : pièce jointe au format 8.3", champ(vente, 182, 12) === "P0000001.pdf", champ(vente, 182, 12));
    verifier("232 sur 20 : numéro de pièce", champ(vente, 232, 20).trim() === "F-2026-001");
  }
  const reglement = M.filter((l) => champ(l, 232, 20).trim() === "F-2026-001" && champ(l, 10, 2) === "BQ");
  verifier("règlement : pas de pièce jointe (le PDF est sur la vente)", reglement.length > 0 && reglement.every((l) => champ(l, 182, 12).trim() === ""));
  const lettreClient = reglement.find((l) => champ(l, 2, 8) === champ(vente, 2, 8));
  verifier("lettrage : le règlement porte la même lettre que la facture", !!lettreClient && champ(lettreClient, 70, 2) === champ(vente, 70, 2));
  verifier("comptes généraux sur 8 (512000 -> 51200000)", reglement.some((l) => champ(l, 2, 8) === "51200000"));
  verifier("bien vendu : 707 sur 8", M.some((l) => champ(l, 232, 20).trim() === "F-2026-002" && champ(l, 2, 8) === "70700000"));

  console.log("── Équilibre ──────────────────────────────────────────────────");
  const parPiece = new Map<string, number>();
  for (const l of M) {
    const cle = `${champ(l, 10, 2)}|${champ(l, 232, 20)}`;
    const m = Number(champ(l, 44, 12)) * (champ(l, 42, 1) === "D" ? 1 : -1);
    parPiece.set(cle, (parPiece.get(cle) ?? 0) + m);
  }
  verifier("chaque pièce est équilibrée, au centime", [...parPiece.values()].every((v) => v === 0), JSON.stringify([...parPiece]));

  console.log("── Comptes clients (enregistrement C) ─────────────────────────");
  verifier("un compte C par client (deux clients)", C.length === 2, String(C.length));
  verifier("99 sur 8 : collectif clients 41100000", C.every((l) => champ(l, 99, 8) === "41100000"));
  verifier("218 : type de compte C (client)", C.every((l) => champ(l, 218, 1) === "C"));
  verifier("217 à blanc : un compte existant n'est jamais modifié", C.every((l) => champ(l, 217, 1) === " "));
  verifier("10 sur 30 : nom du client, sans accent", C.some((l) => champ(l, 10, 30).trim() === "MAIRIE DE SETE"), C.map((l) => champ(l, 10, 30)).join("|"));
  verifier("sans SIREN : code de repli sur 8 au plus", C.some((l) => /^C\d{5}\s*$/.test(champ(l, 2, 8))));

  console.log("── Codes ──────────────────────────────────────────────────────");
  verifier("compte complété à 8 par des zéros", compteQuadra("411") === "41100000" && compteQuadra("4110000") === "41100000");
  const codes = new Set(["000000001", "552100554", "999999999", "123456789", "123456788"].map((s) => auxiliaireQuadra(s, "")));
  verifier("auxiliaire : 8 caractères, un code distinct par SIREN", codes.size === 5 && [...codes].every((c) => c.length === 8));
  verifier("auxiliaire stable si le nom change (même SIREN, même code)", auxiliaireQuadra("552 100 554", "A") === auxiliaireQuadra("552100554", "B"));

  console.log("── Logiciels proposés ─────────────────────────────────────────");
  verifier("identifiants uniques", new Set(LOGICIELS.map((l) => l.id)).size === LOGICIELS.length);
  verifier("chaque logiciel livre un format produit par Deviso", LOGICIELS.every((l) => l.format in FORMATS));
  verifier("Quadra reçoit le format Quadra, les autres le FEC", formatDuLogiciel("quadra") === "quadra" && formatDuLogiciel("pennylane") === "fec" && formatDuLogiciel(null) === "fec");
  verifier("contre-épreuve : un logiciel inconnu est refusé", !logicielConnu("tra_cegid") && !logicielConnu(42) && logicielConnu("acd"));
  const cadratin = String.fromCharCode(0x2014);
  verifier("aucun tiret cadratin dans les consignes", LOGICIELS.every((l) => !l.consigne.includes(cadratin)));

  bilan();
})();
