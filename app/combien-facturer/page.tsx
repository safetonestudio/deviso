import { PageSite, CADRE, SECTION, H1, H2, LEAD, BOUTON_PLEIN, BOUTON_DOUX } from "@/components/site/PageSite";
import { DemoButton } from "@/components/landing/DemoButton";
import type { Metadata } from "next";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { SITE } from "@/lib/blog/registre";
import Link from "next/link";
import { TjmSimulator } from "@/components/landing/TjmSimulator";
import {
  TARIFS_DATA,
  TAUX_COTISATIONS_BNC,
  TAUX_COTISATIONS_BNC_CIPAV,
} from "@/lib/tarifs-data";

export const metadata: Metadata = {
  title: "Combien facturer en freelance ? TJM par métier 2026",
  description:
    "TJM par métier en France : graphiste, développeur, consultant, photographe, formateur et plus. Simulateur de revenus freelance inclus.",
  alternates: { canonical: "https://getdeviso.fr/combien-facturer" },
  openGraph: {
    title: "Combien facturer en freelance ? TJM par métier 2026",
    description:
      "TJM junior/confirmé/senior pour 10 métiers freelance. Simulateur de revenus nets inclus.",
    url: "https://getdeviso.fr/combien-facturer",
    images: [{ url: "https://getdeviso.fr/opengraph-image" }],
  },
};

// Le taux de cotisations ne s'écrit nulle part en dur : il vit dans
// lib/tarifs-data.ts, avec sa source et sa date. Cette page a affiché 22 %
// pendant que le simulateur juste en dessous calculait à 25,6 %. Voir check:taux.
const PCT = (TAUX_COTISATIONS_BNC * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const PCT_NET = ((1 - TAUX_COTISATIONS_BNC) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const EX_TJM = 400;
const EX_JOURS = 15;
const EX_CA = EX_TJM * EX_JOURS;
const EX_NET = Math.round(EX_CA * (1 - TAUX_COTISATIONS_BNC));
const eur = (n: number) => n.toLocaleString("fr-FR");

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quel est le TJM moyen d'un freelance en France en 2026 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le TJM médian d'un freelance en France est d'environ 420 €/jour (Malt Baromètre 2026). Il varie fortement selon le métier : de 150 €/j pour un community manager débutant à plus de 1 400 €/j pour un consultant senior en finance ou pharma.",
        },
      },
      {
        "@type": "Question",
        name: "Comment calculer son revenu net en freelance à partir de son TJM ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `En micro-BNC (prestation intellectuelle) : CA mensuel = TJM × jours facturables (≈${EX_JOURS}/mois). Cotisations URSSAF = CA × ${PCT} % au régime général (${(TAUX_COTISATIONS_BNC_CIPAV * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % à la Cipav). Revenu net avant IR = CA × ${PCT_NET} %. Exemple : ${EX_TJM} €/j × ${EX_JOURS} j = ${eur(EX_CA)} € de CA → ${eur(EX_NET)} € net avant impôt.`,
        },
      },
      {
        "@type": "Question",
        name: "Combien de jours par mois un freelance peut-il réellement facturer ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "En moyenne 12 à 17 jours par mois selon le métier, après déduction des congés (5 semaines/an), de la prospection, de l'administration et de la formation. Les consultants en régie ont les taux les plus élevés (16–18 j/mois), les coachs et formateurs les plus bas (10–12 j/mois).",
        },
      },
    ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
        { "@type": "ListItem", position: 2, name: "Combien facturer" },
      ],
    },
  ],
};

export default function CombienFacturerPage() {
  return (
    <PageSite>
      <DonneesStructurees donnees={jsonLd} />

      {/* Introduction */}
      <section className={`${CADRE} pt-14 sm:pt-20`}>
        <div className="max-w-3xl">
          <p className="text-[15px] font-medium text-blue-400 mb-4">Baromètre Malt 2026 · Données URSSAF</p>
          <h1 className={H1}>Combien facturer en freelance&nbsp;?</h1>
          <p className={`${LEAD} mt-6`}>
            TJM par métier, calcul de revenu net et simulateur interactif. Des données de marché réelles
            pour fixer votre tarif journalier avec confiance.
          </p>
        </div>
      </section>

      {/* Grille TJM par métier */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-4">
            <h2 className={H2}>TJM par métier en 2026</h2>
            <p className="text-[16px] text-gray-300 mt-4 leading-relaxed">
              Fourchettes junior / confirmé / senior. Cliquez sur un métier pour le détail complet.
            </p>
            <p className="text-[14px] text-gray-400 mt-4">Sources&nbsp;: Malt Baromètre 2026, URSSAF. Tarifs hors TVA, en €/jour.</p>
          </div>
          <div className="lg:col-span-8 rounded-xl bg-ds-surface p-3 sm:p-6 overflow-x-auto">
            <table className="w-full text-[13px] sm:text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="text-left text-[14px] font-medium text-gray-400 pb-3 pr-4">Métier</th>
                  <th className="text-right text-[14px] font-medium text-gray-400 pb-3 px-1.5 sm:px-3">Junior<br /><span className="font-normal">0–2 ans</span></th>
                  <th className="text-right text-[14px] font-medium text-indigo-400 pb-3 px-1.5 sm:px-3">Confirmé<br /><span className="font-normal">2–5 ans</span></th>
                  <th className="text-right text-[14px] font-medium text-gray-400 pb-3 pl-1.5 sm:pl-3">Senior<br /><span className="font-normal">5+ ans</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {TARIFS_DATA.map((m) => (
                  <tr key={m.slug} className="group hover:bg-ds-elevated transition-colors">
                    <td className="py-3 pr-2 sm:pr-4">
                      <Link href={`/combien-facturer/${m.slug}`} className="font-medium text-ink group-hover:text-indigo-300 transition-colors">
                        {m.name}
                      </Link>
                    </td>
                    <td className="py-3 px-1.5 sm:px-3 text-right text-gray-300 tabular-nums whitespace-nowrap">{m.tjm.junior.min}–{m.tjm.junior.max}&nbsp;€</td>
                    <td className="py-3 px-1.5 sm:px-3 text-right text-indigo-300 font-semibold tabular-nums whitespace-nowrap">{m.tjm.confirme.min}–{m.tjm.confirme.max}&nbsp;€</td>
                    <td className="py-3 pl-1.5 sm:pl-3 text-right text-gray-300 tabular-nums whitespace-nowrap">{m.tjm.senior.min}–{m.tjm.senior.max}&nbsp;€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Simulateur général */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <h2 className={H2}>De votre TJM à votre revenu net</h2>
            <p className="text-[16px] text-gray-300 leading-relaxed mt-5 mb-6">
              En <strong className="text-ink">micro-BNC</strong> (régime le plus courant pour les
              prestations intellectuelles), vous versez{" "}
              <strong className="text-ink">{PCT}&nbsp;% de cotisations URSSAF</strong> sur votre chiffre
              d&apos;affaires (
              {(TAUX_COTISATIONS_BNC_CIPAV * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}&nbsp;% si
              vous relevez de la Cipav). Le reste est votre revenu net avant impôt sur le revenu.
            </p>
            <div className="space-y-3 text-[15px] text-gray-300">
              <div className="flex items-start gap-3 rounded-lg bg-ds-surface p-4">
                <span className="text-indigo-400 font-semibold">1</span>
                <p><strong className="text-ink">TJM × jours facturables</strong> = CA mensuel (comptez ~15 j/mois en moyenne)</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-ds-surface p-4">
                <span className="text-indigo-400 font-semibold">2</span>
                <p><strong className="text-ink">CA × {PCT}&nbsp;%</strong> = cotisations URSSAF à payer chaque trimestre</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-ds-surface p-4">
                <span className="text-indigo-400 font-semibold">3</span>
                <p><strong className="text-ink">CA − cotisations</strong> = revenu net avant IR (entre 15 et 30&nbsp;% selon votre tranche)</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <TjmSimulator defaultTjm={420} defaultJours={15} />
          </div>
        </div>
      </section>

      {/* Pages par métier */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="max-w-2xl">
          <h2 className={H2}>Données détaillées par métier</h2>
          <p className="text-[16px] text-gray-300 mt-4 leading-relaxed">
            TJM par spécialité, erreurs de pricing à éviter, FAQ et simulateur spécifique à chaque profession.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TARIFS_DATA.map((m) => {
            const mediane = Math.round((m.tjm.confirme.min + m.tjm.confirme.max) / 2);
            return (
              <Link
                key={m.slug}
                href={`/combien-facturer/${m.slug}`}
                className="group flex items-center justify-between gap-3 rounded-xl bg-ds-surface hover:bg-ds-elevated px-5 py-4 transition-colors"
              >
                <div>
                  <p className="text-[16px] font-medium text-ink group-hover:text-indigo-300 transition-colors">{m.name}</p>
                  <p className="text-[14px] text-gray-400 mt-0.5">{m.tjm.junior.min}–{m.tjm.senior.max}&nbsp;€/j</p>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-semibold text-indigo-400 tabular-nums">~{mediane}&nbsp;€</p>
                  <p className="text-[13px] text-gray-400">médiane</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Erreurs communes */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className={H2}>Les erreurs universelles de pricing en freelance</h2>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              {
                t: "Facturer son temps, pas sa valeur",
                d: "Un développeur qui économise 50 k€ de coût de recrutement crée plus de valeur qu'une journée de travail. Apprenez à quantifier l'impact de vos livrables.",
              },
              {
                t: "S'aligner sur le moins-disant",
                d: "Se positionner au TJM le plus bas du marché pour décrocher une mission est une spirale. Les clients qui achètent uniquement sur le prix sont les moins fidèles.",
              },
              {
                t: "Ignorer les jours non facturables",
                d: "Prospection, admin, congés, formation : sur 220 jours ouvrables/an, vous n'en facturez que 150–180. Votre TJM doit couvrir ces jours 'gratuits'.",
              },
              {
                t: "Ne pas distinguer TJM et tarif horaire",
                d: "Un TJM de 500 € représente ~62 €/h. Un tarif horaire de 50 €/h n'est pas équivalent : il nie l'aspect projet et la préparation en amont.",
              },
            ].map(({ t, d }) => (
              <div key={t} className="rounded-xl bg-ds-surface p-6">
                <p className="font-semibold text-ink mb-2 text-[17px]">{t}</p>
                <p className="text-[15px] text-gray-300 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appel final */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="rounded-xl bg-ds-surface p-8 sm:p-12 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <h2 className={H2}>Vos devis et factures en 30 secondes</h2>
            <p className={`${LEAD} mt-4`}>
              Une fois votre TJM défini, Deviso génère vos devis par IA, les envoie avec e-signature et
              transforme les devis signés en factures Factur-X en 1 clic.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-start">
            <Link href="/signup" className={`w-full sm:w-auto ${BOUTON_PLEIN}`}>Essayer 14 jours gratuitement</Link>
            <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
          </div>
        </div>
      </section>

      {/* Tous les métiers */}
      <nav aria-label="Tous les TJM par métier" className={`${CADRE} ${SECTION} pb-20`}>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-gray-400">
          {TARIFS_DATA.map((m) => (
            <Link key={m.slug} href={`/combien-facturer/${m.slug}`} className="hover:text-ink transition-colors">
              TJM {m.label}
            </Link>
          ))}
        </div>
      </nav>
    </PageSite>
  );
}
