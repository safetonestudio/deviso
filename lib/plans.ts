import type { Plan } from "@/lib/stripe";

/*
  SOURCE UNIQUE DES DROITS PAR FORMULE.

  Un seul endroit décrit ce que chaque formule donne. Trois consommateurs
  lisent cette matrice, et aucun ne retape la liste à la main :

    1. L'application, pour autoriser ou refuser une action : can(plan, "crm").
    2. La vitrine et la page d'abonnement, pour afficher les listes de
       fonctions : planFeatures(plan).
    3. Le contrôle de build (scripts/check-plans.mjs), qui échoue si une
       surface affiche une fonction absente de cette matrice.

  Modifier un droit se fait ICI, et nulle part ailleurs. Ajouter une ligne
  à une carte de prix sans l'ajouter ici casse le build, volontairement.
  C'est ce qui empêche le retour des décalages vitrine / application.

  Chaque entrée :
    id      identifiant stable, utilisé par le code pour autoriser.
    label   texte exact affiché au visiteur (vitrine et page abonnement).
    plans   formules qui donnent droit à la fonction.
    show    true si la fonction figure dans la liste commerciale de la carte.
            (false pour un droit interne qui ne se vend pas sur une ligne.)
*/

export type Feature = {
  id: string;
  label: string;
  plans: Plan[];
  show: boolean;
};

export const FEATURES: Feature[] = [
  // Socle vendu sur la carte Solo (et inclus dans Pro).
  { id: "aiQuotes",       label: "Devis IA illimités en 30 secondes",              plans: ["solo", "pro"], show: true },
  { id: "signature",      label: "Signature électronique client",                  plans: ["solo", "pro"], show: true },
  { id: "facturX",        label: "Factures Factur-X conformes réforme 2026",       plans: ["solo", "pro"], show: true },
  { id: "recurring",      label: "Factures récurrentes, acompte et solde",         plans: ["solo", "pro"], show: true },
  { id: "chorusPro",      label: "Dépôt Chorus Pro B2G (marchés publics)",         plans: ["solo", "pro"], show: true },
  { id: "urssafWidget",   label: "Widget CA URSSAF mensuel / trimestriel",         plans: ["solo", "pro"], show: true },
  { id: "fecExport",      label: "Export comptable FEC",                           plans: ["solo", "pro"], show: true },
  { id: "noBranding",     label: "Sans branding Deviso sur vos documents",         plans: ["solo", "pro"], show: true },
  { id: "historyUnlimited", label: "Historique et exports illimités",              plans: ["solo", "pro"], show: true },
  { id: "livreRecettes",   label: "Livre des recettes tenu automatiquement",      plans: ["solo", "pro"], show: true },

  // Réservé Pro, vendu sur la carte Pro.
  { id: "remindersCustom", label: "Relances automatiques programmables",                      plans: ["pro"], show: true },
  { id: "csvRecap",        label: "Exports CSV et récap mensuel pour le comptable",           plans: ["pro"], show: true },
  { id: "crm",             label: "CRM Clients & Revenus + Analytics",                        plans: ["pro"], show: true },
  { id: "team",            label: "Gestion d'équipe, rôles et validation devis",              plans: ["pro"], show: true },
  { id: "catalog",         label: "Catalogue prestations : forfaits & suivi du temps",        plans: ["pro"], show: true },
  { id: "subdomain",       label: "Sous-domaine de partage (votremarque.getdeviso.fr)",       plans: ["pro"], show: true },
  { id: "accentColor",     label: "Couleur d'accent sur vos PDF",                             plans: ["pro"], show: true },

  // Droits internes, appliqués par l'application mais non vendus sur une
  // ligne de carte (pas de doublon avec les lignes commerciales ci-dessus).
  { id: "invoices",          label: "Émission de factures",             plans: ["solo", "pro"], show: false },
  { id: "logo",              label: "Logo personnalisé",                plans: ["solo", "pro"], show: false },
  { id: "signatureAdvanced", label: "Signature avancée (nom signataire)", plans: ["pro"],       show: false },
  { id: "templates",         label: "Modèles de devis",                 plans: ["solo", "pro"], show: false },
];

const BY_ID = new Map(FEATURES.map((f) => [f.id, f]));

/** L'application autorise-t-elle cette fonction pour cette formule ? */
export function can(plan: Plan, featureId: string): boolean {
  const f = BY_ID.get(featureId);
  if (!f) {
    throw new Error(`Fonction inconnue dans la matrice des droits : ${featureId}`);
  }
  return f.plans.includes(plan);
}

/** Libellés commerciaux à afficher pour une formule (lignes vendues). */
export function planFeatures(plan: Plan): string[] {
  return FEATURES.filter((f) => f.show && f.plans.includes(plan)).map((f) => f.label);
}

/** Libellés vendus UNIQUEMENT par Pro (au-delà de Solo), pour la carte Pro. */
export function proOnlyFeatures(): string[] {
  return FEATURES.filter(
    (f) => f.show && f.plans.includes("pro") && !f.plans.includes("solo")
  ).map((f) => f.label);
}

/**
 * Variante de can() tolérante à une chaîne libre (état d'UI typé string).
 * Évite d'importer getPlan depuis lib/stripe côté client, ce qui embarquerait
 * le SDK Stripe dans le bundle navigateur.
 */
export function canName(plan: string | null | undefined, featureId: string): boolean {
  const p: Plan = plan === "solo" || plan === "pro" ? plan : "free";
  return can(p, featureId);
}
