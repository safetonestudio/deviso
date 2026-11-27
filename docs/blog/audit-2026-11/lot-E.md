# Audit blog, lot E (27/11/2026)

Articles : micro-ou-reel-quand-basculer, quand-prendre-expert-comptable-micro, deviso-solution-comptable-marche, fixer-ses-tarifs-freelance, choisir-statut-micro-ei-eurl-sasu, cfe-cotisation-fonciere-entreprises, gerer-impayes-freelance, delais-paiement-penalites-retard, fraude-faux-rib-faux-fournisseur.

Contrôles après modification : `npx tsc --noEmit -p .` sans erreur sur les fichiers du lot ; `check-tirets` et `check-emoji` OK. Aucun commit.

## Constats

### micro-ou-reel-quand-basculer

1. **Grav. 1, CORRIGÉ. TVA présentée comme un avantage du réel.** Plusieurs passages faisaient dépendre la récupération de TVA du régime réel (« Charges réelles déduites, TVA récupérable », « Le réel apporte aussi la récupération de la TVA », « au réel, vous amortissez et récupérez la TVA, ce que le micro ne permet pas », En bref « amortissements et récupération de TVA », FAQ 1 « Le réel déduit les charges réelles et récupère la TVA »). C'est faux : la TVA dépend de la franchise en base, pas du régime d'imposition.
   - Après : TVA retirée des avantages du réel. Phrase ajoutée là où il le fallait : « La TVA, elle, se récupère dès que vous y êtes assujetti, au micro comme au réel. » FAQ 5 complétée : « Ce n'est pas propre au réel : un micro-entrepreneur assujetti à la TVA la récupère aussi. C'est la franchise en base qui l'empêche, pas le régime micro. »
   - Source : fiche impots.gouv.fr « Les régimes réservés aux petites entreprises » 2026 (https://www.impots.gouv.fr/sites/default/files/media/3_Documentation/depliants/pro_fiche_regimes_reserves_aux_petites_entreprises_2026.pdf) : « Le régime micro peut s'appliquer aux entrepreneurs même s'ils sont assujettis à la TVA. »
2. **Grav. 1, CORRIGÉ. Obligations comptables du réel BNC.** Avant : « comptabilité complète (bilan, compte de résultat, liasse fiscale) », « c'est tenir une comptabilité d'engagement, produire un bilan et une liasse fiscale ». C'est vrai en BIC, faux en BNC (déclaration contrôlée). Or l'exemple de l'article est justement un BNC à 34 %.
   - Après : « en BIC, bilan, compte de résultat et liasse fiscale ; en BNC, livre-journal des recettes et des dépenses et registre des immobilisations ». L'encadré cite la déclaration n° 2035. FAQ 1 et FAQ 4 alignées.
   - Source : Livret fiscal du créateur, BNC (https://www.impots.gouv.fr/livret-createur-entreprise-benefices-non-commerciaux-bnc). Sous « OBLIGATIONS COMPTABLES » : « Livre journal des recettes encaissées et des dépenses payées ; Registre des immobilisations mentionnant les amortissements », avec « Télétransmission de la déclaration n° 2035 ».
3. **Grav. 4, CORRIGÉ. Lien mort F32917** (connu). Remplacé par la fiche impots.gouv 2026 citée ci-dessus. La source « Livret fiscal BNC » est ajoutée.
4. **Grav. 5, CORRIGÉ.** « coup d'oeil » devient « coup d'œil ».
5. **Grav. 1, À DÉCIDER (mineur).** « votre comptabilité se résume au livre des recettes » : pour une activité de vente, il faut aussi tenir un registre des achats (même fiche impots.gouv : « tenue d'un registre des achats et pièces justificatives »). Proposition : « se résume au livre des recettes (et au registre des achats pour la vente) ».
6. Vérifié dans le code, conforme : livre des recettes (`livreRecettes`, page `app/(dashboard)/livre-recettes`). Abattements 71/50/34 % confirmés (fiche 2026, minimum 305 €).

### quand-prendre-expert-comptable-micro

7. **Grav. 3, À DÉCIDER.** « Un bon **outil de facturation** couvre déjà la majeure partie de ces gestes », repris dans la FAQ 3. Cela réduit l'outil à la facturation (consigne « outil de gestion »). La phrase ne parle pas de Deviso nommément. Proposition : « Un bon outil de gestion (factures, livre des recettes, suivi du CA) couvre déjà… ».
8. Vérifié dans le code, conforme : accès expert-comptable gratuit en lecture seule (`accesComptable`), exports (`fecExport`, `csvRecap`, Quadra dans `app/api/cabinet/export`). Pour « transmissibles en un clic », je n'ai pas vérifié qu'il s'agit d'un seul clic, mais la formule est acceptable en marketing.
9. Liens : R54994 redirige vers F23266 « Obligations comptables du micro-entrepreneur » (200, bon contenu). experts-comptables.fr répond 200.

### deviso-solution-comptable-marche

10. **Affirmations sur Deviso, toutes VÉRIFIÉES dans le code** :
    - devis et factures : oui ;
    - factures fournisseurs reçues : `app/(dashboard)/factures-recues` ;
    - suivi selon le statut micro / EI au réel / société : `lib/statut-entreprise.ts`, type `micro | ei_reel | societe` ;
    - plusieurs taux de TVA : `facturX`, « Plusieurs taux de TVA sur une même facture » ;
    - exports FEC et Quadra : `app/api/cabinet/export/route.ts`, `lib/export-quadra` ;
    - livre des recettes à l'encaissement avec la distinction biens / services : `livre-recettes/page.tsx`, tuiles « Prestations de services » et « Ventes de biens » ;
    - accès cabinet gratuit en lecture seule : `accesComptable` ;
    - cockpit cabinet : `app/(cabinet)/cabinet` ;
    - conformité réforme : `app/conformite`, `plateformeAgreee` ;
    - « phase pilote » et « la page experts-comptables explique comment nous rejoindre » : cohérent avec `app/experts-comptables` (« Programme pilote gratuit »).
11. **Grav. 2/3, À DÉCIDER. Affirmations invérifiables sur les concurrents :**
    - « une bonne dizaine de solutions se partagent le marché français, beaucoup avec une offre gratuite » : seule source, tool-advisor.fr, comparatif privé, non officiel ;
    - « Des outils tiennent les recettes à la date de facture, pas à l'encaissement » (aussi en FAQ 3 et dans le tableau) : aucun outil nommé, aucune source ;
    - « les plateformes pensées pour les cabinets sont souvent trop lourdes, et trop chères » et « Suivre dix petites entreprises […] y revient cher » : aucune source tarifaire ;
    - « Beaucoup promettent la facturation électronique, mais peu expliquent… » : jugement ;
    - « Nombre de solutions sont conçues pour un seul profil […] Changer de statut oblige alors à changer d'outil » : non sourcé ;
    - « certaines ont levé des montants considérables » : la source est Siècle Digital (presse, non officielle). Le lien répond 200 et le titre confirme « Pennylane lève 175 millions d'euros ».
    - Proposition : soit tourner ces phrases en constats prudents à la première personne (« ce que nous entendons d'indépendants et de cabinets »), soit citer des pages tarifaires publiques datées. Ne pas les relayer telles quelles sur X.
12. **Grav. 5, À DÉCIDER.** Le registre titre « notre solution comptable », alors que l'article dit « Deviso n'est pas une solution de comptabilité complète ». Voir la section registre.

### fixer-ses-tarifs-freelance

13. **Grav. 2, À DÉCIDER. Chiffres non sourcés :**
    - « environ 45-55% du CA pour un auto-entrepreneur » (FAQ, donc aussi dans le JSON-LD) et « (~45%) » dans l'exemple. Les cotisations micro sont des taux fixes publiés par l'Urssaf, bien inférieurs ; le chiffre mélange cotisations, impôt, mutuelle et frais. Proposition : « Ajoutez vos charges : cotisations sociales (taux micro publié par l'Urssaf pour votre activité), impôt, mutuelle, frais professionnels », sans pourcentage global, ou avec une fourchette sourcée.
    - « Un développeur salarié à 45 000€/an brut […] coûte environ 67 000€ » et « Un TJM de 450€ […] l'équivalent d'un salarié à 50k brut » : non sourcés. Proposition : retirer les montants ou citer un simulateur officiel (mon-entreprise.urssaf.fr).
    - « Une consultation coûte 150 à 300€ » et « commission de 10 à 30% » : ces deux chiffres sont dans gerer-impayes (n° 18).
14. **Grav. 3, À DÉCIDER. Contradiction interne sur les jours facturables** : la FAQ dit « 15-18 jours sur 20 », l'exemple « 17 sur 20 », la section erreurs « 13 à 16 jours réels ». Proposition : harmoniser sur 13 à 16 jours et refaire l'exemple. Avec 15 jours : 5 455 / 15, soit 364 €.
15. **Grav. 3, À DÉCIDER.** CTA : « vos devis sont générés en 30 secondes, signés électroniquement et relancés automatiquement ». La signature (`signature`) et la relance des devis (`app/api/proposals/[id]/remind`, cron `send-reminders` qui traite aussi les devis) sont vérifiées. « 30 secondes » ne l'est pas. Proposition : « vos devis sont rédigés pour vous, signés électroniquement… ».
16. **Grav. 3, À DÉCIDER. Bandeau** « Réforme 2026 : la facturation électronique B2B devient obligatoire. Deviso est déjà conforme Factur-X. » Même bandeau dans gerer-impayes. Deux problèmes. D'abord, en 2026 seule la réception est obligatoire pour toutes les entreprises ; l'émission ne l'est en 2026 que pour les GE et ETI, et en 2027 pour les PME, TPE et micro. Ensuite, « conforme Factur-X » sous-vend Deviso, plateforme agréée. Proposition : « Réforme : toutes les entreprises doivent pouvoir recevoir des factures électroniques depuis le 1er septembre 2026. Deviso est plateforme agréée. » (formulation exacte à valider). La majuscule après les deux-points est CORRIGÉE (« la facturation »).
17. **Grav. 5, CORRIGÉ.** « Favorise la value-based pricing » (accord faux) devient « Favorise la tarification à la valeur ». Le reste est conservé : « scope creep », « dev senior », « 50k brut » sont des familiarités, à décider.

### gerer-impayes-freelance

18. **Grav. 1, CORRIGÉ. Avocat et injonction de payer.** Avant : « pas d'avocat obligatoire (pour les montants inférieurs à 10 000€) », ce qui laissait croire qu'un avocat est obligatoire au-delà. Après : « pas d'avocat obligatoire pour déposer la requête (si le débiteur fait opposition devant le tribunal judiciaire, l'avocat le devient au-delà de 10 000 €) ».
    - Source : https://www.service-public.gouv.fr/particuliers/vosdroits/F1746. L'avocat n'est obligatoire qu'en cas d'opposition : « Uniquement pour les créances supérieures à 10 000 € ». Également F38156 : « Le recours à un avocat n'est pas obligatoire. »
19. **Grav. 1, CORRIGÉ. Juridiction.** Avant : « au tribunal judiciaire compétent ». Après : « tribunal de commerce pour une créance commerciale, tribunal judiciaire sinon ». Corrigé dans le corps et dans la FAQ (donc aussi dans le JSON-LD).
    - Source F1746 : « Tribunal de commerce du siège social du débiteur » pour une créance commerciale, « Tribunal judiciaire du domicile ou siège social du débiteur » sinon.
20. **Grav. 1, CORRIGÉ. « huissier » devient « commissaire de justice »** (deux fois, dont la FAQ). Ajouts : la signification de l'ordonnance « dans les 3 mois pour une ordonnance rendue depuis le 1er septembre 2026 », et le délai d'opposition « 1 mois à partir de la signification ».
    - Source F1746 : « Vous avez 6 mois pour faire signifier […] par un commissaire de justice » pour les ordonnances antérieures au 1er septembre 2026, 3 mois ensuite. F38156 : « un délai de 3 mois ».
21. **Grav. 1, À DÉCIDER. Prescription (FAQ, donc JSON-LD).** « les créances professionnelles se prescrivent en 5 ans » n'est vrai qu'entre commerçants, ou entre un commerçant et un non-commerçant (L110-4 C. com.). Contre un particulier, le délai est de **2 ans** (L218-2 C. conso). Je n'ai pas pu ouvrir la page officielle (economie.gouv.fr/dgccrf/les-fiches-pratiques/delais-de-prescription, 403 aux robots) : seul l'extrait du moteur de recherche le confirme. Proposition : « 5 ans entre professionnels (article L110-4 du Code de commerce), mais 2 ans seulement contre un particulier (article L218-2 du Code de la consommation) ». Le point de départ « date d'exigibilité » est aussi à revoir : contre un particulier, la jurisprudence retient souvent la date de facture.
22. **Grav. 2, À DÉCIDER. Chiffres non sourcés** : « Une consultation coûte 150 à 300€ », « commission de 10 à 30% », « acompte de 30 à 50% » (conseil, acceptable). Proposition : retirer les deux premières fourchettes ou écrire « variable selon le cabinet ».
23. **Grav. 1, À DÉCIDER (nuance).** « Mentionnez des pénalités de retard dans votre devis (obligatoire en B2B) » : l'obligation légale porte sur la facture et les conditions générales de vente (CGV), pas sur le devis. Proposition : « dans votre devis et vos conditions générales (obligatoire sur la facture en B2B) ».
24. **Grav. 3, À DÉCIDER.** « vérifiez l'existence légale de l'entreprise sur Pappers.fr » renvoie à un site privé. Proposition : l'Annuaire des entreprises officiel (annuaire-entreprises.data.gouv.fr).
25. **Grav. 5, CORRIGÉ.** Préfixes parasites « <li>, Le devis… » (×4), probablement des restes de la suppression des tirets, retirés. « trainer » devient « traîner ». Majuscule après les deux-points du bandeau corrigée. Bandeau sur le fond : voir n° 16.
26. Vérifié dans le code, conforme : CTA « relances automatiques […] aux intervalles que vous choisissez » (`remindersCustom`, `lib/relances.ts` `reminder_intervals`). Liens métiers et `/blog/clauses-devis-freelance` : routes présentes.
27. Note : la page ne mentionne ni l'indemnité de 40 € ni la procédure simplifiée de recouvrement (moins de 5 000 €), qui sont dans delais-paiement. Ajout éventuel À DÉCIDER, sans urgence.

### delais-paiement-penalites-retard

28. Fond **vérifié, conforme** sur F23211 (https://entreprendre.service-public.gouv.fr/vosdroits/F23211) :
    - 30 jours par défaut, 60 jours à compter de l'émission de la facture, 45 jours fin de mois ;
    - pénalités d'au moins 3 fois le taux d'intérêt légal (8,25 % au 2e semestre 2026), BCE + 10 points (2,40 % + 10, soit 12,40 %) ;
    - 40 € par facture, « une seule fois par facture » ;
    - amendes de 75 000 € pour une EI et 2 M€ pour une société, doublées en cas de récidive dans les 2 ans.
29. **Grav. 1, CORRIGÉ. Juridiction de l'injonction de payer.** Avant : « l'injonction de payer devant le tribunal de commerce ». Après : « devant le tribunal de commerce pour une créance commerciale ou le tribunal judiciaire sinon » (un libéral non commerçant relève du tribunal judiciaire). Source F1746 (n° 19). Procédure simplifiée sous 5 000 € confirmée par F38156 (« de moins de 5 000 € »).
30. **Grav. 4, CORRIGÉ. Lien mort DREETS** (connu). Remplacé par F23211, « Délais de paiement entre professionnels et pénalités de retard ».
31. **Grav. 5, CORRIGÉ.** « oeil » devient « œil ».
32. Liens : Bpifrance répond 200. Pages economie.gouv.fr (DGCCRF, Médiateur) et PDF Banque de France ODP2025 : 403 aux robots, non vérifiables par moi, à ouvrir dans Chrome.
33. Vérifié dans le code, conforme : CTA « échéance, pénalités et indemnité de 40 € sur chaque facture » (`lib/facture-contenu.ts` l.302) et relances automatiques. Hors lot, pour la session principale : la mention de la facture dit « 3× le taux légal […] 40€ » et le livre des recettes de l'app tutoie (« tes factures payées », `app/(dashboard)/livre-recettes/page.tsx` l.104 et 134).

### cfe-cotisation-fonciere-entreprises

34. **Grav. 1, CORRIGÉ. Date de mise en ligne de l'avis.** Avant : « généralement à partir de la mi-novembre ». Après : « généralement début novembre (le 2 novembre en 2026) ».
    - Source : https://www.impots.gouv.fr/actualite/cfe-etou-ifer-2026-mise-en-ligne-des-avis-dimpot-dans-lespace-professionnel (publiée le 02/11/2026) : paiement « au plus tard le 15 décembre 2026 inclus », par « prélèvement automatique (mensuel ou à l'échéance) » ou « paiement direct en ligne ».
35. **Grav. 5, CORRIGÉ.** « deux entreprises […] l'un dans une petite commune » devient « l'une ». Le titre « Payer avant le 15 décembre » devient « Payer au plus tard le 15 décembre » (la date est incluse, source ci-dessus).
36. Fond **vérifié, conforme** (F23547) : exonération l'année de création, base réduite de moitié l'année suivante, CA de N-2, pas de cotisation minimum jusqu'à 5 000 €, paiement dématérialisé. Fourchettes 2026 de la base minimum, non citées dans l'article : de 250 € à 597 € (CA jusqu'à 10 000 €) et jusqu'à 7 769 € (CA au-delà de 500 000 €).
37. **Grav. 1, À DÉCIDER (mineur).** « Ou mettre en place le prélèvement mensuel pour les années suivantes » : F23547 permet d'adhérer au prélèvement mensuel jusqu'au 30 juin pour l'année en cours, et au prélèvement à l'échéance jusqu'au 30 novembre. Rien de faux ; on peut préciser.
38. Liens : F23547 et F23999 répondent 200 avec le bon sujet. economie.gouv.fr/node/36981 : 403 aux robots, non vérifié.
39. Vérifié dans le code, conforme : CTA « suit votre CA encaissé, votre TVA et vos échéances » (`urssafWidget`).

### choisir-statut-micro-ei-eurl-sasu

40. **Grav. 1, CORRIGÉ. Condition du taux réduit d'IS.** Avant : « capital entièrement libéré et détenu majoritairement par des personnes physiques ». Après : « détenu pour au moins 75 % par des personnes physiques ». Source F23575 ajoutée à la liste.
    - Source : https://entreprendre.service-public.gouv.fr/vosdroits/F23575 (vérifiée le 17/02/2026) : « Capital social entièrement libéré et détenu pour au moins 75 % par des personnes physiques » ; « Chiffre d'affaires inférieur ou égal à 10 000 000 € » ; 15 % jusqu'à 42 500 €. La page impots.gouv citée (publiée le 14/04/2026) confirme le plafond de 42 500 €. Aucune source ne montre de changement par la loi de finances 2026.
41. Plafonds micro 2026 **vérifiés** sur F32353 : 203 100 € et 83 600 €.
42. **Grav. 1, À DÉCIDER (à surveiller).** SASU : « les dividendes ne supportent que les prélèvements sociaux et l'impôt ». C'est juste sur le principe, sans chiffre. Si un chiffre est ajouté un jour, vérifier le taux des prélèvements sociaux après la LFSS 2026 (hausse de la CSG sur les revenus du capital annoncée) : non vérifié ici.
43. ARE et ACRE ne sont pas mentionnées dans l'article : rien à vérifier. La note « Ni le gérant d'EURL ni le président de SASU ne cotisent à l'assurance chômage au titre de leur mandat » est exacte, mais je ne l'ai pas sourcée cette session.
44. Liens : F23844 et le PDF Bpifrance répondent 200.

### fraude-faux-rib-faux-fournisseur

45. **Grav. 1, À DÉCIDER (omission importante). Vérification du bénéficiaire (VoP)** : l'article n'en parle pas, alors qu'elle est obligatoire et gratuite depuis le **9 octobre 2025** pour les virements SEPA en euros. La banque compare le nom saisi et l'IBAN, et signale toute non-concordance. C'est le premier filet contre le faux RIB.
    - Sources trouvées, PDF non ouverts dans le détail : guide CNMP / Banque de France https://www.banque-france.fr/system/files/2025-09/CNMP_Guide-d-utilisation-Verification-du-beneficiaire.pdf et https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/tout-ce-quil-faut-savoir-sur-les-virements-bancaires.
    - Proposition d'ajout (un item dans « Mettre en place des réflexes simples ») : « Lire l'alerte de vérification du bénéficiaire : depuis le 9 octobre 2025, votre banque vérifie gratuitement, avant tout virement SEPA, que le nom saisi correspond au titulaire de l'IBAN. Une alerte de non-concordance sur un nouveau RIB doit faire suspendre le paiement. » Ajouter aussi une ligne dans l'encadré final : la VoP ne remplace pas le contre-appel, car un escroc peut ouvrir un compte à un nom proche.
46. **Grav. 1, À DÉCIDER (nuance juridique).** « avoir payé l'escroc ne règle pas, en principe, votre dette » : exact en principe (le paiement doit être fait au créancier), mais l'art. 1342-3 du Code civil valide le paiement de bonne foi à un créancier apparent. Les juges l'appliquent strictement. « En principe » suffit ; une mention de l'exception est possible.
47. Liens : le PDF Cybermalveillance (application/pdf), France Num et le PDF collectivites-locales (application/pdf, 155 Ko, donc pas un faux 200) répondent tous 200.
48. Vérifié dans le code, conforme : CTA « IBAN enregistré une fois dans vos réglages et repris sur chaque facture » (`bankIban`, `lib/facture-contenu.ts`, profil).

## Liens Légifrance

Aucun lien Légifrance dans les 9 articles du lot.

## Changements proposés pour registre.ts

| slug | champ | avant | après | raison |
|---|---|---|---|---|
| deviso-solution-comptable-marche | titre et carte.titre | « Deviso face au marché : notre solution comptable » | « Deviso face au marché : notre outil de gestion » | L'article dit que Deviso n'est « pas une solution de comptabilité complète » ; consigne « outil de gestion ». |
| deviso-solution-comptable-marche | description | « Le marché de la facturation laisse des trous… » | « Le marché des outils de gestion laisse des trous aux petites entreprises. Où se place Deviso, du micro-entrepreneur à la société, et ce qu'il ne prétend pas être. » (à recompter : 150 à 160 caractères) | Ne pas réduire à la facturation. |
| deviso-solution-comptable-marche | h1 | « …notre place et les points de douleur que nous réglons pour votre entreprise » | (À DÉCIDER) « Deviso face au marché : notre place, et les problèmes que nous réglons » | H1 très long ; « points de douleur » est un calque de *pain points*. |
| quand-prendre-expert-comptable-micro | description (137 car.) | « En micro, l'expert-comptable n'est pas obligatoire. La vraie question : à partir de quand est-ce rentable. Les moments qui le justifient. » | « En micro, l'expert-comptable n'est pas obligatoire. La vraie question : à partir de quand est-ce rentable ? TVA, régime réel, embauche : les moments qui le justifient. » | Trop courte ; point d'interrogation manquant. |
| fixer-ses-tarifs-freelance | description (124 car.) | « Calculer son TJM en freelance : 3 méthodes, les erreurs classiques, et comment augmenter ses tarifs sans perdre ses clients. » | « Calculer son TJM en freelance : la méthode du revenu cible, celle du marché et celle de la valeur, les erreurs classiques, et comment augmenter ses tarifs sans perdre ses clients. » (à recompter) | Trop courte. |
| gerer-impayes-freelance | og.titre | « …relance, mise en demeure, tribunal » | inchangé, sinon RAS | La description fait 144 caractères, un peu courte. Proposition : ajouter « et prescription » ou « tribunal compétent ». |
| choisir-statut-micro-ei-eurl-sasu | description (143 car.) | inchangé | ajouter « et le taux réduit d'IS » | Un peu courte. |
| cfe-cotisation-fonciere-entreprises | description (162 car.) et titre | « …paiement avant le 15 décembre. » / « avant quand » | « …paiement au plus tard le 15 décembre. » (161 car., à raccourcir ailleurs de quelques caractères) | Date incluse ; description trop longue. |
| delais-paiement, fraude-faux-rib, micro-ou-reel | | | RAS | Longueurs 156, 149 et 153 caractères. |
| fixer-ses-tarifs-freelance, gerer-impayes-freelance | misAJourLe | 2026-06-29 | date du jour si les corrections sont publiées | Fond modifié dans gerer-impayes. |
| micro-ou-reel-quand-basculer, choisir-statut, cfe, delais-paiement | misAJourLe | | date de publication des corrections | Fond corrigé. |

## Chiffres cités

| Valeur | Article | Contexte |
|---|---|---|
| 30 j / 60 j date de facture / 45 j fin de mois | delais-paiement | délais L441-10, vérifiés F23211 |
| 3 × taux d'intérêt légal ; BCE + 10 points | delais-paiement (+ lib/facture-contenu.ts) | pénalités. Pour info, 2e semestre 2026 : 8,25 % (intérêt légal pro 2,75 %) et 12,40 % (BCE 2,40 %), selon F23211 ; non cités dans l'article |
| 40 € par facture | delais-paiement, gerer-impayes (indirect) | indemnité forfaitaire, vérifiée F23211 |
| 75 000 € / 2 M€, doublés en cas de récidive dans les 2 ans | delais-paiement | amendes délais de paiement, vérifiées F23211 |
| 5 000 € | delais-paiement | procédure simplifiée de recouvrement (F38156 : « moins de 5 000 € ») |
| 5 000 € | cfe | seuil d'exonération de la cotisation minimum (F23547) |
| 10 000 € | gerer-impayes | avocat obligatoire en cas d'opposition (F1746) |
| 1 mois / 3 mois (6 mois avant le 01/09/2026) | gerer-impayes | opposition / signification de l'ordonnance (F1746) |
| 5 ans | gerer-impayes FAQ | prescription : à nuancer, 2 ans contre un particulier (À DÉCIDER) |
| 15 décembre ; 2 novembre 2026 | cfe | échéance CFE ; mise en ligne des avis |
| 203 100 € / 83 600 € | choisir-statut | plafonds micro 2026 (F32353) |
| 15 % jusqu'à 42 500 €, puis 25 % ; CA ≤ 10 M€ ; 75 % de personnes physiques | choisir-statut | taux réduit d'IS (F23575) |
| 10 % du capital et des apports | choisir-statut | dividendes de gérant majoritaire d'EURL soumis à cotisations (non sourcé cette session, exact à ma connaissance) |
| 71 / 50 / 34 % | micro-ou-reel | abattements micro (fiche impots.gouv 2026, minimum 305 €) |
| 9 octobre 2025 | (proposé) fraude-faux-rib | VoP obligatoire |
| 45-55 %, ~45 %, 67 000 €, 50k, 150-300 €, 10-30 % | fixer-tarifs, gerer-impayes | chiffres non sourcés (À DÉCIDER) |

## Couverture

- **Vérifié sur source officielle ouverte cette session** : F23211 (délais, pénalités, 40 €, amendes, taux du 2e semestre 2026), F23547 (CFE), avis CFE 2026 sur impots.gouv, F1746 et F38156 (injonction de payer, avocat, juridiction, signification, procédure simplifiée), F32353 (plafonds 2026), F23575 et la page impots.gouv sur le taux réduit d'IS, fiche impots.gouv 2026 des petites entreprises (abattements, TVA et micro), Livret fiscal BNC (obligations comptables).
- **Vérifié dans le code** : toutes les affirmations sur Deviso des 9 articles (lib/plans.ts, lib/grille-tarifaire.ts, lib/statut-entreprise.ts, lib/relances.ts, lib/facture-contenu.ts, export cabinet, routes du dashboard et du cabinet, page experts-comptables). Aucune fonctionnalité promise absente. Il n'y a pas de formule gratuite, mais un essai de 14 jours : « Essayer Deviso gratuitement » reste acceptable.
- **Liens internes** : routes métiers, /blog, /blog/clauses-devis-freelance : tous présents.
- **Non vérifié** :
  - pages economie.gouv.fr (DGCCRF FAQ, Médiateur, node/36981, fiche DGCCRF prescription) et PDF Banque de France ODP2025 : 403 aux robots, à ouvrir dans Chrome ;
  - prescription de 2 ans : extrait du moteur de recherche seulement ;
  - VoP : sources trouvées, PDF non lus en entier ;
  - PFU et prélèvements sociaux après la LFSS 2026 ;
  - assurance chômage des dirigeants, règle des 10 % de l'EURL.
- ARE et ACRE 2026 : absentes du lot, rien à contrôler.
