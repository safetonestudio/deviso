# Audit blog, lot B (27/11/2026)

Articles : plateforme-agreee-ou-solution-compatible, checklist-reforme-facturation-2026, facturation-electronique-petit-chiffre-affaires, pas-de-plateforme-gratuite-etat, amendes-facturation-electronique-2026, factur-x-explique-freelance.

Source officielle de référence pour les sanctions : Service-Public Entreprendre, actualité A18802 du 20/02/2026, https://entreprendre.service-public.gouv.fr/actualites/A18802?lang=fr (cite la loi n° 2026-103 du 19 février 2026, art. 123).

## Constats

### amendes-facturation-electronique-2026

1. Gravité 1, CORRIGÉ. Sanction « réception » mal décrite (page, encadré « réponse », tableau SANCTIONS, FAQ JSON-LD).
   - Avant : « Le défaut de réception est sanctionné de 500 €, porté à 1 000 € en cas de réitération dans les trois mois. » ; tableau : « Défaut de réception d'une facture électronique / 500 €, puis 1 000 € si réitération sous 3 mois / au cas par cas ».
   - Après : manquement = ne pas recourir à une plateforme agréée pour recevoir ; mise en demeure de 3 mois, puis 500 € si rien n'est fait, nouvelle mise en demeure de 3 mois, puis 1 000 €, et 1 000 € de nouveau tous les trois mois tant que la situation n'est pas régularisée ; plafond : aucun plafond annuel prévu par la source.
   - Source : A18802, rubrique « Omission ou manquement à recourir à une plateforme agréée pour recevoir des factures électroniques » : « l'assujetti sera mis en demeure de s'y conformer dans un délai de 3 mois », « une amende de 500 € sera prononcée », « Une nouvelle amende de 1000 € sera encourue tous les trois mois tant que la situation n'est pas régularisée. »

2. Gravité 1, À DÉCIDER. Portée de la tolérance de première infraction (encadré « La tolérance que presque personne ne cite » et FAQ « Vais-je être sanctionné dès le premier oubli ? »).
   - Avant : « Aucune sanction n'est appliquée au premier manquement de l'année civile en cours et des trois précédentes… », présenté comme valant pour toutes les sanctions.
   - Constat : A18802 ne place cette tolérance que sous la rubrique « Non-transmission des données de transaction et de paiement » (e-reporting). Elle ne peut pas valoir pour l'absence de plateforme (mécanisme de mise en demeure). Texte consolidé de l'art. 1737 CGI non lu (Légifrance bloqué) : impossible de dire si elle couvre aussi l'amende de 50 € par facture.
   - Proposition : « Pour l'e-reporting, aucune amende n'est appliquée à la première infraction de l'année civile en cours et des trois précédentes, si elle est réparée spontanément ou dans les trente jours suivant une première demande de l'administration. », puis vérifier dans Chrome l'art. 1737 en vigueur pour l'amende de 50 €.

3. Gravité 2, À DÉCIDER. « une grande partie du web affiche encore les anciens » (chapô), « beaucoup de pages n'ont pas été mises à jour » (FAQ), registre carte.resume « les montants que la moitié du web ignore encore » : aucune mesure. Proposition : « certaines pages ».

4. Gravité 4, À DÉCIDER. Lien Légifrance https://www.legifrance.gouv.fr/eli/loi/2026/2/19/CPPX2524517L/jo/article_123 : prétend citer l'art. 123 de la loi n° 2026-103 du 19/02/2026 ; c'est le BON article pour l'affirmation (relèvement des sanctions), A18802 citant « LOI n° 2026-103 du 19 février 2026 de finances pour 2026 - Article 123 ». Non ouvert (consigne). Le lien KPMG (mars 2026) est vivant mais ne donne aucun montant (il dit seulement que l'article vise à « renforcer le dispositif de sanctions ») : source non officielle, à garder en complément.

5. Gravité 6, PROPOSÉ registre. description et og.description : « 500 € en réception » est trompeur (500 € après une mise en demeure de trois mois restée sans effet, pour absence de plateforme agréée).

### checklist-reforme-facturation-2026 (le plus fautif du lot)

6. Gravité 1, CORRIGÉ. Calendrier ETI et seuils de taille faux.
   - Avant : « Grande entreprise (CA > 250M€) → obligation émission : sept. 2026 », « ETI (50M–250M€ CA) → obligation émission : déc. 2026 » ; tableau : « 1er déc. 2026 / ETI : émission e-factures obligatoire ».
   - Après : GE « 5 000 salariés ou plus, ou CA > 1,5 Md€ et bilan > 2 Md€ », ETI « 250 à 4 999 salariés, ou moins de 250 salariés avec CA > 50 M€ et bilan > 43 M€ », émission sept. 2026 pour les deux ; ligne « 1er déc. 2026 » supprimée, GE et ETI réunies au 1er sept. 2026. Bandeau du haut : « Grandes entreprises → e-facturation obligatoire » devient « Grandes entreprises et ETI → … ».
   - Source : https://entreprendre.service-public.gouv.fr/actualites/A18953?lang=fr (02/09/2026) : l'émission « s'appliquera dès le 1er septembre 2026 aux grandes entreprises » et aux ETI ; GE dont l'« effectif est supérieur ou égal à 5 000 personnes » ; ETI de 250 à 4 999 salariés, ou moins de 250 avec CA > 50 M€ et bilan > 43 M€. Note : la lecture automatique de la page rend « CA > 1,5 Md€ ou bilan > 2 Md€ » pour la GE ; j'ai écrit « et », complément logique de la définition ETI (décret n° 2008-1354). À relire dans Chrome.

7. Gravité 1, CORRIGÉ. E-reporting daté de 2027 « pour tous ».
   - Avant : « 1er sept. 2027 … E-reporting B2C/international obligatoire pour tous ».
   - Après : e-reporting au 1er sept. 2026 pour GE et ETI, au 1er sept. 2027 pour PME, TPE, micro.
   - Source : https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique (modifiée le 26/05/2026) : « La transmission de données à l'administration (e-reporting) suit le même calendrier. »

8. Gravité 1, CORRIGÉ. Franchise en base présentée comme hors e-invoicing.
   - Avant : « Si vous êtes en franchise de TVA …, vous devrez probablement faire de l'e-reporting simplifié. Si vous avez dépassé les seuils et êtes passé au régime réel, vous êtes pleinement concerné par l'e-invoicing. » et « Si CA > seuil franchise → vous devenez assujetti TVA → e-invoicing plein ».
   - Après : « Même en franchise de TVA …, vous êtes concerné : la réforme vise aussi les entreprises en franchise en base. Vous devez recevoir vos factures électroniques depuis le 1er septembre 2026, et émettre au format électronique celles destinées à des entreprises à partir du 1er septembre 2027. » ; « Si CA > seuil franchise → vous facturez la TVA ; l'obligation de facturation électronique, elle, reste la même ».
   - Sources : impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique : « y compris les entreprises bénéficiant du régime de la franchise en base » ; https://entreprendre.service-public.gouv.fr/vosdroits/F39785 (vérifié le 07/08/2026) : « y compris celles bénéficiant de la franchise en base de TVA ».
   - Restant À DÉCIDER : le détail « Si franchise → e-reporting simplifié (modalités à préciser par décret) », non vérifié. Proposition : « Ventes aux particuliers ou à l'étranger → e-reporting, au même calendrier que l'émission ».
   - Seuils franchise cités (37 500 / 41 250 € services) : exacts, https://entreprendre.service-public.gouv.fr/vosdroits/F21746 : « Pour l'année 2026, les seuils de franchise en base de TVA française applicables restent inchangés » (37 500 € / 41 250 €).

9. Gravité 1, CORRIGÉ. Mentions obligatoires fausses (SIRET, bon de commande).
   - Avant : « SIRET, N° de TVA, adresse complète, numéro de commande si applicable » ; détails « SIRET (pas seulement SIREN) », « Numéro de bon de commande du client (souvent exigé en B2B) ».
   - Après : les quatre nouvelles mentions (SIREN du client, adresse de livraison si différente, nature des opérations, option débits) et « Numéro de bon de commande, lorsque l'acheteur l'a établi au préalable ». Le détail « Numéro de TVA intracommunautaire (si applicable) » a été remplacé (mention ancienne, pas nouvelle) : à réintroduire si vous le souhaitez.
   - Source : https://entreprendre.service-public.gouv.fr/vosdroits/F23208 (vérifié le 07/08/2026) : « Numéro Siren du client (s'il s'agit d'une entreprise) », « Adresse de livraison des biens si elle est différente de l'adresse du client », « Information relative à la nature des opérations facturées », « Option pour le paiement de la taxe d'après les débits » ; bon de commande « Lorsqu'il a préalablement été établi par l'acheteur ». Le SIRET n'y est pas exigé.
   - À DÉCIDER : l'action renvoie à « l'article 242 nonies A du CGI » ; c'est l'article 242 nonies A de l'annexe II du CGI. Proposition : « article 242 nonies A de l'annexe II du CGI ».

10. Gravité 1, CORRIGÉ. Formats : XRechnung présenté comme admis ; Factur-X « format pivot ».
   - Avant : « XRechnung, UBL = autres formats admis mais moins courants en France » ; « Factur-X … est le format pivot de la réforme ».
   - Après : « UBL et CII = les deux autres formats acceptés, en XML seul, sans PDF lisible » ; Factur-X « l'un des trois formats acceptés par la réforme, avec UBL et CII, et le plus simple pour les PME, les TPE et les indépendants, car il reste lisible comme un PDF ».
   - Source : impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique : « UBL, CII ou tout format mixte composé d'un fichier de données structurées et d'un fichier image ».
   - Restant À DÉCIDER : « Factur-X MINIMUM = très simplifié, limité à certains cas ». À ma connaissance MINIMUM et BASIC WL ne sont pas acceptés comme facture dans la réforme (spécifications externes DGFiP), non vérifié cette session. Proposition : « Factur-X MINIMUM et BASIC WL = profils trop pauvres, non acceptés comme facture électronique ».

11. Gravité 1, CORRIGÉ. PPF « abandonné » ; « PDP certifiées » qui transmettent « les e-factures à la DGFiP ».
   - Avant : « Le Portail Public de Facturation (PPF) est abandonné. Seules les PDP (plateformes privées certifiées) peuvent transmettre les e-factures à la DGFiP. » ; « le PPF est abandonné depuis oct. 2024 ».
   - Après : PPF « ne fait plus transiter les factures : il est recentré sur l'annuaire et la collecte des données » ; « Seules les plateformes agréées (anciennement appelées PDP), immatriculées par l'administration fiscale, peuvent transmettre vos e-factures à vos clients et les données à la DGFiP » ; « le PPF n'assure plus l'échange des factures depuis le recentrage annoncé en octobre 2024 ».
   - Sources : https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees : « Il s'agit d'un opérateur de dématérialisation qui a fait l'objet d'une procédure d'immatriculation par l'administration » ; sans immatriculation, l'opérateur ne peut transmettre ni aux plateformes des clients ni les données à l'administration. Recentrage du PPF autour de l'annuaire annoncé par communiqué du 16/10/2024 (document DGFiP repéré en recherche ; economie.gouv.fr renvoie 403 aux robots, page « Qu'est-ce que l'annuaire de la facturation électronique ? » non ouverte).
   - Restant À DÉCIDER : titre et action de l'item 03, et lien « Choisir sa PDP (plateforme agréée) », gardent « PDP ». Proposition : « plateforme agréée ».

12. Gravité 6, CORRIGÉ / À DÉCIDER. « Mis à jour juillet 2026 » écrit en dur alors que registre.misAJourLe = 2026-11-23 : passé à « novembre 2026 ». Le h1 est aussi en dur (« Checklist réforme facturation 2026 : 7 points à vérifier pour être prêt ») et diffère du registre (« … : êtes-vous prêt ? ») : À DÉCIDER (utiliser a.h1 comme les autres articles).

13. Gravité 3, À DÉCIDER. Statuts « DEPOSEE, VALIDEE, REJETEE » (item 07) : « VALIDEE » n'est pas, à ma connaissance, un statut obligatoire du cycle de vie (Déposée, Rejetée, Refusée, Encaissée). Non vérifié sur source officielle.

14. Gravité 3, À DÉCIDER. Bloc « Votre score de préparation » (barre à 0 %, « Cochez les points au fur et à mesure dans cet article ») : aucune case à cocher n'existe sur la page. Proposition : retirer le bloc ou ajouter les cases.

15. Gravité 3, À DÉCIDER. Item 07 : « réaliser au moins 5 factures de test avec votre PDP avant septembre » (septembre 2026 passé ; proposer « avant votre date d'obligation ») et « Demander à votre éditeur l'accès à un environnement de test (sandbox) » : Deviso n'en offre pas aux clients (rien dans app/), un lecteur Deviso ne pourrait pas le faire. Bloc final « E-reporting géré automatiquement » : cohérent avec le code (lib/superpdp-sync.ts, lib/cadre-facturation.ts).

### amendes-facturation-electronique-2026 (suite)

16. Gravité 1, À DÉCIDER. Omission : la tolérance de démarrage annoncée par le ministre n'est pas mentionnée dans l'article sur les amendes, alors que l'article petit-chiffre-affaires la cite.
   - Source : communiqué n° 898 du 11/07/2026, https://presse.economie.gouv.fr/?p=181381 : « Il n'y aura pas, au démarrage de cette réforme, de sanctions pour les entreprises de bonne foi » « qui rencontrent une difficulté et qui engagent le travail nécessaire pour régulariser leur situation ». Pas de date de fin dans le communiqué (des sites tiers parlent de « fin 2026 », non confirmé sur source officielle ouverte).
   - Proposition : ajouter un paragraphe après la tolérance de première infraction : « Au démarrage de la réforme, l'administration a aussi annoncé qu'elle ne sanctionnerait pas les entreprises de bonne foi qui rencontrent une difficulté et engagent le travail nécessaire pour régulariser (communiqué du 11 juillet 2026). Ce n'est ni un report ni une suspension : l'obligation s'applique. »

17. Gravité 3, À DÉCIDER. « un seul manquement, une fois la tolérance consommée, coûte souvent plus cher qu'une année entière d'un outil adapté » (et même idée dans petit-chiffre-affaires : « Une seule sanction coûte généralement plus cher qu'une année d'outil adapté », « le premier manquement coûte donc presque toujours plus cher que l'année entière d'une offre adaptée ») : faux pour l'amende de 50 € face à Deviso Solo à 24 € HT par mois (lib/grille-tarifaire.ts : 288 € HT par an, 230,40 € en annuel). Vrai seulement pour 500 €. Proposition : « un seul manquement d'e-reporting (500 €) coûte plus cher qu'une année d'un outil adapté ».

### pas-de-plateforme-gratuite-etat

18. Gravité 1, CORRIGÉ. « n'ajouter l'émission que le jour où elle devient obligatoire pour vous, en 2027 » (vrai seulement pour PME, TPE, micro).
   - Après : « … le 1er septembre 2027 si vous êtes une PME, une TPE ou une micro-entreprise. »
   - Source : impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique : GE et ETI « devront émettre l'intégralité de leurs factures au format électronique à cette date » (1er septembre 2026), petites et micro-entreprises « auront jusqu'au 1er septembre 2027 ».

19. Vérifié, rien à corriger : rôle du PPF (abandon de l'échange gratuit, recentrage annuaire et concentrateur) conforme au lien KPMG (vivant, 22/10/2024 : le portail « devait permettre, gratuitement, d'envoyer et de recevoir des factures », communiqué du ministère du 15/10/2024, confirmation DGFiP du 16/10/2024) et aux documents DGFiP. Source KPMG non officielle : À DÉCIDER, la doubler par une source officielle (economie.gouv.fr « Qu'est-ce que l'annuaire de la facturation électronique ? », que je n'ai pas pu ouvrir, 403).

20. Gravité 4, À DÉCIDER. Lien economie.gouv.fr « Coup d'envoi de la réforme » (aussi dans factur-x-explique-freelance) : renvoie 403 aux robots, non vérifié. À ouvrir dans Chrome. Le lien impots.gouv.fr « Facturation électronique et plateformes agréées » est cité pour le « rôle du PPF », mais la page ne parle pas du PPF (elle parle des plateformes agréées et des solutions compatibles) : libellé à corriger en « (rôle des plateformes agréées et des solutions compatibles) ».

21. Gravité 2, À DÉCIDER. « La réception est très souvent gratuite », « Plusieurs plateformes ont une offre d'émission gratuite », « Une partie du web qui traite ce sujet est financée par l'affiliation » : affirmations de marché sans source. Pas officielles par nature ; garder en formulation prudente ou citer des exemples.

### plateforme-agreee-ou-solution-compatible

22. Gravité 3, À DÉCIDER. « Nous ne transmettons rien directement à l'administration : c'est Super PDP qui dépose vos factures et transmet les données. » Le code transmet les factures aux clients publics directement par Chorus Pro (lib/chorus-pro.ts, lib/chorus-etats.ts ; mémoire « B2G par Chorus Pro direct par défaut »). Chorus Pro n'est pas l'administration fiscale, mais « c'est Super PDP qui dépose vos factures » est inexact pour le B2G. Même formulation sur /conformite (hors lot). Proposition : « Entre entreprises, c'est Super PDP qui dépose vos factures et transmet les données à l'administration fiscale ; vers un client public, Deviso dépose la facture sur Chorus Pro, le portail de l'État prévu pour cela. »

23. Gravité 2, À DÉCIDER. « Une vingtaine de sites se sont créés autour de cette réforme » et « le nombre de plateformes agréées y est annoncé entre 137 et 166 selon les pages » : non sourcé, chiffres datés. Proposition : « le nombre de plateformes agréées varie d'un site à l'autre ».

24. Vérifié, rien à corriger : citations de la DGFiP (« un opérateur de dématérialisation qui a fait l'objet d'une procédure d'immatriculation par l'administration », durée trois ans renouvelable ; « À défaut d'immatriculation par l'administration fiscale, cet opérateur n'aura pas la qualité de plateforme agréée… ») conformes à https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees. Les deux listes (définitive / sous réserve) et les formats ODS, XLSX, PDF conformes à https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees (modifiée le 23/11/2026). Note : la citation tronque la fin de la phrase officielle, qui interdit aussi de recevoir pour le compte de l'entreprise et de transmettre les données à l'administration ; le tableau CAPACITES le dit déjà.

25. Gravité 3, À DÉCIDER. Table CAPACITES : « Générer un fichier au format Factur-X, UBL ou CII : plateforme agréée oui ». Une plateforme agréée peut convertir (impots.gouv.fr : elle peut « convertir la facture établie par le fournisseur dans un format qui convienne au client ») ; OK. Rien à changer.

### facturation-electronique-petit-chiffre-affaires

26. Gravité 1, CORRIGÉ. Même erreur sur la sanction de réception (encadré « Le vrai risque… », FAQ « Quelles sont les sanctions », « en bref »).
   - Avant : « Un défaut de réception est sanctionné de 500 €, puis de 1 000 € en cas de réitération dans les trois mois. » ; « 500 € par défaut de réception ».
   - Après : « Ne pas recourir à une plateforme agréée pour recevoir vos factures vaut une mise en demeure de trois mois, puis une amende de 500 €, puis 1 000 € tous les trois mois tant que la situation n'est pas régularisée. » ; « 500 € pour une absence de plateforme de réception après mise en demeure ».
   - Source : A18802 (voir constat 1).

27. Gravité 4, CORRIGÉ. Source « DGFiP, facturation électronique, calendrier et obligations », https://www.impots.gouv.fr/facturation-electronique : redirige (302) vers collectivites-locales.gouv.fr/facturation-electronique, lien mort connu. Remplacé par https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique, qui donne réception 2026 pour tous et émission 2027 pour petites et micro-entreprises.

28. Gravité 4, À DÉCIDER. Lien Légifrance https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052100000 libellé « loi n° 2026-103 du 19 février 2026 de finances pour 2026 », précision « article 123 : montants des sanctions ». Bon article pour l'affirmation (art. 123), mais l'identifiant JORFTEXT rond (…052100000) semble inventé et diffère de celui de l'ELI utilisé dans l'article amendes (eli/loi/2026/2/19/CPPX2524517L/jo/article_123). À refaire dans Chrome, idéalement le lien ELI vers l'article 123.

29. Gravité 3, CORRIGÉ. « L'émission a encore près d'un an devant elle » (au 27/11/2026, il reste un peu plus de neuf mois avant le 1er septembre 2027) : « un peu moins d'un an ».

30. Gravité 3, À DÉCIDER. CTA « Un tarif qui suit votre volume, pas l'inverse » / « Deviso est pensé pour les activités qui émettent quelques factures par mois : la conformité d'abord, sans payer pour un outil de gestion dont vous n'avez pas l'usage. » Contradictions : (a) Deviso a un abonnement fixe (Solo 24 € HT/mois, Pro 44 € HT/mois, lib/grille-tarifaire.ts), pas un tarif au volume ; (b) l'article dit que l'abonnement à 15-30 €/mois est « cher pour 800 € de CA annuel » et « n'a rien d'obligatoire », or Deviso Solo est exactement dans cette fourchette ; (c) la phrase oppose Deviso à « un outil de gestion », contraire au positionnement « outil de gestion d'entreprise ». Proposition : « Un outil de gestion complet, conformité comprise » / « Deviso réunit devis, factures, achats et factures fournisseurs, relances, suivi du chiffre d'affaires et de la TVA, avec la plateforme agréée Super PDP comprise dans l'abonnement. Si vous n'avez besoin que de recevoir vos factures, une offre de réception seule peut suffire. »

31. Vérifié : tolérance du guide de démarrage DGFiP de juillet 2026 (« ni d'un report, ni d'une suspension ») : guide publié le 10/07/2026 et communiqué du 11/07/2026 (https://presse.economie.gouv.fr/?p=181381) ; la formule « ne reporte ni ne suspend » est rapportée par la recherche dans le guide PDF (https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf), que je n'ai pas pu lire en texte (PDF sans extracteur). Conforme sur le fond, à relire si besoin.

32. Gravité 2, À DÉCIDER. « une grande partie des très petites activités n'a, en réalité, aucun abonnement à payer », « Plusieurs plateformes ouvrent la réception sans frais », « Les 15 à 30 € par mois », « La question revient sans cesse » : affirmations de marché non sourcées. Les quatre nouvelles mentions citées sont exactes (F23208).

### factur-x-explique-freelance

33. Gravité 4, CORRIGÉ. Source « impots.gouv.fr, Facturation électronique et plateformes agréées (formats acceptés et fonctionnement) » : la page ne cite aucun format. Remplacée par https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique, libellé « impots.gouv.fr, Je découvre la facturation électronique (formats acceptés, calendrier) », qui dit : « UBL, CII ou tout format mixte composé d'un fichier de données structurées et d'un fichier image ».

34. Gravité 5, CORRIGÉ. « Un total affiché à 1 200 € et un total caché à 1 000 € produirait » devient « produiraient ».

35. Vérifié : « trois formats acceptés » (Factur-X, UBL, CII), calendrier réception 2026 / émission 2027 pour TPE, PME et micro, PDF/A-3 + XML EN 16931 : conformes (impots.gouv.fr ci-dessus). Remarque À DÉCIDER : Factur-X est un « format mixte » parmi d'autres possibles selon le texte officiel ; « trois formats » est la présentation usuelle du socle, acceptable.

## Changements proposés pour registre.ts

| slug | champ | avant | après | raison |
|---|---|---|---|---|
| amendes-facturation-electronique-2026 | description (169 car.) | « Les montants réels depuis le 1er septembre 2026 : 50 € par facture, 500 € par e-reporting, 500 € en réception, plafond 15 000 €. Ce que le web n'a pas encore mis à jour. » | « Montants en vigueur : 50 € par facture, 500 € par e-reporting, 500 € puis 1 000 € sans plateforme de réception après mise en demeure, plafond 15 000 € par an. » (158) | « 500 € en réception » faux (A18802) ; longueur |
| amendes-facturation-electronique-2026 | og.description | « … 500 € en réception, plafond 15 000 € par an. La loi de finances 2026 a tout changé, et presque personne ne l'a répercuté. » | « 50 € par facture, 500 € par e-reporting, 500 € puis 1 000 € sans plateforme de réception après mise en demeure. Ce que la loi de finances 2026 a changé. » | même raison ; « presque personne » non sourcé |
| amendes-facturation-electronique-2026 | carte.resume | « … les montants que la moitié du web ignore encore » | « 50 € par facture, 500 € par e-reporting, plafond 15 000 € : les montants en vigueur et leur source » | chiffre non sourcé |
| amendes-facturation-electronique-2026 | misAJourLe | 2026-09-27 | 2026-11-27 | contenu modifié |
| checklist-reforme-facturation-2026 | description (147) | « … e-reporting, mentions légales. » | « Réforme de la facturation électronique : 7 points à vérifier pour être prêt. Logiciel, format Factur-X, plateforme agréée, e-reporting, mentions obligatoires. » (158) | longueur 150-160 |
| checklist-reforme-facturation-2026 | misAJourLe | 2026-11-23 | 2026-11-27 | contenu modifié |
| facturation-electronique-petit-chiffre-affaires | description (167) | « Vous facturez quelques milliers d'euros par an et la réforme vous inquiète. Ce qu'elle vous impose réellement, ce qu'elle ne vous impose pas, et les options gratuites. » | « Vous facturez quelques milliers d'euros par an ? Ce que la réforme vous impose vraiment, ce qu'elle ne vous impose pas, et les options gratuites qui existent. » (≈155) | longueur |
| facturation-electronique-petit-chiffre-affaires | misAJourLe | 2026-09-12 | 2026-11-27 | contenu modifié |
| pas-de-plateforme-gratuite-etat | description (164) | « … et pourquoi tout le monde passe par un opérateur privé. » | « Le portail public gratuit de facturation a été abandonné en 2024. Ce qu'il devait être, ce qu'il est devenu, et pourquoi tout passe par un opérateur privé. » (155) | longueur |
| plateforme-agreee-ou-solution-compatible | description (164) | « La distinction est officielle, pas marketing : une solution compatible ne peut ni transmettre ni recevoir vos factures. Comment vérifier où se situe votre logiciel. » | « La distinction est officielle : une solution compatible ne transmet ni ne reçoit vos factures elle-même. Comment vérifier réellement où se situe votre logiciel. » (≈159) | longueur |
| factur-x-explique-freelance | description (172) | « … et pourquoi vous n'avez rien à faire à la main. » | « Factur-X, c'est un PDF normal doublé d'un fichier que les logiciels lisent. À quoi ça sert, ce que ça change pour vous, et pourquoi rien ne se fait à la main. » (≈157) | longueur |
| factur-x-explique-freelance | misAJourLe | 2026-09-27 | 2026-11-27 | source corrigée (facultatif) |

## Chiffres cités

| valeur | article | contexte |
|---|---|---|
| 50 € par facture, plafond 15 000 €/an | amendes, petit-CA | défaut d'émission électronique (A18802, vérifié) |
| 500 € par transmission, plafond 15 000 €/an | amendes, petit-CA, checklist | e-reporting (A18802, vérifié) |
| 250 € et 15 € | amendes | anciens montants avant LF 2026 (A18802 : « de 15 € à 50 € », « de 250 € à 500 € », vérifié) |
| mise en demeure 3 mois, 500 €, puis 1 000 € tous les 3 mois, sans plafond annuel | amendes, petit-CA (après correction) | absence de plateforme agréée pour recevoir (A18802) |
| tolérance 1re infraction : année en cours + 3 précédentes, 30 jours | amendes | A18802, rubrique e-reporting seulement |
| loi n° 2026-103 du 19/02/2026, art. 123 | amendes, petit-CA | base des sanctions (A18802) |
| 1er sept. 2026 réception tous ; émission et e-reporting GE/ETI | tous | impots.gouv.fr, A18953 |
| 1er sept. 2027 émission et e-reporting PME, TPE, micro | tous | idem |
| GE ≥ 5 000 salariés ou CA > 1,5 Md€ et bilan > 2 Md€ ; ETI 250-4 999 salariés (ou < 250 avec CA > 50 M€ et bilan > 43 M€) | checklist | A18953 (voir réserve « et »/« ou ») |
| franchise TVA services 37 500 € / 41 250 € | checklist | F21746, seuils 2026 inchangés |
| immatriculation 3 ans renouvelable | plateforme-agreee | impots.gouv.fr |
| 137 à 166 plateformes selon les comparateurs | plateforme-agreee | non sourcé |
| 15 à 30 € par mois (abonnement complet) | petit-CA | non sourcé ; Deviso Solo 24 € HT |
| 4 nouvelles mentions (SIREN client, adresse de livraison, nature des opérations, option débits) | checklist (après correction), petit-CA | F23208 |
| communiqué du 16/10/2024 (recentrage PPF), « octobre 2024 » | pas-de-plateforme, petit-CA, checklist | KPMG 22/10/2024 + documents DGFiP |
| guide DGFiP juillet 2026, communiqué 11/07/2026 | petit-CA | presse.economie.gouv.fr |

## Couverture

- Lu en entier : les six page.tsx du lot et leurs entrées dans registre.ts ; vérifié lib/grille-tarifaire.ts, lib/plans.ts (e-reporting, accès comptable), app/conformite, présence de lib/chorus-pro.ts, routes internes (toutes les href="/blog/…" et "/conformite" du lot existent).
- Sources officielles ouvertes : A18802, A18953, F39785, F23208, F21746 (Service-Public Entreprendre) ; impots.gouv.fr : facturation-electronique-et-plateformes-agreees, je-consulte-la-liste-des-plateformes-agreees, professionnel/je-decouvre-la-facturation-electronique, bannière du guide ; presse.economie.gouv.fr communiqué 11/07/2026 ; KPMG (2024 et 2026).
- Non vérifié : textes consolidés des art. 1737 et 1788 D CGI (Légifrance bloqué, consigne) ; economie.gouv.fr (403 aux robots, deux liens du lot) ; guide pratique DGFiP en PDF (pas d'extracteur PDF disponible, contenu connu seulement par la recherche) ; profils Factur-X acceptés (MINIMUM, BASIC WL) et statuts du cycle de vie (spécifications externes DGFiP non ouvertes).
- Contrôles : `npx tsc --noEmit -p .` sans erreur ; check-tirets et check-emoji propres. Aucun commit, registre.ts non modifié.
