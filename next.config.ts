import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Anti-clickjacking : empêche le dashboard d'être embarqué en iframe
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche les navigateurs de deviner le Content-Type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Force HTTPS pour 1 an
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Referrer limité aux origines identiques
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive les fonctionnalités navigateur non nécessaires
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // CSP : 'unsafe-inline' requis pour Tailwind + Next.js inline styles
  // 'unsafe-eval' requis pour @react-pdf/renderer
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.crisp.chat https://client.crisp.chat",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://cdn.crisp.chat",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://client.crisp.chat wss://client.crisp.chat https://api.resend.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Erreurs TypeScript corrigées le 13/07/2026 — le build est strict désormais.
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "selim-albert",
  project: "javascript-nextjs",

  // Désactiver l'upload des source maps en local (uniquement en CI/CD)
  silent: true,

  // Upload des source maps uniquement si SENTRY_AUTH_TOKEN est défini
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Réduire la taille du bundle en production
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
