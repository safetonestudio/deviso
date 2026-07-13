"use client";

import type { Proposal, Profile } from "@/types";

export type ProposalTemplate = "classic" | "modern" | "epure";

export interface ProposalProfile extends Partial<Profile> {
  proposal_template?: string | null;
  proposal_color?: string | null;
}

interface Props {
  proposal: Proposal;
  profile: ProposalProfile | null;
  showBranding?: boolean;
  isDark?: boolean; // true = thème dashboard sombre
  cgvText?: string | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

/** Affiche "2h15" pour les lignes horaires (unit === "heure"), sinon le nombre brut */
function fmtQty(quantity: number, unit: string): string {
  if (unit === "heure" && quantity !== Math.floor(quantity)) {
    const h = Math.floor(quantity);
    const min = Math.round((quantity - h) * 60);
    if (h === 0) return `${min}min`;
    if (min === 0) return `${h}h`;
    return `${h}h${String(min).padStart(2, "0")}`;
  }
  return String(quantity);
}

const PENALTY_CLAUSE =
  "En cas de retard de paiement, des pénalités de retard sont exigibles dès le lendemain de la date d'échéance au taux de 3× le taux légal en vigueur, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (Art. L441-10 C.Com.).";

// Palette de couleurs selon le mode
function palette(isDark: boolean) {
  return isDark
    ? {
        card: "bg-[#111827] border-[#2B3444]",
        headerBorder: "border-[#2B3444]",
        divider: "divide-[#2B3444]",
        border: "border-[#2B3444]",
        clientBg: "bg-[#1F2937] border-[#2B3444]",
        text900: "text-white",
        text700: "text-gray-200",
        text500: "text-gray-400",
        text400: "text-gray-500",
        text300: "text-gray-600",
        signatureBg: "bg-emerald-500/10 border border-emerald-500/20",
        signatureTitle: "text-emerald-400",
        signatureText: "text-gray-200",
        signatureSub: "text-gray-400",
        footerBorder: "border-[#2B3444]",
        footerText: "text-gray-600",
        footerLink: "text-gray-500",
      }
    : {
        card: "bg-white border-slate-200",
        headerBorder: "border-slate-100",
        divider: "divide-slate-100",
        border: "border-slate-200",
        clientBg: "bg-slate-50 border-slate-100",
        text900: "text-slate-900",
        text700: "text-slate-700",
        text500: "text-slate-500",
        text400: "text-slate-400",
        text300: "text-slate-300",
        signatureBg: "bg-emerald-50 border border-emerald-200",
        signatureTitle: "text-emerald-700",
        signatureText: "text-slate-700",
        signatureSub: "text-slate-500",
        footerBorder: "border-slate-100",
        footerText: "text-slate-300",
        footerLink: "text-slate-400",
      };
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function ItemsTable({ proposal, color, headerStyle, p }: {
  proposal: Proposal;
  color: string;
  headerStyle: "classic" | "colored" | "minimal";
  p: ReturnType<typeof palette>;
}) {
  const thBase = "text-xs font-semibold uppercase tracking-wide py-2";
  const isColored = headerStyle === "colored";
  const thColor = isColored ? "text-white" : `${p.text400}`;
  return (
    <table className="w-full mb-6 table-fixed">
      <colgroup>
        <col className="w-[46%]" />
        <col className="w-[8%]" />
        <col className="w-[12%]" />
        <col className="w-[17%]" />
        <col className="w-[17%]" />
      </colgroup>
      <thead>
        {isColored ? (
          <tr style={{ backgroundColor: color }}>
            <th className={`${thBase} ${thColor} text-left pl-3 pr-4`}>Prestation</th>
            <th className={`${thBase} ${thColor} text-center px-2`}>Qté</th>
            <th className={`${thBase} ${thColor} text-center px-2`}>Unité</th>
            <th className={`${thBase} ${thColor} text-right px-3`}>Prix HT</th>
            <th className={`${thBase} ${thColor} text-right pl-3 pr-3`}>Total HT</th>
          </tr>
        ) : (
          <tr className={`border-b ${p.border}`}>
            <th className={`${thBase} ${thColor} text-left pr-4`}>Prestation</th>
            <th className={`${thBase} ${thColor} text-center px-2`}>Qté</th>
            <th className={`${thBase} ${thColor} text-center px-2`}>Unité</th>
            <th className={`${thBase} ${thColor} text-right px-3`}>Prix HT</th>
            <th className={`${thBase} ${thColor} text-right pl-3`}>Total HT</th>
          </tr>
        )}
      </thead>
      <tbody className={`divide-y ${p.divider}`}>
        {proposal.items.map((item, i) => (
          <tr key={i}>
            <td className={`py-3 text-sm ${p.text700} pr-4`}>{item.description}</td>
            <td className={`py-3 text-sm ${p.text500} text-center px-2`}>{fmtQty(item.quantity, item.unit)}</td>
            <td className={`py-3 text-sm ${p.text500} text-center px-2`}>{item.unit}</td>
            <td className={`py-3 text-sm ${p.text500} text-right px-3`}>{fmt(item.unit_price)}</td>
            <td className={`py-3 text-sm font-medium ${p.text900} text-right pl-3`}>{fmt(item.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TotalsBox({ proposal, color, p }: { proposal: Proposal; color: string; p: ReturnType<typeof palette> }) {
  const isVAT = proposal.tva_rate > 0;
  return (
    <div className="flex justify-end mb-6">
      <div className="w-64 space-y-1.5">
        <div className={`flex justify-between text-sm ${p.text500}`}>
          <span>Total HT</span><span>{fmt(proposal.total_ht)}</span>
        </div>
        {isVAT ? (
          <div className={`flex justify-between text-sm ${p.text500}`}>
            <span>TVA {proposal.tva_rate}%</span>
            <span>{fmt(proposal.total_ttc - proposal.total_ht)}</span>
          </div>
        ) : (
          <div className={`flex justify-between text-sm ${p.text400} italic`}>
            <span>TVA non applicable (art. 293 B CGI)</span><span>—</span>
          </div>
        )}
        <div className={`flex justify-between text-base font-semibold ${p.text900} border-t ${p.border} pt-1.5`}>
          <span>Total {isVAT ? "TTC" : "net"}</span>
          <span style={{ color }}>{fmt(proposal.total_ttc)}</span>
        </div>
      </div>
    </div>
  );
}

function ConditionsSection({ proposal, p, hasCgv }: { proposal: Proposal; p: ReturnType<typeof palette>; hasCgv: boolean }) {
  return (
    <div className={`pt-6 border-t ${p.border} space-y-2`}>
      {proposal.payment_terms && (
        <p className={`text-sm ${p.text500}`}>
          <span className={`font-medium ${p.text700}`}>Paiement : </span>
          {proposal.payment_terms}
        </p>
      )}
      {proposal.notes && <p className={`text-sm ${p.text400}`}>{proposal.notes}</p>}
      <p className={`text-xs ${p.text400} mt-2`}>{PENALTY_CLAUSE}</p>
      {hasCgv && (
        <p className={`text-xs ${p.text400} mt-3 pt-3 border-t ${p.border} italic`}>
          L&apos;acceptation de ce devis vaut acceptation de nos Conditions Générales de Vente annexées au présent document.
        </p>
      )}
    </div>
  );
}

function CgvSection({ cgvText, p }: { cgvText: string; p: ReturnType<typeof palette> }) {
  return (
    <div className={`${p.card} rounded-2xl border p-8 mt-2`}>
      <h2 className={`text-sm font-semibold uppercase tracking-wider ${p.text400} mb-5 pb-3 border-b ${p.border}`}>
        Conditions Générales de Vente
      </h2>
      <div className={`text-xs ${p.text500} whitespace-pre-wrap leading-relaxed`}>
        {cgvText}
      </div>
    </div>
  );
}

function SignatureBlock({ proposal, p }: { proposal: Proposal; p: ReturnType<typeof palette> }) {
  if (!proposal.signer_name) return null;
  const signedAt = proposal.signed_at
    ? new Date(proposal.signed_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={`mt-6 pt-4 border-t ${p.border}`}>
      <div className={`flex items-start gap-3 ${p.signatureBg} rounded-xl p-4`}>
        <div className="text-emerald-500 mt-0.5 text-lg">✍️</div>
        <div>
          <p className={`text-xs font-semibold ${p.signatureTitle} uppercase tracking-wide mb-1`}>
            Signé électroniquement
          </p>
          <p className={`text-sm ${p.signatureText}`}>
            Par : <strong>{proposal.signer_name}</strong>
          </p>
          {signedAt && (
            <p className={`text-xs ${p.signatureSub}`}>Le {signedAt}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BrandingFooter({ p }: { p: ReturnType<typeof palette> }) {
  return (
    <div className={`mt-8 pt-4 border-t ${p.footerBorder} text-center`}>
      <p className={`text-xs ${p.footerText}`}>
        Devis créé avec{" "}
        <a href="https://getdeviso.fr" className={`${p.footerLink} hover:underline`}>Deviso</a>
        {" "}— l&apos;outil de devis IA pour freelances
      </p>
    </div>
  );
}

// ─── Template: Classique ─────────────────────────────────────────────────────

function ClassicTemplate({ proposal, profile, color, showBranding, p, cgvText }: {
  proposal: Proposal; profile: ProposalProfile | null; color: string; showBranding: boolean; p: ReturnType<typeof palette>; cgvText?: string | null;
}) {
  return (
    <>
    <div className={`${p.card} rounded-2xl border p-8 mb-6`}>
      <div className={`flex justify-between items-start mb-8 pb-6 border-b ${p.headerBorder}`}>
        <div>
          <div className="flex items-baseline gap-3 mb-3">
            <div className="text-2xl font-semibold" style={{ color }}>DEVIS</div>
            {proposal.proposal_number && (
              <div className={`text-sm font-semibold ${p.text400}`}>{proposal.proposal_number}</div>
            )}
          </div>
          {(profile?.company_name || profile?.full_name) && (
            <div className={`font-semibold ${p.text900} text-base`}>{profile?.company_name || profile?.full_name}</div>
          )}
          {profile?.company_name && profile?.full_name && (
            <div className={`text-sm ${p.text500}`}>{profile.full_name}</div>
          )}
          {profile?.address && <div className={`text-sm ${p.text400}`}>{profile.address}</div>}
          {profile?.siret && <div className={`text-xs ${p.text400}`}>SIRET : {profile.siret}</div>}
          {profile?.tva_number && <div className={`text-xs ${p.text400}`}>N° TVA : {profile.tva_number}</div>}
          {profile?.email && <div className={`text-sm ${p.text400}`}>{profile.email}</div>}
          <div className={`text-sm ${p.text500} mt-2`}>{fmtDate(proposal.created_at)}</div>
          {proposal.valid_until && (
            <div className={`text-sm ${p.text500}`}>
              Valable jusqu&apos;au {new Date(proposal.valid_until).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-xs font-semibold uppercase tracking-wide ${p.text400} mb-1`}>Adressé à</div>
          <div className={`font-semibold ${p.text900} text-base`}>{proposal.client_company || proposal.client_name || "Client"}</div>
          {proposal.client_name && proposal.client_company && (
            <div className={`text-sm ${p.text500}`}>{proposal.client_name}</div>
          )}
          {proposal.client_address && <div className={`text-sm ${p.text400}`}>{proposal.client_address}</div>}
          {proposal.client_siren && <div className={`text-xs ${p.text400}`}>SIREN : {proposal.client_siren}</div>}
          {proposal.client_email && <div className={`text-sm ${p.text400}`}>{proposal.client_email}</div>}
        </div>
      </div>

      <h2 className={`text-xl font-semibold ${p.text900} mb-6`}>{proposal.title}</h2>
      <ItemsTable proposal={proposal} color={color} headerStyle="classic" p={p} />
      <TotalsBox proposal={proposal} color={color} p={p} />
      <ConditionsSection proposal={proposal} p={p} hasCgv={!!cgvText} />
      <SignatureBlock proposal={proposal} p={p} />
      {showBranding && <BrandingFooter p={p} />}
    </div>
    {cgvText && <CgvSection cgvText={cgvText} p={p} />}
    </>
  );
}

// ─── Template: Moderne ───────────────────────────────────────────────────────

function ModernTemplate({ proposal, profile, color, showBranding, p, cgvText }: {
  proposal: Proposal; profile: ProposalProfile | null; color: string; showBranding: boolean; p: ReturnType<typeof palette>; cgvText?: string | null;
}) {
  return (
    <>
    <div className={`${p.card} rounded-2xl border overflow-hidden mb-6`}>
      <div style={{ backgroundColor: color }} className="px-8 py-7 text-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Devis</div>
            <div className="text-2xl font-semibold">{profile?.company_name || profile?.full_name || ""}</div>
            {profile?.company_name && profile?.full_name && (
              <div className="text-sm opacity-80 mt-0.5">{profile.full_name}</div>
            )}
            {profile?.address && <div className="text-sm opacity-70 mt-1">{profile.address}</div>}
            {profile?.email && <div className="text-sm opacity-70">{profile.email}</div>}
            {profile?.siret && <div className="text-xs opacity-60 mt-1">SIRET : {profile.siret}</div>}
            {profile?.tva_number && <div className="text-xs opacity-60">N° TVA : {profile.tva_number}</div>}
          </div>
          <div className="text-right">
            {proposal.proposal_number && (
              <div className="text-3xl font-semibold opacity-30 mb-1">{proposal.proposal_number}</div>
            )}
            <div className="text-xs opacity-70">Émis le {fmtDate(proposal.created_at)}</div>
            {proposal.valid_until && (
              <div className="text-xs opacity-70">
                Valable jusqu&apos;au {new Date(proposal.valid_until).toLocaleDateString("fr-FR")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`px-8 py-5 ${p.clientBg} border-b flex justify-end`}>
        <div className="text-right">
          <div className={`text-xs font-semibold uppercase tracking-wide ${p.text400} mb-1`}>Adressé à</div>
          <div className={`font-semibold ${p.text900}`}>{proposal.client_company || proposal.client_name || "Client"}</div>
          {proposal.client_name && proposal.client_company && (
            <div className={`text-sm ${p.text500}`}>{proposal.client_name}</div>
          )}
          {proposal.client_address && <div className={`text-sm ${p.text400}`}>{proposal.client_address}</div>}
          {proposal.client_email && <div className={`text-sm ${p.text400}`}>{proposal.client_email}</div>}
        </div>
      </div>

      <div className="p-8">
        <h2 className={`text-xl font-semibold ${p.text900} mb-6`}>{proposal.title}</h2>
        <ItemsTable proposal={proposal} color={color} headerStyle="colored" p={p} />
        <TotalsBox proposal={proposal} color={color} p={p} />
        <ConditionsSection proposal={proposal} p={p} hasCgv={!!cgvText} />
        <SignatureBlock proposal={proposal} p={p} />
        {showBranding && <BrandingFooter p={p} />}
      </div>
    </div>
    {cgvText && <CgvSection cgvText={cgvText} p={p} />}
    </>
  );
}

// ─── Template: Épuré ─────────────────────────────────────────────────────────

function EpureTemplate({ proposal, profile, color, showBranding, p, cgvText }: {
  proposal: Proposal; profile: ProposalProfile | null; color: string; showBranding: boolean; p: ReturnType<typeof palette>; cgvText?: string | null;
}) {
  return (
    <>
    <div className={`${p.card} rounded-2xl border p-8 mb-6`}>
      <div className="flex justify-between items-start mb-10">
        <div className="flex gap-4">
          <div className="w-0.5 rounded-full self-stretch" style={{ backgroundColor: color }} />
          <div>
            <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${p.text400} mb-3`}>Devis</div>
            {(profile?.company_name || profile?.full_name) && (
              <div className={`font-semibold ${p.text900} text-base`}>{profile?.company_name || profile?.full_name}</div>
            )}
            {profile?.company_name && profile?.full_name && (
              <div className={`text-sm ${p.text500}`}>{profile.full_name}</div>
            )}
            {profile?.address && <div className={`text-sm ${p.text400} mt-1`}>{profile.address}</div>}
            {profile?.email && <div className={`text-sm ${p.text400}`}>{profile.email}</div>}
            {profile?.siret && <div className={`text-xs ${p.text300} mt-1`}>SIRET {profile.siret}</div>}
            {profile?.tva_number && <div className={`text-xs ${p.text300}`}>N° TVA {profile.tva_number}</div>}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-xs font-semibold uppercase tracking-wide ${p.text300} mb-1`}>Adressé à</div>
          <div className={`font-semibold ${p.text900}`}>{proposal.client_company || proposal.client_name || "Client"}</div>
          {proposal.client_name && proposal.client_company && (
            <div className={`text-sm ${p.text500}`}>{proposal.client_name}</div>
          )}
          {proposal.client_address && <div className={`text-sm ${p.text400}`}>{proposal.client_address}</div>}
          {proposal.client_email && <div className={`text-sm ${p.text400}`}>{proposal.client_email}</div>}
          <div className={`text-xs ${p.text300} mt-3`}>{fmtDate(proposal.created_at)}</div>
          {proposal.proposal_number && (
            <div className={`text-xs ${p.text300}`}>{proposal.proposal_number}</div>
          )}
          {proposal.valid_until && (
            <div className={`text-xs ${p.text300}`}>
              Valable jusqu&apos;au {new Date(proposal.valid_until).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      </div>

      <div className="h-px mb-8" style={{ backgroundColor: color, opacity: 0.3 }} />

      <h2 className={`text-xl font-semibold ${p.text900} mb-6`}>{proposal.title}</h2>
      <ItemsTable proposal={proposal} color={color} headerStyle="minimal" p={p} />
      <TotalsBox proposal={proposal} color={color} p={p} />
      <ConditionsSection proposal={proposal} p={p} hasCgv={!!cgvText} />
      <SignatureBlock proposal={proposal} p={p} />
      {showBranding && <BrandingFooter p={p} />}
    </div>
    {cgvText && <CgvSection cgvText={cgvText} p={p} />}
    </>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function ProposalDocument({ proposal, profile, showBranding = true, isDark = false, cgvText }: Props) {
  const template = (profile?.proposal_template as ProposalTemplate) || "classic";
  const color = profile?.proposal_color || "#4f46e5";
  const p = palette(isDark);

  if (template === "modern") {
    return <ModernTemplate proposal={proposal} profile={profile} color={color} showBranding={showBranding} p={p} cgvText={cgvText} />;
  }
  if (template === "epure") {
    return <EpureTemplate proposal={proposal} profile={profile} color={color} showBranding={showBranding} p={p} cgvText={cgvText} />;
  }
  return <ClassicTemplate proposal={proposal} profile={profile} color={color} showBranding={showBranding} p={p} cgvText={cgvText} />;
}
