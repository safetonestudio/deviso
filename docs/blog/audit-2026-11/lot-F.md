# Audit blog, lot F (articles experts-comptables, index, composants, registre)

Rapport écrit au fil de l'eau (27/11/2026).

## Constats

Sources officielles ouvertes pendant la session (texte extrait des PDF) :
- Guide pratique de démarrage DGFiP (pied de page « Juillet 2026 ») : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf
- FAQ « Je découvre » (« Version du 01/09/2026 ») : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf
- FAQ « J'approfondis » (« Version du 01/09/2026 » ; l'URL sert un PDF) : https://www.impots.gouv.fr/foire-aux-questions-japprofondis-la-facturation-electronique
- BOFiP BOI-TVA-DECLA-30-20-10-30 (version en vigueur depuis le 29/06/2022) : https://bofip.impots.gouv.fr/bofip/13244-PGP.html/identifiant=BOI-TVA-DECLA-30-20-10-30-20220629
- Service-public F23208 (vérifié le 07/08/2026) : https://entreprendre.service-public.gouv.fr/vosdroits/F23208

Bilan sur le fond : les trois articles comptables (trajectoire, mandat, portefeuille) suivent les sources de très près. J'ai vérifié chaque renvoi : numéros de question du guide (1, 17 à 20, 25 à 29) et de la FAQ (1.1, 1.3, 2.1, 2.2, 3.4, 3.5, 7.1, 9.3, 10.x ; pour « J'approfondis » : 1.1, 2.1, 2.2, 3.3, 4.1), seuils LME, date d'appréciation de la taille, 26 puis 34 données, quatre mentions, rythme du e-reporting, mise en demeure de trois mois (art. 1737 IV bis), art. 1788 D, absence d'effet de l'entrée anticipée sur le e-reporting. Aucune erreur de date ni de seuil.

Mandat de facturation : le BOFiP cité par l'article, BOI-TVA-DECLA-30-20-10-30 « Personnes tenues de délivrer des factures », est le BON document (§ 70 à 290 : mandat de facturation). La commande mentionnait BOI-TVA-DECLA-30-20-10-20 ; je ne l'ai pas ouvert, mais c'est bien le -10-30 qui contient le mandat, et il n'y a donc rien à changer dans l'article. Les conditions citées par l'article correspondent toutes : antériorité § 110, aucun formalisme § 120, preuve écrite recommandée § 130, rectificatives § 140, acceptation expresse ou tacite § 150 et 160, responsabilité § 170 et 180, mention recommandée § 210.

Affirmations sur Deviso, vérifiées dans le code :
- cockpit en lecture seule (app/(cabinet)/cabinet/confiance, lib/droits.ts) et gratuit pour le cabinet (confiance ; lib/plans.ts, accesComptable dans solo et pro) ;
- anomalies (lib/cabinet-dossiers.ts) : non raccordé, factures refusées, rejetées ou en erreur, facture B2B sans SIREN client, TVA facturée en franchise, périodicité absente, SIRET manquant ou invalide, n° de TVA incohérent, trous de numérotation ;
- dossiers triés par urgence (cabinet/dossiers) et calendrier de TVA par périodicité (lib/cabinet-tva-calendrier.ts) ;
- signalement que le client voit sur son tableau de bord (components/SignalementsClient.tsx dans app/(dashboard)/dashboard) ;
- exports FEC et Quadra (app/api/cabinet/export, lib/export-quadra.ts ; Cegid TRA n'est cité nulle part) ;
- livre des recettes (app/(dashboard)/livre-recettes), plusieurs taux de TVA (plans.ts), programme pilote annoncé sur /experts-comptables.

Aucune fonctionnalité promise qui n'existe pas.

### F1. mandat-facturation-electronique-expert-comptable, gravité 1, CORRIGÉ
- Avant (FAQ ; pas de JSON-LD distinct dans le fichier, la FAQ est passée au composant) : « Un écrit est impératif lorsque le mandataire est établi hors de l'Union européenne. »
- Après : « Un écrit est impératif lorsque le mandataire est établi hors de l'Union européenne, dans un pays avec lequel il n'existe aucun instrument juridique d'assistance mutuelle. »
- Source : BOI-TVA-DECLA-30-20-10-30, titre II.B.3 « Cas particulier du mandat de facturation confié à un client ou un tiers établi hors de l'Union européenne » ; § 240 : « est établi dans un pays avec lequel il n'existe aucun instrument juridique relatif à l'assistance mutuelle […] le mandat de facturation obéit à des modalités particulières » ; § 260 : « Le mandat ainsi conclu doit impérativement prendre la forme d'un contrat écrit. »

### F2. experts-comptables-equiper-clients-micro et portefeuille-clients-echeance-septembre-2027, gravité 4, CORRIGÉ
- Libellé de la source F23208. Avant : « Service-public.gouv.fr, Facturation électronique entre entreprises ». Après : « Service-public.gouv.fr, Tout savoir sur la facturation », qui est le titre réel de la page. Le calendrier que l'article attribue à la page y figure bien.

### F3. experts-comptables-equiper-clients-micro, gravité 3 (positionnement), À DÉCIDER
- Avant : « un outil de devis et de facturation conçu pour les entreprises de toute forme »
- Proposition : « un outil de gestion (devis, factures, achats, relances, suivi du chiffre d'affaires et de la TVA) conçu pour les entreprises de toute forme »
- La FAQ de la page dit aussi « par rapport à un simple outil de facturation ». On peut garder cette formule : c'est une comparaison, pas la présentation de Deviso.

### F4. experts-comptables-equiper-clients-micro, gravité 1 (précision), À DÉCIDER
- Avant (encadré) : « les assujettis à la TVA doivent pouvoir recevoir des factures électroniques, et l'émission arrive pour tous » ; FAQ : « et l'émission se généralise ».
- Proposition : « les entreprises assujetties à la TVA établies en France doivent pouvoir recevoir des factures électroniques, et l'émission devient obligatoire pour toutes au plus tard le 1er septembre 2027 ». Le texte actuel n'est pas faux, mais il est flou pour un public d'experts-comptables : il ne donne pas l'échéance, et l'émission ne vaut que pour les opérations entre assujettis établis en France (le reste relève du e-reporting).
- Source : FAQ « Je découvre » 5.1 : « Les petites, moyennes et micro-entreprises seront, quant à elles tenues, d'émettre leurs factures au format électronique au plus tard le 1er septembre 2027 » ; 7.1 pour le e-reporting.

### F5. portefeuille-clients-echeance-septembre-2027, gravité 1, À DÉCIDER
- Avant (ligne du tableau) : « Micro-entrepreneur en franchise en base de TVA | Émission, et e-reporting à rythme bimestriel s'il a des clients particuliers »
- Problème : la ligne oublie les clients étrangers (e-reporting des transactions) et les données de paiement des prestations de services. La FAQ « J'approfondis » 4.1 prend justement l'exemple du franchisé : « si vous êtes franchisé en base, vous les transmettrez tous les deux mois (bimestre civil) ». Elle vise des données qui « concernent uniquement les prestations de services, qu'elles aient donné lieu à facture ou non, entre assujettis ou avec un non-assujetti ». En revanche, la FAQ « Je découvre » 10.1 ne retient que les opérations dont la TVA est exigible à l'encaissement, ce qui reste ambigu pour un franchisé. À trancher, idéalement avec la fiche DGFiP sur les données de paiement utilisée dans le commit 209c560.
- Proposition : « Émission, et e-reporting bimestriel s'il a des clients particuliers ou étrangers, ou s'il facture des prestations de services (données de paiement) ».

### F6. mandat-facturation-electronique-expert-comptable, gravité 1, À DÉCIDER (Légifrance, non ouvert selon la consigne)
- L'encadré « Le mandat présumé ne couvre pas tout » et la section sur la lettre de mission reposent sur l'article 151 du décret n° 2012-432 : contrat écrit, lettre de mission qui fait état du mandat et de sa durée, présomption de mandat (adhésion à une téléprocédure, choix d'un partenaire de télétransmission). Je n'ai pas pu lire la version en vigueur. Une recherche montre que le décret a été modifié en 2014 (n° 2014-912, alinéa 3 de l'art. 151) et en 2024 (n° 2024-138, en vigueur le 26/02/2024).
- À confirmer dans Chrome : la présomption de mandat figure-t-elle bien à l'article 151, dans sa version en vigueur, et sa liste ne vise-t-elle toujours pas la plateforme agréée ? Si elle est dans un autre article, il faut corriger la phrase « L'article 151 […] présume » et la source.

### F7. portefeuille-clients-echeance-septembre-2027, gravité 3, À DÉCIDER (péremption)
- « Neuf mois, c'est court » et « dans les neuf mois qui restent » (chapeau, texte, titre de liste) : juste au 27/11/2026, mais la formule vieillira. On peut écrire « Moins d'un an » ou dater l'article.

### F8. trajectoire-conformite-facturation-electronique-cabinet, gravité 6, RAS
- Toutes les affirmations attribuées au guide sont exactes (questions 1, 17 à 20, 25, 27, 28, 29). Petite liberté acceptable : la question 27 ne mentionne pas « avec sa date » ni « dates de signalement et de résolution ». Ces dates viennent de la question 25 et de la formule « concrets, datés et cohérents » de la question 27.

### F9. trajectoire, mandat, portefeuille, gravité 5, RAS
- Apostrophes droites (') dans ces trois fichiers, &rsquo; dans experts-comptables. J'ai gardé le style de chaque fichier ; la session principale peut harmoniser si elle le souhaite.


### F10. app/blog/page.tsx (index), gravité 5, CORRIGÉ
- Avant : « dites-le nous » ; après : « dites-le-nous » (impératif suivi de deux pronoms : deux traits d'union).

### F11. app/blog/page.tsx et components/blog/BlogPost.tsx (bandeau), gravité 1/3, À DÉCIDER
- Avant (index) : « Réforme 2026 : La facturation électronique B2B devient obligatoire en France. Deviso est déjà conforme Factur-X, sans rien faire de votre côté. » BlogPost dit la même chose, sans « sans rien faire de votre côté ».
- Problèmes :
  1. Au 27/11/2026, la réception est déjà obligatoire pour toutes les entreprises (depuis le 01/09/2026), et l'émission l'est pour les grandes entreprises et les ETI. « Devient » est donc daté, et rien n'indique 2027 pour les PME et les micro.
  2. « Conforme Factur-X » réduit la conformité au format, alors que l'argument fort est la plateforme agréée comprise dans l'abonnement.
  3. « sans rien faire de votre côté » est inexact : l'utilisateur doit au moins se raccorder (lib/cabinet-dossiers.ts signale un dossier « Non raccordé à une plateforme agréée »).
  4. « Réforme 2026 : La » : majuscule après le deux-points.
- Proposition : « Réforme 2026 : réception des factures électroniques obligatoire depuis le 1er septembre 2026, émission au plus tard le 1er septembre 2027. Deviso émet en Factur-X par la plateforme agréée comprise dans l'abonnement. »
- Source : guide de démarrage, question 17 (« Pour les PME, TPE et micro-entreprises, cette obligation d'émission s'applique à compter du 1er septembre 2027. En revanche, toutes les entreprises concernées par la réforme doivent avoir la capacité de recevoir des factures électroniques dès le 1er septembre 2026 »).

### F12. components/blog/ArticleLong.tsx (bouton du CTA), gravité 3, À DÉCIDER
- Le CTA d'ArticleLong affiche toujours « Essayer gratuitement » (WaitlistButton plan="free"). Sur les quatre articles experts-comptables, le texte du CTA parle du cockpit cabinet et des cabinets pilotes, alors que le bouton mène à l'inscription d'une entreprise cliente, et non à /experts-comptables.
- Proposition : ajouter au CTA un lien optionnel (par exemple « Découvrir l'espace cabinet », href /experts-comptables), utilisé par les articles de la catégorie « comptables ». C'est un changement de composant, donc à valider.

### F13. components/blog/BlogPost.tsx (CTA des articles métier), gravité 2/3, À DÉCIDER
- « Créez votre devis de {profession} en 30 secondes » : la durée n'est pas sourcée. La fonction existe (plans.ts, aiQuotes « Devis rédigés pour vous »), mais « 30 secondes » est une promesse chiffrée. Proposition : « en quelques minutes », ou garder si la durée a été mesurée.

### F14. lib/blog/auteur.ts, gravité 5, CORRIGÉ (ponctuation) + À DÉCIDER (fond)
- Avant : « ...pour écrire le code qui s'y conforme, c'est de là que vient tout ce que vous lisez ici. » ; après : « ...qui s'y conforme : c'est de là que vient tout ce que vous lisez ici. » (virgule qui soudait deux propositions principales).
- À DÉCIDER : « tout ce que vous lisez ici » viendrait des spécifications DGFiP, alors que le blog s'appuie aussi sur l'URSSAF, le BOFiP, le Code de commerce, etc. Proposition : « c'est de ce travail, et des sources officielles citées dans chaque guide, que vient ce que vous lisez ici. »

### F15. lib/blog/categories.ts, catégorie « comptables », gravité 6, À DÉCIDER
- Avant : « Équiper ses clients indépendants et TPE pour la réforme, et suivre tout un portefeuille sans se connecter chez chacun. »
- Le résumé ne couvre plus les trois articles du 23/11 (mandat, trajectoire, échéance 2027). Proposition : « Mandat et lettre de mission, trajectoire de conformité, échéance de 2027 : accompagner ses clients dans la réforme et suivre tout un portefeuille. »
- Remarque de langue : categories.ts et le registre écrivent « l'e-reporting », les articles comptables « le e-reporting » (la forme de la DGFiP). À harmoniser globalement, idéalement sur « le e-reporting ».

### F16. components/blog/MenuCategorie.tsx, Signature.tsx, gravité 6, RAS
- Textes corrects ; le lien de la signature pointe vers /a-propos (route existante).

## Changements proposés pour registre.ts

### Descriptions hors de 150-160 caractères (36 articles sur 52)
Longueur mesurée par script, en caractères (spread JS). Les 16 autres sont dans la plage, dont les quatre articles comptables (155, 156, 156, 152). Chaque proposition reprend le contenu actuel, et sa longueur a été recontrôlée. Champ : description.

- reforme-facturation-micro-entrepreneur, description (149 car.) : « Micro-entrepreneur : ce que la réforme de facturation électronique change vraiment pour vous. Franchise TVA, Factur-X, plateforme agréée, calendrier. »
  Après (155 car.) : « Micro-entrepreneur : ce que la réforme de la facturation électronique change vraiment pour vous. Franchise de TVA, Factur-X, plateforme agréée, calendrier. »
- liste-plateformes-agreees, description (163 car.) : « La liste officielle tient en deux fichiers, et leurs noms trompent. Ce qu’ils contiennent, ce qu’ils ne disent pas, et comment vérifier un éditeur en deux minutes. »
  Après (157 car.) : « La liste officielle tient en deux fichiers, et leurs noms trompent. Ce qu’ils contiennent, ce qu’ils taisent, et comment vérifier un éditeur en deux minutes. »
- facture-electronique-refusee-que-faire, description (174 car.) : « Refusée ou rejetée, ce ne sont pas les mêmes causes ni les mêmes remèdes. Les statuts, les treize motifs de refus possibles, et pourquoi un avoir ne se transmet pas toujours. »
  Après (154 car.) : « Refusée ou rejetée : ni les mêmes causes, ni les mêmes remèdes. Les statuts, les treize motifs de refus, et pourquoi un avoir ne se transmet pas toujours. »
- plateforme-agreee-ou-solution-compatible, description (164 car.) : « La distinction est officielle, pas marketing : une solution compatible ne peut ni transmettre ni recevoir vos factures. Comment vérifier où se situe votre logiciel. »
  Après (158 car.) : « La distinction est officielle, pas marketing : une solution compatible ne transmet ni ne reçoit vos factures seule. Comment savoir où se situe votre logiciel. »
- checklist-reforme-facturation-2026, description (147 car.) : « Réforme facturation électronique : 7 points à vérifier pour être prêt. Logiciel, format Factur-X, plateforme agréée, e-reporting, mentions légales. »
  Après (153 car.) : « Réforme de la facturation électronique : 7 points à vérifier pour être prêt. Logiciel, format Factur-X, plateforme agréée, e-reporting, mentions légales. »
- facturation-electronique-petit-chiffre-affaires, description (167 car.) : « Vous facturez quelques milliers d'euros par an et la réforme vous inquiète. Ce qu'elle vous impose réellement, ce qu'elle ne vous impose pas, et les options gratuites. »
  Après (160 car.) : « Vous facturez quelques milliers d'euros par an ? Ce que la réforme vous impose réellement, ce qu'elle ne vous impose pas, et les options gratuites qui existent. »
- pas-de-plateforme-gratuite-etat, description (164 car.) : « Le portail public gratuit de facturation a été abandonné en 2024. Ce qu'il devait être, ce qu'il est devenu, et pourquoi tout le monde passe par un opérateur privé. »
  Après (155 car.) : « Le portail public gratuit de facturation a été abandonné en 2024. Ce qu'il devait être, ce qu'il est devenu, et pourquoi tout passe par un opérateur privé. »
- amendes-facturation-electronique-2026, description (169 car.) : « Les montants réels depuis le 1er septembre 2026 : 50 € par facture, 500 € par e-reporting, 500 € en réception, plafond 15 000 €. Ce que le web n'a pas encore mis à jour. »
  Après (153 car.) : « Les montants en vigueur depuis le 1er septembre 2026 : 50 € par facture, 500 € par e-reporting, 500 € en réception, plafond de 15 000 €. Ce qui a changé. »
- factur-x-explique-freelance, description (172 car.) : « Factur-X, c'est un PDF normal doublé d'un fichier que les logiciels savent lire. À quoi ça sert, ce que ça change pour vous, et pourquoi vous n'avez rien à faire à la main. »
  Après (156 car.) : « Factur-X, c'est un PDF normal doublé d'un fichier que les logiciels savent lire. À quoi ça sert, ce que ça change, et pourquoi rien n'est à faire à la main. »
- facture-acompte-freelance, description (168 car.) : « Votre devis est signé, le client verse un acompte : il faut une facture d'acompte. Mentions obligatoires, lien avec la facture de solde, TVA, et ce qu'il faut déclarer. »
  Après (150 car.) : « Devis signé, acompte versé : il vous faut une facture d'acompte. Mentions obligatoires, lien avec la facture de solde, TVA, et ce qu'il faut déclarer. »
- facture-avoir-erreur-facture, description (166 car.) : « Une facture émise ne se modifie ni ne se supprime. Comment corriger : avoir total, avoir partiel, facture rectificative, et ce que la facturation électronique change. »
  Après (150 car.) : « Une facture émise ne se modifie ni ne se supprime. Comment la corriger : avoir total ou partiel, facture rectificative, et ce que la réforme y change. »
- note-honoraires-ou-facture, description (174 car.) : « Une note d'honoraires, c'est quoi ? Pour un praticien ou une profession libérale, ce n'est pas un document à part : ce qui la distingue d'une facture, et ce qu'elle contient. »
  Après (158 car.) : « Une note d'honoraires, c'est quoi ? Pour une profession libérale, ce n'est pas un document à part : ce qui la distingue d'une facture, et ce qu'elle contient. »
- attestation-vigilance-urssaf-freelance, description (175 car.) : « Votre client exige une attestation de vigilance URSSAF avant de payer. Pourquoi il y est obligé, comment l'obtenir en micro-entreprise, et quoi faire si elle vous est refusée. »
  Après (152 car.) : « Votre client exige une attestation de vigilance URSSAF avant de payer. Pourquoi il y est tenu, comment l'obtenir en micro, et que faire en cas de refus. »
- livre-des-recettes-micro-entrepreneur, description (145 car.) : « Le seul document comptable obligatoire en micro-entreprise. Les mentions à porter, le piège de l'encaissement, et ce qui est vraiment sanctionné. »
  Après (160 car.) : « Le seul document comptable obligatoire en micro-entreprise. Les mentions à porter, le piège de l'encaissement, et ce qui est vraiment sanctionné en cas d'oubli. »
- biens-ou-services-micro-entrepreneur, description (163 car.) : « Prestation de services BIC ou BNC, ou vente de biens : la catégorie de votre micro-entreprise fixe cotisations, abattement, plafond et seuil de TVA. Chiffres 2026. »
  Après (153 car.) : « Services BIC ou BNC, ou vente de biens : la catégorie de votre micro-entreprise fixe cotisations, abattement, plafond et seuil de TVA. Les chiffres 2026. »
- passer-a-la-tva-micro-entrepreneur, description (143 car.) : « La franchise de TVA s'arrête avant votre plafond de micro. Les seuils 2026, ce qui déclenche la bascule, et les démarches pour passer à la TVA. »
  Après (154 car.) : « La franchise de TVA s'arrête avant votre plafond de micro-entreprise. Les seuils 2026, ce qui déclenche la bascule, et les démarches pour passer à la TVA. »
- declarer-chiffre-affaires-urssaf, description (137 car.) : « Chaque mois ou trimestre, vous déclarez l'encaissé et payez vos cotisations dessus. Taux 2026, bonne périodicité, ACRE et oublis coûteux. »
  Après (159 car.) : « Chaque mois ou chaque trimestre, vous déclarez votre chiffre d'affaires encaissé et payez vos cotisations dessus. Taux 2026, périodicité, ACRE, oublis coûteux. »
- obligations-comptables-micro-entrepreneur, description (143 car.) : « Le micro dispense de bilan, pas de tout. Compte bancaire dédié, factures conformes, registre des achats, conservation 10 ans : le tour complet. »
  Après (154 car.) : « La micro-entreprise dispense de bilan, pas de tout. Compte bancaire dédié, factures conformes, registre des achats, conservation 10 ans : le tour complet. »
- plafonds-micro-entreprise-2026, description (148 car.) : « 203 100 € et 83 600 € depuis 2026. Et surtout : ne confondez pas ces plafonds avec les seuils de TVA, bien plus bas, que vous franchirez en premier. »
  Après (156 car.) : « 203 100 € et 83 600 € depuis 2026. Surtout, ne confondez pas ces plafonds avec les seuils de TVA, bien plus bas, que vous franchirez en premier en pratique. »
- refacturer-frais-client-freelance, description (169 car.) : « Refacturer un train ou un hôtel augmente votre chiffre d'affaires, donc vos cotisations. Le mécanisme du débours, ses conditions strictes, et quand il ne s'applique pas. »
  Après (152 car.) : « Refacturer un train ou un hôtel gonfle votre chiffre d'affaires, donc vos cotisations. Le mécanisme du débours, ses conditions strictes, et ses limites. »
- numerotation-factures-freelance, description (146 car.) : « La numérotation doit être continue et sans trou : c'est une obligation du CGI. Les formats qui tiennent, et comment réparer une série déjà cassée. »
  Après (154 car.) : « La numérotation des factures doit être continue et sans trou : c'est une obligation du CGI. Les formats qui tiennent, et comment réparer une série cassée. »
- devis-developpeur-web, description (145 car.) : « Comment rédiger un devis de développement web freelance : mentions obligatoires, TJM vs forfait, scope creep, Chorus Pro. Exemple concret inclus. »
  Après (153 car.) : « Comment rédiger un devis de développement web freelance : mentions obligatoires, TJM ou forfait, dérive du périmètre, Chorus Pro. Exemple concret inclus. »
- devis-consultant-independant, description (149 car.) : « Comment rédiger une proposition commerciale de consultant indépendant : livrables, TJM, confidentialité, grands comptes. Exemple et erreurs à éviter. »
  Après (158 car.) : « Comment rédiger la proposition commerciale d'un consultant indépendant : livrables, TJM, confidentialité, grands comptes. Exemple concret et erreurs à éviter. »
- devis-formateur-independant, description (127 car.) : « Devis de formation : mentions OPCO obligatoires, objectifs pédagogiques, acompte et solde. Exemple concret et erreurs à éviter. »
  Après (151 car.) : « Devis de formation professionnelle : mentions attendues par l'OPCO, objectifs pédagogiques, acompte et solde, TVA. Exemple concret et erreurs à éviter. »
- devis-artisan-btp, description (126 car.) : « Devis d'artisan BTP : taux de TVA selon les travaux, mention garantie décennale, acompte. Exemple concret et erreurs à éviter. »
  Après (152 car.) : « Devis d'artisan du BTP : taux de TVA selon les travaux, mention de l'assurance décennale, acompte, validité. Un exemple concret et les erreurs à éviter. »
- devis-community-manager, description (139 car.) : « Devis de community manager : définir le périmètre (plateformes, posts, visuels), forfait mensuel, résiliation. Exemple et erreurs à éviter. »
  Après (158 car.) : « Devis de community manager : définir le périmètre (réseaux, publications, visuels), le forfait mensuel et la résiliation. Exemple concret et erreurs à éviter. »
- devis-coach-freelance, description (143 car.) : « Devis de coaching : TVA franchise ou exonération, conditions d'abandon et de remboursement, séances vs programmes. Exemple et erreurs à éviter. »
  Après (154 car.) : « Devis de coaching : franchise ou exonération de TVA, conditions d'abandon et de remboursement, séances ou programmes. Exemple concret et erreurs à éviter. »
- devis-traducteur-freelance, description (143 car.) : « Devis de traduction : tarifer au mot ou à la page, inclure les révisions, droits sur la traduction, tarif urgence. Exemple et erreurs à éviter. »
  Après (150 car.) : « Devis de traduction : tarif au mot ou à la page, révisions incluses, droits sur la traduction et tarif d'urgence. Exemple concret et erreurs à éviter. »
- quand-prendre-expert-comptable-micro, description (137 car.) : « En micro, l'expert-comptable n'est pas obligatoire. La vraie question : à partir de quand est-ce rentable. Les moments qui le justifient. »
  Après (153 car.) : « En micro-entreprise, l'expert-comptable n'est pas obligatoire. La vraie question : à partir de quand devient-il rentable ? Les moments qui le justifient. »
- calendrier-fiscal-social-micro, description (132 car.) : « Déclaration de CA, déclaration de revenus, CFE, TVA : le tour des rendez-vous de l'année, et de ceux qui tombent même sans activité. »
  Après (157 car.) : « Déclaration de chiffre d'affaires, déclaration de revenus, CFE, TVA : le tour des rendez-vous de l'année en micro, et de ceux qui tombent même sans activité. »
- scope-creep-freelance, description (147 car.) : « Le scope creep est la première cause de perte de rentabilité en freelance. Comment il arrive et quelles clauses mettre au devis pour s'en protéger. »
  Après (154 car.) : « La dérive du périmètre (scope creep) ronge la rentabilité d'une mission freelance. Comment elle s'installe, et quelles clauses du devis vous en protègent. »
- gerer-impayes-freelance, description (144 car.) : « Récupérer une facture impayée en freelance : relance amiable, mise en demeure, injonction de payer. Étapes concrètes et protection dès le devis. »
  Après (158 car.) : « Récupérer une facture impayée en freelance : relance amiable, mise en demeure, injonction de payer. Les étapes concrètes, et comment se protéger dès le devis. »
- fixer-ses-tarifs-freelance, description (124 car.) : « Calculer son TJM en freelance : 3 méthodes, les erreurs classiques, et comment augmenter ses tarifs sans perdre ses clients. »
  Après (155 car.) : « Calculer son TJM en freelance : trois méthodes, les erreurs classiques, les temps non facturables, et comment augmenter ses tarifs sans perdre ses clients. »
- fraude-faux-rib-faux-fournisseur, description (149 car.) : « Un faux changement de RIB au nom d'un fournisseur ou d'un client : les signaux d'alerte, le contre-appel, et que faire si le virement est déjà parti. »
  Après (158 car.) : « Un faux changement de RIB au nom d'un fournisseur ou d'un client : les signaux d'alerte, la règle du contre-appel, et que faire si le virement est déjà parti. »
- choisir-statut-micro-ei-eurl-sasu, description (143 car.) : « Micro-entreprise, entreprise individuelle au réel, EURL ou SASU : impôt, cotisations et protection sociale comparés pour choisir le bon statut. »
  Après (155 car.) : « Micro-entreprise, entreprise individuelle au réel, EURL ou SASU : impôt, cotisations, protection sociale et formalités comparés pour choisir le bon statut. »
- cfe-cotisation-fonciere-entreprises, description (162 car.) : « La CFE concerne toutes les entreprises, même sans local. Exonération la première année, seuil de 5 000 €, avis en ligne uniquement, paiement avant le 15 décembre. »
  Après (151 car.) : « La CFE concerne toutes les entreprises, même sans local. Exonération la première année, seuil de 5 000 €, avis en ligne, paiement avant le 15 décembre. »

### Langue, ton et cohérence (registre)
- reforme-facturation-micro-entrepreneur, carte.resume : « Franchise TVA ≠ exemption. Les 3 scénarios selon votre activité B2B/B2C » ; proposé : « La franchise de TVA n'est pas une exemption. Trois scénarios selon votre activité B2B ou B2C ». Raison : symbole ≠, « Franchise TVA ».
- devis-developpeur-web, description, og et carte : « TJM vs forfait » ; proposé « TJM ou forfait » (anglicisme).
- devis-graphiste-freelance, description : « Exemple concret + erreurs à éviter. » ; proposé « Exemple concret et erreurs à éviter. »
- devis-redacteur-web, carte.titre : « Rédacteur & copywriter » ; proposé « Rédacteur web » ou « Rédacteur et concepteur-rédacteur ».
- devis-consultant-independant, titre et h1 : « propale » (jargon) ; proposé « proposition commerciale ».
- scope-creep-freelance, description et carte.resume : « Le scope creep est la première cause de perte de rentabilité en freelance » : gravité 2, classement sans source. La description proposée le retire ; retirer aussi « la première cause » de la carte.
- amendes-facturation-electronique-2026, carte.resume : « les montants que la moitié du web ignore encore » : gravité 2, estimation non sourcée ; proposé « les montants que beaucoup de sites n'ont pas encore mis à jour ». La description proposée remplace aussi « Ce que le web n'a pas encore mis à jour ». Sur le fond, la FAQ « J'approfondis » 2.4 et 2.5 (version du 01/09/2026) confirme 50 € par facture, plafond de 15 000 € par année civile (première infraction non sanctionnée), et 500 € en réception trois mois après mise en demeure (puis 1 000 € par période de trois mois). Le « 500 € par e-reporting » relève du lot de l'article.
- e-reporting-freelance-2026, carte.resume : « Amende : 500 € par transmission » : à comparer avec le lot de l'article (art. 1788 D).
- deviso-solution-comptable-marche, titre et carte.titre : « Deviso face au marché : notre solution comptable » : gravité 3 (positionnement). Deviso n'est pas un logiciel de comptabilité. Proposé : « Deviso face au marché : notre outil de gestion ». Le h1 « notre place et les points de douleur que nous réglons pour votre entreprise » est lourd (calque de « pain points ») ; proposé : « Deviso face au marché : notre place, et les difficultés que nous réglons pour votre entreprise ».
- « le micro » pour micro-entreprise (micro-ou-reel, obligations-comptables, quand-prendre-expert-comptable) : ton familier. Les descriptions proposées écrivent « la micro-entreprise ». Pour micro-ou-reel (dans la plage), proposé : « La micro-entreprise applique un abattement forfaitaire, le réel déduit vos charges. La bascule tient à une question : vos charges dépassent-elles cet abattement ? » (à recompter).
- clauses-devis-freelance, scope-creep-freelance, gerer-impayes-freelance, fixer-ses-tarifs-freelance : carte.titre reprend le h1 entier et carte.resume dépasse 150 caractères, alors que toutes les autres cartes sont courtes. Proposé : des cartes courtes, par exemple pour clauses-devis-freelance « Les clauses indispensables d'un devis » / « Périmètre, acompte, révisions, propriété intellectuelle, résiliation : 9 clauses prêtes à l'emploi ».
- Cohérence titre et h1 : aucune contradiction ; chaque titre est une forme courte du h1. Langue : français partout, sauf « scope creep », à garder avec la glose « dérive du périmètre ».
- Positionnement « outil de gestion » : aucune description ni carte ne réduit Deviso à « devis et factures », hormis « notre solution comptable » ci-dessus.

## Chiffres cités (lot F)
- 1er septembre 2026 : réception obligatoire pour toutes les entreprises assujetties, émission et e-reporting pour GE et ETI (trajectoire, portefeuille, experts-comptables, mandat).
- 1er septembre 2027 au plus tard : émission et e-reporting pour PME, TPE et micro (trajectoire, portefeuille).
- Taille appréciée au 1er janvier 2025, sur le dernier exercice clos, par SIREN (portefeuille, trajectoire).
- Micro : moins de 10 personnes et CA ou bilan d'au plus 2 M€ ; PME : moins de 250 personnes et CA d'au plus 50 M€ ou bilan d'au plus 43 M€ (portefeuille).
- 26 données structurées obligatoires en 2026, 34 dès 2027 (portefeuille).
- Quatre nouvelles mentions, décret n° 2022-1299 du 7 octobre 2022, art. 242 nonies A ann. II CGI (portefeuille ; SIREN dans mandat).
- E-reporting : franchise en base, tous les deux mois (bimestre civil) ; réel normal mensuel, transactions trois fois par mois et paiement mensuel (portefeuille).
- Réception sans plateforme agréée : mise en demeure de se conformer sous trois mois avant amende, art. 1737 IV bis (trajectoire). Aucun montant cité dans le lot.
- Défaut d'émission : « amende par facture » (art. 1737), sans montant ; défaut de transmission : art. 1788 D (trajectoire).
- Guide de démarrage de la DGFiP : juillet 2026 ; FAQ : version du 01/09/2026.
- « Neuf mois » avant l'échéance (portefeuille, F7).

## Liens Légifrance du lot (non ouverts, selon la consigne)
- trajectoire et mandat : https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006191855, libellé « CGI, articles 289-0 à 289 bis (factures) ». Appuie l'art. 289 bis (plateforme agréée obligatoire) et l'art. 289 I-2 (émission par un tiers sous mandat). Ce sont les BONS articles. À vérifier : que la section corresponde bien à celle qui contient les art. 289 et 289 bis.
- mandat : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000046882378, libellé « décret n° 2012-432 du 30 mars 2012, article 151 ». Appuie le contrat écrit et la lettre de mission, la mention du mandat et de sa durée, ainsi que le mandat présumé. L'article 151 est le bon pour la lettre de mission ; pour la présomption, voir F6. L'identifiant peut renvoyer à une version antérieure au décret n° 2024-138, à vérifier.

## Liens externes vérifiés
- Guide de démarrage, FAQ « Je découvre » et FAQ « J'approfondis » (impots.gouv.fr) : en ligne, contenu conforme à ce qu'on leur fait dire, numéros de question compris.
- BOFiP BOI-TVA-DECLA-30-20-10-30 : en ligne, conforme (F1).
- Service-public F23208 : en ligne, conforme ; libellé corrigé (F2).
- getdeviso.fr/experts-comptables : la route existe et annonce bien le cockpit gratuit et le programme pilote.
- Liens internes de l'index et des composants : /blog/<slug> générés depuis le registre, /a-propos, mailto du support. Rien de cassé.

## Couverture
Vérifié :
- les quatre articles en entier (fond, langue, liens, affirmations sur Deviso dans le code) ;
- l'index, les quatre composants, categories.ts et auteur.ts (textes affichés) ;
- registre.ts pour les 52 articles (longueur des descriptions par script, langue, cohérence titre et h1, cartes) ;
- les contrôles : npx tsc --noEmit -p . propre, check-tirets propre, check-emoji propre, aucun tutoiement dans les fichiers du lot.

Non vérifié :
- les liens Légifrance (consigne) ;
- l'article 151 du décret n° 2012-432 dans sa version en vigueur, en particulier la présomption de mandat (F6) ;
- le fond des articles des autres lots, vus seulement à travers le registre (amendes, e-reporting) ;
- la question des données de paiement pour un franchisé (F5), sur laquelle les deux FAQ divergent ;
- la durée « 30 secondes » (F13).

Fichiers modifiés :
- app/blog/mandat-facturation-electronique-expert-comptable/page.tsx (F1) ;
- app/blog/experts-comptables-equiper-clients-micro/page.tsx et app/blog/portefeuille-clients-echeance-septembre-2027/page.tsx (F2) ;
- app/blog/page.tsx (F10) ;
- lib/blog/auteur.ts (F14).

Aucun commit ; registre.ts n'est pas modifié et les dates misAJourLe ne sont pas avancées. F1 est une précision de FAQ : la session principale décide s'il faut avancer la date.
