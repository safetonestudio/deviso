"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Grille d'autorisations d'un collaborateur.
 *
 * Cinq actes, chacun une case. En cliquant sur la ligne (le chevron), une
 * explication simple se déplie. Un seul modèle, lisible par tous : « coche ce
 * que ce collaborateur a le droit de faire ». Le reste (encaissement, compta,
 * suppression, paiement, identité de l'entreprise, raccordement) est réservé au
 * titulaire et n'apparaît pas ici.
 *
 * Enregistrement immédiat à chaque changement (PATCH /api/team/[id]). La source
 * de vérité reste le serveur : cet écran ne fait qu'y écrire.
 */

export type PermissionsMembre = {
  envoyer_devis: boolean;
  envoyer_facture: boolean;
  transmettre_pa: boolean;
  deposer_chorus: boolean;
  refuser_facture_recue: boolean;
};

type Cle = keyof PermissionsMembre;

const ACTES: { cle: Cle; titre: string; explication: string }[] = [
  {
    cle: "envoyer_devis",
    titre: "Envoyer un devis",
    explication:
      "Autorise ce collaborateur à envoyer lui-même un devis au client, par e-mail, avec le lien de signature. Sans cette autorisation, il peut créer et préparer le devis, mais c'est vous qui l'envoyez.",
  },
  {
    cle: "envoyer_facture",
    titre: "Envoyer une facture",
    explication:
      "Autorise l'envoi d'une facture au client par e-mail. Sans cette autorisation, le collaborateur prépare la facture et c'est vous qui l'envoyez.",
  },
  {
    cle: "transmettre_pa",
    titre: "Transmettre à la Plateforme Agréée",
    explication:
      "Autorise la transmission d'une facture à la plateforme officielle de facturation électronique, obligatoire pour vos clients professionnels. C'est un envoi définitif, effectué sous le SIRET de votre entreprise et opposable à l'administration.",
  },
  {
    cle: "deposer_chorus",
    titre: "Déposer sur Chorus Pro",
    explication:
      "Autorise le dépôt d'une facture destinée à un client public (mairie, hôpital, administration…) sur Chorus Pro. Sans cette autorisation, vous seul déposez ces factures.",
  },
  {
    cle: "refuser_facture_recue",
    titre: "Refuser une facture reçue",
    explication:
      "Autorise le refus d'une facture qu'une autre entreprise vous a adressée via la plateforme. Le refus est définitif et oblige l'expéditeur à recommencer.",
  },
];

function normaliser(p: unknown): PermissionsMembre {
  const src = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
  return {
    envoyer_devis: src.envoyer_devis === true,
    envoyer_facture: src.envoyer_facture === true,
    transmettre_pa: src.transmettre_pa === true,
    deposer_chorus: src.deposer_chorus === true,
    refuser_facture_recue: src.refuser_facture_recue === true,
  };
}

export function GrillePermissions({
  memberId,
  permissionsInitiales,
  onChange,
}: {
  memberId: string;
  permissionsInitiales: unknown;
  onChange?: (p: PermissionsMembre) => void;
}) {
  const [perms, setPerms] = useState<PermissionsMembre>(() => normaliser(permissionsInitiales));
  const [ouvert, setOuvert] = useState<Cle | null>(null);
  const [enCours, setEnCours] = useState<Cle | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function basculer(cle: Cle) {
    const avant = perms;
    const cible = { ...perms, [cle]: !perms[cle] };
    setPerms(cible);
    setEnCours(cle);
    setErreur(null);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: cible }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const confirme = normaliser(data.permissions);
      setPerms(confirme);
      onChange?.(confirme);
    } catch {
      // L'écriture a échoué : on revient à l'état d'avant, rien n'est deviné.
      setPerms(avant);
      setErreur("L'enregistrement a échoué. Réessayez.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="rounded-xl border border-ds-border bg-ds-elevated/40 divide-y divide-ds-border">
      {ACTES.map(({ cle, titre, explication }) => {
        const actif = perms[cle];
        const estOuvert = ouvert === cle;
        return (
          <div key={cle}>
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Case à cocher */}
              <button
                type="button"
                onClick={() => basculer(cle)}
                disabled={enCours === cle}
                role="switch"
                aria-checked={actif}
                aria-label={titre}
                className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  actif
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-transparent border-ds-border hover:border-indigo-400"
                } ${enCours === cle ? "opacity-50" : ""}`}
              >
                {actif && <Check size={13} strokeWidth={3} />}
              </button>

              {/* Titre + chevron : cliquer déplie l'explication */}
              <button
                type="button"
                onClick={() => setOuvert(estOuvert ? null : cle)}
                className="flex-1 flex items-center justify-between gap-2 text-left group"
                aria-expanded={estOuvert}
              >
                <span className="text-sm font-medium text-white">{titre}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gray-500 group-hover:text-gray-300 transition-transform ${
                    estOuvert ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {estOuvert && (
              <div className="px-4 pb-3 -mt-1 pl-12">
                <p className="text-xs leading-relaxed text-gray-400">{explication}</p>
              </div>
            )}
          </div>
        );
      })}

      {erreur && <p className="px-4 py-2 text-xs text-red-400">{erreur}</p>}
    </div>
  );
}
