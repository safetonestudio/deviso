"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentDevis, type EtatDocument } from "@/components/landing/DocumentDevis";

/**
 * Le moment fort de la page d'accueil : un seul document, de la demande au
 * paiement. Sur ordinateur, le document reste fixe à droite pendant que les
 * étapes défilent à gauche ; il change d'état à chaque étape. Sur téléphone,
 * chaque étape montre son propre document, sous son texte.
 */
type Etape = { titre: string; texte: string; vue: "brief" | EtatDocument | "urssaf" };

const ETAPES: Etape[] = [
  { titre: "Tu décris ta mission.", texte: "Quelques phrases suffisent, au clavier ou à la voix. L'IA reprend les prestations et les tarifs de ton catalogue.", vue: "brief" },
  { titre: "Le devis est prêt en 30 secondes.", texte: "Lignes, quantités, prix, TVA et mentions obligatoires : tout est rédigé. Tu relis, tu ajustes, tu envoies.", vue: "devis" },
  { titre: "Ton client signe en ligne.", texte: "Il reçoit un lien, ouvre le devis sur son téléphone et signe. Tu es prévenu à l'instant.", vue: "signe" },
  { titre: "Un clic, et c'est une facture.", texte: "Le devis signé devient une facture Factur-X conforme, transmise par une plateforme agréée.", vue: "facture" },
  { titre: "Deviso relance, tu encaisses.", texte: "Sans réponse, ton client est relancé à 3, 7 ou 14 jours. Le paiement reçu, la facture passe en payée.", vue: "paye" },
  { titre: "Ta déclaration est prête.", texte: "Ton chiffre d'affaires du trimestre est calculé à partir de tes encaissements, prêt à reporter à l'URSSAF.", vue: "urssaf" },
];

function Brief() {
  return (
    <div data-ui className="rounded-[10px] bg-ds-surface p-6 sm:p-8">
      <div className="text-[14px] font-medium text-gray-400">Décris ton projet</div>
      <p className="mt-3 rounded-md bg-ds-elevated p-5 text-[17px] sm:text-[20px] leading-relaxed text-ink">
        Refonte du site vitrine d&apos;un cabinet d&apos;avocats à Lyon : cinq pages, formulaire de contact, mise en ligne. Délai de trois semaines.
        <span className="curseur-demo" aria-hidden="true" />
      </p>
      <div className="mt-4 h-12 rounded-md bg-indigo-600 text-on-accent grid place-items-center text-[17px] font-semibold">Générer le devis</div>
    </div>
  );
}

function Urssaf() {
  return (
    <div data-ui className="rounded-[10px] bg-ds-surface p-6 sm:p-8">
      <div className="text-[14px] font-medium text-gray-400">Chiffre d&apos;affaires encaissé, 4e trimestre</div>
      <div className="mt-2 text-[clamp(40px,5vw,64px)] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">6 200 €</div>
      <div className="mt-6 grid grid-cols-2 gap-2 text-[14px]">
        <div className="rounded-md bg-ds-elevated p-4">
          <div className="text-gray-400">Cotisations estimées</div>
          <div className="mt-1 text-[20px] font-semibold tabular-nums text-ink">1 587 €</div>
        </div>
        <div className="rounded-md bg-ds-elevated p-4">
          <div className="text-gray-400">À déclarer avant le</div>
          <div className="mt-1 text-[20px] font-semibold tabular-nums text-ink">31 janvier</div>
        </div>
      </div>
    </div>
  );
}

function Vue({ vue }: { vue: Etape["vue"] }) {
  if (vue === "brief") return <Brief />;
  if (vue === "urssaf") return <Urssaf />;
  return <DocumentDevis etat={vue} />;
}

export function ParcoursDocument() {
  const [actif, setActif] = useState(0);
  const etapes = useRef<(HTMLLIElement | null)[]>([]);

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
    etapes.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const vue = ETAPES[actif].vue;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-16">
      <ol className="lg:col-span-5">
        {ETAPES.map((e, i) => (
          <li
            key={e.titre}
            ref={(el) => {
              etapes.current[i] = el;
            }}
            data-i={i}
            className="py-10 lg:py-0 lg:min-h-[64vh] flex flex-col justify-center"
          >
            <div className={`transition-opacity duration-500 ${i === actif ? "lg:opacity-100" : "lg:opacity-35"}`}>
              <h3 className="text-[clamp(26px,2.4vw,36px)] leading-[1.12] font-semibold tracking-[-0.03em] text-ink">{e.titre}</h3>
              <p className="mt-4 text-[17px] sm:text-[20px] leading-relaxed text-gray-300 max-w-[42ch]">{e.texte}</p>
            </div>
            {/* Téléphone : le visuel des étapes clés seulement, sous leur texte. */}
            {e.vue !== "signe" && e.vue !== "facture" && (
              <div className="mt-8 lg:hidden">
                <Vue vue={e.vue} />
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* Ordinateur : le document, fixe, qui change d'état. */}
      <div className="hidden lg:block lg:col-span-7">
        <div className="sticky top-[88px] h-[calc(100vh-112px)] flex items-center justify-center">
          <div className="relative w-full" style={{ maxWidth: "calc((100vh - 150px) * 0.74)" }}>
            <div className={`transition-opacity duration-500 ${vue === "brief" || vue === "urssaf" ? "opacity-0" : "opacity-100"}`}>
              <DocumentDevis etat={vue === "brief" ? "devis" : vue === "urssaf" ? "paye" : vue} />
            </div>
            <div className={`absolute inset-0 flex items-center transition-opacity duration-500 ${vue === "brief" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="w-full">
                <Brief />
              </div>
            </div>
            <div className={`absolute inset-0 flex items-center transition-opacity duration-500 ${vue === "urssaf" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="w-full">
                <Urssaf />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
