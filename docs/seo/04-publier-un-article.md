# Publier ou mettre à jour un article

Procédure après la refonte du 11/09/2026. Avant, publier demandait sept étapes dont deux qu'on
pouvait oublier en silence. Il en reste deux, et rien ne peut plus être oublié sans que
`npm run check:blog` le dise.

---

## Publier un article de fond (réforme, ou sujet transverse)

### 1. Déclarer l'article dans `lib/blog/registre.ts`

Une entrée dans `ARTICLES`, dans la famille qui convient :

```ts
{
  slug: "plateforme-agreee-ou-solution-compatible",
  categorie: "reforme",                    // "reforme" | "metier" | "transverse"
  titre: "Plateforme agréée ou solution compatible",   // l'onglet, « | Deviso » s'ajoute
  description: "…",                        // 150-160 caractères, c'est ce que Google affiche
  h1: "Plateforme agréée ou solution compatible : ce que la différence change pour vous",
  og: { titre: "…", description: "…" },    // facultatif, si le partage social gagne à être plus long
  publieLe: "2026-10-08",
  misAJourLe: "2026-10-08",
  dureeLecture: 7,
  carte: {
    titre: "Plateforme agréée ou solution compatible ?",   // ce que montre /blog
    resume: "…",
    badge: "Plateforme agréée",
  },
  lies: ["facturation-electronique-2026", "choisir-plateforme-agreee-freelance"],
}
```

À partir de cette seule entrée, sont produits automatiquement : les métadonnées de la page, la
canonique, l'OpenGraph, le `Article` et le `BreadcrumbList`, l'entrée du sitemap avec sa vraie date,
la carte sur `/blog`, le `hasPart` du `CollectionPage`, et les liens « à lire ensuite ».

Un slug inexistant dans `lies` **fait échouer la compilation** : un lien interne mort ne peut plus
atteindre la production.

### 2. Écrire la page `app/blog/<slug>/page.tsx`

Le squelette, qui tient en huit lignes :

```tsx
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "plateforme-agreee-ou-solution-compatible";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les questions affichées sur la page, et balisées à partir de cette même liste.
 */
const FAQ = [
  { q: "…", a: "…" },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <DonneesStructurees donnees={jsonLdArticle(SLUG, FAQ)} />
      {/* … le contenu … */}

      {/* La FAQ doit être RENDUE, pas seulement déclarée : voir plus bas. */}
      {FAQ.map(({ q, a }) => ( /* … */ ))}

      <SiteFooter />
    </div>
  );
}
```

C'est tout. Pas d'entrée de sitemap, pas d'objet `jsonLd` à recopier, pas de carte à ajouter sur
l'index.

### 3. Vérifier

```
npm run check:blog
npx tsc --noEmit
```

---

## Publier un article « devis par métier »

Même principe, en plus court, parce que le gabarit `<BlogPost>` fait le reste.

### 1. L'entrée du registre, avec son bloc `metier`

```ts
{
  slug: "devis-plombier",
  categorie: "metier",
  titre: "Devis plombier : mentions et TVA réduite",
  description: "…",
  h1: "Devis de plombier : mentions obligatoires, TVA réduite et erreurs à éviter",
  publieLe: "2026-12-03",
  misAJourLe: "2026-12-03",
  dureeLecture: 7,
  carte: { titre: "Plombier", resume: "TVA réduite, devis obligatoire, acompte" },
  metier: {
    landing: "/freelance-plombier",
    landingLabel: "logiciel de devis pour plombiers",
    profession: "plombier",
    professionPluriel: "plombiers",
  },
  lies: ["devis-artisan-btp", "clauses-devis-freelance"],
}
```

### 2. La page, qui ne contient plus que du contenu

```tsx
import { BlogPost } from "@/components/blog/BlogPost";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "devis-plombier";

export const metadata = metadonneesArticle(SLUG);

export default function Page() {
  return (
    <BlogPost
      slug={SLUG}
      intro="…"
      mandatoryTitle="…"
      mandatoryIntro="…"
      mandatoryItems={[…]}
      exampleClient="…"
      exampleLines={[…]}
      exampleTotal="2 400 € HT"
      exampleNote="…"
      mistakes={[…]}
      faq={[…]}
    />
  );
}
```

### 3. Les deux autres pages du métier

Un métier complet a trois pages, et elles se relient toutes seules dès qu'elles existent :

| Page | Où la créer | Effet sur le maillage |
|---|---|---|
| L'article | `app/blog/devis-plombier/` + registre | automatique |
| La landing | `app/freelance-plombier/` avec `<FreelanceLanding>` | la landing pointe vers l'article et vers les tarifs |
| Les tarifs | une entrée dans `TARIFS_DATA` (`lib/tarifs-data.ts`) | la page tarifs pointe vers l'article et la landing |

La jointure se fait sur le chemin de la landing (`metier.landing` d'un côté, `landingHref` de
l'autre). Aucune liste de correspondance n'est à tenir : `lib/blog/metiers.ts` la calcule.

Le pied de page listera le nouveau métier sans qu'on y touche.

---

## Mettre à jour un article existant

C'est la moitié du travail éditorial, et celle qu'on oublie. Trois règles.

**Modifier le contenu, puis avancer `misAJourLe`.** Dans cet ordre. Toucher la date sans rien changer
est une manipulation que Google détecte et finit par ignorer — et `check:blog` refuse une date
postérieure à demain.

**La date s'affiche.** Quand `misAJourLe` diffère de `publieLe`, le gabarit affiche « Mis à jour le … »
au lieu de la date de publication, et le sitemap envoie un `lastmod` exact. C'est le signal qui dit
à Google qu'une page réglementaire est vivante — il ne sert qu'à condition de ne pas être bruité,
d'où la règle précédente.

**Trois déclencheurs passent devant le calendrier** : un texte publié au Journal officiel qui touche
la facturation électronique ou le régime micro ; un changement du calendrier de la réforme ; une
information fausse repérée sur une page. Les deux premiers sont aussi des opportunités de contenu.

Tenir une ligne par intervention dans `docs/seo/journal.md` (date, page, ce qui a changé) évite de
se raconter qu'on a mis à jour.

---

## Les règles que `check:blog` fait respecter

Le contrôle tourne dans `npm run verify`, et il porte ses contre-épreuves — un contrôle qui ne
trouve jamais rien est indiscernable d'un contrôle cassé.

1. **Parité registre ↔ pages.** Une page sans entrée au registre est invisible ; une entrée sans page
   met une 404 dans le sitemap.
2. **Dates cohérentes.** `misAJourLe >= publieLe`, aucune date dans le futur, format ISO.
3. **Liens internes vivants.** Tout slug dans `lies` existe.
4. **Sitemap généré.** Aucune URL d'article écrite à la main, et pas de `lastModified` global à la
   date du build.
5. **Totaux honnêtes.** Un total libellé « TTC (TVA 20 %) » vaut 1,20 × la somme des lignes ; un
   total libellé « HT » vaut la somme. Le libellé est déduit de la valeur, pas écrit à côté.
6. **Balisage présent.** Chaque article passe par `metadonneesArticle` et `jsonLdArticle` ; chaque
   page indexable a une canonique ; le `BreadcrumbList` existe.
7. **Un seul pied de page.** Aucun `<footer>` réécrit dans les gabarits principaux, et celui-ci mène
   au blog, aux tarifs et au guide de la réforme.
8. **Montants réglementaires à jour.** Les anciens montants d'amendes (250 € par transmission,
   l'article 1737 IV du CGI) et l'échéance inexistante du 1<sup>er</sup> décembre 2026 sont refusés.
9. **FAQ affichée.** Toute liste `FAQ` déclarée doit être rendue sur la page. Un `FAQPage` qui annonce
   une réponse absente du contenu visible est une déclaration fausse.

---

## Ce qu'il reste à faire à la main, et pourquoi

**L'icône d'un article**, dans `ICONES` de `app/blog/page.tsx`. Elle n'est pas au registre pour que
`app/sitemap.ts` n'ait pas à importer `lucide-react` afin de produire du XML. Un article sans icône
retombe sur une valeur par défaut, il ne casse rien.

**`REVISION_TARIFS` et `REVISION_LANDINGS`**, dans `app/sitemap.ts`. Ce sont les dates de dernière
révision des pages qui n'ont pas de registre à elles. À avancer quand on touche `TARIFS_DATA` ou le
contenu des landings.

**Le contenu lui-même.** C'était bien le sujet.
