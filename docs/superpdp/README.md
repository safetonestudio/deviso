# Spécification Super PDP

`openapi.json` est le document OpenAPI complet de l'API Super PDP, récupéré le 29/08/2026
(version `1.30.0.beta`) depuis :

    https://api.superpdp.tech/openapi/superpdp.json

**Pourquoi il est ici.** Toute l'intégration a d'abord été construite en devinant : une route
essayée, un 404, un enum deviné en envoyant une valeur absurde pour lire l'erreur. Ça a produit deux
diagnostics faux le même jour — « l'entreprise est en lecture seule » (la route était
`PATCH /v1.beta/companies`, pas `/companies/me`) et « le régime de TVA n'a que trois valeurs »
(il en a quatre, `vat_exemption` manquait). Lire la spéc coûte une minute et évite les deux.

**À faire avant de toucher à l'intégration** : ouvrir ce fichier, chercher l'opération concernée.
`scripts/` n'a pas d'outil dédié, `node -e` suffit :

```js
const s = JSON.parse(require("fs").readFileSync("docs/superpdp/openapi.json", "utf-8"));
console.log(Object.keys(s.paths));
```

**Rafraîchir** quand leur numéro de version change (visible sur
`https://www.superpdp.tech/openapi`, et dans les notes de version en tête de leur documentation).

## Ce que Deviso utilise, et ce qu'il ignore

Au 29/08/2026, sur 24 opérations disponibles, Deviso en utilise 8. Les principales laissées de côté,
avec ce qu'elles apporteraient :

| Route | Ce qu'elle permet | État côté Deviso |
|---|---|---|
| `GET /french_directory/entries?number=<SIREN>` | Lire les adresses d'annuaire réelles d'un client, utilisables comme adresse de destination | **Ignorée.** On dérive l'adresse du SIREN, ou on la fait saisir à la main (`invoices.client_directory_address`) |
| `GET /french_directory/companies` | Rechercher une entreprise par SIREN, nom ou code postal | Ignorée |
| `GET /oauth2_sessions/me` | Statut réel de vérification (`company_verification_status`, `user_identity_verification_status`) | **Ignorée.** On déduit l'état d'un 403 |
| `PATCH /v1.beta/companies` | Régime de TVA (`monthly`, `quarterly`, `simplified`, `vat_exemption`) et `has_vat_on_debits` | **Ignorée.** Sans lui, les factures B2C sont refusées |
| `POST /invoices?processing_rule=…` | Déclarer la nature (B2B, B2C, B2BInt, B2G…) et laisser Super PDP contredire si son calcul diffère | Ignorée |
| `POST /invoices?external_id=…` | Rattacher la facture Super PDP à son identifiant Deviso | Ignorée |
| `GET /ereportings`, `/ereportings/preview` | Voir ce qui est réellement déclaré à l'administration, avant et après envoi | Ignorée |
| `POST` / `DELETE /directory_entries` | Gérer ses propres adresses de réception | Lecture seule côté Deviso |
| `POST /b2bint_invoices`, `/b2bint_payments` | E-reporting des factures internationales | Ignorée |
| `POST /companies` | Enrôler une entreprise | **Hors de portée** : réservé aux experts-comptables, refusé par défaut |
