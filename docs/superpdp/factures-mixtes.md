# Factures mixtes (biens + prestations) et Super PDP

*Essai au bac à sable du 24/11/2026. Script : `scripts/e2e/mixte-bac-a-sable.ts`.
Compte utilisé : uniquement le compte de test `superpdp-test@getdeviso.fr` (« Atelier
Lumière », raccordement `sandbox`, statut `verified` vérifié en base avant le premier appel).
Aucun compte réel, aucun compte démo.*

## Pourquoi cet essai

Depuis le 23/11, Deviso refuse de transmettre toute facture dont les lignes mêlent biens et
prestations (`operation_category = mixed`, BT-23 = `M1`). Ce refus reposait sur une seule
phrase de la page « E-reporting » de Super PDP : « Les factures mixtes (appelées aussi
doubles) comportant des ventes de biens et services ne sont pas gérées. » Les textes
permettent pourtant la facture mixte (FAQ DGFiP « Je découvre », v. 01/09/2026, q. 3.4 ;
BT-23 racine `M`, annexe 6 v3.2 : `M1` correspond à la fois à `TLB1` et `TPS1`). Il fallait
savoir par l'expérience où tombe la limite.

## Comment

Le script fabrique le XML avec le code de production (`generateFacturXml`, donc le même
BT-23 que le produit), le passe au validateur public (`/validation_reports`), puis le dépose
par `POST /invoices` sous le compte de test. Le pré-contrôle de Deviso est contourné **dans
ce script seulement** ; le code de production n'a pas été modifié pour l'essai. Aucune
facture n'est écrite dans la base de Deviso.

Facture d'essai, identique dans tous les cas :

| Ligne | Nature | HT | TVA |
|---|---|---|---|
| Tirage d'art 60x90 encadré, 2 × 300 € | biens (`goods`) | 600,00 € | 20 % |
| Prise de vue en studio (demi-journée) | prestation (`services`) | 400,00 € | 20 % |
| **Total** | **mixte → BT-23 `M1`** | **1 000,00 €** | **1 200,00 € TTC** |

Vendeur : Atelier Lumière, adresse `0225:315143296_133025` (bac à sable). Destinataire B2B :
Tricatel, `0225:315143296_57700`, société fictive du bac à sable.

## Résultats

### 1. B2B domestique (flux 1) : ACCEPTÉE et ACHEMINÉE

- Validateur public : `is_valid` vrai, aucune anomalie (EN 16931).
- `POST /invoices?processing_rule=B2B` : **HTTP 200**, facture `2316935`,
  `processing_rule` calculé par Super PDP = `B2B`.
- Cycle de vie, une seconde après le dépôt :

  | Statut | Libellé Super PDP | Heure (UTC) |
  |---|---|---|
  | `api:uploaded` | Téléversée | 07:11:32.77 |
  | `fr:200` | Déposée (validée) | 07:11:33.58 |
  | `fr:201` | Émise par la plateforme | 07:11:33.59 |
  | `fr:203` | Mise à disposition | 07:11:33.95 |
  | `fr:202` | Reçue par la plateforme | 07:11:33.98 |

  `fr:202` et `fr:203` disent que la plateforme du destinataire l'a reçue et l'a mise à sa
  disposition. Même résultat sur un second dépôt (`2316995`).
- **Facture d'acompte (`386`) tirée d'un devis mixte**, BT-23 `M1` : même résultat
  (facture `2317035`, `fr:200` → `fr:203` / `fr:202`).
- Ce que l'essai **ne montre pas** : la transmission des données au PPF (concentrateur de
  l'administration). Le bac à sable n'expose aucun événement `ppf:*` pour ces factures, et
  le statut `fr:200` est posé par la plateforme. D'où la question 1 ci-dessous.

### 2. B2C (vente à un particulier) : REFUSÉE dès le dépôt

`POST /invoices?processing_rule=B2C` : **HTTP 400**, réponse exacte :

> invalid B2C invoice for e-reporting: unhandled business process type: M1 (BT-23). B2C
> invoice cannot contain a mix of goods and services. Choose one or make 2 invoices. Must be
> one of B1,B2,B4,B7,B8,S1,S2,S4,S5,S6,S7,S8.

Le XML était pourtant conforme pour le validateur public. Le refus est celui de leur
extraction d'e-reporting, refus synchrone : rien n'est créé chez eux.

### 3. International (entreprise belge, `B2BInt`) : REFUSÉE dès le dépôt

**HTTP 400**, même message, avec `B2BInt` à la place de `B2C` :

> invalid B2BInt invoice for e-reporting: unhandled business process type: M1 (BT-23).
> B2BInt invoice cannot contain a mix of goods and services. Choose one or make 2 invoices.

La limite de la page « E-reporting » vise donc exactement les deux flux que Super PDP
extrait elle-même pour l'e-reporting (B2C et international), pas la facturation
électronique entre entreprises françaises.

### 4. `fr:212 Encaissée` d'une facture mixte B2B

| Corps envoyé | Réponse | Montant enregistré |
|---|---|---|
| bloc `MEN` = **part services seule** : 480,00 € (400 HT + 80 TVA), 20 %, daté | **200** | 480,00 € |
| **sans détail** (corps minimal, celui qu'utilise le produit quand la date manque) | **200** | **1 200,00 €**, calculé par Super PDP sur toute la facture, **biens compris** |

Super PDP accepte les deux sans rien vérifier : la plateforme ne fait pas le tri. Sans
détail, elle déclare encaissée la totalité, y compris les 720 € de biens.

Or la fiche DGFiP « Données de paiement à transmettre à l'administration » (MAJ août 2026,
publiée sur impots.gouv.fr/e-reporting-donnees-de-paiement, article 290 A du CGI et 242
nonies P de l'annexe II) dit : « E-reporting des données de paiement uniquement sur les
opérations dont la TVA est exigible à l'encaissement (par exemple les prestations de
services) ». Pour les biens, la TVA est exigible à la livraison (art. 269-2-a CGI) : leur
encaissement n'a pas à être déclaré. Super PDP le dit aussi dans sa propre documentation,
section E-reporting : « Pour les factures qui ne nécessitent pas d'e-reporting de paiement
(vente de marchandise), le message de cycle de vie "Encaissée (212)" n'aura aucun effet. »
(citée dans `app/api/superpdp/invoices/[id]/emettre/route.ts`).

**Conséquence pour Deviso** : sur une facture mixte, le `fr:212` doit porter le bloc `MEN`
des seules lignes de prestations, et toujours un bloc explicite (jamais le corps minimal,
qui ferait déclarer les biens).

## Verdict

| Cas | Super PDP | Ce que Deviso doit faire |
|---|---|---|
| B2B domestique, facture `M1` | acceptée, acheminée | **transmettre** |
| acompte `386` d'un devis mixte, B2B | accepté, acheminé | **transmettre** |
| B2C, facture `M1` | refus 400 au dépôt | refuser avant l'envoi, conseiller deux factures |
| international, facture `M1` | refus 400 au dépôt | refuser avant l'envoi, conseiller deux factures |
| `fr:212` d'une facture `M1` | accepte n'importe quel montant | déclarer la part services seule |

Même en B2B, deux factures séparées restent le conseil le plus simple (recommandation AFNOR
XP Z12-014, cas d'usage 31 : facture mixte). Deviso le dira sans l'imposer.

---

## Ce que leur documentation tranche déjà (relue le 24/11/2026)

Avant d'écrire, les 20 articles de leur documentation (`api.superpdp.tech/internal/articles/{1..20}/html`)
ont été relus. Deux des trois questions prévues y trouvent leur réponse :

- **B2B transmis au PPF et acheminé** : article 15 « E-reporting », section « E-reporting des
  factures B2B » : en envoyant une facture B2B, ils l'acheminent au destinataire ET en
  envoient une copie à l'administration par le flux 1, « vous n'avez rien à faire de plus ».
  Joint à l'essai (M1 B2B accepté, `fr:202` / `fr:203`), la question ne se pose plus.
- **Portée de la phrase « factures mixtes non gérées »** : elle se trouve dans la section
  « E-reporting des factures B2C » de ce même article, et leur message de refus ne vise que
  `B2C` et `B2BInt`. Question close.
- **Montant partiel au `fr:212`** : notes de version du 26/01/2026 (article 8), « Possibilité
  d'envoyer le montant partiel encaissé pour le statut 212 » ; et article 15 : pour une vente
  de marchandise, le `212` « n'aura aucun effet ». Reste ouvert un seul point : sur une
  facture MIXTE, un bloc `MEN` limité aux prestations est-il traité comme la totalité de
  l'encaissement à déclarer, ou comme un paiement partiel qui laisserait la facture « non
  soldée » côté administration ? C'est l'objet du courrier ci-dessous.

## Courrier à Super PDP (envoyé par Selim, réponse reçue)

*De : safetonestudio@proton.me. Signature au nom légal (le SIREN et le raccordement à la
plateforme agréée sont au nom de Berrabah, CLAUDE.md, Règle nº3).*

**Objet : Statut 212 sur une facture mixte biens + services (BT-23 M1)**

Bonjour,

Deviso transmet par votre API les factures de ses utilisateurs. Certaines comportent à la
fois des lignes de biens et des lignes de prestations de services (cadre de facturation
BT-23 = M1). Nous avons vérifié dans votre bac à sable le 24/11/2026 qu'en B2B domestique une
telle facture est acceptée et acheminée (factures 2316935, 2316995, 2317035), et que vous la
refusez en B2C et en B2BInt, ce qui correspond à votre page E-reporting.

Notre question porte sur le statut 212 « Encaissée » de ces factures. La TVA n'est exigible à
l'encaissement que sur la partie services (fiche DGFiP « Données de paiement à transmettre à
l'administration », août 2026). Nous prévoyons donc d'envoyer un bloc MEN ne portant que la
part services, par taux de TVA. Dans notre essai, une facture de 1 200 € TTC dont 480 € de
services : le bloc de 480 € est accepté ; sans détail, votre API enregistre 1 200 €.

Est-ce bien ainsi que vous attendez le 212 d'une facture M1 ? Et ce montant, inférieur au
total de la facture, est-il transmis à l'administration comme l'encaissement complet de la
part services, et non comme un paiement partiel qui laisserait la facture en attente d'un
solde ?

Merci d'avance,

Selim Berrabah
Deviso, getdeviso.fr
safetonestudio@proton.me

## Réponse de Super PDP (ticket 9381527, lue le 26/11/2026)

Gwendal Fernet, SUPER PDP, depuis support@superpdp.tech :

> Il n'y a pas de différence entre statut payé complètement ou partiellement.
> L'administration veut uniquement le statut encaissée. C'est donc bien l'encaissement
> des 480€ qui est à déclarer.

Question close : sur une facture mixte, le `fr:212` porte la part prestations seule.

Vérifié en plus au bac à sable le 26/11/2026 (facture `2378566`) : un bloc `MEN` de la part
services **sans date** est accepté (200). La règle BR-FR-CDV-14 n'exige que le montant et le
taux (`docs/superpdp/audit-2026-09-02.md`).

## Correction faite le 26/11/2026 (branche `claude/factures-mixtes-superpdp-ab8720`, non poussée)

| Où | Avant | Après |
|---|---|---|
| `lib/superpdp-precontrole.ts` | toute facture mixte bloquée | bloquée seulement pour un particulier ou un client à l'étranger, avec « une facture par nature » |
| `lib/facturx-helpers.ts` (panneau de conformité) | alerte rouge bloquante | rouge pour particulier / étranger ; entre entreprises, simple conseil de faire deux factures |
| `lib/encaissement-men.ts` (nouveau) + `lib/superpdp-encaissement.ts` | `fr:212` sur toute la facture (ou corps minimal, que Super PDP calcule sur toute la facture) | facture mixte : blocs `MEN` des seules lignes de prestations, toujours envoyés, datés quand la date est connue |
| `app/(dashboard)/invoices/new/page.tsx` | « la plateforme ne traite pas encore les factures mixtes » | message selon le client : refus expliqué (particulier, étranger) ou « elle sera transmise » |

Garde : `npm run test:factures-mixtes` (18 contrôles, dans `verify`), contre-épreuve faite
pour chacun des cinq fichiers. `test:superpdp` et `test:emission-concurrente` testent
désormais le refus d'une mixte **à un particulier** (et non plus entre entreprises).

Traversé le 26/11/2026 par les vraies routes du serveur local, au bac à sable, compte de
test seul (`npm run test:mixte-traversee`, hors `verify` car il dépose de vraies factures) :
facture mixte Tricatel créée (catégorie déduite `mixed`) → `/emettre` 200 → `fr:200` →
« Marquer comme payée » au 23/11 → relu chez Super PDP : `fr:212` avec **un bloc MEN de
480,00 €** daté du 23/11 ; facture mixte à un particulier refusée 400 avant l'envoi.
Contre-épreuve : avec l'ancien `lib/superpdp-encaissement.ts`, le même chemin déclare
**1 200,00 €** et le test échoue. `test:date-encaissement` (factures de prestations) reste
13/13.

`fr:203` (« Mise à disposition ») a été vu sur les deux premières factures mixtes du jour,
mais le bac à sable l'a ensuite fait attendre plus de quinze minutes, **y compris pour une
facture de prestations ordinaire** émise au même moment (`1afec3c4…`) : lenteur du bac à
sable, sans lien avec la nature de la facture. Le contrôle `fr:203` de la traversée peut
donc échouer par lenteur ; les autres non.

Non vu : le rendu de l'écran nouvelle facture (le texte est contrôlé, pas l'affichage).
