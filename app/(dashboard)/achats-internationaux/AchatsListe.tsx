"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarreRecherche } from "@/components/ui/BarreRecherche";
import type { AchatInternational } from "@/lib/superpdp-achats";
import { PAYS_FACTURATION } from "@/lib/superpdp-nature";
import { CarteDepliable, PuceCouleur, TuileSynthese, Champ } from "@/components/ui/CarteDepliable";
import { ExplicationProbleme } from "@/components/ui/ExplicationProbleme";
import { expliquerAchat } from "@/lib/superpdp-explications";
import { CorrigerAchat } from "./CorrigerAchat";

const nomPays = (code: string) => PAYS_FACTURATION.find((p) => p.code === code)?.nom ?? code;

const jour = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const montant = (n: number, devise: string) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise || "EUR" }).format(n);

const DECLARE = { texte: "Déclaré", classe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };

const STATUT: Record<AchatInternational["transmission_status"], { texte: string; classe: string }> = {
  // « transmis » = stocké par la Plateforme Agréée, envoi à l'administration
  // encore à venir. « Déclaré » n'est affiché qu'avec ppf_ereporting_id.
  transmis: { texte: "Enregistré", classe: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  en_attente: { texte: "En attente", classe: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  action_requise: { texte: "Action requise", classe: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  echec: { texte: "En échec", classe: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const estDeclare = (a: AchatInternational) =>
  a.transmission_status === "transmis" && a.ppf_ereporting_id !== null;

export function AchatsListe({ achats }: { achats: AchatInternational[] }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const retransmettre = async (id: string) => {
    setEnCours(id);
    setErreur(null);
    try {
      const r = await fetch(`/api/superpdp/achats/${id}/retransmettre`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErreur(d.message ?? d.error ?? "La retransmission n'a pas abouti.");
        return;
      }
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Réessayez.");
    } finally {
      setEnCours(null);
    }
  };

  if (achats.length === 0) {
    return (
      <section className="carte p-6 text-center">
        <p className="text-ink font-medium mb-1">Aucun achat étranger saisi</p>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Quand vous achetez à un fournisseur établi hors de France, saisissez sa facture ici pour
          en déclarer l&apos;acquisition à l&apos;administration.
        </p>
      </section>
    );
  }

  const f = q.trim().toLowerCase();
  const liste = f
    ? achats.filter(
        (a) =>
          a.fournisseur_nom.toLowerCase().includes(f) ||
          (a.numero ?? "").toLowerCase().includes(f) ||
          nomPays(a.fournisseur_pays).toLowerCase().includes(f)
      )
    : achats;

  const total = achats.length;
  const nbDeclare = achats.filter(estDeclare).length;
  const nbProbleme = achats.filter(
    (a) => a.transmission_status === "echec" || a.transmission_status === "action_requise"
  ).length;

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <TuileSynthese libelle="Achats saisis" valeur={String(total)} />
        <TuileSynthese libelle="À traiter" valeur={String(nbProbleme)} alerte={nbProbleme > 0} />
        <TuileSynthese libelle="Déclarés" valeur={String(nbDeclare)} />
      </div>

      <div className="mt-4">
        <BarreRecherche value={q} onChange={setQ} placeholder="Rechercher un fournisseur, un pays..." />
      </div>

      {erreur && <p className="text-sm text-red-400 mt-3">{erreur}</p>}

      <div className="space-y-2.5 mt-4">
        {liste.map((a) => {
          const declare = estDeclare(a);
          const s = declare ? DECLARE : STATUT[a.transmission_status];
          const ex = expliquerAchat(a);
          return (
            <CarteDepliable
              key={a.id}
              titre={a.fournisseur_nom}
              pastilles={<PuceCouleur classe={s.classe} texte={s.texte} />}
              sousTitre={
                <span className="text-gray-400">
                  {nomPays(a.fournisseur_pays)} · {jour(a.date_facture)} ·{" "}
                  {a.categorie === "biens" ? "Biens" : "Services"}
                </span>
              }
              montant={montant(a.montant_ht, a.devise)}
            >
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-4">
                <Champ libelle="Numéro" valeur={a.numero || "-"} mono />
                <Champ libelle="Pays" valeur={nomPays(a.fournisseur_pays)} />
                <Champ libelle="Montant HT" valeur={montant(a.montant_ht, a.devise)} />
                <Champ libelle="TVA" valeur={`${montant(a.montant_tva, a.devise)} (${a.taux_tva} %)`} />
              </dl>

              {a.transmission_status === "transmis" && !declare && (
                <p className="text-xs text-gray-500 mb-3">
                  Envoi à l&apos;administration programmé par la Plateforme Agréée.
                </p>
              )}
              {declare && a.declared_at && (
                <p className="text-xs text-gray-500 mb-3">Déclaré le {jour(a.declared_at)}.</p>
              )}
              {a.transmission_status !== "transmis" && a.transmission_error && (
                <p className="text-xs text-red-400/90 mb-3">{a.transmission_error}</p>
              )}

              {ex && <ExplicationProbleme ton={ex.ton} probleme={ex.probleme} etapes={ex.etapes} />}

              {a.transmission_status !== "transmis" && (
                <div className="flex flex-wrap items-center gap-3">
                  <CorrigerAchat achat={a} />
                  <button
                    onClick={() => retransmettre(a.id)}
                    disabled={enCours === a.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ds-border text-indigo-400 text-sm font-semibold hover:bg-ds-elevated transition-colors disabled:opacity-50"
                  >
                    {enCours === a.id ? "Envoi…" : "Retransmettre"}
                  </button>
                </div>
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
