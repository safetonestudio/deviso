"use client";

import { useState } from "react";
import Link from "next/link";
import { BarreRecherche } from "@/components/ui/BarreRecherche";
import type { Invoice } from "@/types";
import { etatPdp } from "@/lib/superpdp-etat-facture";
import { phraseManques } from "@/lib/superpdp-precontrole";
import { CarteDepliable, PuceCouleur, TuileSynthese, Champ } from "@/components/ui/CarteDepliable";

const STATUT: Record<string, { label: string; classe: string }> = {
  draft: { label: "Brouillon", classe: "bg-ds-elevated text-gray-300 border-ds-border" },
  sent: { label: "Envoyée", classe: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  paid: { label: "Payée", classe: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Annulée", classe: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const TYPE_SUFFIXE: Record<string, string> = {
  acompte: " · acompte",
  solde: " · solde",
  avoir: " · avoir",
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "-";
}

interface Props {
  invoices: Invoice[];
  raccordePdp: boolean;
  sandboxPdp: boolean;
  peutTransmettre: boolean;
  transmission: string | null;
  messagePdp: { id: string; texte: string; ok: boolean } | null;
  onTransmettre: (inv: Invoice, e: React.MouseEvent) => void;
  onDownload: (id: string, e: React.MouseEvent) => void;
}

export function InvoicesListe({
  invoices,
  raccordePdp,
  sandboxPdp,
  peutTransmettre,
  transmission,
  messagePdp,
  onTransmettre,
  onDownload,
}: Props) {
  const [q, setQ] = useState("");

  // Tuiles de synthese, calculees sur l'ensemble (avoirs exclus des montants).
  const reels = invoices.filter((i) => i.invoice_type !== "avoir");
  const encaisse = reels.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total_ttc ?? 0), 0);
  const enAttente = reels.filter((i) => i.status === "sent").reduce((s, i) => s + (i.total_ttc ?? 0), 0);
  const aTransmettre = raccordePdp
    ? invoices.filter((i) => etatPdp(i, sandboxPdp)?.aFaire).length
    : 0;

  const f = q.trim().toLowerCase();
  const liste = f
    ? invoices.filter(
        (i) =>
          (i.invoice_number ?? "").toLowerCase().includes(f) ||
          (i.client_company ?? "").toLowerCase().includes(f) ||
          (i.client_name ?? "").toLowerCase().includes(f)
      )
    : invoices;

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <TuileSynthese libelle="Encaissé" valeur={fmt(encaisse)} />
        <TuileSynthese libelle="En attente de paiement" valeur={fmt(enAttente)} />
        <TuileSynthese libelle="À transmettre" valeur={String(aTransmettre)} alerte={aTransmettre > 0} />
      </div>

      <div className="mt-4">
        <BarreRecherche value={q} onChange={setQ} placeholder="Rechercher une facture, un client..." />
      </div>

      <div className="space-y-2.5 mt-4">
        {liste.map((inv) => {
          const s = STATUT[inv.status] ?? { label: inv.status, classe: "bg-ds-elevated text-gray-300 border-ds-border" };
          const e = raccordePdp ? etatPdp(inv, sandboxPdp) : null;
          const transmettreMtn = !!(e?.aFaire && peutTransmettre);
          return (
            <CarteDepliable
              key={inv.id}
              titre={inv.client_company || inv.client_name || "-"}
              pastilles={
                <>
                  <PuceCouleur classe={s.classe} texte={s.label} />
                  {e && !e.aFaire && (
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${e.classe}`}
                    >
                      {e.texte}
                    </span>
                  )}
                  {e && e.aFaire && (
                    <PuceCouleur classe="bg-amber-500/15 text-amber-400 border-amber-500/30" texte="À transmettre" />
                  )}
                </>
              }
              sousTitre={
                <span className="text-gray-400">
                  <span className="font-mono">{inv.invoice_number}</span>
                  {TYPE_SUFFIXE[inv.invoice_type] ?? ""} · {fmtDate(inv.issue_date)}
                </span>
              }
              montant={fmt(inv.total_ttc)}
            >
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-4">
                <Champ libelle="Numéro" valeur={inv.invoice_number} mono />
                <Champ libelle="Client" valeur={inv.client_company || inv.client_name || "-"} />
                <Champ libelle="Émise le" valeur={fmtDate(inv.issue_date)} />
                <Champ libelle="Échéance" valeur={fmtDate(inv.due_date)} />
                <Champ libelle="Montant HT" valeur={fmt(inv.total_ht)} />
                <Champ libelle="Montant TTC" valeur={fmt(inv.total_ttc)} />
                {inv.client_email && <Champ libelle="E-mail" valeur={inv.client_email} />}
              </dl>

              {e?.alerte && <p className="text-xs text-red-400/90 mb-3">{e.alerte}</p>}
              {e && !e.alerte && e.manques.length > 0 && (
                <p className="text-xs text-amber-400/90 mb-3">{phraseManques(e.manques)}</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {transmettreMtn && (
                  <button
                    onClick={(ev) => onTransmettre(inv, ev)}
                    disabled={transmission === inv.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-400 text-sm font-semibold hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
                  >
                    {transmission === inv.id ? "Transmission…" : "Transmettre à la Plateforme Agréée"}
                  </button>
                )}
                <button
                  onClick={(ev) => onDownload(inv.id, ev)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ds-border text-indigo-400 text-sm font-semibold hover:bg-ds-elevated transition-colors"
                >
                  Télécharger la facture
                </button>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ds-border text-gray-300 text-sm font-semibold hover:bg-ds-elevated transition-colors"
                >
                  Ouvrir la facture →
                </Link>
              </div>

              {messagePdp?.id === inv.id && (
                <p className={`mt-3 text-xs ${messagePdp.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {messagePdp.texte}
                </p>
              )}
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
