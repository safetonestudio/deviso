# Deviso

Devis et factures pour freelances et micro-entrepreneurs français : un brief en
langage naturel donne un devis complet en 30 secondes, signé en ligne, facturé
au format Factur-X et transmis via une Plateforme Agréée (réforme de la
facturation électronique 2026).

Production : https://getdeviso.fr

---

## Fonctions

La liste des fonctions par formule a une source unique, `lib/plans.ts`
(matrice `FEATURES`, fonction `can()`). La page d'accueil, la grille des
formules et `/billing` en sont dérivées ; `npm run check:vitrine-exports`
vérifie que les routes appliquent bien ce que la vitrine promet.

En bref :

- **Devis** : rédaction par IA depuis un brief, éditeur de lignes, catalogue,
  partage par lien, signature électronique, relances.
- **Factures** : Factur-X EN 16931, acompte et solde, factures récurrentes,
  avoirs, factures en anglais pour les clients étrangers (mentions légales
  françaises conservées), dépôt Chorus Pro.
- **Plateforme Agréée (Super PDP)** : émission, réception, statuts, déclaration
  des encaissements, e-reporting des ventes et achats internationaux.
- **Gestion** : paiements clients, livre des recettes tenu automatiquement
  (date et mode d'encaissement, export CSV), suivi du CA et des échéances
  URSSAF, export FEC, CRM, équipe et rôles.
- **URSSAF (en préparation)** : télédéclaration du CA via l'API Tierce
  Déclaration auto-entrepreneur. Codée et testée, inactive tant que
  l'habilitation n'est pas obtenue. Voir `docs/urssaf/tdae.md`.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS · Supabase (Postgres,
Auth, RLS) · OpenAI · Stripe (abonnements Solo et Pro, sièges) · Resend ·
@react-pdf/renderer · Sentry · SWR. Hébergement Vercel, déploiement à chaque
push sur `main`.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

Les variables nécessaires sont celles du projet Vercel. Aucune valeur de
secret n'est versionnée dans ce dépôt.

## Qualité

- `npm run verify` : toutes les gardes statiques (droits, navigation, thème,
  vitrine, emails, typographie...) et les tests de bout en bout.
- `npm run check:prod` : attend que la production serve le commit local
  (`/api/version` renvoie le SHA déployé).

## Documentation

- `docs/superpdp/` : intégration Plateforme Agréée (état, chantier, audits).
- `docs/urssaf/tdae.md` : télédéclaration URSSAF.
- `docs/facturx/` : écarts Factur-X Basic / EN 16931.
- `docs/seo/` : plan éditorial et netlinking.
