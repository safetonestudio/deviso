/**
 * Le FEC, jugé sur ce qu'il produit (20/11/2026).
 *
 * check:comptable lit la forme du code ; ce test exécute genererFec sur des
 * factures types et vérifie ce qu'un logiciel de cabinet vérifierait à
 * l'import : équilibre de chaque écriture, ordre chronologique, numérotation
 * continue par journal, lettrage facture / règlement, TVA sur encaissements
 * passée par le compte d'attente 44574 puis virée au 44571, ventes de biens au
 * 707 et TVA directement exigible, avoir en sens inverse, compte client stable
 * même si le client change de nom.
 *
 * Lancer : npx -y tsx scripts/e2e/fec.ts
 */
import { verifier, bilan } from "./lib.mjs";

(async () => {
  const { genererFec, nomFichierFec } = await import("@/lib/exports-comptables");
  const { validerPlan } = await import("@/lib/plan-comptes-fec");
  const ligne = (pu: number, taux: number) => ({ description: "x", quantity: 1, unit_price: pu, total: pu, tva_rate: taux });

  const base = { tva_rate: 20, client_siren: "552100554", client_company: "Mairie Test" };
  const factures = [
    // 1. Prestation payée, TVA sur encaissements (défaut des services).
    { ...base, invoice_number: "F-1", issue_date: "2026-03-10", status: "paid", paid_at: "2026-04-02", total_ht: 1000, total_ttc: 1200, items: [ligne(1000, 20)], operation_category: "services" },
    // 2. Vente de biens, non payée : 707 et TVA exigible tout de suite.
    { ...base, invoice_number: "F-2", issue_date: "2026-03-05", status: "sent", total_ht: 500, total_ttc: 600, items: [ligne(500, 20)], operation_category: "goods", client_company: "Autre Nom" },
    // 3. Avoir sur la facture 1, remboursé.
    { ...base, invoice_number: "AV-1", issue_date: "2026-05-01", status: "paid", paid_at: "2026-05-03", total_ht: 100, total_ttc: 120, items: [ligne(100, 20)], invoice_type: "avoir", type_code: "381", operation_category: "services" },
    // 4. Prestation avec option pour les débits : TVA directement en 44571.
    { ...base, invoice_number: "F-3", issue_date: "2026-02-01", status: "paid", paid_at: "2026-02-20", total_ht: 200, total_ttc: 240, items: [ligne(200, 20)], operation_category: "services", payment_on_debit: true },
  ];

  const fec = genererFec(factures as never);
  const lignes = fec.split("\r\n").slice(1).map((l) => l.split("\t"));
  const C = { journal: 0, num: 2, date: 3, compte: 4, aux: 6, ref: 8, debit: 11, credit: 12, let: 13, dateLet: 14, valid: 15 };
  const n = (s: string) => Number(s.replace(",", "."));

  console.log("── Structure ──────────────────────────────────────────────────");
  verifier("18 colonnes sur chaque ligne", lignes.every((l) => l.length === 18));
  const parEcriture = new Map<string, string[][]>();
  for (const l of lignes) parEcriture.set(l[C.num], [...(parEcriture.get(l[C.num]) ?? []), l]);
  verifier(
    "chaque écriture est équilibrée (débit = crédit)",
    [...parEcriture.values()].every((ls) => Math.abs(ls.reduce((s, l) => s + n(l[C.debit]) - n(l[C.credit]), 0)) < 0.005),
  );
  const dates = lignes.map((l) => l[C.valid]);
  verifier("écritures dans l'ordre chronologique de validation", dates.every((d, i) => i === 0 || dates[i - 1] <= d), dates.join(" "));
  for (const j of ["VT", "BQ"]) {
    const nums = [...new Set(lignes.filter((l) => l[C.journal] === j).map((l) => l[C.num]))];
    verifier(`numérotation continue du journal ${j}`, nums.every((x, i) => x === `${j}${String(i + 1).padStart(6, "0")}`), nums.join(" "));
  }

  console.log("── Lettrage ───────────────────────────────────────────────────");
  const client411 = (ref: string) => lignes.filter((l) => l[C.ref] === ref && l[C.compte] === "411000");
  const f1 = client411("F-1");
  verifier("facture payée : ses deux lignes client portent la même lettre", f1.length === 2 && f1[0][C.let] !== "" && f1[0][C.let] === f1[1][C.let]);
  verifier("la date de lettrage est la date d'encaissement", f1.every((l) => l[C.dateLet] === "20260402"));
  verifier("facture non payée : pas de lettre", client411("F-2").every((l) => l[C.let] === ""));
  const lettres = ["F-1", "AV-1", "F-3"].map((r) => client411(r)[0][C.let]);
  verifier("une lettre différente par règlement", new Set(lettres).size === 3, lettres.join(" "));

  console.log("── TVA ────────────────────────────────────────────────────────");
  const sur = (ref: string, compte: string) => lignes.filter((l) => l[C.ref] === ref && l[C.compte] === compte);
  verifier("prestation : TVA d'abord en 44574 (non exigible)", sur("F-1", "445740").some((l) => l[C.journal] === "VT" && n(l[C.credit]) === 200));
  verifier(
    "au paiement : 44574 soldé et TVA virée au 44571",
    sur("F-1", "445740").some((l) => l[C.journal] === "BQ" && n(l[C.debit]) === 200) &&
      sur("F-1", "445710").some((l) => l[C.journal] === "BQ" && n(l[C.credit]) === 200),
  );
  const solde44574 = lignes.filter((l) => l[C.compte] === "445740" && ["F-1", "AV-1"].includes(l[C.ref])).reduce((s, l) => s + n(l[C.debit]) - n(l[C.credit]), 0);
  verifier("44574 soldé pour les documents payés", Math.abs(solde44574) < 0.005, String(solde44574));
  verifier("bien vendu : 707 et TVA directement en 44571", sur("F-2", "707000").length === 1 && sur("F-2", "445710").length === 1 && sur("F-2", "445740").length === 0);
  verifier("option pour les débits : TVA directement en 44571", sur("F-3", "445710").length === 1 && sur("F-3", "445740").length === 0);

  console.log("── Avoir et compte client ─────────────────────────────────────");
  verifier("avoir : le client est crédité, le produit débité", client411("AV-1").some((l) => l[C.journal] === "VT" && n(l[C.credit]) === 120) && sur("AV-1", "706000").some((l) => n(l[C.debit]) === 100));
  verifier("même SIREN, même compte client, même si le nom change", new Set(lignes.filter((l) => l[C.compte] === "411000").map((l) => l[C.aux])).size === 1);
  verifier("le compte client vient du SIREN", client411("F-1")[0][C.aux] === "C552100554");

  console.log("── Nom de fichier ─────────────────────────────────────────────");
  verifier("nom réglementaire SIREN + FEC + clôture", nomFichierFec("552 100 554 00010", "2026", "x") === "552100554FEC20261231.txt");
  verifier("sans SIREN : nom lisible", nomFichierFec(null, "2026", "Atelier") === "FEC_2026_Atelier.txt");

  console.log("── Plan de comptes du cabinet ─────────────────────────────────");
  const perso = validerPlan({ journalVentes: "ve", clients: "4110000", ventesServices: "706100", tvaNonExigible: "445741" });
  verifier("un plan personnalisé valide est accepté (journal mis en majuscules)", "plan" in perso && perso.plan.journalVentes === "VE");
  if ("plan" in perso) {
    const fecPerso = genererFec(factures as never, perso.plan).split("\r\n").slice(1).map((l) => l.split("\t"));
    verifier("le FEC utilise les comptes du cabinet", fecPerso.some((l) => l[C.compte] === "4110000") && fecPerso.some((l) => l[C.compte] === "706100") && fecPerso.some((l) => l[C.compte] === "445741"));
    verifier("le FEC utilise ses codes journaux", fecPerso.some((l) => l[C.journal] === "VE") && !fecPerso.some((l) => l[C.journal] === "VT"));
    verifier("plus aucun compte par défaut remplacé", !fecPerso.some((l) => ["411000", "706000", "445740"].includes(l[C.compte])));
  }
  verifier("contre-épreuve : un compte de TVA hors classe 4457 est refusé", "erreur" in validerPlan({ tvaCollectee: "601000" }));
  verifier("contre-épreuve : deux journaux identiques sont refusés", "erreur" in validerPlan({ journalVentes: "BQ" }));
  verifier("contre-épreuve : un compte non numérique est refusé", "erreur" in validerPlan({ banque: "51A" }));

  bilan();
})();
