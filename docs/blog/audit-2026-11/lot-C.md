# Audit du blog, lot C (27/11/2026)

Worktree : C:\Users\SeliM\Deviso\deviso\.claude\worktrees\audit-blog-1dff30
Articles : facture-acompte-freelance, facture-avoir-erreur-facture, note-honoraires-ou-facture, attestation-vigilance-urssaf-freelance, refacturer-frais-client-freelance, facturer-client-etranger-freelance, numerotation-factures-freelance, clauses-devis-freelance, scope-creep-freelance.

(Rapport rédigé au fil de l'eau.)

## Constats

### Contradictions avec ce que Deviso fait réellement (gravité 3), relevées dans le code

C1. facture-acompte-freelance, gravité 3 (et 1, voir N1), À DÉCIDER
- Avant (liste « Les quatre erreurs ») : « Une série « A-001, A-002 » en parallèle des factures crée deux séquences. Or la continuité s'apprécie sur l'ensemble. Une seule série, toujours. » ; FAQ : « ouvrir une numérotation parallèle du type « A-001 » : la continuité s'apprécie sur l'ensemble de vos factures, et deux séries créent mécaniquement des trous dans chacune » ; liste des mentions : « Pas une numérotation parallèle » ; CTA : « La numérotation reste continue, par construction ».
- Ce que fait Deviso : lib/numerotation.ts l. 24-31 (« Seuls les acomptes ont leur propre série, héritée et déjà en production ») et supabase/migrations/20261008_verrou_numerotation_valide_p_user_id.sql l. 46 : `v_numero := 'AC-' || v_year || '-' || ...` . Deviso numérote donc les acomptes AC-2026-001, exactement la pratique que l'article présente comme une erreur. Un utilisateur qui lit l'article puis ouvre Deviso voit l'outil faire « l'erreur qui coûte cher ».
- Proposition : réécrire l'item et la FAQ dans le sens de la doctrine (séries distinctes admises avec un préfixe distinct, chacune continue, voir N1 et l'article numerotation-factures-freelance qui le dit déjà), par ex. item « Numéroter les acomptes sans règle » : « Une série distincte pour les acomptes est admise, à condition d'un préfixe qui la distingue (AC-2026-001) et d'une continuité propre. Ce qui est interdit, c'est le trou ou le doublon, pas la série. » Et CTA : « Chaque série reste continue, par construction. »

C2. facture-acompte-freelance, gravité 3, À DÉCIDER
- Avant (tableau d'exemple) : « Devis n° 2026-014 » puis « Facture d'acompte n° 2026-015 » et note « L'acompte consomme le 015 ». L'exemple met le devis dans la même suite que les factures, ce que l'article numerotation-factures-freelance déconseille (« Mélanger devis et factures dans une même suite crée des trous ») et que Deviso ne fait pas (devis D-2026-NNN, acomptes AC-2026-NNN, même migration l. 46 et 71).
- Proposition : « Devis n° D-2026-014 », « Facture d'acompte n° AC-2026-005 » (ou 2026-015 si C1 est tranché autrement), solde « 2026-031 » ; corriger la FAQ (« facture n° 2026-015 du 5 mars 2026 ») en conséquence. Non modifié, lié à la décision C1.

C3. facturer-client-etranger-freelance, gravité 3, À DÉCIDER (bug produit, hors lot). LE PLUS GRAVE DU LOT.
- CTA : « Deviso déduit le traitement TVA du statut de votre client [...] et porte la mention exacte sur la facture, autoliquidation, hors champ, franchise ».
- Ce que fait Deviso : lib/exoneration.ts l. 86-122. (a) Vendeur assujetti + client UE avec n° TVA : « Autoliquidation par le preneur, art. 262 ter I du CGI », article des LIVRAISONS DE BIENS intracommunautaires, faux pour une prestation de services. (b) Client hors UE : « Exonération de TVA, art. 262 I du CGI (exportation) », article des exportations de biens ; pour un service, impots.gouv.fr donne « TVA non applicable – art. 259-1 du CGI ». (c) Le régime du vendeur est déduit de la présence d'un n° de TVA intracom : or l'article dit (à juste titre) qu'un micro en franchise qui facture un pro UE DOIT obtenir ce numéro ; Deviso le traitera alors comme assujetti. (d) Vendeur sans n° TVA facturant un pro UE : Deviso imprime « TVA non applicable, art. 293 B du CGI », mention que l'article dit de ne pas porter.
- Proposition : corriger lib/exoneration.ts (distinguer biens/services, 259-1° pour les services hors UE, « Autoliquidation » pour un service à un pro UE, champ « régime » explicite), ou retirer la promesse du CTA en attendant.

C4. refacturer-frais-client-freelance, gravité 3, À DÉCIDER
- CTA : « Deviso distingue les frais refacturés des débours sur vos devis et vos factures, et ne compte dans votre chiffre d'affaires que ce qui doit y entrer. »
- Code : aucune occurrence de « débours »/« debours » hors blog, registre et docs/seo (grep sur tout le dépôt). La fonction n'existe pas.
- Proposition : retirer, ou « Deviso suit votre chiffre d'affaires encaissé et vos seuils au fil des factures, pour voir tout de suite ce qu'un frais refacturé y ajoute » (à vérifier contre lib/plans.ts).

C5. note-honoraires-ou-facture, gravité 3, À DÉCIDER
- CTA : « porte la mention de TVA qui correspond à votre situation, exonération, franchise en base ou assujettissement ».
- Code : lib/exoneration.ts ne connaît pas l'exonération des soins (aucune occurrence de « 261-4 » dans lib/ et app/ hors blog). Un praticien assujetti à 0 % reçoit « TVA non applicable » (`certaine: false`, l. 131-139) ; un praticien sans n° TVA reçoit « art. 293 B », précisément la confusion que l'article dénonce.
- Proposition : aligner le CTA sur le produit (motif d'exonération saisi dans les notes) ou ajouter le motif 261-4-1° au produit.

C6. clauses-devis-freelance et scope-creep-freelance, gravité 3, À DÉCIDER
- CTA clauses : « décrivez votre mission et l'IA génère un devis complet avec les clauses adaptées à votre métier. Vos clients signent électroniquement, vous êtes protégé juridiquement. », titre « en 30 secondes », bouton « Générer mon premier devis, gratuit ». CTA scope-creep : « Deviso génère votre devis avec une clause de périmètre et de révisions adaptées à votre mission. Votre client signe électroniquement, vous êtes couvert. »
- Code : signature électronique client = formules solo et pro seulement (lib/plans.ts l. 37), donc pas « gratuit ». Génération de clauses par IA non trouvée (lib/openai.ts non lu en détail) : à vérifier. « vous êtes protégé juridiquement » / « vous êtes couvert » : promesse juridique à retirer.
- Ces deux pages réduisent Deviso au devis (consigne « outil de gestion ») : proposer une formule « outil de gestion, du devis signé à la facture encaissée ».
- Bandeau : « Deviso est déjà conforme Factur-X, sans rien faire de votre côté » : réducteur (Deviso émet et reçoit via une plateforme agréée, Super PDP, comprise dans l'abonnement). À reformuler.

### Erreurs de fond (gravité 1)

N1. note-honoraires-ou-facture, CORRIGÉ
- Avant : titre « Tenir deux séries selon le type de client », texte « Une numérotation pour les patients, une autre pour les entreprises. Chaque série a alors des trous, et la continuité s'apprécie sur l'ensemble de votre activité, pas par catégorie de client. » ; FAQ « ou tenir deux séries selon le type de client : ces trois habitudes créent des ruptures dans la séquence » ; item « Une seule série pour toute votre activité, sans trou. [...] c'est l'erreur la plus fréquente ».
- Après : titre « Tenir deux séries sans préfixe distinct », texte « Une numérotation pour les patients, une autre pour les entreprises : la doctrine fiscale l'admet, puisque particuliers et professionnels relèvent de règles de facturation différentes. Mais à condition que chaque série porte un préfixe distinct, reste chronologique et continue, et que deux factures de la même année ne puissent jamais porter le même numéro. Deux séries « 1, 2, 3 » sans préfixe, c'est un doublon. » ; FAQ dans le même sens ; item « Une série chronologique et continue, sans trou ni doublon. [...] c'est une erreur fréquente ».
- Source : BOI-TVA-DECLA-30-20-20-10-20131018, https://bofip.impots.gouv.fr/bofip/140-PGP.html/identifiant=BOI-TVA-DECLA-30-20-20-10-20131018 : § 80 « par séries distinctes lorsque les conditions d'exercice de l'activité de l'assujetti le justifient » ; § 90 chaque série chronologique et continue, « deux factures émises la même année ne puissent pas porter le même numéro », préfixe distinct ; § 100 « plusieurs catégories de clients soumises à des règles de facturation différentes, par exemple assujettis et particuliers ».

N2. facture-acompte-freelance, À DÉCIDER (lié à C1)
- « deux séries créent mécaniquement des trous dans chacune » (FAQ), « Une seule série, toujours » : faux au regard du § 90 (chaque série a sa propre continuité). L'acompte n'est pas parmi les exemples du § 100 : légitimité d'une série d'acomptes = appréciation, d'où À DÉCIDER. Proposition au C1.

N3. facturer-client-etranger-freelance, CORRIGÉ
- Avant : « « Autoliquidation, TVA due par le preneur, art. 283-2 du CGI » » (tableau, liste, FAQ Allemagne).
- Après : tableau « « Autoliquidation » (TVA due par le preneur) » ; liste « « Autoliquidation » : c'est la mention exigée, aucun article n'est à citer. Vous pouvez préciser « TVA due par le preneur ». » ; FAQ « avec la mention « Autoliquidation », après avoir vérifié... ».
- Sources : https://www.impots.gouv.fr/professionnel/prestations-entre-assujettis : « Il porte la mention « autoliquidation » sur la facture si le client est un assujetti établi dans l'UE » ; l'art. 283-2 n'y est cité que pour un preneur français achetant à un prestataire non établi en France. BOFiP BOI-TVA-DECLA-30-20-20-30 : mention au titre du 13° du I de l'art. 242 nonies A ann. II ; « l'indication des dispositions du CGI, ou de celles de la directive 2006/112/CE [...] n'est pas exigée ».

N4. facturer-client-etranger-freelance, CORRIGÉ
- Avant (FAQ plafonds) : « Oui, intégralement : dans le chiffre d'affaires déclaré à l'URSSAF, dans le plafond du régime micro, et dans le seuil de franchise en base de TVA. »
- Après : « Dans le chiffre d'affaires déclaré à l'URSSAF et dans le plafond du régime micro, oui : l'absence de TVA sur la facture ne change rien à l'assiette des cotisations. Dans le seuil de franchise en base de TVA, en revanche, non pour les prestations dont le lieu d'imposition n'est pas en France, comme celles rendues à un client professionnel de l'UE ou hors UE : seul compte le chiffre d'affaires des opérations imposables en France. »
- Source : BOI-TVA-DECLA-40-10-10-20260701, https://bofip.impots.gouv.fr/bofip/849-PGP.html/identifiant=BOI-TVA-DECLA-40-10-10-20260701 , § 180 : CA « réalisé en France », « le chiffre d'affaires des opérations dont le lieu d'imposition est en France et dont l'exigibilité est intervenue » ; § 190 : « les recettes issues d'opérations situées hors du champ d'application de la TVA ne sont pas prises en compte ». À comparer avec les autres lots (plafonds-micro, passer-a-la-tva).

N5. refacturer-frais-client-freelance, CORRIGÉ
- Avant : « autour de 21 % à 25 % selon votre activité. Sur 200 €, cela fait 45 à 51 € » (incohérent : 21 % de 200 € = 42 €) ; colonne « environ 45 à 51 € de cotisations ».
- Après : « de 21,2 % à 25,6 % selon votre activité de services (21,2 % en prestations commerciales ou artisanales, 23,2 % en libéral relevant de la Cipav, 25,6 % pour les autres libéraux). Sur 200 €, cela fait 42 à 51 € » ; colonne « environ 42 à 51 € ».
- Source : https://entreprendre.service-public.gouv.fr/vosdroits/F36232 (vérifié le 1er janvier 2026) : services BIC 21,2 %, BNC non réglementées 25,6 %, BNC Cipav 23,2 %, vente 12,3 %. Cohérent avec lib/tarifs-data.ts l. 75.

N6. refacturer-frais-client-freelance, CORRIGÉ
- Avant : « Un accord oral après coup ne suffit pas : il faut une trace écrite antérieure à la dépense, une clause du devis, un mail d'autorisation, une ligne du contrat. » ; en bref « sur mandat préalable écrit » ; encadré « le mandat écrit doit précéder l'achat ».
- Après : « Un accord donné après coup ne suffit pas : la doctrine exige un mandat préalable et explicite. Gardez-en une trace écrite antérieure à la dépense, une clause du devis, un mail d'autorisation, une ligne du contrat : c'est votre meilleure preuve. » ; « sur mandat préalable et explicite » ; « le mandat doit précéder l'achat ».
- Source : BOI-TVA-BASE-10-10-30-20220511 (lien de l'article), § 220 : mandat « préalable et explicite et non pas présumé », un mandat tacite étant admis s'il est assez vraisemblable pour ne pas pouvoir être raisonnablement mis en doute. La référence « paragraphe 200 » est juste (conditions aux § 200 à 230).

N7. attestation-vigilance-urssaf-freelance, CORRIGÉ
- Avant : encadré « Un micro-entrepreneur n'en a pas, et n'en aura jamais : le Kbis est un extrait du registre du commerce, qui concerne les sociétés et les commerçants immatriculés. » (contradictoire : un micro commerçant est un commerçant immatriculé) ; colonne « C'est l'équivalent du Kbis pour un micro-entrepreneur, qui n'en a pas. » ; FAQ et en bref idem.
- Après : encadré « Un micro-entrepreneur n'en a pas : le Kbis est l'extrait du registre du commerce propre aux sociétés. Si votre activité est commerciale, vous êtes immatriculé au registre du commerce et pouvez fournir un extrait K, son équivalent pour une entreprise individuelle. Dans tous les cas, vous pouvez fournir votre avis de situation au répertoire SIRENE, gratuit et immédiat. » ; colonne « C'est ce que fournit un micro-entrepreneur à la place du Kbis, réservé aux sociétés. » ; FAQ et en bref alignés (« ou un extrait K en activité commerciale »).
- Source : https://entreprendre.service-public.gouv.fr/vosdroits/F21000 (vérifié le 3 avril 2026) : l'extrait K « permet de prouver qu'une entreprise commerciale est immatriculée au registre du commerce et des sociétés (RCS) » ; « Il concerne donc aussi les micro-entrepreneurs ».

N8. clauses-devis-freelance et scope-creep-freelance, CORRIGÉ
- Avant (bandeau) : « La facturation électronique B2B devient obligatoire en France. »
- Après : « Réception des factures électroniques obligatoire depuis le 1er septembre 2026, émission au 1er septembre 2027 pour les PME, TPE et micro-entreprises. »
- Source : https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique : « elles doivent toutes être en capacité de recevoir des factures électroniques à compter de cette date » (1er septembre 2026) ; petites et micro-entreprises « auront jusqu'au 1er septembre 2027 pour émettre électroniquement leurs factures » ; e-reporting « suit le même calendrier ».

N9. facture-avoir-erreur-facture, CORRIGÉ
- Avant : « et, depuis la réforme, dans les données transmises à l'administration » ; encadré « Depuis la facturation électronique, la facture d'origine a un identifiant, un statut et une trace chez l'administration » ; FAQ « Et depuis la facturation électronique, une facture avance... » (présenté comme déjà vrai pour tous).
- Après : « et, dès que la facturation électronique s'applique à vous, dans les données... » ; « Avec la facturation électronique, obligatoire en émission depuis le 1er septembre 2026 pour les grandes entreprises et les ETI, et au 1er septembre 2027 pour les PME, TPE et micro-entreprises, la facture d'origine a un identifiant... » ; FAQ « Et avec la facturation électronique ».
- Source : même page impots.gouv.fr que N8.
- La règle « avoir interne si facture refusée ou rejetée » est fondée : lib/superpdp-avoir.ts cite les spécifications externes DGFiP v3.2 du 30/04/2026, p. 60 (« le fournisseur doit procéder à une annulation comptable (avoir interne). Cette opération ne doit pas générer de flux de données réglementaires (F1) au PPF »). Non rouvert par moi ; le CTA est conforme au code.

N10. clauses-devis-freelance, CORRIGÉ
- Avant : « En 2026, le taux légal est publié annuellement au Journal Officiel. »
- Après : « Le taux d'intérêt légal est fixé pour chaque semestre : vérifiez celui en vigueur sur service-public.fr. »
- Source : https://www.service-public.gouv.fr/particuliers/vosdroits/F783 (vérifié le 1er juillet 2026), taux publiés par semestre (2nd semestre 2026 : 6,84 % créancier particulier, 2,75 % autres cas).

N11. facture-acompte-freelance, CORRIGÉ (cohérence interne)
- Avant (en bref) : « Pour une entreprise assujettie, la TVA suit l'encaissement ; en micro-entreprise, l'acompte se déclare sur la période où il a été encaissé. » (faux pour les biens, que l'article traite lui-même autrement, et redondant).
- Après : « En micro-entreprise, l'acompte se déclare à l'URSSAF sur la période où il a été encaissé. »

N12. note-honoraires-ou-facture, À DÉCIDER
- « si vous facturez une entreprise, une mutuelle, un centre de formation, une collectivité, autrement dit un professionnel, vous êtes dans le B2B » (et FAQ) : une collectivité relève du B2G (Chorus Pro, déjà obligatoire). Proposition : retirer « une collectivité » et ajouter « Une collectivité ou un établissement public, c'est le B2G : la facture passe par Chorus Pro. » Source non rouverte.
- Périmètre e-invoicing / e-reporting des soins exonérés (261-4-1°) non vérifié (la page impots.gouv.fr ne traite pas les opérations exonérées). À faire vérifier (FAQ DGFiP) avant relais.

N13. note-honoraires-ou-facture, À DÉCIDER
- « Jamais de ligne de TVA à 0 % » / « un contrôle automatique de facturation électronique peut la rejeter » : en EN 16931 une opération exonérée se code avec taux 0 et catégorie E (cf. lib/exoneration.ts). Le rejet n'est pas sourcé. Proposition : « Une exonération ou une franchise ne se résume pas à « TVA 0 % » : la mention qui la justifie est obligatoire. »
- « conservation pendant dix ans » (3 occurrences) : dix ans = Code de commerce (commerçants) ; délai fiscal six ans. Discutable pour un libéral. Proposition : « au moins six ans (délai fiscal), dix ans si vous êtes commerçant ». Non vérifié.

N14. facture-acompte-freelance, facture-avoir-erreur-facture, clauses-devis-freelance, À DÉCIDER
- Acompte : « Dans la grande majorité des commandes de prestations, c'est un acompte. » Face à un consommateur, L214-1 C. conso. : sauf stipulation contraire, les sommes versées d'avance sont des arrhes. Ajouter : « Face à un particulier, sans mention contraire, la somme versée d'avance est réputée être des arrhes : écrivez « acompte » au devis. » (Légifrance non ouvert, consigne.) Clauses : « Pour les particuliers, la loi réglemente les acomptes selon le type de prestation » vague, même proposition.
- Acompte « plus deux qui lui sont propres » (mention « facture d'acompte », référence au devis) et avoir « plus trois qui lui sont propres » (la liste en compte six) : présentées comme obligatoires, ce sont des bonnes pratiques, sauf la référence à la facture initiale pour l'avoir (242 nonies A). Proposition : « Les mentions sont celles de toute facture ; ajoutez-y, par bonne pratique, ... ».

N15. clauses-devis-freelance, À DÉCIDER
- Cession de droits « pour une durée de [X ans / indéfinie] » : la cession doit être délimitée quant à sa durée (L131-3 CPI) ; proposer « [X ans / la durée légale de protection des droits] ».
- « Les tribunaux ont développé une jurisprudence claire » (force majeure) : adoucir (« abondante, souvent restrictive »).

### Chiffres sans source (gravité 2)

S1. facture-acompte-freelance, À DÉCIDER : FAQ « 30 % à la commande est la norme sur les missions courtes, et on monte à 40 ou 50 % » ; « C'est l'erreur la plus courante chez les prestataires... ». Proposition : « 30 % est une pratique courante ».
S2. clauses-devis-freelance, CORRIGÉ : « 30 à 40% est la norme B2B » devenu « En B2B, 30 à 40 % est une pratique courante. »
S3. scope-creep-freelance, PROPOSÉ registre : description « première cause de perte de rentabilité en freelance » (la page dit « une cause fréquente »).
S4. note-honoraires-ou-facture, CORRIGÉ : « c'est l'erreur la plus fréquente » devenu « c'est une erreur fréquente ».

### Liens (gravité 4)

- Internes : /freelance-artisan, -coach, -community-manager, -consultant, -developpeur, -formateur, -graphiste, -photographe, -redacteur, -traducteur, /blog, /blog/clauses-devis-freelance : routes présentes. OK.
- Externes ouverts : impots.gouv.fr/facturation-electronique-et-plateformes-agreees (200, mais ne parle ni d'avoirs ni de cycle de vie, contrairement à la précision de l'article avoir : proposer https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique) ; BOI-TVA-BASE-10-10-30 et BOI-TVA-DECLA-30-20-20-10 (OK, disent ce qu'on leur fait dire) ; avis-situation-sirene.insee.fr (200) ; VIES (200) ; bpifrance-creation.fr (200, non officiel au sens des consignes : proposer https://www.impots.gouv.fr/professionnel/prestations-entre-assujettis).
- URSSAF : urssaf.fr/accueil/attestation-vigilance.html et autoentrepreneur.urssaf.fr/.../determiner-mon-chiffre-daffaires.html injoignables d'ici (ECONNRESET, curl aussi). La page vigilance existe (moteur de recherche : seuil 5 000 € HT, contrôle tous les 6 mois, code de sécurité à 15 caractères). La seconde est de la famille des liens morts connus : À VÉRIFIER dans Chrome.
- DES : article « 10e jour ouvrable du mois suivant » ; impots.gouv.fr « dans les dix jours du mois qui suit l'exigibilité de la TVA ». Laissé, à arbitrer.
- Mention hors UE : article « Prestation non soumise à la TVA française, art. 259-1° du CGI » ; impots.gouv.fr « TVA non applicable – art. 259-1 du CGI ». Pas faux, alignement proposé.

Liens Légifrance (non ouverts, consigne) : article prétendu, et bon article ?
- facture-acompte : 044982574 « art. 289 CGI » acomptes : bon (289 I-1-c). 006294613 « 242 nonies A ann. II » : bon (identifiant ancien). 044990371 « art. 269 » exigibilité services : bon (269-2-c). 051230147 « 293 B » : bon.
- facture-avoir : 242 nonies A (bon) ; 289 « rectification » (bon) ; 044990287 « art. 272 » précisé « TVA facturée à tort, sur facture rectificative » : article juste pour l'imputation sur opération annulée (272-1), mais « TVA facturée à tort » relève du 283-3 ; reformuler la précision.
- note-honoraires : 044983231 « 261-4-1° » (bon) ; 293 B (bon) ; 242 nonies A (bon) ; 038414123 « L441-9 C. com. » mentions B2B (bon ; montant 40 € à D441-5, principe à L441-10).
- attestation-vigilance : 006904828 « L8222-1 C. trav. » (bon pour l'obligation, mais le seuil 5 000 € HT est à D8222-1 et les documents à D8222-5 : ajouter) ; 006904830 « L8222-2 » solidarité (bon).
- refacturer : 006304615 « art. 267 » II-2° (bon).
- facturer-client-etranger : 021658073 « art. 259 » (bon) ; 006304599 « 259 B » (bon). Manquent 259 D (seuil 10 000 €) et 242 nonies A I-13° (mention Autoliquidation).
- numerotation : 050811276 « 242 nonies A ann. II » (bon ; identifiant différent des autres articles, à harmoniser).
- clauses-devis : L441-10, L441-9, art. 1218 C. civ. cités en texte (bons), aucun lien.

### Langue et typographie (gravité 5), CORRIGÉ
- facturer-client-etranger : « Cas 1, Un professionnel » (cas 1 à 4) devenus « Cas 1 : un professionnel ».
- attestation-vigilance : « Seul vous pouvez l'obtenir » devenu « Vous seul pouvez l'obtenir ».
- scope-creep : tutoiement dans les citations (« Puisque t'es là, tu peux juste... », « Tu peux juste ajouter... ») passé au vouvoiement ; guillemets droits/anglais/apostrophes simples remplacés par « » ; « vs » remplacé ; « ... » en « … » ; « [X€/heure] » en « [X €/heure] ».
- clauses-devis : guillemets droits et &ldquo;/&rdquo; remplacés par « » (affichage des formulations compris) ; « Aller-retours » en « Allers-retours » ; « (vs une modification de brief) » en « (par opposition à une modification du brief) » ; « 40% », « 40€ » espacés ; « Conditions Générales de Vente » en minuscules.
- Restent À DÉCIDER : sommaire de clauses-devis « Titre, Risque » (virgule héritée d'un tiret retiré) ; anglicismes « stealth mode », « on-page » ; h1 et date « 29 juin 2026 » en dur dans les deux pages anciennes au lieu du registre.
- Contrôles : check-tirets OK, check-emoji OK (le « ✓ » de scope-creep passe), `npx tsc --noEmit -p .` sans erreur.

## Changements proposés pour registre.ts

| slug | champ | avant | après | raison |
|---|---|---|---|---|
| facture-acompte-freelance | description (168 car.) | « Votre devis est signé, le client verse un acompte : il faut une facture d'acompte. Mentions obligatoires, lien avec la facture de solde, TVA, et ce qu'il faut déclarer. » | « Devis signé, acompte versé : il faut une facture d'acompte. Ses mentions, son lien avec la facture de solde, la TVA et ce qu'il faut déclarer à l'URSSAF. » | longueur (recompter) |
| facture-avoir-erreur-facture | description (166) | « ...avoir total, avoir partiel, facture rectificative, et ce que la facturation électronique change. » | « Une facture émise ne se modifie ni ne se supprime. Comment corriger : avoir total ou partiel, facture rectificative, et ce que change la facture électronique. » | longueur |
| facture-avoir-erreur-facture | og.description | « et depuis la facturation électronique, le rattrapage n'est plus le même » | « et avec la facturation électronique, le rattrapage n'est plus le même » | calendrier (N9) |
| note-honoraires-ou-facture | description (174) | « Une note d'honoraires, c'est quoi ? Pour un praticien ou une profession libérale, ce n'est pas un document à part : ce qui la distingue d'une facture, et ce qu'elle contient. » | « Note d'honoraires : pour un praticien ou une profession libérale, ce n'est pas un document à part. Ce qui la distingue d'une facture, et ce qu'elle contient. » | longueur |
| attestation-vigilance-urssaf-freelance | description (175) | « ...comment l'obtenir en micro-entreprise, et quoi faire si elle vous est refusée. » | « Votre client exige une attestation de vigilance URSSAF avant de payer. Pourquoi il y est obligé, comment l'obtenir, et que faire si elle vous est refusée. » | longueur |
| attestation-vigilance-urssaf-freelance | og.description | « Au-delà de 5 000 € HT » | « Dès 5 000 € HT de contrat » | seuil inclusif (≥ 5 000 €) |
| refacturer-frais-client-freelance | description (169) | « Refacturer un train ou un hôtel augmente votre chiffre d'affaires, donc vos cotisations. Le mécanisme du débours, ses conditions strictes, et quand il ne s'applique pas. » | « Refacturer un train ou un hôtel gonfle votre chiffre d'affaires, donc vos cotisations. Le débours, ses conditions strictes, et quand il ne s'applique pas. » | longueur |
| numerotation-factures-freelance | description (146) | « La numérotation doit être continue et sans trou : c'est une obligation du CGI. Les formats qui tiennent, et comment réparer une série déjà cassée. » | « La numérotation des factures doit être chronologique, continue et sans trou : une obligation du CGI. Les formats qui tiennent, et comment réparer une série cassée. » | longueur (recompter) |
| scope-creep-freelance | description (147) | « Le scope creep est la première cause de perte de rentabilité en freelance. ... » | « Le scope creep est une cause fréquente de perte de rentabilité pour une entreprise de services. Comment il arrive, et quelles clauses mettre au devis. » | chiffre non sourcé (S3) |
| clauses-devis-freelance | h1 | « Les clauses indispensables dans un devis freelance, guide complet 2026 » | aligner sur le h1 affiché ou faire lire le registre par la page | incohérence |

## Chiffres cités

| valeur | article | contexte |
|---|---|---|
| 5 000 € HT | attestation-vigilance | seuil de vigilance (contrat ≥ 5 000 € HT) |
| 6 mois | attestation-vigilance | renouvellement, validité de l'attestation |
| 21,2 % / 23,2 % / 25,6 % | refacturer-frais | cotisations micro 2026 (services BIC / Cipav / BNC) |
| 42 à 51 € | refacturer-frais | cotisations sur 200 € de frais |
| 10 000 €/an | facturer-client-etranger | seuil UE services électroniques B2C (OSS) |
| 10e jour ouvrable du mois suivant | facturer-client-etranger | DES |
| 1er septembre 2026 / 1er septembre 2027 | note-honoraires, etranger, avoir, clauses, scope-creep, numerotation | réception pour toutes / émission et e-reporting PME, TPE, micro |
| 40 € | note-honoraires, clauses-devis | indemnité forfaitaire B2B |
| 3 fois le taux d'intérêt légal | clauses-devis | minimum des pénalités conventionnelles |
| 20 % / 10 % | refacturer-frais, avoir | taux normal / train |
| 30 %, 40-50 % ; 30-40 % | acompte, clauses-devis | pratique d'acompte (non réglementaire) |
| 10 ans | note-honoraires | conservation (N13) |

## Couverture

Vérifié : lecture intégrale des 9 page.tsx et de leurs entrées registre ; code Deviso derrière chaque CTA (lib/numerotation.ts, migration 20261008, lib/exoneration.ts, lib/superpdp-avoir.ts, lib/document-lie.ts, lib/cadre-facturation.ts, lib/plans.ts, grep débours et 261-4) ; routes internes ; sources officielles ouvertes : BOI-TVA-DECLA-30-20-20-10, BOI-TVA-BASE-10-10-30, BOI-TVA-DECLA-40-10-10-20260701, impots.gouv.fr (Prestations entre assujettis, Je découvre la facturation électronique), service-public F36232, F21000, F783.

Non vérifié, et pourquoi :
- urssaf.fr et autoentrepreneur.urssaf.fr injoignables depuis ce poste : condition « au moins une déclaration de CA, même à zéro » pour l'attestation, effet d'un échéancier, assiette URSSAF des débours. À contrôler dans Chrome avant relais.
- Légifrance non ouvert (consigne) : L214-1 C. conso., L131-3 CPI, D8222-1, D8222-5 laissés en À DÉCIDER.
- Périmètre e-invoicing/e-reporting des soins exonérés, « TVA 0 % rejetée », durée de conservation des libéraux : non tranchés.
- Génération de devis par IA (CTA clauses/scope-creep) : non vérifiée en détail.
- economie.gouv.fr refuse les robots (403).
