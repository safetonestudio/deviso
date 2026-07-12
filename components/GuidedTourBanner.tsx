"use client";

import Link from "next/link";
import { useGuidedTour } from "@/hooks/useGuidedTour";

type PageKey =
  | "dashboard"
  | "proposals"
  | "proposals_new"
  | "proposals_detail"
  | "invoices"
  | "invoices_new"
  | "invoices_detail"
  | "paiements"
  | "crm"
  | "stats"
  | "catalogue"
  | "team"
  | "profil";

const CONTENT: Record<PageKey, { title: string; body: string }> = {
  dashboard: {
    title: "Ton tableau de bord",
    body: "C'est ton point de départ chaque matin. Les KPIs en haut résument ton activité du mois : CA signé, devis en attente de réponse, taux de conversion. Les alertes en bas signalent ce qui nécessite ton attention : factures impayées, relances à envoyer, approbations en attente. Pour commencer, rends-toi dans Devis pour créer ton premier devis.",
  },
  proposals: {
    title: "Tes devis",
    body: "Cette page liste tous tes devis, classés par date. Chaque devis passe par des statuts automatiques : Brouillon → Envoyé → Vu → Signé (ou Refusé). Clique sur un devis pour le consulter, le modifier, l'envoyer par email ou le convertir en facture dès qu'il est signé. Le bouton \"+ Nouveau devis\" en haut à droite lance la création assistée par IA.",
  },
  proposals_new: {
    title: "Créer un devis",
    body: "Remplis les coordonnées de ton client, puis décris ton projet dans le champ Brief et clique sur \"Générer avec l'IA\" : le devis se remplit automatiquement avec les lignes, quantités et prix. Tu peux ensuite tout modifier librement. Une fois prêt, clique sur \"Envoyer\" pour que ton client reçoive un email avec un lien de signature sécurisé.",
  },
  proposals_detail: {
    title: "Détail du devis",
    body: "Depuis cette page tu peux : envoyer le devis par email à ton client, suivre s'il a été ouvert, voir la signature si le client a accepté, ou convertir le devis en facture en un clic. Si ton plan Pro est actif et que la validation est activée, le devis doit d'abord être approuvé par le manager avant d'être envoyé.",
  },
  invoices: {
    title: "Tes factures",
    body: "Tes factures sont générées au format Factur-X BASIC (PDF/A-3), conforme à la réforme de facturation électronique obligatoire en France à partir de 2026. Avant de créer ta première facture, configure ton moyen de paiement dans l'onglet \"Paiements clients\" : sans ça, la création est bloquée pour protéger tes clients. L'onglet \"Récurrentes\" (Pro) permet d'automatiser les factures mensuelles.",
  },
  invoices_new: {
    title: "Créer une facture",
    body: "Renseigne les coordonnées du client, ajoute tes prestations ligne par ligne avec quantité et prix unitaire HT. La TVA s'applique selon ton régime configuré dans Paramètres. Une fois créée, tu peux télécharger le PDF Factur-X ou l'envoyer directement par email : tes informations de paiement (IBAN ou lien) apparaîtront automatiquement dans l'email et sur le PDF.",
  },
  invoices_detail: {
    title: "Détail de la facture",
    body: "Depuis cette page : télécharge le PDF Factur-X, envoie la facture par email à ton client, accède au lien de paiement que tu as configuré, ou marque la facture comme payée. Le statut passe automatiquement à \"Envoyée\" à l'envoi. Pense à la marquer \"Payée\" dès réception du règlement pour que tes analytics restent justes.",
  },
  paiements: {
    title: "Paiements clients",
    body: "Cette page est à configurer en priorité, avant toute création de facture. Choisis comment tes clients te paient : un lien de paiement en ligne (Stripe, PayPal, Wise, Sumeria, Lydia…) ou ton IBAN pour les virements bancaires, ou les deux. Ces informations s'affichent automatiquement sur chaque facture PDF et dans l'email envoyée à ton client. Deviso ne perçoit aucune commission et ne touche jamais cet argent.",
  },
  crm: {
    title: "Clients & Revenus",
    body: "Ta base clients se remplit automatiquement à chaque devis ou facture envoyée. Retrouve ici chaque client avec son historique complet, le CA total qu'il représente, et ses coordonnées. Utilise ce CRM pour identifier tes clients les plus actifs et suivre tes revenus mois par mois sans sortir de Deviso.",
  },
  stats: {
    title: "Performance",
    body: "Visualise l'évolution de ton chiffre d'affaires, ton taux de conversion (devis → facture signée), et tes meilleures périodes. En plan Pro, les analytics avancées détaillent tes revenus par client et par mois, et tu peux exporter un fichier FEC (Fichier des Écritures Comptables) conforme pour ton expert-comptable, ou un CSV de toutes tes factures.",
  },
  catalogue: {
    title: "Catalogue de prestations",
    body: "Disponible en plan Pro. Crée ton catalogue de services une fois, réutilise-les partout. Deux types de prestations : forfaits à prix fixe (ex. « Création logo, 800 € ») et taux horaires avec sélecteur de durée au quart d'heure près (ex. « Développement, 95 €/h → 2h15 »). Lors de la création d'un devis ou d'une facture, pioche dans le catalogue en un clic pour ajouter une ligne pré-remplie. Les durées s'affichent lisiblement sur les PDFs (« 2h15 » plutôt que « 2.25 »).",
  },
  team: {
    title: "Équipe",
    body: "Disponible en plan Pro. Invite jusqu'à 3 collaborateurs sur ton workspace (puis 5 €/mois par utilisateur supplémentaire). Chaque membre a son propre profil qui apparaît sur les devis qu'il crée. Active la \"Validation avant envoi\" pour qu'un devis ne puisse pas être envoyé sans ton approbation. Le pipeline de suivi te donne une vue d'ensemble sur l'activité de toute l'équipe.",
  },
  profil: {
    title: "Paramètres",
    body: "Configure ton identité professionnelle : logo, coordonnées, SIRET, régime TVA et mentions légales. Ces informations apparaissent automatiquement sur tous tes devis et factures. En plan Pro, personnalise la couleur d'accent de tes documents, configure un domaine d'envoi email personnalisé (devis@tondomaine.fr / facturation@tondomaine.fr), et choisis un sous-domaine pour les liens de partage de tes devis.",
  },
};

interface GuidedTourBannerProps {
  pageKey: PageKey;
}

export function GuidedTourBanner({ pageKey }: GuidedTourBannerProps) {
  const { enabled } = useGuidedTour();

  if (!enabled) return null;

  const content = CONTENT[pageKey];
  if (!content) return null;

  return (
    <div className="bg-indigo-500/8 border border-indigo-500/25 rounded-xl px-4 py-4 mb-6 flex items-start gap-3">
      <span className="text-lg shrink-0 mt-0.5">💡</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-indigo-300 text-sm mb-1">{content.title}</p>
        <p className="text-xs text-indigo-200/70 leading-relaxed">{content.body}</p>
      </div>
      <Link
        href="/prise-en-main"
        className="shrink-0 text-[10px] text-indigo-400/60 hover:text-indigo-300 transition-colors mt-0.5 whitespace-nowrap"
      >
        Gérer →
      </Link>
    </div>
  );
}
