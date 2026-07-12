import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour traducteurs freelances | Deviso",
  description:
    "Génère un devis de traduction en 30 secondes. Tarif au mot ou à la page, délai, paires de langues, révisions, devis professionnels avec signature électronique. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-traducteur" },
  openGraph: {
    title: "Devis traducteur freelance en 30 secondes | Deviso",
    description: "Tarif au mot ou à la page, paires de langues, révisions, délai, devis de traduction en 30s avec signature électronique. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-traducteur",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis traducteur freelance en 30 secondes | Deviso",
    description: "Tarif au mot ou à la page, paires de langues, révisions, délai, devis de traduction en 30s avec signature électronique.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour traducteurs freelances | Deviso"
      metaDescription="Génère un devis de traduction en 30 secondes. Tarif au mot ou à la page, délai, paires de langues, révisions, devis professionnels avec signature électronique."
      canonical="https://getdeviso.fr/freelance-traducteur"
      professionLabel="traducteur freelance"
      heroTitle="Tes devis de traduction,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris la mission, paire de langues, volume, délai. L'IA structure un devis complet avec les conditions de révision et de livraison. Ton client signe, tu traduis."
      painPoints={[
        {
          icon: "📝",
          title: "Tarifer au mot, à la page ou au forfait ?",
          desc: "Selon le type de document (technique, juridique, marketing) et la paire de langues, le mode de tarification change. L'IA de Deviso structure le devis selon le volume et le type de mission que tu décris.",
        },
        {
          icon: "🔔",
          title: "Clients qui envoient le document après le devis",
          desc: "Impossible de chiffrer exactement sans voir le document, mais le client veut un prix avant. Avec Deviso, génère un devis estimatif signé en 30 secondes, puis émets un avenant si le volume réel s'écarte.",
        },
        {
          icon: "📊",
          title: "Jongler entre plusieurs clients et délais serrés",
          desc: "Traductions express, deadlines multiples, relances, avec Deviso, chaque devis est suivi automatiquement. Tu sais en 1 coup d'œil quels documents attendent encore la signature et lesquels sont en retard de paiement.",
        },
      ]}
      mockupPrompt="Traduction de 10 pages web d'un site e-commerce de cosmétiques bio (anglais vers français). Contenu marketing orienté conversion, terminologie beauté/bien-être. Délai : 5 jours ouvrés. 1 cycle de révisions inclus."
      mockupRef="Devis n°2026-037"
      mockupClient="Marque Cosmétiques · Bordeaux"
      mockupLines={[
        { desc: "Traduction EN→FR pages produits (2 500 mots)", qty: "2 500 mots", price: "500 €" },
        { desc: "Traduction EN→FR pages éditoriales (1 500 mots)", qty: "1 500 mots", price: "300 €" },
        { desc: "Adaptation marketing et copywriting (slogans, CTA)", qty: "1 forfait", price: "200 €" },
        { desc: "Relecture et correction finale", qty: "1 forfait", price: "150 €" },
        { desc: "Livraison format Word + HTML balisé", qty: "1 forfait", price: "50 €" },
      ]}
      mockupTotal="1 200 € HT"
    />
  );
}
