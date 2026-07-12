import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis traducteur freelance : tarification, révisions, droits sur la traduction | Deviso",
  description:
    "Comment rédiger un devis de traduction freelance : tarifer au mot ou à la page, inclure les révisions, gérer les droits sur la traduction et les tarifs urgence. Exemple et erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-traducteur-freelance" },
  openGraph: {
    title: "Devis traducteur freelance : tarification, révisions, droits sur la traduction",
    description: "Tarification au mot ou à la page, révisions, droits sur la traduction, tarif urgence, guide complet pour votre devis de traduction.",
    url: "https://getdeviso.fr/blog/devis-traducteur-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis traducteur freelance : tarification, révisions, droits sur la traduction",
    description: "Tarification, révisions, droits sur la traduction, guide complet pour votre devis de traduction freelance.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis traducteur freelance : tarification, révisions, droits sur la traduction et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-traducteur-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment fixer le prix d'une traduction : au mot, à la page ou au forfait ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La tarification au mot source est la plus courante et la plus transparente pour le client. La tarification à la page (250 mots source = 1 page) simplifie les calculs pour les documents longs. Le forfait convient aux missions avec volume difficile à estimer à l'avance (sites web, logiciels). Combinez selon le type de document : au mot pour les textes longs, au forfait pour les missions de localisation complexes.",
        },
      },
      {
        "@type": "Question",
        name: "Les droits de traduction appartiennent-ils au traducteur ou au client ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "En France, la traduction est une œuvre dérivée protégée par le droit d'auteur. Le traducteur en est l'auteur. La cession des droits patrimoniaux doit être explicitement prévue dans le contrat ou le devis : durée, territoire, supports d'exploitation. Sans mention, les droits restent au traducteur.",
        },
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPost
        h1="Devis traducteur freelance : tarification, révisions, droits sur la traduction et erreurs à éviter"
        datePublished="2026-06-29"
        readingTime={7}
        profession="traducteur freelance"
        professionPlural="traducteurs freelances"
        landingHref="/freelance-traducteur"
        landingLabel="logiciel de devis pour traducteurs freelances"
        intro="Un devis de traduction sans le volume exact (le client envoie le document après avoir signé), sans clause de révision, sans mention des droits d'auteur, c'est la recette des litiges. Voici comment structurer un devis de traduction freelance qui vous protège et rassure vos clients professionnels."
        mandatoryTitle="Les mentions obligatoires d'un devis de traduction freelance"
        mandatoryIntro="En plus des mentions légales classiques, un devis de traduction doit préciser les éléments spécifiques à la mission :"
        mandatoryItems={[
          {
            title: "Vos coordonnées et numéro SIRET",
            desc: "Nom ou raison sociale, adresse, SIRET. Mentionnez vos langues de travail et vos spécialités (traduction juridique, médicale, technique, marketing). Les clients B2B valorisent les certifications professionnelles : certification EN 17100 (norme européenne de qualité pour les traductions), membership SFT (Société Française des Traducteurs).",
          },
          {
            title: "Paire de langues et direction de la traduction",
            desc: "Langue source et langue cible avec indication de direction (anglais → français ou EN-FR). Mentionnez si la traduction est faite vers votre langue maternelle (recommandé) ou dans une langue étrangère. Pour les langues rares ou les traductions techniques, précisez votre expertise spécifique.",
          },
          {
            title: "Volume et unité de tarification",
            desc: "Nombre de mots source, de pages source, ou périmètre forfaitaire. Précisez quelle version du document sert de référence (version envoyée le [date] en pièce jointe, X mots selon comptage Word). Si le document n'est pas encore disponible, indiquez que le devis est estimatif et sera finalisé à réception.",
          },
          {
            title: "Tarif unitaire et mode de tarification",
            desc: "Au mot source (le plus courant), à la page (250 mots = 1 page standard), à l'heure (pour les interprétations et révisions), ou au forfait. Précisez si le tarif varie selon la technicité du document : texte marketing vs documentation technique vs acte juridique.",
          },
          {
            title: "Délai de livraison et format de livraison",
            desc: "Date de livraison ferme et format des fichiers livrés (Word, PDF, InDesign, format original du client, fichiers balisés pour l'intégration web). Si vous proposez une livraison express, mentionnez le tarif majoré associé. Précisez si vous prenez en charge la mise en page (DTP).",
          },
          {
            title: "Nombre de cycles de révision inclus",
            desc: "1 ou 2 cycles de révisions mineures inclus dans le tarif (corrections de sens, ajustements de style). Au-delà, facturation au taux horaire. Définissez ce qu'est une révision mineure vs une modification substantielle (changement de brief, nouveau document source, changement de ton).",
          },
          {
            title: "Cession des droits sur la traduction",
            desc: "En France, la traduction est une œuvre dérivée protégée par le droit d'auteur. Précisez les conditions de cession des droits patrimoniaux : durée (ex: 5 ans, ou définitive), territoire (France, monde entier), supports d'exploitation (web, print, broadcast). Sans mention expresse, les droits restent au traducteur.",
          },
          {
            title: "Confidentialité et clause NDA",
            desc: "Si le document contient des informations sensibles (contrats, données personnelles, documentation produit confidentielle), mentionnez votre engagement de confidentialité. Certains clients B2B exigeront de signer un NDA séparé avant de vous envoyer les documents.",
          },
        ]}
        exampleClient="Marque cosmétiques bio, Bordeaux (site e-commerce, 10 pages, EN→FR)"
        exampleLines={[
          { desc: "Traduction EN→FR pages produits, 2 500 mots source", qty: "2 500 mots", price: "500 €" },
          { desc: "Traduction EN→FR pages éditoriales (blog, about), 1 500 mots source", qty: "1 500 mots", price: "300 €" },
          { desc: "Adaptation marketing et copywriting (slogans, CTA, titres)", qty: "1 forfait", price: "200 €" },
          { desc: "Relecture et révision finale (1 cycle inclus)", qty: "1 forfait", price: "150 €" },
          { desc: "Livraison format Word + HTML balisé", qty: "1 forfait", price: "50 €" },
        ]}
        exampleTotal="1 200 € HT"
        exampleNote="TVA non applicable, art. 293 B du CGI. Basé sur le document transmis le 29/06/2026 (4 000 mots source, comptage Word). Livraison sous 5 jours ouvrés. 1 cycle de révisions mineures inclus. Droits cédés : utilisation web, France et international, 5 ans. Modifications majeures (nouveau brief ou document) feront l'objet d'un avenant."
        mistakes={[
          {
            title: "Devis estimatif sans voir le document source",
            desc: "Beaucoup de clients demandent un devis avant d'envoyer le document. Vous chiffrez 2 000 mots, le document en fait 3 500 avec une terminologie technique dense. La solution : déposez un devis estimatif basé sur les informations disponibles, et précisez qu'il sera finalisé à réception du document. Ou demandez un extrait représentatif pour évaluer la difficulté.",
          },
          {
            title: "Ne pas limiter les cycles de révision",
            desc: "Sans limite explicite, certains clients considèrent que les révisions sont illimitées. Après la traduction, ils envoient 3 rounds de corrections incluant des changements de brief complets. Précisez dans le devis : '1 cycle de révisions mineures inclus. Révisions supplémentaires facturées à [X€/heure]'.",
          },
          {
            title: "Oublier les droits sur la traduction",
            desc: "La traduction est une œuvre dérivée protégée par le Code de la propriété intellectuelle. Sans clause de cession explicite dans votre devis, votre client n'a pas légalement le droit d'utiliser la traduction pour une durée indéfinie ou sur tous les supports. Cette clause protège aussi bien le client (qui sait ce qu'il achète) que vous (en cas de litige ultérieur).",
          },
          {
            title: "Ne pas facturer le tarif urgence",
            desc: "\"Je dois avoir la traduction demain matin\" sans majoration, ça arrive trop souvent. Prévoyez dans votre devis et vos conditions générales un tarif urgence : +25% pour livraison sous 24h, +50% pour livraison le jour même. Mentionnez que ce tarif s'applique dès lors que la demande ne respecte pas le délai standard prévu.",
          },
        ]}
        faq={[
          {
            q: "Comment fixer le prix d'une traduction : au mot, à la page ou au forfait ?",
            a: "La tarification au mot source est la plus courante et la plus transparente. Elle permet au client de comprendre exactement ce qu'il paie. La tarification à la page (généralement 250 mots source = 1 page standard) simplifie les calculs pour les documents longs. Le forfait convient aux missions complexes avec volume difficile à estimer (sites web avec répétitions, logiciels avec chaînes de traduction). Les tarifs moyens en France varient de 0,08€ à 0,25€/mot selon la technicité : texte marketing (0,10-0,15€), traduction juridique ou médicale (0,15-0,25€).",
          },
          {
            q: "Les droits de traduction appartiennent-ils au traducteur ou au client ?",
            a: "En France, la traduction est une œuvre de l'esprit protégée par le droit d'auteur (art. L112-3 CPI). Le traducteur en est l'auteur. La cession des droits patrimoniaux doit être explicitement prévue dans le contrat ou le devis : durée, territoire, supports d'exploitation. Sans mention expresse de cession, les droits restent au traducteur même si la traduction est payée. En pratique, la plupart des devis incluent une cession complète pour un usage professionnel standard.",
          },
          {
            q: "Comment gérer un devis quand le client n'a pas encore le document final ?",
            a: "Émettez un devis estimatif basé sur le volume communiqué (ex: 'environ 3 000 mots'). Précisez que le devis sera finalisé à réception du document final, et qu'une variation de plus de 10% du volume entraînera un avenant. Pour les projets récurrents, négociez un tarif forfaitaire mensuel avec un volume inclus.",
          },
          {
            q: "Faut-il mentionner l'utilisation d'outils de TAO ou d'IA dans le devis ?",
            a: "Bonne pratique de transparence : si vous utilisez des mémoires de traduction (Trados, memoQ) qui réduisent le volume à traduire (répétitions, fuzzy matches), mentionnez-le dans votre devis et expliquez si cela se traduit par une remise sur les répétitions. Pour l'IA générative (ChatGPT, DeepL Pro), la pratique en matière de divulgation évolue, certains clients exigent explicitement 'pas d'IA' ou 'traduction humaine certifiée'. Anticipez la question.",
          },
        ]}
      />
    </>
  );
}
