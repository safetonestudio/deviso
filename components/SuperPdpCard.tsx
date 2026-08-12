"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Raccordement à la Plateforme Agréée (Super PDP).
 *
 * Ce composant existe parce que les routes `/api/superpdp/connect`, `/callback`
 * et `/status` étaient écrites depuis un mois sans qu'aucune interface ne les
 * appelle : personne ne pouvait donc se raccorder, et l'échange de jetons
 * n'avait jamais été parcouru. Les deux côtés existaient, ils n'étaient pas
 * reliés — le défaut le plus fréquent de ce projet.
 *
 * Ce que l'écran doit rendre lisible, dans l'ordre :
 * 1. l'obligation de **réception** des factures électroniques au 1ᵉʳ septembre 2026 ;
 * 2. l'état réel du raccordement, y compris l'état intermédiaire `pending` —
 *    Super PDP vérifie le rattachement entreprise en différé, et pendant ce
 *    temps l'API renvoie 403. Masquer cet état ferait passer une attente
 *    normale pour une panne.
 */

type Etat = {
  available: boolean;
  sandbox?: boolean;
  connected: boolean;
  status?: "pending" | "verified" | "error" | null;
  companyId?: string | null;
  lastError?: string | null;
};

/** Messages de retour du tunnel d'autorisation, posés par `/api/superpdp/callback`. */
const RETOURS: Record<string, { ton: "ok" | "attente" | "erreur"; texte: string }> = {
  connecte: { ton: "ok", texte: "Raccordement établi." },
  en_attente: {
    ton: "attente",
    texte:
      "Autorisation enregistrée. Super PDP vérifie le rattachement de votre entreprise, " +
      "cela peut prendre un moment.",
  },
  expire: {
    ton: "erreur",
    texte: "La demande a expiré (plus de 10 minutes) ou n'a pas pu être vérifiée. Relancez le raccordement.",
  },
  session_perdue: {
    ton: "erreur",
    texte: "Votre session Deviso a été perdue pendant le raccordement. Reconnectez-vous puis réessayez.",
  },
  indisponible: { ton: "erreur", texte: "Le raccordement n'est pas encore activé côté Deviso." },
  erreur: { ton: "erreur", texte: "Le raccordement a échoué." },
};

/**
 * Les messages d'erreur de Super PDP arrivent en anglais et en vocabulaire
 * d'API. On traduit ceux qu'on a réellement rencontrés plutôt que d'afficher
 * « No company found with these superpdp_company_number_scheme… » à un
 * indépendant venu cocher une case de conformité.
 */
function traduire(detail: string): string {
  if (/no company found/i.test(detail)) {
    return (
      "Super PDP ne reconnaît pas l'entreprise transmise. Reprenez le raccordement " +
      "et saisissez vos informations directement dans leur formulaire."
    );
  }
  return detail;
}

export function SuperPdpCard() {
  const params = useSearchParams();
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(true);

  const retourCle = params.get("superpdp");
  const retourDetail = params.get("detail");
  const retour = retourCle ? RETOURS[retourCle] ?? RETOURS.erreur : null;

  const relire = useCallback(async () => {
    try {
      const r = await fetch("/api/superpdp/status", { cache: "no-store" });
      if (r.ok) setEtat(await r.json());
    } catch {
      // Réseau : on laisse l'écran dans son dernier état connu plutôt que
      // d'afficher « non connecté », ce qui serait un mensonge.
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    relire();
  }, [relire]);

  // Fonctionnalité pas encore activée côté serveur : inutile d'afficher une
  // carte sur laquelle rien n'est cliquable.
  if (!chargement && etat && !etat.available) return null;

  const verifie = etat?.connected && etat.status === "verified";
  const enAttente = etat?.connected && etat.status === "pending";

  return (
    <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="font-semibold text-white">Plateforme Agréée</h2>
        {etat?.sandbox && (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded shrink-0">
            bac à sable
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        À partir du <strong className="text-gray-400">1ᵉʳ septembre 2026</strong>, toutes les entreprises
        doivent pouvoir <strong className="text-gray-400">recevoir</strong> des factures électroniques.
        Le raccordement à une Plateforme Agréée est le moyen de le faire.
      </p>

      {retour && (
        <div
          className={`rounded-lg px-4 py-3 mb-4 text-sm ${
            retour.ton === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : retour.ton === "attente"
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}
        >
          <p>{retour.texte}</p>
          {retourDetail && <p className="text-xs opacity-80 mt-1 break-words">{traduire(retourDetail)}</p>}
        </div>
      )}

      {chargement ? (
        <p className="text-sm text-gray-500">Vérification du raccordement…</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                verifie ? "bg-emerald-400" : enAttente ? "bg-amber-400" : "bg-gray-600"
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm text-white font-medium">
                {verifie ? "Raccordé" : enAttente ? "Vérification en cours" : "Non raccordé"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {verifie
                  ? etat?.companyId
                    ? `Entreprise ${etat.companyId}`
                    : "Entreprise raccordée"
                  : enAttente
                    ? "Super PDP vérifie le rattachement de votre entreprise."
                    : "Vous ne pouvez pas encore recevoir de factures électroniques."}
              </p>
            </div>
          </div>

          <a
            href="/api/superpdp/connect"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
              verifie
                ? "border border-ds-border text-gray-400 hover:text-white hover:bg-ds-elevated"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            {verifie ? "Reconnecter" : enAttente ? "Relancer" : "Raccorder mon entreprise"}
          </a>
        </div>
      )}

      {etat?.lastError && (
        <p className="text-xs text-red-400 mt-3 break-words">Dernière erreur : {etat.lastError}</p>
      )}
    </section>
  );
}
