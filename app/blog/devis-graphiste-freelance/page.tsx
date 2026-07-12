import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis graphiste freelance : mentions obligatoires | Deviso",
  description:
    "Tout ce qu'un devis de graphiste freelance doit contenir : mentions légales, droits de cession, acompte, révisions. Exemple concret + erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-graphiste-freelance" },
  openGraph: {
    title: "Devis graphiste freelance : mentions obligatoires et exemple",
    description: "Mentions légales, droits de cession, acompte, révisions, tout ce qu'un devis de graphiste doit contenir. Exemple concret.",
    url: "https://getdeviso.fr/blog/devis-graphiste-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis graphiste freelance : mentions obligatoires et exemple",
    description: "Mentions légales, droits de cession, acompte, révisions, tout ce qu'un devis de graphiste doit contenir.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis de graphiste freelance : mentions obligatoires, exemple et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-graphiste-freelance" },
  about: { "@type": "Thing", name: "Devis graphiste freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Faut-il toujours mentionner les droits de cession dans un devis graphique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. En France, le Code de la Propriété Intellectuelle protège automatiquement le créateur. La cession des droits doit être écrite, précise (support, durée, zone) et peut être rémunérée séparément. Sans clause, vous conservez tous les droits.",
        },
      },
      {
        "@type": "Question",
        name: "Combien d'acompte demander sur un devis de graphiste ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Entre 30% et 50% à la commande est la pratique standard. Pour les missions courtes (logo simple), 50% est raisonnable. Pour les projets longs (identité complète), 30% à la commande + 30% à mi-projet est courant.",
        },
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPost
        h1="Devis de graphiste freelance : mentions obligatoires, exemple et erreurs à éviter"
        datePublished="2026-06-29"
        readingTime={6}
        profession="graphiste freelance"
        professionPlural="graphistes freelances"
        landingHref="/freelance-graphiste"
        landingLabel="logiciel de devis pour graphistes"
        intro="Créer un devis professionnel est une étape essentielle pour tout graphiste freelance. Un bon devis protège juridiquement, clarifie les attentes des deux côtés et accélère le paiement. Voici tout ce qu'il faut savoir pour rédiger un devis graphique conforme et efficace en 2026."
        mandatoryTitle="Les mentions obligatoires d'un devis de graphiste"
        mandatoryIntro="En tant que graphiste freelance, votre devis est un document juridique. Ces mentions sont obligatoires ou fortement recommandées pour éviter tout litige :"
        mandatoryItems={[
          {
            title: "Vos coordonnées complètes",
            desc: "Nom/raison sociale, adresse, numéro SIRET, et si applicable votre numéro de TVA intracommunautaire. En franchise de TVA, indiquez 'TVA non applicable, art. 293 B du CGI'.",
          },
          {
            title: "Coordonnées du client",
            desc: "Nom ou raison sociale, adresse, numéro SIRET s'il s'agit d'une entreprise. Indispensables en cas de litige ou de recouvrement.",
          },
          {
            title: "Description précise de la prestation",
            desc: "Détaillez chaque élément : création de logo (combien de propositions initiales ?), nombre de révisions incluses, charte graphique, formats livrés (AI, PDF, PNG, SVG…). Chaque point ambigu sera source de conflit.",
          },
          {
            title: "Droits de cession",
            desc: "Mentionnez explicitement les droits cédés : support d'utilisation (web, print, publicité), durée de cession, zone géographique. Sans clause, vous conservez tous les droits par défaut, ce qui surprend souvent les clients.",
          },
          {
            title: "Prix HT, TVA et total TTC",
            desc: "Pour chaque ligne et en total. Si vous êtes en franchise de TVA, indiquez la mention légale plutôt qu'un taux de 0%.",
          },
          {
            title: "Conditions de paiement et acompte",
            desc: "Pourcentage d'acompte à la commande (30 à 50% est standard), délai de paiement du solde (30 jours est la norme légale entre professionnels), et pénalités de retard obligatoires entre professionnels.",
          },
          {
            title: "Durée de validité du devis",
            desc: "30 jours est la norme. Sans cette mention, un client pourrait théoriquement accepter votre devis 6 mois plus tard au même tarif.",
          },
        ]}
        exampleClient="Startup fintech, Paris"
        exampleLines={[
          { desc: "Création du logo (3 propositions initiales)", qty: "1 forfait", price: "800 €" },
          { desc: "Charte graphique complète (typographies, couleurs, usages)", qty: "1 forfait", price: "1 200 €" },
          { desc: "Déclinaisons réseaux sociaux (6 formats)", qty: "6 formats", price: "400 €" },
          { desc: "Cession de droits web + print (illimitée, France)", qty: "1 forfait", price: "600 €" },
          { desc: "Fichiers sources livrés (AI, PDF, PNG, SVG)", qty: "1 forfait", price: "200 €" },
        ]}
        exampleTotal="3 200 € HT"
        exampleNote="Inclut 2 cycles de révisions. Au-delà, révisions supplémentaires facturées 80 €/h. Acompte 40% à la commande, solde à la livraison des fichiers sources."
        mistakes={[
          {
            title: "Ne pas limiter le nombre de révisions",
            desc: "\"Révisions incluses\" sans limite transforme une mission de 3 jours en cauchemar interminable. Indiquez toujours un nombre précis (ex : '2 cycles de révisions inclus, révisions supplémentaires à 80 €/h').",
          },
          {
            title: "Oublier la clause de droits d'auteur",
            desc: "En droit français, le créateur est auteur par défaut. Sans cession explicite dans le devis, votre client ne peut légalement pas utiliser votre création hors du contexte prévu, même s'il l'a payée intégralement.",
          },
          {
            title: "Ne pas préciser les formats livrés",
            desc: "Un client qui réclame 'le fichier source' après livraison peut créer des complications. Listez dès le devis les formats livrés : formats éditables (AI, Indd), formats web (PNG, SVG), formats impression (PDF).",
          },
          {
            title: "Oublier le délai de paiement et les pénalités de retard",
            desc: "Entre professionnels, les pénalités de retard sont obligatoires légalement depuis 2013. Sans mention, c'est le taux légal qui s'applique, mais votre client ne le saura peut-être pas. Indiquez : 'Pénalités de retard : 3× le taux d'intérêt légal'.",
          },
        ]}
        faq={[
          {
            q: "Faut-il toujours mentionner les droits de cession dans un devis graphique ?",
            a: "Oui, dès qu'il s'agit d'une création originale. En France, le Code de la Propriété Intellectuelle protège automatiquement le créateur. La cession des droits doit être écrite, précise (support, durée, zone géographique) et peut être rémunérée séparément. Sans clause explicite, vous conservez légalement tous les droits sur votre création.",
          },
          {
            q: "Combien d'acompte demander sur un devis de graphiste ?",
            a: "Entre 30% et 50% à la commande est la pratique standard en graphisme freelance. L'acompte couvre vos premiers travaux de recherche et sécurise la mission. Pour les missions courtes (logo simple), 50% est raisonnable. Pour les projets longs (identité complète), 30% à la commande + 30% à mi-projet + 40% à la livraison est courant.",
          },
          {
            q: "Comment gérer un devis graphiste en franchise de TVA ?",
            a: "Si votre chiffre d'affaires est en dessous du seuil de franchise (37 500 € pour les prestations de service en 2026), vous n'êtes pas assujetti à la TVA. Inscrivez la mention 'TVA non applicable, art. 293 B du CGI' sur chaque ligne. Ne créez pas une ligne à 0% TVA, c'est une erreur courante.",
          },
          {
            q: "Peut-on utiliser un modèle de devis gratuit pour le graphisme ?",
            a: "Oui, à condition que le modèle inclue toutes les mentions légales et des champs spécifiques au graphisme (droits de cession, révisions, formats livrés). Avec Deviso, l'IA génère automatiquement un devis adapté à votre métier en 30 secondes à partir d'une simple description de votre mission.",
          },
          {
            q: "Faut-il un devis signé pour commencer à travailler ?",
            a: "Légalement non, mais c'est fortement recommandé. Un devis signé constitue un contrat. Sans devis accepté, en cas de litige sur le prix ou le périmètre, vous n'avez aucun document pour vous protéger. Avec Deviso, la signature électronique prend quelques secondes depuis un téléphone.",
          },
        ]}
      />
    </>
  );
}
