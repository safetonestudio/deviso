# Chantier : télétransmission URSSAF (API TDAE)

Note de cadrage. Objectif : permettre a un micro-entrepreneur utilisateur de
Deviso de déclarer son chiffre d'affaires a l'URSSAF (et le cas échéant de
payer) directement depuis Deviso, sans ressaisie sur autoentrepreneur.urssaf.fr.

Statut au 29/09/2026 : NON commencé. Note de faisabilité, pas d'engagement de
planning. Rien n'est codé.

## Ne pas confondre avec Super PDP

Deux systemes distincts, deux administrations, deux API :

- **Super PDP / Plateforme Agréée** = réforme de la *facturation électronique*
  (Factur-X, e-reporting, Chorus Pro). Déja intégré.
- **URSSAF TDAE** = *déclaration sociale* de CA du micro-entrepreneur (les
  fameuses échéances 30 avril / 31 juillet / etc.). C'est le sujet ici, et il
  n'a aucun rapport technique avec Super PDP.

## Ce qui est vérifié (sources officielles)

L'URSSAF expose l'**API Tierce Déclaration Auto-Entrepreneur (TDAE)**, gratuite,
a acces restreint (REST). Vérifié sur api.gouv.fr / data.gouv.fr le 29/09/2026.

Ce qu'un tiers habilité peut faire via l'API :

- enregistrer aupres de l'URSSAF le **mandat** donné par l'auto-entrepreneur ;
- **déclarer le chiffre d'affaires** a sa place ;
- **estimer les cotisations** ;
- **initier un paiement SEPA** et gérer les mandats SEPA (lister, enregistrer,
  révoquer).

Éligibilité : la fiche cite « éditeurs de logiciels » et « plateformes
collaboratives », et l'éligibilité listée inclut « Entreprise ». Deviso, éditeur
de logiciel, entre donc dans le périmetre (contrairement a ce que laissait
penser la communication URSSAF d'origine, centrée sur les marketplaces).

Cadre juridique : l'utilisateur de l'API est « tiers déclarant » au sens des
articles **L.133-11, R133-43 et R133-44** du Code de la sécurité sociale.

Acces : demande d'abonnement via le portail URSSAF, puis acces bac a sable, puis
production. Un **mandat client** est requis avant toute déclaration.

Contact URSSAF : contact.tiercedeclaration@urssaf.fr

Sources :
- https://api.gouv.fr/les-api/api-declaration-auto-entrepreneur
- https://www.data.gouv.fr/dataservices/api-tierce-declaration-auto-entrepreneur
- https://www.autoentrepreneur.urssaf.fr/portail/accueil/informations-tierce-declaration.html

## Ce qui reste a établir (NON vérifié, a confirmer aupres de l'URSSAF)

- Forme exacte et pieces de la demande d'habilitation éditeur, et délai.
- Format d'échange précis (OpenAPI, authentification, format du mandat).
- Périmetre du mandat : un mandat par utilisateur, révocable, sa forme légale.
- Contraintes de sécurité (mTLS, certificat, IP, secret) côté tiers déclarant.
- Responsabilité en cas d'erreur de déclaration transmise par Deviso.
- Le paiement SEPA : le proposer ou s'arreter a la déclaration (moins de risque).

## Démarche a la charge de Selim (ne peut pas etre faite par Claude)

L'habilitation se fait au nom de l'entreprise (SafeTone, SIRET 10334085700012)
via le portail URSSAF. C'est le point de départ ; sans elle, pas d'acces bac a
sable, donc rien a intégrer. A lancer en amont du développement.

## Esquisse d'architecture côté Deviso (a affiner apres lecture de l'OpenAPI)

Aligné sur le découpage déja utilisé pour Super PDP :

- `lib/urssaf-tdae.ts` : client API (auth, déclaration, estimation, mandats),
  best-effort, jamais de secret en dur (regle nº4 : secrets sur Vercel).
- Table `urssaf_mandats` (ou colonnes sur `profiles`) : état du mandat par
  utilisateur (donné, en attente, révoqué), horodatage, référence URSSAF.
- Flux de mandat : écran d'autorisation côté utilisateur (acte réservé au
  titulaire, cf. `lib/droits.ts`), envoi du mandat a l'URSSAF, stockage de l'état.
- Le CA a déclarer vient déja de la meme source que le widget : factures
  `paid`, HT, avoirs retranchés, par période (voir `caMensuelHt` dans
  `app/(dashboard)/dashboard/page.tsx`). La déclaration réutilise ce calcul.
- Drapeaux d'activation type `SUPERPDP_SANDBOX` / `REFORME_PUBLIEE` : un
  `URSSAF_TDAE_SANDBOX` pour ne rien transmettre en réel depuis un compte de test.
- Validation avant envoi obligatoire (comme Super PDP) : l'utilisateur voit le
  montant et confirme ; Deviso propose, l'utilisateur décide.

## Point d'accroche déja en place

Le widget CA (`components/CaUrssafWidget.tsx`) réserve, sous le total annuel, un
emplacement commenté pour le futur bouton « Télétransmettre a l'URSSAF ». Aucun
bouton n'est rendu tant que l'habilitation et l'intégration ne sont pas pretes :
on n'affiche pas une action qui ne marche pas.

## Regle d'activation (démarches prod irréversibles)

Comme pour Super PDP : ne PAS exposer ni activer la transmission réelle tant que
le flux complet (mandat, déclaration, retour URSSAF) n'a pas été traversé en bac
a sable. Une déclaration sociale erronée transmise a l'URSSAF n'est pas un bug
qu'on corrige en silence.
