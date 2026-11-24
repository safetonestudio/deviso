"use client";

import { useSearchParams } from "next/navigation";
import { Hourglass, PartyPopper, TriangleAlert } from "lucide-react";
import { BETA, LIEN_CANDIDATURE } from "@/lib/beta";

/**
 * Fin de bêta d'un testeur (profiles.subscription_status = « beta_terminee »,
 * posé par le cron fin-beta). Pendant de components/EssaiTermine.tsx : écran
 * complet sur le tableau de bord, bandeau sur les autres pages, rien sur
 * Abonnement, qui porte le choix de formule avec la remise promise.
 * Les factures restent consultables ; la création est refusée par le serveur
 * (plan free), comme après un essai.
 */
export function EcranFinBeta() {
  return (
    <div className="max-w-xl mx-auto py-2 sm:py-8" data-ecran="fin-beta">
      <div className="carte p-6 sm:p-8">
        <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-5">
          <Hourglass size={22} className="text-amber-400" />
        </div>
        <h1 className="titre-page mb-3">Ta bêta est terminée</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          Merci d&apos;avoir fait partie des premiers utilisateurs de Deviso. Les fonctions de l&apos;abonnement,
          dont la création de factures, sont maintenant suspendues.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          Rien n&apos;a été supprimé : tes devis, tes factures et tes clients restent consultables.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Tes factures reçues continuent d&apos;arriver pendant {BETA.joursReceptionApres} jours. Pour garder ton
          adresse de réception au-delà, abonne-toi.
        </p>
        <a
          href="/billing"
          className="inline-flex items-center justify-center w-full sm:w-auto bg-indigo-600 text-on-accent text-sm font-semibold px-5 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Continuer avec -{BETA.remise}&nbsp;% pendant 12 mois
        </a>
      </div>
    </div>
  );
}

export function BandeauFinBeta() {
  return (
    <div
      className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      data-bandeau="fin-beta"
    >
      <p className="text-sm text-amber-200 flex items-start gap-2">
        <Hourglass size={16} className="shrink-0 mt-0.5 text-amber-400" />
        Ta bêta est terminée : un abonnement est nécessaire pour continuer à facturer. Tes documents restent consultables.
      </p>
      <a
        href="/billing"
        className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-on-accent hover:bg-indigo-700 text-center"
      >
        Continuer avec -{BETA.remise}&nbsp;%
      </a>
    </div>
  );
}

const MESSAGES: Record<string, { ok: boolean; texte: string }> = {
  active: {
    ok: true,
    texte: `Bienvenue dans la bêta de Deviso : tout est ouvert, gratuitement, pendant ${BETA.dureeMois} mois.`,
  },
  cabinet: { ok: true, texte: "Bienvenue sur Deviso : le compte de votre cabinet est prêt." },
  adresse: {
    ok: false,
    texte:
      "Ce lien d'accès est lié à une autre adresse e-mail que celle de ce compte. Écrivez à support@getdeviso.fr.",
  },
  jeton: {
    ok: false,
    texte: "Ce lien d'accès a déjà servi ou il a expiré. Écrivez à support@getdeviso.fr pour en recevoir un nouveau.",
  },
  abonnement: { ok: false, texte: "Ce compte a déjà un abonnement : la bêta n'a pas été appliquée." },
  erreur: {
    ok: false,
    texte: "L'ouverture de votre bêta n'a pas abouti. Écrivez à support@getdeviso.fr, je règle cela tout de suite.",
  },
};

/** Message affiché au retour de /api/beta/activer (?beta=...). */
export function MessageActivationBeta() {
  const cle = useSearchParams().get("beta");
  const m = cle ? MESSAGES[cle] : null;
  if (!m) return null;
  return (
    <div
      role="status"
      className={`mb-6 rounded-xl px-4 py-3 flex items-start gap-2 text-sm ${
        m.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"
      }`}
    >
      {m.ok ? <PartyPopper size={16} className="shrink-0 mt-0.5" /> : <TriangleAlert size={16} className="shrink-0 mt-0.5" />}
      {m.texte}
    </div>
  );
}

/**
 * Compte ouvert sans invitation pendant la bêta (lib/beta-acces.ts) : l'espace
 * n'affiche que l'appel à candidater.
 */
export function EcranSansInvitation() {
  return (
    <div className="max-w-xl mx-auto py-2 sm:py-8" data-ecran="sans-invitation">
      <div className="carte p-6 sm:p-8">
        <h1 className="titre-page mb-3">Deviso est en bêta</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Pendant la bêta, les comptes s&apos;ouvrent sur invitation, après une courte candidature. Candidatez avec
          l&apos;adresse de ce compte : je vous réponds sous 48 heures.
        </p>
        <a
          href={LIEN_CANDIDATURE}
          className="inline-flex items-center justify-center w-full sm:w-auto bg-indigo-600 text-on-accent text-sm font-semibold px-5 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Devenir bêta-testeur
        </a>
      </div>
    </div>
  );
}
