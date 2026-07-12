import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour formateurs indépendants | Deviso",
  description:
    "Génère un devis de formation en 30 secondes avec tous les éléments OPCO requis. Acompte & solde, Factur-X conforme 2026. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-formateur" },
  openGraph: {
    title: "Devis de formateur indépendant en 30 secondes | Deviso",
    description: "Génère un devis de formation avec mentions OPCO en 30s. Acompte & solde, Factur-X 2026. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-formateur",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis de formateur indépendant en 30 secondes | Deviso",
    description: "Génère un devis de formation avec mentions OPCO en 30s. Acompte & solde, Factur-X 2026.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour formateurs indépendants | Deviso"
      metaDescription="Génère un devis de formation en 30 secondes avec tous les éléments OPCO requis. Acompte & solde, Factur-X conforme 2026."
      canonical="https://getdeviso.fr/freelance-formateur"
      professionLabel="formateur indépendant"
      heroTitle="Tes devis de formation,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris la formation, thème, durée, public. L'IA génère un devis avec tous les éléments requis pour les OPCO. Acompte à la signature, solde après la session."
      painPoints={[
        {
          icon: "📝",
          title: "Les devis OPCO ont des exigences précises",
          desc: "Objectifs pédagogiques, modalités, durée, tarif HT/TTC, moyens d'évaluation, l'IA de Deviso intègre les mentions obligatoires dans le devis en 30 secondes.",
        },
        {
          icon: "💸",
          title: "30% à la commande, solde après la formation",
          desc: "Deviso génère automatiquement la facture d'acompte à la signature du devis, puis la facture de solde après la session. Numérotation conforme AC-/SLD-, PDFs prêts.",
        },
        {
          icon: "📄",
          title: "Facture électronique pour les organismes financeurs",
          desc: "OPCO, Pôle Emploi, collectivités, la facturation électronique Factur-X est déjà obligatoire pour certains et le devient pour tous en 2026. Deviso est déjà conforme.",
        },
      ]}
      mockupPrompt="Formation management d'équipe pour un groupe de 12 managers intermédiaires dans une PME de 200 personnes à Lyon. 2 jours en présentiel + 1 heure de suivi individuel par participant. Prise en charge OPCO Atlas."
      mockupRef="Devis n°2026-022"
      mockupClient="PME Industrie · Lyon"
      mockupLines={[
        { desc: "Formation management (2 jours · 14h)", qty: "1 forfait", price: "2 800€" },
        { desc: "Supports pédagogiques et outils (12 participants)", qty: "1 forfait", price: "600€" },
        { desc: "Évaluations pré/post formation", qty: "1 forfait", price: "200€" },
        { desc: "Suivi individuel (1h × 12 participants)", qty: "12 × 1h", price: "1 200€" },
        { desc: "Rapport de formation et attestations", qty: "1 forfait", price: "200€" },
      ]}
      mockupTotal="6 000€"
    />
  );
}
