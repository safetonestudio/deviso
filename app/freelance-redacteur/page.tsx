import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour rédacteurs freelances | Deviso",
  description:
    "Génère un devis de rédaction web ou copywriting en 30 secondes. Relances automatiques, signature électronique, widget CA URSSAF. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-redacteur" },
  openGraph: {
    title: "Devis de rédacteur freelance en 30 secondes | Deviso",
    description: "Génère un devis de rédaction web ou copywriting en 30s. Relances auto, widget URSSAF, signature électronique.",
    url: "https://getdeviso.fr/freelance-redacteur",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis de rédacteur freelance en 30 secondes | Deviso",
    description: "Génère un devis de rédaction web ou copywriting en 30s. Relances auto, widget URSSAF, signature électronique.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour rédacteurs freelances | Deviso"
      metaDescription="Génère un devis de rédaction web ou copywriting en 30 secondes. Relances automatiques, signature électronique, widget CA URSSAF."
      canonical="https://getdeviso.fr/freelance-redacteur"
      professionLabel="rédacteur freelance"
      heroTitle="Tes devis de rédaction,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris la mission, articles, pages web, séquences email. L'IA génère un devis structuré avec les bons volumes et tarifs. Ton client signe, tu encaisses."
      painPoints={[
        {
          icon: "✍️",
          title: "Gérer 10 petits clients en même temps",
          desc: "Beaucoup de clients, des petits budgets, des délais serrés. Avec Deviso, chaque devis prend 30 secondes, et les relances partent automatiquement si le client ne répond pas.",
        },
        {
          icon: "🔔",
          title: "Les clients oublient de signer, puis de payer",
          desc: "Deviso envoie des relances automatiques configurables à 3, 7 ou 14 jours. Tu ne cours plus après tes clients, Deviso le fait poliment à ta place.",
        },
        {
          icon: "📊",
          title: "Savoir exactement où tu en es pour l'URSSAF",
          desc: "En auto-entrepreneur, tu dois surveiller ton CA trimestriel de près. Le widget Deviso t'affiche ton CA encaissé en temps réel, mensuel et trimestriel. Pas de mauvaise surprise.",
        },
      ]}
      mockupPrompt="Rédaction du site web d'une agence de recrutement spécialisée en tech. 8 pages (accueil, services, équipe, blog x4, contact), optimisation SEO on-page incluse, livraison en 3 semaines."
      mockupRef="Devis n°2026-027"
      mockupClient="Agence Recrutement Tech · Bordeaux"
      mockupLines={[
        { desc: "Brief éditorial et arborescence", qty: "1 forfait", price: "250€" },
        { desc: "Rédaction pages corporate (accueil, services, équipe)", qty: "3 pages", price: "750€" },
        { desc: "Rédaction articles de blog SEO", qty: "4 articles", price: "800€" },
        { desc: "Page contact + mentions légales", qty: "1 forfait", price: "150€" },
        { desc: "Optimisation SEO on-page (balises, meta)", qty: "1 forfait", price: "200€" },
      ]}
      mockupTotal="2 580€"
    />
  );
}
