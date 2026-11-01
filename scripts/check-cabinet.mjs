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

// 7. Rien du serveur cabinet n'est envoye au navigateur.
{
  const interdits = /from "@\/lib\/(cabinet-acces|cabinet-dossiers|cabinet|exports-comptables|zip)"/;
  for (const f of fichiers("components").concat(surfaces)) {
    const src = lire(f);
    if (!/^"use client"/.test(src.trimStart())) continue;
    exige(`${f}, composant client sans import serveur cabinet`, !interdits.test(src), "crypto, clé de service ou lecture de dossiers embarqués dans le bundle navigateur");
  }
  contreEpreuve("un composant client qui importe cabinet-dossiers", interdits.test('import { x } from "@/lib/cabinet-dossiers";'));
}

console.log("");
if (echecs) {
  console.log(`check:cabinet, ${echecs} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("check:cabinet, accès au cockpit verrouillé : contrôle avant lecture, export borné au portefeuille, codes à usage unique.");
