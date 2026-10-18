#!/usr/bin/env node
/**
 * Contrôle du thème clair.
 *
 * Le thème clair (`.light` sur `<html>`) corrige les couleurs pastel via une
 * **liste blanche de noms de classes exacts** dans `app/globals.css`. Piège non
 * évident : `text-amber-200` y figure, `text-amber-200/80` non, Tailwind génère
 * deux classes distinctes. Une variante absente de la liste reste en pastel et
 * devient illisible sur fond clair, sans que ni TypeScript ni le build ne le
 * voient.
 *
 * C'est le premier bug de la série trouvée par Selim : les puces du diagnostic
 * de conformité Factur-X, en jaune sur beige. Quatre autres occurrences avaient
 * le même défaut, dont deux dans un composant présent sur treize pages.
 *
 * Usage : node scripts/check-theme-clair.mjs
 */

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const CSS = "app/globals.css";
const css = readFileSync(CSS, "utf8");

/** Classes explicitement corrigées pour le thème clair. */
const couvertes = new Set(
  [...css.matchAll(/\.light\s+\.(text-[a-z]+-\d+(?:\\\/\d+)?)/g)].map((m) => m[1].replace(/\\/g, ""))
);

/** Nuances claires : illisibles sur fond blanc si elles ne sont pas corrigées. */
const NUANCES_CLAIRES = new Set(["100", "200", "300", "400", "500"]);

/**
 * `ProposalDocument` gère sa propre palette clair/sombre : le document est une
 * carte blanche quel que soit le thème de l'application. Ses `text-slate-*`
 * sont voulus et ne doivent pas être corrigés par la liste blanche.
 */
const PALETTE_AUTONOME = ["components/ProposalDocument.tsx"];

const fichiers = [
  ...globSync("app/(dashboard)/**/*.tsx"),
  ...globSync("components/**/*.tsx"),
];

const RE_CLASSE =
  /text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+(?:\/\d+)?/g;

let echecs = 0;
let inspectees = 0;

for (const f of fichiers) {
  const chemin = f.replace(/\\/g, "/");
  if (PALETTE_AUTONOME.some((p) => chemin.endsWith(p))) continue;

  const src = readFileSync(f, "utf8");
  src.split("\n").forEach((ligneBrute, i) => {
    // On retire les commentaires avant d'analyser : le commentaire qui documente
    // ce piège cite lui-même une classe fautive, et se signalait tout seul.
    const t = ligneBrute.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    const ligne = ligneBrute.split("//")[0];

    for (const classe of ligne.match(RE_CLASSE) ?? []) {
      const nuance = /-(\d+)(?:\/|$)/.exec(classe)?.[1];
      if (!nuance || !NUANCES_CLAIRES.has(nuance)) continue;
      inspectees++;
      if (couvertes.has(classe)) continue;
      console.error(
        `✗ ${chemin}:${i + 1}, « ${classe} » n'a pas de surcharge thème clair : illisible sur fond blanc`
      );
      echecs++;
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
 * Second controle : fonds hex SOMBRES codes en dur (bg-[#xxxxxx]).
 *
 * Deuxieme bug de la serie (Actions requises du tableau de bord) : les
 * cartes high/medium avaient un fond `bg-[#241717]` / `bg-[#241d11]` fige.
 * Un hex litteral ne suit pas la classe `.light` ; le texte pose dessus,
 * lui, est `text-white` et bascule en `#111116` (noir) en clair. Resultat :
 * texte noir sur fond sombre, illisible, sans que tsc ni le build ne le
 * voient. La regle : dans les zones qui passent en clair, un fond sombre
 * doit venir d un token de theme (var(--...)), jamais d un hex fige.
 * ───────────────────────────────────────────────────────────────── */

// Zones marketing : jamais rendues sous .light (toujours sombre), donc un
// fond hex sombre y est volontaire et legitime.
const SOMBRE_ASSUME = ["components/landing/", "components/blog/"];
// Fichiers a palette autonome ou navbar volontairement sombre dans les deux
// themes. A revoir si l un doit un jour suivre le theme clair.
const FONDS_SOMBRES_TOLERES = [
  "components/ProposalDocument.tsx",
  "components/NavbarMobile.tsx",
];

const RE_BG_HEX = /bg-\[#([0-9a-fA-F]{6})\]/g;
// Luminance percue (0..255). En dessous du seuil, le fond est sombre : son
// texte lisible est clair, donc il casse en theme clair s il ne suit pas .light.
const estSombre = (hex) => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};

let fonds = 0;
for (const f of fichiers) {
  const chemin = f.replace(/\\/g, "/");
  if (SOMBRE_ASSUME.some((p) => chemin.includes(p))) continue;
  if (FONDS_SOMBRES_TOLERES.some((p) => chemin.endsWith(p))) continue;

  const src = readFileSync(f, "utf8");
  src.split("\n").forEach((ligneBrute, i) => {
    const t = ligneBrute.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    if (ligneBrute.includes("theme-ok")) return; // echappatoire documentee
    const ligne = ligneBrute.split("//")[0];
    for (const m of ligne.matchAll(RE_BG_HEX)) {
      if (!estSombre(m[1])) continue;
      console.error(
        `✗ ${chemin}:${i + 1}, « bg-[#${m[1]}] » est un fond sombre fige : il ne suit pas le theme clair alors que le texte, lui, bascule en noir. Utiliser un token var(--...).`
      );
      echecs++;
      fonds++;
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
 * Troisieme controle : fonds sombres en classes Tailwind (bg-indigo-950/50...).
 *
 * Meme defaut que le hex fige, vu le 18/10/2026 sur les cartes de plans de la
 * page d abonnement : la classe ne change pas en clair, le texte si (gris fonce
 * sur gris-violet moyen, contraste ~1,9:1). Couvert seulement si globals.css
 * porte une surcharge .light pour cette classe exacte (opacite comprise).
 * ───────────────────────────────────────────────────────────────── */
const RE_BG_SOMBRE = new RegExp(`^bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:800|900|950)(?:/\\d+)?$`);
const surchargeBg = (c) => css.includes(".light ." + c.replace("/", "\\/"));
let tailwindSombres = 0;
for (const f of fichiers) {
  const chemin = f.replace(/\\/g, "/");
  if (SOMBRE_ASSUME.some((p) => chemin.includes(p))) continue;
  if (FONDS_SOMBRES_TOLERES.some((p) => chemin.endsWith(p))) continue;
  readFileSync(f, "utf8").split("\n").forEach((ligneBrute, i) => {
    const t = ligneBrute.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    if (ligneBrute.includes("theme-ok")) return;
    for (const tok of ligneBrute.split(/[\s"'`{}()]+/)) {
      if (!RE_BG_SOMBRE.test(tok) || surchargeBg(tok)) continue;
      console.error(`✗ ${chemin}:${i + 1}, « ${tok} » est un fond sombre sans surcharge .light : texte illisible en clair`);
      echecs++;
      tailwindSombres++;
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
 * Quatrieme controle : les surcharges .light de texte colore doivent etre
 * LISIBLES, pas seulement presentes.
 *
 * Mesure du 18/10/2026 sur le compte de demonstration en theme clair : les
 * nuances 400 etaient remplacees par la 600 (vert « Payee », rouge « Relancer »),
 * ce qui passe sur blanc mais tombe entre 2,4 et 4,1 sur les pastilles teintees
 * ou ces textes sont poses. Chaque surcharge est donc evaluee dans le pire cas
 * plausible : sur une pastille de sa propre teinte (500 a 20 %) sur le fond de
 * page. Seuil 4,5 (texte courant).
 * ───────────────────────────────────────────────────────────────── */
const { PALETTE, contrastePire, contraste } = await import("./palette-clair.mjs");
let surchargesFaibles = 0;
for (const m of css.matchAll(/^\.light\s+\.text-([a-z]+)-(\d+)(\\\/\d+)?\s*\{\s*color:\s*([^;!]+?)\s*!important;\s*\}/gm)) {
  const [, teinte, nuance, opacite, couleur] = m;
  if (!PALETTE[teinte]) continue;
  const c = contrastePire(teinte, couleur.trim());
  if (c >= 4.5) continue;
  console.error(`✗ globals.css, « .light .text-${teinte}-${nuance}${opacite ? opacite.replace("\\", "") : ""} » vaut ${couleur.trim()} : ${c.toFixed(1)}:1 sur pastille ${teinte}, illisible (min 4,5)`);
  echecs++;
  surchargesFaibles++;
}

/* ─────────────────────────────────────────────────────────────────
 * Cinquieme controle : texte blanc sur fond colore plein (boutons, badges).
 *
 * Mesure du 18/10/2026 : « Enregistrer les parametres » (blanc sur vert 600)
 * a 3,8:1, ambre 500 a 2,1:1, survol indigo 500 a 4,47:1, et ce dans les deux
 * themes. Deux regles, au repos comme au survol :
 *   1. contraste blanc / fond >= 4,5 ;
 *   2. en theme clair, le fond doit figurer dans les exceptions
 *      [class~="bg-..."].text-white de globals.css, sinon le texte blanc
 *      bascule en noir sur un fond fonce.
 * ───────────────────────────────────────────────────────────────── */
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const NU = [500, 600, 700, 800, 900];
const blancPreserve = new Set([...css.matchAll(/\[class~="(bg-[a-z]+-\d+)"\]\.text-white/g)].map((m) => m[1]));
let boutonsFaibles = 0;
const tousFichiers = [...globSync("app/**/*.tsx"), ...globSync("components/**/*.tsx")];
for (const f of tousFichiers) {
  const chemin = f.replace(/\\/g, "/");
  if (PALETTE_AUTONOME.some((p) => chemin.endsWith(p))) continue;
  const sombreSeul = SOMBRE_ASSUME.some((p) => chemin.includes(p)) || !/app\/\(dashboard\)|components\//.test(chemin);
  readFileSync(f, "utf8").split("\n").forEach((ligne, i) => {
    for (const m of ligne.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const cls = (m[1] ?? m[2]).split(/\s+/);
      if (!cls.includes("text-white")) continue;
      for (const c of cls) {
        const mm = c.match(/^(hover:)?bg-([a-z]+)-(\d00)$/);
        if (!mm || !PALETTE[mm[2]] || !NU.includes(+mm[3])) continue;
        const r = contraste([255, 255, 255], hexRgb(PALETTE[mm[2]][NU.indexOf(+mm[3])]));
        if (r < 4.5) {
          console.error(`✗ ${chemin}:${i + 1}, texte blanc sur « ${c} » : ${r.toFixed(2)}:1 (min 4,5)`);
          echecs++; boutonsFaibles++;
        }
        if (!mm[1] && !sombreSeul && !blancPreserve.has(c)) {
          console.error(`✗ ${chemin}:${i + 1}, « ${c} text-white » absent des exceptions .light : texte noir sur fond fonce en theme clair`);
          echecs++; boutonsFaibles++;
        }
      }
    }
  });
}

if (echecs === 0) {
  console.log(`✓ Thème clair, ${inspectees} usages de couleurs claires et ${fonds === 0 ? "aucun" : fonds} fond hex sombre fige, ${tailwindSombres} fond Tailwind sombre non couvert, surcharges colorees lisibles, boutons blancs a 4,5 mini, tout est couvert`);
}
process.exit(echecs > 0 ? 1 : 0);
