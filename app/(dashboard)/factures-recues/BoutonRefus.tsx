"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOTIFS_REFUS } from "@/lib/superpdp-motifs";

/**
 * Refus d'une facture reçue — statut 210, obligatoire côté destinataire.
 *
 * Trois précautions, toutes dictées par la nature de l'acte plutôt que par le
 * style :
 *
 * 1. **Le motif est obligatoire et se choisit dans une liste.** La réforme n'en
 *    accepte que treize, et aucun « Autre ». Un champ libre donnerait
 *    l'illusion du choix avant un rejet en anglais technique.
 * 2. **Le refus est irréversible et porte sur la facture entière.** Il oblige
 *    le fournisseur à une annulation comptable. D'où la confirmation, et le mot
 *    « définitif » écrit noir sur blanc.
 * 3. **Le bouton est discret tant qu'on n'a pas cliqué.** Refuser n'est pas
 *    l'action attendue par défaut sur une facture ; la mettre en avant
 *    inviterait à la faire.
 */
export function BoutonRefus({
  factureId,
  fournisseur,
  dejaRefusee,
}: {
  factureId: number;
  fournisseur: string;
  dejaRefusee: boolean;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (dejaRefusee) return null;

  const refuser = async () => {
    if (!motif) return;
    setEnCours(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/superpdp/invoices/${factureId}/refuser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif }),
      });
      const res = await r.json();
      if (!r.ok) {
        setErreur(res.message ?? "Le refus n'a pas abouti.");
        return;
      }
      setOuvert(false);
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  };

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="text-xs text-gray-600 hover:text-red-400 transition-colors whitespace-nowrap"
      >
        Refuser
      </button>
    );
  }

  return (
    <div className="bg-ds-elevated/60 border border-red-500/20 rounded-lg p-3 mt-2 text-left">
      <p className="text-xs text-gray-300 mb-2">
        Refuser la facture de <strong className="text-white">{fournisseur}</strong>.
        C&apos;est <strong className="text-red-400">définitif</strong> et cela porte sur la facture
        entière : votre fournisseur devra procéder à une annulation comptable.
      </p>

      <label className="block text-xs text-gray-400 mb-1">Motif du refus</label>
      <select
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        className="w-full bg-ds-bg border border-ds-border text-white rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-indigo-500"
      >
        <option value="">Choisir un motif…</option>
        {MOTIFS_REFUS.map((m) => (
          <option key={m.code} value={m.code}>
            {m.libelle}
          </option>
        ))}
      </select>

      {erreur && <p className="text-xs text-red-400 mb-2">{erreur}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => {
            setOuvert(false);
            setErreur(null);
          }}
          className="flex-1 px-3 py-2 rounded-lg border border-ds-border text-gray-400 hover:text-white text-xs font-medium transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={refuser}
          disabled={!motif || enCours}
          className="flex-1 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-semibold transition-colors disabled:opacity-40"
        >
          {enCours ? "Envoi…" : "Confirmer le refus"}
        </button>
      </div>
    </div>
  );
}
