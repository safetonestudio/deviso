"use client";

import Link from "next/link";
import { useGuidedTour } from "@/hooks/useGuidedTour";
import { Lightbulb } from "lucide-react";

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
  | "profil"
  | "factures-recues"
  | "declarations"
  | "achats-internationaux"
  | "livre-recettes"
  | "billing";

const CONTENT: Record<PageKey, { title: string; body: string }> = {
  dashboard: {
    title: "Ton tableau de bord",
    body: "Ton activité du mois d'un coup d'œil, et les alertes qui demandent une action : impayés, relances, approbations.",
  },
  proposals: {
    title: "Tes devis",
    body: "Tous tes devis, du brouillon au signé. Clique un devis pour l'ouvrir ; « + Nouveau devis » lance la création par IA.",
  },
  proposals_new: {
    title: "Créer un devis",
    body: "Décris ta mission, l'IA rédige le devis. Tu ajustes, puis « Envoyer » : ton client signe depuis un lien sécurisé.",
  },
  proposals_detail: {
    title: "Détail du devis",
    body: "Envoie le devis, suis son ouverture et sa signature, ou convertis-le en facture en un clic.",
  },
  invoices: {
    title: "Tes factures",
    body: "Tes factures au format Factur-X 2026. Configure d'abord un moyen de paiement (onglet Paiements) : sans ça, la création est bloquée.",
  },
  invoices_new: {
    title: "Créer une facture",
    body: "Ajoute tes lignes, la TVA suit ton régime. À l'envoi, ton IBAN ou ton lien de paiement s'affiche sur le PDF et l'email.",
  },
  invoices_detail: {
    title: "Détail de la facture",
    body: "Télécharge le PDF, envoie la facture, ou marque-la payée dès réception du règlement.",
  },
  paiements: {
    title: "Paiements clients",
    body: "À configurer en premier : ton lien de paiement ou ton IBAN. Il apparaît ensuite sur chaque facture. Deviso ne prend aucune commission.",
  },
  crm: {
    title: "Clients & revenus",
    body: "Tes clients et leur historique, remplis tout seuls à chaque devis ou facture.",
  },
  stats: {
    title: "Performance",
    body: "L'évolution de ton CA et ton taux de conversion. Export FEC et CSV pour ton comptable.",
  },
  catalogue: {
    title: "Catalogue de prestations",
    body: "Enregistre tes prestations une fois, réutilise-les en un clic. Plus ton catalogue est complet, plus l'IA génère juste.",
  },
  team: {
    title: "Équipe",
    body: "Invite tes collaborateurs, partage des modèles, et exige une validation avant envoi si besoin.",
  },
  profil: {
    title: "Paramètres",
    body: "Ton identité pro (logo, SIRET, TVA) qui apparaît sur tous tes documents.",
  },
  "factures-recues": {
    title: "Factures reçues",
    body: "Les factures de tes fournisseurs arrivent ici via la Plateforme Agréée. Tu n'agis qu'en cas de problème : un rejet à justifier ou un litige à signaler.",
  },
  declarations: {
    title: "Déclarations au fisc",
    body: "L'état de ce que la Plateforme Agréée déclare pour toi (e-reporting). Seuls les refus de l'administration demandent une action de ta part.",
  },
  "achats-internationaux": {
    title: "Achats à l'étranger",
    body: "Un achat auprès d'un fournisseur hors de France se déclare ici : sa facture ne passe pas par la Plateforme, tu la saisis et Deviso la déclare.",
  },
  "livre-recettes": {
    title: "Livre des recettes",
    body: "Ton livre des recettes obligatoire, tenu tout seul à partir de tes factures payées, dans l'ordre des encaissements. Rien à saisir à la main.",
  },
  billing: {
    title: "Abonnement",
    body: "Ton plan et ta facturation Deviso : change de formule, gère le nombre d'utilisateurs et retrouve tes justificatifs de paiement.",
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
    <div className="carte-app !border-indigo-500/40 rounded-xl px-4 py-4 mb-6 flex items-start gap-3">
      <Lightbulb size={17} className="shrink-0 mt-0.5 text-indigo-400" />
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
