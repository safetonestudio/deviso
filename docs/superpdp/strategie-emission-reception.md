# Émission et réception : faut-il laisser choisir ce qui passe par Super PDP ?

*Analyse du 23/11/2026, en réponse à la question de Selim. Aucun code n'a été modifié.
La position proposée en §4 attend sa validation.*

> La question : proposer de n'utiliser la plateforme agréée que pour la réception (ou
> pour l'émission et la réception), afin (1) de réduire ce que Super PDP coûte à Deviso
> et (2) de laisser les cabinets d'expertise comptable travailler à leur manière.

**En une phrase.** Le coût n'est pas une raison de le faire : la réception seule fait
économiser environ 0,15 € par client et par mois. La place du cabinet, elle, en est une
vraie, mais dans l'autre sens. Le cas qu'il faut savoir gérer, c'est « Deviso émet, la
plateforme du cabinet reçoit ». Le cas « Deviso reçoit, le cabinet émet » ne mérite pas
d'être proposé.

---

## 1. Les faits, avec leur source

### 1.1 Peut-on émettre par une plateforme et recevoir par une autre ? Oui.

FAQ DGFiP « Je découvre la facturation électronique », version du 01/09/2026, question 2.2 :

> « elle peut avoir recours à des plateformes différentes pour l'émission et la réception
> de ses factures. »

Même réponse, juste avant : l'entreprise « peut cependant faire un choix distinct de
plateforme, pour la facturation électronique et la transmission des données de
transaction » (le e-reporting peut donc lui aussi passer par une troisième plateforme).
Question 2.1 : « une entreprise peut choisir une ou plusieurs plateforme(s) agréée(s) »,
et « un changement de plateforme agréée est possible, à tout moment ».

Source : [FAQ DGFiP, Je découvre](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf), questions 2.1 à 2.3 et 3.3.

### 1.2 Comment l'annuaire route la réception

Source : *Dossier de spécifications externes de la facturation électronique*, DGFiP/AIFE,
**version 2.1 du 29/07/2022**, chapitre 5 ([PDF officiel](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/specification_externes_b2b/version_2-1_du_29_07_2022/dossier-de-specifications-externes-de-la-facturation-electronique-v2.1.pdf)).
✅ **Confirmé dans la v3.2** (dossier général du 30/04/2026, §3.5.3 et §3.5.5.5) :
« Une ligne d'annuaire est unique » et porte la plateforme de réception. Seule une
plateforme qui a « formellement contractualisé » avec l'entreprise peut la remplacer. Les
délais de changement viennent du décret n° 2026-677 du 27/07/2026, article 7. Détail
dans `reponses-documentation.md`, §4 et §5.

- **Seul le destinataire doit être inscrit.** « il n'est pas nécessaire que les émetteurs
  de factures soient identifiés dans l'annuaire » (§2.5.2). Émettre ne demande donc
  aucune ligne d'annuaire.
- **Une adresse se définit au SIREN au minimum**, puis éventuellement au SIRET et au code
  de routage (§2.5.2, §5.2). Super PDP accepte `SIREN`, `SIREN_SIRET` ou `SIREN_SUFFIXE`
  (`openapi.json`, schéma `create_directory_entry`).
- **Chaque ligne d'adressage porte une plateforme de réception**, et une seule : la
  structure de la ligne contient un bloc « Identification plateforme » (§5.2.1), et
  « l'adressage d'une facture à une plateforme différente de celle choisie par le
  destinataire […] entraînera le refus automatique de la facture » (§5.5.2).
  Plusieurs plateformes sont possibles pour une même entreprise, mais **sur des lignes
  différentes** (un SIRET chez l'une, la ligne générique SIREN chez l'autre, par exemple).
- **Une même adresse ne se partage pas : elle se transfère.** C'est ce que Super PDP
  appelle la portabilité : quand une entreprise arrive d'une autre plateforme, sa ligne
  est « en erreur » le temps du transfert, l'ancienne plateforme ayant cinq jours pour
  rendre la main (documentation Super PDP, article « Annuaire », reprise dans
  `lib/superpdp-fermeture.ts`).

### 1.3 Statuts et encaissement quand une autre plateforme émet

- **Les statuts suivent le chemin de la facture.** « le chemin des statuts sera le même
  que celui des factures » (spécifications v2.1, §5.5.3). Un statut s'attache à une
  facture que la plateforme connaît : l'API Super PDP n'accepte un événement que sur une
  facture qu'elle a elle-même transmise ou reçue (`POST /invoice_events`, identifiant
  Super PDP de la facture).
- **L'encaissement est à la charge du fournisseur.** FAQ « Je découvre », question 10.2 :
  « C'est donc sur l'émetteur de la facture (le fournisseur) que porte l'obligation de
  transmission des données de paiement. » Question 10.3 : elle se fait par un statut
  « Encaissée » rattaché à la facture. Question 10.1 : seulement pour les opérations dont
  la TVA est exigible à l'encaissement (prestations de services, acomptes), pas en option
  sur les débits.
- **Conséquence :** si une facture est émise par la plateforme du cabinet, son
  encaissement (`fr:212`) **doit** être déclaré par cette plateforme-là. Deviso ne peut
  plus le faire, même en restant raccordé à Super PDP pour la réception.
- **Le mandat de facturation est prévu par les textes** (spécifications v2.1, cas 19a) :
  le mandataire (le cabinet, par exemple) crée et transmet la facture, « le fournisseur
  encaisse la facture et est chargé de mettre à jour le statut d'encaissement ». Deux
  options : même plateforme (le mandataire se connecte sur celle de son client) ou deux
  plateformes différentes.
- **Double émission :** chaque plateforme rejette une facture qui reprend le même numéro,
  le même SIREN fournisseur et la même année qu'une facture déjà envoyée (spécifications
  v2.1, §2.10.6, contrôle d'unicité). Ce contrôle est fait par chaque plateforme. Rien
  dans le texte lu ne garantit qu'une facture déposée chez Super PDP puis chez la
  plateforme du cabinet serait arrêtée. **Inconnu, à ne pas supposer.**

### 1.4 Le calendrier

FAQ « Je découvre », question 5.1 : depuis le 1er septembre 2026, toutes les entreprises
doivent pouvoir recevoir par une plateforme agréée ; les PME, TPE et micro-entreprises
« seront […] tenues d'émettre leurs factures au format électronique au plus tard le
1er septembre 2027 ». Question 5.2 : tant que l'entreprise n'est pas soumise à
l'obligation d'émission, « elle peut transmettre tout ou partie de ses factures sous le
format qu'elle souhaite ».

**Ce que cela veut dire pour Deviso aujourd'hui :** la réception doit passer par une
plateforme agréée, Super PDP ou une autre. L'émission électronique est facultative pour
nos utilisateurs jusqu'au 1er septembre 2027.

### 1.5 Comment travaillent les cabinets aujourd'hui

Source : recherche du 20/11/2026, `docs/reference/research_notes/Offre cabinets expertise comptable/besoins_cabinets.md`.

- Enquête flash de l'Observatoire de la profession comptable (3 083 experts-comptables,
  fin août 2026) : **98 %** des cabinets ont choisi une plateforme pour le cabinet, **92 %**
  ont fait signer à leurs clients le mandat de délégation, **83 %** ont choisi la
  plateforme de leurs clients et fait les inscriptions
  ([experts-comptables.fr, 03/09/2026](https://www.experts-comptables.fr/sic-emissions-evenements-presse/sic-webzine/facturation-electronique-73-des-entreprises)).
- Ce mandat autorise le cabinet à désigner la plateforme de réception de son client, donc
  à inscrire son adresse à l'annuaire. C'est surtout la **réception** que les cabinets
  ont organisée : ils veulent que les factures d'achat de leurs clients arrivent seules
  dans leur logiciel de production.
- **jedeclare.com** (ECMA, l'Ordre) n'est pas une plateforme agréée. C'est un service de
  collecte : à partir du SIREN du client, il récupère ses factures auprès de sa
  plateforme, quelle qu'elle soit, avec son consentement. Pilote avec trois plateformes,
  commercialisation début 2027. On ne sait pas encore si Super PDP y sera raccordée :
  la question est rédigée dans `question-jedeclare.md` mais n'a pas encore été envoyée.
- L'émission par le cabinet pour son client (sur mandat de facturation) existe, mais
  comme mission « complète » proposée à certains clients, pas comme pratique générale
  (guides Sage et Indy, sources éditeurs).

**Ce que cela veut dire pour Deviso :** chez beaucoup d'utilisateurs suivis par un
cabinet, l'adresse de réception est **déjà** inscrite chez la plateforme du cabinet.

### 1.6 Ce que Super PDP coûte réellement

Source : `docs/pricing/rapport-pricing-2026-11-23.md`, d'après la page
[superpdp.tech/tarifs](https://www.superpdp.tech/tarifs) lue le 23/11/2026 (page non datée).

| Poste | Prix |
|---|---|
| Facture émise **ou reçue** | 0,01 € HT jusqu'à 10 000 par mois, puis 0,005 €, puis 0,0025 € |
| Vérification d'identité d'une entreprise | 2 € HT, une fois, au raccordement |
| Minimum annuel | 10 € HT pour tout le compte Deviso |

Pour un indépendant type (15 factures émises et 15 reçues par mois) : **0,30 € par mois**,
plus 0,17 € de vérification amortie sur un an. Passer en réception seule fait économiser
les 15 émissions, soit **0,15 € par mois**, et la vérification d'identité reste due de
toute façon. Pour 1 000 clients, cela représente environ 150 € par mois, face à 24 000 €
d'abonnements Solo.

**Tranché par la documentation** (relue en entier le 23/11, voir
`reponses-documentation.md` §3) :
- la réception est facturée comme l'émission (« prix à l'usage […] pour l'émission et la
  réception », conditions générales) ;
- les lectures et la synchronisation horaire ne figurent pas dans la grille, qui ne
  compte que des factures (*déduit*) ;
- l'annuaire public s'interroge sans compte, il ne peut pas être facturé (*déduit*) ;
- la vérification d'identité fait partie de l'inscription, émission seule comprise
  (*déduit*) ;
- l'e-reporting de caisse : « une journée est comptée comme une facture ».

**Reste à demander** (mail prêt dans `reponses-documentation.md`) : si les statuts
(`fr:212`, refus, contestation) sont facturés, et comment sont comptées les déclarations
d'achat international.

---

## 2. Ce que Deviso fait aujourd'hui

- **Raccordement :** Deviso **force** l'ouverture d'une ligne de réception au SIREN
  (`superpdp_send_and_receive=receive`, `lib/superpdp-authorize.ts`). La documentation
  Super PDP décrit trois modes : `any` (l'utilisateur choisit), `send` (pas de
  réception), `receive` (ligne obligatoire).
- **Émission :** elle n'est **jamais automatique**. L'utilisateur clique sur
  « Transmettre » pour chaque facture. Une facture non transmise part en PDF, ce qui est
  permis jusqu'au 1er septembre 2027.

Deux conséquences :

1. **Le mode « réception seule » existe déjà dans les faits.** Un utilisateur qui ne
   clique pas sur « Transmettre » ne coûte pas d'émission à Deviso. Le développer comme
   mode à part ne ferait économiser rien de plus.
2. **Un risque existe déjà, et c'est lui qui touche aux cabinets.** Si la plateforme du
   cabinet a inscrit l'adresse SIREN du client, le raccordement à Deviso ouvre une ligne
   sur la même adresse : c'est une portabilité, qui fait passer la réception du client
   chez Super PDP. Elle commence par un e-mail de confirmation, donc elle n'est pas
   silencieuse, mais l'utilisateur peut l'accepter sans comprendre. Les factures d'achat
   cessent alors d'arriver chez son cabinet. Pour un cabinet pilote, c'est exactement
   le comportement qu'il redoute : « se méfier des plateformes qui s'interposent entre le
   cabinet et son client » (`besoins_cabinets.md`).

---

## 3. Les options, comparées

| | A. Tout par Super PDP (aujourd'hui) | B. Super PDP reçoit, le cabinet émet | C. Deviso émet par Super PDP, le cabinet reçoit | D. Rien par Super PDP |
|---|---|---|---|---|
| **Conforme 2026 (réception)** | Oui | Oui | Oui, par la plateforme du cabinet | Seulement si une autre plateforme reçoit |
| **Conforme 2027 (émission)** | Oui | Oui, si le cabinet transmet chaque facture | Oui | Seulement si une autre plateforme émet ; Deviso n'est plus « solution compatible » pour ce client (FAQ 2.3 : il faut être connecté à au moins une plateforme agréée) |
| **Coût Super PDP par client type** | ~0,30 €/mois | ~0,15 €/mois | ~0,15 €/mois | 0 € |
| **Factures reçues visibles dans Deviso** | Oui | Oui | **Non** (sauf import ou jedeclare plus tard) | Non |
| **Statuts de la facture émise (rejetée, refusée…)** | Oui | **Non**, ils restent chez la plateforme du cabinet | Oui | Non |
| **Encaissement `fr:212` déclaré par Deviso** | Oui | **Impossible** (§1.3) : à faire chez la plateforme du cabinet | Oui | Non |
| **Relance de pointage** | Utile au fisc et à la trésorerie | Trésorerie seulement | Utile au fisc et à la trésorerie | Trésorerie seulement |
| **FEC / Quadra** | Complets (ventes + achats) | Complets | Ventes seules ; achats chez le cabinet | Ventes seules |
| **Cockpit cabinet** (« payée sans encaissée », raccordement) | Juste | Faux sans adaptation | Juste pour les ventes | Partiel |
| **Ce que le cabinet garde en main** | Rien de plus | L'émission | **La réception, qu'il a organisée** | Tout |
| **Risque principal** | Portabilité subie si le cabinet tient déjà l'adresse | **Double émission** ; deux saisies de la même facture | Utilisateur qui croit recevoir dans Deviso | Deviso réduit à un générateur de PDF |
| **Complexité produit** | Nulle | Élevée (état « émise ailleurs », import des statuts, pas de `fr:212`) | Moyenne (raccordement `send`, détection de l'adresse existante, écrans) | Nulle (existe déjà : ne pas se raccorder) |

---

## 4. Recommandation : notre position

**Deviso est l'outil où l'on facture. Super PDP transmet ce que Deviso émet. La
réception, elle, reste là où l'entreprise ou son cabinet l'a mise.**

Concrètement, pour l'utilisateur :

1. **Par défaut, rien ne change** : émission et réception par Super PDP, compris dans
   l'abonnement. C'est le seul mode où Deviso montre tout (factures reçues, statuts,
   encaissement déclaré, exports complets).
2. **Si son cabinet reçoit déjà ses factures**, Deviso le voit au raccordement, le dit en
   clair (« votre adresse de réception est déjà tenue par une autre plateforme, sans
   doute celle de votre cabinet ») et propose de **ne raccorder que l'émission**. Ses
   factures d'achat continuent d'arriver chez son cabinet, et Deviso ne les « vole »
   jamais. C'est l'option C.
3. **On ne propose pas « Super PDP reçoit, le cabinet émet » (option B).** Une facture
   faite dans Deviso puis renvoyée par la plateforme du cabinet, c'est deux saisies, un
   risque de double émission, et des statuts et un encaissement que Deviso ne peut plus
   voir ni déclarer (§1.3). Le client dont le cabinet veut émettre lui-même n'a besoin
   d'aucun réglage : il ne clique pas sur « Transmettre » et télécharge son Factur-X.
   Après le 1er septembre 2027, ce cas reste possible mais sort de ce que fait Deviso.
4. **Le coût ne guide pas ce choix.** 0,01 € par facture : l'argument « plateforme
   agréée comprise dans l'abonnement » vaut bien plus que les quelques centimes économisés.
   Si un jour une ligne coûte, ce sera la réception des gros volumes, pas l'émission.

**Pour la vente au cabinet pilote**, la phrase devient : *« Deviso ne touche pas à la
plateforme que vous avez choisie pour vos clients. Vos clients facturent dans Deviso, et
leurs factures d'achat continuent d'arriver chez vous. »* Elle répond directement à la
crainte n° 1 relevée dans l'étude.

**Ce qu'il reste à vérifier avant de s'y engager publiquement** (mis à jour le 23/11,
d'après `reponses-documentation.md`) :
- ~~le chapitre annuaire v3.2~~ : relu, il confirme le §1.2 ;
- le mode `send` : documenté, et le cas « plateforme de réception différente de la
  plateforme d'émission » est prévu par Super PDP (adresse technique `_replyto` pour
  les statuts). Seul le premier raccordement réel en production le prouvera ;
- **le forçage `receive` ne vole pas la réception en silence** : Super PDP envoie un
  e-mail de reconfirmation avant toute portabilité, puis l'ancienne plateforme a 5 jours.
  Mais un client lié par un mandat de type Audacc doit **prévenir son cabinet** avant
  toute modification, sous peine de dégager la responsabilité du cabinet. Deviso doit
  donc afficher l'avertissement de l'étape 1 avant d'ouvrir le tunnel ;
- jedeclare : aucune trace d'un raccordement de Super PDP, et les conditions de
  raccordement des plateformes ne sont pas publiées. C'est la seule question de fond à
  poser à Super PDP.

---

## 5. Mise en œuvre, si la position est validée

Seule l'option C demande du développement. Chaque étape se livre seule.

**Étape 1. Voir avant de raccorder (lecture publique ; la page tarifs ne la cite pas, gratuité à confirmer).**
Avant d'ouvrir le tunnel, lire l'annuaire public (`GET /french_directory/entries?number=<SIREN>`,
appel non authentifié, déjà utilisé pour les clients). Si une adresse active existe et
qu'elle n'est pas chez Super PDP, afficher le choix : « émettre seulement » (recommandé)
ou « transférer ma réception vers Deviso » (avec l'explication de la portabilité).
*Tests :* fonction de décision pure (adresse absente / active ailleurs / déjà chez nous /
lecture en échec, ce dernier cas ne bloquant jamais), contre-épreuve sur chaque branche ;
traversée sur un compte démo dont l'annuaire est simulé. Aucun appel réel depuis le poste.

**Étape 2. Raccorder en émission seule.**
`construireParamsAutorisation` accepte un mode (`receive` par défaut, `send` sur choix
explicite) ; le mode est mémorisé dans `superpdp_connections`.
*Tests :* `check:superpdp-connect` étendu (le mode `send` ne pose jamais
`superpdp_directory_entry_identifier`, le mode par défaut reste `receive`) ; tunnel
rejoué une fois en bac à sable dans un navigateur, en production seulement avec l'accord
de Selim.

**Étape 3. Un produit cohérent en émission seule.**
Carte du profil : « Raccordé pour l'émission. Vos factures d'achat sont reçues par une
autre plateforme. » La page Factures reçues le dit au lieu d'afficher « aucune facture ».
`lireLigneAnnuaire` ne propose plus « Ouvrir ma ligne de réception » à ce compte. La
veille ne compte pas l'absence de ligne comme une panne.
*Tests :* rendu des deux écrans en mode `send` (capture), assertion qu'aucun écran ne dit
« vous pouvez recevoir » à un compte `send`.

**Étape 4. Le cabinet le voit.**
Dans la fiche dossier : « Réception : plateforme du cabinet / Super PDP ». Les exports
FEC/Quadra d'un client en émission seule annoncent que le journal des achats vient
d'ailleurs, au lieu de sortir un journal vide qu'on croirait complet.
*Tests :* `test:fec` et `test:quadra` sur un dossier en émission seule (pas de journal HA,
note explicite) ; `test:scenarios` avec un scénario « émission seule ».

---

## 6. Et avec le rapprochement bancaire automatique ? (ajout du 23/11, question de Selim)

Selim : le rapprochement bancaire, futur argument auprès des cabinets, rendra
l'envoi à la plateforme automatique. C'est la raison pour laquelle il a posé la question.

Rien n'est encore écrit sur ce chantier dans le dépôt. Aujourd'hui, le pointage est
manuel (`CLAUDE.md`, « Paiements »). Ce qui suit ne dépend que des règles lues en §1.

**Ce que l'automatisation change :**

1. **Le volume d'appels augmente, mais le coût reste négligeable.** Si toute facture
   validée part à Super PDP, et si chaque paiement rapproché déclenche un `fr:212`, un
   client type passe de ~0,15 € (émission au clic) à ~0,30 € par mois. On ajoute au plus
   ~0,15 € si les événements d'encaissement sont facturés comme des factures. La grille
   tarifaire ne les mentionne pas, c'est l'une des deux questions de coût qui restent
   (`reponses-documentation.md`). Le coût ne décide toujours rien.
2. **Le rapprochement n'a d'effet fiscal que si Deviso a émis la facture.** L'encaissement
   se déclare par un statut rattaché à la facture, sur le chemin de la facture (§1.3).
   Si Deviso a émis par Super PDP, un paiement reconnu sur le relevé peut déclarer seul
   l'encaissement, à la vraie date. C'est le « statut encaissée manquant » que les
   cabinets citent parmi leurs besoins (`besoins_cabinets.md`). Si la plateforme du
   cabinet a émis (option B), le rapprochement de Deviso ne peut rien déclarer. Il ne
   sert plus qu'à la trésorerie, et le cabinet doit déclarer ailleurs. **Le rapprochement
   renforce donc la position du §4 au lieu de la remettre en cause.**
3. **L'automatisation rend la règle « une facture, une seule plateforme d'émission »
   impérative.** Tant que l'envoi se fait au clic, une double émission demande deux
   erreurs humaines. Une fois automatique, il suffit qu'un client dont le cabinet émet
   lui-même ait laissé l'envoi automatique actif. L'envoi automatique doit donc être
   coupé, au niveau du compte, dès que l'utilisateur ou son cabinet déclare qu'une autre
   plateforme émet. C'est le seul réglage de « choix » qui mérite d'exister.
4. **Côté achats, la tension est réelle, mais limitée.** Rapprocher un paiement
   fournisseur demande la facture reçue. En option C (le cabinet reçoit), Deviso ne l'a
   pas, sauf achat saisi ou lu par photo. Ce rapprochement n'a toutefois aucun effet
   fiscal. L'obligation de déclarer le paiement pèse sur le fournisseur, pas sur
   l'acheteur (FAQ « Je découvre », question 10.2). Le cabinet le fait déjà dans son
   logiciel de production, qui récupère la banque automatiquement dans 90 % des cabinets
   (chiffre Shine, source éditeur, `besoins_cabinets.md`). Le rapprochement de Deviso
   vaut d'abord pour les **ventes**.

**Position, précisée :**
- Deviso émet par Super PDP, automatiquement à la validation une fois le rapprochement en
  place, et déclare seul l'encaissement des paiements reconnus. C'est ce qui donne au
  rapprochement sa valeur pour le cabinet.
- La réception reste là où le cabinet l'a mise (option C), sans changement.
- Un seul interrupteur côté compte : « une autre plateforme émet mes factures ». Il coupe
  tout envoi et tout `fr:212`, et Deviso le signale au cabinet dans la fiche dossier. Pas
  de mode « réception seule » à développer.

**Ajout au plan du §5 (étape 5, avec le rapprochement) :** envoi automatique et `fr:212`
automatique conditionnés à cet interrupteur. *Tests :* compte avec l'interrupteur actif,
aucun appel `emettre` ni `invoice_events` même avec un paiement rapproché (contre-épreuve :
l'interrupteur inactif déclenche bien les deux) ; un paiement rapproché sur une facture
transmise déclare `fr:212` une seule fois, à la date du relevé (même garde que
`test:date-encaissement`).

**Hors périmètre, volontairement :** l'option B (état « émise par une autre plateforme »,
import de ses statuts). À rouvrir seulement si le cabinet pilote le demande avec un vrai
besoin.
