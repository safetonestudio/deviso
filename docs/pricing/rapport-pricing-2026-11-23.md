# Prix de Deviso : où on en est, ce que coûte un client, ce que fait le marché, ce que je recommande

Rapport du 23/11/2026, pour Selim. **Décision prise le jour même : option B appliquée (Solo 24 €, Pro 44 €, siège 8 €), voir `lib/grille-tarifaire.ts`.** Le reste du document décrit la situation au moment du rapport.

**Comment lire ce rapport.** Chaque chiffre porte son niveau de preuve :
- **Vérifié** : lu aujourd'hui dans le code de Deviso, dans le compte Stripe LIVE, dans la base, ou sur la page officielle d'un éditeur.
- **Estimé** : calcul de ma part, avec les hypothèses écrites à côté.
- **À confirmer** : chiffre trouvé uniquement chez un tiers, ou incomplet.

Le guide Stripe que tu m'as transmis (*How to build an effective pricing strategy*, Stripe, édition UK) sert de grille de lecture. Ses idées utiles ici sont citées là où elles servent.

---

## 1. En bref

1. **Deviso est rentable par client dès aujourd'hui.** Un client coûte entre 1,5 € et 5 € par mois à servir. La marge brute est d'environ 90 % sur les deux formules. Le seul risque réel de dérive est la génération de devis par IA chez un utilisateur très intensif (jusqu'à environ 15 € par mois et par personne, au plafond actuel).
2. **Les frais fixes vont augmenter avant tout lancement payant**, et ils ne dépendent pas du nombre de clients. L'hébergement Vercel est sur l'offre gratuite, qui interdit l'usage commercial ; la base Supabase est sur l'offre gratuite, sans sauvegarde quotidienne garantie. Compter environ 60 € par mois en tout, soit l'équivalent de 4 abonnements Solo.
3. **Il n'existe aujourd'hui aucun client payant réel.** Les 4 comptes Pro actifs sont des comptes de démonstration. Changer les prix maintenant ne pénalise donc personne. C'est le meilleur moment pour le faire.
4. **« Plateforme Agréée incluse » ne distingue plus Deviso.** Abby, Tiime, Indy, Pennylane et Henrri l'offrent tous, souvent gratuitement. Ce qui distingue Deviso, c'est l'espace cabinet (FEC, Quadra, anomalies, résumé), la validation des devis en équipe et les devis rédigés par IA.
5. **Solo est au prix du marché, Pro est trop bon marché.** 34 € pour 3 utilisateurs, c'est moins qu'Evoliz (47 € pour 3), et très en dessous de Sellsy (78 € minimum pour 2) ou d'Axonaut (97 € par utilisateur).
6. **Ma recommandation** : passer à **Indépendant 24 €** et **Équipe 44 €** (3 utilisateurs inclus, puis 8 € par personne), garder l'annuel à -20 % et l'essai à 14 jours, et offrir aux bêta-testeurs et aux clients du cabinet pilote un **tarif fondateur** (18 € et 34 €, garanti tant qu'ils restent abonnés). Pour les cabinets : aucune commission, uniquement des avantages en nature pour leurs clients.

---

## 2. L'existant, établi depuis les sources

### Les deux formules et leur contenu (vérifié dans le code, `lib/plans.ts`)

| | Solo | Pro |
|---|---|---|
| Prix mensuel | 18 € HT (21,60 € TTC) | 34 € HT (40,80 € TTC) |
| Prix annuel | 172,80 € HT par an, soit 14,40 € par mois | 326,40 € HT par an, soit 27,20 € par mois |
| Utilisateurs | 1 (le titulaire) | 3 inclus (le titulaire et 2 membres), puis 5 € HT par mois et par personne |
| Contenu | tout, sauf la gestion d'équipe | tout, plus la gestion d'équipe, les rôles et la validation des devis |

Les deux formules contiennent les mêmes 21 fonctions vendues : devis rédigés par IA sans limite affichée, signature électronique, Plateforme Agréée, Chorus Pro, factures en anglais, ventes et achats internationaux, factures récurrentes, acompte et solde, relances, suivi du chiffre d'affaires et de la TVA, livre des recettes, export FEC, exports CSV, aucune mention Deviso sur les documents, adresse de partage à son nom, couleur de marque, catalogue, accès gratuit pour l'expert-comptable. **La seule différence entre Solo et Pro est l'équipe.** La page tarifs l'annonce telle quelle : « Deux formules, une seule différence : l'équipe ».

La page tarifs (`components/landing/TarifsTable.tsx`) lit cette même liste : ce qui est affiché est ce que l'application autorise.

### Les prix réellement en vigueur (vérifié dans Stripe LIVE aujourd'hui, `npm run test:stripe-prix`, 12 sur 12)

Les cinq prix existent, sont actifs et portent les bons montants : Solo 18 €, Solo annuel 172,80 €, Pro 34 €, Pro annuel 326,40 €, siège 5 €. Le webhook est branché sur la production et couvre les événements nécessaires, dont le rappel trois jours avant la fin d'essai. Aucun ancien prix n'est resté actif.

Limite : ce contrôle lit la configuration du poste, pas celle de Vercel. Et l'annuel comme le siège n'ont jamais été souscrits en production.

### Les sièges (vérifié dans le code et les CGU)

Le nombre de sièges facturés se calcule à partir des membres réellement actifs : 2 membres sont inclus en plus du titulaire, chaque membre au-delà coûte 5 € par mois, au prorata. Une invitation non acceptée ne coûte rien. **L'expert-comptable ne compte jamais comme un siège.** Un test compare cette règle au texte des CGU et échoue si les deux divergent.

### L'essai de 14 jours (vérifié dans le code et le webhook)

L'essai se fait sans carte bancaire. Si aucun moyen de paiement n'est enregistré à la fin, l'abonnement est résilié proprement, sans facture impayée. Le client reçoit un rappel trois jours avant la fin, puis un courriel de fin d'essai. Il garde ensuite l'accès à ses factures en consultation, mais ne peut plus en créer.

### Ce qui est offert

- **L'accès expert-comptable** : gratuit, en lecture seule, hors siège, dès Solo.
- **La Plateforme Agréée Super PDP** : comprise dans l'abonnement, le client ne paie rien à Super PDP.

### Où en sont les clients (vérifié dans la base aujourd'hui)

| Formule | État | Comptes | dont démonstration |
|---|---|---|---|
| Pro | actif | 4 | 4 |
| Pro | inactif | 3 | 0 |
| Solo | inactif | 3 | 3 |
| Gratuit (ancien) | inactif | 8 | 3 |

**Aucun abonnement payant réel n'est en cours.** Une nouvelle grille ne touche donc aucun client existant.

---

## 3. Ce que coûte un client à Deviso

### Coûts qui varient avec chaque client

| Poste | Ce que le code fait réellement | Prix unitaire | Niveau de preuve |
|---|---|---|---|
| **Super PDP** | chaque facture émise ou reçue passe par la plateforme ; une vérification d'identité de l'entreprise à son raccordement ; une synchronisation toutes les heures | 0,01 € HT par facture jusqu'à 10 000 factures par mois (puis 0,005 €, puis 0,0025 €) ; 2 € HT par vérification d'identité ; 10 € HT par an au minimum, pour tout le compte | **Vérifié** sur [superpdp.tech/tarifs](https://www.superpdp.tech/tarifs), lu le 23/11/2026, page sans date. **À confirmer** : la page ne dit pas si les synchronisations horaires sont facturées. Ta question du mail préparé (`docs/reference/mail-superpdp.md`) reste ouverte. |
| **OpenAI GPT-4o** | génération d'un devis ; lecture d'une facture d'achat (photo ou PDF) ; transcription de la voix (Whisper) | environ 2,50 $ par million de mots-jetons lus et 10 $ par million écrits | **À confirmer** : chiffre concordant chez plusieurs tiers ([CloudZero](https://www.cloudzero.com/blog/gpt-4-api-cost)), non relu sur la page officielle d'OpenAI. |
| **Stripe** | encaissement de l'abonnement | carte européenne 1,5 % + 0,25 € (carte professionnelle : jusqu'à 2,8 % + 0,25 €) ; Stripe Billing 0,7 % du montant | **À confirmer** : [page Stripe France](https://stripe.com/fr/pricing) citée par [Wizishop](https://www.wizishop.fr/blog/calcul-frais-stripe), vérifiée par eux le 17/11/2026. |
| **Resend** (courriels) | envoi des devis, factures, relances, résumés au cabinet, alertes | gratuit jusqu'à 3 000 courriels par mois et 100 par jour, pour tout Deviso | **À confirmer** : [résumé de la grille Resend](https://resend.com/pricing.md), via des tiers. |

**Coût d'un devis IA (estimé).** La consigne envoyée à l'IA fait environ 3 700 caractères, plus le contexte du client (catalogue, 8 derniers devis). J'estime 2 500 jetons lus et 1 000 à 1 500 écrits, soit **environ 0,02 € par devis**.

**Le plafond actuel est de 20 devis IA par jour et par utilisateur.** Un utilisateur qui l'atteindrait chaque jour en générerait 600 par mois, soit **10 à 15 € de coût OpenAI par mois**, presque le prix de Solo. Cas improbable, mais il existe, et il se multiplie par le nombre de personnes chez un client Pro.

### Ce que coûte un client type (estimé)

| | Indépendant typique | Petite équipe (5 personnes) |
|---|---|---|
| Hypothèses | 15 factures émises et 15 reçues par mois, 20 devis IA, 5 achats lus par l'IA | 50 factures émises et 50 reçues, 80 devis IA, 20 achats lus |
| Super PDP | 0,30 € + 0,17 € (vérification amortie sur un an) | 1,00 € + 0,17 € |
| OpenAI | environ 0,50 € | environ 2 € |
| Stripe | environ 0,60 à 0,90 € | environ 1,10 à 1,60 € |
| Courriels | 0 € (dans la part gratuite) | 0 € |
| **Total par mois** | **environ 1,5 à 2 €** | **environ 4,5 à 5 €** |
| Prix payé aujourd'hui | 18 € | 34 € + 2 sièges = 44 € |
| **Marge brute** | **environ 90 %** | **environ 89 %** |

Le guide Stripe le résume ainsi : un logiciel coûte peu à reproduire, l'essentiel des dépenses est le coût d'acquisition d'un client. C'est le cas de Deviso.

### Frais fixes, qui ne dépendent pas du nombre de clients

| Poste | Situation actuelle (vérifiée) | Ce qu'il faut prévoir | Pourquoi |
|---|---|---|---|
| **Vercel** (hébergement) | offre gratuite « Hobby » (le code le dit : les 24 synchronisations horaires contournent la limite d'une tâche par jour) | offre Pro, environ 20 $ par mois | Les [règles de Vercel](https://vercel.com/docs/plans/hobby) réservent l'offre gratuite à un usage personnel et non commercial. Facturer des clients sur l'offre gratuite enfreint ces règles et expose à une coupure. |
| **Supabase** (base de données) | offre gratuite (vérifié sur le compte) | offre Pro, 25 $ par mois | La [grille Supabase](https://supabase.com/pricing.md) n'inclut les sauvegardes quotidiennes qu'à partir de l'offre Pro. Pour des factures à conserver 10 ans, une perte de données serait grave. |
| **Resend** (courriels) | à vérifier sur ton compte | offre Pro, environ 20 $ par mois, dès que Deviso dépasse 100 courriels par jour | La limite gratuite est commune à tous les clients : au-delà, les courriels ne partent plus. |
| **Super PDP** | | 10 € HT par an au minimum | Vérifié sur la page tarifs. |

**Total à prévoir : environ 60 € par mois.** Au prix actuel, il faut 4 clients Solo pour le couvrir ; avec la grille recommandée, 3.

---

## 4. Le marché : prix publics des concurrents

Tous les prix ci-dessous ont été **lus sur la page officielle de l'éditeur le 23/11/2026**. Aucune de ces pages n'affiche de date de mise à jour, sauf Henrri. Les comparateurs tiers donnent des chiffres contradictoires : je ne les ai pas retenus.

### Les outils pour indépendants

| Éditeur | Formules et prix HT par mois | Plateforme Agréée | Accès comptable | Essai | Source |
|---|---|---|---|---|---|
| **Abby** | Basique 0 €, Start 9 €, Plus 15 €, Premium 33 € (promotion -25 % affichée ce jour) ; plusieurs utilisateurs en Premium seulement | oui, dans toutes les formules, Abby se dit lui-même plateforme agréée | export FEC en Premium, marqué « bientôt » | 14 jours | [abby.fr/tarifs](https://abby.fr/tarifs) |
| **Tiime** (0 à 1 salarié) | Free 0 €, Initial 9,99 €, Smart 17,99 €, Business 24,99 € ; autres grilles selon la taille (Smart 29,99 € et Business 39,99 € pour 2 à 5 salariés, d'après le texte lu) | oui, « 100 % gratuite », plateforme Tiime | oui, dans toutes les formules, complet dès Smart | 60 jours | [tiime.fr/tarifs](https://www.tiime.fr/tarifs) |
| **Indy** (société) | Essentiel 0 €, Plus 9 € (12 € sans engagement), Autonomie 49 €, Sérénité dès 99 € (avec expert-comptable partenaire), Exclusivité dès 149 € | oui, dès la formule gratuite, Indy se dit plateforme agréée | uniquement dans les formules avec expert-comptable | aucun (formule gratuite) | [indy.fr/tarifs](https://www.indy.fr/tarifs), [indy.fr/prix](https://www.indy.fr/prix/?type=societe) |
| **Pennylane** (indépendant) | Starter 7 € (compte pro requis), Basique 14 €, Essentiel 24 €, Premium 79 € (avec module comptable) ; 1 utilisateur ; 1 200 factures par an au plus | oui, dans toutes les formules, Pennylane se dit plateforme agréée | oui, dès Starter | 15 jours | [pennylane.com/fr/tarifs/small](https://www.pennylane.com/fr/tarifs/small) |
| **Henrri** | Pro 0 €, Expert 19 € (17 € en annuel), Smart 29 € (25 €), VIP 59 € (49 €) | oui, via une plateforme partenaire | oui, formules payantes | aucun | [henrri.com/tarifs](https://www.henrri.com/tarifs), tableau mis à jour le 09/01/2026 |
| **Freebe** | prix unique selon le statut ; micro-entreprise 12,50 € par mois (150 € TTC par an) | « conforme 2026 », sans plateforme nommée | non mentionné | 30 jours | [freebe.me/tarifs](https://www.freebe.me/tarifs) |

### Les outils pour TPE et équipes

| Éditeur | Prix HT | Utilisateurs | Plateforme Agréée | Accès comptable | Essai | Source |
|---|---|---|---|---|---|---|
| **Evoliz** | Essentielle 29 € (290 € par an), Avancée 49 € (490 € par an) | 1 inclus, puis 9 € par mois et par utilisateur | oui, via un partenaire (Chaintrust by Visma) | oui, lecture et export | 15 jours | [evoliz.com/tarifs.php](https://www.evoliz.com/tarifs.php) |
| **Axonaut** | 97 € par utilisateur et par mois ; -20 % sur 1 an, -30 % sur 2 ans, -40 % sur 3 ans (« dès 58,20 € ») | tarif par utilisateur | oui, Axonaut se dit plateforme agréée | oui, gratuit | 15 jours | [axonaut.com/content/prix](https://axonaut.com/content/prix) |
| **Sellsy** (vente et facturation) | Standard 39 € (49 € hors promotion), Evolution 59 € (89 €), Elite 99 € (119 €), par utilisateur et par mois, en annuel ; promotion valable jusqu'au 30/11/2026 | 2 au minimum, engagement 12 mois | non vérifié dans la partie lue | non vérifié | oui, durée non lue | [go.sellsy.com/tarifs](https://go.sellsy.com/tarifs) |

### Ce que ces chiffres montrent

- **Sur le segment micro-entrepreneur, le prix est tombé à zéro.** Abby, Tiime, Indy, Henrri et Pennylane offrent tous une formule gratuite avec Plateforme Agréée. Deviso ne peut pas y gagner par le prix, et le guide Stripe met en garde : un prix trop bas abîme la perception de qualité.
- **Les indépendants au réel paient entre 15 et 33 € par mois** pour une formule complète : Abby Plus et Premium, Tiime Smart et Business, Pennylane Essentiel, Henrri Expert. **Solo à 18 € est dans le bas de cette fourchette.**
- **Les équipes paient beaucoup plus.** Pour 3 utilisateurs : Evoliz 47 €, Tiime (2 à 5 salariés) 30 à 40 €, Sellsy au moins 117 €, Axonaut 175 € ou plus. **Pro à 34 € pour 3 utilisateurs est le moins cher de la liste.**
- **L'accès comptable gratuit est devenu courant** (Tiime, Pennylane, Evoliz, Axonaut, Henrri). En revanche, aucun de ces outils n'affiche un espace cabinet aussi riche que celui de Deviso (FEC lettré avec PDF joints, Quadra, anomalies, calendrier de TVA, résumé réglable).
- **Les essais vont de 14 jours (Abby) à 60 jours (Tiime).** La norme pour les outils payants est 15 jours.
- **La remise annuelle courante va de -12 % à -20 %** ; Evoliz offre « 2 mois offerts », soit -17 %.

---

## 5. Recommandation

### Ce que dit le guide Stripe, appliqué à Deviso

- **Fixer d'abord l'ordre de grandeur.** Deviso est un produit « autour de 20 € » pour un indépendant et « autour de 50 € » pour une équipe. Débattre de 24 € ou 25 € n'a pas d'intérêt aujourd'hui.
- **Une formule par type de client**, avec un nom qui lui parle. « Solo » et « Pro » ne disent pas pour qui est chaque formule ; « Indépendant » et « Équipe » le disent.
- **Monter en gamme par la quantité, pas en cachant des fonctions.** Le guide cite un éditeur qui a perdu des clients en enfermant des fonctions derrière un paiement. Deviso fait déjà ce qu'il faut : tout est inclus dès la première formule, et la formule supérieure ajoute des personnes. Il faut garder ce principe.
- **Prendre 5 à 15 % de la valeur créée.** Si Deviso fait gagner 3 heures par mois à un indépendant facturé 40 € de l'heure, cela représente 120 € de valeur, et donc un prix défendable entre 6 et 18 €. Une équipe de 3 à 5 personnes avec un comptable gagne bien davantage : saisie évitée chez le cabinet, devis validés sans échange de courriels.
- **« Si personne ne commente votre prix, c'est probablement que vous ne demandez pas assez. »** La bêta servira à le vérifier.

### Les options, avec leur marge et leur risque

| Option | Grille | Marge brute estimée | Risque |
|---|---|---|---|
| **A. Ne rien changer** | Solo 18 €, Pro 34 €, siège 5 € | Solo environ 90 %, Pro environ 89 % | Deviso reste perçu comme un outil pour micro-entrepreneurs, segment déjà gratuit ailleurs. L'équipe est vendue sous sa valeur. Aucun risque technique. |
| **B. Repositionnement modéré (recommandé)** | **Indépendant 24 €**, **Équipe 44 €** avec 3 utilisateurs inclus, **8 € par personne en plus** ; annuel -20 % (19,20 € et 35,20 € par mois) | Indépendant environ 92 %, Équipe environ 90 % ; frais fixes couverts dès 3 clients | Quelques indépendants très sensibles au prix iront vers les offres gratuites, mais ils n'étaient pas la cible. Pour l'équipe, 44 € reste sous Evoliz (47 € pour 3). Travail à prévoir : créer de nouveaux prix Stripe, mettre à jour la page tarifs, les CGU et le contrôle des prix, puis parcourir le chemin complet. |
| **C. Positionnement haut** | Indépendant 29 €, Équipe 59 €, 10 € par personne | environ 93 % et 92 % | Prix au niveau d'Evoliz et d'Abby Premium, sans leur notoriété. Difficile à défendre tant qu'aucun client n'a témoigné. À reconsidérer après la bêta, si personne ne discute le prix. |
| **D. Ajouter une formule Micro** | Micro 9 € (franchise de TVA, sans export comptable ni équipe), plus B | environ 80 %, mais sur un petit montant | Va contre le principe « tout inclus » qui fait la force de Deviso, complique la grille (le guide insiste : la complexité tue), et vise un segment où les concurrents sont gratuits. Je ne le recommande pas. |

### Annuel, sièges, essai

- **Annuel** : garder **-20 %**, qui se situe dans le haut de la fourchette du marché. C'est un argument simple pour sécuriser la trésorerie et réduire les départs. Aucun changement nécessaire.
- **Sièges** : passer de **5 € à 8 €**. Un siège coûte peu à Deviso, mais chaque personne ouvre son propre plafond de 20 devis IA par jour, soit 10 à 15 € de coût possible par mois. 8 € reste sous Evoliz (9 €).
- **Plafond de l'IA** : remplacer « 20 par jour et par personne » par un **plafond mensuel par espace**, par exemple 150 devis par mois. Cela borne le pire cas sans gêner un usage normal (20 devis par mois en moyenne). Autre levier : passer à un modèle OpenAI plus récent et moins cher, ce qui demande un test de qualité des devis. C'est indépendant du prix et ne change rien pour le client.
- **Essai** : garder **14 jours** par défaut. C'est construit, testé, et proche de la norme de 15 jours. Pour les clients venus par un cabinet, porter l'essai à **2 mois**, comme le fait Tiime : un cabinet n'oriente pas son client vers un outil qui le relance au bout de deux semaines. Il faut un petit développement (un lien d'invitation cabinet qui allonge l'essai).

### Bêta et cabinet pilote : le tarif fondateur

- **Bêta-testeurs (5 à 10)** : gratuit pendant la bêta. Ensuite, **18 € ou 34 € garantis tant qu'ils restent abonnés**, même si la grille publique passe à 24 € et 44 €. L'avantage est réel, il récompense ceux qui s'engagent tôt, et il ne revient pas à offrir le produit (le guide met en garde contre la gratuité durable). Côté technique, il suffit de garder les prix actuels dans Stripe pour eux.
- **Cabinet pilote et ses 2 ou 3 clients** : gratuit, comme déjà décidé (`docs/reference/reports/Offre cabinets expertise comptable.md`). Sans aucun flux d'argent, la question déontologique ne se pose pas. Les clients du pilote bénéficient ensuite du tarif fondateur.

### Offre cabinet et parrainage par les cabinets

La règle, rappelée dans le rapport sur les cabinets : un expert-comptable ne peut pas toucher de commission pour un simple renvoi de clients. Seule une prestation réelle peut être rémunérée, et le client doit en connaître le montant à l'avance. La doctrine annoncée par l'Ordre en septembre 2026 n'est pas encore publiée sous forme de texte.

| Option | Ce que reçoit qui | Marge estimée | Risque déontologique | Recommandation |
|---|---|---|---|---|
| **Espace cabinet gratuit** (existe déjà) | le cabinet : son espace, ses exports, son résumé | aucun coût notable | nul | **garder**, c'est l'argument principal |
| **Avantage aux clients du cabinet** : 2 mois d'essai et -20 % la première année | le client, pas le cabinet | Indépendant à 19,20 € : environ 91 % | faible : c'est le client qui reçoit l'avantage | **oui, après le pilote** |
| **Le cabinet paie pour ses clients** et refacture Deviso dans sa lettre de mission, à un tarif groupé (-20 % dès 5 dossiers) | le cabinet achète, puis revend de manière accessoire, avec un montant annoncé au client | environ 91 % | faible si l'activité reste accessoire, le prix écrit dans la lettre de mission et le client informé | **à proposer au cabinet pilote comme question**, à ne construire que si un cabinet le demande (paiement de plusieurs espaces par un seul payeur : non développé) |
| **Rémunérer une prestation réelle** (mise en place, formation des clients) | le cabinet, pour un travail effectif | dépend du montant | défendable selon la doctrine de 2026 | **plus tard**, une fois le texte de l'Ordre publié |
| **Commission au parrainage**, y compris entre cabinets (Pennylane offre jusqu'à 500 € en cartes cadeaux) | le cabinet, pour un renvoi | | **élevé** : apport d'affaires sans travail | **non** |
| **Parrainage entre clients** : 1 mois offert au parrain et au filleul | les clients | environ 90 % sur un an | nul (pas de cabinet en jeu) | **oui, quand il y aura des clients** |

---

## 6. La décision qui te revient

Trois choix, dans cet ordre :

1. **La grille publique** : A (ne rien changer), **B (24 € et 44 €, siège à 8 €, recommandé)** ou C (29 € et 59 €).
2. **Le tarif fondateur** pour les bêta-testeurs et le cabinet pilote (18 € et 34 € garantis) : oui ou non.
3. **Les frais fixes** : passer Vercel et Supabase en offre payante avant le premier client payant (environ 45 € par mois) : oui ou non. C'est indépendant du prix, mais l'usage commercial sur l'offre gratuite de Vercel n'est pas autorisé.

Ce qui suivrait un accord sur B, et rien avant :
- dans Stripe : créer les nouveaux prix, sans toucher aux anciens qui serviront au tarif fondateur ;
- mettre à jour la page tarifs, les CGU (article sur les sièges, avec le contrôle qui compare le code et le texte) et le contrôle des prix ;
- parcourir le chemin complet (page tarifs, inscription, Stripe Checkout, webhook, page Abonnement), puis lancer `check:prod` après la mise en ligne.

Indépendamment du prix, et sans effet pour le client : le plafond mensuel de l'IA et l'allongement de l'essai pour les clients d'un cabinet.

**Questions encore ouvertes, qui ne bloquent pas la décision :** Super PDP facture-t-il les synchronisations horaires (question déjà rédigée dans `docs/reference/mail-superpdp.md`) ? Et quel est le plan Resend en cours sur ton compte ?
