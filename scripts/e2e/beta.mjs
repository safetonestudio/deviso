#!/usr/bin/env node
/**
 * Traversée du programme bêta, de bout en bout, sur un serveur LOCAL.
 *
 *   E2E_BASE_URL=http://localhost:3108 node scripts/e2e/beta.mjs
 *
 * Chemin parcouru (règle nº2 de CLAUDE.md) :
 *   candidature publique (route) → base → doublon et champ piège →
 *   acceptation par l'administrateur (route admin) → lien vérifié →
 *   compte créé → activation → profil en bêta (2 mois) →
 *   15e jour : rien ne coupe → J-7 : rappel → fin : bascule et écran →
 *   gardes : compte sans invitation refusé au paiement, bêta-testeur sans
 *   coupon refusé (aucun objet Stripe), équipe limitée à 3, lien rejoué refusé.
 *
 * Prérequis local : ADMIN_EMAILS (.env.local du worktree) contient
 * admin-traversee-beta@deviso.internal. Les courriels des candidats partent
 * vers delivered+...@resend.dev (adresse de test Resend, rien n'est distribué).
 * SEUL le courriel « nouvelle candidature » part réellement, vers
 * support@getdeviso.fr : c'est lui qu'on vérifie.
 *
 * Le jeton en clair n'existe que dans le courriel d'acceptation, illisible
 * d'ici : après l'acceptation, le script remplace son empreinte par celle
 * d'un jeton connu, comme si on avait lu le courriel.
 *
 * Tout ce qui est créé est supprimé à la fin, même en cas d'échec.
 * ⚠️ Ne jamais lancer contre la production (refus si BASE n'est pas localhost).
 */
import { createHash, randomBytes } from "node:crypto";
import { secret, verifier, bilan } from "./lib.mjs";

const BASE = process.env.E2E_BASE_URL || "";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error("Traversée bêta : E2E_BASE_URL doit désigner le serveur local (http://localhost:PORT).");
  process.exit(2);
}
const REF = "mjhsafxzbufpughtxhnw";
const SUPA = `https://${REF}.supabase.co`;
const SERVICE = secret("SUPABASE_SERVICE_ROLE_KEY");
const ANON = secret("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const CRON = secret("CRON_SECRET");
const ADMIN_EMAIL = "admin-traversee-beta@deviso.internal";
const tag = Date.now().toString(36);
const emailTesteur = `delivered+beta-${tag}@resend.dev`;
const emailIntrus = `delivered+intrus-${tag}@resend.dev`;
const mdp = `Traversee-${randomBytes(6).toString("hex")}!A1`;
const empreinte = (v) => createHash("sha256").update(v).digest("hex");

const crees = { users: [], candidatures: [] };

const rest = (chemin, init = {}) =>
  fetch(`${SUPA}/rest/v1/${chemin}`, {
    ...init,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json", prefer: "return=representation", ...(init.headers ?? {}) },
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

async function creerCompte(email) {
  const r = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ email, password: mdp, email_confirm: true, user_metadata: { full_name: "Traversée Bêta" } }),
  });
  const j = await r.json();
  if (!j.id) throw new Error(`Compte ${email} non créé : ${JSON.stringify(j).slice(0, 200)}`);
  crees.users.push(j.id);
  return j.id;
}

async function session(email) {
  const r = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password: mdp }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error(`Connexion ${email} impossible`);
  const s = { access_token: t.access_token, refresh_token: t.refresh_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600 };
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s)).toString("base64")}`;
  return (chemin, init = {}) =>
    fetch(`${BASE}${chemin}`, {
      redirect: "manual",
      ...init,
      headers: { cookie, ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
    });
}

const profil = async (id) => (await rest(`profiles?id=eq.${id}&select=plan,subscription_status,beta_debut,beta_fin,beta_rappel_le,beta_fin_notifiee_le,stripe_customer_id`)).body?.[0];
const majProfil = (id, champs) => rest(`profiles?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(champs) });
const cron = () => fetch(`${BASE}/api/cron/fin-beta`, { headers: { authorization: `Bearer ${CRON}` } }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const candidature = (corps) =>
  fetch(`${BASE}/api/beta/candidature`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${(Date.now() % 200) + 1}` }, body: JSON.stringify(corps) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

try {
  console.log("── 1. Candidature publique ─────────────────────────────");
  const saisie = { nom: "Camille Traversée", email: emailTesteur, activite: "Photographe", statut: "Société", outil: "Word ou Excel", message: "Test <b>de</b> traversée", echange: true };
  const sansCase = await candidature({ ...saisie, echange: false });
  verifier("refusée sans la case de l'échange", sansCase.status === 400, `HTTP ${sansCase.status}`);
  const r1 = await candidature(saisie);
  verifier("candidature acceptée par la route", r1.status === 200 && r1.body?.ok, `HTTP ${r1.status} ${JSON.stringify(r1.body)}`);
  const lignes = (await rest(`beta_candidatures?email=eq.${encodeURIComponent(emailTesteur)}&select=*`)).body ?? [];
  crees.candidatures.push(...lignes.map((l) => l.id));
  verifier("une ligne en base, en attente", lignes.length === 1 && lignes[0].statut === "en_attente", JSON.stringify(lignes.map((l) => l.statut)));
  verifier("champs relus tels que saisis", lignes[0]?.activite === "Photographe" && lignes[0]?.outil === "Word ou Excel" && lignes[0]?.echange_accepte === true);
  verifier("IP stockée en empreinte seulement", typeof lignes[0]?.ip_empreinte === "string" && lignes[0].ip_empreinte.length === 64);
  const r2 = await candidature(saisie);
  const lignes2 = (await rest(`beta_candidatures?email=eq.${encodeURIComponent(emailTesteur)}&select=id`)).body ?? [];
  verifier("doublon : même réponse, pas de seconde ligne", r2.status === 200 && lignes2.length === 1, `HTTP ${r2.status}, ${lignes2.length} ligne(s)`);
  const piege = await candidature({ ...saisie, email: `delivered+robot-${tag}@resend.dev`, site: "http://spam" });
  const robot = (await rest(`beta_candidatures?email=eq.${encodeURIComponent(`delivered+robot-${tag}@resend.dev`)}&select=id`)).body ?? [];
  verifier("champ piège : succès affiché, rien d'enregistré", piege.status === 200 && robot.length === 0);

  console.log("── 2. Acceptation par l'administrateur ─────────────────");
  const adminId = await creerCompte(ADMIN_EMAIL).catch(async () => {
    // Compte resté d'un passage précédent : on le retrouve.
    const l = await fetch(`${SUPA}/auth/v1/admin/users?per_page=1000`, { headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` } }).then((r) => r.json());
    const u = (l.users ?? []).find((x) => x.email === ADMIN_EMAIL);
    if (!u) throw new Error("compte administrateur de test introuvable");
    await fetch(`${SUPA}/auth/v1/admin/users/${u.id}`, { method: "PUT", headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" }, body: JSON.stringify({ password: mdp }) });
    crees.users.push(u.id);
    return u.id;
  });
  await majProfil(adminId, { company_name: "Admin traversée" });
  const admin = await session(ADMIN_EMAIL);
  const pageAdmin = await admin("/admin/beta");
  const htmlAdmin = await pageAdmin.text();
  verifier("page /admin/beta ouverte à l'administrateur", pageAdmin.status === 200 && htmlAdmin.includes("Camille Traversée"), `HTTP ${pageAdmin.status}`);
  const intrusId = await creerCompte(emailIntrus);
  const intrus = await session(emailIntrus);
  const refusAdmin = await intrus("/api/admin/beta", { method: "POST", body: JSON.stringify({ action: "accepter", id: lignes[0].id }) });
  verifier("route admin : 404 pour un autre compte", refusAdmin.status === 404, `HTTP ${refusAdmin.status}`);
  const acc = await admin("/api/admin/beta", { method: "POST", body: JSON.stringify({ action: "accepter", id: lignes[0].id }) });
  verifier("acceptation par l'administrateur", acc.status === 200, `HTTP ${acc.status} ${await acc.text().catch(() => "")}`);
  const apres = (await rest(`beta_candidatures?id=eq.${lignes[0].id}&select=statut,jeton_hash,jeton_expire_le`)).body?.[0];
  verifier("statut acceptée, empreinte du jeton, expiration à 14 jours", apres?.statut === "acceptee" && apres?.jeton_hash?.length === 64 && Math.abs(new Date(apres.jeton_expire_le) - Date.now() - 14 * 86400_000) < 120_000);

  // Le jeton en clair est dans le courriel : on le remplace par un jeton connu.
  const jeton = randomBytes(32).toString("base64url");
  await rest(`beta_candidatures?id=eq.${lignes[0].id}`, { method: "PATCH", body: JSON.stringify({ jeton_hash: empreinte(jeton) }) });

  console.log("── 3. Lien personnel, inscription, activation ──────────");
  const jv = await fetch(`${BASE}/api/beta/jeton?j=${encodeURIComponent(jeton)}`).then(async (r) => ({ status: r.status, body: await r.json() }));
  verifier("lien reconnu, adresse renvoyée", jv.status === 200 && jv.body.email === emailTesteur);
  const jf = await fetch(`${BASE}/api/beta/jeton?j=faux`);
  verifier("lien inventé : 404", jf.status === 404);
  const sansSession = await fetch(`${BASE}/api/beta/activer?j=${encodeURIComponent(jeton)}`, { redirect: "manual" });
  const versInscription = sansSession.headers.get("location") ?? "";
  verifier("lien du courriel ouvert sans être connecté : inscription, adresse préremplie", versInscription.includes("/signup?beta=") && versInscription.includes(encodeURIComponent(emailTesteur)), versInscription);

  const activIntrus = await intrus(`/api/beta/activer?j=${encodeURIComponent(jeton)}`);
  verifier("activation par un compte d'une autre adresse : refusée", (activIntrus.headers.get("location") ?? "").includes("beta=adresse"), activIntrus.headers.get("location"));

  const testeurId = await creerCompte(emailTesteur);
  const testeur = await session(emailTesteur);
  const avant = await profil(testeurId);
  verifier("compte neuf : sans formule", avant?.plan === "free" && !avant?.beta_fin);
  const act = await testeur(`/api/beta/activer?j=${encodeURIComponent(jeton)}`);
  verifier("activation : compte neuf envoyé au démarrage, message bêta conservé", (act.headers.get("location") ?? "").endsWith("/onboarding?beta=active"), act.headers.get("location"));
  const htmlOnb = await (await testeur("/onboarding?beta=active")).text();
  verifier("écran de démarrage : accessible au testeur", htmlOnb.length > 1000);
  await majProfil(testeurId, { company_name: "Atelier Traversée" });
  const p1 = await profil(testeurId);
  const duree = new Date(p1?.beta_fin) - new Date(p1?.beta_debut);
  verifier("profil : formule complète, statut bêta", p1?.plan === "pro" && p1?.subscription_status === "beta");
  verifier("2 mois à partir de la création du compte", duree > 58 * 86400_000 && duree < 63 * 86400_000 && Date.now() - new Date(p1.beta_debut) < 120_000, `${Math.round(duree / 86400_000)} jours`);
  verifier("aucun objet Stripe", !p1?.stripe_customer_id);
  const rejeu = await intrus(`/api/beta/activer?j=${encodeURIComponent(jeton)}`);
  verifier("lien rejoué par un autre compte : refusé", (rejeu.headers.get("location") ?? "").includes("beta=jeton") || (rejeu.headers.get("location") ?? "").includes("beta=adresse"), rejeu.headers.get("location"));
  const rejeuMoi = await testeur(`/api/beta/activer?j=${encodeURIComponent(jeton)}`);
  verifier("lien rejoué par le testeur lui-même : sans effet", (rejeuMoi.headers.get("location") ?? "").endsWith("/dashboard?beta=active"), rejeuMoi.headers.get("location"));
  const html = await (await testeur("/dashboard?beta=active")).text();
  verifier("tableau de bord accessible", html.length > 1000);

  console.log("── 4. Gardes côté serveur ──────────────────────────────");
  const devisIntrus = await intrus("/api/proposals", { method: "POST", body: JSON.stringify({ title: "x", client_name: "x", items: [], total_ht: 0, tva_rate: 20, total_ttc: 0 }) });
  verifier("compte sans invitation : création de devis refusée", devisIntrus.status === 403, `HTTP ${devisIntrus.status}`);
  const ecranIntrus = await (await intrus("/dashboard")).text();
  verifier("compte sans invitation : l'espace n'affiche que l'appel à candidater", ecranIntrus.includes("Deviso est en bêta") && ecranIntrus.includes("Devenir bêta-testeur"));
  const payIntrus = await intrus("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "solo", billing: "monthly" }) });
  const bi = await payIntrus.json();
  verifier("compte sans invitation : paiement refusé", payIntrus.status === 403 && bi.error === "BETA_INVITATION", `HTTP ${payIntrus.status} ${bi.error}`);
  verifier("… sans créer de client Stripe", !(await profil(intrusId))?.stripe_customer_id);
  const payTesteur = await testeur("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "pro", billing: "monthly" }) });
  const bt = await payTesteur.json();
  verifier("bêta-testeur en début de bêta : souscription pas encore ouverte", payTesteur.status === 409 && bt.error === "BETA_TROP_TOT", `HTTP ${payTesteur.status} ${bt.error}`);
  verifier("… sans créer de client Stripe", !(await profil(testeurId))?.stripe_customer_id);
  const inv = [];
  for (const n of [1, 2, 3]) {
    const r = await testeur("/api/team", { method: "POST", body: JSON.stringify({ email: `delivered+membre${n}-${tag}@resend.dev` }) });
    inv.push({ status: r.status, body: await r.json() });
  }
  verifier("équipe : 2 invitations acceptées", inv[0].status === 200 && inv[1].status === 200, JSON.stringify(inv.slice(0, 2).map((x) => x.status)));
  verifier("équipe : la 3e refusée (3 utilisateurs, titulaire compris)", inv[2].status === 403 && inv[2].body.error === "BETA_LIMITE_EQUIPE", JSON.stringify(inv[2]));

  console.log("── 4 bis. Cas de bord de l'activation ──────────────────");
  // Compte qui existe déjà : le lien sans session mène à la connexion.
  const emailExistant = `delivered+existant-${tag}@resend.dev`;
  const existantId = await creerCompte(emailExistant);
  const invE = await admin("/api/admin/beta", { method: "POST", body: JSON.stringify({ action: "inviter", nom: "Compte Existant", email: emailExistant, type: "testeur" }) });
  verifier("invitation directe d'un testeur", invE.status === 200, `HTTP ${invE.status} ${await invE.text()}`);
  const jetonE = randomBytes(32).toString("base64url");
  await rest(`beta_candidatures?email=eq.${encodeURIComponent(emailExistant)}`, { method: "PATCH", body: JSON.stringify({ jeton_hash: empreinte(jetonE) }) });
  const versConnexion = (await fetch(`${BASE}/api/beta/activer?j=${encodeURIComponent(jetonE)}`, { redirect: "manual" })).headers.get("location") ?? "";
  verifier("adresse déjà inscrite : le lien mène à la connexion, qui revient à l'activation", versConnexion.includes("/login?next=") && versConnexion.includes(encodeURIComponent("/api/beta/activer")), versConnexion);
  // Activation de secours : connecté, adresse confirmée, sans repasser par le lien.
  await majProfil(existantId, { company_name: "Existant SARL" });
  const existant = await session(emailExistant);
  const secours = await existant("/dashboard");
  verifier("acceptée mais arrivée sans le lien : bêta ouverte par l'adresse confirmée", (secours.headers.get("location") ?? "").includes("/dashboard?beta=active") || (await profil(existantId))?.subscription_status === "beta", `HTTP ${secours.status} ${secours.headers.get("location")}`);
  const pE = await profil(existantId);
  verifier("… profil en bêta, 2 mois", pE?.plan === "pro" && pE?.subscription_status === "beta" && !!pE?.beta_fin);
  // Cabinet invité directement : son cockpit, pas le démarrage du micro-entrepreneur.
  const emailCab = `delivered+cabinet-${tag}@resend.dev`;
  const adminBis = await session(ADMIN_EMAIL); // le script ne réécrit pas les cookies renouvelés
  const invC = await adminBis("/api/admin/beta", { method: "POST", body: JSON.stringify({ action: "inviter", nom: "Cabinet Test", email: emailCab, type: "cabinet" }) });
  verifier("invitation directe d'un cabinet", invC.status === 200, `HTTP ${invC.status} ${await invC.text()}`);
  const jetonC = randomBytes(32).toString("base64url");
  await rest(`beta_candidatures?email=eq.${encodeURIComponent(emailCab)}`, { method: "PATCH", body: JSON.stringify({ jeton_hash: empreinte(jetonC) }) });
  await creerCompte(emailCab);
  const cab = await session(emailCab);
  const actCab = (await cab(`/api/beta/activer?j=${encodeURIComponent(jetonC)}`)).headers.get("location") ?? "";
  verifier("cabinet invité : envoyé à son cockpit", actCab.endsWith("/cabinet?beta=cabinet"), actCab);
  verifier("… sans formule ni bêta (le cockpit est gratuit)", (await profil(crees.users.at(-1)))?.plan === "free");
  const cockpit = await cab("/cabinet");
  verifier("… le cockpit s'ouvre", cockpit.status === 200, `HTTP ${cockpit.status}`);
  await rest(`beta_candidatures?email=in.(${[emailExistant, emailCab].map(encodeURIComponent).join(",")})`, { method: "DELETE" });

  console.log("── 5. Le temps passe ───────────────────────────────────");
  const ilYa15j = new Date(Date.now() - 15 * 86400_000);
  const finA = new Date(ilYa15j); finA.setUTCMonth(finA.getUTCMonth() + 2);
  await majProfil(testeurId, { beta_debut: ilYa15j.toISOString(), beta_fin: finA.toISOString() });
  const c1 = await cron();
  verifier("cron au 15e jour : passe sans erreur", c1.status === 200, JSON.stringify(c1.body));
  const p15 = await profil(testeurId);
  verifier("15e jour : rien ne coupe (formule complète, statut bêta)", p15?.plan === "pro" && p15?.subscription_status === "beta" && !p15?.beta_rappel_le);

  await majProfil(testeurId, { beta_fin: new Date(Date.now() + 3 * 86400_000).toISOString() });
  const c2 = await cron();
  const pJ7 = await profil(testeurId);
  verifier("J-3 : rappel envoyé une fois, accès intact", c2.status === 200 && c2.body?.rappels >= 1 && !!pJ7?.beta_rappel_le && pJ7?.plan === "pro", JSON.stringify(c2.body));
  const payJ3 = await testeur("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "pro", billing: "monthly" }) });
  const bj3 = await payJ3.json();
  verifier("J-3, coupon non configuré : souscription refusée (jamais le plein tarif)", payJ3.status === 409 && bj3.error === "BETA_ABONNEMENT_BIENTOT", `HTTP ${payJ3.status} ${bj3.error}`);
  verifier("… sans créer de client Stripe", !(await profil(testeurId))?.stripe_customer_id);
  const c2b = await cron();
  verifier("rappel non renvoyé au passage suivant", c2b.body?.rappels === 0, JSON.stringify(c2b.body));

  await majProfil(testeurId, { beta_fin: new Date(Date.now() - 60_000).toISOString() });
  const c3 = await cron();
  const pFin = await profil(testeurId);
  verifier("fin de bêta : bascule (sans formule, statut bêta terminée)", c3.body?.bascules >= 1 && pFin?.plan === "free" && pFin?.subscription_status === "beta_terminee" && !!pFin?.beta_fin_notifiee_le, JSON.stringify(c3.body));
  const c3b = await cron();
  verifier("bascule non rejouée", c3b.body?.bascules === 0);
  const htmlFin = await (await testeur("/dashboard")).text();
  verifier("tableau de bord : écran « Ta bêta est terminée »", htmlFin.includes("Ta bêta est terminée"));
} catch (e) {
  verifier(`exception : ${e.message}`, false);
} finally {
  console.log("── Nettoyage ───────────────────────────────────────────");
  for (const id of crees.users) {
    await rest(`team_members?owner_id=eq.${id}`, { method: "DELETE" });
  }
  await rest(`beta_candidatures?email=in.(${[emailTesteur, emailIntrus, `delivered+robot-${tag}@resend.dev`].map(encodeURIComponent).join(",")})`, { method: "DELETE" });
  for (const id of crees.users) {
    await fetch(`${SUPA}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` } });
  }
  const restes = (await rest(`beta_candidatures?email=like.*${tag}*&select=id`)).body ?? [];
  verifier("nettoyage : aucune candidature de test restante", restes.length === 0);
  process.exit(bilan() > 0 ? 1 : 0);
}
