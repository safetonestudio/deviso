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

const BRIEF = "Refonte du site vitrine d'un cabinet d'avocats à Lyon\u00a0: cinq pages, formulaire de contact, mise en ligne. Délai de trois semaines.";

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
        onClick={() => document.getElementById("etapes")?.scrollIntoView({ behavior: "smooth", block: "start" })}
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

/** Hauteur du panneau fixe (texte à gauche, visuel à droite) et défilement par étape. */
const HAUT_PANNEAU = "calc(100vh / var(--zoom, 1) - 112px)";
const PAS_ETAPE = "calc(64vh / var(--zoom, 1))";

function TexteEtape({ e, i }: { e: Etape; i: number }) {
  return (
    <>
      <div className="mb-3 text-[14px] font-medium text-gray-500 tabular-nums">Étape {i} sur {ETAPES.length}</div>
      <h3 className="text-[clamp(24px,2vw,30px)] leading-[1.15] font-semibold tracking-[-0.025em] text-ink">{e.titre}</h3>
      <p className="mt-4 text-[17px] sm:text-[20px] leading-relaxed text-gray-300 max-w-[42ch]">{e.texte}</p>
    </>
  );
}

/**
 * L'étape active se déduit de la seule position de défilement dans la piste :
 * un seuil fixe par étape, le même à l'aller et au retour. Texte (gauche) et
 * visuel (droite) lisent ce même état et changent par le même fondu, au même
 * instant. Mesures en coordonnées d'écran seulement, donc justes quel que soit
 * l'agrandissement (--zoom).
 */
function etapeActive(piste: HTMLElement, panneau: HTMLElement, repere: HTMLElement): number {
  const p = piste.getBoundingClientRect();
  const t = panneau.getBoundingClientRect();
  const fixe = repere.getBoundingClientRect().top; // où le panneau se fixe
  if (t.top - fixe > t.height * 0.25) return 0; // la piste arrive à peine : haut de page
  const pas = (p.height - t.height) / ETAPES.length;
  if (pas <= 0) return 1;
  return Math.min(ETAPES.length, Math.floor((t.top - p.top) / pas) + 1);
}

export function ParcoursDocument({ intro }: { intro: ReactNode }) {
  const [actif, setActif] = useState(0);
  const piste = useRef<HTMLDivElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const repere = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let image = 0;
    const calculer = () => {
      image = 0;
      if (!piste.current || !panneau.current || !repere.current) return;
      if (piste.current.offsetParent === null) return; // téléphone : piste masquée
      setActif(etapeActive(piste.current, panneau.current, repere.current));
    };
    const demander = () => {
      if (!image) image = requestAnimationFrame(calculer);
    };
    calculer();
    window.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    return () => {
      window.removeEventListener("scroll", demander);
      window.removeEventListener("resize", demander);
      if (image) cancelAnimationFrame(image);
    };
  }, []);

  // 0 = le haut de page (brief) ; 1 à 5 = les étapes.
  const vue: Vue = actif === 0 ? "brief" : ETAPES[actif - 1].vue;
  // Avant la première étape, l'étape 1 s'annonce, atténuée.
  const montree = Math.max(actif, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-16">
      <h2 className="sr-only">Comment ça marche</h2>
      <div className="lg:col-span-5">
        {/* Le haut de page : la promesse, et sur téléphone le brief dessous. */}
        <div className="pt-12 pb-16 sm:pt-16 lg:py-0 lg:min-h-(--haut-ecran) flex flex-col justify-center" style={{ ["--haut-ecran" as string]: "calc(100vh / var(--zoom, 1) - 80px)" }}>
          <div className="relative z-10 xl:w-[122%]">{intro}</div>
          <div className="mt-10 lg:hidden">
            <Brief />
          </div>
        </div>

        <div id="etapes" className="scroll-mt-40">
          {/* Téléphone : les étapes l'une sous l'autre, chacune avec ce qui
              change. Le devis entier une fois ; ensuite, le bas du document
              (signature, facture, tampon), puis la carte des déclarations. */}
          <ol className="lg:hidden">
            {ETAPES.map((e, k) => (
              <li key={e.titre} className="py-10">
                <TexteEtape e={e} i={k + 1} />
                <div className="mt-8">
                  {e.vue === "urssaf" ? <Visuel vue={e.vue} /> : <ApercuEtat etat={e.vue as EtatDocument} />}
                </div>
              </li>
            ))}
          </ol>

          {/* Ordinateur : une piste de défilement ; le texte reste fixe et une
              étape remplace l'autre par un fondu, en même temps que le visuel. */}
          <div ref={piste} className="hidden lg:block" style={{ height: `calc(${HAUT_PANNEAU} + ${ETAPES.length} * ${PAS_ETAPE})` }}>
            <div ref={panneau} className="sticky top-[88px] flex items-center" style={{ height: HAUT_PANNEAU }}>
              <ol className="grid w-full">
                {ETAPES.map((e, k) => {
                  const i = k + 1;
                  // Une étape passée sort par le haut, une étape à venir attend en
                  // dessous : en descendant, le texte monte en s'effaçant et le
                  // suivant arrive par le bas ; en remontant, l'inverse.
                  const etat =
                    i === montree
                      ? `translate-y-0 ${actif === 0 ? "opacity-35" : "opacity-100"}`
                      : `${i < montree ? "-translate-y-24" : "translate-y-24"} opacity-0 invisible`;
                  return (
                    <li key={e.titre} aria-current={i === actif ? "step" : undefined} className={`[grid-area:1/1] self-center transition-[opacity,translate,visibility] duration-700 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 ${etat}`}>
                      <TexteEtape e={e} i={i} />
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Ordinateur : le visuel, fixe, qui change à chaque étape. Les hauteurs
          sont divisées par l'agrandissement des grands écrans (--zoom). */}
      <div className="hidden lg:block lg:col-span-7">
        <div ref={repere} className="sticky top-[88px] flex items-center justify-end" style={{ height: HAUT_PANNEAU }}>
          <div className="relative w-full" style={{ maxWidth: "calc((100vh / var(--zoom, 1) - 150px) / 1.35)" }}>
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
