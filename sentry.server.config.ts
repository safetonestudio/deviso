import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === "production",

  // Ignorer les erreurs 404 et annulations de requêtes
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    /^ECONNRESET/,
    /^ETIMEDOUT/,
  ],
});
