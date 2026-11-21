/**
 * Traversée réelle de la déclaration des achats à l'étranger, en BAC À SABLE
 * Super PDP (21/11/2026). Compte de test superpdp-test@getdeviso.fr uniquement,
 * raccordé au bac à sable par l'application OAuth locale : jamais un compte réel.
 *
 * Chaque achat est saisi par la vraie route (POST /api/superpdp/achats) du
 * serveur local, puis relu CHEZ LA PLATEFORME (GET /b2bint_invoices/{id}) pour
 * vérifier ce qu'elle a réellement enregistré : catégorie de TVA (AE, K, S),
 * avoir (381), schéma du vendeur, code de date d'exigibilité. Les achats hors
 * champ (TVA étrangère) ne doivent jamais partir. Un achat transmis ne se
 * supprime ni ne se modifie plus.
 *
 * Lancer : E2E_BASE_URL=http://localhost:3000 npx -y tsx scripts/e2e/achats-declaration-pa.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { verifier, bilan, BASE } from "./lib.mjs";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const EMAIL = "superpdp-test@getdeviso.fr";
const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const REF = new URL(URL_SB).hostname.split(".")[0];

(async () => {
  if (!/localhost|127\.0\.0\.1/.test(BASE)) {
    console.error("Refus : ce test vise le serveur LOCAL raccordé au bac à sable (E2E_BASE_URL=http://localhost:3000).");
    process.exit(1);
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { superpdpFetch } = await import("@/lib/superpdp");
  const { rapprocherDeclaration } = await import("@/lib/superpdp-achats");
  const admin = createAdminClient();

  // Garde : compte de test, raccordé au BAC À SABLE.
  const { data: u } = await admin.from("profiles").select("id").eq("email", EMAIL).maybeSingle();
  const { data: cx } = await admin.from("superpdp_connections").select("company_number_scheme, session_status").eq("user_id", u?.id ?? "").maybeSingle();
  if (!u || cx?.company_number_scheme !== "sandbox" || cx?.session_status !== "verified") {
    console.error("Refus : le compte de test n'est pas raccordé au bac à sable.");
    process.exit(1);
  }

  const auth = await fetch(`${URL_SB}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: process.env.E2E_SUPERPDP_PASSWORD }),
  }).then((r) => r.json());
  if (!auth.access_token) { console.error("Connexion au compte de test impossible."); process.exit(1); }
  const session = { access_token: auth.access_token, refresh_token: auth.refresh_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600 };
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  const appel = async (chemin: string, init: RequestInit = {}) => {
    const r = await fetch(`${BASE}${chemin}`, { ...init, headers: { "Content-Type": "application/json", cookie, ...(init.headers ?? {}) } });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  };

  const jour = new Date().toISOString().slice(0, 10);
  const suffixe = Date.now().toString(36).toUpperCase();
  const base = { fournisseur_pays: "DE", fournisseur_tva: "DE811569869", date_facture: jour, devise: "EUR", taux_autoliquidation: 20 };
  const cas = [
    { nom: "services de l'UE sans TVA", attendu: { code: "AE", type: "380" }, corps: { ...base, fournisseur_nom: "Kreativ GmbH", numero: `TP-SV-${suffixe}`, categorie: "services", montant_ht: 1000, taux_tva: 0, montant_tva: 0, tva_facturee: "aucune" } },
    { nom: "biens de l'UE sans TVA", attendu: { code: "K", type: "380" }, corps: { ...base, fournisseur_nom: "Holz GmbH", numero: `TP-BI-${suffixe}`, categorie: "biens", montant_ht: 1000, taux_tva: 0, montant_tva: 0, tva_facturee: "aucune" } },
    { nom: "avoir d'un fournisseur de l'UE", attendu: { code: "AE", type: "381" }, corps: { ...base, fournisseur_nom: "Kreativ GmbH", numero: `TP-AV-${suffixe}`, categorie: "services", montant_ht: 500, taux_tva: 0, montant_tva: 0, tva_facturee: "aucune", est_avoir: true } },
    { nom: "TVA française (fournisseur immatriculé en France)", attendu: { code: "S", type: "380", schema: "9957" }, corps: { ...base, fournisseur_nom: "Messe GmbH", fournisseur_tva: "FR40303265045", numero: `TP-FR-${suffixe}`, categorie: "services", montant_ht: 1000, taux_tva: 20, montant_tva: 200, tva_facturee: "francaise" } },
    { nom: "services hors UE sans TVA", attendu: { code: "AE", type: "380" }, corps: { ...base, fournisseur_nom: "Cloud Inc", fournisseur_pays: "US", fournisseur_tva: "98-7654321", numero: `TP-US-${suffixe}`, categorie: "services", montant_ht: 300, taux_tva: 0, montant_tva: 0, tva_facturee: "aucune" } },
    { nom: "TVA étrangère (hors champ)", attendu: { horsChamp: true }, corps: { ...base, fournisseur_nom: "Hotel Berlin", numero: `TP-ET-${suffixe}`, categorie: "services", montant_ht: 300, taux_tva: 19, montant_tva: 57, tva_facturee: "etrangere" } },
  ] as const;

  const transmis: { id: string; nom: string }[] = [];
  for (const c of cas) {
    const r = await appel("/api/superpdp/achats", { method: "POST", body: JSON.stringify(c.corps) });
    const a = r.body?.achat;
    console.log(`\n── ${c.nom} : HTTP ${r.status}, statut ${a?.transmission_status}${a?.transmission_error ? ` (${a.transmission_error})` : ""}`);
    if ("horsChamp" in c.attendu) {
      verifier(`${c.nom} : jamais transmis (hors champ)`, r.status === 200 && a?.transmission_status === "hors_champ" && !a?.superpdp_id);
      continue;
    }
    verifier(`${c.nom} : acceptée par la plateforme`, r.status === 200 && a?.transmission_status === "transmis" && !!a?.superpdp_id, JSON.stringify(r.body?.transmission ?? r.body).slice(0, 300));
    if (!a?.superpdp_id) continue;
    transmis.push({ id: a.id, nom: c.nom });
    // Ce que la plateforme a réellement enregistré.
    // La plateforme n'expose que la liste (GET /b2bint_invoices) : on y retrouve la déclaration.
    const lu = await superpdpFetch(u.id, `/b2bint_invoices?limit=100&order=desc`);
    const texte = await lu.text();
    let liste: Record<string, unknown>[] = [];
    try { liste = (JSON.parse(texte).data ?? []) as Record<string, unknown>[]; } catch { /* corps illisible */ }
    const d = liste.find((x) => x.id === a.superpdp_id) ?? {};
    // Les champs dont dépend la reconnaissance d'une déclaration déjà envoyée.
    verifier(`${c.nom} : reconnue dans la liste par numéro, fournisseur, date et HT`, rapprocherDeclaration(liste as never, a).etat === "identique", JSON.stringify({ number: d.number, seller: d.seller, issue_date: d.issue_date, total: d.total }).slice(0, 300));
    const st = (d.tax_subtotals as { tax_amount?: string; tax_category?: { code?: string; percent?: string; exemption_reason_code?: string } }[] | undefined)?.[0];
    const seller = d.seller as { company_id_scheme_id?: string } | undefined;
    console.log(`   relu chez la plateforme : type ${d.type_code}, catégorie ${st?.tax_category?.code} ${st?.tax_category?.percent ?? ""} ${st?.tax_category?.exemption_reason_code ?? ""}, TVA ${st?.tax_amount}, schéma vendeur ${seller?.company_id_scheme_id}, exigibilité ${d.tax_due_date_type_code}`);
    verifier(`${c.nom} : relu avec la catégorie ${c.attendu.code}`, st?.tax_category?.code === c.attendu.code, `HTTP ${lu.status} ${texte.slice(0, 200)}`);
    verifier(`${c.nom} : relu avec le type ${c.attendu.type}`, String(d.type_code) === c.attendu.type);
    if ("schema" in c.attendu) verifier(`${c.nom} : schéma du vendeur ${c.attendu.schema}`, seller?.company_id_scheme_id === c.attendu.schema);
  }

  // Un achat transmis est figé : ni modification, ni suppression.
  if (transmis[0]) {
    const sup = await appel(`/api/superpdp/achats/${transmis[0].id}`, { method: "DELETE" });
    verifier(`suppression d'un achat transmis refusée (409)`, sup.status === 409, `HTTP ${sup.status}`);
    const cor = await appel(`/api/superpdp/achats/${transmis[0].id}`, { method: "PATCH", body: JSON.stringify(cas[0].corps) });
    verifier(`correction d'un achat transmis refusée (409)`, cor.status === 409, `HTTP ${cor.status}`);
  }
  console.log("");
  process.exit(bilan() > 0 ? 1 : 0);
})();
