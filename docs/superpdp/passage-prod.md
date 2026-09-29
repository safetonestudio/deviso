# Passage en production Super PDP, axe de travail

Établi le 29/09/2026. Vérifié dans le code, pas déduit. Ordonné pour la bascule.
`etat.md` dit ce qui est prouvé, `chantier.md` ce qui a été décidé de ne pas faire.
Ce document dit ce qui reste à faire pour allumer la Plateforme Agréée en prod.

## Phase 0, déjà prouvé en production (bac à sable, vraies factures), ne pas rouvrir

Émission B2B et B2C, refus d'une facture mixte. Réception, contester/suspendre/refuser,
avoir. Encaissement `fr:212` avec la vraie date de paiement (`paid_at` comblé le 14/09,
13/13). Conformité XML jugée par les validateurs officiels (16/16). Fermeture de ligne
d'annuaire. Ventes B2BInt (client hors France). Tunnel OAuth rejoué en sandbox le 30/08
(refresh token rotaté, société 57700).

## Phase 1, fermer les boucles automatisables AVANT la bascule (en sandbox)

1. Renseigner `E2E_REFUS_EMAIL` / `E2E_REFUS_PASSWORD` dans `.env.local` (compte
   destinataire sandbox). Aujourd'hui NON configurés : le refus abouti `fr:210` n'est
   donc pas couvert par `verify`. Une fois posés, `npm run verify` ferme la boucle.
2. Une exécution `npm run verify` propre (limite 10 comptes démo/h/IP, donc 1 run/h),
   confirmer 0 échec.
3. Achats internationaux : re-confirmer le CREATE `200` en sandbox via la sonde jetable
   (compte Burger Queen, company 57701), et geler la table `EAS_TVA_PAR_PAYS`.

## Phase 2, la bascule technique (leviers exacts, vérifiés)

1. Vercel prod : `SUPERPDP_SANDBOX` `true` -> `false`. Effet code : `companyNumberScheme()`
   passe de `sandbox` à `fr_siren` (le numéro d'entreprise devient le SIREN), et l'émission
   réelle est débloquée. C'est une env var Vercel.
2. `REFORME_PUBLIEE` : constante à `false` dans `app/(dashboard)/prise-en-main/page.tsx:171`,
   PAS une env var. La passer à `true` = modif de code + déploiement. Ne gouverne que la
   visibilité des 4 guides PA de `/prise-en-main`.
3. Déclarer l'URL de redirection prod `https://getdeviso.fr/api/superpdp/callback` dans
   l'app Super PDP (action Selim, côté leur tableau de bord).
4. Basculer le compte Super PDP de type sandbox vers prod (action Selim, côté eux).

## Phase 3, dry-run en prod, avec Selim (irréversible, exige navigateur et téléphone)

1. Rejouer le raccordement OAuth complet sur le compte prod (connect -> callback ->
   déconnexion). Le code du 30/08 est en place : fenêtre 30 min, cas d'échec distincts.
   C'est un autre compte que le sandbox, d'où le rejeu.
2. Émettre UNE vraie facture B2B depuis l'entreprise réelle. Acte de vérité : engage le
   réseau national. Traverser : rendu -> transmission -> statut plateforme -> encaissement
   `fr:212`.
3. Vérifications C1 à C5 de `chantier.md` (carte PA sur /profil, ouverture de ligne de
   réception, refus d'une facture reçue, facture hors France en B2BInt, facture de solde
   portant IBAN + référence d'acompte).

## Phase 4, non bloquant, quand l'occasion se présente

1. Question biens/services B2C à poser à Super PDP. Impact B2C seul, rien n'en dépend.
2. Achats int : forme exacte de l'identifiant vendeur par schéma (PPF tranchera en prod),
   DK/FI et hors-UE à compléter au besoin.
3. Corriger dans CLAUDE.md la ligne périmée « tunnel jamais rejoué de bout en bout ».

## Audit + tests du 29/09/2026 (carte de couverture, pas un verdict)

### Traversé en production (live, compte sandbox Burger Queen 57701), 0 échec
- `test:superpdp` 48/48 (émission B2B/B2C, refus mixte, encaissement fr:212, régime
  TVA, annuaire, sync, validation officielle, exigibilité débits/encaissements,
  recherche annuaire, e-reportings, download Factur-X, garde-fous refus).
- `test:superpdp-refus` 4/4 (garde-fous ; le refus abouti reste manuel).
- `test:conformite` 16/16 (validateur officiel, 14 situations dont B2BInt et acompte).
- `test:avoir` 20/20 (avoir accepté par la PA), `test:avoir-interne` 24/24.
- `test:fermeture-ligne` 10/10. `test:date-encaissement` 13/13 (bloc MEN, date réelle).
- Probe b2bint direct : PL daté du 25/09 -> 200 (id 14122). Le pays PL est bien couvert.
- `transmettreAchat` (vrai code) : PL -> transmis (id 14123) ; DK -> en_attente.

### Non traversé (exige Selim, un navigateur, ou un compte destinataire)
- Refus abouti fr:210 (session compte destinataire). Émission depuis entreprise réelle.
- Tunnel OAuth rejoué sur le compte prod. DELETE d'une ligne d'annuaire. Rendu des écrans.

### Défaut trouvé, achats internationaux (à trancher avec Selim)
- `en_attente` sert à deux choses opposées : « transitoire, un réessai corrige » et
  « bloqué sur ce qu'aucun réessai ne changera ». Deux cas bouclent à vie sans issue :
  1. `refusDeFenetre` (`lib/superpdp-achats.ts:349`) classe « cannot add invoice at
     date » (date trop ancienne) comme réessayable. Le passé ne revient pas dans la
     fenêtre : réessai éternel. C'est le cas de la facture polonaise du 05/06. Risque
     réel aussi via l'import OCR d'une facture d'il y a deux mois.
  2. Pays hors table EAS -> `en_attente` avec « sera déclaré dès que ce sera possible ».
     Un cron ne remplit pas une table statique : jamais déclaré, message trompeur.
- Le regex de `refusDeFenetre` matche tout message contenant « date », trop large.
- Correctif proposé : un état terminal actionnable (hors délai / pays non pris en
  charge / à régulariser) distinct de en_attente, message clair, et un compteur
  d'abandon sur le cron. Choix de design (nouvel état vs message) à valider.
- Lacune de couverture : aucun e2e sur la route /api/superpdp/achats ni sur le cron
  retenterAchatsEnAttente. Seule preuve = probe manuel.

## Correctif Option A livré le 29/09/2026 (deploye en prod)

Etat terminal `action_requise` distinct de `en_attente`, pour les cas qu'aucun
reessai automatique ne resout. Traverse en live contre le vrai bac a sable.

- Migration `20260929_achats_action_requise_et_retry_count` (appliquee + committee) :
  valeur `action_requise` au CHECK, colonne `retry_count`.
- `classerRefus` remplace `refusDeFenetre` : discriminant = position de la date
  (future -> reessayer, passee hors fenetre -> action_requise), pas le texte.
- Pays hors table EAS -> action_requise immediat (message honnete).
- Garde d'abandon du cron : au-dela de SEUIL_ABANDON (168, ~7j horaires) un
  `en_attente` bascule en action_requise. Attrape toute la classe futile, pas un
  cas nomme. Colonne retry_count comme compteur.
- patchStatut persiste le message clair (affiche sous le badge), plus le detail.
- UI : badge "Action requise" (orange, lisible clair/sombre).
- e2e committe `test:achats` (dans `verify`) : 7/7, contre-epreuve faite (bug
  reintroduit -> 6/7, le controle crie).
- La vraie facture Kowalski (FV/2026/09/00147) est passee action_requise.

Deploiement : `npx vercel --prod --yes --scope getdeviso` (le `--scope` est
requis depuis ce shell, CLI logge en compte perso, projet sous team getdeviso).
