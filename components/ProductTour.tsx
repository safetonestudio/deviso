"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const TOUR_KEY = "deviso_tour_v6";
const TOUR_KEY_MEMBER = "deviso_tour_member_v1";

// Tour complet, propriétaires
const STEPS_OWNER = [
  {
    target: "dashboard",
    title: "Ton tableau de bord",
    body: "L'essentiel du mois d'un coup d'œil, et les alertes qui demandent une action.",
  },
  {
    target: "proposals",
    title: "Devis générés par IA",
    body: "Décris ta mission, l'IA génère le devis. Ton client signe depuis un lien, sans compte.",
  },
  {
    target: "invoices",
    title: "Factures Factur-X conformes 2026",
    body: "Convertis un devis signé en facture conforme, en un clic.",
  },
  {
    target: "factures-recues",
    title: "Factures reçues",
    body: "Les factures de tes fournisseurs arrivent ici via la Plateforme Agréée. Tu n'agis qu'en cas de problème.",
  },
  {
    target: "declarations",
    title: "Déclarations au fisc",
    body: "L'état de tes déclarations. Seuls les refus demandent une action de ta part.",
  },
  {
    target: "achats-internationaux",
    title: "Achats à l'étranger",
    body: "Un achat auprès d'un fournisseur hors de France se déclare ici : sa facture ne passe pas par la Plateforme.",
  },
  {
    target: "paiements",
    title: "Paiements clients · à configurer en priorité",
    body: "Comment tes clients te paient (lien ou IBAN). Sans ça, la facturation est bloquée.",
  },
  {
    target: "crm",
    title: "Tes clients & leur historique",
    body: "Tous tes clients, avec leurs devis, factures et coordonnées, au même endroit.",
  },
  {
    target: "stats",
    title: "Activité & exports comptables",
    body: "Ton activité en graphiques, et les exports pour ton comptable (FEC, CSV).",
  },
  {
    target: "catalogue",
    title: "✦ Pro : Catalogue & IA",
    body: "Enregistre tes prestations : l'IA s'appuie dessus pour des devis plus justes.",
    pro: true,
  },
  {
    target: "team",
    title: "✦ Pro : Équipe & collaboration",
    body: "Invite ton équipe, partage des modèles, et valide les devis avant envoi.",
    pro: true,
  },
  {
    target: "profil",
    title: "Paramètres & personnalisation",
    body: "Tes informations pro (logo, SIRET, TVA) sur tous tes documents.",
  },
];

// Tour simplifié, membres invités (sans paiements, crm, stats, profil)
const STEPS_MEMBER = [
  {
    target: "dashboard",
    title: "Ton tableau de bord",
    body: "Tes devis en attente, tes factures récentes et ton taux de conversion. Tout ce qui s'affiche ici est à toi.",
  },
  {
    target: "proposals",
    title: "Devis générés par IA",
    body: "Décris ta mission, l'IA génère le devis. Ton client signe depuis un lien. Selon les réglages, un manager valide avant envoi.",
  },
  {
    target: "invoices",
    title: "Factures Factur-X conformes 2026",
    body: "Convertis un devis signé en facture conforme, en un clic.",
  },
  {
    target: "catalogue",
    title: "✦ Catalogue partagé",
    body: "Les prestations de l'équipe, à insérer en un clic dans un devis ou une facture.",
    pro: true,
  },
  {
    target: "team",
    title: "✦ Vue équipe",
    body: "Les membres, les modèles partagés, et le suivi de l'activité collective.",
    pro: true,
  },
];

export function ProductTour({ isMember = false }: { isMember?: boolean }) {
  const STEPS = isMember ? STEPS_MEMBER : STEPS_OWNER;
  const storageKey = isMember ? TOUR_KEY_MEMBER : TOUR_KEY;

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipTop, setTooltipTop] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (window.innerWidth < 1024) return; // sidebar hidden on mobile
    // Démo : forcer le reset si tour_reset=1 (comptes demo isolés)
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour_reset") === "1") {
      localStorage.removeItem(storageKey);
    }
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setTimeout(() => setActive(true), 400);
    }
  }, [storageKey]);

  // `null` = aucune cible visible (téléphone) → carte centrée, sans flèche.
  const [ancre, setAncre] = useState<"laterale" | null>("laterale");

  const updatePosition = useCallback((stepIndex: number) => {
    const el = document.querySelector(`[data-tour="${STEPS[stepIndex].target}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();

    // La visite pointe les entrées de la barre latérale, masquée sous 1024 px.
    // L'élément reste dans le DOM mais sans dimensions : le calcul renvoyait
    // zéro, et la bulle comme l'encadré atterrissaient collés en haut à gauche,
    // la carte débordant de l'écran puisqu'elle est calée à `left: 264`, la
    // largeur de la barre latérale. Constaté par Selim sur téléphone.
    //
    // Rien à désigner du doigt sur un téléphone : on centre la carte et on
    // masque l'encadré et la flèche, qui pointeraient vers du vide.
    const cibleInvisible = rect.width === 0 && rect.height === 0;
    setAncre(cibleInvisible ? null : "laterale");
    if (cibleInvisible) {
      setHighlightStyle({ display: "none" });
      return;
    }
    // Clamper pour que le tooltip ne déborde pas en haut (hauteur estimée de la carte ≈220px)
    const CARD_HALF = 120;
    const MIN_TOP = CARD_HALF + 12;
    const MAX_TOP = window.innerHeight - CARD_HALF - 12;
    const centerY = rect.top + rect.height / 2;
    setTooltipTop(Math.min(Math.max(centerY, MIN_TOP), MAX_TOP));
    setHighlightStyle({
      top: rect.top - 3,
      left: 8,
      width: rect.width + 8,
      height: rect.height + 6,
    });
  }, []);

  useEffect(() => {
    if (active) updatePosition(step);
  }, [active, step, updatePosition]);

  function dismiss() {
    setActive(false);
    localStorage.setItem(storageKey, "1");
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!active) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <>
      {/* Highlight ring on target nav item */}
      <div
        className="fixed z-40 pointer-events-none rounded-xl transition-all duration-300"
        style={{
          ...highlightStyle,
          border: "2px solid rgba(99,102,241,0.7)",
          boxShadow: "0 0 0 4px rgba(99,102,241,0.12)",
        }}
      />

      {/* Tooltip card */}
      <div
        className={
          ancre
            ? "fixed z-50 flex items-center pointer-events-none transition-all duration-300"
            : "fixed z-50 inset-x-4 bottom-6 flex justify-center pointer-events-none"
        }
        style={
          ancre
            ? { left: 264, top: tooltipTop, transform: "translateY(-50%)" }
            : undefined
        }
      >
        {/* Arrow pointing left toward sidebar */}
        {ancre && <div
          className="shrink-0"
          style={{
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid #1F2937",
          }}
        />}

        {/* Card, dark theme matching Deviso */}
        <div className={`pointer-events-auto bg-ds-elevated border border-ds-border rounded-xl shadow-2xl p-5 ${ancre ? "min-w-[260px] max-w-[340px]" : "w-full max-w-[420px]"}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-sm leading-snug">{current.title}</h3>
              {(current as { pro?: boolean }).pro && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">PRO</span>
              )}
            </div>
            <button
              onClick={dismiss}
              className="text-gray-500 hover:text-gray-300 shrink-0 transition-colors mt-0.5"
            >
              <X size={13} />
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mb-4">{current.body}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{step + 1} / {STEPS.length}</span>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-ds-border hover:border-gray-500 transition-colors font-medium"
                >
                  Précédent
                </button>
              )}
              <button
                onClick={next}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {isLast ? "C'est tout vu ✓" : "Suivant →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
