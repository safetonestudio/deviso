import { NextRequest, NextResponse, after } from "next/server";
import { candidaturesOuvertes } from "@/lib/beta";
import { courrielsCandidature, empreinteIp, enregistrerCandidature, type SaisieCandidature } from "@/lib/beta-candidatures";

/**
 * POST /api/beta/candidature : formulaire public de l'accueil
 * (components/landing/AppelBetaTesteurs.tsx).
 *
 * Public, donc défendu : champ piège invisible (`site`), 3 envois par heure et
 * par adresse IP (empreinte seulement), longueurs bornées, adresse vérifiée.
 * Hors période de bêta, la route n'existe pas (404).
 */
const MAX = { nom: 120, email: 200, activite: 160, statut: 60, outil: 60, message: 2000 };
const STATUTS = ["Micro-entreprise", "Entreprise individuelle au réel", "Société"];
const OUTILS = ["Word ou Excel", "Un autre logiciel", "Je commence mon activité"];

const texte = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  if (!candidaturesOuvertes()) {
    return NextResponse.json({ error: "Les candidatures à la bêta sont closes." }, { status: 404 });
  }

  let corps: Record<string, unknown>;
  try {
    corps = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  // Champ piège : invisible pour un humain, rempli par les robots. Réponse de
  // succès, rien n'est enregistré ni envoyé.
  if (texte(corps.site, 200)) return NextResponse.json({ ok: true });

  const nom = texte(corps.nom, MAX.nom);
  const email = texte(corps.email, MAX.email);
  if (!nom) return NextResponse.json({ error: "Indiquez votre prénom et votre nom." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Cette adresse e-mail n'est pas valide." }, { status: 400 });
  }
  if (corps.echange !== true) {
    return NextResponse.json({ error: "Cochez l'acceptation de l'échange de 20 minutes." }, { status: 400 });
  }
  const statut = texte(corps.statut, MAX.statut);
  const outil = texte(corps.outil, MAX.outil);

  // Sans adresse IP (cas anormal), toutes ces requêtes partagent une même
  // limite : la fonction en base les range sous « sans-ip ».
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const ipEmpreinte = ip ? empreinteIp(ip) : null;
  const saisie: SaisieCandidature = {
    nom,
    email,
    activite: texte(corps.activite, MAX.activite) || null,
    statut_juridique: STATUTS.includes(statut) ? statut : null,
    outil: OUTILS.includes(outil) ? outil : null,
    message: texte(corps.message, MAX.message) || null,
    echange_accepte: true,
  };

  try {
    const r = await enregistrerCandidature(saisie, ipEmpreinte);
    if (r === "limite") {
      return NextResponse.json({ error: "Trop d'envois depuis votre connexion. Réessayez dans une heure." }, { status: 429 });
    }
    // Courriels après la réponse : même délai pour une première candidature
    // et pour un doublon.
    if (r === "nouvelle") after(() => courrielsCandidature(saisie));
  } catch (e) {
    console.error("[beta/candidature]", e);
    return NextResponse.json(
      { error: "Votre candidature n'a pas pu être enregistrée. Réessayez, ou écrivez à support@getdeviso.fr." },
      { status: 500 }
    );
  }
  // Même réponse pour une première candidature et pour un doublon : le
  // formulaire ne dit pas si une adresse a déjà candidaté.
  return NextResponse.json({ ok: true });
}
