import Stripe from "stripe";
import { lazyClient } from "@/lib/lazy-client";

// Construction paresseuse (voir lib/lazy-client.ts) : évite qu'une clé
// absente de l'environnement de build (Preview Vercel notamment) fasse
// échouer tout le build plutôt que la seule route qui appelle Stripe.
export const stripe = lazyClient(() => new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
}));

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
