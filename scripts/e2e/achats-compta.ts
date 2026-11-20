/**
 * Journal des achats du FEC et de Quadra (20/11/2026).
 *
 * Avant : les exports ne portaient que les ventes et la banque ; le cabinet
 * ressaisissait tous les achats. On vérifie :
 *  1. les écritures (pures) : achat français, avoir reçu, achat étranger en
 *     autoliquidation, biens/services, équilibre, numérotation, devises ;
 *  2. le FEC et Quadra produits (colonnes, enregistrements fournisseur) ;
 *  3. le plan de comptes réglable (classes, journaux distincts) ;
 *  4. le cours BCE réel et le chargement réel sur le compte de test.
 *
 * Lancer : npx -y tsx scripts/e2e/achats-compta.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { verifier, bilan, openSession } from "./lib.mjs";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

(async () => {
  const { ecrituresComptables, genererFec } = await import("@/lib/exports-comptables");
  const { genererQuadra } = await import("@/lib/export-quadra");
  const { validerPlan, PLAN_PAR_DEFAUT } = await import("@/lib/plan-comptes-fec");
  const { tauxDeduit, coursBce, chargerAchats, estAvoirRecu, TAUX_AUTOLIQUIDATION, acomptesDuSolde } = await import("@/lib/achats-export");
  type Achat = import("@/lib/exports-comptables").AchatExport;

  const francais: Achat = { ref: "FA-12", date: "2026-03-10", fournisseur: "Imprimerie Dupré", siren: "853322915", ht: 100, tvas: [{ taux: 20, montant: 20 }] };
  const avoirRecu: Achat = { ...francais, ref: "AV-3", date: "2026-03-20", ht: 50, tvas: [{ taux: 20, montant: 10 }], avoir: true };
  const etrangerServices: Achat = { ref: "IE-77", date: "2026-02-05", fournisseur: "Cloud Ltd", tvaIntra: "IE6388047V", categorie: "services", ht: 1000, tvas: [{ taux: 20, montant: 200 }], autoliquidation: true };
  const etrangerBiens: Achat = { ref: "US-9", date: "2026-04-01", fournisseur: "Gear Inc", categorie: "biens", ht: 1103.71, tvas: [{ taux: 20, montant: 220.74 }], autoliquidation: true, devise: "USD", montantDevise: 1240 };
  const etrangerSansTva: Achat = { ref: "IT-1", date: "2026-05-02", fournisseur: "Fornitore SRL", tvaIntra: "IT12345678901", categorie: "biens", ht: 1800, tvas: [], autoliquidation: true };
  const vente = { invoice_number: "F-1", issue_date: "2026-03-10", client_name: "Client", client_siren: "552100554", status: "sent", total_ht: 500, total_ttc: 600, tva_rate: 20, items: [{ quantity: 1, unit_price: 500, total: 500 }], operation_category: "services" };

  const ecr = ecrituresComptables([vente], PLAN_PAR_DEFAUT, [francais, avoirRecu, etrangerServices, etrangerBiens, etrangerSansTva]);
  const achat = (ref: string) => ecr.find((e) => e.ref === ref)!;
  const ligne = (ref: string, compte: string) => achat(ref).lignes.find((l) => l.compte === compte);

  console.log("── Écritures d'achat ────────────────────────────────────────");
  const fa = achat("FA-12");
  verifier("achat français au journal des achats (HA)", fa.journal === "HA" && fa.nature === "achat");
  verifier("charge 604 au débit pour le HT", ligne("FA-12", "604000")?.debit === 100);
  verifier("TVA déductible 445660 au débit", ligne("FA-12", "445660")?.debit === 20);
  verifier("fournisseur 401 au crédit pour le TTC, auxiliaire F + SIREN", ligne("FA-12", "401000")?.credit === 120 && ligne("FA-12", "401000")?.auxNum === "F853322915");
  verifier("avoir reçu en sens inverse", ligne("AV-3", "604000")?.credit === 50 && ligne("AV-3", "445660")?.credit === 10 && ligne("AV-3", "401000")?.debit === 60);

  verifier("étranger : TVA autoliquidée due 445200 au crédit", ligne("IE-77", "445200")?.credit === 200);
  verifier("étranger : la même TVA déductible 445662 au débit", ligne("IE-77", "445662")?.debit === 200);
  verifier("étranger : fournisseur dû du HT seul", ligne("IE-77", "401000")?.credit === 1000);
  verifier("étranger : aucune TVA déductible ordinaire", !ligne("IE-77", "445660"));
  verifier("étranger : auxiliaire F + n° de TVA", ligne("IE-77", "401000")?.auxNum === "FIE6388047V");
  verifier("biens étrangers en 607", ligne("US-9", "607000")?.debit === 1103.71 && !ligne("US-9", "604000"));
  verifier("devise d'origine conservée sur la ligne fournisseur", ligne("US-9", "401000")?.devise === "USD" && ligne("US-9", "401000")?.montantDevise === 1240);
  verifier("achat sans TVA : charge et fournisseur seulement", achat("IT-1").lignes.length === 2);

  // ── Cas relevés par la revue indépendante du 20/11 ──
  const tvaAllemande: Achat = { ref: "DE-5", date: "2026-06-01", fournisseur: "Hotel Berlin", tvaIntra: "DE123456789", categorie: "services", ht: 1000, tvas: [{ taux: 19, montant: 190 }], tvaEtrangere: true };
  const franchiseFr: Achat = { ...francais, ref: "FR-F", nonDeductible: true };
  const franchiseAutoliq: Achat = { ...etrangerServices, ref: "IE-F", nonDeductible: true };
  const tab: Achat = { ...francais, ref: "FA\t13\n", fournisseur: "Nom\tavec tabulation" };
  const ecr2 = ecrituresComptables([], PLAN_PAR_DEFAUT, [tvaAllemande, franchiseFr, franchiseAutoliq, tab]);
  const l2 = (ref: string, compte: string) => ecr2.find((e) => e.ref === ref)?.lignes.find((l) => l.compte === compte);
  verifier("TVA étrangère facturée : en charge (TTC), jamais déductible ni autoliquidée",
    l2("DE-5", "604000")?.debit === 1190 && l2("DE-5", "401000")?.credit === 1190 && !ecr2.find((e) => e.ref === "DE-5")!.lignes.some((l) => l.compte.startsWith("445")));
  verifier("franchise, achat français : TVA en charge, pas de 445660",
    l2("FR-F", "604000")?.debit === 120 && !l2("FR-F", "445660") && l2("FR-F", "401000")?.credit === 120);
  verifier("franchise, autoliquidation : TVA due 4452, non déductible donc en charge",
    l2("IE-F", "445200")?.credit === 200 && !l2("IE-F", "445662") && l2("IE-F", "604000")?.debit === 1200 && l2("IE-F", "401000")?.credit === 1000);
  verifier("tabulations et retours à la ligne retirés du numéro", ecr2.some((e) => e.ref === "FA 13"));
  verifier("avoirs reçus : 381, 261, 262, 396, 502, 503, même en nombre",
    ["381", "261", "262", "396", "502", "503"].every(estAvoirRecu) && estAvoirRecu(381) && !estAvoirRecu("380") && !estAvoirRecu("386"));
  const desequilibres2 = ecr2.filter((e) => Math.abs(e.lignes.reduce((s, l) => s + l.debit - l.credit, 0)) > 0.001);
  verifier("cas de la revue : écritures équilibrées", desequilibres2.length === 0, desequilibres2.map((e) => e.ref).join(", "));

  // ── Acompte puis solde (20/11/2026) ──
  console.log("");
  console.log("── Acompte reçu puis solde ──────────────────────────────────");
  const acompteRecu: Achat = { ref: "MA-AC", date: "2026-09-01", fournisseur: "Menuiserie", siren: "512345675", ht: 1000, tvas: [{ taux: 20, montant: 200 }], acompte: true };
  const soldeAc: Achat = { ref: "MA-SOL", date: "2026-10-01", fournisseur: "Menuiserie", siren: "512345675", ht: 3000, tvas: [{ taux: 20, montant: 600 }],
    imputations: [{ ref: "MA-AC", ht: 1000, ttc: 1200, tvas: [{ taux: 20, montant: 200 }] }] };
  const ecr3 = ecrituresComptables([], PLAN_PAR_DEFAUT, [acompteRecu, soldeAc, { ...acompteRecu, ref: "MA-ACF", nonDeductible: true }, { ...soldeAc, ref: "MA-SOLF", nonDeductible: true }]);
  const l3 = (ref: string, compte: string) => ecr3.find((e) => e.ref === ref)?.lignes.filter((l) => l.compte === compte) ?? [];
  const dAc = (ref: string, compte: string) => l3(ref, compte).reduce((s, l) => s + l.debit, 0);
  const cAc = (ref: string, compte: string) => l3(ref, compte).reduce((s, l) => s + l.credit, 0);
  verifier("acompte : avance 409100 au débit (pas de charge), TVA déduite, fournisseur TTC",
    dAc("MA-AC", "409100") === 1000 && dAc("MA-AC", "445660") === 200 && cAc("MA-AC", "401000") === 1200 && l3("MA-AC", "604000").length === 0);
  verifier("solde : charge pour le total HT", dAc("MA-SOL", "604000") === 3000);
  verifier("solde : seule la TVA pas encore déduite (600 - 200)", dAc("MA-SOL", "445660") === 400);
  verifier("solde : l'avance est soldée", cAc("MA-SOL", "409100") === 1000);
  verifier("solde : le fournisseur n'est plus dû que du reste", cAc("MA-SOL", "401000") === 2400);
  verifier("sur l'ensemble : TVA déduite une seule fois (600)", dAc("MA-AC", "445660") + dAc("MA-SOL", "445660") === 600);
  verifier("franchise : acompte en avance TTC, solde en charge TTC, avance soldée TTC",
    dAc("MA-ACF", "409100") === 1200 && dAc("MA-SOLF", "604000") === 3600 && cAc("MA-SOLF", "409100") === 1200 && cAc("MA-SOLF", "401000") === 2400 && l3("MA-SOLF", "445660").length === 0);
  const des3 = ecr3.filter((e) => Math.abs(e.lignes.reduce((s, l) => s + l.debit - l.credit, 0)) > 0.001);
  verifier("acompte et solde : écritures équilibrées", des3.length === 0, des3.map((e) => e.ref).join(", "));

  // Règles de rapprochement.
  const R = (id: number, number: string, date: string, ttc: number, opts: { type?: string; siren?: string; verse?: number; refs?: string[]; vendeur?: string } = {}) => ({
    id, number, issue_date: date, seller_name: opts.vendeur ?? "Menuiserie", total_without_vat: ttc / 1.2, total_vat: ttc - ttc / 1.2, total_with_vat: ttc, last_status_code: "fr:200",
    en_invoice: { type_code: opts.type ?? "380", seller: { legal_registration_identifier: { value: opts.siren ?? "512345675" } },
      totals: opts.verse ? { paid_amount: String(opts.verse) } : {}, preceding_invoice_references: (opts.refs ?? []).map((reference) => ({ reference })) },
  });
  const ac1 = R(1, "AC-1", "2026-09-01", 1200, { type: "386" });
  const ac2 = R(2, "AC-2", "2026-09-05", 1200, { type: "386" });
  const autre = R(3, "AC-X", "2026-09-01", 1200, { type: "386", siren: "999999999" });
  const tard = R(4, "AC-T", "2026-11-01", 1200, { type: "386" });
  const vide = new Set<number>();
  verifier("rapprochement par la référence que porte le solde", acomptesDuSolde(R(9, "S", "2026-10-01", 3600, { verse: 1200, refs: ["AC-2"] }), [ac1, ac2], vide)?.[0]?.number === "AC-2");
  verifier("sans référence : un seul acompte du montant versé", acomptesDuSolde(R(9, "S", "2026-10-01", 3600, { verse: 1200 }), [ac1, autre, tard], vide)?.[0]?.number === "AC-1");
  verifier("sans référence, deux acomptes du même montant : on ne devine pas", acomptesDuSolde(R(9, "S", "2026-10-01", 3600, { verse: 1200 }), [ac1, ac2], vide) === null);
  verifier("un autre fournisseur ou un acompte postérieur n'est jamais pris", acomptesDuSolde(R(9, "S", "2026-10-01", 3600, { verse: 1200 }), [autre, tard], vide) === null);
  verifier("référence trouvée mais montant différent : on ne devine pas", acomptesDuSolde(R(9, "S", "2026-10-01", 3600, { verse: 500, refs: ["AC-1"] }), [ac1], vide) === null);
  verifier("un acompte déjà imputé ne l'est pas deux fois", acomptesDuSolde(R(9, "S", "2026-10-01", 3600, { verse: 1200 }), [ac1], new Set([1])) === null);
  verifier("sans déjà-versé : aucun rapprochement", acomptesDuSolde(R(9, "S", "2026-10-01", 3600), [ac1], vide) === null);

  const desequilibres = ecr.filter((e) => Math.abs(e.lignes.reduce((s, l) => s + l.debit - l.credit, 0)) > 0.001);
  verifier("chaque écriture est équilibrée (ventes et achats)", desequilibres.length === 0, desequilibres.map((e) => e.ref).join(", "));
  const ha = ecr.filter((e) => e.journal === "HA").map((e) => e.num);
  verifier("numérotation continue du journal HA", ha.join(",") === "HA000001,HA000002,HA000003,HA000004,HA000005", ha.join(","));
  const dates = ecr.map((e) => e.date);
  verifier("ordre chronologique sur tout le fichier", dates.every((d, i) => i === 0 || dates[i - 1] <= d));
  verifier("les ventes restent intactes", ecr.some((e) => e.journal === "VT" && e.ref === "F-1"));

  console.log("");
  console.log("── FEC et Quadra ────────────────────────────────────────────");
  const fec = genererFec([vente], PLAN_PAR_DEFAUT, [francais, etrangerBiens]).split("\r\n").map((l) => l.split("\t"));
  const enTete = fec[0];
  const iDev = enTete.indexOf("Montantdevise");
  const iIdev = enTete.indexOf("Idevise");
  const ligneUsd = fec.find((c) => c[4] === "401000" && c[8] === "US-9");
  verifier("FEC : 18 colonnes partout", fec.every((c) => c.length === 18));
  verifier("FEC : Montantdevise / Idevise sur l'achat en dollars", ligneUsd?.[iDev] === "1240,00" && ligneUsd?.[iIdev] === "USD", JSON.stringify(ligneUsd));
  verifier("FEC : lignes d'achat présentes", fec.filter((c) => c[0] === "HA").length === 7);

  const quadra = genererQuadra([vente], {}, [francais, etrangerServices, { ...etrangerServices, ref: "IE-78", fournisseur: "Autre Cloud", tvaIntra: "IE6388048V" }]).split("\r\n").filter(Boolean);
  const cF = quadra.filter((l) => l[0] === "C" && l[217] === "F");
  const cC = quadra.filter((l) => l[0] === "C" && l[217] === "C");
  verifier("Quadra : un enregistrement C type F par fournisseur (3)", cF.length === 3, String(cF.length));
  verifier("Quadra : collectif 40100000 sur les fournisseurs", cF.every((l) => l.slice(98, 106) === "40100000"));
  verifier("Quadra : le client garde son type C et son collectif 411", cC.length === 1 && cC[0].slice(98, 106) === "41100000");
  verifier("Quadra : deux fournisseurs irlandais, deux codes distincts", new Set(cF.map((l) => l.slice(1, 9))).size === 3);
  const m = quadra.filter((l) => l[0] === "M");
  const solde = m.reduce((s, l) => s + (l[41] === "D" ? 1 : -1) * Number(l.slice(43, 55)), 0);
  verifier("Quadra : débits = crédits", solde === 0, String(solde));
  verifier("Quadra : enregistrements M de 251 caractères", m.every((l) => l.length === 251));

  console.log("");
  console.log("── Plan de comptes ──────────────────────────────────────────");
  const ancien = validerPlan({ journalVentes: "VE", clients: "411100" });
  verifier("un plan enregistré avant les achats reçoit les comptes par défaut", "plan" in ancien && ancien.plan.fournisseurs === "401000" && ancien.plan.journalAchats === "HA");
  const mauvaiseClasse = validerPlan({ tvaAutoliquidee: "445710" });
  verifier("TVA autoliquidée hors 4452 refusée", "erreur" in mauvaiseClasse);
  verifier("charge hors classe 60 refusée", "erreur" in validerPlan({ achatsServices: "706000" }));
  verifier("journal des achats identique aux ventes refusé", "erreur" in validerPlan({ journalAchats: "VT" }));

  verifier("taux déduit des totaux : 20 %", tauxDeduit(100, 20) === 20);
  verifier("taux déduit des totaux : 5,5 % malgré l'arrondi", tauxDeduit(37.9, 2.08) === 5.5);

  console.log("");
  console.log("── Réel : cours BCE et compte de test ───────────────────────");
  const c = await coursBce("USD", "2026-10-04");
  verifier("cours BCE d'un dimanche : celui du vendredi", c.date === "2026-10-02" && c.taux === 1.1225, JSON.stringify(c));

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: compte } = await admin.from("profiles").select("id").eq("email", "superpdp-test@getdeviso.fr").maybeSingle();
  const id = compte?.id as string;
  const lu = await chargerAchats(id, "2026");
  const achats = lu.achats;
  verifier("compte de test : aucun achat laissé de côté faute de cours", lu.nonRepris.length === 0, lu.nonRepris.join(" ; "));
  const { count: recuesAttendues } = await admin.from("superpdp_invoices").select("id", { count: "exact", head: true })
    .eq("user_id", id).eq("direction", "in").gte("issue_date", "2026-01-01").lte("issue_date", "2026-12-31").not("last_status_code", "in", "(fr:210,fr:213)");
  const { count: etrangersAttendus } = await admin.from("superpdp_achats_int").select("id", { count: "exact", head: true })
    .eq("user_id", id).gte("date_facture", "2026-01-01").lte("date_facture", "2026-12-31");
  verifier(
    "compte de test : toutes les factures reçues non refusées + tous les achats étrangers",
    achats.length === (recuesAttendues ?? -1) + (etrangersAttendus ?? -1),
    `${achats.length} chargés, ${recuesAttendues} reçues + ${etrangersAttendus} étrangers attendus`
  );
  // Exclusion des factures refusées : sur un compte réel qui en porte (choisi
  // par requête, aucune adresse écrite ici : le dépôt est public).
  const { data: refusees } = await admin.from("superpdp_invoices").select("user_id, issue_date, number")
    .eq("direction", "in").eq("last_status_code", "fr:210").limit(50);
  const { data: demos } = await admin.from("profiles").select("id").eq("is_demo", true).in("id", [...new Set((refusees ?? []).map((r) => r.user_id))]);
  const exemple = (refusees ?? []).find((r) => !(demos ?? []).some((d) => d.id === r.user_id));
  if (!exemple) {
    verifier("un compte réel porte une facture reçue refusée (sinon l'exclusion n'est pas éprouvée)", false);
  } else {
    const annee = exemple.issue_date.slice(0, 4);
    const charges = (await chargerAchats(exemple.user_id, annee)).achats;
    verifier("une facture reçue refusée n'entre pas en comptabilité", !charges.some((a) => a.ref === exemple.number && a.date === exemple.issue_date), exemple.number);
  }

  // Le cas COURANT, tel que le formulaire le fait saisir : TVA à 0 sur un
  // achat UE (« 0 en cas d'autoliquidation »). L'export doit CALCULER la TVA
  // autoliquidée ; la première version n'écrivait rien (revue du 20/11).
  // Le jeu de démonstration porte ces achats tels que le formulaire les fait
  // saisir (Allemagne, Italie, Pologne, TVA 0) : on le charge par le même
  // chemin que l'export.
  const demo = await openSession("achats-acompte");
  const achatsDemo = (await chargerAchats(demo.userId, "2026")).achats;
  const { data: saisis } = await admin.from("superpdp_achats_int")
    .select("numero, id, fournisseur_pays, categorie, montant_ht, montant_tva, devise")
    .eq("user_id", demo.userId).gte("date_facture", "2026-01-01").lte("date_facture", "2026-12-31");
  const ecrReel = ecrituresComptables([], PLAN_PAR_DEFAUT, achatsDemo);
  const ueSansTva = (saisis ?? []).filter((a) => Number(a.montant_tva) === 0 && a.devise === "EUR" && ["DE", "IT", "PL", "IE", "ES", "BE", "NL"].includes(a.fournisseur_pays));
  const refDe = (a: { numero: string | null; id: string }) => a.numero?.trim() || `ACHAT-${a.id.slice(0, 8)}`;
  verifier(
    `achats UE saisis avec TVA 0 (${ueSansTva.length}) : 4452 au crédit à ${TAUX_AUTOLIQUIDATION} % du HT`,
    ueSansTva.length > 0 && ueSansTva.every((a) => {
      const e = ecrReel.find((x) => x.ref === refDe(a));
      const due = e?.lignes.find((l) => l.compte === "445200");
      return !!due && Math.abs(due.credit - Math.round(Number(a.montant_ht) * TAUX_AUTOLIQUIDATION) / 100) < 0.01;
    }),
    ueSansTva.map(refDe).join(", ")
  );
  const importsHorsUe = (saisis ?? []).filter((a) => a.categorie === "biens" && ["US", "HK", "CN", "GB", "CH"].includes(a.fournisseur_pays) && Number(a.montant_tva) === 0);
  verifier(
    "biens achetés hors UE (importation) : aucune TVA sur la facture",
    importsHorsUe.every((a) => !ecrReel.find((x) => x.ref === refDe(a))?.lignes.some((l) => l.compte.startsWith("445"))),
    importsHorsUe.map(refDe).join(", ") || "aucun dans le jeu de test"
  );

  const { data: usd } = await admin.from("superpdp_achats_int").select("montant_ht, taux_change, montant_ht_eur").eq("user_id", id).neq("devise", "EUR");
  verifier(
    "achats en devise : cours fixé et montant en euros enregistré",
    (usd ?? []).length > 0 && (usd ?? []).every((a) => a.taux_change > 0 && Math.abs(a.montant_ht_eur - a.montant_ht / a.taux_change) < 0.01),
    JSON.stringify(usd)
  );
  const fecReel = genererFec([], PLAN_PAR_DEFAUT, achats).split("\r\n").slice(1).map((l) => l.split("\t"));
  const ecart = fecReel.reduce((s, c) => s + Number(c[11].replace(",", ".")) - Number(c[12].replace(",", ".")), 0);
  verifier("FEC réel des achats : débits = crédits", Math.abs(ecart) < 0.005, ecart.toFixed(2));

  // ── 5. Les routes d'export, de bout en bout (serveur visé par E2E_BASE_URL) ──
  console.log("");
  console.log("── Routes : export du client et export du cabinet ───────────");
  const lireFec = (txt: string) => txt.split("\r\n").slice(1).filter(Boolean).map((l) => l.split("\t"));
  const r1 = await demo.call("/api/export/fec?year=2026");
  const fecClient = typeof r1.body === "string" ? r1.body : "";
  // `call` tronque le texte non JSON : on relit le fichier entier.
  const brut = await fetch(`${process.env.E2E_BASE_URL || "https://getdeviso.fr"}/api/export/fec?year=2026`, { headers: { cookie: demo.cookie } });
  const lignesClient = lireFec(await brut.text());
  const pieces = new Set(lignesClient.filter((c) => c[0] === "HA").map((c) => c[2]));
  verifier("export du client : HTTP 200", r1.status === 200 && fecClient.startsWith("JournalCode"), `HTTP ${r1.status}`);
  verifier(`export du client : une écriture HA par achat (${achatsDemo.length})`, pieces.size === achatsDemo.length && achatsDemo.length > 0, `${pieces.size} écritures`);
  const ecartClient = lignesClient.reduce((s, c) => s + Number(c[11].replace(",", ".")) - Number(c[12].replace(",", ".")), 0);
  verifier("export du client : débits = crédits sur tout le fichier", Math.abs(ecartClient) < 0.005, ecartClient.toFixed(2));
  verifier("export du client : TVA autoliquidée présente", lignesClient.some((c) => c[4] === "445200"));
  const somme = (compte: string, col: number, piece?: RegExp) =>
    lignesClient.filter((c) => c[4] === compte && (!piece || piece.test(c[8]))).reduce((s, c) => s + Number(c[col].replace(",", ".")), 0);
  // Le régime du dossier décide : avance HT et TVA déduite une fois (600), ou,
  // en franchise, avance TTC et aucune TVA déduite.
  const { data: regime } = await admin.from("profiles").select("tva_regime").eq("id", demo.userId).maybeSingle();
  const enFranchise = regime?.tva_regime === "franchise";
  const avance = enFranchise ? 1200 : 1000;
  verifier(`export du client : l'avance de l'acompte démo est soldée (409100, ${avance} / ${avance}${enFranchise ? ", franchise" : ""})`,
    somme("409100", 11) === avance && somme("409100", 12) === avance, `débit ${somme("409100", 11)} crédit ${somme("409100", 12)}`);
  verifier(`export du client : TVA de l'acompte et du solde déduite ${enFranchise ? "jamais (franchise)" : "une fois (600)"}`,
    Math.abs(somme("445660", 11, /^MA-2026-/) - (enFranchise ? 0 : 600)) < 0.005, String(somme("445660", 11, /^MA-2026-/)));
  const soldeLigne = lignesClient.find((c) => c[8] === "MA-2026-0118" && c[4] === "401000");
  verifier("export du client : le fournisseur n'est dû que du reste (2 400)", soldeLigne?.[12] === "2400,00", soldeLigne?.[12]);

  const cab = await openSession("achats-cabinet");
  await admin.from("team_members").delete().eq("owner_id", demo.userId).eq("member_id", cab.userId);
  await admin.from("team_members").insert({ owner_id: demo.userId, member_id: cab.userId, email: cab.authEmail ?? "cabinet@example.com", role: "comptable", status: "active", accepted_at: new Date().toISOString() });
  const base = process.env.E2E_BASE_URL || "https://getdeviso.fr";
  const fecCab = await fetch(`${base}/api/cabinet/export?format=fec&year=2026&clients=${demo.userId}`, { headers: { cookie: cab.cookie } });
  const lignesCab = lireFec(await fecCab.text());
  verifier("export du cabinet (FEC) : mêmes écritures d'achat que le client",
    fecCab.status === 200 && new Set(lignesCab.filter((c) => c[0] === "HA").map((c) => c[2])).size === pieces.size, `HTTP ${fecCab.status}`);
  const qCab = await fetch(`${base}/api/cabinet/export?format=quadra&year=2026&clients=${demo.userId}`, { headers: { cookie: cab.cookie } });
  const lignesQ = (await qCab.text()).split("\r\n").filter(Boolean);
  verifier("export du cabinet (Quadra) : fournisseurs en type F, collectif 401",
    qCab.status === 200 && lignesQ.some((l) => l[0] === "C" && l[217] === "F" && l.slice(98, 106) === "40100000"), `HTTP ${qCab.status}`);
  const etranger = await openSession("achats-intrus");
  const intrus = await fetch(`${base}/api/cabinet/export?format=fec&year=2026&clients=${demo.userId}`, { headers: { cookie: etranger.cookie } });
  verifier("un compte sans accès ne lit pas les achats du dossier", intrus.status === 404 || intrus.status === 403, `HTTP ${intrus.status}`);
  await admin.from("team_members").delete().eq("owner_id", demo.userId).eq("member_id", cab.userId);

  // ── 6. Tous les régimes d'entreprise, par la route (20/11/2026) ──
  // Régime de TVA (dont « non renseigné », qui vaut franchise comme partout
  // ailleurs) × statut juridique (qui ne doit RIEN changer aux écritures).
  console.log("");
  console.log("── Acompte / solde pour chaque régime d'entreprise ──────────");
  const { data: avant } = await admin.from("profiles").select("tva_regime, statut_juridique").eq("id", demo.userId).maybeSingle();
  const REGIMES = ["franchise", null, "normal", "intermediaire", "reduit", "super_reduit"] as const;
  const STATUTS = ["micro", "ei_reel", "societe", null] as const;
  for (const regime of REGIMES) {
    const franchiseAttendue = regime === null || regime === "franchise";
    const fichiers = new Set<string>();
    let ok = true;
    let detail = "";
    for (const statut of STATUTS) {
      await admin.from("profiles").update({ tva_regime: regime, statut_juridique: statut }).eq("id", demo.userId);
      const r = await fetch(`${base}/api/export/fec?year=2026`, { headers: { cookie: demo.cookie } });
      const texte = await r.text();
      const lignes = lireFec(texte);
      const sum = (compte: string, col: number, piece: RegExp) =>
        lignes.filter((c) => c[4] === compte && piece.test(c[8])).reduce((s, c) => s + Number(c[col].replace(",", ".")), 0);
      const avance = franchiseAttendue ? 1200 : 1000;
      const tvaMa = sum("445660", 11, /^MA-2026-/);
      const charge = sum("604000", 11, /^MA-2026-0118$/);
      const reste = sum("401000", 12, /^MA-2026-0118$/);
      const equilibre = Math.abs(lignes.reduce((s, c) => s + Number(c[11].replace(",", ".")) - Number(c[12].replace(",", ".")), 0)) < 0.005;
      const bon = r.status === 200 && sum("409100", 11, /^MA-/) === avance && sum("409100", 12, /^MA-/) === avance
        && Math.abs(tvaMa - (franchiseAttendue ? 0 : 600)) < 0.005 && charge === (franchiseAttendue ? 3600 : 3000) && reste === 2400 && equilibre;
      if (!bon) { ok = false; detail += `[${statut ?? "statut vide"} : HTTP ${r.status}, avance ${sum("409100", 11, /^MA-/)}, TVA ${tvaMa}, charge ${charge}, reste ${reste}, équilibre ${equilibre}] `; }
      fichiers.add(texte);
    }
    verifier(
      `régime ${regime ?? "non renseigné"} : ${franchiseAttendue ? "franchise (avance TTC, aucune TVA déduite)" : "assujetti (avance HT, TVA déduite une fois)"}, pour micro, EI au réel, société et statut vide`,
      ok, detail
    );
    verifier(`régime ${regime ?? "non renseigné"} : le statut juridique ne change pas une ligne du FEC`, fichiers.size === 1, `${fichiers.size} versions différentes`);
  }
  await admin.from("profiles").update({ tva_regime: avant?.tva_regime ?? null, statut_juridique: avant?.statut_juridique ?? null }).eq("id", demo.userId);

  console.log("");
  process.exit(bilan() > 0 ? 1 : 0);
})();
