"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const TOUR_KEY = "deviso_tour_v5";
const TOUR_KEY_MEMBER = "deviso_tour_member_v1";

// Tour complet, propriétaires
const STEPS_OWNER = [
  {
    target: "dashboard",
    title: "Ton tableau de bord",
    body: "Ta page de départ chaque matin. Tu vois en un coup d'œil ton CA encaissé ce mois, les devis en attente de réponse, ton taux de conversion, et toutes les alertes actives : factures impayées, relances en retard, approbations en attente. Le widget URSSAF te donne ton CA trimestriel et annuel, prêt à reporter dans ta déclaration.",
  },
  {
    target: "proposals",
    title: "Devis professionnels générés par IA",
    body: "Décris ta mission en quelques mots, l'IA génère un devis structuré en quelques secondes. Ton client reçoit un lien sécurisé et signe directement depuis son téléphone, sans compte, sans friction. Tu peux aussi partir d'un modèle sauvegardé pour tes prestations récurrentes. En Solo+, les relances automatiques relancent les clients sans réponse. En Pro : validation manager avant envoi, signature électronique avancée certifiée, et zéro branding Deviso sur les documents.",
  },
  {
    target: "invoices",
    title: "Factures Factur-X conformes 2026",
    body: "Convertis un devis signé en facture en un clic. Deviso génère un PDF/A-3 Factur-X BASIC, la norme obligatoire en France à partir de 2026. Tu peux créer des factures d'acompte (ex. 30 % à la commande) et de solde liées entre elles, avec numérotation automatique. En Pro, programme des factures récurrentes pour tes abonnements et contrats mensuels. Pour les marchés publics, dépose ta facture directement sur Chorus Pro en un clic depuis la facture.",
  },
  {
    target: "paiements",
    title: "💳 Paiements clients · à configurer en priorité",
    body: "Indique ici comment tes clients te paient. Choisis un lien de paiement en ligne (Stripe, PayPal, Wise, SumUp, Lydia…) ou ton IBAN/BIC pour les virements, ou les deux. Ces informations s'affichent automatiquement sur chaque facture PDF et dans les emails envoyés à tes clients. Sans configuration, la création de facture est bloquée. Deviso ne prend aucune commission et ne touche jamais l'argent de tes clients.",
  },
  {
    target: "crm",
    title: "Tes clients & leur historique",
    body: "Tous tes clients en un seul endroit : devis envoyés, factures émises, montant total facturé, coordonnées complètes. Suis ton chiffre d'affaires mois par mois, identifie tes clients les plus actifs, et retrouve en quelques secondes n'importe quelle transaction passée. Plus besoin de jongler entre un tableur et ta boîte mail.",
  },
  {
    target: "stats",
    title: "Activité & exports comptables",
    body: "Visualise l'évolution de ton CA, ton taux de conversion devis → facture signé, et tes périodes les plus productives. Tu peux exporter un fichier FEC (Fichier des Écritures Comptables) conforme pour ton expert-comptable, un CSV complet de toutes tes factures, ou un récapitulatif mensuel. En Pro, accède aux analytics détaillées par client et par période.",
  },
  {
    target: "catalogue",
    title: "✦ Pro : Catalogue & IA, le duo gagnant",
    body: "Plus ton catalogue est complet, plus la génération IA est précise. Quand tu décris une mission, l'IA pioche dans tes propres prestations, tes tarifs exacts, tes formulations, ta cohérence. Sans catalogue, elle improvise. Deux types : forfaits à prix fixe et taux horaires au quart d'heure. Un clic dans l'éditeur de devis ou de facture insère la prestation avec sa description et son prix. Les durées s'affichent lisiblement sur les PDFs (« 2h15 »).",
    pro: true,
  },
  {
    target: "team",
    title: "✦ Pro : Équipe & collaboration",
    body: "Invite jusqu'à 3 collaborateurs inclus, puis 5 €/mois par utilisateur supplémentaire. Chaque membre a son propre profil qui apparaît sur ses devis. Sauvegarde des modèles de devis partagés avec toute l'équipe. Active la validation obligatoire : aucun devis ne part au client sans l'approbation du manager. Un pipeline de suivi donne une vue d'ensemble sur l'activité de l'équipe.",
    pro: true,
  },
  {
    target: "profil",
    title: "Paramètres & personnalisation",
    body: "Configure tout ce qui apparaît sur tes documents : logo, nom commercial, adresse, SIRET, numéro de TVA et régime fiscal. En Pro, choisis une couleur d'accent qui s'applique à tous tes devis et factures PDF, et connecte ton propre domaine d'envoi pour que tes emails partent depuis devis@tonentreprise.fr. Pour la facturation des marchés publics, renseigne tes identifiants Chorus Pro ici.",
  },
];

// Tour simplifié, membres invités (sans paiements, crm, stats, profil)
const STEPS_MEMBER = [
  {
    target: "dashboard",
    title: "Ton tableau de bord",
    body: "Ta page de départ. Tu vois en un coup d'œil tes devis en attente de réponse, tes factures récentes, et ton taux de conversion personnel. Toutes les données affichées ici sont les tiennes, tes devis, tes factures.",
  },
  {
    target: "proposals",
    title: "Devis générés par IA",
    body: "Décris ta mission en quelques mots, l'IA génère un devis structuré en quelques secondes. Ton client reçoit un lien sécurisé et signe depuis son téléphone. Si la validation manager est activée, ton devis est soumis pour approbation avant d'être envoyé au client. Tu peux aussi partir d'un modèle partagé par l'équipe.",
  },
  {
    target: "invoices",
    title: "Factures Factur-X conformes 2026",
    body: "Convertis un devis signé en facture en un clic. Deviso génère un PDF/A-3 Factur-X BASIC, la norme obligatoire en France à partir de 2026. Tu peux créer des factures d'acompte et de solde liées entre elles, avec numérotation automatique.",
  },
  {
    target: "catalogue",
    title: "✦ Catalogue partagé & suivi du temps",
    body: "Retrouve ici les prestations de l'équipe : forfaits à prix fixe et taux horaires. Lors de la création d'un devis ou d'une facture, pioche dans le catalogue en un clic, description, tarif et durée pré-remplis. Les heures s'affichent lisiblement sur les PDFs (« 2h15 »).",
    pro: true,
  },
  {
    target: "team",
    title: "✦ Vue équipe",
    body: "Consulte les membres de l'équipe, les modèles de devis partagés, et le pipeline de suivi de l'activité collective. Tu peux aussi mettre à jour ton profil personnel (nom, email, téléphone), ces informations apparaissent sur les devis que tu crées.",
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

  const updatePosition = useCallback((stepIndex: number) => {
    const el = document.querySelector(`[data-tour="${STEPS[stepIndex].target}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
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
        className="fixed z-50 flex items-center pointer-events-none transition-all duration-300"
        style={{
          left: 264,
          top: tooltipTop,
          transform: "translateY(-50%)",
        }}
      >
        {/* Arrow pointing left toward sidebar */}
        <div
          className="shrink-0"
          style={{
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid #1F2937",
          }}
        />

        {/* Card, dark theme matching Deviso */}
        <div className="pointer-events-auto bg-ds-elevated border border-ds-border rounded-xl shadow-2xl p-5 min-w-[260px] max-w-[340px]">
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
