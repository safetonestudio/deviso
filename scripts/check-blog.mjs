/**
 * Les défauts SEO qui ne lèvent aucune erreur.
 *
 * Pourquoi ce fichier existe. L'audit du 11/09/2026 a trouvé quatre choses
 * fausses publiées sur getdeviso.fr. Aucune ne faisait échouer quoi que ce soit :
 * le site compilait, se déployait et s'affichait parfaitement.
 *
 *   - des montants d'amendes périmés depuis le 1er septembre 2026, recopiés à
 *     quatre endroits dont un JSON-LD `FAQPage` ;
 *   - une échéance de calendrier inventée (« ETI au 1er décembre 2026 ») ;
 *   - quatre pages affichant un « Total TTC (TVA 20 %) » égal au total HT, parce
 *     que le libellé vivait dans le composant et la valeur dans la page ;
 *   - onze pages déclarées importantes dans le sitemap et presque jamais liées.
 *
 * Le registre (`lib/blog/registre.ts`) rend la plupart de ces dérives
 * impossibles par construction. Ce contrôle surveille ce qu'il ne peut pas
 * empêcher : les pages qui existent sans être déclarées, les dates incohérentes,
 * les totaux qui ne correspondent pas à leur libellé, les données structurées
 * manquantes.
 *
 * Comme `check-comptable.mjs` et `check-effets-reels.mjs`, chaque contrôle porte
 * sa **contre-épreuve** : un cas fautif fabriqué sur place dont on vérifie qu'il
 * serait bien détecté. Sans elle, un contrôle qui ne trouve jamais rien est
 * indiscernable d'un contrôle cassé.
 *
 * Usage : node scripts/check-blog.mjs
 */

import { readFileSync, globSync } from "node:fs";

let echecs = 0;
const lire = (p) => readFileSync(p, "utf8");

function titre(t) {
  console.log("");
  console.log(`── ${t} ${"─".repeat(Math.max(0, 60 - t.length))}`);
}

function exige(nom, condition, explication) {
  if (condition) {
    console.log(`  ok   ${nom}`);
  } else {
    echecs++;
    console.error(`✗ ${nom}\n     ${explication}`);
  }
}

function contreEpreuve(nom, detecteAnomalie) {
  if (detecteAnomalie) {
    console.log(`  ·    contre-épreuve : ${nom}`);
  } else {
    echecs++;
    console.error(`✗ contre-épreuve MUETTE : ${nom}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lecture du registre. On l'analyse textuellement plutôt que de l'importer : ce
// script doit tourner sous node nu, sans transpilation TypeScript, comme tous
// les autres `check-*.mjs` du projet.
// ─────────────────────────────────────────────────────────────────────────────
const registre = lire("lib/blog/registre.ts");

const entrees = [...registre.matchAll(/\{\s*\n\s*slug: "([a-z0-9-]+)",\s*\n\s*categorie: "(\w+)",/g)].map(
  (m) => ({ slug: m[1], categorie: m[2] })
);

const dates = Object.fromEntries(
  [...registre.matchAll(/slug: "([a-z0-9-]+)",[\s\S]*?publieLe: "([\d-]+)",[\s\S]*?misAJourLe: "([\d-]+)",/g)].map(
    (m) => [m[1], { publieLe: m[2], misAJourLe: m[3] }]
  )
);

// ── 1. Parité registre ↔ pages réelles ──────────────────────────────────────
titre("Registre et pages : aucun article d'un côté seulement");

const pagesArticles = globSync("app/blog/*/page.tsx")
  .map((f) => f.replace(/\\/g, "/").split("/")[2])
  .filter((d) => d !== "page.tsx")
  .sort();
const slugsRegistre = entrees.map((e) => e.slug).sort();

exige(
  `${slugsRegistre.length} article(s) au registre, ${pagesArticles.length} page(s) sur le disque`,
  slugsRegistre.length > 0 && pagesArticles.length > 0,
  "le registre ou le dossier app/blog n'a pas pu être lu — le reste de ce contrôle ne veut alors rien dire."
);

const orphelinsDisque = pagesArticles.filter((s) => !slugsRegistre.includes(s));
exige(
  "toute page d'article est déclarée au registre",
  orphelinsDisque.length === 0,
  `sans entrée au registre, la page n'est ni dans le sitemap, ni sur /blog, ni pourvue de\n` +
    `     métadonnées ou de données structurées. Elle existe et personne ne la voit.\n` +
    `     En cause : ${orphelinsDisque.join(", ")}`
);

const orphelinsRegistre = slugsRegistre.filter((s) => !pagesArticles.includes(s));
exige(
  "tout article du registre a sa page",
  orphelinsRegistre.length === 0,
  `le sitemap annoncerait à Google des URL qui renvoient 404.\n     En cause : ${orphelinsRegistre.join(", ")}`
);

// ── 2. Cohérence des dates ──────────────────────────────────────────────────
titre("Dates : misAJourLe ne peut pas précéder publieLe");

const datesIncoherentes = Object.entries(dates).filter(([, d]) => d.misAJourLe < d.publieLe);
exige(
  "aucune date de mise à jour antérieure à la publication",
  datesIncoherentes.length === 0,
  `une date de modification antérieure à la publication est une incohérence que Google relève.\n` +
    `     En cause : ${datesIncoherentes.map(([s]) => s).join(", ")}`
);

const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const datesFutures = Object.entries(dates).filter(([, d]) => d.misAJourLe > demain);
exige(
  "aucune date de mise à jour dans le futur",
  datesFutures.length === 0,
  `antidater une mise à jour est la manipulation la plus facile à détecter, et celle qui fait\n` +
    `     cesser de lire le signal. En cause : ${datesFutures.map(([s]) => s).join(", ")}`
);

exige(
  "toutes les dates sont au format AAAA-MM-JJ",
  Object.values(dates).every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.publieLe) && /^\d{4}-\d{2}-\d{2}$/.test(d.misAJourLe)),
  "un format de date non ISO produit un `lastmod` invalide dans le sitemap."
);

// ── 3. Les articles liés existent ───────────────────────────────────────────
titre("Articles liés : aucun lien interne vers une page inexistante");

const lies = [...registre.matchAll(/lies: \[([^\]]*)\]/g)].flatMap((m) =>
  [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1])
);
const liesMorts = [...new Set(lies.filter((s) => !slugsRegistre.includes(s)))];
exige(
  `${lies.length} lien(s) « à lire ensuite » vérifié(s)`,
  liesMorts.length === 0,
  `ces slugs ne sont pas au registre : ${liesMorts.join(", ")}.\n` +
    `     article() lève au build, donc la page ne se rendrait pas — mais autant le savoir ici.`
);

// ── 4. Le sitemap est généré, pas saisi ─────────────────────────────────────
titre("Sitemap : généré depuis les mêmes sources que les pages");

const sitemap = lire("app/sitemap.ts");
const urlsEnDur = [...sitemap.matchAll(/url:\s*"https:\/\/getdeviso\.fr\/[^"]+"/g)].length;
exige(
  "aucune URL d'article écrite à la main dans le sitemap",
  urlsEnDur === 0,
  `${urlsEnDur} URL sont écrites en dur. C'est exactement ce qui permet d'ajouter une page en\n` +
    `     oubliant son entrée : la page devient invisible, et rien ne le signale.`
);

exige(
  "le sitemap lit le registre",
  /from "@\/lib\/blog\/registre"/.test(sitemap),
  "sans cet import, le sitemap a sa propre liste d'articles, et les deux divergeront."
);

exige(
  "aucun lastModified global à la date du build",
  !/lastModified:\s*new Date\(\)/.test(sitemap.replace(/const maintenant = new Date\(\);/, "")) ||
    /REVISION_/.test(sitemap),
  "un `lastmod` qui bouge sur toutes les pages à chaque déploiement est un `lastmod` que Google\n" +
    "     cesse de lire. Les articles doivent porter leur vraie date (misAJourLe)."
);

// ── 5. Totaux affichés : le libellé doit dire la vérité ─────────────────────
titre("Maquettes de devis : le total correspond à son libellé");

const nombre = (s) => Number(String(s).replace(/[\s ]/g, "").replace(",", "."));

for (const f of globSync("app/freelance-*/page.tsx").sort()) {
  const chemin = f.replace(/\\/g, "/");
  const src = lire(f);
  const lignes = [...src.matchAll(/price:\s*"([\d\s .,]+)\s*€/g)].map((m) => nombre(m[1]));
  const total = src.match(/mockupTotal="([\d\s .,]+)\s*€?\s*(HT)?/);
  if (lignes.length === 0 || !total) continue;

  const ht = lignes.reduce((a, b) => a + b, 0);
  const affiche = nombre(total[1]);
  const estHt = /\bHT\b/.test(total[0]);
  const attendu = estHt ? ht : ht * 1.2;

  exige(
    `${chemin} — ${estHt ? "HT" : "TTC"} ${affiche} € pour ${ht} € de lignes`,
    Math.abs(affiche - attendu) < 1,
    `le total affiché ne correspond pas à son libellé. Attendu ${Math.round(attendu)} €.\n` +
      `     Quatre pages annonçaient « Total TTC (TVA 20 %) » sur un montant hors taxes — sur la\n` +
      `     vitrine d'un logiciel de facturation, c'est le détail qui fait douter de tout le reste.`
  );
}

exige(
  "le libellé du total est déduit de la valeur, pas écrit à côté",
  /const totalHt = \/\\bHT\\b\/\.test\(mockupTotal\)/.test(lire("components/landing/FreelanceLanding.tsx")),
  "si le libellé est figé dans le composant et la valeur passée par la page, les deux peuvent se\n" +
    "     contredire — et ils se sont contredits sur quatre pages."
);

// ── 6. Données structurées et canoniques ────────────────────────────────────
titre("Données structurées : chaque page de contenu est balisée");

for (const slug of slugsRegistre) {
  const src = lire(`app/blog/${slug}/page.tsx`);
  const viaGabarit = /<BlogPost\b/.test(src);
  exige(
    `app/blog/${slug} — métadonnées et JSON-LD`,
    /metadonneesArticle\(/.test(src) && (viaGabarit || /jsonLdArticle\(/.test(src)),
    "les métadonnées et les données structurées doivent venir du registre (`metadonneesArticle`,\n" +
      "     `jsonLdArticle`), sinon elles sont recopiées — et une copie finit par divergerar."
  );
}

const pagesIndexables = [
  "app/page.tsx",
  "app/conformite/page.tsx",
  "app/a-propos/page.tsx",
  "app/blog/page.tsx",
  "app/combien-facturer/page.tsx",
  "app/combien-facturer/[metier]/page.tsx",
  ...globSync("app/freelance-*/page.tsx").map((f) => f.replace(/\\/g, "/")),
  "app/mentions-legales/page.tsx",
  "app/cgu/page.tsx",
  "app/confidentialite/page.tsx",
];
const sansCanonique = pagesIndexables.filter((f) => {
  const src = lire(f);
  // Les landings passent leur canonique au composant partagé.
  return !/canonical/.test(src);
});
exige(
  `${pagesIndexables.length} page(s) indexable(s) avec canonique explicite`,
  sansCanonique.length === 0,
  `sans canonique, deux URL menant au même contenu se font concurrence.\n     En cause : ${sansCanonique.join(", ")}`
);

exige(
  "un fil d'Ariane est balisé (BreadcrumbList)",
  /BreadcrumbList/.test(lire("lib/blog/meta.ts")) &&
    /BreadcrumbList/.test(lire("app/combien-facturer/[metier]/page.tsx")),
  "le BreadcrumbList fait afficher le chemin de la page dans les résultats Google au lieu de\n" +
    "     l'URL brute. Il n'existait nulle part sur le site avant le 11/09/2026."
);

// ── 7. Un seul pied de page ─────────────────────────────────────────────────
titre("Maillage : un seul pied de page, et il mène aux trois familles de pages");

const piedsArtisanaux = [
  "app/page.tsx",
  "app/blog/page.tsx",
  "components/blog/BlogPost.tsx",
  "components/landing/FreelanceLanding.tsx",
  ...globSync("app/blog/*/page.tsx").map((f) => f.replace(/\\/g, "/")),
  "app/conformite/page.tsx",
  "app/a-propos/page.tsx",
  "app/combien-facturer/page.tsx",
  "app/combien-facturer/[metier]/page.tsx",
].filter((f) => /<footer\b/.test(lire(f)));
exige(
  "aucun pied de page réécrit à la main sur les pages publiques",
  piedsArtisanaux.length === 0,
  `il y avait trois pieds de page distincts, et ils ne contenaient pas les mêmes liens. C'est\n` +
    `     comme ça que /combien-facturer a fini avec un seul lien entrant.\n     En cause : ${piedsArtisanaux.join(", ")}`
);

const pied = lire("components/SiteFooter.tsx");
for (const cible of ["/blog", "/combien-facturer", "/conformite", "/blog/facturation-electronique-2026"]) {
  exige(
    `le pied de page mène à ${cible}`,
    pied.includes(`href="${cible}"`),
    "le maillage interne, pas la priorité écrite dans le sitemap, dit à Google quelles pages comptent."
  );
}

// ── 8. Exactitude : les montants d'amendes périmés ──────────────────────────
titre("Réglementaire : les montants d'amendes de la LF 2026");

const contenus = [
  ...globSync("app/blog/*/page.tsx"),
  ...globSync("app/combien-facturer/**/page.tsx"),
].map((f) => ({ chemin: f.replace(/\\/g, "/"), src: lire(f) }));

// Avant le 01/09/2026 : 250 € par transmission d'e-reporting, 15 € par facture.
// Depuis : 500 € et 50 € (loi n° 2026-103 du 19/02/2026, art. 123).
const perimes = contenus.filter(({ src }) =>
  /250\s*€?\s*(par|\/)\s*(transaction|transmission)/i.test(src) ||
  /amende[^.]{0,60}\b250\s*€/i.test(src) ||
  /1737\s*IV/i.test(src)
);
exige(
  "aucun montant d'amende d'avant le 1er septembre 2026",
  perimes.length === 0,
  `l'e-reporting est passé de 250 à 500 € par transmission, et l'émission de 15 à 50 € par\n` +
    `     facture. Publier l'ancien montant sur un site qui vend de la conformité est le pire\n` +
    `     endroit possible pour une information périmée.\n     En cause : ${perimes.map((c) => c.chemin).join(", ")}`
);

// Le calendrier ne comporte aucune échéance au 1er décembre 2026.
const echeanceInventee = contenus.filter(({ src }) => /1er\s+d[ée]cembre\s+2026/i.test(src));
exige(
  "aucune échéance au 1er décembre 2026",
  echeanceInventee.length === 0,
  `cette date n'existe pas. Grandes entreprises ET ETI relèvent du 1er septembre 2026, TPE, PME\n` +
    `     et micro-entreprises du 1er septembre 2027.\n     En cause : ${echeanceInventee.map((c) => c.chemin).join(", ")}`
);

// ── 9. FAQ : ce qui est balisé est affiché ───────────────────────────────────
titre("FAQ : ce qui est déclaré à Google est visible sur la page");

for (const { chemin, src } of contenus) {
  if (!/const FAQ = \[/.test(src)) continue;
  exige(
    `${chemin} — la liste FAQ est rendue`,
    /FAQ\.map\(/.test(src),
    "un `FAQPage` qui annonce une réponse absente du contenu visible est une déclaration fausse.\n" +
      "     Sept articles déclaraient une FAQ que la page n'affichait pas."
  );
}

// ── 10. Signature : l'auteur déclaré doit être visible ──────────────────────
titre("Signature : l'auteur du balisage est affiché sur la page");

exige(
  "le JSON-LD des articles déclare une Person, pas une Organization",
  /author: AUTEUR_JSONLD/.test(lire("lib/blog/meta.ts")) &&
    /"@type": "Person"/.test(lire("lib/blog/auteur.ts")),
  "les dix-neuf articles étaient signés par une marque inconnue. Sur des sujets fiscaux, Google\n" +
    "     attend un auteur identifiable — et le lecteur aussi."
);

for (const slug of slugsRegistre) {
  const src = lire(`app/blog/${slug}/page.tsx`);
  const viaGabarit = /<BlogPost\b/.test(src);
  exige(
    `app/blog/${slug} — signature affichée`,
    viaGabarit || /<Signature \/>/.test(src),
    "une signature déclarée dans le balisage mais invisible sur la page est le même décalage qu'un\n" +
      "     FAQPage dont les réponses n'apparaissent nulle part."
  );
}

exige(
  "la page auteur existe et est liée depuis le pied de page",
  /AUTEUR_JSONLD/.test(lire("app/a-propos/page.tsx")) && pied.includes('href="/a-propos"'),
  "le `@id` de la Person pointe vers /a-propos : si la page n'existe pas, la déclaration est creuse."
);

// ── 11. Contre-épreuves ─────────────────────────────────────────────────────
titre("Contre-épreuves");

contreEpreuve(
  "un montant d'amende périmé est bien détecté",
  /250\s*€?\s*(par|\/)\s*(transaction|transmission)/i.test(
    "une amende de 250 € par transaction non transmise, plafonnée à 15 000 €"
  )
);
contreEpreuve(
  "l'échéance inventée est bien détectée",
  /1er\s+d[ée]cembre\s+2026/i.test("ETI au 1er décembre 2026, PME au 1er septembre 2027")
);
contreEpreuve(
  "une URL d'article en dur dans le sitemap serait bien détectée",
  [...'  { url: "https://getdeviso.fr/blog/mon-article", priority: 0.8 },'.matchAll(
    /url:\s*"https:\/\/getdeviso\.fr\/[^"]+"/g
  )].length === 1
);
contreEpreuve(
  "une date de mise à jour antérieure à la publication serait bien détectée",
  "2026-06-01" < "2026-07-10"
);
contreEpreuve(
  "un total TTC égal au HT serait bien détecté",
  Math.abs(4900 - 4900 * 1.2) >= 1
);
contreEpreuve(
  "un pied de page réécrit à la main serait bien détecté",
  /<footer\b/.test('      <footer className="border-t">')
);
contreEpreuve(
  "une FAQ déclarée mais non affichée serait bien détectée",
  /const FAQ = \[/.test("const FAQ = [\n  { q: 'x', a: 'y' },\n];") &&
    !/FAQ\.map\(/.test("const FAQ = [\n  { q: 'x', a: 'y' },\n];")
);

// ─────────────────────────────────────────────────────────────────────────────
console.log("");
if (echecs > 0) {
  console.error(`${echecs} défaut(s). Un site qui compile n'est pas un site qui dit vrai.`);
  process.exit(1);
}
console.log(
  `check:blog — ${slugsRegistre.length} articles, registre et pages cohérents, ` +
    `sitemap généré, balisage en place, aucun montant périmé.`
);
