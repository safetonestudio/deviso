"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ApercuChiffres, ApercuEtat, DocumentDevis, FeuilleChiffres, type EtatDocument } from "@/components/landing/DocumentDevis";

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
  { titre: "Ton devis, rédigé et chiffré pour toi.", texte: "Tu décris la mission en une phrase ; l'IA la chiffre à partir de ton catalogue, avec la TVA et les mentions obligatoires. Tu relis, tu ajustes, tu envoies.", vue: "devis" },
  { titre: "Ton client signe en ligne.", texte: "Il reçoit un lien, ouvre le devis sur son téléphone et signe. Tu es prévenu à l'instant.", vue: "signe" },
  { titre: "Un clic, et c'est une facture.", texte: "Le devis signé devient une facture électronique officielle, transmise pour toi.", vue: "facture" },
  { titre: "Deviso relance, tu encaisses.", texte: "Facture impayée à l'échéance ? Deviso relance ton client 3, 7 ou 14 jours après, comme tu l'as choisi. Le virement arrivé, tu marques la facture payée en un clic.", vue: "paye" },
  { titre: "Tes chiffres pour déclarer, déjà calculés.", texte: "Chiffre d'affaires, TVA collectée, échéances : tout est calculé à partir de tes encaissements, selon ton statut.", vue: "urssaf" },
];

const LIGNES_BRIEF: [string, string][] = [
  ["Audit et arborescence", "500,00\u00a0€"],
  ["Maquettes des cinq pages", "1 400,00\u00a0€"],
  ["Intégration et adaptation mobile", "1 800,00\u00a0€"],
  ["Formulaire de contact et RGPD", "800,00\u00a0€"],
];

const BRIEF = "Refonte du site vitrine d'un cabinet d'avocats à Lyon : cinq pages, formulaire de contact, mise en ligne. Délai de trois semaines.";

/** Le brief, qui s'écrit une fois au chargement (immobile si animations réduites). */
function Brief({ plein = false }: { plein?: boolean }) {
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
    <div data-ui className="rounded-xl bg-ds-surface p-6 sm:p-8 lg:p-9">
      <div className="text-[14px] font-medium text-gray-400">Décris ta mission</div>
      <p className={`mt-3 min-h-[9.5em] sm:min-h-[8em] rounded-lg bg-ds-elevated p-5 text-[17px] sm:text-[20px] leading-relaxed text-ink`}>
        {BRIEF.slice(0, n)}
        {!ecrit && <span className="curseur-demo" aria-hidden="true" />}
      </p>
      {plein && (
        <ul className="mt-5 space-y-2.5 text-[15px] tabular-nums" aria-label="Lignes proposées par Deviso">
          {LIGNES_BRIEF.map(([l, m], k) => (
            <li
              key={l}
              className="flex justify-between gap-4 border-b border-ds-border pb-2.5 transition-[opacity,transform] duration-500"
              style={{ opacity: ecrit ? 1 : 0.14, transitionDelay: ecrit ? `${150 + k * 180}ms` : "0ms" }}
            >
              <span className="text-gray-300">{l}</span>
              <span className="text-ink">{m}</span>
            </li>
          ))}
          <li
            className="flex justify-between gap-4 text-gray-400 transition-opacity duration-500"
            style={{ opacity: ecrit ? 1 : 0.14, transitionDelay: ecrit ? "800ms" : "0ms" }}
          >
            <span>Total HT + TVA 20{"\u00a0"}%</span>
            <span className="whitespace-nowrap">4 500,00{"\u00a0"}€ + 900,00{"\u00a0"}€</span>
          </li>
          <li
            className="flex justify-between gap-4 pt-1 font-semibold transition-opacity duration-500"
            style={{ opacity: ecrit ? 1 : 0.14, transitionDelay: ecrit ? "900ms" : "0ms" }}
          >
            <span className="text-ink">Total TTC</span>
            <span className="text-ink whitespace-nowrap">5 400,00{"\u00a0"}€</span>
          </li>
        </ul>
      )}
      <button
        type="button"
        onClick={() => document.querySelector('[data-i="1"]')?.scrollIntoView({ behavior: "smooth", block: "center" })}
        className={`mt-4 w-full h-12 rounded-lg grid place-items-center text-[17px] font-semibold transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${ecrit ? "bg-indigo-600 hover:bg-indigo-700 text-on-accent" : "bg-ds-elevated text-gray-500"}`}
      >
        Générer le devis
      </button>
    </div>
  );
}

function Visuel({ vue }: { vue: Vue }) {
  if (vue === "brief") return <Brief />;
  if (vue === "urssaf") return <ApercuChiffres />;
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
    blocs.current.forEach((el) => {
      if (!el) return;
      const cible = el.querySelector<HTMLElement>("[data-cible]") ?? el;
      cible.dataset.i = el.dataset.i;
      obs.observe(cible);
    });
    return () => obs.disconnect();
  }, []);

  // 0 = le haut de page (brief) ; 1 à 5 = les étapes.
  const vue: Vue = actif === 0 ? "brief" : ETAPES[actif - 1].vue;
  const enregistrer = (i: number) => (el: HTMLLIElement | null) => {
    blocs.current[i] = el;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-16">
      <h2 className="sr-only">Comment ça marche</h2>
      <ol className="lg:col-span-5 lg:pb-[42vh]">
        {/* Le haut de page : la promesse, et sur téléphone le brief dessous. */}
        <li ref={enregistrer(0)} data-i={0} className="pt-12 pb-16 sm:pt-16 lg:py-0 lg:min-h-(--haut-ecran) flex flex-col justify-center" style={{ ["--haut-ecran" as string]: "calc(100vh / var(--zoom, 1) - 80px)" }}>
          <div data-cible className="relative z-10 xl:w-[122%]">{intro}</div>
          <div className="mt-10 lg:hidden">
            <Brief />
          </div>
        </li>

        {ETAPES.map((e, k) => {
          const i = k + 1;
          return (
            <li key={e.titre} id={i === 1 ? "etapes" : undefined} ref={enregistrer(i)} data-i={i} className="scroll-mt-40 py-10 lg:py-0 lg:min-h-(--haut-etape) flex flex-col justify-center" style={{ ["--haut-etape" as string]: "calc(64vh / var(--zoom, 1))" }}>
              <div data-cible className={`transition-opacity duration-500 ${i === actif ? "lg:opacity-100" : "lg:opacity-35"}`}>
                <div className="mb-3 text-[14px] font-medium text-gray-500 tabular-nums">Étape {i} sur {ETAPES.length}</div>
                <h3 className="text-[clamp(24px,2vw,30px)] leading-[1.15] font-semibold tracking-[-0.025em] text-ink">{e.titre}</h3>
                <p className="mt-4 text-[17px] sm:text-[20px] leading-relaxed text-gray-300 max-w-[42ch]">{e.texte}</p>
              </div>
              {/* Téléphone : chaque étape montre ce qui change. Le devis entier
                  une fois ; ensuite, le bas du document (signature, facture,
                  tampon), puis la carte des déclarations. */}
              <div className="mt-8 lg:hidden">
                {e.vue === "urssaf" ? <Visuel vue={e.vue} /> : <ApercuEtat etat={e.vue as EtatDocument} />}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Ordinateur : le visuel, fixe, qui change à chaque étape. Les hauteurs
          sont divisées par l'agrandissement des grands écrans (--zoom). */}
      <div className="hidden lg:block lg:col-span-7">
        <div className="sticky top-[88px] flex items-center justify-end" style={{ height: "calc(100vh / var(--zoom, 1) - 112px)" }}>
          <div className="relative w-full" style={{ maxWidth: "calc((100vh / var(--zoom, 1) - 150px) * 0.74)" }}>
            <div aria-hidden={vue === "brief"} className={`transition-[opacity,visibility,transform] duration-500 ${vue === "brief" ? "opacity-0 invisible" : "opacity-100 visible"}`}>
              {vue === "urssaf" ? <FeuilleChiffres /> : <DocumentDevis etat={vue === "brief" ? "devis" : vue} />}
            </div>
            <div aria-hidden={vue !== "brief"} className={`absolute inset-0 flex items-center transition-[opacity,visibility] duration-500 ${vue === "brief" ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}>
              <div className="w-full">
                <Brief plein />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
