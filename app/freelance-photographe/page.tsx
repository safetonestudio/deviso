import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour photographes freelances | Deviso",
  description:
    "Génère un devis photo en 30 secondes avec droits d'auteur, retouches et frais inclus. Acompte & solde, Factur-X conforme 2026. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-photographe" },
  openGraph: {
    title: "Devis de photographe freelance en 30 secondes | Deviso",
    description: "Génère un devis photo avec droits d'auteur et retouches en 30s. Acompte & solde, Factur-X 2026. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-photographe",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis de photographe freelance en 30 secondes | Deviso",
    description: "Génère un devis photo avec droits d'auteur et retouches en 30s. Acompte & solde, Factur-X 2026.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour photographes freelances | Deviso"
      metaDescription="Génère un devis photo en 30 secondes avec droits d'auteur, retouches et frais inclus. Acompte & solde, Factur-X conforme 2026."
      canonical="https://getdeviso.fr/freelance-photographe"
      professionLabel="photographe freelance"
      heroTitle="Tes devis photo,"
      heroHighlight="prêts en 30 secondes"
      heroSubtitle="Tu décris le reportage, shooting, retouches, droits d'auteur. L'IA génère un devis complet avec tous les postes. Acompte à la commande, solde après remise des fichiers."
      painPoints={[
        {
          icon: "📸",
          title: "Chiffrer shooting + retouches + droits, c'est complexe",
          desc: "Forfait shooting, post-production, droits d'utilisation, frais de déplacement, l'IA de Deviso structure automatiquement chaque poste à partir de ta description.",
        },
        {
          icon: "💰",
          title: "L'acompte avant, le solde après livraison",
          desc: "Deviso génère une facture d'acompte à la signature du devis, puis la facture de solde quand tu livres les fichiers. Numérotation automatique, PDFs conformes.",
        },
        {
          icon: "⏰",
          title: "Facturer juste après l'événement, en déplacement",
          desc: "En 30 secondes depuis ton téléphone, tu envoies le devis pendant que tu ranges ton matériel. Ton client signe sur son téléphone, tu es payé plus vite.",
        },
      ]}
      mockupPrompt="Reportage corporate pour une PME industrielle de 120 personnes à Nantes. Séance portrait équipe dirigeante (8 personnes), photos des locaux et ateliers, retouches et livraison de 60 photos HD. Droits de diffusion web et print 2 ans."
      mockupRef="Devis n°2026-019"
      mockupClient="PME Industrielle · Nantes"
      mockupLines={[
        { desc: "Demi-journée shooting (portrait + locaux)", qty: "1 forfait", price: "800€" },
        { desc: "Post-production et retouches (60 photos)", qty: "1 forfait", price: "600€" },
        { desc: "Droits d'utilisation web + print (2 ans)", qty: "1 forfait", price: "400€" },
        { desc: "Frais de déplacement Nantes A/R", qty: "1 forfait", price: "120€" },
        { desc: "Livraison galerie privée + fichiers HD", qty: "1 forfait", price: "80€" },
      ]}
      mockupTotal="2 400€"
    />
  );
}
