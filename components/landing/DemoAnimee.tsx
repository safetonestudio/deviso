"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles } from "lucide-react";

/**
 * La démonstration du haut de page : un brief s'écrit, le devis se rédige
 * ligne par ligne, le client signe. Trois métiers tournent en boucle ; le
 * visiteur peut en choisir un. Construite en HTML (nette à toute taille),
 * site public uniquement.
 *
 * Contenu d'exemple : missions, clients et montants inventés pour la
 * démonstration, totaux exacts.
 *
 * Sans JavaScript ou avec « réduire les animations », le devis terminé du
 * premier métier reste affiché, immobile.
 */
const EXEMPLES = [
  {
    metier: "Graphiste",
    brief: "Identité visuelle pour une boulangerie artisanale à Nantes : logo, palette, carte de visite et enseigne. Livraison sous trois semaines.",
    client: "Boulangerie Le Fournil, Nantes",
    numero: "DEV-2026-047",
    lignes: [
      ["Atelier de cadrage et recherches", 450],
      ["Logo, trois pistes puis finalisation", 1200],
      ["Palette et typographies", 350],
      ["Carte de visite et enseigne", 600],
    ],
  },
  {
    metier: "Développeur web",
    brief: "Refonte du site vitrine d'un cabinet d'avocats à Lyon : cinq pages, formulaire de contact, mise en ligne. Délai de trois semaines.",
    client: "Cabinet Durand et Associés, Lyon",
    numero: "DEV-2026-048",
    lignes: [
      ["Audit et arborescence", 500],
      ["Maquettes des cinq pages", 1400],
      ["Intégration et adaptation mobile", 1800],
      ["Formulaire de contact et RGPD", 800],
    ],
  },
  {
    metier: "Coach",
    brief: "Accompagnement d'une équipe de huit commerciaux : diagnostic, deux journées d'atelier, suivi individuel sur un mois.",
    client: "Maison Verdier, Bordeaux",
    numero: "DEV-2026-049",
    lignes: [
      ["Entretiens de diagnostic", 600],
      ["Deux journées d'atelier", 2400],
      ["Suivi individuel, huit séances", 1200],
      ["Synthèse et plan d'action", 300],
    ],
  },
] as const;

const euros = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} €`;

/** Étapes : 0 le brief s'écrit, 1 rédaction, 2 les lignes arrivent, 3 envoyé, 4 signé. */
type Etape = 0 | 1 | 2 | 3 | 4;

export function DemoAnimee() {
  const [choix, setChoix] = useState(0);
  // État initial = devis terminé : c'est ce que voient un visiteur sans
  // JavaScript et le moteur de recherche. L'animation démarre au montage.
  const [etape, setEtape] = useState<Etape>(4);
  const [lettres, setLettres] = useState<number>(EXEMPLES[0].brief.length);
  const [nbLignes, setNbLignes] = useState<number>(EXEMPLES[0].lignes.length);
  const [anime, setAnime] = useState(false);
  const boucle = useRef(true);

  const ex = EXEMPLES[choix];
  const total = ex.lignes.reduce((s, [, m]) => s + m, 0);

  // Démarrage : seulement si le visiteur n'a pas demandé moins d'animations.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => {
      setAnime(true);
      setLettres(0);
      setNbLignes(0);
      setEtape(0);
    }, 3500);
    return () => window.clearTimeout(t);
  }, []);

  // La séquence, une étape à la fois.
  useEffect(() => {
    if (!anime) return;
    let t: number;
    if (etape === 0) {
      if (lettres < ex.brief.length) t = window.setTimeout(() => setLettres((n) => Math.min(ex.brief.length, n + 2)), 26);
      else t = window.setTimeout(() => setEtape(1), 500);
    } else if (etape === 1) {
      t = window.setTimeout(() => setEtape(2), 1100);
    } else if (etape === 2) {
      if (nbLignes < ex.lignes.length) t = window.setTimeout(() => setNbLignes((n) => n + 1), 420);
      else t = window.setTimeout(() => setEtape(3), 900);
    } else if (etape === 3) {
      t = window.setTimeout(() => setEtape(4), 1300);
    } else {
      t = window.setTimeout(() => {
        if (!boucle.current) return;
        setChoix((c) => (c + 1) % EXEMPLES.length);
        setLettres(0);
        setNbLignes(0);
        setEtape(0);
      }, 3600);
    }
    return () => window.clearTimeout(t);
  }, [anime, etape, lettres, nbLignes, ex]);

  function choisir(i: number) {
    setChoix(i);
    if (!anime) {
      // Animations réduites : on montre directement le devis terminé.
      setLettres(EXEMPLES[i].brief.length);
      setNbLignes(EXEMPLES[i].lignes.length);
      setEtape(4);
      return;
    }
    setLettres(0);
    setNbLignes(0);
    setEtape(0);
  }

  const statut =
    etape >= 4
      ? { texte: "Signé", classe: "bg-indigo-600 text-on-accent" }
      : etape === 3
        ? { texte: "Envoyé", classe: "bg-indigo-500/15 text-indigo-400" }
        : { texte: "Brouillon", classe: "bg-ds-elevated text-gray-300" };

  return (
    <div data-ui className="rounded-lg bg-ds-surface overflow-hidden grid lg:grid-cols-[5fr_7fr]">
      {/* ── Le brief ── */}
      <div className="p-6 sm:p-8 lg:p-10 bg-ds-elevated flex flex-col">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir un métier pour la démonstration">
          {EXEMPLES.map((e, i) => (
            <button
              key={e.metier}
              type="button"
              onClick={() => choisir(i)}
              aria-pressed={i === choix}
              className={`h-10 px-4 rounded-md text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                i === choix ? "bg-ink text-(color:--ds-bg)" : "bg-ds-surface text-gray-300 hover:text-ink"
              }`}
            >
              {e.metier}
            </button>
          ))}
        </div>

        <div className="mt-6 text-[14px] font-medium text-gray-400">Décris ton projet</div>
        <div className="mt-2 rounded-md bg-ds-surface p-4 sm:p-5 min-h-[168px] sm:min-h-[150px] text-[17px] leading-relaxed text-ink" aria-live="off">
          {ex.brief.slice(0, lettres)}
          {anime && etape === 0 && <span className="curseur-demo" aria-hidden="true" />}
        </div>

        <div
          className={`mt-4 h-12 rounded-md flex items-center justify-center gap-2 text-[17px] font-semibold transition-colors ${
            etape === 0 ? "bg-indigo-600/40 text-on-accent" : "bg-indigo-600 text-on-accent"
          }`}
          aria-hidden="true"
        >
          <Sparkles size={16} />
          {etape === 1 ? "Rédaction en cours…" : "Générer le devis"}
        </div>
        <div className="mt-3 h-1 rounded-full bg-ds-surface overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-indigo-500 transition-[width] ease-out"
            style={{ width: etape === 0 ? "0%" : "100%", transitionDuration: etape === 1 ? "1000ms" : "0ms" }}
          />
        </div>
        <p className="mt-auto pt-6 text-[14px] text-gray-400">Exemple de démonstration. Dans Deviso, tu relis et tu ajustes avant d&apos;envoyer.</p>
      </div>

      {/* ── Le devis ── */}
      <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Devis {ex.numero}</div>
            <div className="text-[14px] text-gray-400 mt-0.5 break-words">{ex.client}</div>
          </div>
          <span className={`shrink-0 text-[14px] font-semibold px-3 py-1 rounded-full transition-colors ${statut.classe}`}>{statut.texte}</span>
        </div>

        <div className="relative mt-6 min-h-[212px]">
          {etape <= 1 && nbLignes === 0 && (
            <div className="absolute inset-0 top-10 grid place-items-center text-center" aria-hidden="true">
              <p className="text-[17px] text-gray-400">
                {etape === 0 ? "Le devis se rédige dès que tu cliques sur Générer." : "Rédaction des lignes, des prix et des conditions…"}
              </p>
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-x-4 pb-2 border-b border-ds-border text-[14px] font-medium text-gray-400">
            <span>Prestation</span>
            <span>Montant HT</span>
          </div>
          {ex.lignes.map(([libelle, montant], i) => (
            <div
              key={libelle}
              className={`grid grid-cols-[1fr_auto] gap-x-4 py-3 border-b border-ds-border text-[17px] transition-all duration-500 ${
                i < nbLignes ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <span className="text-ink">{libelle}</span>
              <span className="font-semibold tabular-nums text-ink whitespace-nowrap">{euros(montant)}</span>
            </div>
          ))}
        </div>

        <div className={`mt-4 flex items-end justify-between gap-4 transition-opacity duration-500 ${nbLignes >= ex.lignes.length ? "opacity-100" : "opacity-0"}`}>
          <div>
            <div className="text-[17px] font-semibold text-ink">Total hors taxes</div>
            <div className="text-[14px] text-gray-400">TVA non applicable, article 293 B du CGI</div>
          </div>
          <div className="text-[clamp(32px,2.8vw,44px)] leading-none font-semibold tracking-[-0.03em] tabular-nums text-ink whitespace-nowrap">{euros(total)}</div>
        </div>

        <div className={`mt-6 rounded-md px-4 py-3.5 flex items-center gap-3 transition-all duration-500 ${etape >= 4 ? "opacity-100 translate-y-0 bg-indigo-500/15" : "opacity-0 translate-y-2"}`}>
          <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-on-accent grid place-items-center" aria-hidden="true">
            <Check size={15} strokeWidth={3} />
          </span>
          <span className="text-[17px] text-ink">
            <strong className="font-semibold">Signé par le client</strong> depuis son téléphone. Tu es notifié à l&apos;instant.
          </span>
        </div>
      </div>
    </div>
  );
}
