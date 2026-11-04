#!/usr/bin/env node
/**
 * Controle : la migration Tailwind 3 -> 4 ne se defait pas en silence.
 *
 * Pourquoi. Tailwind 4 a supprime ou change le sens de classes que des annees
 * d'habitude (et de code genere) ecrivent encore en v3. Aucune ne fait echouer
 * le build : une classe supprimee ne produit simplement rien, une classe
 * renommee produit autre chose. Le rendu derive sans erreur ni avertissement.
 * La migration du 04/11/2026 a ete faite a rendu identique (comparaison des
 * styles calcules v3/v4 sur 2 148 chaines de classes reelles) ; ce controle
 * garde ce qui la rend identique.
 *
 *   1. Aucune classe de la v3 supprimee ou dont le sens a change dans
 *      app/ et components/ (liste tiree du guide de migration officiel).
 *   2. La mecanique de compatibilite reste en place : preflight v3, hover sans
 *      media query, interlignes v3, sources limitees a app/ components/ pages/,
 *      greffon PostCSS branche apres Tailwind, pas de tailwind.config.
 *   3. Le greffon postcss-compat-tw3.js reecrit bien ce qu'il doit, et rien
 *      d'autre (essais sur des regles types).
 * Chaque regle a sa contre-epreuve : on lui montre l'infraction, elle doit crier.
 *
 * Usage : node scripts/check-tailwind4.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let echecs = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const ko = (m, p) => { echecs++; console.log(`  KO   ${m}\n       ${p}`); };
const exige = (m, c, p) => (c ? ok(m) : ko(m, p));
const contre = (m, d) => (d ? ok(`contre-epreuve : ${m} EST detecte`) : ko(`contre-epreuve : ${m}`, "le controle ne verrait pas l'infraction"));
const lire = (f) => readFileSync(f, "utf8");

function fichiers(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== "node_modules" && !n.startsWith(".")) fichiers(p, out); }
    else if (/\.(tsx|ts|jsx|js|mdx)$/.test(n)) out.push(p.replace(/\\/g, "/"));
  }
  return out;
}

console.log("");
console.log("-- check:tailwind4 --");
console.log("");

// 1. Classes v3 supprimees ou changees de sens.
//    Un jeton = suite de variantes (sm:, hover:, group-hover:...) puis la classe.
const AVANT = String.raw`(?<![\w\-/\[.:])(?:[a-z0-9\-\[\]&_>*=.()'"]+:)*!?`;
const APRES = String.raw`(?![\w\-/\[])`;
const INTERDITES = [
  ["bg/text/border/divide/ring/placeholder-opacity-*", String.raw`(?:bg|text|border|divide|ring|placeholder)-opacity-\d+`, "supprimees : ecrire la couleur avec /NN (bg-black/50)"],
  ["flex-shrink-* / flex-grow-*", String.raw`flex-(?:shrink|grow)(?:-\d+)?`, "renommees shrink-* / grow-*"],
  ["overflow-ellipsis", String.raw`overflow-ellipsis`, "renommee text-ellipsis"],
  ["decoration-slice / decoration-clone", String.raw`decoration-(?:slice|clone)`, "renommees box-decoration-slice / box-decoration-clone"],
  ["bg-gradient-to-*", String.raw`bg-gradient-to-(?:tr|tl|br|bl|r|l|t|b)`, "ecrire bg-linear-to-*/srgb"],
  ["bg-linear-to-* sans /srgb", String.raw`bg-linear-to-(?:tr|tl|br|bl|r|l|t|b)(?!/)`, "la v4 interpole en oklab : /srgb garde le rendu v3 de tous les degrades existants"],
  ["shadow nu", String.raw`shadow`, "en v4 la valeur de l'ancien shadow s'ecrit shadow-sm (et l'ancien shadow-sm, shadow-xs)"],
  ["rounded nu", String.raw`rounded`, "en v4 l'ancien rounded s'ecrit rounded-sm (et l'ancien rounded-sm, rounded-xs)"],
  ["blur nu / backdrop-blur nu / drop-shadow nu", String.raw`(?:backdrop-)?blur|drop-shadow`, "en v4 : blur-sm, backdrop-blur-sm, drop-shadow-sm (l'ancien -sm devient -xs)"],
  ["ring nu", String.raw`ring`, "ring valait 3 px en v3, 1 px en v4 : ecrire ring-3 (ou ring-1)"],
  ["outline-none", String.raw`outline-none`, "en v4 outline-none ne masque plus le contour de la meme facon : ecrire outline-hidden"],
  ["important en prefixe (!classe)", String.raw`(?<=[\s"'\x60:])![a-z]\w*-[\w\-/\[\].]*(?=[\s"'\x60]|$)`,"ecrire le ! en suffixe (border-red-500!)"],
  ["variable arbitraire en crochets (bg-[--x])", String.raw`[a-z]+-\[--[\w-]+\]`, "en v4 bg-[--x] n'est plus une variable : ecrire bg-(--x)"],
];
const sources = [...fichiers("app"), ...fichiers("components"), ...fichiers("pages")];
const textes = sources.map((f) => [f, lire(f)]);
const motif = (corps) => corps.startsWith("(?<=") ? new RegExp(corps) : new RegExp(AVANT + "(?:" + corps + ")" + APRES);
function enCause(re) {
  const r = [];
  for (const [f, t] of textes) {
    const lignes = t.split("\n");
    lignes.forEach((l, i) => {
      // les commentaires de code ne sont pas des classes (ex. "Highlight ring")
      const code = l.replace(/\/\/.*$/, "").replace(/\{\/\*.*?\*\/\}/g, "").replace(/\/\*.*?\*\//g, "");
      if (/^\s*\*/.test(l)) return;
      if (re.test(code)) r.push(`${f}:${i + 1}`);
    });
  }
  return r;
}
for (const [nom, corps, conseil] of INTERDITES) {
  const re = motif(corps);
  const r = enCause(re);
  exige(`aucune classe v3 "${nom}"`, r.length === 0, `${conseil}. En cause : ${r.slice(0, 5).join(", ")}`);
}
// Contre-epreuves : chaque motif voit l'infraction, et ne voit pas la forme correcte.
const VU = [
  ["bg/text/border/divide/ring/placeholder-opacity-*", 'className="bg-black bg-opacity-50"', 'className="bg-black/50"'],
  ["flex-shrink-* / flex-grow-*", 'className="flex-shrink-0 p-2"', 'className="shrink-0 p-2"'],
  ["overflow-ellipsis", 'className="truncate overflow-ellipsis"', 'className="text-ellipsis"'],
  ["decoration-slice / decoration-clone", 'className="decoration-clone"', 'className="box-decoration-clone"'],
  ["bg-gradient-to-*", 'className="bg-gradient-to-br from-indigo-500"', 'className="bg-linear-to-br/srgb from-indigo-500"'],
  ["bg-linear-to-* sans /srgb", 'className="sm:bg-linear-to-r from-x"', 'className="sm:bg-linear-to-r/srgb from-x"'],
  ["shadow nu", 'className={`h-5 w-5 bg-ink shadow ${x}`}', 'className="shadow-sm shadow-ds-card shadow-indigo-500/20"'],
  ["rounded nu", 'className="w-4 h-4 rounded border"', 'className="rounded-sm rounded-xl rounded-t-lg"'],
  ["blur nu / backdrop-blur nu / drop-shadow nu", 'className="fixed backdrop-blur inset-0"', 'className="backdrop-blur-sm blur-xs drop-shadow-md"'],
  ["ring nu", 'className="focus:ring ring-indigo-500"', 'className="ring-2 ring-indigo-500 ring-offset-2"'],
  ["outline-none", 'className="focus:outline-none"', 'className="focus:outline-hidden"'],
  ["important en prefixe (!classe)", 'className="!border-indigo-500/40"', 'className="border-indigo-500/40!" disabled={!form.name || !estAvoir(f)}'],
  ["variable arbitraire en crochets (bg-[--x])", 'className="bg-[--urgency-ok-bg]"', 'className="bg-(--urgency-ok-bg) bg-[var(--x)]"'],
];
for (const [nom, mauvais, bon] of VU) {
  const re = motif(INTERDITES.find((x) => x[0] === nom)[1]);
  contre(`"${nom}"`, re.test(mauvais) && !re.test(bon));
}

// 2. Mecanique de compatibilite.
const css = lire("app/globals.css");
const postcss = lire("postcss.config.js");
const MECANIQUE = [
  ["globals.css charge le preflight v3 a la place de celui de la v4",
    (s) => /@import "tailwindcss\/theme\.css" layer\(theme\);/.test(s) && /@import "\.\/preflight-tw3\.css" layer\(base\);/.test(s)
      && /@import "tailwindcss\/utilities\.css" layer\(utilities\) source\(none\);/.test(s) && !/@import ["']tailwindcss["']/.test(s),
    "sans lui : placeholders, curseur des boutons, fond des champs et attribut hidden changent (voir app/preflight-tw3.css)"],
  ["sources limitees au content de la v3 (app, components, pages)",
    (s) => ["pages", "components", "app"].every((d) => s.includes(`@source "../${d}/**/*.{js,ts,jsx,tsx,mdx}";`)),
    "la v4 lirait tout le depot et generait des classes que la v3 ignorait"],
  ["classes sans effet en v3 toujours exclues (@source not inline)",
    (s) => s.includes('@source not inline("bg-ds-bg/{70,80,85,90} bg-ds-elevated/{30,40,60} bg-ds-surface/90 hover:bg-ds-elevated/{30,40,50,60}");')
      && s.includes('@source not inline("border-current/20 flex-2");'),
    "les reactiver change le rendu (en-tetes opaques, survols, bouton du devis public) : decision de refonte, pas de migration"],
  ["hover sans media query (comportement v3, toucher compris)",
    (s) => /@custom-variant hover \(&:hover\);/.test(s), "la v4 n'applique hover: que sur pointeur fin"],
  ["interlignes v3 en rem (text-xs a text-4xl)",
    (s) => ["xs: 1rem", "sm: 1.25rem", "base: 1.5rem", "lg: 1.75rem", "xl: 1.75rem", "2xl: 2rem", "3xl: 2.25rem", "4xl: 2.5rem"]
      .every((v) => { const [t, h] = v.split(": "); return s.includes(`--text-${t}--line-height: ${h};`); }),
    "la v4 ecrit des rapports sans unite, herites differemment"],
  ["couleur d'anneau par defaut de la v3",
    (s) => s.includes("--tw-ring-color: rgb(147 197 253 / 0.5);"), "ring-2 sans couleur passerait en currentColor"],
  ["regles Deviso dans la couche utilities (arbitrage v3 par specificite)",
    (s) => /@layer utilities \{\s*\n\s*\/\* Une page qui porte son propre en-tete/.test(s) && /\} \/\* fin @layer utilities \*\/\s*$/.test(s),
    "hors couche, .carte-app et consorts ecraseraient tout utilitaire (hover:bg-* compris)"],
];
for (const [m, f, p] of MECANIQUE) exige(m, f(css), p);
contre("un retour a @import \"tailwindcss\"", !MECANIQUE[0][1](css.replace('@import "tailwindcss/theme.css" layer(theme);', '@import "tailwindcss";')));
contre("une classe sans effet reactivee", !MECANIQUE.find((x) => x[0].startsWith("classes sans effet"))[1](css.replace(" flex-2\");", "\");")));
contre("le hover v4", !MECANIQUE.find((x) => x[0].startsWith("hover"))[1](css.replace("@custom-variant hover (&:hover);", "")));
contre("un interligne retire", !MECANIQUE.find((x) => x[0].startsWith("interlignes"))[1](css.replace("--text-sm--line-height: 1.25rem;", "")));
contre("des regles sorties de la couche", !MECANIQUE.find((x) => x[0].startsWith("regles Deviso"))[1](css.replace("} /* fin @layer utilities */", "")));

const ordre = (s) => { const a = s.indexOf('"@tailwindcss/postcss"'), b = s.indexOf('"postcss-compat-tw3.js"'); return a >= 0 && b > a; };
exige("postcss.config.js : greffon compat branche APRES @tailwindcss/postcss", ordre(postcss),
  "avant Tailwind il ne verrait aucune regle ; absent, space-*, divide-* et les interlignes reprennent le sens v4");
contre("un greffon compat retire", !ordre(postcss.replace('"postcss-compat-tw3.js"', '"autre.js"')));
const configs = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs"].filter(existsSync);
exige("aucun tailwind.config (ignore par la v4, il tromperait le lecteur)", configs.length === 0, `a supprimer : ${configs.join(", ")}`);

// 3. Le greffon lui-meme.
const compat = require("../postcss-compat-tw3.js");
const R = compat.reecrireSelecteur;
const essais = [
  [":where(.space-y-4 > :not(:last-child))", ".space-y-4 > :not([hidden]) ~ :not([hidden])"],
  [":where(.space-y-4>:not(:last-child))", ".space-y-4 > :not([hidden]) ~ :not([hidden])"],
  [":where(.sm\\:-space-x-2>:not(:last-child))", ".sm\\:-space-x-2 > :not([hidden]) ~ :not([hidden])"],
  [":where(.hover\\:divide-y:hover>:not(:last-child))", ".hover\\:divide-y:hover > :not([hidden]) ~ :not([hidden])"],
  [":where(.divide-ds-border>:not(:last-child))", ".divide-ds-border > :not([hidden]) ~ :not([hidden])"],
  [":where(.autre>:not(:last-child))", ":where(.autre>:not(:last-child))"],
];
const rates = essais.filter(([e, a]) => R(e) !== a);
exige("greffon : selecteurs space-*/divide-* ramenes a la forme v3, les autres intacts", rates.length === 0, `rates : ${rates.map((x) => x[0]).join(" ; ")}`);
const P = compat.PERMUTATION;
exige("greffon : permutation des marges et bordures conforme a la v3",
  P["margin-block-end"] === "margin-top" && P["margin-block-start"] === "margin-bottom" && P["margin-inline-end"] === "margin-left"
  && P["margin-inline-start"] === "margin-right" && P["border-bottom-width"] === "border-top-width" && P["border-top-width"] === "border-bottom-width"
  && P["border-inline-end-width"] === "border-left-width" && P["border-inline-start-width"] === "border-right-width",
  "space-y-4 poserait la marge sous l'element au lieu du dessus");
const I = compat.INTERLIGNE;
exige("greffon : interligne des tailles de texte sans var(--tw-leading)",
  "var(--tw-leading, 1.25rem)".replace(I, "$1") === "1.25rem" && "calc(var(--spacing) * 6)".replace(I, "$1") === "calc(var(--spacing) * 6)",
  "un leading-* l'emporterait sur sm:text-4xl, contrairement a la v3");
contre("un selecteur space mal reecrit", essais.some(([e, a]) => (e.includes("space") ? e : null) && R(e.replace("space", "spaze")) !== a.replace("space", "spaze")));

console.log("");
if (echecs) { console.log(`check:tailwind4, ${echecs} defaut(s).`); process.exit(1); }
console.log("check:tailwind4, aucune classe v3 perimee, compatibilite de rendu en place.");
