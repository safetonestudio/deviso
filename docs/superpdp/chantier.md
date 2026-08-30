# Intégration Super PDP — état de fin de chantier

**Le chantier est terminé.** Émettre, recevoir, répondre, refuser, encaisser,
vérifier avant d'envoyer, voir ce qui est déclaré : tout ce dont un freelance a
besoin est en place et prouvé par la traversée en production.

Ce document garde la trace de ce qui a été fait, de ce qui a été **décidé de ne
pas faire**, et des rares vérifications qui demandent un œil humain.

Établi les 29 et 30/08/2026 après quatre audits croisés du code contre
`docs/superpdp/openapi.json` (35 opérations) et la lecture intégrale de leur
documentation. `etat.md` dit ce qui est prouvé, et comment.

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

### Fait — priorité 4, ce qui était déterminable

Sondage du bac à sable en lecture seule, le 30/08/2026. Deux découvertes qui
changent le plan initial :

1. **Les transactions d'e-reporting B2C sont créées automatiquement** par
   Super PDP à partir des factures transmises (`b2c_transaction.invoice_id`
   pointe la facture). Deviso n'a donc **rien à déclarer** pour une vente
   facturée — le `POST` ne sert qu'aux recettes hors facture.
2. Nos factures **services** ressortent classées `TLB1`. Le champ
   `operation_category` de Deviso n'était écrit **nulle part dans le XML** :
   Super PDP n'a aucun moyen de distinguer biens et services. Voir les questions.

| Livré | Ce que ça apporte |
|---|---|
| `GET /b2c_transactions` et `/b2c_payments` filtrés par facture | « Votre vente a bien été déclarée au titre du flux 10.1 », avec `ppf_ereporting_id` — nul tant que la déclaration n'est pas déposée |
| `GET /ereportings/preview` | La seule occasion de corriger avant que ça devienne une déclaration. XML seul, `204` = rien à déclarer, traité comme un résultat |
| **BT-8 corrigé** | `DueDateTypeCode` était **inversé** : 72 (« paid to date ») émis pour les débits, et rien pour les encaissements — le cas courant. Deux assertions verrouillent les deux sens |

Aucune période n'est calculée côté Deviso : la spec ne documente le découpage
que pour le régime mensuel, et **par décades**. Deviner pour le trimestriel
serait exactement l'erreur de `vat_exemption`.

### Décisions prises — ces points ne seront pas traités

Ce ne sont pas des tâches en attente. Ce sont des choix, et ils sont clos.

**Achats internationaux (`b2bint_invoices`, `direction: in`) — hors produit.**
Deviso ne gère pas les factures fournisseur : ni saisie, ni stockage, ni
comptabilité d'achat. Déclarer un achat international suppose de connaître cet
achat, ce que Deviso ne fait pas et n'a pas vocation à faire. L'obligation pèse
sur l'entreprise et son comptable, pas sur un logiciel de devis et facturation.

**Recettes au comptant (`POST /b2c_transactions`) — hors cible.**
Leur documentation décrit le cas : « les salons de coiffure font leurs ventes
sur une caisse enregistreuse ». Les utilisateurs de Deviso facturent. Et pour
une vente facturée, la déclaration est produite automatiquement — leur
documentation prévient même : « il faut veiller à ne pas envoyer les données
d'e-reporting en double ». Implémenter cette route ferait courir un risque de
double déclaration pour un cas d'usage qui n'existe pas ici.

**Mandats d'autofacturation — question close.**
« Une erreur fréquente est de penser qu'un logiciel de facturation est un tiers
facturant. Or ce n'est pas le cas. » Deviso agit par délégation du compte de son
client. Ce point n'aurait jamais dû figurer sur une liste de travail.

**Biens contre services** reste la seule inconnue, et son impact est étroit :
elle ne joue que sur les factures **B2C**. Pour une facture B2B — l'essentiel du
travail d'un freelance — transmettre la facture satisfait les deux obligations,
et la question ne se pose pas. En B2C, l'encaissement est déclaré de toute
façon puisque Deviso envoie `fr:212`. À poser à Super PDP quand l'occasion se
présente, sans que rien n'en dépende.

### Le seul manque encore ouvert

**Aucune colonne `paid_at`.** La route `encaisser` accepte une date
d'encaissement, mais Deviso ne mémorise pas la date de paiement : le bouton
« Marquer comme payée » ne peut donc pas la transmettre, et la plateforme date
du jour. Juste dans le cas courant, faux pour un virement pointé en retard.
Une colonne et un champ de date — à faire si le besoin se présente, pas avant.

## Les questions, et leurs réponses

Elles étaient toutes dans la **documentation** de Super PDP
(`superpdp.tech/documentation`), que la référence OpenAPI cite pourtant
explicitement et que je n'avais jamais ouverte. Le contenu est servi par
`https://api.superpdp.tech/internal/articles/{n}/html`, ce qui permet de
chercher dans les quatorze sections d'un coup.

| Question | Réponse trouvée |
|---|---|
| `superpdp_send_and_receive` et `superpdp_directory_entry_identifier` sont-ils supportés ? | **Oui**, documentés section « Authentification ». `any` (défaut) laisse le choix, `send` masque la réception, `receive` **force** l'enregistrement d'une ligne. Notre usage est le bon. `superpdp_directory_entry_identifier` configure l'adresse créée, indépendamment du pré-remplissage de l'entreprise — il est désormais envoyé systématiquement |
| Faut-il déclarer les transactions B2C d'une facture ? | **Non, surtout pas.** « Nous faisons automatiquement l'extraction des données d'e-reporting […] Il faut veiller à ne pas envoyer les données en double » |
| Une facture B2B doit-elle être déclarée séparément ? | **Non.** « En nous confiant une facture, nous satisfaisons les deux obligations d'e-invoicing et d'e-reporting » (Flux 1) |
| Comment Super PDP détecte-t-il le B2C ? | Note **BAR** valant `B2C`, **ou** adresse électronique acheteur au scheme **EM**. Exactement ce que Deviso fait — un audit l'avait signalé comme non contractuel, il est documenté |
| Que faire d'une facture déjà encaissée à l'émission ? | « **Il faut envoyer ce message de cycle de vie juste après sa création.** » C'était un trou : le flux 10.2 ne partait jamais. Corrigé |
| Quelle adresse d'annuaire ouvrir ? | « On vous conseille de choisir le numéro SIREN de votre entreprise » — on ouvrait `SIREN_SIRET` |
| Les mandats concernent-ils Deviso ? | **Non.** « Une erreur fréquente est de penser qu'un logiciel de facturation est un tiers facturant. Or ce n'est pas le cas » : Deviso agit par délégation du compte du client. Question close |
| Achats internationaux | « Il n'est pas possible d'envoyer directement des factures, il faut déclarer les données d'e-reporting » via `b2bint_invoices`. Les **ventes** internationales passent bien par l'API `invoices`, ce que Deviso fait |
| Périodicité de déclaration | Décadaire pour le régime mensuel (« déclarer tous les 10 jours »). Le trimestriel et le simplifié ne sont pas détaillés — sans conséquence : Deviso ne calcule aucune période, il passe la date et laisse la plateforme décider |

### La seule qui reste ouverte

**Comment déclarer qu'une facture porte des services et non des biens ?**

Établi par l'expérience, pas par supposition : une facture B2C de services,
émise avec BT-8 = `72` (exigibilité au paiement), ressort classée `TLB1` chez
Super PDP. J'ai vérifié que `tax_due_date_type_code: "72"` arrive bien — donc
BT-8 n'est pas le discriminant. Aucune des quatorze sections de leur
documentation ne mentionne `category_code`, `TLB1` ni `TPS1`.

L'enjeu est réel : leur documentation dit qu'un restaurant (biens) ne déclare
que les transactions, alors qu'un salon de coiffure (services) déclare aussi
les paiements. Une facture de prestation classée en livraison de biens est donc
une déclaration incomplète.

C'est la seule question à leur poser, et elle est précise.

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
