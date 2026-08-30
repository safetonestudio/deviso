# Intégration Super PDP — ce qui reste, et ce que Selim seul peut confirmer

Établi le 29/08/2026 après quatre audits croisés du code contre
`docs/superpdp/openapi.json` (35 opérations, 10 utilisées). Ce document est la
liste de travail ; `etat.md` dit ce qui est prouvé.

## Corrigé et déployé

| # | Défaut | Pourquoi ça comptait |
|---|---|---|
| 1 | « Raccordé » affiché sans ligne d'annuaire | L'entreprise se croyait joignable et ne l'était pas — la promesse même du produit au 1ᵉʳ septembre 2026 |
| 2 | Une vérification en attente ne se débloquait jamais | Le cas nominal du KYB restait bloqué indéfiniment |
| 3 | Perte silencieuse de factures reçues à la synchronisation | Destinataire légal d'une facture jamais vue |
| 4 | `events.at(-1)` au lieu du dernier `fr:*` | Un refus s'affichait `ppf:refused-ack` et repassait « en retard » |
| 5 | XML transmis sans IBAN ni référence d'acompte | Le client recevait une facture sans savoir où payer |
| 6 | Client étranger émis en `B2B` + SIREN exigé | Blocage total pour un freelance à clientèle internationale |

Plus trois silences : erreurs HTTP non journalisées, synchronisation des
événements hors du `try/catch`, `break` muet sur l'échec de lecture des
événements.

## À corriger, par ordre

### Fait — priorités 1 et 2

| Défaut | Correctif |
|---|---|
| `has_vat_on_debits` écrasé à `false` à chaque `PATCH` | Valeur courante lue puis renvoyée ; abstention si la lecture échoue |
| Régime de TVA jamais poussé pour un compte arrivé en attente | `/status` le pousse dès que la vérification aboutit |
| `app/api/profile` visait `user.id` au lieu du workspace | Corrigé ; `non_raccorde` n'est plus filtré du journal |
| `regimeTva` calculé puis jeté | La carte affiche l'avertissement : « Vos factures aux particuliers seront refusées » |
| `400` et `500` confondus à l'émission | Distingués ; `http_ko.message` et `code` lus ; `reessayable` renvoyé |
| Identifiant d'émission écrit sans vérifier l'erreur | Vérifié ; les deux cas d'échec interdisent explicitement la retransmission |
| Trois conditions bloquantes ignorées par le pré-contrôle | Même règle que le panneau de conformité, sur les champs structurés |
| `transmissible()` absent de la route | Appliqué côté serveur |
| **Le pays du client ne pouvait jamais valoir autre chose que « FR »** | `resolveAddress` ne recevait pas `country` ; corrigé sur facture et devis, plus un sélecteur de pays dans le formulaire |
| Annuaire français interrogé avec authentification | `security: []` dans la spec — appel public, la résolution fonctionne désormais pour les comptes non raccordés |

### Fait — priorité 3

| Apport | Ce que ça change |
|---|---|
| `POST /validation_reports` branché à l'émission et exposé en route dédiée | 189 contrôles officiels (XSD CII, Factur-X EN16931, Schematron BR-FR) avec la localisation dans le XML. Sans lui, une facture sémantiquement fausse repartait en `api:invalid` **asynchrone** : POST 200, utilisateur rassuré, facture non transmise |
| `expand[]` + `limit=1000` | 101 appels HTTP séquentiels par page → 1. Borne de sécurité : 20 000 factures au lieu de 2 000. Troncature signalée au lieu d'être présentée comme « à jour » |
| Table des statuts complète (43 codes) | Les `api:*` (factures Peppol) n'avaient aucun libellé, et une facture Peppol rejetée restait affichée « en retard » |
| `fr:204`, `fr:205`, `fr:207`, `fr:208`, `fr:209`, `fr:211` | La seule réponse offerte à une facture douteuse était le refus, définitif, qui oblige le fournisseur à un avoir. Contester et suspendre existent pour ça |
| Commentaire libre joint à l'action | Le fournisseur recevait un code et devait deviner |
| Date d'encaissement dans `fr:212` | Pointer le 29 un virement du 12 déclarait une date fausse de 17 jours, sur la donnée qui détermine l'exigibilité de la TVA |
| Écran des e-reportings (`GET /ereportings`) | Seul endroit où l'on apprend qu'une déclaration a été rejetée par l'administration |
| `401` traité, `403` n'écrase plus le statut | Un compte définitivement refusé lisait « vérification en cours » pour toujours |
| Trois replis au téléchargement | Impasse sur une pièce dont la conservation est une obligation légale |
| `GET /french_directory/companies` | Rechercher un client par son nom au lieu de lui demander son SIREN — une faute de frappe se soldait par un rejet |

**`npm run verify` : 240 vérifications, 0 échec**, dont 42 sur Super PDP
(27 avant ce chantier) et 4 sur le refus.

### Priorité 4 — à cadrer
E-reporting des recettes hors facture (`b2c_transactions`), achats
internationaux (`b2bint_invoices` en `direction: in`), mandats
d'autofacturation. Tous supposent un modèle de données que Deviso n'a pas.

## Questions à poser à Super PDP

Aucune ne se lève par déduction — et c'est en devinant une énumération que
`vat_exemption` avait été manqué.

1. `superpdp_send_and_receive` et `superpdp_directory_entry_identifier` :
   paramètres d'`authorize` utilisés par Deviso, **absents de la spec**. Sont-ils
   supportés ?
2. Sens des codes `TLB1` / `TPS1` / `TNT1` / `TMA1` (`b2c_transaction.category_code`).
3. Valeurs admises de `business_process` (`{id, type_id}`) et de
   `tax_due_date_type_code` sur `b2bint_invoice`.
4. `fr:220` est accepté à la création mais absent de l'énumération de lecture ;
   `fr:501` est glosé mais absent des deux. Que valent-ils ?
5. Découpage des périodes d'e-reporting pour `quarterly` et `simplified` — la
   spec ne documente que le cas mensuel (par décades).
6. `b2c_payment_subtotal.category_code` et `b2c_payment.company_id` sont
   `required` mais absents des `properties` : bug de spec ?

## Ce que Selim seul peut confirmer

Ces points ne sont pas vérifiables depuis une traversée automatique. Chacun est
formulé pour être testé en quelques secondes, avec le résultat attendu.

| # | Quoi faire | Ce qu'on attend |
|---|---|---|
| C1 | Sur `/profil`, carte Plateforme Agréée | L'état doit dire « Raccordé » **et** décrire la ligne de réception. S'il dit « Raccordé, mais pas encore joignable », le bouton « Ouvrir ma ligne de réception » doit apparaître |
| C2 | Cliquer « Ouvrir ma ligne de réception » si proposé | La ligne s'ouvre, l'adresse s'affiche |
| C3 | Refuser une facture reçue (`/factures-recues`) | Le statut passe « Refusée », l'échéance cesse d'être rouge, et un second refus dit « déjà refusée ». Renseigner `E2E_REFUS_EMAIL`/`E2E_REFUS_PASSWORD` dans `.env.local` automatise ce test |
| C4 | Créer une facture pour un client hors de France, la transmettre | Elle part en `B2BInt` et n'est plus bloquée par l'absence de SIREN |
| C5 | Transmettre une facture de solde liée à un acompte | Le PDF reçu par le client porte l'IBAN et la référence de l'acompte |
| C6 | Le tunnel de raccordement complet (débrancher puis reraccorder) | Redirection OAuth : impossible à automatiser |
