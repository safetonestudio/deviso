/**
 * Petits visuels des tuiles du tableau de bord. Chacun ne montre que des
 * donnees reelles passees par la page : aucune courbe decorative.
 * Composants serveur, sans etat.
 */

type Part = { valeur: number; classe: string; libelle: string };

/** Barre repartie en parts (ex. encours a jour / en retard), avec legende. */
export function BarreParts({ parts, description }: { parts: Part[]; description: string }) {
  const total = parts.reduce((s, p) => s + p.valeur, 0);
  if (total <= 0) return <div className="h-1.5 rounded-full bg-ds-elevated border border-ds-border" aria-hidden="true" />;
  return (
    <div role="img" aria-label={description}>
      <div className="piste-jauge flex h-1.5 rounded-full overflow-hidden bg-ds-elevated gap-px">
        {parts.filter((p) => p.valeur > 0).map((p) => (
          <span key={p.libelle} className={p.classe} style={{ width: `${(p.valeur / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[12px] text-gray-400">
        {parts.filter((p) => p.valeur > 0).map((p) => (
          <span key={p.libelle} className="inline-flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${p.classe}`} aria-hidden="true" />
            {p.libelle}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Courbe miniature d'une serie (ex. six derniers mois encaisses). */
export function Courbe({ valeurs, description }: { valeurs: number[]; description: string }) {
  const max = Math.max(...valeurs, 0);
  if (valeurs.length < 2 || max <= 0) return null;
  const L = 120;
  const H = 32;
  const pas = L / (valeurs.length - 1);
  const pts = valeurs.map((v, i) => [i * pas, H - 3 - (v / max) * (H - 8)] as const);
  const ligne = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [dx, dy] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${L} ${H}`} preserveAspectRatio="none" className="w-full h-8 text-indigo-500 overflow-visible" role="img" aria-label={description}>
      <path d={`${ligne} L${L} ${H} L0 ${H} Z`} fill="currentColor" opacity="0.14" />
      <path d={ligne} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={dx} cy={dy} r="2.5" fill="currentColor" />
    </svg>
  );
}

/** Anneau de progression (seuil de franchise de TVA). */
export function Anneau({ pct, classe, description }: { pct: number; classe: string; description: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative w-[116px] h-[116px] shrink-0"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={description}
    >
      <svg viewBox="0 0 116 116" className="w-full h-full -rotate-90">
        <circle cx="58" cy="58" r={r} fill="none" strokeWidth="11" className="stroke-ds-border" />
        <circle
          cx="58"
          cy="58"
          r={r}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          stroke="currentColor"
          className={classe}
          strokeDasharray={`${(Math.min(100, pct) / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] leading-none font-semibold text-ink tabular-nums">{pct}<span className="text-[13px] text-gray-400 ml-0.5">%</span></span>
        <span className="text-[11px] text-gray-400 mt-1">du seuil</span>
      </div>
    </div>
  );
}
