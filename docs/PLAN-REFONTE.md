# Plan de reprise : migration Tailwind 4 puis refonte de l'identité

Rédigé le 04/11/2026. À lire en entier au début de toute session sur ce chantier. Selim ne lit pas
le code : lui expliquer chaque étape par son effet, en français, sans tiret cadratin.

## Décisions déjà prises (ne pas rouvrir sans raison)

- Passer à Tailwind 4, **seul, en première étape**, avant toute refonte visuelle, pour que le rendu
  actuel serve de référence et que tout écart soit attribuable à la migration.
- Refonte complète du site public et de la web app. Selim n'est pas attaché au design actuel.
- Landing : les changements non commités ont été annulés le 04/11. Ne pas les reconstruire.
- Idée de fond de forêt : abandonnée par Selim.
- 21st.dev : écarté (usage utile payant, plan gratuit limité à 2 composants par jour).
- Figma, Vercel Agent, plugin Vercel : écartés. Superpowers : réservé aux gros chantiers seulement.

## État de départ

- Branche `maj-dependances`, **rien de commité**. Contenu : `package-lock.json` (mises à jour
  mineures : Next 16.4.5, React 19.3.1, Sentry 10.78, Supabase JS 2.118, etc.), dossier `.claude/`
  (réglages et agents), `next-env.d.ts` (régénéré par le build, normal).
- Vérifié : types OK, build OK, 55 contrôles sur 58 OK.
- Les 3 échecs (test:superpdp, test:superpdp-refus, test:ligne-reelle) interrogent la production et
  l'API SuperPDP/PPF, sans lien avec les dépendances. Le test d'aperçu fiscal a renvoyé HTTP 500 :
  à vérifier à part.
- `check:cadres` signale paiements et billing : colonne étroite voulue par Selim, ne pas toucher.

## Routage des modèles (en place)

Défaut Sonnet (`.claude/settings.json`). Agents dans `.claude/agents/` : eclaireur (Haiku, lecture
seule), executant (Sonnet, travail courant), architecte (Opus : argent, auth, droits, base,
sécurité, migrations lourdes, revue avant production). Règle nº6 de CLAUDE.md.

## Plugins

Installés (portée projet) : frontend-design, context7, playwright.

À installer, avec accord de Selim, par lots, un lot à la fois :
- Lot 1 (design) : UI UX Pro Max, Taste Skill (Node 22+ et Chrome requis, importe des photos libres
  à créditer), Impeccable (`npx impeccable install`, accepter le hook de design), Motion
  (`npx motion-ai`, version gratuite, activer le MCP).
- Lot 2 (qualité) : security-guidance, typescript-lsp (vérifier que le serveur TypeScript est
  présent sur le poste).
- Composants : MCP shadcn (`npx shadcn@latest mcp`), gratuit, à tester sur Tailwind 4 une fois la
  migration faite. Magic UI en complément si besoin. Emil Kowalski (`emilkowalski/skills`) : à
  trancher, recoupe Motion.
- Ces outils sont tiers et non audités : lire ce qu'un installeur écrit dans le projet avant de
  valider, et ne rien installer en dehors du dossier du projet.
- Ordre de priorité à écrire dans CLAUDE.md à l'installation : DESIGN.md = référence, Taste =
  direction, UI UX Pro Max = système de design, Impeccable = contrôle final. Cela évite les avis
  contradictoires.

## Feuille de route

### Étape 1. Lot sûr de dépendances (branche maj-dependances)
1. Demander à Selim l'accord pour commiter la branche (les mises à jour actuelles).
2. Supabase JS 2.119, eslint-config-next 16.4.5.
3. Sentry : importer `withSentryConfig` depuis `@sentry/nextjs/config`, retirer les options
   dépréciées. Ne pas passer en Sentry 11.
4. `middleware` vers `proxy` (codemod officiel). **Architecte obligatoire** : ce fichier porte
   l'authentification. Tester connexion, déconnexion, accès cabinet et espaces protégés.
5. `npm run verify` sans check:cadres, build, aperçu Vercel.
Exclus pour l'instant (risque ou pas de besoin) : Supabase SSR 0.12, Stripe 23, OpenAI 7,
TypeScript 7, ESLint 10, uuid 14. @types/node seulement s'il correspond au Node de Vercel.

### Étape 2. Préparer Tailwind 4 (branche `tailwind-4`)
1. Relever les navigateurs réels des visiteurs (Vercel Analytics). Tailwind 4 exige Safari 16.4+,
   Chrome 111+, Firefox 128+. Si une part notable est en dessous, prévenir Selim avant de continuer.
2. Capturer une référence avec Playwright : pages clés (landing, tarifs, connexion, tableau de
   bord, factures, devis, cabinet) en clair et en sombre, à 3 largeurs (390, 768, 1280).
3. Vérifier `tailwind-merge` : sa v3 vise Tailwind 4, ce qui est cohérent après migration.

### Étape 3. Migrer vers Tailwind 4
1. `npx @tailwindcss/upgrade` sur la branche, puis relire chaque changement.
2. `@tailwindcss/postcss` dans `postcss.config.js`, en-tête de `app/globals.css` en `@import
   "tailwindcss"`. Vérifier le `@apply` de globals.css et les couches `@layer`.
3. `tailwind.config.ts` : porter le thème. Le mécanisme actuel (`relier()` qui redirige chaque
   palette vers les variables `--n-*`, `--acc-*`, `--warn-*`, `--dng-*`, `--inf-*`, avec repli sur la
   couleur d'origine hors app) doit rendre **exactement** les mêmes couleurs. Garder `darkMode:
   "class"` via une variante personnalisée. Les classes `ds-app`, `.light`, `ds-papier`,
   `text-ink`, `text-on-accent`, `bg-ds-*` doivent continuer à fonctionner.
4. Corriger les valeurs par défaut changées par Tailwind 4 : couleur de bordure par défaut, anneau
   de focus, échelles d'ombre / arrondi / flou (`shadow-sm`, `rounded`, `blur`), classes d'opacité
   supprimées (`bg-opacity-*`, etc.). Une vingtaine de fichiers concernés, une dizaine pour les
   opacités.
5. Réécrire `scripts/check-theme-clair.mjs` (il lit `tailwind.config.ts`) pour qu'il garde la même
   garantie sur la nouvelle structure. Ajouter un garde-fou qui échoue si une ancienne classe
   supprimée réapparaît.
6. Vérifier : `npm run verify`, build, comparaison visuelle avec la référence (étape 2), aperçu
   Vercel, puis validation de Selim **sur son téléphone** avant toute mise en production.
7. Si un écart visuel apparaît, il vient de la migration : le corriger ici, pas dans la refonte.

### Étape 4. Installer les plugins et poser le cadre
1. Installer le lot 1 puis le lot 2 (voir Plugins), en vérifiant ce que chaque installeur écrit.
2. Rédiger `DESIGN.md` propre à Deviso (format inspiré de awesome-design-md, sans copier l'identité
   d'une autre marque) : couleurs, polices Hanken Grotesk et Bricolage Grotesque, thèmes clair et
   sombre, cadres, composants, ton. À partir de l'existant, puis à faire évoluer avec la refonte.
3. Écrire l'ordre de priorité des plugins dans CLAUDE.md et y référencer DESIGN.md.
4. Demander à Selim 2 ou 3 sites dont il aime l'esprit, pour ancrer la direction artistique.

### Étape 5. Refonte, page par page
1. Commencer par la landing. Direction (Taste) puis système de design (UI UX Pro Max) puis
   contrôle (Impeccable).
2. Chaque page : captures à 3 largeurs en clair et en sombre avant de montrer à Selim, puis ses
   retours, puis la page suivante. Jamais plusieurs pages d'un coup.
3. Ordre suggéré : landing, tarifs et pages publiques, connexion, tableau de bord, factures et
   devis, cabinet, blog et pages légales.
4. Contraintes inchangées : thème clair/sombre, `ds-papier` pour les aperçus de documents,
   `text-on-accent` sur les aplats verts, pas d'`uppercase` en étiquettes, aucun tiret cadratin.
5. Mise en production : aperçu Vercel d'abord, validation de Selim, puis push sur `main` et
   `npm run check:prod`.

## Pièges connus sur ce poste (Windows)

- `npm` est bloqué en PowerShell : utiliser `cmd`. Un serveur de développement ne rend jamais la main.
- Les dépendances de développement manquent parfois : `npm ci --include=dev`. Arrêter le serveur de
  développement avant, sinon un fichier SWC reste verrouillé (EPERM).
- Ne pas interrompre un `npm update` en cours : cela vide `node_modules`.
- `npx tsc` ne trouve pas TypeScript ici : `node node_modules\typescript\bin\tsc --noEmit`.
- `npm run verify` s'arrête au premier échec (check:cadres, voulu) : lancer les étapes une à une
  sans lui.
- Le shell Linux n'a ni accès GitHub ni réseau vers GitHub : pousser via le git Windows.
- Éviter `grep -r` sur `node_modules`.
- Les tests `test:*` de parcours ciblent par défaut getdeviso.fr (production), pas le code local.

## Avancement (04/11/2026)

- Étape 1 faite et en production (1461c03). Étape 2 faite. Étape 3 faite et en production (4d3a1f9),
  validée par comparaison à 30 captures (docs/reference/captures-tailwind3/ et captures-tailwind4/,
  non versionnées) et par Selim sur téléphone. Prochaine étape : 4 (plugins et DESIGN.md).
- Défauts préexistants relevés par Selim sur téléphone, à traiter dans la refonte (étape 5), non
  causés par la migration : (1) éléments qui se superposent et boutons qui se chevauchent sur
  plusieurs pages en 390 px ; (2) Paramètres : le menu latéral est masqué sous lg, donc sur
  téléphone seule la section Identité est visible ; (3) démo en franchise de TVA : HT = TTC est
  normal, envisager d'afficher « TVA non applicable ».
- Les aperçus Vercel n'ont pas les clés Super PDP (portée production seulement) : pastilles de
  transmission absentes sur les factures, normal.

- Étape 4 : lot 1 installé le 04/11 (Motion, UI UX Pro Max, Impeccable sans hook, Taste), branche
  `outils-design`, règle nº7 de CLAUDE.md. Lot 2 écarté : typescript-lsp (programme global, `tsc`
  suffit) et security-guidance (hooks permanents, revue par modèle à chaque tour, écrit hors du
  projet). Prévoir plutôt une revue de sécurité ponctuelle avant la mise en production finale.
  Reste : `DESIGN.md`, puis 2 ou 3 sites de référence demandés à Selim.

## Points ouverts

- Aperçu fiscal en HTTP 500 sur la production (test SuperPDP) : à examiner.
- Emil Kowalski, Magic UI : à décider.
- Statistiques de navigateurs : à relever à l'étape 2.
