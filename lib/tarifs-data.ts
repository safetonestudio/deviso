// lib/tarifs-data.ts
// Données TJM par métier, sources : Malt Baromètre 2026, URSSAF, INSEE
// Mise à jour : juillet 2026

export interface TjmRange {
  min: number;
  max: number;
}

export interface Specialite {
  label: string;
  /** Pourcentage de premium par rapport au TJM confirmé moyen */
  premium: number;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface TarifsMetier {
  slug: string;
  name: string;         // "Graphiste"
  label: string;        // "graphiste freelance"
  title: string;        // title H1
  description: string;  // intro 2 phrases max
  landingHref: string;  // vers la landing page existante
  tjm: {
    junior:   TjmRange; // 0–2 ans
    confirme: TjmRange; // 2–5 ans
    senior:   TjmRange; // 5+ ans
  };
  /** Jours facturables réels / mois (après déduction prospection, admin, congés) */
  joursFacturables: number;
  specialites: Specialite[];
  erreurs: string[];
  faq: FaqItem[];
}

export const TARIFS_DATA: TarifsMetier[] = [
  {
    slug: "graphiste-freelance",
    name: "Graphiste",
    label: "graphiste freelance",
    title: "Combien facturer en tant que graphiste freelance ?",
    description:
      "Le TJM moyen d'un graphiste freelance en France varie de 180 € à 700 €/jour selon l'expérience et la spécialité. Voici les chiffres du marché 2026 et un simulateur pour calculer votre revenu net.",
    landingHref: "/freelance-graphiste",
    tjm: {
      junior:   { min: 180, max: 280 },
      confirme: { min: 280, max: 450 },
      senior:   { min: 450, max: 700 },
    },
    joursFacturables: 14,
    specialites: [
      { label: "Motion design / After Effects", premium: 35 },
      { label: "Direction artistique", premium: 50 },
      { label: "UI/UX Design", premium: 40 },
      { label: "Branding / identité visuelle", premium: 20 },
      { label: "Illustration vectorielle", premium: 10 },
    ],
    erreurs: [
      "Sous-évaluer le temps de brief et de corrections (comptez ×1,5 sur le temps de prod)",
      "Ne pas inclure les droits de cession dans le devis, ils peuvent représenter 20 à 50 % du prix de création",
      "Aligner son TJM sur les tarifs des plateformes low-cost (Fiverr, Malt Junior) plutôt que sur la valeur livrée",
      "Oublier la CFE (~500 €/an) et les frais logiciels (Suite Adobe ~70 €/mois) dans le calcul du revenu net",
    ],
    faq: [
      {
        q: "Quel est le TJM moyen d'un graphiste freelance en France ?",
        a: "Selon le Baromètre Malt 2026, le TJM médian d'un graphiste freelance est de 340 €/jour, avec des écarts importants selon la spécialité : un motion designer senior peut facturer jusqu'à 800 €/j tandis qu'un débutant en PAO commence autour de 200 €/j.",
      },
      {
        q: "Comment calculer mon TJM en tant que graphiste freelance ?",
        a: "Multipliez votre TJM par vos jours facturables réels (environ 14/mois après admin, prospection et congés). Déduisez 22 % de cotisations URSSAF si vous êtes en micro-BNC. Le reste est votre BNC net avant impôt.",
      },
      {
        q: "Faut-il facturer les droits de cession en plus du devis de création ?",
        a: "Oui, si vous cédez les droits d'exploitation à votre client (usage commercial, reproduction, diffusion). Cette cession doit être mentionnée explicitement dans le devis. Elle représente généralement 20 à 50 % du prix de création pour une utilisation standard.",
      },
      {
        q: "Comment augmenter son TJM quand on est graphiste freelance ?",
        a: "Se spécialiser (motion design, UX, branding) est le levier le plus efficace. Constituer un book ciblé sur une niche, travailler avec des agences ou des startups en croissance, et améliorer sa capacité à chiffrer la valeur livrée (pas seulement le temps passé) permettent d'augmenter de 30 à 50 % son tarif en 12 à 18 mois.",
      },
      {
        q: "Peut-on faire ses devis de graphiste sans Excel ?",
        a: "Oui. Deviso génère un devis complet en 30 secondes à partir d'une description de la mission, avec les lignes de prestation, les droits de cession et les conditions de paiement. Il est ensuite envoyé par email avec signature électronique intégrée.",
      },
    ],
  },

  {
    slug: "developpeur-web-freelance",
    name: "Développeur web",
    label: "développeur web freelance",
    title: "Combien facturer en tant que développeur web freelance ?",
    description:
      "Le TJM d'un développeur web freelance varie de 300 € à 950 €/jour en France. Les profils spécialisés (cloud, data, mobile) peuvent dépasser 1 000 €/j. Voici les données de marché 2026.",
    landingHref: "/freelance-developpeur",
    tjm: {
      junior:   { min: 300, max: 420 },
      confirme: { min: 420, max: 620 },
      senior:   { min: 620, max: 950 },
    },
    joursFacturables: 16,
    specialites: [
      { label: "DevOps / Cloud (AWS, GCP, Azure)", premium: 45 },
      { label: "Data Engineering / IA", premium: 55 },
      { label: "Mobile iOS / Android", premium: 30 },
      { label: "Cybersécurité / Pentest", premium: 50 },
      { label: "Frontend React / Next.js", premium: 20 },
    ],
    erreurs: [
      "Facturer à la journée alors que le client cherche un forfait, proposer les deux options",
      "Ne pas inclure les phases de recette et de déploiement dans le devis (souvent 20–30 % du projet)",
      "Accepter des missions régie longues à TJM trop bas par peur du vide, sous-évaluer son profil face à des ESN",
      "Ignorer la TVA (si assujetti) dans la comparaison avec les salariés, le TJM brut n'est pas le revenu",
    ],
    faq: [
      {
        q: "Quel est le TJM moyen d'un développeur web freelance en France ?",
        a: "Selon le Baromètre Malt 2026, le TJM médian est de 510 €/jour. Les profils full-stack React/Node.js confirmés facturent 450–650 €/j, tandis que les spécialistes cloud ou data peuvent dépasser 900 €/j.",
      },
      {
        q: "TJM ou forfait : quoi choisir pour une mission de développement ?",
        a: "Le TJM est idéal pour les missions en régie (contexte ESN, grand compte) ou les projets dont le périmètre peut évoluer. Le forfait est préférable pour les projets bien définis (landing page, MVP) : il sécurise le client sur le budget et vous protège d'un dépassement de jours non facturés.",
      },
      {
        q: "Comment justifier un TJM élevé face à un client ?",
        a: "Présentez la valeur créée (CA généré, coût évité, délai réduit) plutôt que le temps passé. Un développeur qui livre un MVP en 3 semaines au lieu de 2 mois crée une valeur business quantifiable. Montrez vos références et habituez-vous à chiffrer le ROI de vos réalisations.",
      },
      {
        q: "Combien de jours par mois un développeur freelance peut-il facturer ?",
        a: "En moyenne 15–16 jours/mois, en déduisant les congés (5 semaines/an), les jours de prospection, la veille technologique, et l'administration. En régie à temps plein, on peut atteindre 18–19 jours, mais c'est exceptionnel sur le long terme.",
      },
      {
        q: "Quel outil pour gérer les devis et factures d'un développeur freelance ?",
        a: "Deviso génère automatiquement les devis (lignes de prestation, conditions de paiement, TVA) et les factures conformes Factur-X. Le suivi des paiements et les relances automatiques vous évitent de courir après les impayés.",
      },
    ],
  },

  {
    slug: "consultant-freelance",
    name: "Consultant",
    label: "consultant freelance",
    title: "Combien facturer en tant que consultant freelance ?",
    description:
      "Le TJM d'un consultant freelance en France varie de 400 € à 1 400 €/jour selon l'expertise et le secteur. Finance, pharma et transformation digitale concentrent les tarifs les plus élevés.",
    landingHref: "/freelance-consultant",
    tjm: {
      junior:   { min: 400, max: 550 },
      confirme: { min: 550, max: 850 },
      senior:   { min: 850, max: 1400 },
    },
    joursFacturables: 17,
    specialites: [
      { label: "Finance / M&A / Private equity", premium: 50 },
      { label: "Pharma / Biotech / Santé", premium: 55 },
      { label: "Transformation digitale / SI", premium: 25 },
      { label: "Supply chain / Logistique", premium: 20 },
      { label: "Management / Change management", premium: 15 },
    ],
    erreurs: [
      "S'aligner sur les grilles ESN qui intègrent leurs marges, votre TJM doit être 30–50 % au-dessus",
      "Ne pas facturer la phase de cadrage et d'audit préalable (souvent gratuite par habitude)",
      "Accepter des missions sans clause de dédit, si le client annule à J-5, vous perdez une semaine",
      "Négliger la mise en valeur des résultats chiffrés dans vos propositions commerciales",
    ],
    faq: [
      {
        q: "Quel est le TJM moyen d'un consultant freelance en France ?",
        a: "Selon le Baromètre Malt 2026, le TJM médian des consultants est de 680 €/jour. Les consultants en stratégie ou finance senior peuvent dépasser 1 200 €/j, tandis que les profils généralistes juniors démarrent autour de 450 €/j.",
      },
      {
        q: "Comment positionner son TJM en sortant d'une ESN ?",
        a: "En sortant d'une ESN, votre TJM doit intégrer la marge que l'ESN prenait sur vous (généralement 30–50 %). Si vous étiez facturé 800 €/j à votre client, votre TJM indépendant cible est 700–800 €/j, pas 400 €/j.",
      },
      {
        q: "Faut-il créer une SASU ou rester en micro-entreprise comme consultant ?",
        a: "En micro-BNC, le plafond est de 77 700 €/CA par an. À 700 €/j × 16 jours = 11 200 €/mois × 12 = 134 400 €/an, vous dépassez largement ce seuil. Une EURL ou SASU à l'IS devient indispensable au-delà de 80 000 € de CA, pour optimiser la rémunération et les charges.",
      },
      {
        q: "Comment facturer une mission de conseil forfaitaire ?",
        a: "Découpez la mission en phases (audit, recommandations, déploiement) avec des livrables précis. Proposez un forfait global avec jalons de paiement (30 % à la commande, 40 % à mi-parcours, 30 % à la livraison). Cela protège les deux parties.",
      },
      {
        q: "Quel outil pour émettre des devis professionnels en tant que consultant ?",
        a: "Deviso génère un devis structuré en quelques secondes, avec vos lignes de mission, vos conditions de paiement et votre CGV. Le client signe électroniquement depuis son téléphone, et la facture est émise en 1 clic.",
      },
    ],
  },

  {
    slug: "photographe-freelance",
    name: "Photographe",
    label: "photographe freelance",
    title: "Combien facturer en tant que photographe freelance ?",
    description:
      "Le TJM d'un photographe freelance varie de 150 € à 900 €/jour. La photo corporate et publicitaire est bien mieux rémunérée que le reportage ou le portrait. Voici les tarifs du marché 2026.",
    landingHref: "/freelance-photographe",
    tjm: {
      junior:   { min: 150, max: 280 },
      confirme: { min: 280, max: 500 },
      senior:   { min: 500, max: 900 },
    },
    joursFacturables: 12,
    specialites: [
      { label: "Photographie publicitaire / packshot", premium: 65 },
      { label: "Photo corporate / institutionnel", premium: 30 },
      { label: "Photo de produit e-commerce", premium: 20 },
      { label: "Reportage événementiel", premium: 0 },
      { label: "Photo architecturale / immobilier", premium: 25 },
    ],
    erreurs: [
      "Oublier de facturer la post-production, comptez 1 h de retouche pour 2–3 h de prise de vue",
      "Ne pas inclure les droits d'utilisation (usage web vs print vs national vs international)",
      "Sous-tarifer la photo de produit e-commerce en la comparant à la photo portrait",
      "Ne pas sécuriser un acompte, les clients annulent ou reportent sans prévenir",
    ],
    faq: [
      {
        q: "Quel est le tarif journalier moyen d'un photographe freelance ?",
        a: "Un photographe corporate confirmé facture 300–500 €/j pour la prise de vue, auxquels s'ajoutent les droits d'utilisation (50–200 % du prix de création selon la diffusion). La journée inclut généralement 1–2 h de post-production basique.",
      },
      {
        q: "Comment facturer les droits photographiques ?",
        a: "Les droits se facturent en fonction du support (web, print, affichage), de la durée (1 an, 3 ans, illimité) et de la zone géographique (nationale, internationale). Un usage web illimité 1 an peut valoir 30–50 % du prix de la prise de vue. Précisez tout dans le devis.",
      },
      {
        q: "Combien de jours par mois un photographe freelance peut-il facturer ?",
        a: "En moyenne 10–12 jours de prise de vue facturable par mois. La post-production (non facturée séparément) occupe 30–40 % du temps restant. Le reste va à la prospection, la gestion du matériel, et l'administration.",
      },
      {
        q: "Faut-il demander un acompte pour une session photo ?",
        a: "Oui, toujours. Un acompte de 30–50 % à la commande protège contre les annulations de dernière minute. Mentionnez dans le devis les conditions d'annulation (remboursement partiel selon le délai de prévenance).",
      },
      {
        q: "Comment simplifier la facturation photographique ?",
        a: "Avec Deviso, vous créez un devis avec prise de vue, post-production et droits sur des lignes séparées. Le client signe en ligne, vous émettez la facture en 1 clic avec le détail des prestations, pratique pour les clients exigeants en termes de transparence.",
      },
    ],
  },

  {
    slug: "redacteur-web-freelance",
    name: "Rédacteur web",
    label: "rédacteur web freelance",
    title: "Combien facturer en tant que rédacteur web freelance ?",
    description:
      "Le TJM d'un rédacteur web freelance varie de 130 € à 550 €/jour. La spécialisation SEO ou UX writing permet de doubler les tarifs. Découvrez les chiffres du marché 2026.",
    landingHref: "/freelance-redacteur",
    tjm: {
      junior:   { min: 130, max: 220 },
      confirme: { min: 220, max: 360 },
      senior:   { min: 360, max: 550 },
    },
    joursFacturables: 15,
    specialites: [
      { label: "UX Writing / Microcopy", premium: 55 },
      { label: "SEO technique / stratégie de contenu", premium: 35 },
      { label: "Copywriting / publicité", premium: 40 },
      { label: "Rédaction juridique / financière", premium: 50 },
      { label: "Ghostwriting / livre blanc", premium: 30 },
    ],
    erreurs: [
      "Facturer au mot ou à l'article plutôt qu'au résultat, 500 mots de qualité valent plus que 2 000 mots génériques",
      "Ne pas inclure les allers-retours de correction (2 révisions incluses max, au-delà facturer)",
      "Accepter des briefs flous sans brief écrit validé, source de corrections infinies",
      "Sous-estimer le temps de recherche et d'interviews pour les articles à forte valeur ajoutée",
    ],
    faq: [
      {
        q: "Quel est le tarif journalier moyen d'un rédacteur web freelance ?",
        a: "Selon le Baromètre Malt 2026, le TJM médian est de 280 €/j pour un rédacteur web généraliste. Un profil spécialisé SEO senior peut atteindre 400–500 €/j. Les tarifs varient fortement selon la thématique (finance, santé = premium).",
      },
      {
        q: "Comment facturer la rédaction web : au mot, à l'article ou à la journée ?",
        a: "Le tarif à la journée est le plus transparent. Le tarif au mot crée de l'incertitude (longueur variable selon les sujets). Le tarif à l'article peut fonctionner pour des formats standardisés (fiches produits, articles blog courts). Proposez systématiquement un devis au forfait avec périmètre précis.",
      },
      {
        q: "Combien un rédacteur web freelance peut-il produire par jour ?",
        a: "Un bon rédacteur web produit 1 500–2 500 mots optimisés SEO par jour (recherche + rédaction + optimisation incluses). Pour du contenu expert avec interviews ou du copywriting élaboré, comptez 800–1 200 mots/jour.",
      },
      {
        q: "Quel TJM viser pour du contenu SEO optimisé ?",
        a: "Un rédacteur SEO confirmé peut facturer 300–400 €/j (incluant la recherche de mots-clés, la structure, la rédaction et l'optimisation on-page). La valeur créée est tangible et mesurable en trafic organique, utilisez cet argument pour défendre votre tarif.",
      },
      {
        q: "Comment simplifier la facturation quand on a plusieurs clients ?",
        a: "Deviso centralise tous vos devis et factures, et envoie des relances automatiques si une facture n'est pas payée sous 7 ou 14 jours. En rédaction web, les impayés sont fréquents sur les petites commandes, l'automatisation des relances change tout.",
      },
    ],
  },

  {
    slug: "formateur-freelance",
    name: "Formateur",
    label: "formateur freelance",
    title: "Combien facturer en tant que formateur freelance ?",
    description:
      "Le TJM d'un formateur freelance varie de 350 € à 1 600 €/jour, hors TVA. Les formations certifiantes QUALIOPI et la thématique (management, digital) ont un fort impact sur les tarifs.",
    landingHref: "/freelance-formateur",
    tjm: {
      junior:   { min: 350, max: 550 },
      confirme: { min: 550, max: 900 },
      senior:   { min: 900, max: 1600 },
    },
    joursFacturables: 12,
    specialites: [
      { label: "Management / Leadership", premium: 35 },
      { label: "Digital / IA / Data", premium: 45 },
      { label: "Formation certifiante QUALIOPI", premium: 40 },
      { label: "Prise de parole / communication", premium: 25 },
      { label: "RH / Droit social", premium: 30 },
    ],
    erreurs: [
      "Ne pas comptabiliser le temps de conception (1 j de formation = 2–3 j de préparation pour un nouveau module)",
      "Oublier que la TVA peut ne pas s'appliquer si la formation est exonérée (déclaration d'activité + attestation fiscale)",
      "Proposer un TJM unique sans distinguer la conception et l'animation (deux activités avec des temps très différents)",
      "Ne pas sécuriser les droits sur les supports pédagogiques produits pour le compte du client",
    ],
    faq: [
      {
        q: "Quel est le tarif journalier moyen d'un formateur freelance en France ?",
        a: "En France, le TJM médian d'un formateur freelance se situe autour de 700 €/j pour l'animation. Il faut y ajouter les jours de conception (non facturés directement ou intégrés dans le forfait). Les thématiques digitales et management premium peuvent dépasser 1 200 €/j.",
      },
      {
        q: "La formation est-elle soumise à la TVA ?",
        a: "Les prestations de formation professionnelle continue sont exonérées de TVA si vous détenez une déclaration d'activité auprès de la DREETS (DIRECCTE) et que vous fournissez une attestation de formation fiscale à vos clients. Sans cette déclaration, la TVA s'applique à 20 %.",
      },
      {
        q: "Faut-il avoir la certification QUALIOPI pour être formateur freelance ?",
        a: "QUALIOPI est obligatoire uniquement si vos clients veulent utiliser des financements OPCO, CPF ou France Compétences. Elle permet d'accéder à des marchés plus importants mais représente un investissement en temps (audit initial + suivis). Non obligatoire pour facturer directement des entreprises.",
      },
      {
        q: "Comment facturer la conception et l'animation séparément ?",
        a: "Distinguez dans le devis le 'forfait conception' (x jours à TJM conception) et le 'forfait animation' (x jours à TJM animation). Le TJM animation est généralement 20–30 % plus élevé que le TJM conception. Cela évite de mélanger deux prestations très différentes.",
      },
      {
        q: "Comment gérer les devis et factures avec des clients en OPCO ?",
        a: "Les OPCO exigent des devis détaillés avec les objectifs pédagogiques, le nombre d'heures, le profil du formateur et les modalités d'évaluation. Deviso vous permet de personnaliser chaque ligne du devis et d'ajouter vos CGV pédagogiques, acceptées à la signature.",
      },
    ],
  },

  {
    slug: "artisan-freelance",
    name: "Artisan",
    label: "artisan indépendant",
    title: "Combien facturer en tant qu'artisan indépendant ?",
    description:
      "Le prix journalier d'un artisan indépendant varie de 250 € à 900 €/jour selon le corps de métier et la spécialisation. Les labels RGE et les certifications augmentent significativement les tarifs.",
    landingHref: "/freelance-artisan",
    tjm: {
      junior:   { min: 250, max: 400 },
      confirme: { min: 400, max: 600 },
      senior:   { min: 600, max: 900 },
    },
    joursFacturables: 20,
    specialites: [
      { label: "Rénovation énergétique (label RGE)", premium: 35 },
      { label: "Électricité haute tension / tertiaire", premium: 45 },
      { label: "Plomberie / chauffage", premium: 20 },
      { label: "Menuiserie / ébénisterie haut de gamme", premium: 30 },
      { label: "Restauration du patrimoine", premium: 40 },
    ],
    erreurs: [
      "Ne pas inclure les déplacements et le temps de trajet dans le devis (surtout pour les chantiers éloignés)",
      "Sous-évaluer les fournitures et ne pas les faire apparaître sur le devis (marge sur matériaux)",
      "Proposer un prix au forfait sur un chantier mal cadré, exiger un relevé ou une visite préalable",
      "Ne pas prévoir une clause de révision de prix sur les matériaux (fluctuation acier, bois, cuivre)",
    ],
    faq: [
      {
        q: "Quel est le prix journalier moyen d'un artisan indépendant en France ?",
        a: "Un artisan confirmé (plombier, électricien, menuisier) facture 400–600 €/j en main-d'œuvre pure, hors matériaux. Ce tarif varie selon la région (Île-de-France : +20–30 %), la qualification (RGE, QualiPV) et l'urgence.",
      },
      {
        q: "Faut-il séparer main-d'œuvre et fournitures sur le devis ?",
        a: "Oui. Un devis artisan clair distingue la main-d'œuvre (prix HT/j ou HT forfait), les fournitures (prix d'achat + marge, généralement 20–30 %), et les frais annexes (déplacement, location de matériel). Cela évite les malentendus et facilite les demandes de financement (CEE, MaPrimeRénov').",
      },
      {
        q: "Comment facturer les travaux supplémentaires non prévus au devis ?",
        a: "Émettez un avenant de devis dès que le périmètre change. Ne faites jamais de travaux supplémentaires sans accord écrit signé, en cas de litige, l'absence d'avenant vous expose. Deviso permet d'envoyer un avenant en quelques minutes avec e-signature.",
      },
      {
        q: "Comment gérer les acomptes sur les chantiers ?",
        a: "Pour un chantier > 3 000 €, l'acompte standard est de 30 % à la commande. Pour un chantier long, échelonnez en jalons (30/40/30 ou mensuel). Deviso gère les factures d'acompte et de solde avec numérotation automatique conforme (AC-2026-XXX).",
      },
      {
        q: "Quel outil pour faire des devis artisan rapidement sur chantier ?",
        a: "Deviso fonctionne sur mobile. Vous décrivez la mission en quelques phrases, l'IA génère le devis avec les postes de main-d'œuvre et de fournitures. Le client signe depuis son téléphone. Plus besoin de rentrer au bureau pour rédiger un devis.",
      },
    ],
  },

  {
    slug: "community-manager-freelance",
    name: "Community Manager",
    label: "community manager freelance",
    title: "Combien facturer en tant que community manager freelance ?",
    description:
      "Le TJM d'un community manager freelance varie de 150 € à 650 €/jour. La spécialisation paid social ou influence double les tarifs par rapport à la gestion organique seule.",
    landingHref: "/freelance-community-manager",
    tjm: {
      junior:   { min: 150, max: 250 },
      confirme: { min: 250, max: 400 },
      senior:   { min: 400, max: 650 },
    },
    joursFacturables: 14,
    specialites: [
      { label: "Paid social (Meta Ads, TikTok Ads)", premium: 45 },
      { label: "Stratégie influence / UGC", premium: 35 },
      { label: "LinkedIn B2B / Personal branding", premium: 30 },
      { label: "Social commerce / live shopping", premium: 40 },
      { label: "Community management e-commerce", premium: 15 },
    ],
    erreurs: [
      "Facturer au forfait mensuel trop bas sans limiter le nombre de posts, stories et modérations inclus",
      "Ne pas distinguer la création de contenu (plus long) et la simple programmation / modération",
      "Accepter d'être disponible 7j/7 pour la modération sans surfacturer l'astreinte",
      "Sous-évaluer le temps de reporting mensuel (3–5 h/mois non comptabilisées)",
    ],
    faq: [
      {
        q: "Quel est le TJM moyen d'un community manager freelance ?",
        a: "Selon le Baromètre Malt 2026, le TJM médian est de 310 €/j. Un CM spécialisé en paid social ou influence peut dépasser 500 €/j, tandis qu'un profil débutant en gestion organique démarre à 150–200 €/j.",
      },
      {
        q: "Comment facturer la gestion des réseaux sociaux : au forfait ou au TJM ?",
        a: "Le forfait mensuel est la norme en community management : il rassure le client sur son budget et vous donne de la visibilité. Définissez précisément ce qu'il inclut (x publications/semaine, x formats, modération J+x h, reporting mensuel). Toute prestation hors périmètre se facture en supplément.",
      },
      {
        q: "Faut-il facturer la création de contenu séparément de la gestion de communauté ?",
        a: "Oui. La création (photos, vidéos, graphismes) et la gestion (programmation, modération, reporting) sont deux activités distinctes. Créer du contenu prend 2–3× plus de temps que de le publier. Proposez deux forfaits séparés ou un forfait global avec les deux clairement détaillés.",
      },
      {
        q: "Comment gérer les clients qui demandent des modifications constantes de contenu ?",
        a: "Incluez 1–2 allers-retours de révision par publication dans votre forfait. Au-delà, facturez au temps passé (taux horaire). Mentionnez cette clause dans votre devis et dans vos CGV, cela professionnalise votre relation client et évite les abus.",
      },
      {
        q: "Quel outil pour envoyer des devis de community management ?",
        a: "Deviso génère des devis détaillés avec vos forfaits mensuels, les réseaux couverts, le nombre de publications et les modalités de révision. Le client signe électroniquement et reçoit la facture chaque mois automatiquement.",
      },
    ],
  },

  {
    slug: "coach-freelance",
    name: "Coach",
    label: "coach freelance",
    title: "Combien facturer en tant que coach freelance ?",
    description:
      "Le tarif d'un coach freelance varie de 100 € à 800 €/jour. Le coaching exécutif et le coaching d'équipe atteignent des niveaux bien au-dessus du coaching individuel. Voici les données 2026.",
    landingHref: "/freelance-coach",
    tjm: {
      junior:   { min: 100, max: 180 },
      confirme: { min: 180, max: 400 },
      senior:   { min: 400, max: 800 },
    },
    joursFacturables: 10,
    specialites: [
      { label: "Coaching exécutif / dirigeants", premium: 100 },
      { label: "Coaching d'équipe / team building", premium: 55 },
      { label: "Coaching de vie / transition", premium: 0 },
      { label: "Business coaching / entrepreneuriat", premium: 40 },
      { label: "Coaching certifié ICF (PCC, MCC)", premium: 35 },
    ],
    erreurs: [
      "Facturer à la séance au lieu de proposer un programme structuré (parcours 6–12 séances), réduit le churn et augmente la valeur perçue",
      "Pratiquer des tarifs trop bas par peur de légitimité, cela envoie un signal négatif sur la qualité",
      "Ne pas demander d'acompte : un coaching annulé en dernière minute représente une perte sèche",
      "Sous-évaluer le temps hors séance (préparation, compte-rendus, suivi entre séances)",
    ],
    faq: [
      {
        q: "Quel est le tarif d'une séance de coaching freelance ?",
        a: "Une séance de coaching individuel (60–90 min) se facture 80–200 € pour un coach certifié débutant, 200–400 € pour un profil confirmé (5+ ans, certification ICF), et 400–800 € pour du coaching exécutif senior. Ces tarifs s'entendent à la séance ou dans le cadre d'un forfait programme.",
      },
      {
        q: "Comment structurer une offre de coaching pour mieux se vendre ?",
        a: "Proposez des 'programmes' plutôt que des séances isolées : 'Programme Transition 6 séances = X €', 'Accompagnement Dirigeant 12 mois = X €'. Le client perçoit mieux la valeur, vous sécurisez vos revenus plusieurs mois à l'avance, et le suivi est plus efficace.",
      },
      {
        q: "Le coaching est-il soumis à la TVA ?",
        a: "Oui, le coaching est soumis à la TVA à 20 % (sauf si vous bénéficiez de la franchise en base sous 36 800 € de CA). Contrairement à la formation, le coaching n'est pas exonéré de TVA en France sauf s'il est reconnu comme prestation de formation (déclaration DREETS obligatoire).",
      },
      {
        q: "Combien de clients un coach freelance peut-il suivre simultanément ?",
        a: "En coaching individuel, la capacité standard est de 10–15 clients actifs. Au-delà, la qualité de présence diminue. Cela représente 10–15 séances/mois d'animation, soit 8–12 jours en intégrant la préparation et les échanges inter-séances.",
      },
      {
        q: "Comment facturer professionnellement ses clients en coaching ?",
        a: "Avec Deviso, vous pouvez créer un devis 'Programme coaching 6 séances' avec le détail des livrables, les dates et les conditions d'annulation. Le client signe en ligne, vous émettez la facture (ou fractionnez en plusieurs paiements).",
      },
    ],
  },

  {
    slug: "traducteur-freelance",
    name: "Traducteur",
    label: "traducteur freelance",
    title: "Combien facturer en tant que traducteur freelance ?",
    description:
      "Le TJM d'un traducteur freelance varie de 120 € à 500 €/jour. La traduction juridique, médicale ou technique est bien mieux valorisée que la traduction généraliste.",
    landingHref: "/freelance-traducteur",
    tjm: {
      junior:   { min: 120, max: 200 },
      confirme: { min: 200, max: 320 },
      senior:   { min: 320, max: 500 },
    },
    joursFacturables: 18,
    specialites: [
      { label: "Traduction médicale / pharmaceutique", premium: 65 },
      { label: "Traduction juridique / notariale", premium: 55 },
      { label: "Traduction technique / brevet", premium: 40 },
      { label: "Localisation logiciel / jeu vidéo", premium: 35 },
      { label: "Traduction financière / bancaire", premium: 50 },
    ],
    erreurs: [
      "Accepter des tarifs au mot trop bas par crainte de perdre le client (0.05 €/mot = ~100 €/j, insoutenable à long terme)",
      "Ne pas facturer la relecture et la révision séparément de la traduction brute",
      "Travailler sans mémoire de traduction (SDL Trados, memoQ), perd du temps et de l'argent sur les répétitions",
      "Ne pas prévoir de majoration pour les délais urgents (< 24 h, week-end)",
    ],
    faq: [
      {
        q: "Quel est le tarif au mot d'un traducteur freelance en France ?",
        a: "Le tarif moyen au mot en France est de 0.09–0.14 € pour une paire de langues standard (EN→FR). Pour une paire rare ou une spécialité (médical, juridique), le tarif monte à 0.14–0.20 €/mot. À 2 000 mots/j, un traducteur confirmé génère 180–280 €/j.",
      },
      {
        q: "Comment facturer : au mot, à la page ou à la journée ?",
        a: "Le tarif au mot est le standard international et le plus lisible pour le client. La tarification à la page (250 mots/page) est surtout utilisée en traduction assermentée. Le TJM est utile pour la localisation ou les projets sur devis. Proposez toujours les deux : un tarif au mot pour les volumes et un forfait pour les projets complexes.",
      },
      {
        q: "Combien de mots par jour peut traduire un traducteur professionnel ?",
        a: "En vitesse de croisière, un traducteur professionnel produit 1 500–2 500 mots de traduction nette par jour (texte source simple, paire maîtrisée). Pour de la traduction spécialisée ou des textes très denses, comptez 1 000–1 500 mots/j. La post-édition de traduction automatique (MTPE) peut dépasser 4 000 mots/j.",
      },
      {
        q: "Faut-il être assermenté pour travailler avec des clients professionnels ?",
        a: "L'assermentation est requise uniquement pour les traductions officielles (actes civils, documents judiciaires, diplômes). La grande majorité des traductions professionnelles (marketing, technique, commercial) ne nécessite pas d'assermentation. Être traducteur expert auprès d'une cour d'appel renforce votre crédibilité mais n'est pas obligatoire.",
      },
      {
        q: "Quel outil pour émettre des devis et factures de traduction ?",
        a: "Deviso vous permet de créer un devis avec le volume (x mots à x €/mot), la langue, le domaine et le délai. Le client signe en ligne, et la facture Factur-X conforme est émise en 1 clic, idéal pour les agences qui exigent des factures structurées.",
      },
    ],
  },
];

/** Récupère les données d'un métier par slug */
export function getTarifsMetier(slug: string): TarifsMetier | undefined {
  return TARIFS_DATA.find((m) => m.slug === slug);
}

/** Slugs de tous les métiers disponibles */
export const ALL_METIER_SLUGS = TARIFS_DATA.map((m) => m.slug);

/**
 * Calcul simulateur TJM, Micro-BNC (régime le plus courant en prestation intellectuelle)
 *
 * Cotisations URSSAF : 22 % du CA
 * → BNC net avant IR = CA × 78 %
 *
 * Source URSSAF : taux 2024 applicable jusqu'à nouveau décret
 */
export function simulateTjm(params: {
  tjm: number;
  joursParMois: number;
}): {
  caMensuel: number;
  urssaf: number;
  netAvantIr: number;
  caAnnuel: number;
} {
  const { tjm, joursParMois } = params;
  const caMensuel = tjm * joursParMois;
  const urssaf = Math.round(caMensuel * 0.22);
  const netAvantIr = caMensuel - urssaf;
  const caAnnuel = caMensuel * 11; // ~11 mois facturables/an (1 mois de congés)
  return { caMensuel, urssaf, netAvantIr, caAnnuel };
}

/**
 * Calcul inverse : quel TJM pour atteindre X € net/mois ?
 * Net cible = TJM × jours × 0.78  →  TJM = net / (jours × 0.78)
 */
export function simulateReverse(params: {
  netCible: number;
  joursParMois: number;
}): {
  tjmRequis: number;
  caMensuelRequis: number;
  urssaf: number;
} {
  const { netCible, joursParMois } = params;
  const caMensuelRequis = Math.ceil(netCible / 0.78);
  const tjmRequis = Math.ceil(caMensuelRequis / joursParMois);
  const urssaf = Math.round(caMensuelRequis * 0.22);
  return { tjmRequis, caMensuelRequis, urssaf };
}
