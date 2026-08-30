# État de l'intégration Super PDP

Bilan du 29/08/2026, après la refonte du jour. Ce document dit ce qui est
**prouvé par une traversée**, ce qui n'est **vérifié qu'à l'œil**, et ce qui
n'est **pas couvert du tout**. Il ne dit nulle part « zéro bug » : trois défauts
ont été trouvés ce jour même dans du code qui passait tous les tests.

## 1. Les appels, confrontés à la spécification

Dix opérations utilisées, toutes présentes dans `openapi.json` avec la bonne
méthode. Les valeurs d'énumération envoyées ont été relues une par une :

| Ce qu'on envoie | Valeurs admises par la spec | Verdict |
|---|---|---|
| `processing_rule` : `B2B`, `B2C` | `B2B`, `B2BInt`, `B2C`, `B2G`, … | conforme |
| `vat_regime` : `monthly`, `quarterly`, `simplified`, `vat_exemption` | les quatre mêmes | conforme |
| `status_code` : `fr:210`, `fr:212` | `fr:204`–`fr:212`, `fr:220` | conforme |

Rappel du 29/08 : `vat_regime` avait été **deviné** en sondant l'API, et
`vat_exemption` manquait. Une énumération ne se devine pas, elle se lit.

## 2. Ce qui est prouvé par une traversée en production

`npm run test:superpdp` — **31 vérifications**, contre `getdeviso.fr`, sur des
comptes réels du bac à sable, avec de vraies factures.

- Émission B2B, B2C, et refus argumenté d'une facture mixte biens+services
- BT-30 porte le numéro d'entreprise enregistré par Super PDP, BT-32 le SIREN
- Adresse d'acheminement lue dans l'Annuaire ; la saisie manuelle prime ; le
  repli sur le SIREN est annoncé et non silencieux
- Pré-contrôle : le refus nomme ce qui manque et désigne le client par son nom
- Non-réémission d'une facture déjà transmise
- Encaissement `fr:212` déclaré une seule fois (art. 290 A CGI)
- **Le statut suit la plateforme** après synchronisation — assertion ajoutée le
  29/08 en réponse au défaut décrit au §4
- Synchronisation réellement exécutée, pas seulement répondue
- Périodicité de TVA propagée ; la franchise devient `vat_exemption` seule
- Téléchargement Factur-X : on lit les octets, pas l'en-tête

`npm run verify` complet : **240 vérifications, 0 échec** — dont 42 sur
Super PDP et 4 sur le refus. Parmi elles, la plus structurante : « le XML
produit par Deviso est jugé conforme » par les validateurs officiels de la
plateforme, et non par nos propres règles.

## 3. Ce qui n'est pas couvert, et pourquoi

- **Le refus abouti d'une facture reçue (`fr:210`)** — partiellement couvert.
  `npm run test:superpdp-refus` éprouve les garde-fous en production : motif
  hors nomenclature rejeté avant tout appel, refus impossible sur une facture
  qu'on a soi-même émise, facture d'un autre espace renvoyée introuvable et non
  divulguée. Le refus **abouti** exige une session sur un compte destinataire ;
  renseigner `E2E_REFUS_EMAIL` / `E2E_REFUS_PASSWORD` dans `.env.local` ferme la
  boucle, y compris dans `npm run verify`.

  Montage écarté au passage : faire qu'une entreprise s'adresse une facture à
  elle-même pour tenir les deux bouts. La plateforme la **rejette** (`fr:213`),
  vérifié sur la facture 375540. Une facture dont l'émetteur est le destinataire
  n'existe pas pour elle.
- **Le tunnel de raccordement** (connect → callback → déconnexion) : redirection
  OAuth, donc un navigateur.
- **L'émission depuis une entreprise réelle** : le bac à sable et la production
  partagent l'hôte d'API ; émettre pour de vrai engage le réseau national.
- **Le rendu des écrans** : les traversées interrogent l'API. Leçon du 29/08 —
  la base peut être juste pendant que l'écran ne montre rien.
- **B2G.** Une facture au secteur public est déclarée `B2B` par la route
  d'émission ; le circuit public passe par Chorus Pro, séparément. Une facture
  publique envoyée par ce chemin serait refusée par la plateforme.
- **E-reporting** (`/ereportings`), mandats, gestion des entrées d'annuaire, et
  les codes `fr:204`–`fr:209`, `fr:211`, `fr:220` : non implémentés.

## 4. Défauts trouvés pendant ce bilan

1. **Statut figé.** `invoices.superpdp_status` était écrit une fois, à
   l'émission, et plus jamais : 42 factures transmises, 42 bloquées à
   `api:uploaded`, quand la plateforme disait `fr:202`. Une facture **refusée**
   se serait affichée « Transmise » en vert. Corrigé, historique rattrapé,
   assertion ajoutée. Aucun test ne l'avait vu : tous regardaient la table
   miroir, jamais le champ porté par la facture.
2. **Adresse déduite du SIREN.** Une facture adressée à un SIREN nu est
   acceptée puis jamais remise, sans aucun signal. `superpdp_adresse_source`
   conserve l'origine, la liste affiche « Transmise — adresse déduite ».
3. **Page muette.** « Aucune facture reçue » s'affichait aussi quand la lecture
   échouait, et la page ne nommait pas le compte affiché.

## 5. Points de vigilance

- `superpdp_connections` : un raccordement mort passe à `error` avec
  `last_error`. Un compte de test l'est actuellement, volontairement.
- **Jeton de rafraîchissement** : rotation OAuth 2.1. Aucun script ne doit
  parler à Super PDP autrement que par les routes de l'application.
- `GET /invoices` accepte `expand[]` — la synchronisation fait aujourd'hui un
  appel de détail par facture. Correct, mais améliorable.
