# Plan d'articles, décembre 2026 à mai 2027

Suite du plan éditorial (`02-plan-editorial.md`), écrite le 20/11/2026 après la
réorganisation du blog en sept familles par sujet (`lib/blog/categories.ts`).
Deux objectifs : nourrir la prospection auprès des **experts-comptables**, et
faire venir du **trafic naturel**.

## 1. Le constat, chiffré

Vercel Analytics, 21/10 au 20/11/2026 (le plan gratuit ne garde que 31 jours) :

| Mesure | Valeur |
|---|---|
| Visiteurs, tout le site | 58 |
| Venus d'un moteur de recherche | 3 (DuckDuckGo 2, Google 1) |
| Visites sur les 45 articles du blog | une vingtaine |

Google Search Console (branchée, domaine `getdeviso.fr`, sitemap soumis le
12/09/2026, lu le 18/11), du 11/09 au 17/11/2026 :

| Mesure | Valeur |
|---|---|
| Pages indexées | 61 |
| Découvertes, non encore indexées | 13 (plus 1 noindex, 1 redirection) |
| Impressions | 1 100 |
| Clics | 5 |
| Position moyenne | 39,9 (quatrième page de résultats) |

Pages qui ont déjà des impressions : `/freelance-graphiste` (247),
`/freelance-community-manager` (129), `/blog/biens-ou-services-micro-entrepreneur`
(85), `/blog/devis-redacteur-web` (83), `/blog/note-honoraires-ou-facture` (73).
Requêtes en tête : « devis graphiste » (124), « devis rédacteur web » (65),
« devis infographie » (55), « facturation community manager » (51), « combien
facturer en freelance » (35).

**Conclusion : Google connaît et indexe le site, mais le classe trop bas pour
être cliqué.** Le frein n'est ni l'indexation ni le nombre d'articles, c'est la
position : en quatrième page, une page n'est presque jamais vue. Il faut faire
monter les pages qui ont déjà des impressions (liens entrants, titres alignés
sur les requêtes réelles) avant de multiplier les nouvelles.

## 2. Avant d'écrire : trois actions qui conditionnent tout le reste

1. **Faire monter ce qui a déjà des impressions.** Pour les cinq pages
   ci-dessus, aligner titre, H1 et premier paragraphe sur la requête qui les
   fait apparaître (par exemple « devis graphiste » et « devis infographie »
   pour `/freelance-graphiste`), et leur donner des liens internes depuis les
   articles proches. Mesurer la position dans la Search Console 30 jours après.
2. **Liens entrants.** Envoyer les messages préparés dans
   `05-envois-backlinks.md` (annuaires d'outils, associations d'indépendants,
   CCI, forums). Un domaine neuf sans liens n'est pas classé, même avec de bons
   contenus.
3. **Maillage interne.** Chaque nouvel article pointe vers deux articles de sa
   famille et vers une page produit (accueil, page métier ou
   `/experts-comptables`). Les articles « comptables » sont aussi listés sur
   `/experts-comptables` (bloc « Guides pour les cabinets », à créer avec le
   deuxième article de la famille).

## 3. Les articles

Chaque article suit le gabarit `ArticleLong` (sections, FAQ, sources
officielles, encadré Deviso) et `04-publier-un-article.md`. Les chiffres sont
vérifiés à la source **au moment de l'écriture**, pas recopiés de ce plan.

### 3.1 Experts-comptables (famille `comptables`)

Faible volume de recherche, mais forte valeur : chaque article sert aussi
d'argument dans les échanges avec le cabinet pilote.

| # | Titre de travail | Ce que le cabinet y trouve |
|---|---|---|
| C1 | Réforme 2026 : la check-list du cabinet pour ses clients TPE et micro | qui doit recevoir, qui émet en 2027, quoi vérifier dossier par dossier |
| C2 | Quelle plateforme agréée recommander à ses clients | critères de choix pour un portefeuille, au-delà de la liste officielle |
| C3 | Vérifier qu'un client est joignable dans l'annuaire | SIREN, raccordement, cas qui font rejeter les factures |
| C4 | E-reporting des clients qui vendent aux particuliers | ce que le cabinet doit contrôler, et à quelle fréquence |
| C5 | Récupérer les données de facturation de ses clients en 2027 | FEC, Factur-X, accès en lecture seule, fin de la course aux pièces |
| C6 | Retour d'expérience du cabinet pilote | **seulement avec son accord écrit**, après le pilote |

### 3.2 Trafic naturel (toutes familles)

Rangés par potentiel : requêtes fréquentes, sur lesquelles le blog n'a encore
rien, et auxquelles Deviso répond directement.

| # | Titre de travail | Famille | Pourquoi |
|---|---|---|---|
| T1 | Mentions obligatoires d'une facture en 2026, nouvelles mentions comprises | factures | requête très cherchée, et la réforme ajoute des mentions : contenu à jour rare |
| T2 | CFE : qui la paie, combien, et l'exonération de la première année | gestion | échéance au 15 décembre : à publier **avant début décembre** |
| T3 | Facture sans TVA : la mention « TVA non applicable, art. 293 B du CGI » | factures | requête fréquente des micro et des EI en franchise |
| T4 | Relancer une facture impayée : modèles de messages | paiement | requête fréquente, complète l'article sur les impayés |
| T5 | Les taux de TVA en France, par activité | factures | requête durable, utile à toute entreprise assujettie |
| T6 | Budget 2027 : ce qui change pour les TPE et les indépendants | gestion | **seulement une fois la loi de finances votée** |
| T7 | Embaucher son premier salarié ou un apprenti | gestion | sujet proposé le 19/11, toutes formes d'entreprise |
| T8 | Trésorerie : le calendrier des échéances (TVA, URSSAF, CFE) | gestion | sujet proposé le 19/11 |
| T9 | Modèle de devis : les mentions obligatoires, avec un exemple | factures | requête parmi les plus cherchées du domaine |
| T10 | Déclarer ses revenus de micro-entrepreneur (2042 C PRO) | micro | requête saisonnière, avril-mai |
| T11 | L'IA dans une petite entreprise : usages concrets et limites | gestion | sujet proposé le 19/11, tendance |

## 4. Le calendrier

Rythme proposé : **trois publications par mois** (deux pour le trafic, une
pour les cabinets), plus une mise à jour d'article existant, comme le prévoit
`02-plan-editorial.md` § 5.

| Mois | Trafic naturel | Experts-comptables |
|---|---|---|
| Décembre 2026 | T2 CFE (avant le 1er), T1 mentions obligatoires | C1 check-list du cabinet |
| Janvier 2027 | T6 budget 2027 (si voté), T3 mention 293 B | C2 plateforme à recommander |
| Février 2027 | T4 modèles de relance, T5 taux de TVA | C3 annuaire |
| Mars 2027 | T8 trésorerie, T7 premier salarié | C4 e-reporting |
| Avril 2027 | T10 déclaration de revenus, T9 modèle de devis | C5 données des clients |
| Mai 2027 | T11 IA, une mise à jour réforme (approche de septembre 2027) | C6 si le pilote l'autorise |

## 5. Comment savoir si ça marche

- **Search Console**, 30 et 90 jours après chaque publication : impressions,
  clics, position moyenne. Un article sans impression à 90 jours est à revoir
  (titre, angle) avant d'en écrire un autre sur le même modèle.
- **Vercel Analytics** : part des visites venues d'un moteur de recherche.
  Point de départ : 3 sur 58 en octobre-novembre 2026 ; dans la Search
  Console, 5 clics pour 1 100 impressions, position moyenne 39,9.
- **Experts-comptables** : nombre de cabinets qui demandent une démo après avoir
  lu un article (lien `mailto` de `/experts-comptables`).

## 6. Ce que ce plan ne promet pas

Aucune estimation de volume de recherche n'est donnée pour les nouveaux sujets :
la Search Console ne montre que les requêtes sur lesquelles le site apparaît
déjà, et un outil payant (Ahrefs, Semrush) serait nécessaire pour les autres.
Les priorités des nouveaux articles reposent sur des requêtes connues pour être
fréquentes et sur l'actualité ; celles du § 2.1 reposent, elles, sur les
chiffres réels de la Search Console.
