import type { Metadata } from "next";
import { FreelanceLanding } from "@/components/landing/FreelanceLanding";

export const metadata: Metadata = {
  title: "Devis et facturation pour développeurs freelances | Deviso",
  description:
    "Génère un devis de développement en 30 secondes grâce à l'IA. Facture Factur-X, Chorus Pro B2G, acompte & solde. Essai gratuit sans carte bancaire.",
  alternates: { canonical: "https://getdeviso.fr/freelance-developpeur" },
  openGraph: {
    title: "Devis de développeur web en 30 secondes | Deviso",
    description: "Génère un devis de dev grâce à l'IA. Chorus Pro B2G, acompte & solde, Factur-X 2026. Essai gratuit.",
    url: "https://getdeviso.fr/freelance-developpeur",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis de développeur web en 30 secondes | Deviso",
    description: "Génère un devis de dev grâce à l'IA. Chorus Pro B2G, acompte & solde, Factur-X 2026.",
  },
};

export default function Page() {
  return (
    <FreelanceLanding
      metaTitle="Devis et facturation pour développeurs web freelances | Deviso"
      metaDescription="Génère un devis de développement en 30 secondes grâce à l'IA. Facture Factur-X, Chorus Pro B2G, acompte & solde."
      canonical="https://getdeviso.fr/freelance-developpeur"
      professionLabel="développeur freelance"
      heroTitle="Tes devis de dev,"
      heroHighlight="générés par l'IA"
      heroSubtitle="Tu décris le projet, stack, fonctionnalités, délai. L'IA structure le devis en lots techniques. Ton client signe en ligne, tu factures acompte puis solde en 1 clic."
      painPoints={[
        {
          icon: "⚙️",
          title: "Estimer un projet tech est un art",
          desc: "Décomposer en sprints, estimer les imprévus, chiffrer les intégrations tierces, ça prend des heures. L'IA de Deviso structure le devis en quelques secondes à partir de ta description.",
        },
        {
          icon: "🏛️",
          title: "Facturer le secteur public avec Chorus Pro",
          desc: "DSI, collectivités, ministères, le dépôt Chorus Pro est obligatoire. Deviso le fait en 1 clic directement depuis la facture, sans quitter l'interface.",
        },
        {
          icon: "💸",
          title: "Acompte à la commande, solde à la livraison",
          desc: "Deviso génère automatiquement une facture d'acompte puis une facture de solde, numérotées AC-/SLD-, avec les bons montants. Zéro calcul, zéro erreur.",
        },
      ]}
      mockupPrompt="Développement d'un dashboard SaaS en React + Node.js pour une startup RH de 15 personnes. Authentification, gestion des utilisateurs et rôles, tableaux de bord analytics, exports CSV. Délai 6 semaines. Acompte 30% à la signature."
      mockupRef="Devis n°2026-018"
      mockupClient="Startup RH · Paris"
      mockupLines={[
        { desc: "Architecture et mise en place environnements", qty: "1 forfait", price: "1 200€" },
        { desc: "Authentification et gestion des droits", qty: "1 forfait", price: "800€" },
        { desc: "Module utilisateurs (CRUD + rôles)", qty: "1 forfait", price: "1 500€" },
        { desc: "Dashboard analytics et graphiques", qty: "1 forfait", price: "1 000€" },
        { desc: "Exports CSV + documentation API", qty: "1 forfait", price: "600€" },
      ]}
      mockupTotal="6 120€"
    />
  );
}
