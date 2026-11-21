/**
 * Banc d'essai comptable : chaque scénario de scripts/scenarios/catalogue.ts
 * est joué de bout en bout sur la vraie application, sans facture réelle.
 *
 *  1. les factures reçues fictives sont validées contre le schéma officiel de
 *     la plateforme (une facture qui n'a pas la forme du réel est refusée) ;
 *  2. elles sont injectées dans un compte de démonstration jetable, avec les
 *     achats à l'étranger et les ventes (créées par l'API, comme un
 *     utilisateur) ;
 *  3. on télécharge les vrais exports par les routes : FEC du client, FEC et
 *     Quadra du cabinet, archive du portefeuille du cabinet ;
 *  4. on compare aux écritures attendues, et on contrôle des invariants
 *     valables pour tout export (équilibre, chronologie, numérotation,
 *     cabinet = client, Quadra = FEC, aucune alerte inattendue).
 *
 * Lancer : npx -y tsx scripts/e2e/scenarios.ts [nom-de-scenario]
 * (E2E_BASE_URL=http://localhost:3000 pour viser un serveur local)
 */
import { readFileSync, existsSync } from "node:fs";
import { openSession, verifier, bilan, BASE } from "./lib.mjs";
import { SCENARIOS, type Montant, type Scenario } from "../scenarios/catalogue";
import { ligneSuperpdp, validerEnInvoice, enInvoice } from "../scenarios/facture-recue";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const nb = (s: string) => Number((s || "0").replace(",", "."));
const egal = (a: number, b: number) => Math.abs(a - b) < 0.005;

(async () => {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { coursBce } = await import("@/lib/achats-export");
  const { compteQuadra } = await import("@/lib/export-quadra");
  const { syntheseDossiers } = await import("@/lib/cabinet-dossiers");
  const admin = createAdminClient();
  const filtre = process.argv[2];

  // La déclaration à la plateforme dit la même chose que la comptabilité : un
  // compte de démonstration ne transmet jamais, on contrôle donc le contenu
  // envoyé directement, pour chaque TVA de facture (21/11/2026).
  {
    const { construirePayloadB2bint } = await import("@/lib/superpdp-achats");
    const nous = { number: "552100554", scheme_id: "0002", country: "FR", vat: "FR61552100554" };
    const base = { fournisseur_pays: "DE", fournisseur_tva: "DE811569869", numero: "P-1", date_facture: "2023-07-01", devise: "EUR", montant_ht: 1000, id: "00000000-0000-0000-0000-000000000000" };
    const cas: [string, Record<string, unknown>, string, string][] = [
      ["aucune TVA", { ...base, montant_tva: 0, taux_tva: 0, tva_facturee: "aucune" }, "AE", "0.00"],
      ["TVA française", { ...base, montant_tva: 200, taux_tva: 20, tva_facturee: "francaise" }, "S", "200.00"],
      ["TVA étrangère", { ...base, montant_tva: 190, taux_tva: 19, tva_facturee: "etrangere" }, "S", "190.00"],
      ["achat saisi avant le choix, sans TVA", { ...base, montant_tva: 0, taux_tva: 0, tva_facturee: null }, "AE", "0.00"],
      ["achat saisi avant le choix, avec TVA", { ...base, montant_tva: 190, taux_tva: 19, tva_facturee: null }, "S", "190.00"],
    ];
    for (const [nom, achat, code, montant] of cas) {
      const st = (construirePayloadB2bint(achat as never, nous, "9930").data[0].tax_subtotals[0]) as unknown as { tax_amount: string; tax_category: { code: string } };
      verifier(`déclaration, ${nom} : catégorie ${code}, TVA ${montant}`, st.tax_category.code === code && st.tax_amount === montant, JSON.stringify(st));
    }
    // Biens de l'UE sans TVA : acquisition intracommunautaire (K) ; avoir : 381.
    const biensUe = construirePayloadB2bint({ ...base, categorie: "biens", montant_tva: 0, taux_tva: 0, tva_facturee: "aucune" } as never, nous, "9930").data[0];
    verifier("déclaration, biens de l'UE sans TVA : catégorie K (VATEX-EU-IC)", (biensUe.tax_subtotals[0].tax_category as { code?: string }).code === "K" && (biensUe.tax_subtotals[0].tax_category as { exemption_reason_code?: string }).exemption_reason_code === "VATEX-EU-IC", JSON.stringify(biensUe.tax_subtotals[0]));
    const avoirDecl = construirePayloadB2bint({ ...base, montant_tva: 0, taux_tva: 0, tva_facturee: "aucune", est_avoir: true } as never, nous, "9930").data[0];
    verifier("déclaration, avoir : type 381, montants positifs", avoirDecl.type_code === "381" && avoirDecl.total.tax_exclusive_amount === "1000.00", JSON.stringify({ t: avoirDecl.type_code, m: avoirDecl.total }));
    // Schéma du vendeur : celui de l'État qui a attribué son n° de TVA.
    const { schemaVendeur } = await import("@/lib/superpdp-achats");
    verifier("schéma du vendeur : n° français d'un fournisseur allemand = schéma français (9957)", schemaVendeur("DE", "FR40303265045") === "9957");
    verifier("schéma du vendeur : préfixe EL = Grèce (9933)", schemaVendeur("GR", "EL094259216") === "9933");
    verifier("schéma du vendeur : n° allemand = schéma allemand (9930)", schemaVendeur("DE", "DE811569869") === "9930");
    verifier("schéma du vendeur : identifiant hors UE sans préfixe d'État = aucun schéma TVA", schemaVendeur("US", "98-7654321") === null);
    // Déclaration existante : reconnue au numéro ET au fournisseur, confirmée
    // par la date et le HT ; le numéro seul ne prouve rien.
    const { rapprocherDeclaration } = await import("@/lib/superpdp-achats");
    const achatR = { numero: "1001", id: "x", fournisseur_tva: "IE6388047V", date_facture: "2023-05-01", montant_ht: 500 };
    const decl = (o: Record<string, unknown>) => ({ id: 9, number: "1001", direction: "in", issue_date: "2023-05-01", seller: { company_id: "IE6388047V" }, total: { tax_exclusive_amount: "500.00" }, ...o });
    verifier("déclaration identique reconnue", rapprocherDeclaration([decl({})], achatR).etat === "identique");
    verifier("même numéro chez un autre fournisseur : absent (jamais « transmis » par erreur)", rapprocherDeclaration([decl({ seller: { company_id: "DE811569869" } })], achatR).etat === "absent");
    verifier("même numéro et fournisseur, autre montant : ambigu", rapprocherDeclaration([decl({ total: { tax_exclusive_amount: "600.00" } })], achatR).etat === "ambigu");
    verifier("fournisseur illisible dans la liste : ambigu", rapprocherDeclaration([decl({ seller: {} })], achatR).etat === "ambigu");
    // Périmètre (CGI art. 290, I-3° ; BOI-TVA-DECLA-20-30-50-10 § 60).
    const { motifHorsChamp } = await import("@/lib/achats-tva");
    verifier("périmètre : TVA étrangère hors champ", !!motifHorsChamp({ tva_facturee: "etrangere", montant_tva: 19, categorie: "services", fournisseur_pays: "DE" }));
    verifier("périmètre : importation hors champ", !!motifHorsChamp({ tva_facturee: "aucune", montant_tva: 0, categorie: "biens", fournisseur_pays: "US" }));
    verifier("périmètre : services hors UE sans TVA déclarés", motifHorsChamp({ tva_facturee: "aucune", montant_tva: 0, categorie: "services", fournisseur_pays: "US" }) === null);
    verifier("périmètre : biens UE sans TVA déclarés", motifHorsChamp({ tva_facturee: "aucune", montant_tva: 0, categorie: "biens", fournisseur_pays: "DE" }) === null);
    verifier("périmètre : sans TVA, hors de France, hors champ", !!motifHorsChamp({ tva_facturee: "hors_france", montant_tva: 0, categorie: "services", fournisseur_pays: "US" }));
    verifier("périmètre : TVA française déclarée", motifHorsChamp({ tva_facturee: "francaise", montant_tva: 20, categorie: "biens", fournisseur_pays: "US" }) === null);
  }
  const scenarios = SCENARIOS.filter((s) => !filtre || filtre.split(",").includes(s.nom));

  // ── Comptes : le dossier joué, un second dossier vide, un cabinet ─────────
  const client = await openSession("banc-client");
  const autre = await openSession("banc-autre");
  const cabinet = await openSession("banc-cabinet");
  const { data: estDemo } = await admin.from("profiles").select("id, is_demo, company_name, full_name").in("id", [client.userId, autre.userId]);
  if ((estDemo ?? []).length !== 2 || (estDemo ?? []).some((p) => !p.is_demo)) {
    console.error("Refus : le banc n'écrit que dans des comptes de démonstration.");
    process.exit(1);
  }
  for (const dossier of [client.userId, autre.userId]) {
    await admin.from("team_members").delete().eq("owner_id", dossier).eq("member_id", cabinet.userId);
    await admin.from("team_members").insert({ owner_id: dossier, member_id: cabinet.userId, email: cabinet.authEmail ?? "cabinet@example.com", role: "comptable", status: "active", accepted_at: new Date().toISOString() });
  }
  const pClient = (estDemo ?? []).find((p) => p.id === client.userId);
  const nomDossier = pClient?.company_name || pClient?.full_name || "Dossier";

  const resoudre = async (m: Montant | undefined): Promise<number | undefined> => {
    if (m === undefined || typeof m === "number") return m;
    const c = await coursBce(m.devise, m.date);
    return Math.round((m.montant / c.taux) * 100) / 100;
  };
  const telecharger = async (chemin: string, cookie: string) => {
    const r = await fetch(`${BASE}${chemin}`, { headers: { cookie } });
    return { status: r.status, octets: new Uint8Array(await r.arrayBuffer()) };
  };
  const texte = (o: Uint8Array) => new TextDecoder("utf-8").decode(o);

  for (const sc of scenarios) {
    console.log("");
    console.log(`── ${sc.nom} ${"─".repeat(Math.max(2, 56 - sc.nom.length))}`);
    console.log(`   ${sc.pourquoi}`);
    const an = Number(sc.annee);
    const debut = `${an - 1}-01-01`;
    const fin = `${an}-12-31`;

    // 1. Forme des factures reçues, contre le schéma de la plateforme.
    let formeOk = true;
    for (const f of sc.recues ?? []) {
      const erreurs = validerEnInvoice(enInvoice(f, "Dossier"));
      if (erreurs.length) { formeOk = false; verifier(`${f.numero} a la forme d'une facture de la plateforme`, false, erreurs.slice(0, 3).join(" ; ")); }
    }
    if (!formeOk) continue;

    // 2. Remise à zéro du dossier sur la période, puis injection.
    await admin.from("superpdp_invoices").delete().eq("user_id", client.userId).eq("direction", "in").gte("issue_date", debut).lte("issue_date", fin);
    await admin.from("superpdp_achats_int").delete().eq("user_id", client.userId).gte("date_facture", debut).lte("date_facture", fin);
    const { error: eVentes } = await admin.from("invoices").delete().eq("user_id", client.userId).gte("issue_date", debut).lte("issue_date", fin);
    if (eVentes) { verifier("remise à zéro des ventes de la période", false, eVentes.message); continue; }
    await admin.from("profiles").update({ tva_regime: sc.dossier.tva_regime, statut_juridique: sc.dossier.statut_juridique ?? null }).eq("id", client.userId);

    if (sc.recues?.length) {
      const lignes = sc.recues.map((f) => ligneSuperpdp(f, client.userId, 600_000_000_000 + Math.floor(Math.random() * 90_000_000_000), "Dossier"));
      const { error } = await admin.from("superpdp_invoices").insert(lignes);
      if (error) { verifier("injection des factures reçues", false, error.message); continue; }
    }
    // Taux d'autoliquidation choisis sur des factures reçues, par la route de l'écran.
    for (const t of sc.tauxAe ?? []) {
      const { data: fr } = await admin.from("superpdp_invoices").select("id").eq("user_id", client.userId).eq("direction", "in").eq("number", t.numero).maybeSingle();
      if (!fr) { verifier(t.numero + " injectée avant le choix du taux", false); continue; }
      const r = await client.call("/api/superpdp/factures-recues/" + fr.id, { method: "PATCH", body: JSON.stringify({ taux_autoliquidation: t.taux }) });
      verifier("taux d'autoliquidation de " + t.numero + " : HTTP " + t.status, r.status === t.status, "HTTP " + r.status + " " + JSON.stringify(r.body).slice(0, 140));
    }
    // Achats saisis comme l'écran les envoie : par la route de saisie (validation,
    // enregistrement), le reste injecté en base.
    let saisieOk = true;
    for (const a of (sc.etrangers ?? []).filter((x) => x.parRoute)) {
      const r = await client.call("/api/superpdp/achats", { method: "POST", body: JSON.stringify({
        fournisseur_nom: a.fournisseur, fournisseur_pays: a.pays, fournisseur_tva: a.tva ?? null, numero: a.numero,
        date_facture: a.date, categorie: a.categorie, devise: a.devise ?? "EUR", montant_ht: a.ht,
        taux_tva: a.taux_tva ?? 0, montant_tva: a.montant_tva ?? 0,
        ...(a.tva_facturee ? { tva_facturee: a.tva_facturee } : {}),
        ...(a.taux_autoliquidation !== undefined ? { taux_autoliquidation: a.taux_autoliquidation } : {}),
        ...(a.avoir ? { est_avoir: true } : {}),
      }) });
      const attendu = a.refuse ?? 200;
      verifier(`saisie de ${a.numero} par la route : HTTP ${attendu}`, r.status === attendu, `HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
      if (a.statutApresSaisie && r.status === 200) {
        verifier(`${a.numero} : statut « ${a.statutApresSaisie} » après la saisie`, r.body?.achat?.transmission_status === a.statutApresSaisie, String(r.body?.achat?.transmission_status));
      }
      if (attendu === 200 && r.status !== 200) saisieOk = false;
    }
    if (!saisieOk) continue;
    const enBase = (sc.etrangers ?? []).filter((x) => !x.parRoute);
    if (enBase.length) {
      const { error } = await admin.from("superpdp_achats_int").insert(enBase.map((a) => ({
        user_id: client.userId, fournisseur_nom: a.fournisseur, fournisseur_pays: a.pays, fournisseur_tva: a.tva ?? null,
        numero: a.numero, date_facture: a.date, categorie: a.categorie, devise: a.devise ?? "EUR",
        montant_ht: a.ht, taux_tva: a.taux_tva ?? 0, montant_tva: a.montant_tva ?? 0,
        transmission_status: a.statut ?? "en_attente", retry_count: 0,
        ...(a.tva_facturee ? { tva_facturee: a.tva_facturee } : {}),
        ...(a.taux_autoliquidation !== undefined ? { taux_autoliquidation: a.taux_autoliquidation } : {}),
        ...(a.avoir ? { est_avoir: true } : {}),
        ...(a.statut === "transmis" ? { superpdp_id: 700_000_000 + Math.floor(Math.random() * 90_000_000), transmitted_at: new Date().toISOString() } : {}),
        ...(a.statut === "echec" || a.statut === "action_requise" ? { transmission_error: "Refus simulé par le banc d'essai" } : {}),
      })));
      if (error) { verifier("injection des achats à l'étranger", false, error.message); continue; }
    }
    // Suppressions demandées par le titulaire, par la route, comme l'écran.
    for (const sup of sc.supprimer ?? []) {
      const { data: cible } = await admin.from("superpdp_achats_int").select("id").eq("user_id", client.userId).eq("numero", sup.numero).maybeSingle();
      if (!cible) { verifier(`${sup.numero} injecté avant suppression`, false); continue; }
      const r = await client.call(`/api/superpdp/achats/${cible.id}`, { method: "DELETE" });
      verifier(`suppression de ${sup.numero} : HTTP ${sup.status} attendu`, r.status === sup.status, `HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 140)}`);
      const { data: reste } = await admin.from("superpdp_achats_int").select("id").eq("id", cible.id).maybeSingle();
      verifier(`${sup.numero} ${sup.status === 200 ? "retiré" : "toujours"} en base`, sup.status === 200 ? !reste : !!reste);
    }
    for (const v of sc.ventes ?? []) {
      const cree = await client.call("/api/invoices", { method: "POST", body: JSON.stringify({
        client_name: v.client, client_company: v.client, client_email: "banc@example.fr", client_siren: v.siren ?? null,
        client_street: "1 rue du Banc", client_postcode: "33000", client_city: "Bordeaux",
        items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: v.ht, total: v.ht }],
        total_ht: v.ht, tva_rate: v.taux, total_ttc: Math.round(v.ht * (1 + v.taux / 100) * 100) / 100,
        issue_date: v.date, due_date: v.date, operation_category: v.categorie ?? "services", type_code: "380", invoice_type: "standard",
      }) });
      const id = cree.body?.invoice?.id;
      if (!id) { verifier("création d'une vente par l'API", false, `HTTP ${cree.status} ${JSON.stringify(cree.body).slice(0, 120)}`); continue; }
      await client.call(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
      if (v.payeeLe) await client.call(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "paid", paid_at: v.payeeLe, payment_mode: "virement" }) });
    }

    if (sc.ventesEnMasse) {
      const m = sc.ventesEnMasse;
      const ttc = Math.round(m.ht * (1 + m.taux / 100) * 100) / 100;
      const rows = Array.from({ length: m.nombre }, (_, k) => ({
        user_id: client.userId, invoice_number: `BANC-${sc.annee}-${String(k + 1).padStart(5, "0")}`,
        client_name: "Client Masse", client_company: "Client Masse", client_email: "banc@example.fr",
        items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: m.ht, total: m.ht }],
        total_ht: m.ht, tva_rate: m.taux, total_ttc: ttc, issue_date: m.date, due_date: m.date,
        status: "sent", operation_category: "services", type_code: "380", invoice_type: "standard",
      }));
      let erreur = "";
      for (let k = 0; k < rows.length && !erreur; k += 500) {
        const { error } = await admin.from("invoices").insert(rows.slice(k, k + 500));
        if (error) erreur = error.message;
      }
      if (erreur) { verifier("injection des ventes en masse", false, erreur); continue; }
    }
    // Plan de comptes du cabinet, par la route de son écran de réglage.
    if (sc.planCabinet) {
      const r = await cabinet.call("/api/profile", { method: "PATCH", body: JSON.stringify({ plan_comptes_fec: sc.planCabinet.plan }) });
      verifier(`plan du cabinet : HTTP ${sc.planCabinet.status} attendu`, r.status === sc.planCabinet.status, `HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
    }

    // 3. Les vrais exports.
    const fecClient = await telecharger(`/api/export/fec?year=${sc.annee}`, client.cookie);
    const fecCabinet = await telecharger(`/api/cabinet/export?format=fec&year=${sc.annee}&clients=${client.userId}`, cabinet.cookie);
    const quadra = await telecharger(`/api/cabinet/export?format=quadra&year=${sc.annee}&clients=${client.userId}`, cabinet.cookie);
    const archive = await telecharger(`/api/cabinet/export?format=fec&year=${sc.annee}&clients=${client.userId},${autre.userId}`, cabinet.cookie);
    if (fecClient.status !== 200 || fecCabinet.status !== 200 || quadra.status !== 200 || archive.status !== 200) {
      verifier("exports téléchargés", false, `client ${fecClient.status}, cabinet ${fecCabinet.status}, quadra ${quadra.status}, archive ${archive.status} ${texte(fecClient.octets).slice(0, 160)}`);
      continue;
    }
    const brut = texte(fecClient.octets);
    const lignes = brut.split("\r\n").slice(1).filter(Boolean).map((l) => l.split("\t"));

    // 4a. Invariants, valables pour tout export.
    verifier("FEC : 18 colonnes sur chaque ligne", lignes.every((c) => c.length === 18));
    const parEcriture = new Map<string, number>();
    for (const c of lignes) parEcriture.set(c[2], (parEcriture.get(c[2]) ?? 0) + nb(c[11]) - nb(c[12]));
    const boiteuses = [...parEcriture].filter(([, s]) => !egal(s, 0)).map(([n]) => n);
    verifier("FEC : chaque écriture est équilibrée", boiteuses.length === 0, boiteuses.join(", "));
    verifier("FEC : ordre chronologique", lignes.every((c, i) => i === 0 || lignes[i - 1][3] <= c[3]));
    const numeros = new Map<string, number[]>();
    for (const c of lignes) { const l = numeros.get(c[0]) ?? []; const n = Number(c[2].slice(c[0].length)); if (l[l.length - 1] !== n) l.push(n); numeros.set(c[0], l); }
    verifier("FEC : numérotation continue dans chaque journal", [...numeros.values()].every((l) => l.every((n, i) => n === i + 1)));
    verifier("FEC du cabinet identique à celui du client", texte(fecCabinet.octets) === brut);

    const mq = texte(quadra.octets).split("\r\n").filter((l) => l[0] === "M");
    const qParCompte = new Map<string, number>();
    for (const l of mq) { const k = /^[0-9]/.test(l.slice(1, 9)) ? l.slice(1, 9) : "aux"; qParCompte.set(k, (qParCompte.get(k) ?? 0) + (l[41] === "D" ? 1 : -1) * Number(l.slice(43, 55)) / 100); }
    const fParCompte = new Map<string, number>();
    for (const c of lignes) { const k = c[6] ? "aux" : compteQuadra(c[4]); fParCompte.set(k, (fParCompte.get(k) ?? 0) + nb(c[11]) - nb(c[12])); }
    const ecartsQ = [...new Set([...qParCompte.keys(), ...fParCompte.keys()])].filter((k) => !egal(qParCompte.get(k) ?? 0, fParCompte.get(k) ?? 0));
    verifier("Quadra : mêmes soldes que le FEC, compte par compte", ecartsQ.length === 0, ecartsQ.map((k) => `${k} FEC ${fParCompte.get(k)} / Quadra ${qParCompte.get(k)}`).join(", "));
    verifier("Quadra : enregistrements M de 251 caractères", mq.every((l) => l.length === 251));

    // Alertes « à vérifier » de la note de l'archive : chacune attendue, aucune autre.
    const zip = texte(archive.octets);
    const acomptes = (zip.match(/acompte correspondant non retrouvé/g) ?? []).length;
    if (sc.attendu.aVerifier !== undefined) verifier(`soldes à vérifier : ${sc.attendu.aVerifier} attendu(s)`, acomptes === sc.attendu.aVerifier, `${acomptes} trouvé(s)`);
    const note = zip.match(/doit vérifier[^\n]*\r\n((?:- [^\r\n]*\r\n)+)/)?.[1] ?? "";
    const lignesNote = note.split("\r\n").filter((l) => l.startsWith(`- ${nomDossier} : `));
    const attendues = sc.attendu.alertes ?? (sc.attendu.aVerifier ? Array(sc.attendu.aVerifier).fill("acompte correspondant non retrouvé") : []);
    verifier(`alertes « à vérifier » : ${attendues.length} attendue(s)`, lignesNote.length === attendues.length, lignesNote.join(" | ") || "aucune");
    for (const a of new Set(attendues)) {
      verifier(`alerte « ${a} »`, lignesNote.filter((l) => l.includes(a)).length === attendues.filter((x) => x === a).length, lignesNote.join(" | ") || "aucune");
    }
    // Les mêmes alertes AVANT le téléchargement : la fenêtre d'export les lit
    // par cette route, et la fiche du dossier les montre dans ses anomalies.
    const avant = await cabinet.call(`/api/cabinet/export/alertes?year=${sc.annee}&clients=${client.userId}`);
    const listeAvant: string[] = (avant.body?.dossiers ?? []).flatMap((d: { aVerifier: string[] }) => d.aVerifier);
    verifier(
      "fenêtre d'export : mêmes alertes que l'archive, avant le téléchargement",
      avant.status === 200 && listeAvant.length === lignesNote.length && lignesNote.every((l) => listeAvant.some((t) => l.endsWith(t))),
      `HTTP ${avant.status}, ${listeAvant.join(" | ") || "aucune"}`
    );
    const [synthese] = await syntheseDossiers(admin, [client.userId], new Date(`${sc.annee}-12-31T12:00:00Z`));
    const dansAnomalies = (synthese?.anomalies ?? []).filter((x) => x.libelle.startsWith(`Achats ${sc.annee} à vérifier`));
    verifier(
      "anomalies du dossier côté cabinet : mêmes alertes",
      dansAnomalies.length === Math.min(listeAvant.length, 5) && dansAnomalies.every((x) => listeAvant.some((t) => x.libelle.endsWith(t))),
      dansAnomalies.map((x) => x.libelle).join(" | ") || "aucune"
    );

    // 4b. Ce que le scénario attend.
    const somme = (filtreLigne: (c: string[]) => boolean, col: number) => lignes.filter(filtreLigne).reduce((s, c) => s + nb(c[col]), 0);
    for (const [piece, comptes] of Object.entries(sc.attendu.pieces ?? {})) {
      for (const [compte, sens] of Object.entries(comptes)) {
        const d = somme((c) => c[8] === piece && c[4] === compte, 11);
        const cr = somme((c) => c[8] === piece && c[4] === compte, 12);
        const attD = await resoudre(sens.debit);
        const attC = await resoudre(sens.credit);
        verifier(
          `${piece} · ${compte}${attD !== undefined ? ` débit ${attD}` : ""}${attC !== undefined ? ` crédit ${attC}` : ""}`,
          (attD === undefined || egal(d, attD)) && (attC === undefined || egal(cr, attC)),
          `obtenu débit ${d.toFixed(2)} crédit ${cr.toFixed(2)}`
        );
      }
    }
    for (const [compte, sens] of Object.entries(sc.attendu.comptes ?? {})) {
      const d = somme((c) => c[4] === compte, 11);
      const cr = somme((c) => c[4] === compte, 12);
      const attD = await resoudre(sens.debit);
      const attC = await resoudre(sens.credit);
      verifier(
        `fichier · ${compte}${attD !== undefined ? ` débit ${attD}` : ""}${attC !== undefined ? ` crédit ${attC}` : ""}`,
        (attD === undefined || egal(d, attD)) && (attC === undefined || egal(cr, attC)),
        `obtenu débit ${d.toFixed(2)} crédit ${cr.toFixed(2)}`
      );
    }
    for (const piece of sc.attendu.absentes ?? []) verifier(`${piece} absente du FEC`, !lignes.some((c) => c[8] === piece));
    if (sc.planCabinet) await cabinet.call("/api/profile", { method: "PATCH", body: JSON.stringify({ plan_comptes_fec: null }) });
  }

  // Le banc laisse les dossiers comme il les a trouvés : les liens du cabinet sont retirés.
  for (const dossier of [client.userId, autre.userId]) await admin.from("team_members").delete().eq("owner_id", dossier).eq("member_id", cabinet.userId);
  console.log("");
  process.exit(bilan() > 0 ? 1 : 0);
})();
