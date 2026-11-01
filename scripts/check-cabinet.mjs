#!/usr/bin/env node
/**
 * Garde-fou du cockpit cabinet.
 *
 * Le cockpit lit les dossiers clients avec la cle de service (hors RLS) : c'est
 * ce qui permet au comptable de tout voir depuis SON interface sans se
 * connecter chez chaque client. La contrepartie est qu'aucune barriere de base
 * de donnees ne protege ces lectures : la seule protection est l'appel a
 * lib/cabinet-acces.ts AVANT toute lecture. Un oubli exposerait le dossier
 * d'un client a n'importe quel cabinet. Ce controle refuse cet oubli, ainsi que
 * le retour des defauts deja corriges (comptable resolu dans un dossier client,
 * code d'invitation reutilisable, code serveur envoye au navigateur).
 *
 * Usage : node scripts/check-cabinet.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let echecs = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const ko = (m, pourquoi) => { echecs++; console.log(`  KO   ${m}\n       ${pourquoi}`); };
const exige = (m, cond, pourquoi) => (cond ? ok(m) : ko(m, pourquoi));
const contreEpreuve = (m, detecte) =>
  detecte ? ok(`contre-epreuve : ${m} EST detecte`) : ko(`contre-epreuve : ${m}`, "le controle ne verrait pas l'infraction");
const lire = (f) => readFileSync(f, "utf8");

function fichiers(dir) {
  const out = [];
  for (const nom of readdirSync(dir)) {
    const p = join(dir, nom);
    if (statSync(p).isDirectory()) out.push(...fichiers(p));
    else if (/\.(ts|tsx)$/.test(nom)) out.push(p);
  }
  return out;
}

console.log("");
console.log("-- check:cabinet --");
console.log("");

// 1. Toute lecture par la cle de service passe par le controle d'acces.
const controle = (src) => /dossiersDuCabinet\(|estComptableDe\(/.test(src);
const litEnAdmin = (src) => /createAdminClient\(\)/.test(src);
// La consommation d'un code (rejoindre) agit pour le CLIENT connecte sur son
// propre dossier : elle est verifiee a part, au point 4.
const EXCEPTIONS = new Set([join("app", "api", "cabinet", "rejoindre", "route.ts")]);
const surfaces = [...fichiers(join("app", "api", "cabinet")), ...fichiers(join("app", "(cabinet)"))];
for (const f of surfaces) {
  if (EXCEPTIONS.has(f)) continue;
  const src = lire(f);
  if (!litEnAdmin(src)) continue;
  exige(
    `${f}, lecture par la clé de service précédée du contrôle d'accès`,
    controle(src),
    "sans dossiersDuCabinet / estComptableDe, n'importe quel cabinet lirait ce dossier",
  );
}
contreEpreuve("une page admin sans contrôle d'accès", litEnAdmin("const a = createAdminClient();") && !controle("const a = createAdminClient();"));

// 2. La fiche client verifie l'acces AVANT de lire le dossier.
{
  const src = lire(join("app", "(cabinet)", "cabinet", "[id]", "page.tsx"));
  const iCtrl = src.indexOf("estComptableDe(");
  const iLecture = Math.min(
    ...["syntheseDossiers(", "lireFacturesDossiers("].map((m) => (src.indexOf(m) < 0 ? Infinity : src.indexOf(m))),
  );
  exige(
    "fiche client, contrôle d'accès avant toute lecture",
    iCtrl >= 0 && iCtrl < iLecture && /notFound\(\)/.test(src),
    "un dossier hors portefeuille doit répondre 404 avant toute lecture",
  );
}

// 3. L'export refuse tout identifiant hors portefeuille.
{
  const src = lire(join("app", "api", "cabinet", "export", "route.ts"));
  const refuse = (s) => /demandes\.some\(\(id\) => !portefeuille\.includes\(id\)\)/.test(s) && /status: 403/.test(s);
  exige("export cabinet, identifiant hors portefeuille refusé (403)", refuse(src), "un identifiant ajouté à la main à l'URL livrerait le FEC d'un inconnu");
  contreEpreuve("un export sans filtre de portefeuille", !refuse(src.replace("!portefeuille.includes(id)", "true")));
}

// 4. Un code d'invitation ne sert qu'une fois.
{
  const src = lire(join("app", "api", "cabinet", "rejoindre", "route.ts"));
  const usageUnique = (s) =>
    /invit\.status !== "pending"/.test(s) && /status: "claimed"/.test(s) && /\.eq\("status", "pending"\)\s*\.select\("id"\)/.test(s) && /if \(erreurLien\)/.test(s);
  exige("code cabinet, usage unique (pending exigé, puis claimed)", usageUnique(src), "un code réutilisable rattacherait n'importe qui au cabinet");
  contreEpreuve("un code jamais consommé", !usageUnique(src.replace('status: "claimed"', 'status: "pending"')));
}

// 5. Un comptable ne resout jamais vers un dossier client.
{
  const src = lire(join("lib", "workspace.ts"));
  const corps = src.slice(src.indexOf("export async function getWorkspaceUserId"));
  const fin = corps.indexOf("\n}\n");
  const fn = corps.slice(0, fin < 0 ? undefined : fin);
  const sain = (s) => /role !== "comptable"/.test(s) && !/maybeSingle\(\)/.test(s);
  exige(
    "getWorkspaceUserId, les lignes comptable ne résolvent pas vers un client",
    sain(fn),
    "un comptable suivant deux clients faisait planter chaque page (maybeSingle sur plusieurs lignes)",
  );
  contreEpreuve("un retour à maybeSingle", !sain(fn + "\n.maybeSingle()"));
}

// 6. L'unicite d'appartenance active exclut les comptables, en base.
{
  const dir = join("supabase", "migrations");
  const derniere = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => /team_members_membre_actif_unique/.test(lire(join(dir, f))))
    .at(-1);
  const sql = derniere ? lire(join(dir, derniere)) : "";
  exige(
    `index d'appartenance active (${derniere}), comptables exclus`,
    /team_members_membre_actif_unique[\s\S]{0,200}role <> 'comptable'/.test(sql),
    "sans cette exclusion, la base refuse qu'un cabinet suive un deuxième client",
  );
}

// 6 bis. Le statut plateforme affiche est le statut officiel, jamais un
// « Transmise » generique : une facture rejetee (fr:213) ou refusee (fr:210)
// passait pour transmise dans la premiere version de la fiche client.
{
  const fiche = lire(join("app", "(cabinet)", "cabinet", "[id]", "page.tsx"));
  const synth = lire(join("lib", "cabinet-dossiers.ts"));
  const officiel = (s) => /libelleStatut\(f\.superpdp_status\)/.test(s) && !/texte: "Transmise"/.test(s);
  exige("fiche client, libellé officiel du statut plateforme", officiel(fiche), "un statut de rejet s'affichait « Transmise »");
  contreEpreuve("un libellé « Transmise » générique", !officiel(fiche + '\n{ texte: "Transmise" }'));
  exige(
    "anomalies, refus et rejets plateforme comptés en rouge",
    /estEchecPlateforme\(f\.superpdp_status\)/.test(synth) && /ton === "attention" && !!st\.cloture/.test(synth),
    "un dossier avec des factures rejetées restait vert",
  );
}

// 6 ter. Les trous de numerotation sont detectes et remontes en anomalie.
{
  const synth = lire(join("lib", "cabinet-dossiers.ts"));
  const detecte = (s) =>
    /export function trousNumerotation/.test(s) &&
    /for \(let i = min; i <= max; i\+\+\) if \(!set\.has\(i\)\)/.test(s) &&
    /trousNumerotation\(emises\)/.test(s) &&
    /Trou de num/.test(s);
  exige("anomalies, trous de numérotation interieurs détectés", detecte(synth), "la continuité de la numérotation est une obligation légale, un trou est la première chose qu'un comptable cherche");
  contreEpreuve("une détection sans parcours des numéros manquants", !detecte(synth.replace("for (let i = min; i <= max; i++)", "for (let i = min; i < min; i++)")));
}

// 6 quater. Conformite TVA au regime declare : une TVA facturee par un dossier
// en franchise (rouge) et un assujetti sans periodicite (orange) remontent dans
// la file a traiter. Ce sont des erreurs qu'un comptable cherche en premier.
{
  const synth = lire(join("lib", "cabinet-dossiers.ts"));
  const detecte = (s) =>
    /factureAvecTva\(f\)/.test(s) &&
    /franchise en base \(art\. 293 B CGI\)/.test(s) &&
    /sans périodicité de déclaration/.test(s);
  exige("anomalies, conformité TVA au régime (franchise / périodicité)", detecte(synth), "une TVA facturée en franchise ou une périodicité manquante doit remonter dans la file à traiter");
  contreEpreuve("une file sans contrôle de la franchise", !detecte(synth.replace("franchise en base (art. 293 B CGI)", "")));
}

// 6 quinquies. Calendrier TVA : l'echeance par dossier (periode close a declarer
// et periode en cours) est calculee et affichee sur le portefeuille.
{
  const lib = lire(join("lib", "cabinet-tva-calendrier.ts"));
  const page = lire(join("app", "(cabinet)", "cabinet", "page.tsx"));
  const calcule = (s) => /export function calendrierTva/.test(s) && /aDeclarer/.test(s) && /enCours/.test(s);
  exige("calendrier TVA, échéance par dossier calculée", calcule(lib), "le comptable doit voir la TVA à déclarer par dossier, sans ouvrir chaque fiche");
  exige(
    "calendrier TVA, branché sur le portefeuille",
    /calendrierTva\(/.test(page) && /CabinetCalendrierTva/.test(page),
    "le calcul doit être rendu sur /cabinet",
  );
  contreEpreuve("un calendrier sans période close à déclarer", !calcule(lib.replace(/aDeclarer/g, "xxx")));
}

// 7. Rien du serveur cabinet n'est envoye au navigateur.
{
  const interdits = /from "@\/lib\/(cabinet-acces|cabinet-dossiers|cabinet-tva-calendrier|cabinet-journal|cabinet-signalements|cabinet|exports-comptables|zip)"/;
  for (const f of fichiers("components").concat(surfaces)) {
    const src = lire(f);
    if (!/^"use client"/.test(src.trimStart())) continue;
    exige(`${f}, composant client sans import serveur cabinet`, !interdits.test(src), "crypto, clé de service ou lecture de dossiers embarqués dans le bundle navigateur");
  }
  contreEpreuve("un composant client qui importe cabinet-dossiers", interdits.test('import { x } from "@/lib/cabinet-dossiers";'));
}

// 8. Journal des acces : chaque consultation de dossier et chaque export est
// trace, et un cabinet ne lit que son propre journal.
{
  const fiche = lire(join("app", "(cabinet)", "cabinet", "[id]", "page.tsx"));
  const exp = lire(join("app", "api", "cabinet", "export", "route.ts"));
  const jlib = lire(join("lib", "cabinet-journal.ts"));
  exige(
    "journal, consultation de dossier tracée",
    /journaliser\(admin, user\.id, "consultation", id\)/.test(fiche),
    "chaque ouverture de fiche client doit laisser une trace",
  );
  exige(
    "journal, export tracé (FEC et CSV)",
    /journaliser\(/.test(exp) && /"export_fec"/.test(exp) && /"export_csv"/.test(exp),
    "chaque export doit laisser une trace",
  );
  exige(
    "journal, lecture bornée au cabinet connecté",
    /\.eq\("cabinet_id", cabinetId\)/.test(jlib),
    "un cabinet ne doit lire que son propre journal",
  );
  contreEpreuve("une lecture de journal sans filtre cabinet", !/\.eq\("cabinet_id", cabinetId\)/.test(jlib.replace('.eq("cabinet_id", cabinetId)', "")));
}

// 9. Signalement cible : le cabinet ne signale qu'a un client de son
// portefeuille (estComptableDe), et la cloture cote client est bornee a son
// espace (client_id = espace du client).
{
  const creer = lire(join("app", "api", "cabinet", "signalement", "route.ts"));
  const traiter = lire(join("app", "api", "signalements", "traiter", "route.ts"));
  const slib = lire(join("lib", "cabinet-signalements.ts"));
  exige(
    "signalement, création bornée au portefeuille (estComptableDe)",
    /estComptableDe\(admin, user\.id, clientId\)/.test(creer) && /status: 403/.test(creer),
    "un cabinet ne doit pouvoir signaler qu'un client qu'il suit",
  );
  contreEpreuve("une création de signalement sans contrôle d'accès", !/estComptableDe\(/.test(creer.replace(/estComptableDe\(/g, "xx(")));
  exige(
    "signalement, clôture bornée à l'espace du client",
    /\.eq\("client_id", clientId\)/.test(slib) && /getWorkspaceUserId\(user\.id\)/.test(traiter),
    "un client ne doit clore que les signalements de son espace",
  );
  contreEpreuve("une clôture sans filtre d'espace", !/\.eq\("client_id", clientId\)/.test(slib.replaceAll('.eq("client_id", clientId)', "")));
}

// 10. Conformite reforme + controles de donnees de reference. Le cabinet voit
// qui peut emettre ET recevoir, et quelles donnees font rejeter les factures.
{
  const synth = lire(join("lib", "cabinet-dossiers.ts"));
  const page = lire(join("app", "(cabinet)", "cabinet", "page.tsx"));
  const detecte = (s) =>
    /directory_address/.test(s) &&
    /siretValide\(p\?\.siret\)/.test(s) &&
    /conformite = \{/.test(s) &&
    /joignableAnnuaire:/.test(s);
  exige("conformité réforme, calculée par dossier", detecte(synth), "le cabinet doit voir qui peut émettre ET recevoir, pas seulement « raccordé »");
  exige(
    "conformité réforme, affichée sur le portefeuille",
    /<CabinetConformite lignes=\{conformite\}/.test(page) && /const conformite = dossiers\.map/.test(page),
    "le tableau de conformité doit être rendu sur /cabinet",
  );
  contreEpreuve("une conformité sans contrôle de joignabilité", !detecte(synth.replace(/directory_address/g, "xxx")));
  exige(
    "données de référence, SIRET invalide / non joignable / n° TVA incohérent détectés",
    /SIRET invalide \(clé de contrôle\)/.test(synth) &&
      /Raccordé mais pas joignable à l'annuaire/.test(synth) &&
      /N° de TVA incohérent avec le SIREN/.test(synth),
    "un SIRET faux, une entreprise non joignable ou un n° de TVA incohérent font rejeter les factures",
  );
  contreEpreuve("une file sans contrôle du SIRET", !/SIRET invalide \(clé de contrôle\)/.test(synth.replace("SIRET invalide (clé de contrôle)", "")));
}

console.log("");
if (echecs) {
  console.log(`check:cabinet, ${echecs} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("check:cabinet, accès au cockpit verrouillé : contrôle avant lecture, export borné au portefeuille, codes à usage unique.");
