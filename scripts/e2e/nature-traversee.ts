/**
 * Nature biens / prestations, traversée de bout en bout (23/11/2026).
 *
 * Le chemin qu'un utilisateur emprunte, sur un compte DÉMO, par les routes de
 * l'écran : offre du catalogue (avec sa nature) → ligne de devis → facture
 * convertie depuis le devis, SANS catégorie envoyée (la route la déduit) →
 * relecture → PDF Factur-X téléchargé, XML embarqué extrait (BT-23) → FEC
 * client → livre des recettes (écran CSV). Quatre cas : prestations seules,
 * biens seuls, mixte, ligne libre sans nature.
 *
 * Les factures sont datées de 2024 pour que le FEC et le livre de cette année
 * ne contiennent qu'elles (le jeu démo vit dans l'année courante).
 *
 * Lancer : npx -y tsx scripts/e2e/nature-traversee.ts
 *          (E2E_BASE_URL=http://localhost:3000 pour le code local)
 */
import { inflateSync } from "node:zlib";
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRawStream } from "pdf-lib";
import { openSession, verifier, bilan, BASE } from "./lib.mjs";

const doc = (o: unknown) => JSON.stringify(o);

async function xmlDuPdf(cookie: string, id: string): Promise<string> {
  const r = await fetch(`${BASE}/api/invoices/${id}/download`, { headers: { cookie } });
  if (!r.ok) return `HTTP ${r.status}`;
  const pdf = await PDFDocument.load(new Uint8Array(await r.arrayBuffer()), { updateMetadata: false });
  const names = pdf.catalog.lookup(PDFName.of("Names"), PDFDict);
  const ef = names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
  const arr = ef.lookup(PDFName.of("Names"), PDFArray);
  for (let i = 0; i < arr.size(); i += 2) {
    const spec = arr.lookup(i + 1, PDFDict);
    const flux = spec.lookup(PDFName.of("EF"), PDFDict).lookup(PDFName.of("F")) as PDFRawStream;
    const octets = flux.getContents();
    const filtre = String(flux.dict.get(PDFName.of("Filter")) ?? "");
    return Buffer.from(filtre.includes("FlateDecode") ? inflateSync(octets) : octets).toString("utf8");
  }
  return "";
}

(async () => {
  const s = await openSession("nature-traversee");
  console.log(`Base : ${BASE}`);

  console.log("── 1. Catalogue ───────────────────────────────────────────────");
  const sans = await s.call("/api/catalog", { method: "POST", body: doc({ name: "Offre sans nature", unit_price: 10, type: "fixed" }) });
  verifier("une offre sans nature est refusée (NATURE_REQUISE)", sans.status === 400 && sans.body?.error === "NATURE_REQUISE", `HTTP ${sans.status} ${JSON.stringify(sans.body)}`);
  const seance = await s.call("/api/catalog", { method: "POST", body: doc({ name: "Séance de traversée", unit: "forfait", unit_price: 700, type: "fixed", nature: "services" }) });
  const tirage = await s.call("/api/catalog", { method: "POST", body: doc({ name: "Tirage de traversée", unit: "pièce", unit_price: 100, type: "fixed", nature: "goods" }) });
  verifier("offre prestation créée avec sa nature", seance.status === 201 && seance.body?.item?.nature === "services", JSON.stringify(seance.body).slice(0, 160));
  verifier("offre bien créée avec sa nature", tirage.status === 201 && tirage.body?.item?.nature === "goods");
  const idT = tirage.body?.item?.id;
  const invalide = await s.call(`/api/catalog/${idT}`, { method: "PATCH", body: doc({ nature: "rien" }) });
  verifier("une nature invalide est refusée en modification", invalide.status === 400);
  const efface = await s.call(`/api/catalog/${idT}`, { method: "PATCH", body: doc({ nature: null }) });
  verifier("une nature ne s'efface pas", efface.status === 400);
  const relu = await s.call("/api/catalog");
  const offres = (relu.body?.items ?? []) as { id: string; name: string; nature: string | null; unit: string; unit_price: number }[];
  const oS = offres.find((o) => o.id === seance.body?.item?.id);
  const oB = offres.find((o) => o.id === idT);
  verifier("relecture du catalogue : les deux natures sont là", oS?.nature === "services" && oB?.nature === "goods");

  // Ligne telle que l'écran l'insère depuis une offre (insertCatalogItem).
  const depuisOffre = (o: typeof oS, q: number) => ({ description: o!.name, quantity: q, unit: o!.unit, unit_price: o!.unit_price, total: q * o!.unit_price, nature: o!.nature });
  const client = {
    client_name: "Client Nature", client_email: "nature@example.fr", client_company: "Client Nature SARL", client_siren: "552100554",
    client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
  };

  const cas: { nom: string; lignes: Record<string, unknown>[]; choix?: string; attendu: string; bt23: string; ht: number }[] = [
    { nom: "prestations seules", lignes: [depuisOffre(oS, 1)], attendu: "services", bt23: "S1", ht: 700 },
    { nom: "biens seuls", lignes: [depuisOffre(oB, 3)], attendu: "goods", bt23: "B1", ht: 300 },
    { nom: "mixte", lignes: [depuisOffre(oS, 1), depuisOffre(oB, 3)], attendu: "mixed", bt23: "M1", ht: 1000 },
    { nom: "ligne libre, nature choisie par l'utilisateur", lignes: [{ description: "Frais de déplacement", quantity: 1, unit: "forfait", unit_price: 50, total: 50, nature: "services" }], attendu: "services", bt23: "S1", ht: 50 },
    // Contre-épreuve de la décision du 23/11 : une catégorie envoyée qui
    // contredit les lignes est ignorée, jamais S1 sur une ligne de biens.
    { nom: "« services » envoyé sur des biens", lignes: [depuisOffre(oB, 2)], choix: "services", attendu: "goods", bt23: "B1", ht: 200 },
    { nom: "« services » envoyé sur une mixte", lignes: [depuisOffre(oS, 1), depuisOffre(oB, 1)], choix: "services", attendu: "mixed", bt23: "M1", ht: 800 },
  ];

  const factures: Record<string, { id: string; numero: string }> = {};
  for (const c of cas) {
    console.log(`── 2. Devis puis facture : ${c.nom} ──`);
    const devis = await s.call("/api/proposals", { method: "POST", body: doc({ title: `Devis ${c.nom}`, ...client, items: c.lignes, tva_rate: 20, total_ht: c.ht, total_ttc: c.ht * 1.2 }) });
    const idD = devis.body?.proposal?.id;
    const d = await s.call(`/api/proposals/${idD}`);
    const lignesDevis = (d.body?.proposal?.items ?? []) as { nature?: string }[];
    verifier(`devis ${c.nom} : chaque ligne relue garde sa nature`, devis.status === 201 && lignesDevis.length === c.lignes.length && lignesDevis.every((l, k) => l.nature === c.lignes[k].nature), JSON.stringify(lignesDevis.map((l) => l.nature)));
    // Conversion : l'écran reprend les lignes du devis telles quelles et
    // n'envoie plus de catégorie choisie à l'aveugle.
    const f = await s.call("/api/invoices", { method: "POST", body: doc({
      proposal_id: idD, ...client, items: lignesDevis, tva_rate: 20,
      ...(c.choix ? { operation_category: c.choix } : {}),
      issue_date: "2024-05-10", due_date: "2024-06-10", type_code: "380", invoice_type: "standard",
      seller_company: "Atelier Nature", seller_siren: "103340857", seller_street: "1 rue du Test", seller_postcode: "33000", seller_city: "Bordeaux",
    }) });
    const inv = f.body?.invoice;
    verifier(`facture ${c.nom} : catégorie déduite = ${c.attendu}`, f.status === 201 && inv?.operation_category === c.attendu, `HTTP ${f.status} ${inv?.operation_category ?? JSON.stringify(f.body).slice(0, 160)}`);
    if (!inv) continue;
    const relue = await s.call(`/api/invoices/${inv.id}`);
    const it = (relue.body?.invoice?.items ?? []) as { nature?: string }[];
    verifier(`facture ${c.nom} : relue, lignes avec nature`, it.every((l, k) => l.nature === c.lignes[k].nature));
    const xml = await xmlDuPdf(s.cookie, inv.id);
    const bt23 = /<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>([A-Z0-9]+)<\/ram:ID>/.exec(xml)?.[1];
    verifier(`facture ${c.nom} : PDF téléchargé, XML embarqué BT-23 = ${c.bt23}`, bt23 === c.bt23, `BT-23 lu : ${bt23 ?? xml.slice(0, 80)}`);
    await s.call(`/api/invoices/${inv.id}`, { method: "PATCH", body: doc({ status: "sent" }) });
    const p = await s.call(`/api/invoices/${inv.id}`, { method: "PATCH", body: doc({ status: "paid", paid_at: "2024-06-01", payment_mode: "virement" }) });
    verifier(`facture ${c.nom} : marquée payée`, p.status === 200, `HTTP ${p.status}`);
    factures[c.nom] = { id: inv.id, numero: inv.invoice_number };
  }

  console.log("── 3. Refus : nature manquante, montant négatif ───────────────");
  const avant = await s.call("/api/invoices");
  const nbAvant = (avant.body?.invoices ?? []).length;
  const base3 = { ...client, tva_rate: 20, issue_date: "2024-05-11", type_code: "380", invoice_type: "standard" };
  const libre = { description: "Ligne libre", quantity: 1, unit: "forfait", unit_price: 20, total: 20 };
  const refus = await s.call("/api/invoices", { method: "POST", body: doc({ ...base3, items: [depuisOffre(oS, 1), libre] }) });
  verifier("ligne sans nature : refus NATURE_A_PRECISER", refus.status === 400 && refus.body?.error === "NATURE_A_PRECISER", `HTTP ${refus.status} ${JSON.stringify(refus.body)}`);
  const refusChoix = await s.call("/api/invoices", { method: "POST", body: doc({ ...base3, items: [libre], operation_category: "goods" }) });
  verifier("ligne sans nature MÊME avec une catégorie envoyée : refus", refusChoix.status === 400 && refusChoix.body?.error === "NATURE_A_PRECISER", `HTTP ${refusChoix.status}`);
  const refusNeg = await s.call("/api/invoices", { method: "POST", body: doc({ ...base3, items: [depuisOffre(oS, 1), { ...libre, unit_price: -20, total: -20, nature: "goods" }] }) });
  verifier("ligne à montant négatif : refus LIGNE_NEGATIVE", refusNeg.status === 400 && refusNeg.body?.error === "LIGNE_NEGATIVE", `HTTP ${refusNeg.status}`);
  const apres = await s.call("/api/invoices");
  verifier("les refus n'ont créé aucune facture", (apres.body?.invoices ?? []).length === nbAvant);
  const suivante = await s.call("/api/invoices", { method: "POST", body: doc({ ...base3, issue_date: "2024-05-12", items: [{ ...libre, nature: "goods" }] }) });
  verifier("même ligne libre avec sa nature : acceptée, biens", suivante.status === 201 && suivante.body?.invoice?.operation_category === "goods");
  const derniere = factures["« services » envoyé sur une mixte"]?.numero ?? "";
  const numSuiv = Number(String(suivante.body?.invoice?.invoice_number ?? "").split("-").pop());
  verifier("les refus n'ont pas consommé de numéro (numérotation continue)", numSuiv === Number(derniere.split("-").pop()) + 1, `${derniere} puis ${suivante.body?.invoice?.invoice_number}`);

  console.log("── 3 bis. Modification (PATCH) : même règle ───────────────────");
  const idS = suivante.body?.invoice?.id;
  if (idS) {
    const pSans = await s.call(`/api/invoices/${idS}`, { method: "PATCH", body: doc({ items: [libre] }) });
    verifier("PATCH avec une ligne sans nature : refus", pSans.status === 400 && pSans.body?.error === "NATURE_A_PRECISER", `HTTP ${pSans.status}`);
    const pNeg = await s.call(`/api/invoices/${idS}`, { method: "PATCH", body: doc({ items: [{ ...libre, unit_price: -5, total: -5, nature: "goods" }] }) });
    verifier("PATCH avec une ligne négative : refus", pNeg.status === 400 && pNeg.body?.error === "LIGNE_NEGATIVE", `HTTP ${pNeg.status}`);
    const pChoix = await s.call(`/api/invoices/${idS}`, { method: "PATCH", body: doc({ operation_category: "services" }) });
    verifier("PATCH d'une catégorie contraire aux lignes : ignoré, reste biens", pChoix.status === 200 && pChoix.body?.invoice?.operation_category === "goods", `${pChoix.status} ${pChoix.body?.invoice?.operation_category}`);
    const pMixte = await s.call(`/api/invoices/${idS}`, { method: "PATCH", body: doc({ items: [{ ...libre, nature: "goods" }, { ...libre, description: "Conseil", nature: "services" }], operation_category: "services" }) });
    verifier("PATCH de lignes mixtes : catégorie recalculée « mixed »", pMixte.status === 200 && pMixte.body?.invoice?.operation_category === "mixed", `${pMixte.status} ${pMixte.body?.invoice?.operation_category}`);
    const pInv = await s.call(`/api/invoices/${idS}`, { method: "PATCH", body: doc({ items: [{ ...libre, nature: "bien" }] }) });
    verifier("PATCH avec une nature invalide : refus (pas de nettoyage silencieux en « sans nature »)", pInv.status === 400);
    await s.call(`/api/invoices/${idS}`, { method: "PATCH", body: doc({ status: "cancelled" }) });
  }

  console.log("── 3 ter. Factures récurrentes ────────────────────────────────");
  const recSans = await s.call("/api/recurring", { method: "POST", body: doc({ client_name: "Client Récurrent", items: [{ description: "Maintenance", quantity: 1, unit_price: 100, total: 100 }], tva_rate: 20, interval: "monthly", day_of_month: 1 }) });
  verifier("modèle récurrent sans nature : refus", recSans.status === 400 && recSans.body?.error === "NATURE_A_PRECISER", `HTTP ${recSans.status}`);
  const recOk = await s.call("/api/recurring", { method: "POST", body: doc({ client_name: "Client Récurrent", items: [{ description: "Maintenance", quantity: 1, unit_price: 100, total: 100, nature: "services" }], tva_rate: 20, interval: "monthly", day_of_month: 1 }) });
  verifier("modèle récurrent avec nature : créé, nature gardée", recOk.status === 201 && recOk.body?.recurring?.items?.[0]?.nature === "services", `HTTP ${recOk.status}`);
  if (recOk.body?.recurring?.id) await s.call(`/api/recurring?id=${recOk.body.recurring.id}`, { method: "DELETE" });

  console.log("── 4. FEC client (2024) ───────────────────────────────────────");
  const r = await fetch(`${BASE}/api/export/fec?year=2024`, { headers: { cookie: s.cookie } });
  const fec = await r.text();
  verifier("FEC 2024 téléchargé", r.ok, `HTTP ${r.status} ${fec.slice(0, 120)}`);
  const L = fec.split("\r\n").slice(1).filter(Boolean).map((l) => l.split("\t"));
  const nb = (x: string) => Number((x || "0").replace(",", "."));
  const surPiece = (numero: string, compte: string, col: 11 | 12) =>
    Math.round(L.filter((c) => c[8] === numero && c[4] === compte && c[0] === "VT").reduce((t, c) => t + nb(c[col]), 0) * 100) / 100;
  const m = factures["mixte"]?.numero ?? "?";
  verifier(`FEC, facture mixte ${m} : 706 crédité de 700`, surPiece(m, "706000", 12) === 700);
  verifier(`FEC, facture mixte ${m} : 707 crédité de 300`, surPiece(m, "707000", 12) === 300);
  verifier(`FEC, facture mixte ${m} : TVA des biens exigible (44571 = 60)`, surPiece(m, "445710", 12) === 60);
  verifier(`FEC, facture mixte ${m} : TVA des prestations en attente (44574 = 140)`, surPiece(m, "445740", 12) === 140);
  const b = factures["biens seuls"]?.numero ?? "?";
  verifier(`FEC, biens seuls ${b} : 707 = 300, pas de 706`, surPiece(b, "707000", 12) === 300 && surPiece(b, "706000", 12) === 0);
  const cb = factures["« services » envoyé sur des biens"]?.numero ?? "?";
  verifier(`FEC, « services » envoyé sur des biens ${cb} : 707 = 200, pas de 706 (cohérent avec B1)`, surPiece(cb, "707000", 12) === 200 && surPiece(cb, "706000", 12) === 0);
  const sv = factures["prestations seules"]?.numero ?? "?";
  verifier(`FEC, prestations seules ${sv} : 706 = 700, TVA en attente 140`, surPiece(sv, "706000", 12) === 700 && surPiece(sv, "445740", 12) === 140);
  const parEcr = new Map<string, number>();
  for (const c of L) parEcr.set(c[2], (parEcr.get(c[2]) ?? 0) + nb(c[11]) - nb(c[12]));
  verifier("FEC : chaque écriture équilibrée", [...parEcr.values()].every((v) => Math.abs(v) < 0.005));

  console.log("── 5. Livre des recettes (CSV de l'écran, 2024) ───────────────");
  const lr = await fetch(`${BASE}/api/export/livre-recettes?annee=2024`, { headers: { cookie: s.cookie } });
  const csv = (await lr.text()).replace(/^﻿/, "");
  // Champs entre guillemets : la nature contient des « ; ».
  const champs = (l: string) => {
    const out: string[] = [];
    let cur = "", q = false;
    for (let k = 0; k < l.length; k++) {
      const ch = l[k];
      if (q) { if (ch === '"' && l[k + 1] === '"') { cur += '"'; k++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ";") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const rangs = csv.split("\r\n").filter(Boolean).map(champs);
  const entete = rangs[0] ?? [];
  const col = (nom: string) => entete.indexOf(nom);
  const rang = (numero: string) => rangs.find((x) => x[col("N° de facture")] === numero);
  const rm = rang(m);
  verifier("livre : colonnes « dont HT biens » et « dont HT services »", col("dont HT biens") > 0 && col("dont HT services") > 0, entete.join("|"));
  verifier("livre : la recette mixte est « Mixte », 300 biens / 700 services", !!rm && /Mixte/.test(rm[col("Catégorie")]) && nb(rm[col("dont HT biens")]) === 300 && nb(rm[col("dont HT services")]) === 700, rm?.join("|"));
  const rb = rang(b);
  verifier("livre : la recette de biens est « Vente de biens »", !!rb && rb[col("Catégorie")] === "Vente de biens");

  bilan();
})();
