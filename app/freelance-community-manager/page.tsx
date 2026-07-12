import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour community managers freelances | Deviso",
  description:
    "Génère un devis de gestion réseaux sociaux en 30 secondes. Forfaits mensuels, reporting, création de contenus, devis clairs et signés électroniquement. Essai gratuit.",
  alternates: { canonical: "https://getdeviso.fr/freelance-community-manager" },
  openGraph: {
    title: "Devis community manager freelance en 30 secondes | Deviso",
    description: "Forfaits mensuels réseaux sociaux, reporting, création de contenus, devis en 30s, signature électronique. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-community-manager",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis community manager freelance en 30 secondes | Deviso",
    description: "Forfaits mensuels réseaux sociaux, reporting, création de contenus, devis en 30s, signature électronique.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour community managers freelances | Deviso"
      metaDescription="Génère un devis de gestion réseaux sociaux en 30 secondes. Forfaits mensuels, reporting, création de contenus, devis clairs et signés électroniquement."
      canonical="https://getdeviso.fr/freelance-community-manager"
      professionLabel="community manager freelance"
      heroTitle="Tes devis réseaux sociaux,"
      heroHighlight="en 30 secondes"
      heroSubtitle="Tu décris la prestation, plateformes, volume de posts, création de visuels. L'IA structure un devis mensuel clair avec les bons livrables. Ton client signe, tu publies."
      painPoints={[
        {
          icon: "📱",
          title: "Un devis vague = un client qui négocie tout",
          desc: "Combien de posts ? Quelles plateformes ? Les visuels sont inclus ? La publicité aussi ? Deviso structure automatiquement chaque livrable pour éviter les négociations en cours de mission.",
        },
        {
          icon: "🔔",
          title: "Tes clients oublient de signer, puis de payer",
          desc: "Un client sans devis signé, c'est un client qui peut tout contester. Avec Deviso, il reçoit un lien sécurisé, signe en quelques secondes depuis son téléphone. Et si ça traîne, les relances partent automatiquement.",
        },
        {
          icon: "📊",
          title: "Suivre ton CA de 10 clients en même temps",
          desc: "Avec plusieurs forfaits mensuels actifs, savoir exactement ce que tu encaisses pour l'URSSAF devient complexe. Le widget CA de Deviso t'affiche tout en temps réel, mensuel et trimestriel.",
        },
      ]}
      mockupPrompt="Gestion des réseaux sociaux d'une PME e-commerce de mode (Instagram, LinkedIn, Facebook). 12 posts par mois par plateforme, création des visuels incluse, veille et réponse aux commentaires, 1 reporting mensuel avec KPIs. Durée : 3 mois renouvelables."
      mockupRef="Devis n°2026-033"
      mockupClient="PME E-commerce Mode · Lyon"
      mockupLines={[
        { desc: "Gestion Instagram, 12 posts/mois (visuels + captions)", qty: "1 forfait/mois", price: "500 €" },
        { desc: "Gestion LinkedIn, 8 posts/mois (articles + visuels)", qty: "1 forfait/mois", price: "350 €" },
        { desc: "Gestion Facebook, 8 posts/mois + stories", qty: "1 forfait/mois", price: "250 €" },
        { desc: "Veille, modération et engagement (DM, commentaires)", qty: "1 forfait/mois", price: "200 €" },
        { desc: "Reporting mensuel KPIs (reach, engagement, croissance)", qty: "1 rapport/mois", price: "150 €" },
      ]}
      mockupTotal="1 450 € HT / mois"
    />
  );
}
