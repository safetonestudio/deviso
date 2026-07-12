import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour artisans BTP | Deviso",
  description:
    "Génère un devis de chantier en 30 secondes avec les bons taux de TVA et la mention garantie décennale. Factur-X conforme 2026, acompte & solde. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-artisan" },
  openGraph: {
    title: "Devis artisan BTP en 30 secondes | Deviso",
    description: "Devis chantier avec TVA réduite et garantie décennale en 30s. Factur-X conforme 2026. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-artisan",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis artisan BTP en 30 secondes | Deviso",
    description: "Devis chantier avec TVA réduite et garantie décennale en 30s. Factur-X conforme 2026.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour artisans BTP | Deviso"
      metaDescription="Génère un devis de chantier en 30 secondes avec les bons taux de TVA et la mention garantie décennale. Factur-X conforme 2026, acompte & solde."
      canonical="https://getdeviso.fr/freelance-artisan"
      professionLabel="artisan BTP"
      heroTitle="Tes devis de chantier,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris les travaux, matériaux, surface, main d'œuvre. L'IA génère un devis complet avec les bons taux de TVA et la mention garantie décennale. Ton client signe, tu démarres le chantier."
      painPoints={[
        {
          icon: "🏗️",
          title: "La TVA à taux réduit, c'est risqué à mal appliquer",
          desc: "5,5% pour la rénovation énergétique, 10% pour les travaux courants, 20% pour le neuf, se tromper de taux expose à un redressement fiscal. L'IA de Deviso applique le bon taux selon la nature des travaux décrits.",
        },
        {
          icon: "🛡️",
          title: "La garantie décennale doit apparaître sur chaque devis",
          desc: "Nom de l'assureur, numéro de police, zone géographique couverte, ces mentions sont obligatoires sur tout devis de travaux. Deviso les intègre automatiquement à partir de vos paramètres de profil.",
        },
        {
          icon: "💸",
          title: "Acompte à la commande, solde à la réception",
          desc: "30% à la signature pour acheter les matériaux, 70% à la fin du chantier. Deviso génère la facture d'acompte et la facture de solde automatiquement, avec numérotation conforme et PDFs prêts.",
        },
      ]}
      mockupPrompt="Rénovation complète salle de bain : dépose de l'ancienne installation, remplacement baignoire par douche à l'italienne 120×90cm, nouveau carrelage mural et sol (15m²), remplacement robinetterie et accessoires. Appartement Paris 11e, résidence principale. Client particulier."
      mockupRef="Devis n°2026-031"
      mockupClient="M. Durand · Paris 11e"
      mockupLines={[
        { desc: "Dépose et évacuation ancienne installation", qty: "1 forfait", price: "350 €" },
        { desc: "Fourniture et pose douche italienne 120×90 + receveur", qty: "1 unité", price: "1 200 €" },
        { desc: "Carrelage mural et sol (fourniture + pose, 15m²)", qty: "15 m²", price: "1 800 €" },
        { desc: "Robinetterie et accessoires (fourniture + pose)", qty: "1 forfait", price: "650 €" },
        { desc: "Main d'œuvre et finitions", qty: "3 j", price: "900 €" },
      ]}
      mockupTotal="4 900 € HT"
    />
  );
}
