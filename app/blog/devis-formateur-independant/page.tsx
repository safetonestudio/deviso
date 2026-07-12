import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis formateur indépendant : mentions OPCO, exemple 2026 | Deviso",
  description:
    "Comment rédiger un devis de formation professionnelle : mentions obligatoires OPCO, objectifs pédagogiques, acompte/solde, Factur-X. Exemple et erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-formateur-independant" },
  openGraph: {
    title: "Devis formateur indépendant : mentions OPCO et exemple 2026",
    description: "Mentions OPCO obligatoires, objectifs pédagogiques, acompte/solde, Factur-X, guide complet pour votre devis de formation.",
    url: "https://getdeviso.fr/blog/devis-formateur-independant",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis formateur indépendant : mentions OPCO et exemple 2026",
    description: "Mentions OPCO obligatoires, objectifs pédagogiques, acompte/solde, Factur-X, guide complet pour votre devis de formation.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis de formateur indépendant : mentions OPCO, exemple et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-formateur-independant" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quelles mentions sont obligatoires dans un devis de formation pour un financement OPCO ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Un devis de formation pour financement OPCO doit obligatoirement contenir : intitulé de la formation, objectifs pédagogiques, durée en heures, modalité (présentiel/distanciel), public visé, moyens d'évaluation, prix HT et modalités de paiement. Sans ces éléments, l'OPCO peut refuser la prise en charge.",
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
        h1="Devis de formateur indépendant : mentions OPCO, exemple et erreurs à éviter"
        datePublished="2026-06-29"
        readingTime={6}
        profession="formateur indépendant"
        professionPlural="formateurs indépendants"
        landingHref="/freelance-formateur"
        landingLabel="logiciel de devis pour formateurs"
        intro="Un devis de formation professionnelle n'est pas un devis ordinaire. Si votre client finance via un OPCO (Atlas, Constructys, Opco EP…), certaines mentions sont obligatoires sous peine de refus de prise en charge. Voici comment rédiger un devis conforme qui simplifie la vie de votre client, et la vôtre."
        mandatoryTitle="Les mentions obligatoires d'un devis de formation professionnelle"
        mandatoryIntro="Au-delà des mentions légales classiques, un devis de formation doit répondre aux exigences des OPCO et de la réglementation sur la formation professionnelle :"
        mandatoryItems={[
          {
            title: "Intitulé exact de la formation",
            desc: "Le titre de la formation tel qu'il sera repris dans la convention de formation et la facture. Évitez les titres vagues comme 'Formation management', préférez 'Formation management d'équipe pour managers intermédiaires'.",
          },
          {
            title: "Objectifs pédagogiques",
            desc: "Minimum 3 objectifs formulés en termes de compétences acquises : 'À l'issue de cette formation, le stagiaire sera capable de…'. C'est une exigence légale depuis la loi du 5 mars 2014 et un critère de contrôle Qualiopi.",
          },
          {
            title: "Durée en heures et modalité",
            desc: "Durée totale en heures (ex : 14h soit 2 jours), modalité (présentiel, distanciel, mixte), lieu si présentiel. Séparez les heures de formation des heures de suivi individuel si applicable.",
          },
          {
            title: "Public visé et prérequis",
            desc: "Décrivez le public cible (managers, commerciaux, équipes techniques) et les prérequis éventuels. Ces éléments permettent à l'OPCO de valider l'adéquation de la formation.",
          },
          {
            title: "Moyens pédagogiques et d'évaluation",
            desc: "Supports (slides, exercices, études de cas), méthodes (exposés, mises en situation, jeux de rôle), et modalités d'évaluation (QCM, grille d'auto-évaluation, quiz de fin de session). Obligatoire pour la conformité Qualiopi.",
          },
          {
            title: "Prix HT et modalités de paiement",
            desc: "Prix total HT, TVA applicable ou exonération (les formations professionnelles continue sont exonérées de TVA sous conditions), et conditions de paiement : acompte à la commande, solde après la formation.",
          },
          {
            title: "Conditions d'annulation",
            desc: "Délai de prévenance pour annulation sans frais (10 jours ouvrés minimum est courant), montant des pénalités en cas d'annulation tardive, politique de report.",
          },
        ]}
        exampleClient="PME Industrie, Lyon (200 personnes, financement OPCO Atlas)"
        exampleLines={[
          { desc: "Formation management d'équipe (2 jours · 14h présentiel)", qty: "1 forfait", price: "2 800 €" },
          { desc: "Supports pédagogiques (slides, exercices, livret participant × 12)", qty: "1 forfait", price: "600 €" },
          { desc: "Évaluations pré/post formation (quiz + grille de compétences)", qty: "1 forfait", price: "200 €" },
          { desc: "Suivi individuel post-formation (1h × 12 participants, distanciel)", qty: "12 × 1h", price: "1 200 €" },
          { desc: "Rapport de formation + attestations individuelles (12 participants)", qty: "1 forfait", price: "200 €" },
        ]}
        exampleTotal="5 000 € HT"
        exampleNote="Exonération de TVA applicable (formation professionnelle continue, déclaration d'activité enregistrée). Acompte 30% à la commande (1 500 €), solde à l'issue de la formation. Annulation à moins de 10 jours ouvrés : 50% du montant total dû."
        mistakes={[
          {
            title: "Objectifs pédagogiques trop vagues",
            desc: "'Améliorer le management' n'est pas un objectif pédagogique conforme. L'OPCO et les inspecteurs Qualiopi attendent des formulations actionnables : 'Être capable de conduire un entretien de recadrage en appliquant la méthode DESC' est un objectif valide.",
          },
          {
            title: "Oublier les conditions d'annulation",
            desc: "Une entreprise qui annule une formation in-company 3 jours avant vous coûte une journée bloquée dans votre agenda, des supports imprimés et parfois un déplacement. Sans clause d'annulation dans le devis, vous n'avez aucun recours.",
          },
          {
            title: "Confondre TVA applicable et exonération",
            desc: "La formation professionnelle continue est exonérée de TVA à condition d'avoir votre numéro de déclaration d'activité et que la formation entre dans le champ de la formation professionnelle. Si ces conditions ne sont pas réunies, vous devez facturer la TVA au taux normal. Ne présumez pas de votre statut.",
          },
          {
            title: "Ne pas anticiper la facturation Factur-X pour les organismes publics",
            desc: "Si votre client est un organisme public (ministère, collectivité, hôpital), la facturation via Chorus Pro est obligatoire. Et dès 2026, la facturation Factur-X est imposée aux grandes entreprises. Assurez-vous de pouvoir émettre des factures électroniques conformes.",
          },
        ]}
        faq={[
          {
            q: "Quelles mentions sont obligatoires dans un devis de formation pour un financement OPCO ?",
            a: "Un devis de formation pour financement OPCO doit contenir : intitulé de la formation, objectifs pédagogiques formulés en compétences acquises, durée en heures, modalité (présentiel/distanciel), public visé, prérequis éventuels, moyens pédagogiques et d'évaluation, prix HT et modalités de paiement. Sans ces éléments, l'OPCO peut refuser la prise en charge ou demander des compléments.",
          },
          {
            q: "La TVA s'applique-t-elle sur une facture de formation professionnelle ?",
            a: "Non, sous conditions. La formation professionnelle continue est exonérée de TVA si vous êtes déclaré comme organisme de formation (numéro de déclaration d'activité obtenu auprès de la DREETS) et si la prestation entre dans le champ de la formation professionnelle continue. Sans déclaration d'activité, vous devez appliquer la TVA au taux normal de 20%.",
          },
          {
            q: "Faut-il être certifié Qualiopi pour facturer des formations en 2026 ?",
            a: "Qualiopi est obligatoire uniquement si vous souhaitez que vos formations soient éligibles aux financements publics ou mutualisés (OPCO, CPF, Pôle Emploi, Régions). Si votre client finance la formation sur fonds propres sans passer par un OPCO, Qualiopi n'est pas requise. Cependant, de plus en plus d'entreprises exigent Qualiopi même pour les financements internes.",
          },
          {
            q: "Comment rédiger une convention de formation en plus du devis ?",
            a: "La convention de formation est le contrat qui accompagne le devis pour les formations financées par OPCO. Elle reprend les éléments du devis et y ajoute : les coordonnées complètes des deux parties, le programme détaillé, les conditions d'accès et de suivi des stagiaires. Certains OPCO fournissent leurs propres modèles de convention. Deviso génère les devis, la convention peut être rédigée séparément ou intégrée au devis signé.",
          },
        ]}
      />
    </>
  );
}
