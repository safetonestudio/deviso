import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Route de traversee TEMPORAIRE : prouve que Sentry capture reellement une erreur
// serveur en production. Protegee par un jeton pour ne pas exposer un generateur
// d erreurs public. A SUPPRIMER une fois la verification faite.
const JETON = "trv_7Qm2Xk9ab4Dz";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("t") !== JETON) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // mode=throw : erreur NON geree, captee par onRequestError (instrumentation.ts)
  if (url.searchParams.get("mode") === "throw") {
    throw new Error("Deviso Sentry traversal (throw) " + new Date().toISOString());
  }

  // defaut : capture explicite, renvoie l id d evenement pour le retrouver dans Sentry
  const eventId = Sentry.captureException(
    new Error("Deviso Sentry traversal (capture) " + new Date().toISOString())
  );
  await Sentry.flush(3000);
  return NextResponse.json({ ok: true, eventId });
}
