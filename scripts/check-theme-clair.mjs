#!/usr/bin/env node
/**
 * Controle du theme de l'app (clair et sombre).
 *
 * Historique. Le theme clair corrigeait les couleurs par une liste blanche de
 * 112 surcharges `.light .text-amber-200 { ... !important }`, une par nom de
 * classe exact. Une variante absente (`text-amber-200/80`) restait pastel et
 * devenait illisible, sans que rien ne le signale. Cinq bugs de ce type ont
 * ete trouves a la main.
 *
 * Depuis la refonte visuelle, la classe de bug est supprimee a la racine :
 * chaque nuance Tailwind pointe vers une variable semantique (tailwind.config),
 * que `.ds-app` et `.light .ds-app` redefinissent (globals.css). Ce controle
 * verrouille ce systeme pour qu'il ne se degrade pas :
 *   1. pas de retour des surcharges classe par classe ni des !important ;
 *   2. les deux themes definissent toutes les variables ;
 *   3. pas de blanc code en dur (text-white...) : on ecrit text-ink, qui suit
 *      le theme et reste blanc sur un aplat colore ;
 *   4. dans l'app, pas de fond pale 50/100 (son echelle s'inverse en clair) ;
 *   5. les mises en page de l'app posent l'enveloppe .ds-app et ses polices.
 *
 * Usage : node scripts/check-theme-clair.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

let echecs = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const ko = (m, p) => { echecs++; console.log(`  KO   ${m}\n       ${p}`); };
const exige = (m, c, p) => (c ? ok(m) : ko(m, p));
const contre = (m, d) => (d ? ok(`contre-epreuve : ${m} EST detecte`) : ko(`contre-epreuve : ${m}`, "le controle ne verrait pas l'infraction"));
const lire = (f) => readFileSync(f, "utf8");

function fichiers(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== "node_modules" && !n.startsWith(".")) fichiers(p, out); }
    else if (/\.(tsx|ts)$/.test(n)) out.push(p.replace(/\\/g, "/"));
  }
  return out;
}

console.log("");
console.log("-- check:theme --");
console.log("");

const css = lire("app/globals.css");
const config = lire("tailwind.config.ts");

// 1. Plus de surcharges classe par classe, plus de !important hors impression.
const SURCHARGE = /^\.light\s+\.(text|bg|border|hover\\:)[a-z-]*-\d/m;
const horsPrint = (s) => s.replace(/@media print\s*\{[\s\S]*?\n\}/g, "");
const IMPORTANT = (s) => /!important/.test(horsPrint(s));
exige("globals.css, aucune surcharge .light classe par classe", !SURCHARGE.test(css),
  "le theme clair passe par les variables de .light .ds-app, pas par une liste de classes");
exige("globals.css, aucun !important hors impression", !IMPORTANT(css),
  "un !important masque un probleme de palette : corriger la variable, pas la classe");
contre("une surcharge .light .text-amber-200", SURCHARGE.test(css + "\n.light .text-amber-200 { color: #92400e; }"));
contre("un !important hors impression", IMPORTANT(css + "\n.x { color: red !important; }"));

// 2. Toutes les variables definies dans les deux themes, et dans le papier.
const FAMILLES = ["n", "acc", "warn", "dng", "inf"];
const ETAPES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const bloc = (sel) => { const m = css.match(new RegExp(sel.replace(/\./g, "\\.") + "\\s*\\{([^}]*)\\}")); return m ? m[1] : ""; };
const manquantes = (b) => FAMILLES.flatMap((f) => ETAPES.map((e) => `--${f}-${e}`)).filter((v) => !b.includes(v + ":"));
for (const sel of [".ds-app", ".light .ds-app"]) {
  const m = manquantes(bloc(sel));
  exige(`${sel}, les ${FAMILLES.length * ETAPES.length} variables de palette`, m.length === 0, `manquantes : ${m.slice(0, 8).join(", ")}`);
  exige(`${sel}, encre et fond definis`, /--ink:/.test(bloc(sel)) && /--ds-bg:/.test(bloc(sel)), "--ink et --ds-bg requis");
}
exige(".ds-papier, echelle standard complete", manquantes(bloc(".ds-papier")).length === 0, "les apercus de documents perdraient leur palette");
exige("tailwind.config, palettes reliees aux familles semantiques",
  ["gray", "indigo", "violet", "emerald", "amber", "red", "blue", "sky"].every((p) => new RegExp(`\\b${p}: relier\\(`).test(config)) && /\bink:/.test(config),
  "une palette non reliee garde ses couleurs Tailwind et ignore le theme");

// 3. Pas de blanc code en dur.
const BLANC = /(?<![\w-])(?:[a-z0-9-]+:)*(?:(?:text|fill|stroke)-white(?![\w/-])|(?:bg|border|ring|divide|from|via|to|fill|stroke|outline|text|shadow|placeholder|decoration)-white\/)/;
const tout = [...fichiers("app"), ...fichiers("components")];
const blancs = tout.filter((f) => BLANC.test(lire(f)));
exige("aucun text-white / *-white/NN code en dur (utiliser text-ink, bg-ink/NN)", blancs.length === 0, `en cause : ${blancs.slice(0, 6).join(", ")}`);
contre("un text-white", BLANC.test('className="text-white font-semibold"'));
contre("un hover:text-white", BLANC.test('className="hover:text-white"'));
contre("un bg-white/10", BLANC.test('className="bg-white/10"'));

// 4. Dans l'app : pas de fond pale 50/100 (echelle inversee en clair).
//    Perimetre : les mises en page de l'app et tout ce qu'elles importent.
function perimetreApp() {
  const vus = new Set();
  const pile = [...fichiers("app/(dashboard)"), ...fichiers("app/(cabinet)")];
  while (pile.length) {
    const f = pile.pop();
    if (vus.has(f) || !existsSync(f)) continue;
    vus.add(f);
    for (const m of lire(f).matchAll(/from\s+["'](@\/components\/[^"']+|\.{1,2}\/[^"']+)["']/g)) {
      const base = m[1].startsWith("@/") ? m[1].slice(2) : resolve(dirname(f), m[1]).replace(/\\/g, "/").replace(resolve(".").replace(/\\/g, "/") + "/", "");
      for (const ext of [".tsx", ".ts", "/index.tsx"]) if (existsSync(base + ext)) pile.push(base + ext);
    }
  }
  return [...vus];
}
const PAPIER = ["components/ProposalDocument.tsx"]; // rendu dans .ds-papier, echelle standard
const PALE = /(?<![\w-])(?:[a-z0-9-]+:)*bg-(?:gray|slate|zinc|neutral|stone|indigo|violet|purple|emerald|green|teal|amber|yellow|orange|red|rose|pink|blue|sky|cyan)-(?:50|100)(?![\w-]|\/)/;
const app = perimetreApp();
const pales = app.filter((f) => !PAPIER.includes(f) && PALE.test(lire(f)));
exige(`app (${app.length} fichiers), aucun fond pale 50/100`, pales.length === 0,
  `en clair ces nuances deviennent foncees ; utiliser bg-*-500/10 ou bg-ds-elevated. En cause : ${pales.join(", ")}`);
contre("un hover:bg-indigo-50", PALE.test('className="hover:bg-indigo-50"'));
contre("un bg-slate-100", PALE.test('className="bg-slate-100 p-2"'));

// 4 bis. Pas d'etiquette en capitales espacees (tic de gabarit) dans l'app.
const CAPITALES = /(?<![\w:-])uppercase(?![\w-])/;
const capitales = app.filter((f) => CAPITALES.test(lire(f)));
exige("app, aucune etiquette en capitales (classe uppercase)", capitales.length === 0,
  `ecrire les etiquettes en casse normale, la hierarchie passe par la taille et la graisse. En cause : ${capitales.join(", ")}`);
contre("une etiquette uppercase", CAPITALES.test('className="text-xs uppercase tracking-widest"'));

// 5. Enveloppe et polices.
const theme = lire("components/DashboardTheme.tsx");
exige("DashboardThemeProvider pose .ds-app et le script anti-flash",
  /className=\{`ds-app /.test(theme) && /SCRIPT_THEME/.test(theme) && /dangerouslySetInnerHTML/.test(theme),
  "sans .ds-app la palette de l'app ne s'applique pas ; sans le script, flash de theme au chargement");
for (const l of ["app/(dashboard)/layout.tsx", "app/(cabinet)/layout.tsx"]) {
  exige(`${l}, polices de l'app transmises`, /<DashboardThemeProvider className=\{policesApp\}>/.test(lire(l)), "les ecrans retomberaient sur Inter");
}

console.log("");
if (echecs) { console.log(`check:theme, ${echecs} defaut(s).`); process.exit(1); }
console.log("check:theme, palette pilotee par le theme, aucune surcharge, aucun blanc code en dur.");
