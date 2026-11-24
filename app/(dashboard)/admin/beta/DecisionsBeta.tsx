"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidature } from "@/lib/beta-candidatures";

const STATUT: Record<Candidature["statut"], { texte: string; ton: string }> = {
  en_attente: { texte: "En attente", ton: "text-amber-400" },
  acceptee: { texte: "Acceptée", ton: "text-emerald-400" },
  refusee: { texte: "Refusée", ton: "text-gray-400" },
};

const date = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "";

function etatAcces(c: Candidature): string {
  if (c.statut !== "acceptee") return "";
  if (c.jeton_utilise_le) return `Compte créé le ${date(c.jeton_utilise_le)}`;
  if (c.jeton_expire_le && new Date(c.jeton_expire_le).getTime() < Date.now()) return "Lien expiré, non utilisé";
  return `Lien envoyé, valable jusqu'au ${date(c.jeton_expire_le)}`;
}

const CHAMP =
  "w-full h-11 rounded-lg bg-ds-bg border border-ds-border px-3 text-[15px] text-ink placeholder:text-gray-500 focus:outline-none focus:border-indigo-500";

export function DecisionsBeta({ candidatures }: { candidatures: Candidature[] }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"testeur" | "cabinet">("testeur");

  async function agir(cle: string, corps: Record<string, unknown>, succes: string) {
    setEnCours(cle);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error || "Action impossible.");
      setMessage({ ok: true, texte: succes });
      router.refresh();
      return true;
    } catch (e) {
      setMessage({ ok: false, texte: e instanceof Error ? e.message : "Action impossible." });
      return false;
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {message && (
        <p role="status" className={`rounded-lg px-4 py-3 text-[15px] ${message.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {message.texte}
        </p>
      )}

      <section className="ds-card rounded-xl p-5 sm:p-6">
        <h2 className="text-[17px] font-semibold text-ink">Inviter directement</h2>
        <p className="mt-1 text-[14px] text-gray-400">
          Pour les clients du cabinet pilote, ou le cabinet lui-même. La personne reçoit tout de suite son lien personnel.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await agir("inviter", { action: "inviter", nom, email, type }, `Lien d'accès envoyé à ${email}.`);
            if (ok) {
              setNom("");
              setEmail("");
            }
          }}
        >
          <label className="text-[14px] font-medium text-ink">
            Prénom et nom
            <input className={`mt-1 ${CHAMP}`} value={nom} onChange={(e) => setNom(e.target.value)} required />
          </label>
          <label className="text-[14px] font-medium text-ink">
            Adresse e-mail
            <input type="email" className={`mt-1 ${CHAMP}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="text-[14px] font-medium text-ink">
            Accès
            <select className={`mt-1 ${CHAMP}`} value={type} onChange={(e) => setType(e.target.value as "testeur" | "cabinet")}>
              <option value="testeur">Bêta-testeur</option>
              <option value="cabinet">Cabinet</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={enCours === "inviter"}
            className="h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[15px] font-semibold disabled:opacity-60"
          >
            Envoyer le lien
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-ink">Candidatures ({candidatures.length})</h2>
        {candidatures.length === 0 && <p className="mt-3 text-[15px] text-gray-400">Aucune candidature pour l&apos;instant.</p>}
        <ul className="mt-4 space-y-3">
          {candidatures.map((c) => (
            <li key={c.id} className="ds-card rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-ink">
                    {c.nom}
                    {c.type_acces === "cabinet" && <span className="ml-2 text-[13px] font-medium text-gray-400">Cabinet</span>}
                    {c.origine === "direct" && <span className="ml-2 text-[13px] font-medium text-gray-400">Invitation directe</span>}
                  </p>
                  <p className="text-[14px] text-gray-400 break-all">{c.email}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[14px] font-semibold ${STATUT[c.statut].ton}`}>{STATUT[c.statut].texte}</p>
                  <p className="text-[13px] text-gray-400">Reçue le {date(c.cree_le)}</p>
                </div>
              </div>
              {(c.activite || c.statut_juridique || c.outil || c.message) && (
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-[14px] sm:grid-cols-[auto_1fr]">
                  {c.activite && (<><dt className="text-gray-400">Activité</dt><dd className="text-ink">{c.activite}</dd></>)}
                  {c.statut_juridique && (<><dt className="text-gray-400">Statut</dt><dd className="text-ink">{c.statut_juridique}</dd></>)}
                  {c.outil && (<><dt className="text-gray-400">Facture avec</dt><dd className="text-ink">{c.outil}</dd></>)}
                  {c.message && (<><dt className="text-gray-400">Message</dt><dd className="text-ink whitespace-pre-line">{c.message}</dd></>)}
                </dl>
              )}
              {etatAcces(c) && <p className="mt-3 text-[14px] text-gray-300">{etatAcces(c)}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {c.statut === "en_attente" && (
                  <>
                    <button
                      type="button"
                      disabled={!!enCours}
                      onClick={() => agir(c.id, { action: "accepter", id: c.id }, `${c.nom} est accepté(e), le lien est parti.`)}
                      className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[14px] font-semibold disabled:opacity-60"
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      disabled={!!enCours}
                      onClick={() => {
                        if (confirm(`Refuser la candidature de ${c.nom} ? Un courriel de refus lui sera envoyé.`)) {
                          agir(c.id, { action: "refuser", id: c.id }, `Refus envoyé à ${c.nom}.`);
                        }
                      }}
                      className="h-10 px-4 rounded-lg border border-ds-border text-ink text-[14px] font-semibold hover:bg-ink/5 disabled:opacity-60"
                    >
                      Refuser
                    </button>
                  </>
                )}
                {c.statut === "acceptee" && !c.jeton_utilise_le && (
                  <button
                    type="button"
                    disabled={!!enCours}
                    onClick={() => agir(c.id, { action: "accepter", id: c.id }, `Nouveau lien envoyé à ${c.nom}.`)}
                    className="h-10 px-4 rounded-lg border border-ds-border text-ink text-[14px] font-semibold hover:bg-ink/5 disabled:opacity-60"
                  >
                    Renvoyer un lien
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
