import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Version servie par la production : le commit du deploiement actif.
// Sert a check:prod, qui compare cette valeur au dernier commit de main.
// Raison (18/10/2026) : deux commits pousses a quelques minutes d intervalle,
// Vercel a termine le plus ANCIEN en dernier et l a promu ; la prod a servi
// une version perimee sans que rien ne le signale.
export function GET() {
  return NextResponse.json(
    { sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null },
    { headers: { "cache-control": "no-store" } }
  );
}
