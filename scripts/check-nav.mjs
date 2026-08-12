/**
 * Contrôle : ordinateur et mobile affichent la MÊME navigation.
 *
 * Historique de ce fichier, parce qu'il explique sa forme actuelle.
 *
 * Première version : elle comparait deux listes écrites à la main et vérifiait
 * la **présence** de chaque entrée. Elle est passée au vert alors que la
 * navigation mobile était réorganisée autrement — « Paiements clients » sous
 * *Facturation* au lieu de *Gestion*, « Activité » sous *Clients*, la section
 * *Gestion* purement absente. J'ai annoncé « les douze autres entrées
 * concordent » sur la foi de ce vert. C'était faux : j'avais posé au contrôle
 * une question plus étroite que celle qui comptait, puis lu sa réponse comme si
 * elle répondait à la question large.
 *
 * Version actuelle : la navigation vit dans `lib/navigation.ts`, un seul
 * endroit, et les deux composants la consomment. Le contrôle ne compare donc
 * plus deux listes — il vérifie qu'il n'en existe **qu'une**. C'est plus fort :
 * on ne surveille pas une divergence, on la rend impossible.
 *
 * Ce qu'il ne prouve toujours pas : que le menu s'affiche correctement, qu'il
 * tienne à l'écran, qu'il soit utilisable au pouce. Cela demande un téléphone
 * et des yeux.
 *
 * Usage : node scripts/check-nav.mjs
 */

import { readFileSync } from "node:fs";

const SOURCE = "lib/navigation.ts";
const CONSOMMATEURS = {
  "barre latérale": "components/SidebarNav.tsx",
  "menu mobile": "components/MobileNav.tsx",
};

let echecs = 0;
const source = readFileSync(SOURCE, "utf8");

// 1. Chaque composant consomme-t-il bien la source unique ?
for (const [nom, chemin] of Object.entries(CONSOMMATEURS)) {
  const code = readFileSync(chemin, "utf8");

  if (!/from\s+"@\/lib\/navigation"/.test(code)) {
    echecs++;
    console.log(`✗ ${nom} (${chemin}) n'importe pas @/lib/navigation`);
  }
  if (!/\bNAVIGATION\b/.test(code)) {
    echecs++;
    console.log(`✗ ${nom} n'utilise pas NAVIGATION`);
  }

  // 2. A-t-il reconstitué sa propre liste à côté ? C'est ainsi que la
  //    divergence était née la première fois.
  const listeLocale = code.match(/const\s+\w*NAV\w*\s*(?::[^=]+)?=\s*\[/);
  if (listeLocale) {
    echecs++;
    console.log(`✗ ${nom} redéfinit une liste de navigation : « ${listeLocale[0].trim()} »`);
    console.log(`    c'est exactement ainsi que les deux navigations ont divergé.`);
  }

  // 3. A-t-il sa propre règle de « lien actif » ? Elles avaient aussi divergé.
  if (/function\s+isActive\s*\(/.test(code)) {
    echecs++;
    console.log(`✗ ${nom} redéfinit isActive au lieu d'utiliser lienActif`);
  }
}

// 4. La source elle-même doit rester cohérente : pas de doublon de chemin.
const chemins = [...source.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
const doublons = chemins.filter((h, i) => chemins.indexOf(h) !== i);
if (doublons.length) {
  echecs++;
  console.log(`✗ chemins en double dans ${SOURCE} : ${[...new Set(doublons)].join(", ")}`);
}

// Contre-épreuve : le contrôle sait-il repérer une liste locale ?
const temoin = 'const NAV: NavItem[] = [\n  { href: "/x" },\n];';
if (!/const\s+\w*NAV\w*\s*(?::[^=]+)?=\s*\[/.test(temoin)) {
  echecs++;
  console.log("✗ contre-épreuve : le motif ne détecte plus une liste locale.");
} else {
  console.log("Contre-épreuve : une liste de navigation locale serait bien détectée.");
}

console.log("");
if (echecs > 0) {
  console.log(`${echecs} problème(s) de navigation.`);
  process.exit(1);
}
console.log(
  `✓ Navigation — ${chemins.length} entrées, une seule source, consommée par les deux supports`
);
