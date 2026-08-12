#!/usr/bin/env node
/**
 * Contrôle du thème clair.
 *
 * Le thème clair (`.light` sur `<html>`) corrige les couleurs pastel via une
 * **liste blanche de noms de classes exacts** dans `app/globals.css`. Piège non
 * évident : `text-amber-200` y figure, `text-amber-200/80` non — Tailwind génère
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
const NUANCES_CLAIRES = new Set(["100", "200", "300", "400"]);

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
        `✗ ${chemin}:${i + 1} — « ${classe} » n'a pas de surcharge thème clair : illisible sur fond blanc`
      );
      echecs++;
    }
  });
}

if (echecs === 0) {
  console.log(`✓ Thème clair — ${inspectees} usages de couleurs claires, tous couverts par une surcharge`);
}
process.exit(echecs > 0 ? 1 : 0);
