"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOTIFS_REFUS } from "@/lib/superpdp-motifs";

/**
 * La seule action proposée sur une facture reçue.
 *
 * Pourquoi une porte unique. L'écran offrait sept actions par ligne : un menu
 * « Répondre » à six entrées (accuser réception, approuver, suspendre,
 * contester, clore, signaler le paiement) plus « Refuser ». Chaque facture
 * ressemblait donc à une tâche en attente d'arbitrage.
 *
 * Elle ne l'est pas. La documentation Super PDP est explicite sur `status_code`
 * — « **this is not a state machine** […] their presence indicates an event has
 * occurred rather than a current, exclusive state ». Rien n'expire, rien
 * n'avance tout seul, aucun délai ne court. Et sur les quatorze statuts du
 * cycle de vie, un seul incombe au destinataire : le refus (`fr:210`). Prise en
 * charge, approbation, mise à disposition, litige, suspension, paiement
 * transmis sont facultatifs et ne remontent pas à l'administration.
 *
 * Recevoir une facture et être d'accord avec elle ne demande donc **aucune
 * action**. Sept boutons pour zéro obligation, c'est du travail inventé — et
 * c'est ce qui a fait dire à Selim, le 31/08/2026, que traiter les factures une
 * par une était « une galère pas possible ». Il avait raison : la corvée était
 * de notre fait.
 *
 * Reste une porte, pour le cas réel où quelque chose cloche. Elle présente
 * d'abord les issues réversibles, parce que le refus est terminal : il annule
 * la facture auprès de l'administration, sans retour possible et sans avoir
 * formel, obligeant le fournisseur à une annulation comptable. Contester et
 * suspendre acceptent les mêmes situations sans tuer le document.
 */

type Issue = {
  code: string;
  titre: string;
  effet: string;
};

/** Les deux issues réversibles, offertes avant le refus. */
const REVERSIBLES: Issue[] = [
  {
    code: "fr:208",
    titre: "Mettre en attente",
    effet:
      "Suspend le traitement, le temps d'obtenir une pièce ou une précision. " +
      "Vous pourrez reprendre à tout moment.",
  },
  {
    code: "fr:207",
    titre: "Contester",
    effet:
      "Signale votre désaccord à votre fournisseur sans annuler la facture. " +
      "À préférer tant qu'un accord reste possible.",
  },
];

export function SignalerProbleme({
  factureId,
  fournisseur,
  statutActuel,
}: {
  factureId: number;
  fournisseur: string;
  statutActuel: string | null;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<"choix" | "refus">("choix");
  const [motif, setMotif] = useState("");
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Une facture déjà refusée n'attend plus rien : le refus est terminal.
  if (statutActuel === "fr:210") return null;

  const fermer = () => {
    if (enCours) return;
    setOuvert(false);
    setEtape("choix");
    setErreur(null);
  };

  const poser = async (code: string) => {
    setEnCours(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/superpdp/invoices/${factureId}/statut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, note: note.trim() || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErreur(d.message ?? d.error ?? "L'action n'a pas abouti.");
        return;
      }
      fermer();
      setNote("");
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  };

  const refuser = async () => {
    if (!motif) return;
    setEnCours(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/superpdp/invoices/${factureId}/refuser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif, note: note.trim() || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErreur(d.message ?? "Le refus n'a pas abouti.");
        return;
      }
      fermer();
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  };

  const declencheur = (
    <button
      onClick={() => setOuvert(true)}
      className="text-xs font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap"
    >
      Signaler un problème
    </button>
  );

  if (!ouvert) return declencheur;

  return (
    <>
      {declencheur}

      <div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Signaler un problème sur une facture reçue"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={fermer} />

        <div className="relative w-full sm:max-w-md bg-ds-surface border border-ds-border rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
          {etape === "choix" ? (
            <>
              <h2 className="text-white font-semibold mb-1">Un problème sur cette facture ?</h2>
              <p className="text-sm text-gray-400 mb-4">
                Facture de <strong className="text-white">{fournisseur}</strong>.
              </p>

              {/* Le mot libre accompagne l'action : sans lui, le fournisseur
                  reçoit un code et doit deviner ce qui ne va pas. */}
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Ce que vous voulez lui dire <span className="text-gray-600">(facultatif)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Ex. : le total de la ligne 3 ne correspond pas au devis signé."
                className="w-full bg-ds-bg border border-ds-border text-white rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              />

              <div className="space-y-2">
                {REVERSIBLES.map((issue) => (
                  <button
                    key={issue.code}
                    onClick={() => poser(issue.code)}
                    disabled={enCours}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-ds-border hover:bg-ds-elevated transition-colors disabled:opacity-50"
                  >
                    <span className="block text-sm font-medium text-white">{issue.titre}</span>
                    <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {issue.effet}
                    </span>
                  </button>
                ))}
              </div>

              {erreur && <p className="text-sm text-red-400 mt-3">{erreur}</p>}

              {/* Le refus est en dessous, séparé, et annoncé pour ce qu'il est. */}
              <div className="mt-4 pt-4 border-t border-ds-border">
                <button
                  onClick={() => {
                    setEtape("refus");
                    setErreur(null);
                  }}
                  disabled={enCours}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                >
                  <span className="block text-sm font-medium text-red-400">
                    Refuser la facture
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Définitif et sans retour. La facture est annulée auprès de
                    l&apos;administration, et votre fournisseur devra passer une annulation
                    comptable.
                  </span>
                </button>
              </div>

              <button
                onClick={fermer}
                disabled={enCours}
                className="w-full mt-3 px-3 py-2 rounded-lg text-gray-500 hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <h2 className="text-white font-semibold mb-2">Refuser cette facture</h2>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Facture de <strong className="text-white">{fournisseur}</strong>. Le refus est{" "}
                <strong className="text-red-400">définitif</strong> et porte sur la facture
                entière.
              </p>

              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Motif du refus
              </label>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                autoFocus
                className="w-full bg-ds-bg border border-ds-border text-white rounded-lg px-3 py-2.5 text-sm mb-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Choisir un motif…</option>
                {MOTIFS_REFUS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.libelle}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mb-4">
                La réforme n&apos;accepte que ces motifs : il n&apos;existe pas
                d&apos;option « autre ».
              </p>

              {erreur && <p className="text-sm text-red-400 mb-3">{erreur}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEtape("choix");
                    setErreur(null);
                  }}
                  disabled={enCours}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-ds-border text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  onClick={refuser}
                  disabled={!motif || enCours}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {enCours ? "Envoi…" : "Confirmer le refus"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
