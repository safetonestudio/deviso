import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const PLANS = {
  free: {
    name: "Free",
    maxProposals: 3,
    priceId: null,
  },
  pro: {
    name: "Pro",
    maxProposals: Infinity,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
};
