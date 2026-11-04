"use client";

import { useState } from "react";
import { BarreRecherche } from "@/components/ui/BarreRecherche";
import type { Proposal } from "@/types";
import { CarteDepliable, Puce, TuileSynthese, Champ, type Ton } from "@/components/ui/CarteDepliable";

const STATUT: Record<string, { texte: string; ton: Ton }> = {
  draft: { texte: "Brouillon", ton: "neutre" },
  sent: { texte: "Envoyé", ton: "neutre" },
  viewed: { texte: "Consulté", ton: "attention" },
  signed: { texte: "Signé", ton: "bien" },
  declined: { texte: "Refusé", ton: "attention" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function jour(v: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("fr-FR");
}

export function ProposalsListe({ proposals }: { proposals: Proposal[] }) {
  const [q, setQ] = useState("");
  const f = q.trim().toLowerCase();
  const liste = f
    ? proposals.filter(
        (p) =>
          (p.client_name ?? "").toLowerCase().includes(f) ||
          (p.title ?? "").toLowerCase().includes(f) ||
          (p.proposal_number ?? "").toLowerCase().includes(f)
      )
    : proposals;

  // Tuiles de synthese, calculees sur l'ensemble des devis.
  const enAttente = proposals.filter((p) => p.status === "sent" || p.status === "viewed");
  const montantEnAttente = enAttente.reduce((s, p) => s + (p.total_ttc ?? 0), 0);
  const montantSigne = proposals
    .filter((p) => p.status === "signed")
    .reduce((s, p) => s + (p.total_ttc ?? 0), 0);
  const nbSigne = proposals.filter((p) => p.status === "signed").length;
  const nbRefuse = proposals.filter((p) => p.status === "declined").length;
  const aboutis = nbSigne + nbRefuse;
  const taux = aboutis > 0 ? `${Math.round((nbSigne / aboutis) * 100)} %` : "-";

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-6">
        <TuileSynthese libelle="En attente de signature" valeur={fmt(montantEnAttente)} />
        <TuileSynthese libelle="Signés" valeur={fmt(montantSigne)} />
        <TuileSynthese libelle="Taux de signature" valeur={taux} />
      </div>

      <div className="mt-4">
        <BarreRecherche value={q} onChange={setQ} placeholder="Rechercher un devis, un client..." />
      </div>

      <div className="space-y-2.5 mt-4">
        {liste.map((p) => {
          const s = STATUT[p.status] ?? STATUT.draft;
          const expire = p.valid_until;
          return (
            <CarteDepliable
              key={p.id}
              titre={p.client_name || p.title || "-"}
              pastilles={<Puce ton={s.ton} texte={s.texte} />}
              sousTitre={
                <span className="text-gray-400">
                  {expire ? `Expire le ${jour(expire)}` : `Créé le ${jour(p.created_at)}`}
                </span>
              }
              montant={fmt(p.total_ttc)}
            >
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-4">
                <Champ libelle="Objet" valeur={p.title || "-"} />
                <Champ libelle="Numéro" valeur={p.proposal_number ?? "-"} mono />
                <Champ libelle="Créé le" valeur={jour(p.created_at)} />
                <Champ libelle="Expire le" valeur={jour(expire)} />
              </dl>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`/proposals/${p.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ds-border text-indigo-400 text-sm font-semibold hover:bg-ds-elevated transition-colors"
                >
                  Ouvrir le devis →
                </a>
              </div>
            </CarteDepliable>
          );
        })}

        {liste.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">Aucun résultat pour « {q} ».</p>
        )}
      </div>
    </>
  );
}
