import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour consultants freelances | Deviso",
  description:
    "Génère un devis de mission de conseil en 30 secondes. Facture Factur-X conforme 2026, Chorus Pro B2G, suivi CA en temps réel. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-consultant" },
  openGraph: {
    title: "Devis de consultant freelance en 30 secondes | Deviso",
    description: "Génère une proposition de mission en 30s grâce à l'IA. Factur-X grands comptes, Chorus Pro, suivi CA. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-consultant",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis de consultant freelance en 30 secondes | Deviso",
    description: "Génère une proposition de mission en 30s grâce à l'IA. Factur-X grands comptes, Chorus Pro, suivi CA.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour consultants freelances | Deviso"
      metaDescription="Génère un devis de mission de conseil en 30 secondes. Facture Factur-X conforme 2026, Chorus Pro B2G, suivi CA en temps réel."
      canonical="https://getdeviso.fr/freelance-consultant"
      professionLabel="consultant indépendant"
      heroTitle="Tes propositions de mission,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris la mission, livrables, jours, contexte. L'IA rédige une proposition de conseil complète. Ton client signe en ligne, tu factures en Factur-X conforme."
      painPoints={[
        {
          icon: "📋",
          title: "Rédiger une propale prend autant de temps que la mission",
          desc: "Contexte, objectifs, livrables, jalons, tarif journalier, l'IA de Deviso structure tout ça en quelques secondes à partir d'une simple description de ta mission.",
        },
        {
          icon: "🏢",
          title: "Les grands comptes veulent du Factur-X",
          desc: "Banques, assurances, grands groupes, la facture électronique B2B devient obligatoire dès 2026. Deviso génère du Factur-X BASIC natif, sans effort de ta part.",
        },
        {
          icon: "📊",
          title: "Suivre ton CA par mission et par client",
          desc: "Avec plusieurs missions en parallèle, savoir où tu en es pour l'URSSAF devient complexe. Le widget CA de Deviso t'affiche tout en temps réel, mensuel et trimestriel.",
        },
      ]}
      mockupPrompt="Mission de conseil en transformation digitale pour un cabinet d'expertise comptable de 80 personnes. Audit des outils actuels, benchmark des solutions marché, recommandations et roadmap sur 3 mois. Tarif journalier : 700€."
      mockupRef="Devis n°2026-024"
      mockupClient="Cabinet Expertise · Lyon"
      mockupLines={[
        { desc: "Audit des processus et outils actuels", qty: "5 j", price: "3 500€" },
        { desc: "Benchmark solutions marché", qty: "3 j", price: "2 100€" },
        { desc: "Rapport de recommandations", qty: "2 j", price: "1 400€" },
        { desc: "Roadmap transformation (plan détaillé)", qty: "2 j", price: "1 400€" },
        { desc: "Accompagnement au changement (3 mois)", qty: "1 forfait", price: "2 800€" },
      ]}
      mockupTotal="13 440€"
    />
  );
}
