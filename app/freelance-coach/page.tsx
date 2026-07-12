import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour coachs freelances | Deviso",
  description:
    "Génère un devis de coaching ou d'accompagnement en 30 secondes. Séances individuelles, programmes, ateliers, signature électronique, relances auto. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-coach" },
  openGraph: {
    title: "Devis coach freelance en 30 secondes | Deviso",
    description: "Séances, programmes d'accompagnement, ateliers, devis de coaching en 30s avec signature électronique. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-coach",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis coach freelance en 30 secondes | Deviso",
    description: "Séances, programmes d'accompagnement, ateliers, devis de coaching en 30s avec signature électronique.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour coachs freelances | Deviso"
      metaDescription="Génère un devis de coaching ou d'accompagnement en 30 secondes. Séances individuelles, programmes, ateliers, signature électronique, relances auto."
      canonical="https://getdeviso.fr/freelance-coach"
      professionLabel="coach freelance"
      heroTitle="Tes devis de coaching,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris l'accompagnement, nombre de séances, durée, objectifs. L'IA génère un devis complet avec les bonnes conditions et modalités de paiement. Ton client signe, tu accompagnes."
      painPoints={[
        {
          icon: "🎯",
          title: "Justifier le prix d'un accompagnement intangible",
          desc: "Contrairement à un produit physique, la valeur du coaching n'est pas évidente pour tous les clients. Deviso structure le devis avec les objectifs, livrables et résultats attendus, pour que la valeur soit claire avant même la signature.",
        },
        {
          icon: "📅",
          title: "Les clients qui abandonnent en cours de programme",
          desc: "Sans conditions claires dans le devis, un client peut arrêter après 2 séances et refuser de payer le reste. Deviso inclut automatiquement les conditions d'annulation et de remboursement dans chaque devis.",
        },
        {
          icon: "📊",
          title: "Gérer 8 clients en même temps sans se noyer",
          desc: "Séances individuelles, programmes de groupe, ateliers ponctuels, avec Deviso, chaque devis est généré en 30 secondes et suivi automatiquement. Tu vois d'un coup d'œil qui a signé, qui a payé, qui relancer.",
        },
      ]}
      mockupPrompt="Programme d'accompagnement reconversion professionnelle pour une cadre de 38 ans qui souhaite passer du salariat à l'entrepreneuriat. 10 séances de coaching individuel d'1h en visioconférence sur 3 mois, accès à la bibliothèque de ressources, suivi email entre les séances."
      mockupRef="Devis n°2026-035"
      mockupClient="Mme Lefebvre · Paris"
      mockupLines={[
        { desc: "Bilan de situation initiale et définition des objectifs (2h)", qty: "1 séance", price: "280 €" },
        { desc: "Séances de coaching individuel (1h, visioconférence)", qty: "10 séances", price: "2 000 €" },
        { desc: "Accès bibliothèque de ressources et outils (3 mois)", qty: "1 forfait", price: "150 €" },
        { desc: "Suivi email entre les séances (réponse sous 48h)", qty: "1 forfait", price: "200 €" },
        { desc: "Bilan de fin de programme et plan d'action (2h)", qty: "1 séance", price: "280 €" },
      ]}
      mockupTotal="2 910 € HT"
    />
  );
}
