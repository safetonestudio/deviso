import Stripe from "stripe";
import { lazyClient } from "@/lib/lazy-client";

// Construction paresseuse (voir lib/lazy-client.ts) : évite qu'une clé
// absente de l'environnement de build (Preview Vercel notamment) fasse
// échouer tout le build plutôt que la seule route qui appelle Stripe.
/**
 * Point d'injection pour le banc d'essai, et lui seul.
 *
 * Vérifier qu'un changement de formule modifie l'abonnement au lieu d'en créer
 * un second demandait, jusqu'ici, un abonnement vivant sur le compte de
 * production — donc un vrai débit. `STRIPE_API_BASE` permet de faire parler le
 * SDK à un faux Stripe local (`scripts/e2e/faux-stripe.mjs`) et de traverser
 * les vraies routes sans toucher au compte réel.
 *
 * ⚠️ La surcharge n'est acceptée que vers la machine locale. Un détournement
 * vers un hôte tiers enverrait la clé secrète et les données de facturation
 * ailleurs ; ce n'est pas un réglage, c'est une porte. Elle reste donc fermée
 * pour toute valeur qui n'est pas 127.0.0.1 ou localhost, et `check:stripe`
 * vérifie que ce contrôle est toujours là.
 */
function baseLocale(): { host: string; port: number; protocol: "http" } | null {
  const brut = process.env.STRIPE_API_BASE;
  if (!brut) return null;
  let u: URL;
  try {
    u = new URL(brut);
  } catch {
    throw new Error(`STRIPE_API_BASE n'est pas une URL valide : ${brut}`);
  }
  if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") {
    throw new Error(
      `STRIPE_API_BASE ne peut désigner que la machine locale (reçu : ${u.hostname}). ` +
        `Une clé Stripe ne s'envoie pas ailleurs.`
    );
  }
  return { host: u.hostname, port: Number(u.port || 80), protocol: "http" };
}

export const stripe = lazyClient(() => {
  const locale = baseLocale();
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
    ...(locale ?? {}),
  });
});

export const PLANS = {
  free: {
    name: "Gratuit",
    maxProposalsPerMonth: 10,
    canCreateInvoices: false,
    canUploadLogo: false,
    hasAutoReminders: false,
    priceId: null,
    annualPriceId: null,
  },
  solo: {
    name: "Solo",
    maxProposalsPerMonth: Infinity,
    canCreateInvoices: true,
    canUploadLogo: true,
    hasAutoReminders: true,
    priceId: process.env.STRIPE_SOLO_PRICE_ID!,
    annualPriceId: process.env.STRIPE_SOLO_ANNUAL_PRICE_ID!,
  },
  pro: {
    name: "Pro",
    maxProposalsPerMonth: Infinity,
    canCreateInvoices: true,
    canUploadLogo: true,
    hasAutoReminders: true,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  },
} as const;

export type Plan = keyof typeof PLANS;

export function getPlan(plan: string | null | undefined): Plan {
  if (plan === "solo" || plan === "pro") return plan;
  return "free";
}
