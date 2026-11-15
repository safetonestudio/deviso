"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DocumentDevis, type EtatDocument } from "@/components/landing/DocumentDevis";

/**
 * Le haut de page et le parcours d'un devis, en une seule histoire.
 *
 * Premier écran : la promesse à gauche (passée en `intro`), et à droite le
 * brief qui s'écrit. En faisant défiler, le même emplacement montre le devis
 * rédigé, signé, devenu facture, payé, puis le chiffre d'affaires à déclarer.
 * Sur ordinateur, le visuel reste fixe à droite ; sur téléphone, les étapes
 * clés montrent leur visuel sous leur texte.
 */
type Vue = "brief" | EtatDocument | "urssaf";
type Etape = { titre: string; texte: string; vue: Vue };

const ETAPES: Etape[] = [
  { titre: "Le devis est rédigé, au centime près.", texte: "Lignes, quantités, prix, TVA et mentions obligatoires : tout est rédigé à partir de ton catalogue. Tu relis, tu ajustes, tu envoies.", vue: "devis" },
  { titre: "Ton client signe en ligne.", texte: "Il reçoit un lien, ouvre le devis sur son téléphone et signe. Tu es prévenu à l'instant.", vue: "signe" },
  { titre: "Un clic, et c'est une facture.", texte: "Le devis signé devient une facture Factur-X conforme, transmise par une plateforme agréée.", vue: "facture" },
  { titre: "Deviso relance, tu encaisses.", texte: "Sans réponse, ton client est relancé à 3, 7 ou 14 jours. Le paiement reçu, la facture passe en payée.", vue: "paye" },
  { titre: "Tes déclarations sont prêtes.", texte: "Chiffre d'affaires, TVA collectée, échéances : tout est calculé à partir de tes encaissements, selon ton statut.", vue: "urssaf" },
];

const BRIEF = "Refonte du site vitrine d'un cabinet d'avocats à Lyon : cinq pages, formulaire de contact, mise en ligne. Délai de trois semaines.";

/** Le brief, qui s'écrit une fois au chargement (immobile si animations réduites). */
function Brief() {
  const [n, setN] = useState(BRIEF.length);
  const [ecrit, setEcrit] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    setEcrit(false);
    let i = 0;
    let t: number;
    const pas = () => {
      i = Math.min(BRIEF.length, i + 2);
      setN(i);
      if (i < BRIEF.length) t = window.setTimeout(pas, 28);
      else setEcrit(true);
    };
    t = window.setTimeout(pas, 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div data-ui className="rounded-[10px] bg-ds-surface p-6 sm:p-8">
      <div className="text-[14px] font-medium text-gray-400">Décris ton projet</div>
      <p className="mt-3 min-h-[9.5em] sm:min-h-[8em] rounded-md bg-ds-elevated p-5 text-[17px] sm:text-[20px] leading-relaxed text-ink">
        {BRIEF.slice(0, n)}
        {!ecrit && <span className="curseur-demo" aria-hidden="true" />}
      </p>
      <div className={`mt-4 h-12 rounded-md grid place-items-center text-[17px] font-semibold transition-colors duration-500 ${ecrit ? "bg-indigo-600 text-on-accent" : "bg-indigo-600/35 text-on-accent"}`}>
        Générer le devis
      </div>
      <p className="mt-4 text-[14px] text-gray-400">Fais défiler : voici ce que Deviso en fait.</p>
    </div>
  );
}

/** Les déclarations : chiffre d'affaires, TVA et échéance, quel que soit le statut. */
function Declarations() {
  return (
    <div data-ui className="rounded-[10px] bg-ds-surface p-6 sm:p-8">
      <div className="text-[14px] font-medium text-gray-400">Chiffre d&apos;affaires encaissé, 4e trimestre, hors taxes</div>
      <div className="mt-2 text-[clamp(40px,5vw,64px)] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">6 200 €</div>
      <div className="mt-6 grid grid-cols-2 gap-2 text-[14px]">
        <div className="rounded-md bg-blue-500/15 p-4">
          <div className="text-blue-300">TVA collectée</div>
          <div className="mt-1 text-[20px] font-semibold tabular-nums text-ink">1 240 €</div>
        </div>
        <div className="rounded-md bg-amber-500/15 p-4">
          <div className="text-amber-300">Déclaration de TVA</div>
          <div className="mt-1 text-[20px] font-semibold text-ink">En janvier</div>
        </div>
      </div>
      <p className="mt-5 text-[14px] leading-relaxed text-gray-400">
        Entreprise individuelle ou société, au réel ou en micro : les échéances et les montants suivent ton statut.
      </p>
    </div>
  );
}

function Visuel({ vue }: { vue: Vue }) {
  if (vue === "brief") return <Brief />;
  if (vue === "urssaf") return <Declarations />;
  return <DocumentDevis etat={vue} />;
}

export function ParcoursDocument({ intro }: { intro: ReactNode }) {
  const [actif, setActif] = useState(0);
  const blocs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) setActif(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    blocs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // 0 = le haut de page (brief) ; 1 à 5 = les étapes.
  const vue: Vue = actif === 0 ? "brief" : ETAPES[actif - 1].vue;
  const enregistrer = (i: number) => (el: HTMLLIElement | null) => {
    blocs.current[i] = el;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-16">
      <ol className="lg:col-span-5">
        {/* Le haut de page : la promesse, et sur téléphone le brief dessous. */}
        <li ref={enregistrer(0)} data-i={0} className="pt-12 pb-16 sm:pt-16 lg:py-0 lg:min-h-(--haut-ecran) flex flex-col justify-center" style={{ ["--haut-ecran" as string]: "calc(100vh / var(--zoom, 1) - 72px)" }}>
          {intro}
          <div className="mt-10 lg:hidden">
            <Brief />
          </div>
        </li>

        {ETAPES.map((e, k) => {
          const i = k + 1;
          return (
            <li key={e.titre} ref={enregistrer(i)} data-i={i} className="py-10 lg:py-0 lg:min-h-(--haut-etape) flex flex-col justify-center" style={{ ["--haut-etape" as string]: "calc(64vh / var(--zoom, 1))" }}>
              <div className={`transition-opacity duration-500 ${i === actif ? "lg:opacity-100" : "lg:opacity-35"}`}>
                <h3 className="text-[clamp(26px,2.4vw,36px)] leading-[1.12] font-semibold tracking-[-0.03em] text-ink">{e.titre}</h3>
                <p className="mt-4 text-[17px] sm:text-[20px] leading-relaxed text-gray-300 max-w-[42ch]">{e.texte}</p>
              </div>
              {/* Téléphone : le visuel des étapes clés seulement. */}
              {e.vue !== "signe" && e.vue !== "facture" && (
                <div className="mt-8 lg:hidden">
                  <Visuel vue={e.vue} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Ordinateur : le visuel, fixe, qui change à chaque étape. Les hauteurs
          sont divisées par l'agrandissement des grands écrans (--zoom). */}
      <div className="hidden lg:block lg:col-span-7">
        <div className="sticky top-[88px] flex items-center justify-center" style={{ height: "calc(100vh / var(--zoom, 1) - 112px)" }}>
          <div className="relative w-full" style={{ maxWidth: "calc((100vh / var(--zoom, 1) - 150px) * 0.74)" }}>
            <div aria-hidden={vue === "brief" || vue === "urssaf"} className={`transition-[opacity,visibility] duration-500 ${vue === "brief" || vue === "urssaf" ? "opacity-0 invisible" : "opacity-100 visible"}`}>
              <DocumentDevis etat={vue === "brief" ? "devis" : vue === "urssaf" ? "paye" : vue} />
            </div>
            <div aria-hidden={vue !== "brief"} className={`absolute inset-0 flex items-center transition-[opacity,visibility] duration-500 ${vue === "brief" ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}>
              <div className="w-full">
                <Brief />
              </div>
            </div>
            <div aria-hidden={vue !== "urssaf"} className={`absolute inset-0 flex items-center transition-[opacity,visibility] duration-500 ${vue === "urssaf" ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}>
              <div className="w-full">
                <Declarations />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
