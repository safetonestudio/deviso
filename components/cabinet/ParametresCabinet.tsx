"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, FileSpreadsheet, ListChecks } from "lucide-react";
import type { PlanComptesFec } from "@/lib/plan-comptes-fec";
import { LOGICIELS, FORMATS, logicielParId } from "@/lib/logiciels-comptables";
import { ReglagesFec } from "@/components/cabinet/ReglagesFec";
import { ReglagesResume, type ReglageResume } from "@/components/cabinet/ReglagesResume";

export type VueParametres = "cabinet" | "logiciel" | "fec" | "notifications";

const SECTIONS: { id: VueParametres; label: string; icone: typeof Bell }[] = [
  { id: "cabinet", label: "Cabinet", icone: Building2 },
  { id: "logiciel", label: "Logiciel et export", icone: FileSpreadsheet },
  { id: "fec", label: "Comptes du FEC", icone: ListChecks },
  { id: "notifications", label: "Notifications", icone: Bell },
];

const inputCls =
  "w-full h-10 bg-ds-bg border border-ds-border rounded-lg px-3 text-sm text-ink focus:outline-hidden focus:border-indigo-500";
const boutonCls =
  "h-10 px-4 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors disabled:opacity-50";

type Initial = {
  nomCabinet: string;
  nomContact: string;
  plan: PlanComptesFec;
  resume: ReglageResume;
  logiciel: string | null;
  pdfDefaut: boolean;
};

async function patch(corps: Record<string, unknown>): Promise<string | null> {
  const r = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  }).catch(() => null);
  if (r?.ok) return null;
  const data = r ? await r.json().catch(() => ({})) : {};
  return data.error || "Enregistrement impossible";
}

function Etat({ etat }: { etat: { ok?: boolean; erreur?: string | null } }) {
  if (etat.erreur) return <span className="text-sm text-red-400">{etat.erreur}</span>;
  if (etat.ok) return <span className="text-sm text-emerald-400">Enregistré.</span>;
  return null;
}

/**
 * Paramètres de l'espace cabinet (20/11/2026), en maître / détail comme les
 * paramètres du client : un menu, un seul réglage affiché à la fois.
 * La validation fait foi côté serveur (PATCH /api/profile).
 */
export function ParametresCabinet({ vueInitiale, email, initial }: { vueInitiale: VueParametres; email: string; initial: Initial }) {
  const router = useRouter();
  const [vue, setVue] = useState<VueParametres>(vueInitiale);

  function choisir(v: VueParametres) {
    setVue(v);
    window.history.replaceState(null, "", `/cabinet/parametres?vue=${v}`);
  }

  // Cabinet
  const [nomCabinet, setNomCabinet] = useState(initial.nomCabinet);
  const [nomContact, setNomContact] = useState(initial.nomContact);
  const [etatCab, setEtatCab] = useState<{ ok?: boolean; erreur?: string | null; envoi?: boolean }>({});

  // Logiciel
  const [logiciel, setLogiciel] = useState<string | null>(initial.logiciel);
  const [pdfDefaut, setPdfDefaut] = useState(initial.pdfDefaut);
  const [etatLog, setEtatLog] = useState<{ ok?: boolean; erreur?: string | null; envoi?: boolean }>({});
  const choisi = logicielParId(logiciel);

  return (
    <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-14">
      <div className="lg:hidden">
        <label htmlFor="param-cabinet" className="block text-sm text-gray-500 mb-2">
          Réglage affiché
        </label>
        <select
          id="param-cabinet"
          value={vue}
          onChange={(e) => choisir(e.target.value as VueParametres)}
          className="w-full bg-ds-surface border border-ds-border text-ink rounded-lg px-3 py-3 text-base focus:outline-hidden focus:border-indigo-500"
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <nav className="hidden lg:block lg:self-start lg:sticky lg:top-[88px] text-[15px]">
        <ul className="space-y-1">
          {SECTIONS.map((s) => {
            const Icone = s.icone;
            const actif = vue === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => choisir(s.id)}
                  aria-current={actif ? "true" : undefined}
                  className={`flex items-center gap-2.5 w-full text-left rounded-lg px-3.5 py-2 transition-colors ${
                    actif ? "bg-indigo-500/10 text-indigo-400 font-semibold" : "text-gray-400 hover:text-ink hover:bg-ds-elevated"
                  }`}
                >
                  <Icone size={16} className="shrink-0" />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 max-w-[760px]">
        {vue === "cabinet" && (
          <section className="carte p-6">
            <h2 className="font-semibold text-ink mb-1">Cabinet</h2>
            <p className="text-sm text-gray-400 mb-5">
              Le nom du cabinet apparaît chez vos clients (dans leurs paramètres et vos messages) et dans vos invitations.
            </p>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!nomCabinet.trim()) return setEtatCab({ erreur: "Le nom du cabinet est obligatoire." });
                setEtatCab({ envoi: true });
                const erreur = await patch({ company_name: nomCabinet.trim(), full_name: nomContact.trim() });
                setEtatCab({ ok: !erreur, erreur });
                if (!erreur) router.refresh();
              }}
            >
              <label className="block">
                <span className="block text-sm font-medium text-gray-300 mb-1.5">Nom du cabinet</span>
                <input value={nomCabinet} onChange={(e) => { setNomCabinet(e.target.value); setEtatCab({}); }} className={inputCls} maxLength={120} required />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-300 mb-1.5">Votre nom</span>
                <input value={nomContact} onChange={(e) => { setNomContact(e.target.value); setEtatCab({}); }} className={inputCls} maxLength={120} />
              </label>
              <div className="block">
                <span className="block text-sm font-medium text-gray-300 mb-1.5">Adresse de connexion</span>
                <p className="text-sm text-ink">{email}</p>
                <p className="text-[13px] text-gray-500 mt-1">Le résumé par e-mail y est envoyé. Pour la changer, écrivez au support.</p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={etatCab.envoi} className={boutonCls}>Enregistrer</button>
                <Etat etat={etatCab} />
              </div>
            </form>
          </section>
        )}

        {vue === "logiciel" && (
          <section className="carte p-6">
            <h2 className="font-semibold text-ink mb-1">Logiciel et export</h2>
            <p className="text-sm text-gray-400 mb-5">
              Choisissez votre logiciel de production : la fenêtre d&apos;export propose alors directement le fichier qu&apos;il
              importe, et vous dit où l&apos;importer.
            </p>
            <label className="block mb-4">
              <span className="block text-sm font-medium text-gray-300 mb-1.5">Logiciel de production</span>
              <select
                value={logiciel ?? ""}
                onChange={(e) => { setLogiciel(e.target.value || null); setEtatLog({}); }}
                className={inputCls}
              >
                <option value="">Non précisé (FEC standard)</option>
                {LOGICIELS.map((l) => (
                  <option key={l.id} value={l.id}>{l.nom}</option>
                ))}
              </select>
            </label>
            {choisi && (
              <div className="rounded-lg border border-ds-border bg-ds-bg p-4 mb-4 text-sm">
                <p className="text-ink font-medium">Fichier produit : {FORMATS[choisi.format].libelle}</p>
                <p className="text-gray-400 mt-1">{choisi.consigne}</p>
              </div>
            )}
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input type="checkbox" checked={pdfDefaut} onChange={(e) => { setPdfDefaut(e.target.checked); setEtatLog({}); }} className="mt-0.5 accent-indigo-500" />
              <span>
                <span className="block text-sm font-medium text-ink">Joindre les PDF des factures par défaut</span>
                <span className="block text-[13px] text-gray-400 mt-0.5">Chaque PDF porte le numéro de sa pièce, pour le rattacher à son écriture.</span>
              </span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={etatLog.envoi}
                className={boutonCls}
                onClick={async () => {
                  setEtatLog({ envoi: true });
                  const erreur = await patch({ logiciel_comptable: logiciel, export_pdf_defaut: pdfDefaut });
                  setEtatLog({ ok: !erreur, erreur });
                }}
              >
                Enregistrer
              </button>
              <Etat etat={etatLog} />
            </div>
          </section>
        )}

        {vue === "fec" && (
          <section>
            <div className="mb-4">
              <h2 className="font-semibold text-ink mb-1">Comptes du FEC</h2>
              <p className="text-sm text-gray-400">
                Les comptes et journaux de vos exports, alignés sur votre logiciel pour un import sans retouche. Ils
                s&apos;appliquent à tous les dossiers ; le compte de chaque client reste son compte auxiliaire, tiré de son SIREN.
              </p>
            </div>
            <ReglagesFec initial={initial.plan} />
          </section>
        )}

        {vue === "notifications" && (
          <section className="carte p-6">
            <h2 className="font-semibold text-ink mb-4">Notifications</h2>
            <ReglagesResume initial={initial.resume} />
          </section>
        )}
      </div>
    </div>
  );
}
