# Audit du blog, 26 et 27 novembre 2026

Pourquoi : Selim va relayer les articles sur X. Une seule erreur de fond publique le décrédibiliserait.
Périmètre : les 52 articles, l'index `/blog`, les composants `components/blog/`, `lib/blog/` (registre, catégories, auteur).
Méthode : 7 lots relus par des sous-agents, chaque correction de fond appuyée sur une source officielle ouverte pendant l'audit (service-public, impots.gouv.fr, BOFiP, Légifrance, URSSAF). Ce qui restait incertain n'a pas été modifié : c'est la liste « À décider » plus bas.

Détail de chaque constat (article, avant, après, source) : annexes `audit-2026-11/lot-A.md` à `lot-G.md`.

| Lot | Articles |
|---|---|
| A | facturation-electronique-2026, reforme-facturation-micro-entrepreneur, choisir-plateforme-agreee-freelance, liste-plateformes-agreees, e-reporting-freelance-2026, facture-electronique-refusee-que-faire |
| B | plateforme-agreee-ou-solution-compatible, checklist-reforme-facturation-2026, facturation-electronique-petit-chiffre-affaires, pas-de-plateforme-gratuite-etat, amendes-facturation-electronique-2026, factur-x-explique-freelance |
| C | facture-acompte, facture-avoir, note-honoraires, attestation-vigilance, refacturer-frais, facturer-client-etranger, numerotation-factures, clauses-devis, scope-creep |
| D | les 8 articles micro-entreprise (livre des recettes, biens ou services, TVA, déclaration URSSAF, versement libératoire, obligations comptables, plafonds, calendrier) |
| E | micro-ou-reel, quand-prendre-expert-comptable, deviso-solution-comptable-marche, fixer-ses-tarifs, choisir-statut, cfe, gerer-impayes, delais-paiement, fraude-faux-rib |
| F | les 4 articles pour experts-comptables, l'index, les composants, le registre (52 descriptions) |
| G | les 10 articles « devis » par métier |

## 1. En bref

- Environ 120 corrections faites, dont une soixantaine sur le fond (dates, montants, seuils, règles), le reste sur les liens, la langue et les métadonnées. Environ 60 points attendent une décision de Selim (liste plus bas, les 15 premiers sont prioritaires).
- 38 articles ont changé sur le fond : leur date « mis à jour » est passée au 27/11/2026. Les autres gardent leur date.
- Aucune fonctionnalité de Deviso décrite dans le blog n'est absente du code. Seuls des formulations promotionnelles (« 30 secondes ») et deux promesses de CTA restent à trancher (n° 12 et 13).

Les corrections les plus graves :

| Article | Avant | Après | Source |
|---|---|---|---|
| 15 articles (« Sources ») | liens Légifrance vers le mauvais article (« art. 242 nonies A » ouvrait l'art. 272, « 259 B » le 302 bis S, « L8222-2 » le L8223-1) ou vers une page inexistante (8 liens) | chaque lien mène à l'article cité, vérifié dans Légifrance le 27/11 | Légifrance |
| amendes-facturation-electronique-2026 | défaut de réception : « 500 €, 1 000 € si réitération » ; tolérance de première infraction présentée comme générale | mise en demeure de 3 mois, puis 500 €, puis 1 000 € tous les 3 mois ; la tolérance vaut pour l'émission (50 €) et l'e-reporting (500 €), pas pour la réception | loi n° 2026-103, art. 123 ; CGI art. 1737 III, IV bis, V et 1788 D |
| checklist-reforme-facturation-2026 | ETI obligées « au 1er décembre 2026 », seuils de taille faux, e-reporting « 2027 pour tous », franchise en base « hors e-invoicing », SIRET exigé | GE et ETI au 1er septembre 2026, PME, TPE et micro au 1er septembre 2027, même calendrier pour l'e-reporting, franchisés concernés, les quatre nouvelles mentions | service-public A18953, F23208, F39785 ; impots.gouv.fr |
| e-reporting-freelance-2026 | fréquence « mensuelle ou trimestrielle », modalités des franchisés « non publiées » | par décade, mois ou bimestre selon le régime de TVA ; franchisés : tous les deux mois | impots.gouv.fr, tableau officiel |
| liste-plateformes-agreees | 149 plateformes immatriculées, 14 en attente | 159 immatriculées, 5 en attente (listes du 20/11/2026) ; Super PDP y figure | listes officielles impots.gouv.fr |
| bandeau « Réforme 2026 » (index et 7 articles) | « La facturation électronique B2B devient obligatoire. Deviso est déjà conforme Factur-X, sans rien faire de votre côté » | « Réception obligatoire depuis le 1er septembre 2026, émission au 1er septembre 2027 pour les PME, TPE et micro-entreprises. Deviso émet en Factur-X par la plateforme agréée comprise dans l'abonnement. » | guide DGFiP, question 17 |
| devis-artisan-btp | devis obligatoire « au-delà de 150 € / 1 500 € » ; acompte limité à 5 % (« loi anti-arnaque ») ; attestation 1301-SD | devis préalable obligatoire sans seuil ; aucun plafond général, arrhes ou acompte à préciser ; les attestations 1300-SD et 1301-SD n'existent plus depuis le 16/02/2025 | service-public F31144 ; impots.gouv.fr (formulaire 1300-SD) |
| biens-ou-services, versement-liberatoire | plafond services 77 700 € ; plafond de revenu 29 315 € par part | 83 600 € (2026-2028) ; 29 579 € par part | service-public F32353, F23267 |
| devis-graphiste-freelance | « sans mention, c'est le taux légal qui s'applique » | taux de la BCE majoré de 10 points, indemnité forfaitaire de 40 € | service-public F23211 |
| gerer-impayes-freelance | « les créances professionnelles se prescrivent en 5 ans » | 5 ans entre professionnels, 2 ans contre un particulier | Code de la consommation, L218-2 |
| choisir-statut-micro-ei-eurl-sasu | taux réduit d'IS si capital « détenu majoritairement » par des personnes physiques | détenu à 75 % au moins | service-public F23575 |
| devis-consultant, devis-formateur | « Factur-X imposé dès 2026 », « Factur-X pour paiement électronique » | calendrier exact ; Factur-X est un format de facture | service-public F31808 |

## 2. Corrections transversales

- Liens Légifrance : les 15 identifiants faux remplacés (table de correspondance dans `lot-*` et dans l'historique Git). Vérifiés corrects : section CGI 289-0 à 289 bis, décret n° 2012-432 art. 151, loi n° 2026-103 art. 123.
- Liens morts (404) remplacés par la page officielle actuelle : URSSAF auto-entrepreneur (2), service-public F32917 et F23268, impots.gouv.fr (3), DREETS, collectivites-locales.
- Registre : les 52 descriptions font désormais 150 à 160 caractères (36 réécrites) ; « PPF abandonné » devient « pas de portail public gratuit » ; « notre solution comptable » devient « notre outil de gestion » ; retrait des affirmations non mesurées (« la moitié du web », « presque personne », « première cause »).
- Typographie : espaces insécables avant « : ; ? ! », dans les guillemets, devant % et € et dans les milliers (environ 2 600, texte seulement, jamais le code). Fautes, accords, tutoiement résiduel, anglicismes corrigés article par article.

## 3. À décider par Selim

Classés du plus important au moins important. Rien de tout cela n'a été modifié.

1. **Recodification de la TVA au 1er janvier 2027.** Les règles de TVA quittent le CGI pour le livre II du Code des impositions sur les biens et services (ordonnance n° 2025-1247, date reportée par l'ordonnance n° 2026-671 ; BOFiP BOI-RES-TVA-000253). Une quarantaine de références (« art. 293 B du CGI », 289, 259 B, 261-4, 283-2) sont justes aujourd'hui et seront périmées dans cinq semaines. Proposition : mettre à jour toutes les références en janvier, ou ajouter dès maintenant une phrase « à partir du 1er janvier 2027, ces règles figurent au CIBS ».
2. **facturation-electronique-2026, le guide principal.** Il affirme « en août 2025, le développement du portail a été arrêté » (aussi dans la FAQ) : aucune source trouvée. Son titre de section « Le portail public (PPF) est abandonné » est inexact : le portail a été recentré sur l'annuaire et la collecte des données (communiqué du 16/10/2024). Proposition : retirer la date et écrire « recentré ». À trancher avant de partager cet article (lot A, n° 10, 15 et 28).
3. **Même guide** : il ne cite pas les quatre nouvelles mentions obligatoires (SIREN du client, adresse de livraison, nature des opérations, option TVA sur les débits). Ajout proposé (lot A, n° 14).
4. **Régime simplifié de TVA (CA12) supprimé au 1er janvier 2027** : passer-a-la-tva et le registre parlent encore du « choix CA12 ou CA3 ». À réécrire en janvier (lot D).
5. **Bug de l'application, hors blog** : `lib/exoneration.ts` imprime « art. 262 ter I » et « 262 I » (articles sur les livraisons de biens) sur des factures de prestations de services à l'étranger, alors que l'article du blog promet la bonne mention (lot C, C3). À corriger dans l'application.
6. **amendes-facturation-electronique-2026** : l'article ne cite pas la tolérance de démarrage annoncée par le ministre (pas de sanction pour les entreprises de bonne foi qui régularisent, communiqué du 11/07/2026), alors que petit-chiffre-affaires la cite. Ajout proposé (lot B, n° 16).
7. **fraude-faux-rib** : la vérification du bénéficiaire, obligatoire et gratuite depuis le 9 octobre 2025 pour les virements SEPA, n'est pas mentionnée. C'est pourtant le premier filet contre le faux RIB. Ajout proposé (lot E, n° 45).
8. **portefeuille-clients-echeance-septembre-2027** : la ligne « micro en franchise » oublie les clients étrangers et les données de paiement des prestations de services (lot F, F5).
9. **facture-acompte-freelance** : l'article qualifie d'erreur une numérotation séparée des acomptes, alors que Deviso numérote ses acomptes en AC-2026-NNN et que le BOFiP admet plusieurs séries (lot C, C1 et N2). Il faut aligner l'article ou l'application.
10. **Débours et exonération des soins** promis dans deux CTA (refacturer-frais, note-honoraires) : ces fonctions n'existent pas dans le code (lot C, C4 et C5).
11. **clauses-devis et scope-creep** : le texte promet une signature « gratuite » (elle est réservée aux formules Solo et Pro) et un « vous êtes protégé juridiquement » trop absolu (lot C, C6).
12. **« 30 secondes »** pour créer un devis (CTA des articles métier, fixer-tarifs, graphiste) : la durée n'a jamais été mesurée. Proposition : « en quelques minutes » (lots E, F, G).
13. **CTA des articles experts-comptables** : le bouton « Essayer gratuitement » mène à l'inscription d'une entreprise, pas à `/experts-comptables` (lot F, F12).
14. **Chiffres de marché sans source** : fourchettes de tarifs (traducteur, rédacteur, photographe, community manager), « 45-55 % de charges » (fixer-tarifs, à remplacer par les taux URSSAF), « consultation 150 à 300 € », prix des plateformes « 0,05 à 0,30 € par facture ». Proposition : présenter ces chiffres « à titre indicatif » ou les retirer (lots A, E, G).
15. **Affirmations sur les concurrents** non vérifiables dans deviso-solution-comptable-marche (« une bonne dizaine de solutions », « des outils tiennent les recettes à la date de facture », « trop chères ») : sourcer ou adoucir (lot E, n° 11).
16. Autres points de moindre portée (nuances juridiques, formulations, cohérence entre articles, h1 écrits en dur dans quelques pages) : sections « À DÉCIDER » de chaque annexe.

### Suite donnée le 27/11 (décision de Selim : appliquer en vérifiant chaque fait, et dire ce qui va changer)

- Point 1 : une phrase dans les 19 articles qui citent un article de TVA du CGI : « À partir du 1er janvier 2027, les règles de TVA citées ici quittent le CGI pour le livre II du CIBS : les numéros d'articles changeront. » Source BOI-RES-TVA-000253, ajoutée aux listes de sources. **À refaire en janvier 2027** : remplacer les numéros du CGI par ceux du CIBS.
- Points 2 et 3 : date « août 2025 » retirée ; le portail public est dit « recentré sur l'annuaire et la collecte des données » (communiqué du 16/10/2024, AIFE) ; les quatre nouvelles mentions ajoutées avec leurs dates (F23208).
- Point 4 : passer-a-la-tva dit que la CA12 n'existe plus à partir du 1er janvier 2027 (actualité impots.gouv.fr) ; carte et description du registre alignées.
- Point 6 : tolérance de démarrage ajoutée, présentée comme une annonce sans date de fin connue au 27/11/2026 (communiqué du 11/07/2026). **À surveiller** : si une date de fin est annoncée.
- Point 7 : vérification du bénéficiaire ajoutée (guide Banque de France et CNMP, septembre 2025).
- Point 8 : ligne « micro en franchise » complétée (FAQ DGFiP « J'approfondis » 3.3 et 4.1) ; « neuf mois » daté au 27/11/2026.
- Point 9 : une série distincte pour les acomptes est admise si chaque série est chronologique et continue (BOFiP BOI-TVA-DECLA-30-20-20-10, § 60 et 80 à 100).
- Points 10 à 13 : CTA sans promesse inexistante (débours, soins), signature « incluse dans Solo et Pro », « en quelques minutes » au lieu de « 30 secondes », lien « Découvrir l'espace cabinet » sur les 4 articles comptables.
- Points 14 et 15 : chiffres de marché sans source retirés ou présentés à titre indicatif ; affirmations sur les concurrents adoucies.
- Liste des plateformes : chiffres datés « au 20 novembre 2026 », avec la mention que la liste évolue.
- Constat 48 du lot A (e-reporting et CA3) : corrigé sur la fiche DGFiP des données de paiement.
- Point 5, corrigé le 27/11 dans `lib/exoneration.ts` : la nature de l'opération départage. Biens vers l'UE : K, « Exonération de TVA, art. 262 ter I du CGI ». Prestation à une entreprise de l'UE : AE, « Autoliquidation, art. 196 de la directive 2006/112/CE ». Biens hors UE : G, art. 262 I. Prestation à une entreprise hors UE : G, « TVA non applicable, art. 259-1° du CGI ». Particulier hors UE ou nature inconnue : mention neutre et demande de l'information manquante. Garde `test:exoneration` (27/27, les cas « prestations » échouaient avec l'ancienne règle) ; XML Factur-X généré et relu pour les trois cas. Non fait : passage d'une facture réelle par Super PDP avec la catégorie AE. **À refaire en janvier 2027** : les numéros d'articles imprimés sur les factures (293 B, 262 ter I, 262 I, 259-1°) passeront au CIBS.
- **Reste ouvert** : point 16 (points mineurs des annexes).

## 4. Hors périmètre, signalé

- `lib/exoneration.ts` (point 5 ci-dessus).
- La page « livre des recettes » de l'application tutoie l'utilisateur (lot E).

## 5. Couverture

Vérifié : les 52 articles lus en entier ; chaque correction de fond appuyée sur une source officielle ouverte ; les liens internes ; l'état HTTP des 70 liens externes ; les 19 liens Légifrance ouverts un à un ; les affirmations sur Deviso confrontées au code (`lib/plans.ts`, `lib/grille-tarifaire.ts`, routes) ; les totaux des exemples chiffrés ; les contrôles `tsc`, `check:blog`, `check:tirets`, `check:emoji`, `check:prix`, et la compilation.

Non vérifié : les pages de autoentrepreneur.urssaf.fr et de economie.gouv.fr, qui refusent les robots (les points concernés sont dans les annexes) ; trois dates données seulement par des résultats de recherche (ACRE au 1er juillet 2026, date limite URSSAF de changement de périodicité, ISO 17100) ; le rendu sur un vrai téléphone.
