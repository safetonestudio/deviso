import { PageSite, CADRE, SECTION, H1, H2, LEAD, BOUTON_PLEIN, BOUTON_DOUX } from "@/components/site/PageSite";
import { APPEL } from "@/lib/beta";
import { DemoButton } from "@/components/landing/DemoButton";
import type { Metadata } from "next";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { SITE } from "@/lib/blog/registre";
import { metierDeLanding } from "@/lib/blog/metiers";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  TARIFS_DATA,
  getTarifsMetier,
  ALL_METIER_SLUGS,
  TAUX_COTISATIONS_BNC,
} from "@/lib/tarifs-data";
import { TjmSimulator } from "@/components/landing/TjmSimulator";

type Props = { params: Promise<{ metier: string }> };

export async function generateStaticParams() {
  return ALL_METIER_SLUGS.map((slug) => ({ metier: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  const data = getTarifsMetier(metier);
  if (!data) return {};
  return {
    title: `TJM ${data.name} freelance 2026 : tarifs et simulateur de revenus`,
    description: data.description,
    alternates: {
      canonical: `https://getdeviso.fr/combien-facturer/${data.slug}`,
    },
    openGraph: {
      title: `TJM ${data.name} freelance 2026 : combien facturer ?`,
      description: data.description,
      url: `https://getdeviso.fr/combien-facturer/${data.slug}`,
      images: [{ url: "https://getdeviso.fr/opengraph-image?v=2" }],
    },
  };
}

function TjmBadge({
  level,
  label,
  min,
  max,
  highlight,
}: {
  level: string;
  label: string;
  min: number;
  max: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-ds-surface p-5">
      <p className={`text-[14px] font-medium mb-1 ${highlight ? "text-indigo-400" : "text-gray-400"}`}>{label}</p>
      <p className={`text-[22px] sm:text-[28px] font-semibold tabular-nums ${highlight ? "text-indigo-300" : "text-ink"}`}>
        {min}–{max}&nbsp;€
      </p>
      <p className="text-[13px] text-gray-400 mt-1">/jour · HT</p>
      <p className="text-[13px] text-gray-400 mt-2">{level}</p>
    </div>
  );
}

export default async function MetierTarifsPage({ params }: Props) {
  const { metier } = await params;
  const data = getTarifsMetier(metier);
  if (!data) notFound();

  const defaultTjm = Math.round((data.tjm.confirme.min + data.tjm.confirme.max) / 2);

  // Le taux et le net se déduisent de TAUX_COTISATIONS_BNC. Un pourcentage écrit
  // en dur ici a affiché 22 % à côté d'un simulateur qui calculait à 25,6 % -
  // deux chiffres contradictoires sur le même écran. Voir check:taux.
  const pctCotisations = (TAUX_COTISATIONS_BNC * 100).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  });
  const netMensuel = defaultTjm * data.joursFacturables * (1 - TAUX_COTISATIONS_BNC);

  // Le fil d'Ariane manquait sur tout le site. Il fait afficher le chemin de la
  // page dans les résultats Google au lieu de l'URL brute, et il coûte six lignes.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: data.faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
          { "@type": "ListItem", position: 2, name: "Combien facturer", item: `${SITE}/combien-facturer` },
          { "@type": "ListItem", position: 3, name: data.name },
        ],
      },
    ],
  };

  // L'article du blog consacré au même métier. Il pointait déjà vers cette page
  // et vers la landing ; l'inverse n'existait pas.
  const guide = metierDeLanding(data.landingHref)?.article;

  const otherMetiers = TARIFS_DATA.filter((m) => m.slug !== data.slug).slice(0, 5);

  return (
    <PageSite>
      <DonneesStructurees donnees={jsonLd} />

      {/* Introduction */}
      <section className={`${CADRE} pt-10 sm:pt-14`}>
        <nav className="flex flex-wrap items-center gap-2 text-[14px] text-gray-400 mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/combien-facturer" className="hover:text-ink transition-colors">Tarifs freelance</Link>
          <span>/</span>
          <span className="text-gray-300">{data.name}</span>
        </nav>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <p className="text-[15px] font-medium text-blue-400 mb-4">Baromètre Malt 2026 · URSSAF</p>
            <h1 className={H1}>{data.title}</h1>
            <p className={`${LEAD} mt-6`}>{data.description}</p>
          </div>
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TjmBadge level="0–2 ans d'expérience" label="Junior" min={data.tjm.junior.min} max={data.tjm.junior.max} />
              <TjmBadge level="2–5 ans d'expérience" label="Confirmé" min={data.tjm.confirme.min} max={data.tjm.confirme.max} highlight />
              <TjmBadge level="5+ ans d'expérience" label="Senior" min={data.tjm.senior.min} max={data.tjm.senior.max} />
            </div>
            <p className="text-[14px] text-gray-400 mt-4">
              Source&nbsp;: Malt Baromètre 2026 · Tarifs HT, en €/jour · Marché français · Mis à jour juillet 2026
            </p>
          </div>
        </div>
      </section>

      {/* Simulateur */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <h2 className={H2}>Simulez votre revenu net</h2>
            <p className="text-[16px] text-gray-300 leading-relaxed mt-5 mb-6">
              En <strong className="text-ink">micro-BNC</strong> (régime standard pour les{" "}
              {data.label}s), vous versez{" "}
              <strong className="text-ink">{pctCotisations}&nbsp;% de cotisations URSSAF</strong> sur votre
              CA. Le simulateur ci-contre calcule votre revenu net mensuel avant impôt, ou le TJM à
              atteindre pour un revenu cible. En société, le calcul dépend de votre rémunération de
              dirigeant et des charges de l&apos;entreprise : validez-le avec votre expert-comptable.
            </p>
            <div className="rounded-xl bg-ds-surface p-5 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">Jours facturables estimés</span>
                <span className="font-semibold text-ink">{data.joursFacturables} j/mois</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">TJM médian ({data.name} confirmé)</span>
                <span className="font-semibold text-indigo-300">{defaultTjm}&nbsp;€/j</span>
              </div>
              <div className="flex justify-between gap-4 pt-3 border-t border-ink/10">
                <span className="text-gray-300">Revenu net estimé / mois</span>
                <span className="font-semibold text-indigo-400">
                  {netMensuel.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}&nbsp;€
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <TjmSimulator defaultTjm={defaultTjm} defaultJours={data.joursFacturables} />
          </div>
        </div>
      </section>

      {/* Spécialités */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className={H2}>Spécialités qui augmentent le TJM</h2>
            <p className="text-[16px] text-gray-300 mt-4 leading-relaxed">
              Par rapport au TJM moyen d&apos;un {data.label} confirmé ({defaultTjm}&nbsp;€/j).
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {data.specialites.map((s) => {
              const premium = Math.round(defaultTjm * (1 + s.premium / 100));
              return (
                <div key={s.label} className="flex items-center justify-between gap-4 rounded-xl bg-ds-surface px-5 py-4">
                  <span className="text-[15px] text-gray-300">{s.label}</span>
                  <div className="text-right shrink-0">
                    <span className="text-[15px] font-semibold text-indigo-400">~{premium}&nbsp;€/j</span>
                    <span className="text-[13px] text-gray-400 ml-1.5">+{s.premium}&nbsp;%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Erreurs de tarification */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className={H2}>Erreurs de tarification à éviter</h2>
          </div>
          <ul className="lg:col-span-7 grid gap-4">
            {data.erreurs.map((e) => (
              <li key={e} className="rounded-xl bg-ds-surface p-5 text-[15px] text-gray-300 leading-relaxed">
                {e}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Deviso */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="rounded-xl bg-ds-surface p-8 sm:p-12 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <h2 className={H2}>Créez vos devis de {data.label} en 30 secondes</h2>
            <p className="text-[16px] text-gray-300 leading-relaxed mt-4">
              Deviso génère un devis complet par IA à partir d&apos;une description de mission, avec vos
              lignes de prestation, votre TJM et vos conditions de paiement. Le client signe
              en ligne, la facture Factur-X est émise en 1 clic. Indépendant, société ou équipe
              de plusieurs personnes : la formule Pro gère les utilisateurs, les rôles et la validation des devis.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-start">
            <Link href={APPEL.lien} className={`w-full sm:w-auto ${BOUTON_PLEIN}`}>{APPEL.libelle}</Link>
            <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
            <Link href={data.landingHref} className="text-[14px] text-indigo-400 hover:text-indigo-300 transition-colors">
              Voir Deviso pour les {data.label}s
            </Link>
          </div>
        </div>
      </section>

      {/* Le guide du même métier : arête du triangle landing / guide / tarifs */}
      {guide && (
        <section className={`${CADRE} ${SECTION}`}>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-5">
              <p className="text-[15px] font-medium text-blue-400 mb-4">Guide pratique</p>
              <h2 className={H2}>
                Savoir quoi facturer, c&apos;est une chose. Savoir l&apos;écrire sur un devis, c&apos;en est une autre.
              </h2>
            </div>
            <div className="lg:col-span-7 rounded-xl bg-ds-surface p-6 self-start">
              <p className="text-[16px] text-gray-300 leading-relaxed mb-4">
                Mentions obligatoires, exemple chiffré, clauses qui protègent des révisions sans fin
                et des impayés, erreurs les plus fréquentes.
              </p>
              <Link href={guide.href} className="text-indigo-400 hover:text-indigo-300 font-medium text-[15px] transition-colors">
                Lire le guide du devis {data.label} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className={H2}>Questions fréquentes sur les tarifs {data.label}</h2>
          </div>
          <div className="lg:col-span-7 grid gap-4">
            {data.faq.map(({ q, a }) => (
              <div key={q} className="rounded-xl bg-ds-surface p-6">
                <h3 className="text-[17px] font-semibold text-ink mb-2">{q}</h3>
                <p className="text-[15px] text-gray-300 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Autres métiers */}
      <section className={`${CADRE} ${SECTION} pb-20`}>
        <h2 className="text-[20px] font-semibold text-ink mb-5">TJM d&apos;autres métiers freelance</h2>
        <div className="flex flex-wrap gap-2">
          {otherMetiers.map((m) => (
            <Link
              key={m.slug}
              href={`/combien-facturer/${m.slug}`}
              className="text-[14px] font-medium px-4 py-2 rounded-lg bg-ds-surface text-gray-300 hover:text-ink hover:bg-ds-elevated transition-colors"
            >
              TJM {m.label}
            </Link>
          ))}
          <Link
            href="/combien-facturer"
            className="text-[14px] font-medium px-4 py-2 rounded-lg bg-ds-surface text-indigo-400 hover:text-indigo-300 hover:bg-ds-elevated transition-colors"
          >
            Tous les métiers
          </Link>
        </div>
      </section>
    </PageSite>
  );
}
