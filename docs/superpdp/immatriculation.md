# Immatriculation de Super PDP — relevé à la source

Ce fichier existe parce que le statut de Super PDP est le socle de `/conformite` et de la moitié
des messages de backlinks, et qu'il avait été **déduit, jamais lu dans le fichier officiel**.

## Ce qui a été relevé le 14/09/2026

La DGFiP publie **deux fichiers** (ODS, XLSX, PDF) sur
<https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees> :

| Intitulé exact DGFiP | Nom de fichier |
|---|---|
| Liste des opérateurs satisfaisant à l'ensemble des conditions, incluant les tests d'interopérabilité | `liste_pa_attente_rapport_audit` |
| Liste des opérateurs ayant déposé un dossier complet et conforme et en attente de leur immatriculation définitive conditionnée à la réussite des tests d'interopérabilité | `liste_pa_attente_test_interop` |

⚠️ **Les noms de fichiers ne disent pas ce que disent les intitulés.** `attente_rapport_audit` est
la liste des opérateurs **immatriculés** — l'attente porte sur le rapport d'audit postérieur, pas sur
l'immatriculation. Ne pas conclure du nom de fichier.

**Super PDP figure dans le premier fichier** (`liste_pa_attente_rapport_audit.pdf`), donc parmi les
opérateurs ayant réussi les tests d'interopérabilité. Ligne relevée verbatim :

```
Nom commercial : SUPER PDP
Voie : 6 rue de la Dhuis
Code postal : 75020
Commune : Paris
Date de délivrance du numéro d'immatriculation : 22/12/25
Site internet : https://www.superpdp.tech/
Courriel de contact : contact@superpdp.tech
```

Il **ne figure pas** dans le second fichier. Le premier fichier comptait 150 opérateurs, le second 14.
Page impots.gouv.fr : publiée le 30/07/2024, dernière modification **10/09/2026**.

## Ce que le fichier ne donne pas

Ni SIREN, ni numéro d'immatriculation en clair : les colonnes publiées sont celles ci-dessus, et
rien de plus. Toute mention d'un numéro d'immatriculation de Super PDP serait donc inventée —
voir règle nº3 de `CLAUDE.md`.

## Comment revérifier

Télécharger le PDF, y chercher `SUPER PDP`, et **vérifier dans lequel des deux fichiers il se
trouve** — c'est le seul point qui change quelque chose. Relever la date de modification de la page.

URL directe du fichier des immatriculés :
`https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/listes_plateformes_agreees/liste_pa_attente_rapport_audit.pdf`

## Ce que `/conformite` en dit, et pourquoi

La page **ne reproduit pas** le statut : un statut recopié se périme sans alarme, et c'est le même
piège que le taux de cotisations de `lib/tarifs-data.ts`. Elle nomme désormais les deux listes avec
**les intitulés exacts de la DGFiP** (corrigé le 14/09/2026 : elle parlait d'« immatriculation sous
réserve », formule d'usage dans la presse spécialisée mais absente de la page officielle — un
lecteur qui suivait le lien pour vérifier ne retrouvait pas les mots annoncés).
