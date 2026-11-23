/**
 * Nature des operations : biens / prestations (23/11/2026).
 *
 * Teste la regle unique (lib/nature-operation.ts) et ses trois consommateurs
 * qui decident d'une declaration : la deduction de la nature d'une facture,
 * la ventilation comptable d'une facture mixte (FEC et Quadra, meme source
 * ecrituresComptables) et la repartition du livre des recettes.
 *
 * Lancer : npx -y tsx scripts/test-nature-operation.ts
 */
import { verifier, bilan } from "./e2e/lib.mjs";

(async () => {
  const N = await import("@/lib/nature-operation");
  const { ecrituresComptables, ventilationParNature, genererFec } = await import("@/lib/exports-comptables");
  const { genererQuadra } = await import("@/lib/export-quadra");
  const { lignesRecettes, totauxParCategorie } = await import("@/lib/recettes");

  const S = { nature: "services" as const };
  const B = { nature: "goods" as const };
  const X = {};

  console.log("── Déduction de la nature de la facture ───────────────────────");
  verifier("que des prestations => services", N.deduireCategorie([S, S]).categorie === "services" && N.deduireCategorie([S, S]).complete);
  verifier("que des biens => goods", N.deduireCategorie([B]).categorie === "goods" && N.deduireCategorie([B]).complete);
  verifier("biens + prestations => mixed", N.deduireCategorie([S, B]).categorie === "mixed" && N.deduireCategorie([B, S, S]).complete);
  const partielle = N.deduireCategorie([S, X]);
  verifier("une ligne sans nature => déduction incomplète, pas de « services » supposé", !partielle.complete && partielle.sansNature === 1, JSON.stringify(partielle));
  verifier("aucune ligne => rien de déduit", N.deduireCategorie([]).categorie === null && !N.deduireCategorie([]).complete);
  verifier("une nature invalide compte comme absente", N.deduireCategorie([{ nature: "bien" }]).sansNature === 1);

  console.log("── Règle serveur ──────────────────────────────────────────────");
  const r1 = N.resoudreCategorie([B, B], undefined);
  verifier("serveur : lignes complètes => déduite", r1.ok && r1.categorie === "goods" && r1.source === "lignes", JSON.stringify(r1));
  const r2 = N.resoudreCategorie([B, S], undefined);
  verifier("serveur : biens + prestations => mixed", r2.ok && r2.categorie === "mixed");
  const r3 = N.resoudreCategorie([B, X], undefined);
  verifier("serveur : nature partielle sans choix => refus NATURE_A_PRECISER", !r3.ok && r3.erreur === "NATURE_A_PRECISER", JSON.stringify(r3));
  const r4 = N.resoudreCategorie([B, X], "goods");
  verifier("serveur : un choix explicite valide l'emporte", r4.ok && r4.categorie === "goods" && r4.source === "choix");
  const r5 = N.resoudreCategorie([X], undefined);
  verifier("serveur : aucune nature => historique services, signalé", r5.ok && r5.categorie === "services" && r5.source === "historique");
  const r6 = N.resoudreCategorie([B], "n'importe quoi");
  verifier("serveur : un choix invalide est ignoré, la déduction joue", r6.ok && r6.categorie === "goods" && r6.source === "lignes");

  console.log("── Catalogue et acomptes ──────────────────────────────────────");
  const offres = [{ name: "Tirage photo", nature: "goods" }, { name: "Tirage photo encadré", nature: "goods" }, { name: "Séance photo", nature: "services" }, { name: "Retouche", nature: null }];
  verifier("ligne IA « Séance photo, 2 h » => services", N.natureDepuisCatalogue("Séance photo, 2 h", offres) === "services");
  verifier("accents et casse ignorés", N.natureDepuisCatalogue("SEANCE PHOTO", offres) === "services");
  verifier("le nom le plus long l'emporte", N.natureDepuisCatalogue("Tirage photo encadré 30x40", offres) === "goods");
  verifier("un mot qui commence pareil ne suffit pas", N.natureDepuisCatalogue("Séance photographique", offres) === undefined);
  verifier("offre sans nature => rien", N.natureDepuisCatalogue("Retouche", offres) === undefined);
  verifier("hors catalogue => rien", N.natureDepuisCatalogue("Déplacement", offres) === undefined);
  const parts = N.repartirParNature([{ ...S, total: 700 }, { ...B, total: 300 }], 333.33);
  verifier(
    "acompte d'un devis mixte : deux parts au prorata, somme exacte",
    parts.length === 2 && parts[0].nature === "services" && parts[1].nature === "goods" &&
      Math.round((parts[0].montant + parts[1].montant) * 100) === 33333,
    JSON.stringify(parts),
  );
  const une = N.repartirParNature([{ ...B, total: 100 }, { ...B, total: 50 }], 45);
  verifier("acompte d'un devis de biens : une seule part, biens", une.length === 1 && une[0].nature === "goods" && une[0].montant === 45);
  verifier("devis sans nature : une part sans nature", N.repartirParNature([{ total: 10 }], 3)[0].nature === undefined);
  verifier("ligne sans nature d'une facture mixte => services (lecture historique)", N.natureEffective({}, "mixed") === "services");
  verifier("ligne sans nature d'une facture de biens => biens", N.natureEffective({}, "goods") === "goods");

  console.log("── FEC / Quadra : facture mixte ventilée ligne par ligne ──────");
  const base = { tva_rate: 20, client_siren: "552100554", client_company: "Client Test", issue_date: "2026-03-10" };
  const l = (pu: number, nature?: "goods" | "services", taux = 20) => ({ description: "x", quantity: 1, unit_price: pu, total: pu, tva_rate: taux, ...(nature ? { nature } : {}) });
  // 700 de prestations + 300 de biens, TVA 20 %. Payée.
  const mixte = { ...base, invoice_number: "F-M1", status: "paid", paid_at: "2026-04-02", total_ht: 1000, total_ttc: 1200, items: [l(700, "services"), l(300, "goods")], operation_category: "mixed" };
  const v = ventilationParNature(mixte as never);
  verifier("ventilation : 300 en biens, 700 en prestations", v.biensHt === 300 && v.servicesHt === 700, JSON.stringify(v));
  verifier("ventilation : TVA des biens exigible (60), des prestations en attente (140)", v.tvas.length === 1 && v.tvas[0].exigible === 60 && v.tvas[0].attente === 140, JSON.stringify(v.tvas));

  const ecr = ecrituresComptables([mixte as never]);
  const vente = ecr.find((e) => e.nature === "vente")!;
  const banque = ecr.find((e) => e.nature === "reglement")!;
  const somme = (e: typeof vente, c: string, cote: "debit" | "credit") => Math.round(e.lignes.filter((x) => x.compte === c).reduce((s, x) => s + x[cote], 0) * 100) / 100;
  const equilibre = (e: typeof vente) => Math.round(e.lignes.reduce((s, x) => s + x.debit - x.credit, 0) * 100) === 0;
  verifier("vente mixte : 707 crédité de 300", somme(vente, "707000", "credit") === 300, JSON.stringify(vente.lignes));
  verifier("vente mixte : 706 crédité de 700", somme(vente, "706000", "credit") === 700);
  verifier("vente mixte : 44571 crédité de 60 (TVA des biens)", somme(vente, "445710", "credit") === 60);
  verifier("vente mixte : 44574 crédité de 140 (TVA des prestations)", somme(vente, "445740", "credit") === 140);
  verifier("vente mixte : équilibrée", equilibre(vente));
  verifier("règlement : seule la TVA des prestations quitte le 44574 (140)", somme(banque, "445740", "debit") === 140 && somme(banque, "445710", "credit") === 140);
  verifier("règlement : équilibré", equilibre(banque));

  // Option débits : toute la TVA exigible à la facturation.
  const debits = ecrituresComptables([{ ...mixte, payment_on_debit: true } as never]).find((e) => e.nature === "vente")!;
  verifier("mixte avec option débits : rien en 44574", somme(debits, "445740", "credit") === 0 && somme(debits, "445710", "credit") === 200);

  // Multi-taux et arrondis : 3 lignes à 33,33.
  const { ventilationTva } = await import("@/lib/tva");
  const itemsArr = [l(33.33, "goods", 20), l(33.33, "services", 20), l(33.33, "services", 10)];
  const ventArr = ventilationTva(itemsArr, 20);
  const arr = { ...base, invoice_number: "F-M2", status: "sent", total_ht: ventArr.total_ht, total_ttc: ventArr.total_ttc, items: itemsArr, operation_category: "mixed" };
  const varr = ecrituresComptables([arr as never]).find((e) => e.nature === "vente")!;
  const tvaTotale = Math.round(varr.lignes.filter((x) => x.compte.startsWith("4457")).reduce((s, x) => s + x.credit, 0) * 100) / 100;
  verifier("mixte multi-taux : équilibrée au centime", equilibre(varr), JSON.stringify(varr.lignes));
  const attendue = ventilationTva(arr.items, 20).total_tva;
  verifier("mixte multi-taux : TVA totale = celle de la facture", tvaTotale === attendue, `${tvaTotale} vs ${attendue}`);

  // Historique : facture mixte SANS nature de ligne, comportement d'avant.
  const ancienne = { ...base, invoice_number: "F-OLD", status: "sent", total_ht: 1000, total_ttc: 1200, items: [l(700), l(300)], operation_category: "mixed" };
  const vold = ecrituresComptables([ancienne as never]).find((e) => e.nature === "vente")!;
  verifier("mixte ancienne sans nature : 706 en entier, TVA exigible (lecture d'avant)", somme(vold, "706000", "credit") === 1000 && somme(vold, "445710", "credit") === 200 && somme(vold, "707000", "credit") === 0);
  // Services seuls, inchangés.
  const serv = { ...base, invoice_number: "F-S", status: "sent", total_ht: 500, total_ttc: 600, items: [l(500, "services")], operation_category: "services" };
  const vs = ecrituresComptables([serv as never]).find((e) => e.nature === "vente")!;
  verifier("services seuls : 706 et 44574, une ligne produit", somme(vs, "706000", "credit") === 500 && somme(vs, "445740", "credit") === 100 && vs.lignes.length === 3);
  const biens = { ...base, invoice_number: "F-B", status: "sent", total_ht: 500, total_ttc: 600, items: [l(500, "goods")], operation_category: "goods" };
  const vb = ecrituresComptables([biens as never]).find((e) => e.nature === "vente")!;
  verifier("biens seuls : 707 et 44571", somme(vb, "707000", "credit") === 500 && somme(vb, "445710", "credit") === 100 && vb.lignes.length === 3);
  // Avoir mixte : sens inverse.
  const avoir = { ...mixte, invoice_number: "AV-M1", invoice_type: "avoir", type_code: "381" };
  const va = ecrituresComptables([avoir as never]).find((e) => e.nature === "vente")!;
  verifier("avoir mixte : 707 débité de 300, 706 de 700", somme(va, "707000", "debit") === 300 && somme(va, "706000", "debit") === 700 && equilibre(va));

  const fec = genererFec([mixte as never]);
  verifier("FEC : la facture mixte porte une ligne 707 et une ligne 706", /\t707000\t/.test(fec) && /\t706000\t/.test(fec));
  const quadra = genererQuadra([mixte as never]);
  verifier("Quadra : les mêmes comptes 707 et 706", /M707000/.test(quadra) && /M706000/.test(quadra), quadra.split("\r\n").slice(0, 4).join(" | "));

  console.log("── Livre des recettes ─────────────────────────────────────────");
  const rec = (o: Record<string, unknown>) => ({ id: String(o.invoice_number), client_name: "C", status: "paid", paid_at: "2026-04-02", issue_date: "2026-03-10", ...o });
  const lignes = lignesRecettes([
    rec({ invoice_number: "F-M1", total_ht: 1000, total_ttc: 1200, items: mixte.items, operation_category: "mixed" }),
    rec({ invoice_number: "F-B", total_ht: 500, total_ttc: 600, items: biens.items, operation_category: "goods" }),
    rec({ invoice_number: "F-OLD", total_ht: 1000, total_ttc: 1200, items: ancienne.items, operation_category: "mixed" }),
  ] as never, 2026);
  const m = lignes.find((x) => x.numero === "F-M1")!;
  verifier("recette mixte : catégorie « mixte », 300 biens / 700 services HT", m.categorie === "mixte" && m.repartition.biens.ht === 300 && m.repartition.services.ht === 700, JSON.stringify(m));
  verifier("recette mixte : TTC réparti au même prorata (360 / 840)", m.repartition.biens.ttc === 360 && m.repartition.services.ttc === 840);
  const t = totauxParCategorie(lignes);
  verifier("totaux : biens = 300 + 500 = 800 HT", t.biens.ht === 800, JSON.stringify(t));
  verifier("totaux : services = 700 + 1000 (ancienne mixte) = 1700 HT", t.services.ht === 1700);
  verifier("totaux : la mixte compte dans les deux catégories", t.biens.nb === 2 && t.services.nb === 2);
  const av = lignesRecettes([rec({ invoice_number: "AV", invoice_type: "avoir", total_ht: 1000, total_ttc: 1200, items: mixte.items, operation_category: "mixed" })] as never, 2026)[0];
  verifier("avoir mixte : parts négatives", av.repartition.biens.ht === -300 && av.repartition.services.ht === -700);

  bilan();
})();
