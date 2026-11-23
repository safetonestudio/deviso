# Ce que disent les documentations, avant de demander quoi que ce soit à Super PDP

*Recherche du 23/11/2026. Règle : une question n'est posée à Super PDP que si sa
documentation, sa page tarifs, sa spécification et les textes officiels ne la tranchent
pas. Chaque réponse dit où elle a été lue.*

## Ce qui a été lu, en entier

| Source | Version lue |
|---|---|
| Documentation Super PDP, les **20 articles** (`https://api.superpdp.tech/internal/articles/{1..20}/html`, l'article 21 renvoie 404) | lue le 23/11/2026 |
| Page tarifs [superpdp.tech/tarifs](https://www.superpdp.tech/tarifs) et pages Fonctionnalités et Actualités | lue le 23/11/2026, non datée |
| Spécification OpenAPI en ligne `https://api.superpdp.tech/openapi/superpdp.json` | **1.41.0.beta (18/11/2026)**. Le dépôt a la 1.37 : aucune route ajoutée, quatre versions de corrections, voir §4 |
| DGFiP, *Dossier de spécifications externes FE*, dossier général **v3.2** (30/04/2026), et annexes 1, 6 et 7 | [paquet v3.2](https://www.impots.gouv.fr/specifications-externes-b2b) |
| Décret n° 2026-677 du 27/07/2026, article 7 | [Légifrance](https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000054499510), lu en entier par un agent de lecture (le site refuse les téléchargements automatiques) |
| FAQ DGFiP « Je découvre », version du 01/09/2026 | [PDF](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf) |
| Deux modèles de mandat de cabinet : [Hoche et Associés](https://www.hoche.com/pdf/2025/10/Mandat-choix-de-Plateforme-Agreee-2.pdf), [Audacc](https://www.audacc.fr/wp-content/uploads/2026/04/26-04-01-bon-de-commande-mandat-de-delegation-audacc.pdf) | PDF lus en entier |
| jedeclare : [Compta Online, 02/09/2026](https://www.compta-online.com/jedeclare-com-nouveau-service-de-collecte-ao8841) | lu ; les pages ECMA ne renvoient rien sans JavaScript |

Niveaux de preuve : **lu** (écrit dans la source), **déduit** (conséquence directe de ce
qui est écrit, sans y figurer mot pour mot), **introuvable** (cherché aux endroits
ci-dessus, absent).

---

## Les réponses

### 1. Le mandat du cabinet

| Question | Réponse | Source | Preuve |
|---|---|---|---|
| Le client peut-il changer de plateforme de réception sans son cabinet ? | **Oui, légalement.** C'est le client, ou son mandataire, qui signe l'accord formel. Le changement est possible « à tout moment ». La plateforme qu'on quitte ne peut s'y opposer que si elle doute de la volonté du client. | Décret 2026-677, art. 7 (art. 242 nonies E bis et E ter de l'annexe II du CGI) : « daté et signé par l'assujetti […] ou son mandataire » ; FAQ « Je découvre », 2.1 | lu |
| Existe-t-il un modèle officiel de mandat ? | **Pas trouvé.** Il n'y en a ni sur impots.gouv, ni dans les spécifications v3.2. Le décret ne parle que d'un « mandataire », sans citer l'expert-comptable. Chaque cabinet rédige son propre modèle. | Décret 2026-677, art. 7 ; dossier général v3.2, §3.5.5.5 (exemple d'« accord formel », pas de mandat) | introuvable |
| Le client doit-il prévenir son cabinet ? | **Ça dépend du mandat qu'il a signé, la loi ne l'y oblige pas.** Le modèle Audacc le prévoit : « informer préalablement le mandataire de toute démarche ». Il ajoute que, faute de quoi, le cabinet est dégagé de sa responsabilité. Le modèle Hoche ne prévoit rien de tel : le mandat est révocable à tout moment, par lettre recommandée. | Modèles Audacc et Hoche | lu (modèles de cabinets, pas un texte officiel) |
| Le changement d'adresse rompt-il le contrat avec l'ancienne plateforme ? | **Non.** La modification de l'adressage « ne préjuge pas » de la validité ni de la résiliation des contrats. | Décret 2026-677, art. 7 (art. 242 nonies E ter, IV) | lu |

**Effet pour Deviso.** Deviso n'enfreint rien en ouvrant la réception d'un client. Mais
si ce client a signé un mandat du type Audacc, ne pas prévenir son cabinet est **sa**
faute contractuelle, et cela fait sauter la responsabilité du cabinet. Deviso doit donc
le prévenir avant tout transfert, ce qui confirme l'étape 1 du plan de
`strategie-emission-reception.md`.

### 2. jedeclare

| Question | Réponse | Source | Preuve |
|---|---|---|---|
| Super PDP est-elle raccordée à jedeclare ? | **Rien ne l'indique.** Trois plateformes sont dans le pilote (jefacture, Vizup/SG, Mon Business Assistant/BNP). ECMA prévient : « des PA auxquelles nous ne serons pas raccordés ». Super PDP n'en parle nulle part, ni dans sa documentation, ni dans ses notes de version, ni dans ses pages publiques. | Compta Online, 02/09/2026 ; 20 articles Super PDP | lu (pilote) ; introuvable (Super PDP) |
| Comment une plateforme s'y raccorde-t-elle ? | **Pas publié.** L'appel à candidatures visait les cabinets, pas les plateformes. | Compta Online, 02/09/2026 | introuvable |
| Qui recueille le consentement, et les statuts suivent-ils ? | Le cabinet demande la liaison à partir du SIREN, puis « la plateforme agréée sollicite alors le consentement ». La remontée des statuts n'est qu'« envisagée ». | Compta Online, 02/09/2026 | lu |

**`question-jedeclare.md` reste utile :** c'est la seule question que rien de public ne
tranche. Elle est reprise, raccourcie, dans le mail du §5.

### 3. Ce que Super PDP facture

| Question | Réponse | Source | Preuve |
|---|---|---|---|
| La réception est-elle facturée ? | **Oui**, au même prix que l'émission. La grille donne un « prix par facture » et les CGV parlent du « prix à l'usage […] pour l'émission et la réception ». | Page tarifs ; Conditions générales (art. 11 de la documentation), § Responsabilité | lu |
| Prix | API : 0,01 € HT par facture jusqu'à 10 000 par mois, puis 0,005 €, puis 0,0025 €. Vérification KYC/KYB : 2 € HT. Minimum : 10 € HT par an au total. L'offre « Compte » (gratuite jusqu'à 1 000 factures par mois) ne concerne que les entreprises qui utilisent l'interface Super PDP, pas un logiciel branché par l'API. | Page tarifs | lu |
| Deviso paie-t-il pour ses utilisateurs ? | **Oui.** En marque grise, « c'est vous qui payez le service SUPER PDP ». Les comptes rattachés (« Abonnements Indirects ») sont facturés sur la facture du compte principal. | Page tarifs, FAQ ; CGV, § Tarification | lu |
| Les e-reportings sont-ils facturés ? | Pour les données de caisse : « une journée est comptée comme une facture ». Rien n'est dit pour une déclaration d'achat international (`b2bint_invoices`). | Page tarifs, FAQ | lu (caisse) ; introuvable (achats internationaux) |
| Les statuts (`fr:212`, refus, contestation) sont-ils facturés ? | **Non mentionnés.** La grille ne compte que des factures, des vérifications et le minimum. Facturer un statut n'y figure pas, mais rien ne l'exclut par écrit. | Page tarifs ; CGV | introuvable, **à demander** |
| Les lectures et la synchronisation horaire ? | **Non facturées selon la grille**, qui ne prévoit aucun prix à l'appel. Les CGV citent seulement un supplément de stockage au-delà d'une taille maximale, qui n'est pas donnée. | Page tarifs ; CGV, § Hébergement | déduit |
| L'annuaire public (`french_directory`) ? | Appel **sans authentification** (`security: []` dans la spécification), donc rattaché à aucun compte. Il ne peut pas être facturé à un client. | OpenAPI 1.41 | déduit |
| Le mode émission seule coûte-t-il la vérification d'identité ? | La vérification fait partie de l'inscription, quelle que soit l'option de réception (notes de version du 22/04/2026 : « Nouveaux écran d'onboarding, Vérification d'identité »). Rien n'indique qu'elle saute en émission seule. | Notes de version (article 8) | déduit |

### 4. Le mode `superpdp_send_and_receive` et la portabilité

| Question | Réponse | Source | Preuve |
|---|---|---|---|
| Que font les trois modes ? | `any` (par défaut) : l'utilisateur choisit. `send` : « masque la possibilité d'inscrire une adresse de réception ». `receive` : l'oblige à accepter une ligne d'annuaire. | Documentation, « Authentification » | lu |
| Le paramètre est-il documenté ? | **Oui.** L'audit de septembre (`audit.md`) le disait absent de la spécification : il est absent de l'OpenAPI, mais décrit dans l'article « Authentification ». Le commentaire de `lib/superpdp-ligne-annuaire.ts` est donc dépassé sur ce point. | Documentation, « Authentification » | lu |
| Forcer `receive` alors que la plateforme du cabinet tient l'adresse ? | **Pas de transfert silencieux.** Super PDP lance une portabilité. (1) Un e-mail demande au client de « re-confirmer son choix ». (2) S'il confirme, l'ancienne plateforme a 5 jours pour répondre. (3) Puis la ligne est transférée. Pendant ce temps, la ligne est « en erreur ». | Documentation, « Annuaire », § Portabilité | lu |
| Délais légaux | La nouvelle plateforme a 2 jours ouvrables pour notifier l'ancienne, l'ancienne a 5 jours ouvrables pour s'opposer, puis la nouvelle a 15 jours ouvrables pour inscrire l'adresse. L'ancienne maintient ses services pendant un an. | Décret 2026-677, art. 7 | lu |
| `send` fonctionne-t-il en production ? | Rien ne le réserve au bac à sable. **Mais une limite de fond apparaît** : sans ligne de réception chez Super PDP, les statuts du client (refus, encaissement) reviennent par une adresse technique `_replyto`. Super PDP l'ouvre justement « dans le cas où votre plateforme de réception n'est pas la même que la plateforme d'émission ». Le cas est donc prévu. | Documentation, « Annuaire », dernier paragraphe | lu (cas prévu) ; déduit (fonctionnement en production) |
| Le **mandat de réception** | Super PDP gère un mandat par lequel une entreprise confie à un tiers la réception de certaines adresses (« beaucoup plus rare, mais il est géré »). Ce n'est pas le cas du cabinet qui a seulement désigné la plateforme. | Documentation, « Mandat de facturation » | lu |

### 5. Le changement de plateforme dans les textes de 2026

- **Maille.** L'accord formel précise « le périmètre des adresses » concernées. Chaque
  ligne d'annuaire est unique et porte une seule plateforme de réception (dossier
  général v3.2, §3.5.3 : « Une ligne d'annuaire est unique »). Une entreprise peut donc
  partager ses adresses entre plateformes, ligne par ligne (SIREN, SIRET, code de
  routage, suffixe). — *lu*
- **L'ancienne ligne.** Elle n'est pas supprimée : elle est réattribuée au matricule de
  la nouvelle plateforme. L'ancienne plateforme garde un an de services minimaux
  (dossier v3.2, §3.5.5.5 ; décret 2026-677, art. 242 nonies E quater). — *lu*
- **Qui inscrit.** Seule une plateforme « qui a formellement contractualisé » avec
  l'entreprise peut remplacer la ligne par défaut (dossier v3.2, §3.5.5.5, note 83).
  L'accord formel est conservé et numéroté par la nouvelle plateforme (décret). — *lu*

### 6. Les questions déjà ouvertes ailleurs dans le dépôt

**Biens contre services (`chantier.md`, « la seule qui reste ouverte »). Résolue, et c'est
un défaut de Deviso.** L'annexe 6 v3.2 (onglet de correspondance) déduit la catégorie
d'e-reporting du **cadre de facturation**, c'est-à-dire BT-23 : `B1` donne `TLB1`
(biens), `S1` donne `TPS1` (services), `M1` est une facture double. L'annexe 1 précise
pour BT-23 : « Cadre de facturation à renseigner par le vendeur ». Or Deviso écrit **`B1`
en dur** (`lib/invoice-xml.ts:379`), pour toutes ses factures. Voilà pourquoi les
factures de services ressortaient en `TLB1`. Super PDP n'avait rien à nous répondre : le
champ existait, nous le remplissions mal. Les codes corrects existent aussi pour une
facture déjà payée (`B2`, `S2`) et pour une facture définitive après acompte (`B4`,
`S4`). — *lu dans l'annexe ; défaut constaté dans le code ; correctif non fait,
hors du périmètre de cette recherche.*

**Identifiant d'un fournisseur hors UE (`lib/superpdp-achats.ts`, « LE seul verrou
prod »). Résolue par la DGFiP.** Annexe 7 v3.2, règle G2.19 : pour un vendeur hors UE, le
schéma est **`0227`** (« HORS_UE (dont Wallis et Futuna) »), et l'identifiant est le
« code Pays et les 16 premiers caractères de la raison sociale », 18 caractères au plus.
Pour un vendeur de l'UE hors France, c'est `0223` avec son numéro de TVA
intracommunautaire. Deviso envoie aujourd'hui `9999` par défaut (`SCHEMA_GENERIQUE`).
Cette valeur ne figure pas dans la liste admise par la règle G2.19. Tant que ce n'est pas
corrigé, la déclaration risque d'être rejetée en production. — *lu dans l'annexe ;
correctif non fait.*

**Remontée d'un rejet DGFiP pour un achat étranger. Résolue par la spécification.** Une
déclaration porte `ppf_ereporting_id` (lecture seule). Le `ppf_ereporting` correspondant
a des `events`, dont `ppf:ereporting-rejected` et `ppf:ereporting-ack-error` (OpenAPI
1.41, schéma `ppf_ereporting_event`). Deviso lit déjà ces deux codes sur son écran des
e-reportings (`app/api/superpdp/ereportings/route.ts`). Il reste à les rattacher à
l'achat concerné. — *lu.*

**Changement de comportement à vérifier (OpenAPI 1.34, 22/09/2026).** « invoice with
buyer electronic adresse as email are not marked B2C anymore » : une adresse e-mail de
l'acheteur ne suffit plus à classer une facture en B2C, seule la note `BAR` compte
désormais. `chantier.md` décrit encore les deux critères. Sans conséquence : Deviso pose
la note `BAR`/`B2C` sur toute facture à un particulier (`lib/invoice-xml.ts:339`).
— *lu ; vérifié dans le code.*

---

## Ce qui reste vraiment à demander à Super PDP

Trois points, et seulement trois. Le reste est tranché ci-dessus.

> **Objet : Trois questions de facturation et jedeclare.com**
>
> Bonjour,
>
> Nous avons relu votre documentation, votre page tarifs et vos conditions générales.
> Trois points n'y figurent pas :
>
> 1. Les messages de cycle de vie que nous envoyons (Encaissée 212, refus 210, suspension,
>    contestation) sont-ils facturés, et si oui comme une facture ?
> 2. Une déclaration d'e-reporting d'achat international (`POST /b2bint_invoices`) et
>    son paiement (`b2bint_payments`) sont-ils comptés comme une facture chacun ?
> 3. Super PDP est-elle raccordée, ou en cours de raccordement, au service de collecte
>    jedeclare.com d'ECMA ? Si oui, le consentement de l'entreprise passe-t-il par votre
>    interface ou par une API que nous pourrions appeler ?
>
> Merci d'avance,
>
> Selim Albert
> Deviso, getdeviso.fr

Pas besoin de demander : le comportement de la portabilité, le mode `send`, le prix de
la réception, la catégorie biens et services, le schéma d'un fournisseur hors UE, ni la
remontée d'un rejet DGFiP.
