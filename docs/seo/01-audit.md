# Audit SEO de getdeviso.fr — 11 septembre 2026

Audit conduit sur le code source (`/home/claude/deviso`, à jour de `origin/main` au commit `4741547`)
et sur les sources normatives en ligne. Tous les constats techniques ont été vérifiés dans le code ;
les constats factuels sur la réforme sont sourcés ci-dessous.

**Ce que cet audit n'a pas pu mesurer** : les positions réelles dans les SERP, les volumes de
recherche, les Core Web Vitals mesurés sur le terrain, et l'état d'indexation dans la Search Console.
Le bac à sable ne peut pas joindre getdeviso.fr (proxy). Ces quatre points demandent un accès
Search Console et un outil payant (Ahrefs ou Semrush) ; ils sont listés en fin de document.

---

## Verdict en une page

Le SEO de Deviso est **structurellement bien meilleur que la moyenne des SaaS pré-lancement**.
Il y a 43 pages publiques — dont 33 indexables — une architecture en clusters, des canoniques explicites page par page,
du JSON-LD sur toutes les pages de contenu, des `noindex` correctement posés sur les espaces privés,
une police auto-hébergée. Ce n'est pas un chantier à démarrer, c'est un actif à corriger et à nourrir.

Il y a cependant **quatre problèmes qui coûtent cher aujourd'hui**, et un qui coûtera cher demain :

| # | Problème | Gravité | Effort |
|---|---|---|---|
| 1 | Le blog publie des montants d'amendes **périmés depuis le 1er septembre 2026** (250 € au lieu de 500 €) | **Critique** | 1 h |
| 2 | Une date de calendrier **fausse** dans le JSON-LD de l'article phare (« ETI au 1er décembre 2026 ») | **Critique** | 15 min |
| 3 | Six landing pages affichent un « Total TTC (TVA 20 %) » **égal au total HT** — sur un produit de facturation | **Élevée** | 30 min |
| 4 | Le cluster `/combien-facturer` (11 pages, priorité 0.9) n'est lié que depuis **une seule page** du site | **Élevée** | 2 h |
| 5 | Un nouvel article = **150 à 490 lignes de TSX** + une entrée sitemap à la main + du JSON-LD recopié | **Structurelle** | 1 à 2 j |

Le point 5 est la réponse directe à ce que ton expert SEO t'a dit. Tu n'as pas un problème de
volonté d'alimenter le blog : tu as une architecture qui rend chaque article coûteux. On y revient
en §5.

---

## 1. Exactitude du contenu — le plus grave, et c'est inattendu

C'est le constat que je n'attendais pas en ouvrant cet audit, et c'est le plus dommageable.
Deviso se positionne sur l'expertise de la réforme de facturation électronique. Cette expertise est
réelle dans le code. Elle est **périmée dans le blog**.

### 1.1 Les montants d'amendes sont faux depuis le 1er septembre 2026

La loi de finances pour 2026 ([loi n° 2026-103 du 19 février 2026, article 123](https://www.legifrance.gouv.fr/eli/loi/2026/2/19/CPPX2524517L/jo/article_123))
a relevé les sanctions, applicables **depuis le 1er septembre 2026** :

| Manquement | Avant | Depuis le 01/09/2026 |
|---|---|---|
| Défaut d'émission en électronique | 15 €/facture | **50 €/facture**, plafond 15 000 €/an |
| Défaut de transmission des données (e-reporting) | 250 €/transmission | **500 €/transmission**, plafond 15 000 €/an |
| Non-recours à une plateforme agréée **en réception** | — | **500 €** après mise en demeure de 3 mois, puis **1 000 € tous les 3 mois** |

Source de synthèse officielle : [Service-Public Entreprendre — les sanctions évoluent](https://entreprendre.service-public.gouv.fr/actualites/A18802?lang=fr).

**Ce que le site publie aujourd'hui**, aux trois endroits suivants :

- `app/blog/e-reporting-freelance-2026/page.tsx:53` — dans le **JSON-LD `FAQPage`**, donc
  éligible à l'affichage direct dans Google : « une amende de 250 € par transaction non transmise ».
- `app/blog/e-reporting-freelance-2026/page.tsx:261` — dans le corps : « **250 € par transaction** ».
- `app/blog/checklist-reforme-facturation-2026/page.tsx:93` — « les amendes sont significatives (250 €/transaction) ».
- `app/blog/page.tsx:68` — sur l'index du blog : « Amendes : 250 €/transaction ».

Le montant réel est le double. Et l'amende de réception — celle qui frappe **tout le monde, y
compris les micro-entrepreneurs, dès maintenant** — n'est mentionnée nulle part. C'est précisément
l'information la plus actionnable pour ta cible, et c'est la seule qui manque.

Pourquoi c'est grave au-delà du SEO : un freelance qui lit ces chiffres, les croit, et se fait
redresser, n'en voudra pas à la DGFiP. Et un comparateur qui relève l'erreur ne citera plus Deviso.

### 1.2 Une date de calendrier fausse dans le JSON-LD de l'article phare

`app/blog/facturation-electronique-2026/page.tsx:39`, dans le `FAQPage` :

> « grandes entreprises dès le 1er septembre 2026, **ETI au 1er décembre 2026**, PME et
> micro-entrepreneurs au 1er septembre 2027 »

Il n'y a pas d'échéance au 1er décembre 2026. Le calendrier officiel ne comporte que deux dates
d'émission : **1er septembre 2026 pour les grandes entreprises *et* les ETI**, puis **1er septembre
2027 pour les TPE, PME et micro-entreprises**
([economie.gouv.fr](https://www.economie.gouv.fr/actualites/facturation-electronique-entre-entreprises-coup-denvoi-de-la-reforme),
[impots.gouv.fr](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees),
[calendrier Pennylane](https://www.pennylane.com/fr/fiches-pratiques/facture-electronique/facturation-electronique-dates-cles-et-calendrier)).

Cette phrase est dans une réponse de FAQ structurée. Google peut l'afficher telle quelle.

### 1.3 Le temps des verbes : la réforme est en vigueur, le site parle au futur

Tout le contenu réforme est écrit en anticipation (« deviendra obligatoire », « vous devrez »).
Depuis le 1er septembre 2026 — il y a dix jours — **toute entreprise assujettie à la TVA doit être
en capacité de recevoir une facture électronique via une plateforme agréée**, sans exception de
taille ni de régime. Micro-entrepreneurs et franchise en base incluses.

Ce n'est pas un détail de style. Un lecteur qui arrive sur une page écrite au futur sur une
obligation déjà en vigueur conclut que la page est vieille, et repart. Google tire la même
conclusion, en moins subtil.

### 1.4 Ce qui est exact, et qu'il faut garder

Par souci d'équilibre : le reste du contenu réglementaire est bon, et meilleur que la moyenne.

- Le seuil de franchise en base de TVA cité à **37 500 € en 2026** pour les prestations de services
  est **correct** — le seuil unique à 25 000 € a été abandonné ([Portail Auto-Entrepreneur](https://www.portail-autoentrepreneur.fr/academie/statut-auto-entrepreneur/tva)).
  Beaucoup de concurrents se trompent là-dessus.
- L'abandon du PPF comme plateforme d'échange est correctement expliqué (`facturation-electronique-2026`).
  C'est un point que la plupart des contenus concurrents traitent mal.
- L'indépendance entre régime de TVA et obligation de facturation électronique est correctement
  énoncée. C'est la confusion n°1 chez les micro-entrepreneurs.
- La mention « TVA non applicable, art. 293 B du CGI » et l'avertissement contre la ligne à 0 %
  sont justes et précis.

### 1.5 Un manque de positionnement, pas une erreur

Le site ne dit **nulle part** si Deviso est une **plateforme agréée (PA)** ou une **solution
compatible (SC)** adossée à une PA. Or depuis le 1er septembre 2026 c'est devenu le premier critère
de tri de tous les comparateurs, et la distinction est officielle : une solution compatible ne peut
ni transmettre ni recevoir de factures pour le compte d'une entreprise
([impots.gouv.fr](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees)).

Concrètement : Indy et Abby se déclarent PA immatriculées, Freebe se déclare SC adossée à une PA.
Deviso ne déclare rien. Les comparateurs classeront « statut flou », et un prospect prudent
choisira celui qui l'a écrit.

**Action** : une page `/conformite` ou une section dédiée, qui dit en une phrase ce que Deviso est,
avec quelle PA s'il y a lieu, et ce que ça implique pour l'utilisateur.

---

## 2. Exactitude des pages produit — un bug arithmétique public

Les 10 landing pages métier affichent une maquette de devis avec des lignes et un total libellé
**« Total TTC (TVA 20 %) »** (`components/landing/FreelanceLanding.tsx:258`).

J'ai recalculé la somme des lignes sur chaque page :

| Page | Somme des lignes | Total affiché | |
|---|---|---|---|
| `/freelance-consultant` | 11 200 | 13 440 | ✅ ×1,20 |
| `/freelance-developpeur` | 5 100 | 6 120 | ✅ |
| `/freelance-formateur` | 5 000 | 6 000 | ✅ |
| `/freelance-graphiste` | 3 100 | 3 720 | ✅ |
| `/freelance-photographe` | 2 000 | 2 400 | ✅ |
| `/freelance-redacteur` | 2 150 | 2 580 | ✅ |
| `/freelance-artisan` | 4 900 | **4 900** | ❌ TTC = HT |
| `/freelance-coach` | 2 910 | **2 910** | ❌ |
| `/freelance-community-manager` | 1 450 | **1 450** | ❌ |
| `/freelance-traducteur` | 1 200 | **1 200** | ❌ |

**Quatre pages affichent un total TTC égal au total HT**, sous un libellé qui annonce 20 % de TVA.
Sur le site d'un logiciel de facturation, devant un visiteur qui évalue s'il peut te confier ses
devis. C'est le genre de détail qu'un prospect attentif remarque et n'oublie pas.

Il y a un second sujet, de fond celui-là : les quatre pages fautives (artisan, coach, community
manager, traducteur) ciblent des profils très majoritairement **en franchise en base de TVA**.
Afficher « TVA 20 % » dans leur maquette est faux pour la plupart d'entre eux. La bonne correction
n'est pas d'ajouter 20 % partout — c'est d'afficher **« Total HT »** sur ces quatre pages, ou mieux,
de montrer la mention « TVA non applicable, art. 293 B du CGI » : ça prouve que Deviso connaît son
utilisateur.

Il manque aussi un garde-fou. Ce bug est exactement du même type que ceux que `check-comptable.mjs`
attrape : une promesse affichée qui ne correspond pas au calcul. Il mérite le même traitement —
voir la recommandation en §7.

---

## 3. Architecture et maillage interne

### 3.1 Ce qui est bien construit

- **43 pages publiques**, dont 33 indexables, organisées en trois familles cohérentes :
  10 landing pages métier, 19 articles de blog (+ l'index), 11 pages tarifs
  (`/combien-facturer` + 10 métiers), et 3 pages légales.
- Une **canonique absolue explicite sur chaque page indexable** — pas de canonique globale
  hasardeuse, chaque page déclare la sienne. C'est la bonne pratique, rarement appliquée.
- Les `noindex` sont **correctement placés** : `app/(auth)/layout.tsx`, `app/auth/layout.tsx`,
  et surtout `app/(public)/layout.tsx` qui couvre `/p/[token]` — les devis clients ne sont pas
  indexables, ce qui est une question de confidentialité autant que de SEO.
- `robots.ts` interdit `/dashboard/` et `/api/`, et déclare le sitemap.
- `metadataBase` est posé, le template de titre `%s | Deviso` est propre, `max-image-preview: large`
  et `max-snippet: -1` sont explicitement autorisés.
- Aucune balise `<img>` brute dans tout le code : tout passe par `next/image` ou est en SVG inline.
- La police Inter est **téléchargée au build et servie depuis le domaine** — aucune requête vers
  Google chez le visiteur. Bon pour la performance et pour le RGPD.

### 3.2 Le cluster `/combien-facturer` est presque orphelin

C'est le défaut de maillage le plus coûteux, et il est invisible sans chercher.

`/combien-facturer` est déclaré en **priorité 0.9 dans le sitemap** — la deuxième plus haute du
site, juste après l'accueil. Ses 10 pages métier sont en 0.8. Onze pages, donc, signalées comme
importantes.

Or le seul lien vers `/combien-facturer` venant **de l'extérieur du cluster** est une ligne dans le
pied de page de `/blog` (`app/blog/page.tsx:393`). Ni l'accueil, ni aucune des 10 landing pages, ni
aucun des 19 articles n'y mène. À l'intérieur, les 10 pages métier remontent bien vers le hub — mais
un cluster qui ne se lie qu'à lui-même ne reçoit rien à redistribuer.

Conséquence : les pages TJM sont à trois clics de l'accueil, derrière un goulot d'un seul lien.
Google interprète l'importance d'une page par les liens qu'elle reçoit, pas par le chiffre qu'on
écrit dans le sitemap. Le sitemap dit 0.9 ; le maillage dit 0,1.

### 3.3 Trois pages par métier, et elles ne se parlent pas

Pour chaque métier il existe trois pages sur le même champ sémantique :

```
/freelance-redacteur                          (landing produit)
/blog/devis-redacteur-web                     (article)
/combien-facturer/redacteur-web-freelance     (tarifs)
```

Les liens existants :

- article → landing : **oui** (`landingHref`, et il est bien placé, plusieurs fois)
- landing → article : **non**
- landing → tarifs : **non**
- article → tarifs : **non**
- tarifs → landing : **oui** (`data.landingHref`, deux fois, plus les liens croisés entre métiers)
- tarifs → article : **non**

Soit un triangle de trois pages sur un même métier, relié par deux arêtes sur six — et les deux
vont dans le même sens, vers la landing. C'est le
gisement de maillage interne le plus facile du site : **trois liens à ajouter dans deux composants
partagés** (`FreelanceLanding.tsx` et `BlogPost.tsx`), et les 30 pages en bénéficient d'un coup.

### 3.4 Le cluster réforme est en étoile, mais l'étoile ne redistribue pas

Les cinq articles réforme :

```
facturation-electronique-2026  (le pilier)
 ├── reforme-facturation-micro-entrepreneur  → pointe vers le pilier
 ├── choisir-plateforme-agreee-freelance     → pointe vers le pilier
 ├── e-reporting-freelance-2026              → pointe vers le pilier  ← et le pilier y répond
 └── checklist-reforme-facturation-2026      → pointe vers le pilier
```

Les quatre satellites pointent vers le pilier. Le pilier ne pointe que vers **un seul** satellite
(`e-reporting`). Un cluster ne fonctionne que dans les deux sens : le pilier capte l'autorité, puis
la redistribue. Ici il la capte et la garde.

### 3.5 Dix articles sont des culs-de-sac éditoriaux

Les 10 articles `devis-<métier>` ne contiennent **aucun lien vers un autre article de blog**. Ils
pointent vers des landing pages produit, ce qui est bon pour la conversion, mais un visiteur arrivé
de Google sur « devis graphiste » n'a aucun chemin de lecture vers les autres contenus. C'est
mauvais pour le temps passé, et ça gâche l'autorité que ces pages reçoivent.

### 3.6 Trois pieds de page dupliqués

Il existe trois pieds de page distincts, écrits à la main, dans `app/page.tsx`,
`components/blog/BlogPost.tsx` et `components/landing/FreelanceLanding.tsx`. Ils ne contiennent pas
les mêmes liens — c'est exactement pour ça que `/combien-facturer` a disparu de deux d'entre eux.

Un composant `<SiteFooter />` unique réglerait le problème une fois, au lieu de trois fois à chaque
ajout de section.

---

## 4. Sitemap, données structurées, métadonnées

### 4.1 Le sitemap est écrit à la main — et il a déjà commencé à dériver

`app/sitemap.ts` liste 43 URL **en dur**, une par une, 270 lignes. J'ai comparé cette liste aux
pages réellement présentes dans `app/` :

- les 10 slugs de `/combien-facturer/[metier]` correspondent **exactement** à `ALL_METIER_SLUGS`
  dans `lib/tarifs-data.ts` — aujourd'hui. Rien ne garantit que ce sera encore vrai au 11e métier.
- `/cgu`, `/confidentialite`, `/mentions-legales` sont absents du sitemap. C'est cohérent, elles
  sont en `noindex` — mais voir 4.4, je pense que c'est une erreur de les exclure.

Le vrai problème n'est pas l'état actuel, il est bon. C'est que **la moindre page ajoutée sans
entrée sitemap est invisible**, et que rien ne le signale. Le sitemap doit être généré depuis la
même source que les pages : `ALL_METIER_SLUGS` pour les tarifs, un registre d'articles pour le blog
(voir §5).

### 4.2 `lastModified: new Date()` sur les 43 URL

Chaque entrée du sitemap déclare comme date de dernière modification… l'instant du build. Les
43 entrées affirment donc avoir été modifiées en même temps, à chaque déploiement, y compris un
déploiement qui n'a touché aucune d'entre elles.

Google n'est pas dupe de ça : un `lastmod` qui bouge toujours est un `lastmod` qu'il cesse de lire.
Tu perds le signal exact au moment où tu vas en avoir le plus besoin — quand tu mettras à jour
les articles réforme et que tu voudras que Google le remarque vite.

Il faut une date réelle par page. Elle existe déjà, d'ailleurs : chaque article porte un
`datePublished` et un `dateModified` dans son JSON-LD.

### 4.3 `dateModified` est figé à la date de publication

Dans les 19 articles, `dateModified` est égal à `datePublished`, écrit en dur :

```
datePublished: "2026-07-10",
dateModified:  "2026-07-10",
```

Aucun ne sera jamais mis à jour par construction — il faut éditer le fichier à la main, et personne
ne pense à modifier les deux lignes quand on corrige un paragraphe. C'est le cœur technique du
conseil de ton expert : **la fraîcheur ne se décrète pas, elle se mesure**, et ici elle n'est pas
mesurable.

### 4.4 `cgu`, `confidentialite`, `mentions-legales` en `noindex` — à reconsidérer

Ces trois pages sont en `robots: { index: false }`. Je pense que c'est un réflexe à l'envers.
Pour un logiciel qui va manipuler la facturation et les données fiscales de ses utilisateurs, des
mentions légales et une politique de confidentialité **indexables** sont un signal de confiance
(ce que Google appelle E-E-A-T), pas un risque de contenu mince. Les concurrents les laissent
indexables. Je recommande de retirer le `noindex` et de les ajouter au sitemap en priorité 0.3.

### 4.5 Données structurées : solides, avec deux manques

Présent, et bien fait : `Article` (19), `FAQPage` (20, avec 43 questions), `SoftwareApplication`
(avec `Offer` et `Audience`), `WebPage`, `CollectionPage`, `Organization` (39 occurrences).
C'est un niveau de balisage que très peu de SaaS atteignent.

Deux manques :

- **Aucun `BreadcrumbList` dans tout le site.** Vérifié : zéro occurrence. C'est le balisage qui
  fait afficher un fil d'Ariane dans les résultats Google au lieu de l'URL brute. Pour un site à
  trois niveaux (`/` → `/blog` → article, `/` → `/combien-facturer` → métier) c'est un gain
  d'affichage direct, pour un effort faible et centralisable dans un composant.
- **`author` est une `Organization`, jamais une `Person`.** Les 19 articles sont signés « Deviso ».
  Sur des sujets réglementaires, Google valorise un auteur identifiable. Tu es la personne qui a lu
  les spécifications externes v3.2 de la DGFiP ligne par ligne — c'est un actif d'autorité que tu
  laisses sur la table en signant du nom d'une marque inconnue. Une vraie page auteur, avec ton nom
  et ce qui te rend légitime, changerait la lecture de ces 19 articles.

### 4.6 Métadonnées : deux points mineurs

- **Une seule image OpenGraph pour tout le site** (`/opengraph-image`). Tout partage de tout article
  montre la même vignette. Next.js permet un `opengraph-image.tsx` par route, généré dynamiquement
  avec le titre de l'article. Effort moyen, gain réel sur le partage social.
- **`keywords` dans `app/layout.tsx`** : 12 mots-clés déclarés. Google ignore cette balise depuis
  2009. Inoffensif, mais ça ne sert à rien — et ça peut donner l'illusion que le travail est fait.

### 4.7 Performance : un détail sur la police

`app/layout.tsx` charge Inter en **sept graisses** (300 à 900). Les classes réellement utilisées
dans le code sont `normal` (400), `medium` (500), `semibold` (600), `bold` (700), et marginalement
`extrabold` (800, 3 fois) et `black` (900, 2 fois). La graisse 300 n'est **jamais** utilisée.

Retirer 300, et remplacer les 5 usages de 800/900 par 700, permet de descendre de 7 à 4 fichiers de
police. Quelques dizaines de kilo-octets sur le chemin critique de rendu, sur mobile en 4G. Petit,
mais gratuit.

---

## 5. Le vrai blocage : un article coûte 150 à 490 lignes de React

Voici la racine du problème que ton expert a identifié sans le savoir.

Les 19 articles représentent **4 398 lignes de TSX** (5 138 avec l'index du blog et le composant
`BlogPost`). Ce n'est pas du contenu, c'est du code.
Publier un article aujourd'hui demande :

1. créer `app/blog/<slug>/page.tsx` ;
2. écrire l'`export const metadata` : titre, description, canonique, OpenGraph, Twitter ;
3. recopier et adapter un objet `jsonLd` de 20 à 40 lignes, avec les deux dates en dur ;
4. écrire le corps, soit en appelant `<BlogPost>` avec une quinzaine de props structurées
   (les 10 articles métier), soit en écrivant 250 à 490 lignes de JSX à la main (les 9 autres) ;
5. ajouter l'entrée dans `app/sitemap.ts` ;
6. ajouter l'entrée dans le tableau de `app/blog/page.tsx` ;
7. `tsc`, build, commit, déploiement.

Sept étapes, dont quatre purement mécaniques, dont deux qu'on peut oublier silencieusement (5 et 6).
Un article par mois à ce tarif est déjà un effort ; deux par mois est hors d'atteinte quand il faut
aussi finir le produit.

Et il y a un coût caché plus insidieux : **tu ne peux pas corriger vite**. Les quatre erreurs
factuelles du §1 sont dispersées dans quatre fichiers, dans des chaînes JSX et des objets JSON-LD.
Une correction réglementaire qui touche dix articles, c'est dix fichiers à ouvrir.

### Ce que je recommande

Un **registre de contenu** séparé du rendu. Concrètement, trois pièces :

1. **Un fichier de données par article** — MDX ou un module TS exportant un objet typé
   (`frontmatter` + corps). Le `frontmatter` porte : slug, titre, description, `datePublished`,
   `dateModified`, catégorie, articles liés, métier rattaché. Le corps porte le texte.
2. **Un index construit** (`lib/blog/registre.ts`) qui lit tous les articles. `app/sitemap.ts`,
   `app/blog/page.tsx`, les liens « articles liés » et le JSON-LD se servent tous de cet index.
   Les étapes 5 et 6 disparaissent, et la dérive sitemap devient impossible.
3. **Un gabarit de rendu unique** qui génère `Article` + `FAQPage` + `BreadcrumbList` à partir du
   `frontmatter`. L'étape 3 disparaît aussi.

Publier redevient : écrire un fichier de contenu. C'est la différence entre « je devrais alimenter
mon blog » et « j'alimente mon blog ».

Compte une à deux journées de travail, y compris la migration des 19 articles existants. C'est le
seul investissement technique de cet audit que je qualifierais de rentable avant le lancement,
parce que **tout le plan éditorial du document 02 en dépend**.

Garde-fous à écrire dans la foulée, dans la convention `scripts/check-*.mjs` du projet :

- toute page publique de `app/` est présente dans le sitemap, et réciproquement ;
- tout article du registre est listé sur `/blog` ;
- `dateModified >= datePublished`, et aucun `dateModified` antérieur à la dernière modification
  git du fichier de contenu ;
- tout total affiché « TTC (TVA 20 %) » vaut 1,20 × la somme des lignes (le bug du §2) ;
- aucune page de contenu sans canonique ni JSON-LD.

---

## 6. Plan d'action, par ordre de rentabilité

### Cette semaine — 4 heures, et ça ne peut pas attendre

1. **Corriger les montants d'amendes** aux 4 endroits du §1.1 : 500 €/transmission, 50 €/facture,
   et ajouter l'amende de réception (500 € puis 1 000 €/3 mois), en citant la LF 2026 art. 123.
2. **Corriger « ETI au 1er décembre 2026 »** → 1er septembre 2026, grandes entreprises et ETI.
3. **Corriger les 4 totaux TTC = HT** — en passant ces quatre pages en « Total HT » plutôt qu'en
   ajoutant 20 % à des profils en franchise.
4. **Passer le contenu réforme au présent** et ajouter en tête de l'article pilier un encadré
   « au 11 septembre 2026, voici ce qui s'applique déjà ». Cet encadré est, en soi, une pièce de
   contenu que personne n'a.
5. **Mettre `dateModified` à jour** sur les articles corrigés. C'est la première vraie date de
   modification du site.

### Ce mois-ci — 1 à 2 jours

6. **Le registre de contenu** du §5, avec les garde-fous.
7. **Le maillage interne** : un `<SiteFooter />` unique ; landing → article + landing → tarifs dans
   `FreelanceLanding` ; article → tarifs dans `BlogPost` ; le pilier réforme qui pointe vers ses
   quatre satellites ; 2 à 3 liens inter-articles dans les 10 articles métier.
8. **`BreadcrumbList`** dans le gabarit, une fois, pour tout le site.
9. **`lastModified` réel** dans le sitemap, depuis le registre.
10. **La page `/conformite`** qui dit si Deviso est PA ou SC. Sans elle, les comparateurs du
    document 03 ne peuvent pas te classer.

### Après le lancement

11. Une page auteur à ton nom, et `author: Person` dans le JSON-LD des articles réglementaires.
12. `opengraph-image.tsx` par route.
13. Retirer le `noindex` des pages légales, les ajouter au sitemap.
14. Nettoyer les graisses de police.
15. Supprimer `keywords` de `app/layout.tsx`.

---

## 7. Ce qu'il faut aller chercher ailleurs

Quatre choses que cet audit n'a pas pu établir et qui demandent un accès que je n'ai pas :

- **Search Console** : l'état réel d'indexation des 33 pages indexables, les requêtes sur lesquelles le site
  apparaît déjà, les pages découvertes mais non indexées. À faire en premier, c'est gratuit, et
  c'est la seule source de vérité sur ce que Google a vraiment fait du site.
- **Core Web Vitals mesurés** : PageSpeed Insights sur l'accueil, une landing et un article, en
  mobile. Le code n'a pas de signal alarmant (pas d'`<img>`, police locale) mais je n'ai pas de
  mesure.
- **Volumes de recherche et difficulté** : rien dans le document 02 ne repose sur un volume
  inventé ; les priorités y sont justifiées par qui occupe déjà la SERP. À recroiser avec Ahrefs ou
  Semrush avant d'engager beaucoup de temps d'écriture.
- **Le fichier officiel des plateformes agréées** (ODS/XLSX sur impots.gouv.fr) : l'écosystème
  annonce entre 137 et 166 plateformes selon les sources, qui se contredisent toutes. Télécharger le
  fichier et publier le compte exact, daté, est une opportunité de contenu à part entière —
  détaillée dans le document 02.

---

## Sources

- [Légifrance — loi n° 2026-103 du 19 février 2026, art. 123](https://www.legifrance.gouv.fr/eli/loi/2026/2/19/CPPX2524517L/jo/article_123)
- [Service-Public Entreprendre — Facturation électronique : les sanctions évoluent](https://entreprendre.service-public.gouv.fr/actualites/A18802?lang=fr)
- [economie.gouv.fr — Facturation électronique entre entreprises : coup d'envoi de la réforme](https://www.economie.gouv.fr/actualites/facturation-electronique-entre-entreprises-coup-denvoi-de-la-reforme)
- [impots.gouv.fr — Facturation électronique et plateformes agréées](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees)
- [impots.gouv.fr — Je consulte la liste des plateformes agréées](https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees)
- [Pennylane — Calendrier facture électronique : les dates officielles 2026 et 2027](https://www.pennylane.com/fr/fiches-pratiques/facture-electronique/facturation-electronique-dates-cles-et-calendrier)
- [Portail Auto-Entrepreneur — Tout comprendre sur la TVA pour les auto-entrepreneurs en 2026](https://www.portail-autoentrepreneur.fr/academie/statut-auto-entrepreneur/tva)
- [Urssaf — La facturation électronique obligatoire au 1er septembre 2026](https://www.urssaf.fr/accueil/actualites/facturation-electronique.html)
