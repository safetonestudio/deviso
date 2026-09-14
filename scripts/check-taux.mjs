/**
 * check:taux — aucun taux de cotisations écrit en dur hors de sa source.
 *
 * Pourquoi ce contrôle existe. Le 13/09/2026, `lib/tarifs-data.ts` a été corrigé :
 * il appliquait 22 % de cotisations avec un commentaire admettant « taux 2024 »,
 * alors que le décret du 8 septembre 2025 les porte à 25,6 % (SSI) et 23,2 %
 * (Cipav). La constante a été corrigée. **Les textes qui la doublaient ne l'ont
 * pas été** : le 14/09, `/combien-facturer` et les dix pages
 * `/combien-facturer/<métier>` affichaient encore « 22 % de cotisations URSSAF »
 * et un revenu net à « × 0.78 » — à côté d'un simulateur qui, lui, lisait la
 * constante et calculait à 25,6 %. Deux chiffres contradictoires sur le même
 * écran, sur la vitrine d'un logiciel de facturation.
 *
 * La règle que ce script tient : le taux vit dans `lib/tarifs-data.ts`, avec sa
 * source et sa date. Partout ailleurs, il se lit ; il ne se recopie pas.
 *
 * ⚠️ Ce que ce contrôle NE couvre PAS :
 *   · il ne dit pas si la valeur de `lib/tarifs-data.ts` est **juste** — un taux
 *     réglementaire est une date de péremption sans alarme, à relire chaque année ;
 *   · il ne voit pas un taux épelé en lettres (« vingt-cinq virgule six ») ;
 *   · il ne voit pas un taux calculé à partir d'une autre constante fausse ;
 *   · **il ne lit pas les articles de blog** (`app/blog/`). Un article peut
 *     légitimement citer un autre taux — celui des BIC, un agrégat
 *     « URSSAF + mutuelle + retraite », une tranche d'impôt — et distinguer
 *     l'erreur de la citation demande un jugement éditorial qu'un script n'a
 *     pas. Les chiffres réglementaires des articles se relisent une fois l'an,
 *     à la main, et se datent : voir `docs/seo/journal.md` ;
 *   · il ne couvre que les cotisations du micro-entrepreneur : TVA, impôt sur le
 *     revenu et taux de pénalité ont leurs propres sources.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { TAUX_COTISATIONS_BNC, TAUX_COTISATIONS_BNC_CIPAV } from "../lib/tarifs-data.ts";

const RACINE = process.cwd();
const DOSSIERS = ["app", "components"];
const IGNORE = new Set(["node_modules", ".next", ".git", "public"]);
/** Voir l'avertissement en tête : les articles relèvent d'une relecture humaine. */
const HORS_PERIMETRE = /^app[\\/]blog[\\/]/;

/** Les seules valeurs que le projet a le droit d'énoncer, dérivées de la source. */
const ADMIS = new Set(
  [TAUX_COTISATIONS_BNC, TAUX_COTISATIONS_BNC_CIPAV].flatMap((t) => {
    const pct = t * 100;
    return [
      pct.toLocaleString("fr-FR", { maximumFractionDigits: 1 }),
      pct.toLocaleString("fr-FR", { minimumFractionDigits: 1 }),
      String(pct).replace(".", ","),
      String(pct),
    ];
  })
);

/** Un pourcentage dans une phrase qui parle de cotisations… */
const CONTEXTE = /(cotisation|URSSAF|charges sociales)/i;
/** …mais pas d'un agrégat ni d'un autre impôt, qui ont leurs propres taux. */
const AUTRE_SUJET = /(mutuelle|retraite|tranche|imp[ôo]t sur le revenu|\bIR\b|TVA|p[ée]nalit)/i;
const POURCENT = /(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:%|&nbsp;%)/g;
/**
 * Un complément à 1 appliqué à un chiffre d'affaires : `* 0.78`, `* 0,744`.
 * Borné à 0,70–0,79 : au-delà on attrape les facteurs d'affichage (hauteur de
 * barre d'un graphique en `* 0.88`), qui n'ont rien à voir avec un taux.
 */
const COMPLEMENT = /\*\s*0[.,](7\d\d?)\b/;

function sansCommentaires(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function fichiers(dossier) {
  const out = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (IGNORE.has(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|mjs)$/.test(e.name)) out.push(p);
    }
  })(dossier);
  return out;
}

const problemes = [];
let lus = 0;

for (const dossier of DOSSIERS) {
  let ok = true;
  try { ok = statSync(join(RACINE, dossier)).isDirectory(); } catch { ok = false; }
  if (!ok) continue;

  for (const f of fichiers(join(RACINE, dossier))) {
    lus++;
    const lignes = sansCommentaires(readFileSync(f, "utf8")).split(/\r?\n/);
    lignes.forEach((ligne, i) => {
      const rel = relative(RACINE, f);

      if (HORS_PERIMETRE.test(rel)) return;

      if (CONTEXTE.test(ligne) && !AUTRE_SUJET.test(ligne)) {
        for (const m of ligne.matchAll(POURCENT)) {
          if (ADMIS.has(m[1])) continue;
          problemes.push({ fichier: rel, ligne: i + 1, quoi: `${m[1]} %`,
            extrait: ligne.trim().slice(0, 120) });
        }
      }

      const c = ligne.match(COMPLEMENT);
      if (c && /(CA|caMensuel|chiffre|tjm|TJM|jours)/i.test(ligne)) {
        problemes.push({ fichier: rel, ligne: i + 1, quoi: c[0].trim(),
          extrait: ligne.trim().slice(0, 120) });
      }
    });
  }
}

/**
 * Contre-épreuve. Un contrôle qu'on n'a jamais vu échouer ne prouve rien : on
 * lui redonne les deux formes exactes du défaut du 14/09 et on vérifie qu'il
 * crie. La ligne fautive est reconstruite ici, pas remise dans le code.
 */
const CONTRE_EPREUVES = [
  { ligne: 'vous versez <strong>22 % de cotisations URSSAF</strong> sur votre CA',
    quoi: "un taux de cotisations recopié" },
  { ligne: '{(defaultTjm * data.joursFacturables * 0.78).toLocaleString("fr-FR")}',
    quoi: "un revenu net calculé par un complément en dur" },
];
const ratees = CONTRE_EPREUVES.filter(({ ligne }) => {
  const parPourcent =
    CONTEXTE.test(ligne) && !AUTRE_SUJET.test(ligne) &&
    [...ligne.matchAll(POURCENT)].some((m) => !ADMIS.has(m[1]));
  const parComplement =
    COMPLEMENT.test(ligne) && /(CA|caMensuel|chiffre|tjm|TJM|jours)/i.test(ligne);
  return !parPourcent && !parComplement;
});
if (ratees.length > 0) {
  console.error("check:taux — le contrôle ne détecte plus le défaut qu'il surveille :");
  for (const r of ratees) console.error(`  raté : ${r.quoi}\n    ${r.ligne}`);
  process.exit(1);
}

if (problemes.length === 0) {
  for (const c of CONTRE_EPREUVES) console.log(`  ·    contre-épreuve : ${c.quoi} bien détecté`);
  console.log(
    `check:taux — ${lus} fichiers, aucun taux de cotisations en dur ` +
    `(source : ${(TAUX_COTISATIONS_BNC * 100).toLocaleString("fr-FR")} % / ` +
    `${(TAUX_COTISATIONS_BNC_CIPAV * 100).toLocaleString("fr-FR")} % Cipav).`
  );
  process.exit(0);
}

console.error(`check:taux — ${problemes.length} taux de cotisations écrit en dur :\n`);
for (const p of problemes) {
  console.error(`  ${p.fichier}:${p.ligne}  ${p.quoi}`);
  console.error(`    ${p.extrait}`);
}
console.error(`
Le taux vit dans lib/tarifs-data.ts (TAUX_COTISATIONS_BNC, TAUX_COTISATIONS_BNC_CIPAV),
avec sa source et sa date. Ici, l'importer et l'interpoler plutôt que le recopier :

  const PCT = (TAUX_COTISATIONS_BNC * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 });

Et pour un revenu net, multiplier par (1 - TAUX_COTISATIONS_BNC), jamais par 0.78.`);
process.exit(1);
