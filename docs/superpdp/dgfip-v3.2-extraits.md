# Extraits normatifs — spécifications externes DGFiP v3.2

Source : `specifications-externes-v3.2.zip`, publié par la DGFiP / AIFE le
30/04/2026 sur impots.gouv.fr. Lu le 07/09/2026.

Ce fichier existe parce que ces tables ont été, pendant des semaines,
**supposées**. Deux libellés de motif de refus écrits de mémoire se sont
révélés faux, et un statut a été traduit à l'envers. Chaque fois, le code
compilait, les tests passaient, et l'erreur n'était visible que pour
l'utilisateur — sous la forme d'une facture annulée pour la mauvaise raison.
Ce qui suit est recopié du document, pas reformulé.

Le paquet lui-même n'est pas versionné ici : 6,7 Mo de binaire, dont l'essentiel
(XSD, Swagger) est déjà couvert par `openapi.json`. Il se retélécharge à
`impots.gouv.fr` → « spécifications externes B2B ».

Contenu du paquet, pour mémoire :

- `0- Dossier de spécifications externes FE - Dossier général_v3.2.pdf` — le
  document général, d'où viennent le tableau 8 et la règle de l'avoir interne ;
- `2- Annexes_v3.2/…Annexe 2 - Format sémantique FE CDV - Flux 6 - V2.3.xlsx` —
  le format du cycle de vie, onglets « Statuts » et « CDV FE - CI ARM » ;
- `2- Annexes_v3.2/…Annexe 7 - Règles de gestion - V1.9.xlsx` — onglet
  « Tableau des motifs de refus », la nomenclature MDT-113 ;
- annexes 1 (e-invoicing), 3 (annuaire), 6 (e-reporting), les XSD et le Swagger
  annuaire.

---

## Tableau 8 — Les statuts d'une facture

> Les statuts possibles (**liste non exhaustive**, voir norme AFNOR XP Z12-012)

| Code | Libellé | Caractère | Définition |
| --- | --- | --- | --- |
| 200 | Déposée | **Obligatoire** | La facture du fournisseur est transmise à la plateforme agréée d'émission, qui atteste que la facture est contrôlée et conforme. |
| 201 | Émise par la plateforme | Facultatif | La PAE informe avoir transmis la facture à la plateforme agréée de réception (PAR) du destinataire. |
| 202 | Reçue par la plateforme | Facultatif | La PAR informe avoir reçu la facture de la part de la PAE. |
| 203 | Mise à disposition | Facultatif | La PAR informe avoir mis à disposition la facture à son destinataire. |
| 204 | Prise en charge | Facultatif | Le destinataire accuse réception de la facture. |
| 205 | Approuvée | Facultatif | Le destinataire accepte la facture dans son intégralité. |
| 206 | Approuvée partiellement | Facultatif | Le destinataire accepte partiellement la facture. |
| 207 | En litige | Facultatif | Le destinataire est en désaccord avec tout ou partie de la facture. |
| 208 | Suspendue | Facultatif | Le destinataire souhaite obtenir des pièces justificatives complémentaires et suspend le traitement de la facture. |
| 209 | Complétée | Facultatif | Le fournisseur fournit des pièces justificatives complémentaires attendues par le destinataire. |
| 210 | Refusée | **Obligatoire** | Le destinataire refuse la facture dans son intégralité. |
| 211 | Paiement transmis | Facultatif | Le destinataire informe avoir réalisé le paiement de la facture, ou le fournisseur informe avoir réalisé le remboursement. |
| 212 | Encaissée | **Obligatoire** | Au titre du 290 A du CGI, le fournisseur informe avoir perçu un paiement partiel ou total de la facture. |
| 213 | Rejetée | **Obligatoire** | Au vu des contrôles fonctionnels réalisés, la plateforme d'émission ou de réception a détecté une anomalie sur la facture. |

**La table s'arrête à 213.** Les codes 214 à 228 n'apparaissent nulle part dans
le paquet DGFiP ; le document renvoie explicitement à la norme AFNOR XP
Z12-012, payante, pour la liste complète. Aucune traduction de ces codes n'est
donc défendable, et `libelleStatut` affiche un code inconnu tel quel plutôt que
sous un libellé inventé.

L'onglet « Statuts » de l'annexe 2 confirme le caractère obligatoire : pour
l'objet facture (flux 2), il ne liste que **200, 210, 212, 213**.

### La règle de l'avoir interne (p. 60, sous le tableau 8)

> Dans les cas des statuts « Refusée » ou « Rejetée », le fournisseur doit
> procéder à une annulation comptable (avoir interne). Cette opération ne doit
> pas générer de flux de données réglementaires (F1) au PPF.

Implémentée dans `lib/superpdp-avoir.ts`, appliquée par la route d'émission,
éprouvée par `scripts/e2e/avoir-interne.mjs`.

### Autres statuts obligatoires (tableaux 9 et 10)

| Objet | Code | Libellé |
| --- | --- | --- |
| Données réglementaires (F1) | 250 | Déposée |
| Données réglementaires (F1) | 251 | Rejetée |
| Statuts obligatoires (F6) | 601 | Rejeté |

### Motifs de rejet techniques (tableaux 11 et 12)

Données réglementaires : `REJ_SEMAN` (format sémantique), `REJ_UNI` (déjà
transmises), `REJ_COH` (cohérence).

Statuts obligatoires : `REJ_INC` (cohérence des statuts), `REJ_INEX`
(conformité des statuts autorisés), `REJ_RG` (règles de gestion), `REJ_HAB`
(droits et habilitations), `REJ_ENCAISSEMENT` (**encaissements conformes à la
répartition par taux de TVA déclarée** — c'est le contrôle que le bloc MDG-43 /
MDT-207 « MEN » sert à satisfaire, voir `lib/superpdp-encaissement.ts`).

---

## MDT-113 — Code motif rejet (annexe 2, onglet « CDV FE - CI ARM »)

Cardinalité 0..1, longueur 50, règles de gestion G7.08 / G7.18 / G7.19 / G7.39.
Définition : « En cas d'irrecevabilité / rejet / refus : Code motif ».

L'attribut `MDT-113-1` (Nom liste) sert à « nommer la liste des codes privés de
rejet ». **Il n'existe donc pas de code list normative fermée pour MDT-113** :
la liste ci-dessous est la nomenclature de référence publiée par la DGFiP, et
c'est la plateforme qui décide lesquels de ces codes elle accepte pour un
statut donné. Pour le statut 210, Super PDP en accepte treize — voir
`lib/superpdp-motifs.ts`.

## Tableau des motifs de refus (annexe 7)

Recopié tel quel, coquilles du document comprises.

| Code | Libellé | Description |
| --- | --- | --- |
| AUT_MOTIF_ERR_VALIDEUR | Autre motif que "Erreur de valideur" | Sous-traitance/co-traitance : le titulaire/mandataire refuse pour un autre motif qu'une erreur de transmission au mauvais valideur |
| CONTACT_ACHTR | Autres : contacter votre acheteur | |
| COORD_BANC_ERR | Erreur de coordonnées bancaires | |
| CREANCIER_ERR | Créancier inconnu ou différent de celui du marché/commande | |
| DEST_ERR | Erreur de destinataire | |
| DOUBLE_FACT | Données réglementaire F1 en doublon | Données réglementaires F1 en doublon (même numéro, même vendeur et même année de date de facture) |
| CMD_EJ_ERR | N° de COMMANDE/Engagement Incorrect ou manquant | N° de commande erroné, inexistant ou déjà facturé. Ne peut être utilisé avec un statut REFUSÉE que si le numéro de commande a été fourni par l'ACHETEUR AVANT LA FACTURATION. |
| ERR_VALIDEUR | Mauvais valideur | Sous-traitance/co-traitance : le titulaire/mandataire refuse s'il n'est pas le bon valideur |
| FACT_NON_CONFORME | Facture non conforme à la commande | |
| JUSTIF_ABS | Justificatif absent ou insuffisant | À utiliser s'il manque des pièces jointes. La facture passe automatiquement au statut « SUSPENDU » ; l'émetteur doit renvoyer un cycle de vie « COMPLETEE » avec les pièces manquantes |
| LIVR_INCOMP | Livraison incomplète / non effectuée | |
| MARCHE_TERM | Marché terminé | |
| MONTANT_ERR | Montant de la facture erroné | |
| SE_ERR | Service destinataire incorrect | |
| ST_CT_NON_DECLAR | Sous-traitant / cotraitant non déclaré | Refus si le déposant n'est pas connu du marché |
| SUPPR_COMP_AVOIR | Suppression pour compensation d'avoirs | |
| TRANSF_PMNT_REGIE | Transfert pour paiement en régie (réservé B2G) | |
| TX_TVA_ERR | Taux de TVA erroné | |
| ANNUL_ENC | Encaissement non réalisé ou annulation d'encaissement | |
| AUTRE | Autre | |
| ROUTAGE_ERR | Erreur de routage | À utiliser quand les informations de routage sont obsolètes (décalage de mise à jour d'annuaire, erreur de la PDP émettrice). Après correction de l'annuaire, la facture peut être retransmise sans aucun changement de données |
| CALCUL_ERR | Erreur de calcul de la facture | Détectée au schematron ou après (lignes, arrondi non accepté) |
| NON_CONFORME | Mention légale manquante | Toute mention légale non contrôlée |
| DEST_INC | Destinataire inconnu | À l'émission, le destinataire n'existe pas dans l'annuaire |
| TRANSAC_INC | Transaction inconnue | La facture ne correspond pas à une livraison effectuée ou une prestation de service livrée |
| EMMET_INC | Emetteur inconnu | L'émetteur de la facture est inconnu du destinataire (anti-spam) |
| CONTRAT_TERM | Contrat terminé | Contrat terminé, plus de facture possible |
| ADR_ERR | L'adresse de facturation électronique erronée | L'adresse de facturation électronique du destinataire (BT-49 ou BT-34) est absente ou erronée |
| SIRET_ERR | SIRET erroné ou absent | Le SIRET du destinataire est erroné ou absent si exigé |
| CODE_ROUTAGE_ERR | CODE_ROUTAGE absent ou erroné | Le code routage du destinataire est erroné ou absent si exigé |
| REF_CT_ABSENT | Référence contractuelle nécessaire pour le traitement de la facture manquante | Référence exigée contractuellement absente, à identifier dans le CDV : BT-12 (n° de contrat), BT-16 (n° de BL), BT-10 (réf. acheteur), BT-18 (objet facturé), BT-11 (réf. projet), BG-3 (facture antérieure) |
| REF_ERR | Référence incorrecte | À préciser dans les autres données du CDV. À utiliser en dehors des motifs fournis |
| PU_ERR | Prix unitaires incorrects | Un prix unitaire n'est pas celui attendu |
| REM_ERR | Remise erronée | Une remise est absente ou n'est pas celle attendue |
| QTE_ERR | Quantité facturée incorrecte | Une quantité facturée n'est pas celle attendue |
| ART_ERR | Article facturé incorrect | Un article facturé n'est pas le bon ou est erroné |
| MODPAI_ERR | Modalités de paiement incorrectes | Les modalités de paiement (date d'échéance par exemple) ne sont pas celles escomptées |
| QUALITE_ERR | Qualité d'article livré incorrecte | Un des articles livrés est défectueux |
| DOUBLON | Facture en doublon (déjà émise / reçue) | Même numéro, même vendeur et même année de date de facture |
| MONTANTTOTAL_ERR | Montant total erroné | Un des montants totaux de la facture est erroné, par exemple le net à payer |

Deux pièges que cette table lève, et que Deviso avait tous les deux :

- **`DOUBLE_FACT` n'est pas « double facturation ».** C'est le doublon des
  *données réglementaires F1*. Pour une facture reçue deux fois, le motif est
  `DOUBLON`. Deviso affichait « Double facturation », c'est-à-dire le seul
  libellé qu'aurait choisi un utilisateur facturé deux fois ;
- **`CMD_ERR` n'est pas « facture non conforme à la commande »** — ce libellé
  appartient à `FACT_NON_CONFORME`. C'est un problème de numéro de commande, et
  il ne justifie un refus que si l'acheteur a fourni ce numéro avant la
  facturation.

## Autres données du CDV utiles et non exploitées

| ID | Nom | Notes |
| --- | --- | --- |
| MDT-114 | Libellé motif rejet | 0..n, 250 caractères — le texte libre qui accompagne le code |
| MDT-121 | Code action attendue | « Ce code permet d'indiquer l'action attendue (de type demande d'avoir ou facture rectificative…) » |
| MDT-123 | Données invalides | Désigne le champ fautif |

Rien de tout cela n'est lu par Deviso aujourd'hui : sur une facture refusée, on
affiche le motif, pas l'action attendue. À rouvrir si les refus deviennent
fréquents.
