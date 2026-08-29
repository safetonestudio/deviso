# Audit de l'intégration Super PDP

**29/08/2026 — établi contre `openapi.json` v1.30.0.beta, à côté de ce fichier.**

Relevé demandé avant d'écrire la moindre ligne, après deux diagnostics faux le même jour. Les deux
avaient la même cause : l'intégration a été construite en interrogeant l'API à l'aveugle — une route
devinée, un 404, un enum deviné en envoyant une valeur absurde pour lire le message d'erreur. La
spécification complète existait depuis le début.

Chaque ligne ci-dessous est vérifiée : côté Deviso par relevé des appels dans le code, côté Super PDP
par lecture de la spécification. Rien n'est déduit.

---

## 1. Ce que Deviso appelle aujourd'hui

Huit opérations, plus les trois routes OAuth.

| Appel | Où | Remarque |
|---|---|---|
| `POST /oauth2/token` | `lib/superpdp.ts` | `authorization_code` et `refresh_token` |
| `POST /oauth2/revoke` | `lib/superpdp.ts` | au débranchement |
| `GET /oauth2/authorize` | `api/superpdp/connect` | voir §4, deux paramètres douteux |
| `GET /companies/me` | `api/superpdp/callback` | on garde `id`, `number`, `number_scheme` |
| `GET /directory_entries` | callback + `superpdp-sync.ts` | lecture seule |
| `POST /invoices` | `api/superpdp/invoices/[id]/emettre` | multipart CII |
| `GET /invoices` | `superpdp-sync.ts` | curseur `starting_after_id` |
| `GET /invoices/{id}` | `superpdp-sync.ts`, `download` | dont `?format=factur-x` |
| `GET /invoice_events` | `superpdp-sync.ts` | second curseur |
| `POST /invoice_events` | `superpdp-encaissement.ts`, `refuser` | `fr:212` et `fr:210` seulement |

---

## 2. Les trois contournements

Ce sont les seuls endroits où le code actuel *ment sur ce qu'il sait faire* : il demande à
l'utilisateur, ou devine, une donnée que l'API fournit.

### 2.1 L'adresse d'annuaire du client, saisie à la main

**Aujourd'hui.** `lib/facturx-helpers.ts` → `electronicAddress()` fabrique l'adresse du destinataire
en collant `0225:` devant le SIREN. Quand ça ne suffit pas — client à plusieurs établissements,
adresse composée `SIREN_SIRET` ou `SIREN_SUFFIXE` — j'ai ajouté aujourd'hui le champ
`invoices.client_directory_address`, que l'utilisateur remplit lui-même.

**Ce que l'API offre.** `GET /french_directory/entries?number=<SIREN>` — *« List all the directory
entries of an entity whose identifiers can be used as a recipient address for an invoice. »* La
liste des adresses réelles, prêtes à l'emploi. Et `GET /french_directory/companies` cherche une
entreprise par SIREN, nom ou code postal.

**Pourquoi c'est grave.** On fait porter à un freelance une donnée technique qu'il n'a aucun moyen de
connaître : elle est chez son client, ou dans l'annuaire. Fabriquer une adresse plutôt que la lire,
c'est aussi supposer que tout client n'a qu'une adresse — l'hypothèse qui a fait échouer nos propres
émissions pendant deux semaines.

**Coût.** Un appel au moment de l'émission, avec repli sur le SIREN nu si l'annuaire ne connaît pas
le client. Le champ manuel devient une surcharge facultative, plus le mode normal. Une demi-journée.

### 2.2 L'état du raccordement, deviné à partir d'un 403

**Aujourd'hui.** `superpdpFetch()` intercepte tout 403 et en conclut `session_status = "pending"`.
C'est une inférence : n'importe quel autre motif de refus est lu comme « vérification en cours ».

**Ce que l'API offre.** `GET /oauth2_sessions/me` renvoie `company_verification_status`
(`verified` / `needs_review` / `failed`) et `user_identity_verification_status` (idem, plus
`not_verified`).

**Pourquoi c'est grave.** `failed` et `needs_review` sont deux situations opposées — l'une demande
d'attendre, l'autre de recommencer — et nous les confondons dans un message unique « Super PDP
vérifie encore votre rattachement ». Un utilisateur en échec attendra indéfiniment.

**Coût.** Un appel au callback et à chaque synchronisation, deux états de plus dans l'interface.
Quelques heures.

### 2.3 Le régime de TVA, jamais transmis

**Aujourd'hui.** Rien. Le champ reste vide chez Super PDP, et **toute facture B2C est refusée** —
c'est le blocage rencontré aujourd'hui, résolu à la main sur le compte de test.

**Ce que l'API offre.** `PATCH /v1.beta/companies` avec `vat_regime` ∈ `monthly`, `quarterly`,
`simplified`, `vat_exemption`, et `has_vat_on_debits`.

**Ce que Deviso sait déjà.** Le profil porte `tva_regime` ∈ `franchise`, `normal`, `intermediaire`.
Attention, ce n'est **pas** la même notion : Deviso décrit le *taux appliqué*, Super PDP la
*périodicité de déclaration*. Mais la correspondance existe pour un cas, et c'est le plus fréquent :

| profil Deviso | `vat_regime` | déductible ? |
|---|---|---|
| `franchise` | `vat_exemption` | **oui**, directement |
| `normal` / `intermediaire` | `monthly`, `quarterly` ou `simplified` | non — à demander |

Les micro-entrepreneurs en franchise, c'est-à-dire le cœur de la cible, n'ont donc **rien** à
saisir. Seuls les assujettis doivent répondre à une question, et une seule.

**Coût.** Un champ conditionnel au profil, un appel au raccordement et à chaque modification.
Quelques heures. Sans lui, aucun client ne pourra facturer un particulier.

---

## 3. Les dix-sept opérations jamais appelées

| Opération | Ce qu'elle apporterait | Verdict |
|---|---|---|
| `GET /french_directory/entries` | adresse d'annuaire réelle d'un client | **§2.1 — à faire** |
| `GET /french_directory/companies` | recherche d'entreprise par SIREN / nom / CP | à faire, alimente la fiche client |
| `GET /oauth2_sessions/me` | statut de vérification explicite | **§2.2 — à faire** |
| `PATCH /companies` | régime de TVA | **§2.3 — à faire** |
| `POST /invoices?processing_rule=` | déclarer B2B / B2C / B2BInt / B2G ; Super PDP **conteste** si son calcul diffère du nôtre | à faire — un filet gratuit sur notre détection B2C, aujourd'hui purement heuristique (note BAR + adresse EM) |
| `POST /invoices?external_id=` | rattacher leur facture à l'identifiant Deviso | à faire — une ligne, simplifie la réconciliation |
| `POST /invoices?disable_pre_check=` | désactiver le pré-contrôle synchrone | non — le pré-contrôle nous rend service |
| `POST /invoice_events` codes `fr:204`→`fr:209`, `fr:211`, `fr:220` | huit statuts de cycle de vie de plus (Deviso n'émet que `fr:210` et `fr:212`) | à cadrer — vérifier lesquels sont obligatoires côté DGFiP |
| `GET /ereportings` | ce qui a réellement été déclaré à l'administration | à faire — c'est la preuve de conformité, aujourd'hui invisible |
| `GET /ereportings/preview` | ce qui **va** partir, avant envoi | à faire — permet de corriger avant déclaration |
| `GET /ereportings/{id}` | détail d'une déclaration | avec les deux précédentes |
| `POST` / `DELETE /directory_entries` | gérer ses propres adresses de réception | à cadrer — utile si un client veut plusieurs adresses |
| `POST /b2bint_invoices` + `/b2bint_payments` | e-reporting des factures **internationales** | **à cadrer sérieusement** : un freelance qui facture hors de France y est soumis, et Deviso ne fait rien |
| `POST /b2c_transactions` + `/b2c_payments` | e-reporting sans facture (caisse enregistreuse) | non — hors cible |
| `POST /company_mandates` + gestion | mandat de facturation (auto-facturation) | non pour l'instant — suppose d'émettre au nom d'un tiers |
| `POST /invoices/convert` | conversion entre CII, UBL, EN16931, Factur-X | non — on génère déjà du CII |
| `GET /invoices/generate_test_invoice?b2c=` | facture de test, avec variante B2C | déjà utilisée hors application, pour les tests |
| `POST /validation_reports` | validation structurelle avant envoi | à cadrer — pourrait valider avant émission plutôt qu'après refus |
| `POST /companies` | enrôler une entreprise | **fermé** : réservé aux experts-comptables |

---

## 4. Deux paramètres envoyés sans preuve qu'ils existent

`app/api/superpdp/connect/route.ts` ajoute à l'URL d'autorisation :

- `superpdp_send_and_receive=receive`, **inconditionnellement**, avec ce commentaire : *« Le point
  décisif pour nous. Sans ce paramètre l'interface laisse le choix d'ouvrir ou non une ligne
  d'annuaire […] Un utilisateur qui passe outre croirait être raccordé tout en restant incapable de
  recevoir. »*
- `superpdp_directory_entry_identifier`, derrière `SUPERPDP_PREFILL_COMPANY`.

**Aucun des deux ne figure dans la spécification.** Elle documente exactement trois paramètres de
pré-remplissage : `login_hint`, `superpdp_company_number`, `superpdp_company_number_scheme` — les
trois que nous envoyons par ailleurs, et qui eux sont légitimes.

Ils sont peut-être acceptés sans être documentés. Mais s'ils sont ignorés, la protection décrite
dans ce commentaire n'existe pas : un utilisateur peut se raccorder sans ligne d'annuaire, se croire
en règle, et être hors de l'obligation du 1ᵉʳ septembre 2026 sans que rien ne le signale. **À faire
confirmer par Super PDP avant toute autre chose** — c'est une question, pas du code.

---

## 5. Ordre proposé

1. **Poser la question à Super PDP** sur les deux paramètres du §4. Gratuit, et ça peut invalider une
   garantie qu'on croit avoir.
2. **§2.3 régime de TVA** — sans lui, aucun client ne facture un particulier. Le plus court.
3. **§2.1 recherche annuaire** — supprime une saisie que l'utilisateur ne peut pas honorer.
4. **§2.2 statut de session** — corrige un message trompeur.
5. `processing_rule` et `external_id` — deux paramètres, un filet et une réconciliation.
6. **Cadrer l'e-reporting** (`/ereportings` + preview) et **le B2BInt**. Ce sont des sujets de
   conformité à part entière, pas des correctifs.
