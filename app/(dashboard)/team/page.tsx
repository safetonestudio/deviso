"use client";

import { useEffect, useState } from "react";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { useIsMember } from "@/components/PlanContext";
import {
  UsersRound, TrendingUp, FileText, CheckCircle2,
  Mail, Crown, ChevronRight, ShieldCheck,
} from "lucide-react";

interface Member {
  id: string;
  email: string;
  role: string;
  status: "pending" | "active";
  invited_at: string;
  accepted_at: string | null;
  member_id: string | null;
}

interface MemberStat {
  uid: string;
  is_owner: boolean;
  email: string;
  name: string;
  joined_at: string | null;
  stats: {
    proposals_total: number;
    proposals_draft: number;
    proposals_sent: number;
    proposals_signed: number;
    proposals_declined: number;
    proposals_pending: number;
    ca_encaisse: number;
    ca_pipeline: number;
    conversion_rate: number;
  };
  last_proposal: {
    title: string;
    client: string;
    status: string;
    date: string;
  } | null;
}

interface GlobalStats {
  proposals_total: number;
  proposals_sent: number;
  proposals_signed: number;
  ca_encaisse: number;
  ca_pipeline: number;
  conversion_rate: number;
  members_count: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",   color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
  sent:     { label: "Envoyé",      color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  viewed:   { label: "Vu",          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  signed:   { label: "Signé",       color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  declined: { label: "Refusé",      color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export default function TeamPage() {
  const isMember = useIsMember(); // membres invités : lecture seule, jamais de CTA upgrade
  const [members, setMembers] = useState<Member[]>([]);
  const [pipeline, setPipeline] = useState<MemberStat[]>([]);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [isPro, setIsPro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "membres">("pipeline");
  const [isOwner, setIsOwner] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [savingApproval, setSavingApproval] = useState(false);

  const loadMembers = () =>
    fetch("/api/team")
      .then((r) => {
        if (r.status === 403) { setIsPro(false); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => { if (d) setMembers(d.members ?? []); });

  const loadPipeline = () =>
    fetch("/api/team/pipeline")
      .then((r) => r.json())
      .then((d) => {
        if (d.team) setPipeline(d.team);
        if (d.global) setGlobal(d.global);
      });

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.is_owner !== undefined) setIsOwner(d.is_owner);
      if (d.profile?.require_approval !== undefined) setRequireApproval(d.profile.require_approval);
    });
    loadPipeline();
    Promise.all([loadMembers()]).finally(() => setLoading(false));
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteMsg({ type: "success", text: `Invitation envoyée à ${email}` });
      setEmail("");
      loadMembers();
    } else if (data.error === "SEAT_LIMIT_REACHED") {
      setInviteMsg({ type: "error", text: "Limite de sièges atteinte." });
    } else {
      setInviteMsg({ type: "error", text: data.error || "Erreur" });
    }
    setInviting(false);
  }

  async function handleRemove(id: string) {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleToggleApproval() {
    setSavingApproval(true);
    const newVal = !requireApproval;
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ require_approval: newVal }),
    });
    if (res.ok) setRequireApproval(newVal);
    setSavingApproval(false);
  }

  // Gate Pro — jamais affiché aux membres (ils utilisent les features de l'owner)
  if (!isPro && !isMember) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center space-y-4">
        <div className="w-12 h-12 bg-ds-elevated rounded-xl flex items-center justify-center mx-auto">
          <UsersRound size={24} className="text-gray-500" />
        </div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Équipe</h1>
        <p className="text-gray-500">La gestion d&apos;équipe multi-utilisateurs est réservée au plan Pro.</p>
        <a
          href="/billing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Passer Pro
        </a>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
  }

  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;
  const totalSeats = members.length;
  const atLimit = totalSeats >= 10;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GuidedTourBanner pageKey="team" />
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Équipe</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount + 1} membre{activeCount > 0 ? "s" : ""} actif{activeCount > 0 ? "s" : ""}
            {pendingCount > 0 ? ` · ${pendingCount} invitation${pendingCount > 1 ? "s" : ""} en attente` : ""}
          </p>
        </div>
      </div>

      {/* KPIs globaux */}
      {global && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "CA encaissé", value: fmt(global.ca_encaisse), icon: TrendingUp, color: "text-emerald-400" },
            { label: "Pipeline ouvert", value: fmt(global.ca_pipeline), icon: ChevronRight, color: "text-indigo-400" },
            { label: "Devis signés", value: `${global.proposals_signed} / ${global.proposals_sent}`, icon: CheckCircle2, color: "text-blue-400" },
            { label: "Conversion équipe", value: `${global.conversion_rate}%`, icon: FileText, color: "text-violet-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-ds-elevated">
                  <Icon size={13} className="text-gray-500" />
                </div>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-2xl font-semibold text-white tabular-nums tracking-tight">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-ds-elevated rounded-xl p-1 w-fit">
        {(["pipeline", "membres"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-ds-surface text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "pipeline" ? "Vue pipeline" : "Membres"}
          </button>
        ))}
      </div>

      {/* Vue pipeline */}
      {activeTab === "pipeline" && (
        <div className="space-y-3">
          {pipeline.length === 0 ? (
            <div className="bg-ds-surface border border-ds-border rounded-xl p-10 text-center">
              <p className="text-gray-400 text-sm">Aucune activité pour l&apos;instant.</p>
            </div>
          ) : (
            pipeline.map((member) => (
              <div key={member.uid} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-sm flex items-center justify-center shrink-0">
                    {initials(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{member.name}</span>
                      {member.is_owner && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Crown size={9} />Propriétaire
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{member.email}</div>
                  </div>

                  {member.last_proposal && (() => {
                    const s = STATUS_LABELS[member.last_proposal.status] || STATUS_LABELS.draft;
                    return (
                      <div className="text-right shrink-0">
                        <div className="text-xs text-gray-500 mb-0.5">Dernier devis</div>
                        <div className="text-xs text-white truncate max-w-[140px]">{member.last_proposal.title}</div>
                        <span className={`inline-flex mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                  {[
                    { label: "CA encaissé", value: fmt(member.stats.ca_encaisse), color: "text-emerald-400" },
                    { label: "Pipeline", value: fmt(member.stats.ca_pipeline), color: "text-indigo-400" },
                    { label: "Devis total", value: String(member.stats.proposals_total), color: "text-white" },
                    { label: "Signés", value: String(member.stats.proposals_signed), color: "text-emerald-400" },
                    { label: "En cours", value: String(member.stats.proposals_pending), color: "text-blue-400" },
                    { label: "Conversion", value: `${member.stats.conversion_rate}%`, color: "text-violet-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-ds-elevated rounded-lg p-2.5 text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</div>
                      <div className={`text-sm font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
                {member.stats.proposals_sent > 0 && (
                  <div>
                    <div className="h-1.5 bg-ds-elevated rounded-full overflow-hidden flex">
                      {member.stats.proposals_signed > 0 && (
                        <div className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${(member.stats.proposals_signed / member.stats.proposals_sent) * 100}%` }}
                        />
                      )}

                      {member.stats.proposals_pending > 0 && (
                        <div className="h-full bg-blue-500 transition-all"
                          style={{ width: `${(member.stats.proposals_pending / member.stats.proposals_sent) * 100}%` }}
                        />
                      )}
                      {member.stats.proposals_declined > 0 && (
                        <div className="h-full bg-red-500/50 transition-all"
                          style={{ width: `${(member.stats.proposals_declined / member.stats.proposals_sent) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[10px] text-gray-600">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Signés</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />En cours</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/50 inline-block" />Refusés</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Onglet Membres */}
      {activeTab === "membres" && (
        <div className="space-y-4">
          {!atLimit && isOwner && (
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Mail size={15} className="text-indigo-400" />
                Inviter un membre
              </h2>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@exemple.fr"
                  required
                  className="flex-1 bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />

                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors shrink-0"
                >
                  {inviting ? "Envoi…" : "Inviter"}
                </button>
              </form>
              {inviteMsg && (
                <p className={`text-sm mt-2 ${inviteMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {inviteMsg.type === "success" ? "✓ " : "✗ "}{inviteMsg.text}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Le membre recevra un email d&apos;invitation et aura accès au workspace partagé.
              </p>
            </div>
          )}

          {/* Paramètres d'équipe, visible uniquement au propriétaire */}
          {isOwner && (
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
                <ShieldCheck size={15} className="text-indigo-400" />
                Paramètres d&apos;équipe
              </h2>
              <p className="text-xs text-gray-500 mb-4">Ces réglages s&apos;appliquent à tous les collaborateurs de votre workspace.</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-white">Validation avant envoi</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Les collaborateurs doivent soumettre leurs devis pour votre approbation avant de pouvoir les envoyer au client.
                  </div>
                </div>

                <button
                  onClick={handleToggleApproval}
                  disabled={savingApproval}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    requireApproval ? "bg-indigo-600" : "bg-ds-elevated border border-ds-border"
                  } ${savingApproval ? "opacity-50" : ""}`}
                  aria-label="Activer/désactiver la validation avant envoi"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      requireApproval ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-ds-elevated rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : totalSeats >= 7 ? "bg-amber-400" : "bg-indigo-500"}`}
                style={{ width: `${Math.min((totalSeats / 10) * 100, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-medium tabular-nums ${atLimit ? "text-red-400" : "text-gray-500"}`}>
              {totalSeats}/10 sièges
            </span>
          </div>

          {members.length === 0 ? (
            <div className="bg-ds-surface border border-ds-border rounded-xl p-10 text-center">
              <p className="text-gray-400 text-sm">Aucun membre invité pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-ds-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Membre</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invité le</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-ds-border">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-ds-elevated/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{m.email}</div>
                        {m.accepted_at && (
                          <div className="text-xs text-gray-500">Rejoint le {fmtDate(m.accepted_at)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {m.status === "active" ? "✓ Actif" : "⏳ En attente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">{fmtDate(m.invited_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {isOwner && (
                          <button
                            onClick={() => handleRemove(m.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                          >
                            Retirer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
