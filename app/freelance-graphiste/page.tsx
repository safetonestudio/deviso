import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour graphistes freelances | Deviso",
  description:
    "Génère un devis de graphiste en 30 secondes grâce à l'IA. Signature électronique, facture Factur-X conforme 2026, relances automatiques. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-graphiste" },
  openGraph: {
    title: "Devis de graphiste en 30 secondes | Deviso",
    description: "Génère un devis de graphiste grâce à l'IA. Signature électronique, Factur-X 2026, relances auto. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-graphiste",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis de graphiste en 30 secondes | Deviso",
    description: "Génère un devis de graphiste grâce à l'IA. Signature électronique, Factur-X 2026, relances auto.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour graphistes freelances | Deviso"
      metaDescription="Génère un devis de graphiste en 30 secondes grâce à l'IA. Signature électronique, facture Factur-X conforme 2026, relances automatiques."
      canonical="https://getdeviso.fr/freelance-graphiste"
      professionLabel="graphiste freelance"
      heroTitle="Tes devis de graphiste,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris la mission, logo, charte, intégration. L'IA génère un devis structuré et professionnel. Ton client signe en ligne, tu factures en 1 clic."
      painPoints={[
        {
          icon: "🎨",
          title: "Chiffrer un projet créatif prend du temps",
          desc: "Décomposer une identité visuelle en lots, estimer les révisions, structurer les conditions, c'est un travail à part entière. Deviso le fait en 30 secondes à ta place.",
        },
        {
          icon: "🤝",
          title: "Les clients modifient après validation",
          desc: "Un devis signé électroniquement est un engagement. Deviso génère une preuve d'acceptation horodatée, les allers-retours sans fin appartiennent au passé.",
        },
        {
          icon: "📬",
          title: "Les relances manuelles tombent dans l'oubli",
          desc: "Tu envoies le devis, le client disparaît. Deviso relance automatiquement après 3, 7 ou 14 jours. Tu ne perds plus une mission par oubli.",
        },
      ]}
      mockupPrompt="Création de l'identité visuelle complète d'une startup fintech à Paris. Logo, charte graphique, déclinaisons print (carte de visite, papier entête) et digital (bannières, templates réseaux sociaux). Budget client : 3 200€, délai 3 semaines."
      mockupRef="Devis n°2026-031"
      mockupClient="Startup Fintech Paris"
      mockupLines={[
        { desc: "Audit de positionnement et moodboard", qty: "1 forfait", price: "400€" },
        { desc: "Création logo (3 propositions + révisions)", qty: "1 forfait", price: "900€" },
        { desc: "Charte graphique (typo, couleurs, grille)", qty: "1 forfait", price: "700€" },
        { desc: "Déclinaisons print (carte, entête, enveloppe)", qty: "1 forfait", price: "600€" },
        { desc: "Déclinaisons digital (bannières, templates)", qty: "1 forfait", price: "500€" },
      ]}
      mockupTotal="3 720€"
    />
  );
}
