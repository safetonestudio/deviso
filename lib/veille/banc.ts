import type { createAdminClient } from "@/lib/supabase/admin";
import { coursBce } from "@/lib/achats-export";
import { compteQuadra } from "@/lib/export-quadra";
import { syntheseDossiers } from "@/lib/cabinet-dossiers";
import { ligneSuperpdp } from "@/lib/facture-recue-fictive";
import type { Montant, Scenario } from "@/scripts/scenarios/catalogue";
import type { CompteJetable } from "./comptes";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Noyau serveur du banc d'essai comptable (scripts/e2e/scenarios.ts), pour la
 * veille quotidienne. Même catalogue, mêmes vraies routes, mêmes invariants :
 * injecter les pièces dans un compte de démonstration jetable, télécharger le
 * FEC du client, le FEC et le Quadra du cabinet et l'archive du portefeuille,
 * comparer à ce que la comptabilité DOIT dire.
 *
 * Attention : copie à tenir alignée sur scripts/e2e/scenarios.ts (alignée sur
 * `main` le 23/11/2026). `test:veille` joue tout le catalogue et échoue si un
 * scénario ne passe pas ici : un champ nouveau du catalogue que ce noyau
 * ignorerait se voit. Mieux, à terme : que le banc appelle ce noyau.
 *
 * Seule différence avec le banc : la forme des factures reçues n'est pas
 * revalidée ici contre le schéma de la plateforme (fichier de 1 Mo, contrôle
 * des données d'essai et non du produit, déjà fait par `test:scenarios`).
 *
 * Renvoie la liste des écarts : vide = le scénario passe.
 */
const nb = (s: string) => Number((s || "0").replace(",", "."));
const egal = (a: number, b: number) => Math.abs(a - b) < 0.005;

export async function jouerScenario(
  admin: Admin,
  sc: Scenario,
  comptes: { client: CompteJetable; autre: CompteJetable; cabinet: CompteJetable },
  base: string,
): Promise<string[]> {
  const ecarts: string[] = [];
  const verifier = (libelle: string, ok: boolean, detail = "") => {
    if (!ok) ecarts.push(detail ? `${libelle} (${detail})` : libelle);
  };
  const { client, autre, cabinet } = comptes;
  // Nom du dossier tel que l'archive le cite (profil du compte jetable).
  const nomDossier = "Veille, dossier client";
  const appel = (chemin: string, cookie: string, init: RequestInit = {}) =>
    fetch(`${base}${chemin}`, {
      ...init,
      redirect: "manual",
      headers: { cookie, ...(init.body ? { "content-type": "application/json" } : {}) },
    });
  const json = async (r: Response) => {
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { brut: t.slice(0, 160) }; }
  };
  const telecharger = async (chemin: string, cookie: string) => {
    const r = await appel(chemin, cookie);
    return { status: r.status, texte: new TextDecoder("utf-8").decode(new Uint8Array(await r.arrayBuffer())) };
  };
  const resoudre = async (m: Montant | undefined): Promise<number | undefined> => {
    if (m === undefined || typeof m === "number") return m;
    const c = await coursBce(m.devise, m.date);
    return Math.round((m.montant / c.taux) * 100) / 100;
  };

  const an = Number(sc.annee);
  const debut = `${an - 1}-01-01`;
  const fin = `${an}-12-31`;

  // Remise à zéro du dossier sur la période, puis injection.
  await admin.from("superpdp_invoices").delete().eq("user_id", client.userId).eq("direction", "in").gte("issue_date", debut).lte("issue_date", fin);
  await admin.from("superpdp_achats_int").delete().eq("user_id", client.userId).gte("date_facture", debut).lte("date_facture", fin);
  const { error: eVentes } = await admin.from("invoices").delete().eq("user_id", client.userId).gte("issue_date", debut).lte("issue_date", fin);
  if (eVentes) return [`remise à zéro des ventes (${eVentes.message})`];
  await admin.from("profiles").update({ tva_regime: sc.dossier.tva_regime, statut_juridique: sc.dossier.statut_juridique ?? null }).eq("id", client.userId);

  if (sc.recues?.length) {
    const lignes = sc.recues.map((f) => ligneSuperpdp(f, client.userId, 600_000_000_000 + Math.floor(Math.random() * 90_000_000_000), "Dossier"));
    const { error } = await admin.from("superpdp_invoices").insert(lignes);
    if (error) return [`injection des factures reçues (${error.message})`];
  }
  // Taux d'autoliquidation choisis sur des factures reçues, par la route de l'écran.
  for (const t of sc.tauxAe ?? []) {
    const { data: fr } = await admin.from("superpdp_invoices").select("id").eq("user_id", client.userId).eq("direction", "in").eq("number", t.numero).maybeSingle();
    if (!fr) { verifier(`${t.numero} injectée avant le choix du taux`, false); continue; }
    const r = await appel(`/api/superpdp/factures-recues/${fr.id}`, client.cookie, { method: "PATCH", body: JSON.stringify({ taux_autoliquidation: t.taux }) });
    verifier(`taux d'autoliquidation de ${t.numero} : HTTP ${t.status}`, r.status === t.status, `HTTP ${r.status}`);
  }
  // Achats saisis comme l'écran les envoie : par la route de saisie, le reste injecté en base.
  for (const a of (sc.etrangers ?? []).filter((x) => x.parRoute)) {
    const r = await appel("/api/superpdp/achats", client.cookie, { method: "POST", body: JSON.stringify({
      fournisseur_nom: a.fournisseur, fournisseur_pays: a.pays, fournisseur_tva: a.tva ?? null, numero: a.numero,
      date_facture: a.date, categorie: a.categorie, devise: a.devise ?? "EUR", montant_ht: a.ht,
      taux_tva: a.taux_tva ?? 0, montant_tva: a.montant_tva ?? 0,
      ...(a.tva_facturee ? { tva_facturee: a.tva_facturee } : {}),
      ...(a.taux_autoliquidation !== undefined ? { taux_autoliquidation: a.taux_autoliquidation } : {}),
      ...(a.avoir ? { est_avoir: true } : {}),
    }) });
    const corps = await json(r);
    const attendu = a.refuse ?? 200;
    if (r.status !== attendu) return [`saisie de ${a.numero} par la route : HTTP ${r.status} au lieu de ${attendu} (${JSON.stringify(corps).slice(0, 120)})`];
    if (a.statutApresSaisie && r.status === 200) {
      verifier(`${a.numero} : statut « ${a.statutApresSaisie} » après la saisie`, corps?.achat?.transmission_status === a.statutApresSaisie, String(corps?.achat?.transmission_status));
    }
  }
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
      ...(a.statut === "echec" || a.statut === "action_requise" ? { transmission_error: "Refus simulé par la veille" } : {}),
    })));
    if (error) return [`injection des achats à l'étranger (${error.message})`];
  }
  // Suppressions demandées par le titulaire, par la route, comme l'écran.
  for (const sup of sc.supprimer ?? []) {
    const { data: cible } = await admin.from("superpdp_achats_int").select("id").eq("user_id", client.userId).eq("numero", sup.numero).maybeSingle();
    if (!cible) { verifier(`${sup.numero} injecté avant suppression`, false); continue; }
    const r = await appel(`/api/superpdp/achats/${cible.id}`, client.cookie, { method: "DELETE" });
    verifier(`suppression de ${sup.numero} : HTTP ${sup.status} attendu`, r.status === sup.status, `HTTP ${r.status}`);
    const { data: reste } = await admin.from("superpdp_achats_int").select("id").eq("id", cible.id).maybeSingle();
    verifier(`${sup.numero} ${sup.status === 200 ? "retiré" : "toujours"} en base`, sup.status === 200 ? !reste : !!reste);
  }
  for (const v of sc.ventes ?? []) {
    const cree = await appel("/api/invoices", client.cookie, { method: "POST", body: JSON.stringify({
      client_name: v.client, client_company: v.client, client_email: "banc@example.fr", client_siren: v.siren ?? null,
      client_street: "1 rue du Banc", client_postcode: "33000", client_city: "Bordeaux",
      // Même construction que le banc local (scripts/e2e/scenarios.ts) : une vente
      // détaillée en lignes porte la nature de chacune, et la route en déduit la catégorie.
      items: v.lignes
        ? v.lignes.map((l, k) => ({ description: `${l.nature === "goods" ? "Article" : "Prestation"} ${k + 1}`, quantity: 1, unit: "forfait", unit_price: l.ht, total: l.ht, nature: l.nature }))
        : [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: v.ht, total: v.ht, nature: v.categorie === "goods" ? "goods" : "services" }],
      total_ht: v.ht, tva_rate: v.taux, total_ttc: Math.round(v.ht * (1 + v.taux / 100) * 100) / 100,
      issue_date: v.date, due_date: v.date, type_code: "380", invoice_type: "standard",
      ...(v.lignes ? {} : { operation_category: v.categorie ?? "services" }),
    }) });
    const corps = await json(cree);
    const id = corps?.invoice?.id;
    if (!id) return [`création d'une vente par l'API (HTTP ${cree.status} ${JSON.stringify(corps).slice(0, 120)})`];
    await appel(`/api/invoices/${id}`, client.cookie, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
    if (v.payeeLe) await appel(`/api/invoices/${id}`, client.cookie, { method: "PATCH", body: JSON.stringify({ status: "paid", paid_at: v.payeeLe, payment_mode: "virement" }) });
  }

  if (sc.ventesEnMasse) {
    const m = sc.ventesEnMasse;
    const ttc = Math.round(m.ht * (1 + m.taux / 100) * 100) / 100;
    const rows = Array.from({ length: m.nombre }, (_, k) => ({
      user_id: client.userId, invoice_number: `BANC-${sc.annee}-${String(k + 1).padStart(5, "0")}`,
      client_name: "Client Masse", client_company: "Client Masse", client_email: "banc@example.fr",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: m.ht, total: m.ht, nature: "services" }],
      total_ht: m.ht, tva_rate: m.taux, total_ttc: ttc, issue_date: m.date, due_date: m.date,
      status: "sent", operation_category: "services", type_code: "380", invoice_type: "standard",
    }));
    for (let k = 0; k < rows.length; k += 500) {
      const { error } = await admin.from("invoices").insert(rows.slice(k, k + 500));
      if (error) return [`injection des ventes en masse (${error.message})`];
    }
  }
  // Plan de comptes du cabinet, par la route de son écran de réglage.
  if (sc.planCabinet) {
    const r = await appel("/api/profile", cabinet.cookie, { method: "PATCH", body: JSON.stringify({ plan_comptes_fec: sc.planCabinet.plan }) });
    verifier(`plan du cabinet : HTTP ${sc.planCabinet.status} attendu`, r.status === sc.planCabinet.status, `HTTP ${r.status}`);
  }

  // Les vrais exports.
  const fecClient = await telecharger(`/api/export/fec?year=${sc.annee}`, client.cookie);
  const fecCabinet = await telecharger(`/api/cabinet/export?format=fec&year=${sc.annee}&clients=${client.userId}`, cabinet.cookie);
  const quadra = await telecharger(`/api/cabinet/export?format=quadra&year=${sc.annee}&clients=${client.userId}`, cabinet.cookie);
  const archive = await telecharger(`/api/cabinet/export?format=fec&year=${sc.annee}&clients=${client.userId},${autre.userId}`, cabinet.cookie);
  if (fecClient.status !== 200 || fecCabinet.status !== 200 || quadra.status !== 200 || archive.status !== 200) {
    return [`exports téléchargés : FEC client ${fecClient.status}, FEC cabinet ${fecCabinet.status}, Quadra ${quadra.status}, archive ${archive.status} ${fecCabinet.status !== 200 ? fecCabinet.texte.slice(0, 120) : fecClient.texte.slice(0, 120)}`];
  }
  const brut = fecClient.texte;
  const lignes = brut.split("\r\n").slice(1).filter(Boolean).map((l) => l.split("\t"));

  // Invariants, valables pour tout export.
  verifier("FEC : 18 colonnes sur chaque ligne", lignes.every((c) => c.length === 18));
  const parEcriture = new Map<string, number>();
  for (const c of lignes) parEcriture.set(c[2], (parEcriture.get(c[2]) ?? 0) + nb(c[11]) - nb(c[12]));
  const boiteuses = [...parEcriture].filter(([, s]) => !egal(s, 0)).map(([n]) => n);
  verifier("FEC : chaque écriture est équilibrée", boiteuses.length === 0, boiteuses.join(", "));
  verifier("FEC : ordre chronologique", lignes.every((c, i) => i === 0 || lignes[i - 1][3] <= c[3]));
  const numeros = new Map<string, number[]>();
  for (const c of lignes) { const l = numeros.get(c[0]) ?? []; const n = Number(c[2].slice(c[0].length)); if (l[l.length - 1] !== n) l.push(n); numeros.set(c[0], l); }
  verifier("FEC : numérotation continue dans chaque journal", [...numeros.values()].every((l) => l.every((n, i) => n === i + 1)));
  verifier("FEC du cabinet identique à celui du client", fecCabinet.texte === brut);

  const mq = quadra.texte.split("\r\n").filter((l) => l[0] === "M");
  const qParCompte = new Map<string, number>();
  for (const l of mq) { const k = /^[0-9]/.test(l.slice(1, 9)) ? l.slice(1, 9) : "aux"; qParCompte.set(k, (qParCompte.get(k) ?? 0) + (l[41] === "D" ? 1 : -1) * Number(l.slice(43, 55)) / 100); }
  const fParCompte = new Map<string, number>();
  for (const c of lignes) { const k = c[6] ? "aux" : compteQuadra(c[4]); fParCompte.set(k, (fParCompte.get(k) ?? 0) + nb(c[11]) - nb(c[12])); }
  const ecartsQ = [...new Set([...qParCompte.keys(), ...fParCompte.keys()])].filter((k) => !egal(qParCompte.get(k) ?? 0, fParCompte.get(k) ?? 0));
  verifier("Quadra : mêmes soldes que le FEC, compte par compte", ecartsQ.length === 0, ecartsQ.map((k) => `${k} FEC ${fParCompte.get(k)} / Quadra ${qParCompte.get(k)}`).join(", "));
  verifier("Quadra : enregistrements M de 251 caractères", mq.every((l) => l.length === 251));

  // Alertes « à vérifier » de la note de l'archive : chacune attendue, aucune autre.
  const zip = archive.texte;
  const acomptes = (zip.match(/acompte correspondant non retrouvé/g) ?? []).length;
  if (sc.attendu.aVerifier !== undefined) verifier(`soldes à vérifier : ${sc.attendu.aVerifier} attendu(s)`, acomptes === sc.attendu.aVerifier, `${acomptes} trouvé(s)`);
  const note = zip.match(/doit vérifier[^\n]*\r\n((?:- [^\r\n]*\r\n)+)/)?.[1] ?? "";
  const lignesNote = note.split("\r\n").filter((l) => l.startsWith(`- ${nomDossier} : `));
  const attendues = sc.attendu.alertes ?? (sc.attendu.aVerifier ? Array(sc.attendu.aVerifier).fill("acompte correspondant non retrouvé") : []);
  verifier(`alertes « à vérifier » : ${attendues.length} attendue(s)`, lignesNote.length === attendues.length, lignesNote.join(" | ") || "aucune");
  for (const a of new Set(attendues)) {
    verifier(`alerte « ${a} »`, lignesNote.filter((l) => l.includes(a)).length === attendues.filter((x) => x === a).length, lignesNote.join(" | ") || "aucune");
  }
  // Les mêmes alertes AVANT le téléchargement : la fenêtre d'export et la fiche du dossier.
  const avantR = await appel(`/api/cabinet/export/alertes?year=${sc.annee}&clients=${client.userId}`, cabinet.cookie);
  const avant = await json(avantR);
  const listeAvant: string[] = (avant?.dossiers ?? []).flatMap((d: { aVerifier: string[] }) => d.aVerifier);
  verifier(
    "fenêtre d'export : mêmes alertes que l'archive, avant le téléchargement",
    avantR.status === 200 && listeAvant.length === lignesNote.length && lignesNote.every((l) => listeAvant.some((t) => l.endsWith(t))),
    `HTTP ${avantR.status}, ${listeAvant.join(" | ") || "aucune"}`,
  );
  const [synthese] = await syntheseDossiers(admin, [client.userId], new Date(`${sc.annee}-12-31T12:00:00Z`));
  const dansAnomalies = (synthese?.anomalies ?? []).filter((x) => x.libelle.startsWith(`Achats ${sc.annee} à vérifier`));
  verifier(
    "anomalies du dossier côté cabinet : mêmes alertes",
    dansAnomalies.length === Math.min(listeAvant.length, 5) && dansAnomalies.every((x) => listeAvant.some((t) => x.libelle.endsWith(t))),
    dansAnomalies.map((x) => x.libelle).join(" | ") || "aucune",
  );

  // Ce que le scénario attend.
  const somme = (filtre: (c: string[]) => boolean, col: number) => lignes.filter(filtre).reduce((s, c) => s + nb(c[col]), 0);
  const attendre = async (libelle: string, d: number, cr: number, sens: { debit?: Montant; credit?: Montant }) => {
    const attD = await resoudre(sens.debit);
    const attC = await resoudre(sens.credit);
    verifier(
      `${libelle}${attD !== undefined ? ` débit ${attD}` : ""}${attC !== undefined ? ` crédit ${attC}` : ""}`,
      (attD === undefined || egal(d, attD)) && (attC === undefined || egal(cr, attC)),
      `obtenu débit ${d.toFixed(2)} crédit ${cr.toFixed(2)}`,
    );
  };
  for (const [piece, comptesAttendus] of Object.entries(sc.attendu.pieces ?? {})) {
    for (const [compte, sens] of Object.entries(comptesAttendus)) {
      const f = (c: string[]) => c[8] === piece && c[4] === compte;
      await attendre(`${piece} · ${compte}`, somme(f, 11), somme(f, 12), sens);
    }
  }
  for (const [compte, sens] of Object.entries(sc.attendu.comptes ?? {})) {
    const f = (c: string[]) => c[4] === compte;
    await attendre(`fichier · ${compte}`, somme(f, 11), somme(f, 12), sens);
  }
  for (const piece of sc.attendu.absentes ?? []) verifier(`${piece} absente du FEC`, !lignes.some((c) => c[8] === piece));
  if (sc.planCabinet) await appel("/api/profile", cabinet.cookie, { method: "PATCH", body: JSON.stringify({ plan_comptes_fec: null }) });
  return ecarts;
}
