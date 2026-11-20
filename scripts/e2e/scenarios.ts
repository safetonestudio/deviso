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
  const admin = createAdminClient();
  const filtre = process.argv[2];
  const scenarios = SCENARIOS.filter((s) => !filtre || s.nom === filtre);

  // ── Comptes : le dossier joué, un second dossier vide, un cabinet ─────────
  const client = await openSession("banc-client");
  const autre = await openSession("banc-autre");
  const cabinet = await openSession("banc-cabinet");
  const { data: estDemo } = await admin.from("profiles").select("id, is_demo, company_name").in("id", [client.userId, autre.userId]);
  if ((estDemo ?? []).length !== 2 || (estDemo ?? []).some((p) => !p.is_demo)) {
    console.error("Refus : le banc n'écrit que dans des comptes de démonstration.");
    process.exit(1);
  }
  for (const dossier of [client.userId, autre.userId]) {
    await admin.from("team_members").delete().eq("owner_id", dossier).eq("member_id", cabinet.userId);
    await admin.from("team_members").insert({ owner_id: dossier, member_id: cabinet.userId, email: cabinet.authEmail ?? "cabinet@example.com", role: "comptable", status: "active", accepted_at: new Date().toISOString() });
  }
  const nomDossier = (estDemo ?? []).find((p) => p.id === client.userId)?.company_name ?? "";

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
    if (sc.etrangers?.length) {
      const { error } = await admin.from("superpdp_achats_int").insert(sc.etrangers.map((a) => ({
        user_id: client.userId, fournisseur_nom: a.fournisseur, fournisseur_pays: a.pays, fournisseur_tva: a.tva ?? null,
        numero: a.numero, date_facture: a.date, categorie: a.categorie, devise: a.devise ?? "EUR",
        montant_ht: a.ht, taux_tva: a.taux_tva ?? 0, montant_tva: a.montant_tva ?? 0, transmission_status: "en_attente", retry_count: 0,
      })));
      if (error) { verifier("injection des achats à l'étranger", false, error.message); continue; }
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

    const zip = texte(archive.octets);
    const alertes = (zip.match(/acompte correspondant non retrouvé/g) ?? []).length;
    verifier(`alertes « à vérifier » : ${sc.attendu.aVerifier ?? 0} attendue(s)`, alertes === (sc.attendu.aVerifier ?? 0), `${alertes} trouvée(s)`);
    void nomDossier;

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
  }

  // Le banc laisse les dossiers comme il les a trouvés : les liens du cabinet sont retirés.
  for (const dossier of [client.userId, autre.userId]) await admin.from("team_members").delete().eq("owner_id", dossier).eq("member_id", cabinet.userId);
  console.log("");
  process.exit(bilan() > 0 ? 1 : 0);
})();
