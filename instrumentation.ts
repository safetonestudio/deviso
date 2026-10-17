import * as Sentry from "@sentry/nextjs";

// Point d entree v10 cote serveur et edge. Sans ce fichier, sentry.server.config
// et sentry.edge.config ne sont jamais charges : aucune erreur de route API ni de
// Server Component ne remonte. onRequestError capture les erreurs de requete.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
