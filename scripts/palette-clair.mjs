/**
 * Palette Tailwind v3 (500 a 900) et calcul du contraste dans le pire cas du
 * theme clair : texte pose sur une pastille de sa propre teinte (500 a 20 %)
 * sur le fond de page #F4F4F6. Partage par check-theme-clair et la generation.
 */
export const PALETTE = {
  red: ["#ef4444","#dc2626","#b91c1c","#991b1b","#7f1d1d"],
  orange: ["#f97316","#ea580c","#c2410c","#9a3412","#7c2d12"],
  amber: ["#f59e0b","#d97706","#b45309","#92400e","#78350f"],
  yellow: ["#eab308","#ca8a04","#a16207","#854d0e","#713f12"],
  lime: ["#84cc16","#65a30d","#4d7c0f","#3f6212","#365314"],
  green: ["#22c55e","#16a34a","#15803d","#166534","#14532d"],
  emerald: ["#10b981","#059669","#047857","#065f46","#064e3b"],
  teal: ["#14b8a6","#0d9488","#0f766e","#115e59","#134e4a"],
  cyan: ["#06b6d4","#0891b2","#0e7490","#155e75","#164e63"],
  sky: ["#0ea5e9","#0284c7","#0369a1","#075985","#0c4a6e"],
  blue: ["#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a"],
  indigo: ["#6366f1","#4f46e5","#4338ca","#3730a3","#312e81"],
  violet: ["#8b5cf6","#7c3aed","#6d28d9","#5b21b6","#4c1d95"],
  purple: ["#a855f7","#9333ea","#7e22ce","#6b21a8","#581c87"],
  fuchsia: ["#d946ef","#c026d3","#a21caf","#86198f","#701a75"],
  pink: ["#ec4899","#db2777","#be185d","#9d174d","#831843"],
  rose: ["#f43f5e","#e11d48","#be123c","#9f1239","#881337"],
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t));
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
export const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAGE = hex("#F4F4F6");
/** Pire fond plausible pour un texte de cette teinte en theme clair. */
export const pireFond = (teinte) => mix(hex(PALETTE[teinte][0]), PAGE, 0.2);
/** Contraste d une couleur CSS (#hex ou rgb(r g b / a)) dans le pire cas de sa teinte. */
export function contrastePire(teinte, couleurCss) {
  const fond = pireFond(teinte);
  let rgb, a = 1;
  if (couleurCss.startsWith("#")) rgb = hex(couleurCss);
  else { const p = couleurCss.match(/[\d.]+/g).map(Number); rgb = p.slice(0, 3); if (p.length > 3) a = p[3]; }
  return contraste(mix(rgb, fond, a), fond);
}
/** Nuance la plus claire (600 a 900) lisible a 4,5 dans le pire cas. */
export function nuanceSure(teinte) {
  for (const h of PALETTE[teinte].slice(1)) if (contrastePire(teinte, h) >= 4.5) return h;
  return PALETTE[teinte][4];
}
