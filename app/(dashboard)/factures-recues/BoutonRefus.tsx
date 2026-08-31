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
  const [note, setNote] = useState("");
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
        body: JSON.stringify({ motif, note: note.trim() || undefined }),
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

  // Lisible, sans être criard.
  //
  // Ce lien était en `text-gray-600` : volontairement effacé, parce qu'un refus
  // est définitif et oblige le fournisseur à passer un avoir, et qu'on ne
  // voulait pas qu'il se clique par réflexe. Résultat mesuré le 31/08/2026 :
  // Selim, qui a écrit l'application, n'a pas trouvé le bouton et a demandé où
  // il était. Rendre une action grave *introuvable* ne protège personne — ça
  // oblige à la chercher, puis à cliquer au hasard. La prudence est déjà
  // portée par la fenêtre de confirmation, le choix d'un motif obligatoire, et
  // la disparition du lien une fois le refus posé. Le lien lui-même n'a qu'à
  // être lisible, au même niveau que « Répondre ».
  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="text-xs font-medium text-gray-400 hover:text-red-400 transition-colors whitespace-nowrap"
      >
        Refuser
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="text-xs font-medium text-gray-400 hover:text-red-400 transition-colors whitespace-nowrap"
      >
        Refuser
      </button>

      {/* Fenêtre centrée plutôt que panneau déplié dans la cellule.
          Première version : le formulaire s'ouvrait à l'intérieur de la case du
          tableau. Il en débordait et se faisait couper — visible sur la capture
          de Selim. Une cellule de tableau n'a pas la place d'accueillir un
          formulaire, et lui en donner déformerait toute la ligne.
          Une fenêtre modale règle aussi le cas du téléphone, où la liste de
          motifs seule occupe plus que la hauteur d'écran. */}
      <div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Refuser une facture"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !enCours && setOuvert(false)}
        />

        <div className="relative w-full sm:max-w-md bg-ds-surface border border-ds-border rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
          <h2 className="text-white font-semibold mb-2">Refuser cette facture</h2>

          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Facture de <strong className="text-white">{fournisseur}</strong>. Le refus est{" "}
            <strong className="text-red-400">définitif</strong> et porte sur la facture entière :
            votre fournisseur devra procéder à une annulation comptable.
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
          <p className="text-xs text-gray-600 mb-3">
            La réforme n&apos;accepte que ces motifs : il n&apos;existe pas d&apos;option
            « autre ».
          </p>

          {/* Le code seul oblige le fournisseur à deviner : « erreur de calcul »
              ne dit pas QUELLE ligne est fausse. Un mot ici, c'est un
              aller-retour téléphonique en moins. */}
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Précision pour votre fournisseur <span className="text-gray-600">(facultatif)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ex. : le total de la ligne 3 ne correspond pas au devis signé."
            className="w-full bg-ds-bg border border-ds-border text-white rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
          />

          {erreur && <p className="text-sm text-red-400 mb-3">{erreur}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setOuvert(false);
                setErreur(null);
              }}
              disabled={enCours}
              className="flex-1 px-3 py-2.5 rounded-lg border border-ds-border text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={refuser}
              disabled={!motif || enCours}
              className="flex-1 px-3 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {enCours ? "Envoi…" : "Confirmer le refus"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
