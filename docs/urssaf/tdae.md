# Chantier : télétransmission URSSAF (API TDAE)

Note de cadrage. Objectif : permettre a un micro-entrepreneur utilisateur de
Deviso de déclarer son chiffre d'affaires a l'URSSAF (et le cas échéant de
payer) directement depuis Deviso, sans ressaisie sur autoentrepreneur.urssaf.fr.

Statut au 24/10/2026 : client, règles, base et route codés et testés contre la
documentation ; écrans en attente de la charte URSSAF ; accès bac à sable en
cours (DataPass D99994).

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

## Contrat technique (vérifié le 24/10/2026)

Sources : documentation ACOSS-Documentation-API-TDAEV1 v1.5.0 (PDF du portail
API URSSAF, fiche « API Tierce Declaration auto-entrepreneur ») et contrat
Swagger 2.0 de production 1.5.1 (sandbox annoncée en 1.5.0).

- Hôte de production : https://api.urssaf.fr, chemin /tiersdecl/v1/ae.
- Authentification : OAuth2 Client Credentials, jeton sur
  https://api.urssaf.fr/api/oauth/v1/token, scope `tiersdecl.ae`.
- Quota : 300 requêtes par minute, HTTP 429 au-delà.
- Identifiant : SIRET seul (le NIR est déprécié).
- 020 GET /comptes : mandatPresent, periodicite (M ou T), date_etat
  (début d'activité, JJ/MM/AAAA), exoAccrePresent.
- 030 POST /mandats?siret&dateNaissance : la date de naissance doit être celle
  connue de l'URSSAF ; mail automatique à l'AE ; un seul tiers déclarant par
  SIRET (SIRET_DEJA_MANDATE).
- 031 DELETE /mandats : annulation, mail automatique.
- 040 POST /estimer, corps { ca } : estimation (la date n'est plus utilisée).
- 050 POST /declarer, corps { ca, periode } : montants entiers arrondis à la
  règle DGFiP ; la période doit être ouverte (APPEL_INCONNU) et couverte par
  le mandat (MDT_HORS_PERIODE) ; une redéclaration sur la même période ouverte
  annule et remplace (certificat stable, idDeclaration nouveau). Cotisations
  dues = montantTotal + montantRegulAcre + montantDeduction.
- Le contrat 1.5.1 ajoute des montants « VL » (versement libératoire) absents
  du PDF : pris en compte dans les types.
- Paiement SEPA (060 à 075) : hors périmètre de départ.
- Adresses du bac à sable : non publiées, fournies avec l'accès.

## Ce qui est codé (24/10/2026)

- `lib/urssaf-periodes.ts` : périodes, échéances (dont le tableau des
  premières échéances en début d'activité), arrondi, CA de la période depuis
  le livre des recettes.
- `lib/urssaf-tdae.ts` : client (jeton en cache, un seul renouvellement sur
  401, contrôles avant envoi), traduction de chaque code d'erreur en message
  clair, simulateur fidèle aux erreurs documentées.
- Tables `urssaf_tdae_comptes` (mandat) et `urssaf_tdae_declarations`
  (journal en ajout seul, preuve de ce qui a été envoyé).
- Route `app/api/urssaf/tdae` (titulaire seul, formules Solo et Pro) :
  état, mandat, révocation, estimation, déclaration. Le montant envoyé est
  recalculé côté serveur et doit être celui confirmé par l'utilisateur.
- Test : `npm run test:urssaf-tdae` (règles, forme exacte des requêtes,
  erreurs).

Activation par variables d'environnement Vercel :
`URSSAF_TDAE_MODE` = simulation | sandbox | production ; en sandbox
`URSSAF_TDAE_API_URL`, `URSSAF_TDAE_TOKEN_URL`, `URSSAF_TDAE_CLIENT_ID`,
`URSSAF_TDAE_CLIENT_SECRET` ; en production, en plus,
`URSSAF_TDAE_PRODUCTION_AUTORISEE=oui`. Sans `URSSAF_TDAE_MODE`, la route
répond 404.

## Reste à faire

- Écrans (mandat, déclaration, historique) : attendent la charte
  « Autoentrepreneur Connect » demandée à l'URSSAF, dont les maquettes
  doivent être validées avant la production.
- Brancher le bac à sable dès réception des identifiants, rejouer le
  parcours complet, puis demander la production.
- Répartition du CA entre plusieurs catégories (activité mixte) : une seule
  catégorie par compte pour l'instant.

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
