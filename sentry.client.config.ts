import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% des transactions en production pour les performances
  tracesSampleRate: 0.1,

  // Capture 100% des erreurs
  // En production, réduire si le volume est trop élevé
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Désactiver en développement local
  enabled: process.env.NODE_ENV === "production",

  // Ignorer les erreurs réseau courantes et sans impact
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    /^Network Error/,
    /^Load failed/,
  ],
});
