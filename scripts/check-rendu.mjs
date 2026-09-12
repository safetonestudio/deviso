/**
 * Ce que seul le HTML rendu peut dire.
 *
 * Pourquoi ce fichier existe. Le 12/09/2026, « Ce qu&rsquo;il se passe quand
 * vous dépassez un seuil de TVA » s'est affiché tel quel, entité comprise, sur
 * une page publique. La cause : les paragraphes d'un article étaient rendus en
 * HTML, mais les titres de section interpolés en texte brut. Deux chemins de
 * rendu pour un même type de contenu.
 *
 * `check-blog.mjs` surveille maintenant ce cas dans le gabarit concerné. Mais un
 * contrôle qui lit le *source* ne peut pas couvrir un composant qui n'existe pas
 * encore : le prochain gabarit refera la même faute, et le garde statique n'en
 * saura rien. D'où ce contrôle-ci, qui ne lit pas le code mais le résultat.
 *
 * Trois symptômes, tous invisibles à la compilation :
 *
 *   - une entité affichée littéralement (`&amp;rsquo;` dans la sortie), donc un
 *     texte qui aurait dû être rendu en HTML et ne l'a pas été ;
 *   - une balise affichée comme du texte (`&lt;strong&gt;`), l'erreur inverse ;
 *   - une entité recopiée dans un contexte texte brut — JSON-LD, `<meta>` —
 *     où Google lit « qu&rsquo;il » au lieu de « qu'il ».
 *
 * Usage : npm run build && node scripts/check-rendu.mjs
 * Sans dossier `.next`, le contrôle se déclare non concluant plutôt que vert :
 * un garde qui passe sans avoir rien regardé est pire que pas de garde.
 */

import { readFileSync, globSync, existsSync } from "node:fs";

const RACINE = ".next/server/app";

if (!existsSync(RACINE)) {
  console.error("check:rendu — aucun build trouvé dans .next. Lancez `npm run build` d'abord.");
  process.exit(1);
}

const pages = globSync(`${RACINE}/**/*.html`).map((f) => f.replace(/\\/g, "/"));

if (pages.length === 0) {
  console.error("check:rendu — build présent mais aucune page HTML pré-rendue. Rien n'a été vérifié.");
  process.exit(1);
}

// Les entités que le rendu HTML produit légitimement : elles encodent un
// caractère, elles ne sont pas le signe d'un texte non rendu.
const LEGITIMES = new Set(["&quot;", "&amp;", "&lt;", "&gt;", "&#x27;", "&#39;"]);
const ENTITE = /&(?:#x?[\da-fA-F]+|[a-zA-Z]+);/g;

const FLEX = /\bflex\b/;
const INLINE = /<(strong|em|sup|sub|code|b|i)\b/;

const anomalies = [];
const nom = (f) => f.slice(RACINE.length + 1);

for (const f of pages) {
  const html = readFileSync(f, "utf8");

  // 1. Entité doublement échappée : le texte est parti en `dangerouslySet…`
  //    nulle part, React a échappé le `&`, le lecteur voit `&rsquo;`.
  for (const m of html.matchAll(/&amp;(?:#x?[\da-fA-F]+|[a-zA-Z]+);/g)) {
    anomalies.push({
      page: nom(f),
      genre: "entité affichée littéralement",
      extrait: extrait(html, m.index, m[0].length),
    });
  }

  // 2. L'erreur inverse : une balise d'emphase affichée comme du texte.
  for (const m of html.matchAll(/&lt;\/?(?:strong|em|code|sup|sub|br)\s*\/?&gt;/g)) {
    anomalies.push({
      page: nom(f),
      genre: "balise affichée comme du texte",
      extrait: extrait(html, m.index, m[0].length),
    });
  }

  // 3. Entité dans un contexte qui n'est pas du HTML : données structurées et
  //    métadonnées. Ce que Google lit, ce n'est pas ce que le lecteur voit.
  // 3. Une phrase découpée en colonnes par un conteneur flex.
  signaleFlexEclate(html, nom(f));

  for (const bloc of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    signaleEntites(bloc[1].replaceAll("\\u003c", "<"), nom(f), "entité dans le JSON-LD");
  }
  for (const meta of html.matchAll(/<meta [^>]*content="([^"]*)"/g)) {
    signaleEntites(meta[1], nom(f), "entité dans une balise meta");
  }
}

// Un conteneur `display:flex` traite CHAQUE enfant comme une colonne. Un <li>
// en flex qui contient à la fois du texte nu et des <strong>/<sup> voit donc sa
// phrase découpée en colonnes — c'est illisible, et ça ne lève rien. Le markup
// correct met un marqueur, puis UN seul élément qui porte toute la phrase.
function signaleFlexEclate(html, page) {
  for (const m of html.matchAll(/<li class="([^"]*)">([\s\S]*?)<\/li>/g)) {
    const [, classes, contenu] = m;
    if (!FLEX.test(classes) || /inline-flex|flex-col/.test(classes)) continue;
    // Le contenu après le marqueur : s'il mêle du texte nu et des balises
    // inline sans un enveloppe unique, chaque morceau devient une colonne.
    const apresMarqueur = contenu.replace(/^\s*<(span|svg)[\s\S]*?<\/\1>\s*/, "");
    if (!INLINE.test(apresMarqueur)) continue;
    const texteNu = apresMarqueur.replace(/<[^>]*>/g, "").trim();
    const commenceParUnBloc = /^\s*<(span|div|p)\b/.test(apresMarqueur);
    if (texteNu && !commenceParUnBloc) {
      anomalies.push({
        page,
        genre: "phrase éclatée en colonnes par un conteneur flex",
        extrait: apresMarqueur.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100),
      });
    }
  }
}

function signaleEntites(texte, page, genre) {
  for (const m of texte.matchAll(ENTITE)) {
    if (LEGITIMES.has(m[0])) continue;
    anomalies.push({ page, genre, extrait: extrait(texte, m.index, m[0].length) });
  }
}

function extrait(source, i, longueur) {
  return source
    .slice(Math.max(0, i - 70), i + longueur + 30)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Contre-épreuve ───────────────────────────────────────────────────────────
// Sans elle, ce script est indiscernable d'un script qui ne cherche rien.
const temoin = [];
{
  const faux = '<h2 class="t">Ce qu&amp;rsquo;il se passe</h2><p>&lt;strong&gt;</p>';
  if (/&amp;(?:#x?[\da-fA-F]+|[a-zA-Z]+);/.test(faux)) temoin.push("entité littérale");
  if (/&lt;\/?(?:strong|em|code|sup|sub|br)\s*\/?&gt;/.test(faux)) temoin.push("balise en texte");

  const avant = anomalies.length;
  signaleFlexEclate(
    '<li class="flex gap-2"><span>→</span> du texte <strong>en gras</strong> et la suite</li>' +
      '<li class="flex gap-2"><span>→</span> <span>du texte <strong>en gras</strong> et la suite</span></li>',
    "témoin"
  );
  if (anomalies.length === avant + 1) temoin.push("phrase éclatée par un flex");
  anomalies.length = avant;
}

console.log("");
console.log(`── Rendu : ${pages.length} page(s) HTML analysée(s) ${"─".repeat(20)}`);

if (anomalies.length === 0) {
  console.log("  ok   aucune entité affichée littéralement");
  console.log("  ok   aucune balise affichée comme du texte");
  console.log("  ok   aucune entité dans le JSON-LD ni dans les métadonnées");
  console.log("  ok   aucune phrase éclatée en colonnes par un conteneur flex");
} else {
  const parPage = new Map();
  for (const a of anomalies) {
    if (!parPage.has(a.page)) parPage.set(a.page, []);
    parPage.get(a.page).push(a);
  }
  for (const [page, liste] of parPage) {
    console.error(`✗ ${page} — ${liste.length} anomalie(s)`);
    for (const a of liste.slice(0, 4)) console.error(`     ${a.genre} : « ${a.extrait} »`);
  }
}

console.log("");
for (const t of temoin) console.log(`  ·    contre-épreuve : ${t} bien détectée`);

if (temoin.length !== 3) {
  console.error("✗ contre-épreuve MUETTE : le détecteur ne reconnaît plus ses propres cas fautifs.");
  process.exit(1);
}

if (anomalies.length > 0) {
  console.error("");
  console.error(
    `${anomalies.length} anomalie(s) de rendu. Un texte écrit avec des entités doit passer par le\n` +
      `même chemin de rendu que les paragraphes — sinon le lecteur voit le code source.`
  );
  process.exit(1);
}

console.log("check:rendu — aucune entité ni balise affichée telle quelle, JSON-LD et métadonnées propres.");
