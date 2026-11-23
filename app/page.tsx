import Link from "next/link";
import type { Metadata } from "next";
import { PageSite, CADRE, H2, LEAD, BOUTON, BOUTON_PLEIN, BOUTON_DOUX } from "@/components/site/PageSite";
import { DemoButton } from "@/components/landing/DemoButton";
import { ParcoursDocument } from "@/components/landing/ParcoursDocument";
import { SlideFonctionnalites } from "@/components/landing/SlideFonctionnalites";
import { PourquoiDeviso } from "@/components/landing/PourquoiDeviso";
import { FaqAccueil } from "@/components/landing/FaqAccueil";
import { TarifsTable } from "@/components/landing/TarifsTable";
import { prix as grille } from "@/lib/grille-tarifaire";

export const metadata: Metadata = {
  title: "Deviso, logiciel de devis et factures pour les entreprises, de l'indépendant à la société",
  description:
    "Vos devis rédigés en 30 secondes, vos factures conformes 2026 envoyées par une plateforme agréée comprise dans l'abonnement, vos relances automatiques. Pour votre entreprise, que vous travailliez seul ou à plusieurs. Essai gratuit 14 jours, sans carte.",
  alternates: {
    canonical: "https://getdeviso.fr",
  },
  openGraph: {
    title: "Deviso, devis et factures pour les entreprises, de l'indépendant à la société",
    description: "Vos devis rédigés, vos factures conformes, vos relances envoyées. Plateforme agréée comprise, essai gratuit de 14 jours.",
    url: "https://getdeviso.fr",
    siteName: "Deviso",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "https://getdeviso.fr/opengraph-image?v=2", width: 1200, height: 630, alt: "Deviso : vos devis rédigés, vos factures conformes, vos relances envoyées" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Deviso",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://getdeviso.fr",
  description:
    "Logiciel de devis et de facturation pour les entreprises en France, de l'indépendant à la société avec son équipe. Devis IA, Factur-X, relances automatiques.",
  offers: [
    { "@type": "Offer", name: "Solo", price: grille("solo").mensuel, priceCurrency: "EUR", billingIncrement: "P1M" },
    { "@type": "Offer", name: "Pro", price: grille("pro").mensuel, priceCurrency: "EUR", billingIncrement: "P1M" },
  ],
  featureList: [
    "Génération de devis par IA",
    "Signature électronique client",
    "Facturation électronique Factur-X",
    "Émission et réception de factures via une plateforme agréée (Super PDP)",
    "Conformité droit français",
    "Suivi du chiffre d'affaires, de la TVA et des échéances, selon le statut de l'entreprise",
    "Relances automatiques",
  ],
  inLanguage: "fr",
  audience: {
    "@type": "Audience",
    audienceType: "Entreprises en France, des indépendants et micro-entrepreneurs aux sociétés avec équipe",
  },
};

/* Page d'accueil, refonte du 16/11/2026, deuxième version.
   Idée : ce que Deviso produit, c'est un document. La page est construite
   autour d'un seul devis, composé comme une pièce imprimée, qui vit son
   parcours au fil du défilement (brief, devis, signature, facture, paiement,
   déclaration). L'application elle-même vient ensuite, en second plan.
   Système : une police (Hanken Grotesk) en graisse moyenne ; peu de tailles ;
   angles de 8 à 10 px ; aucune ombre ni contour décoratif ; surfaces
   distinguées par leur ton ; un seul accent, le vert ; la feuille claire est
   le seul élément clair de la page. */

/* Bandes de section : fond du haut de page, puis un fond légèrement plus
   clair une section sur deux, pour marquer où l'une finit et l'autre commence. */
const BANDE = "py-20 sm:py-28 lg:py-32";
const FOND_2 = "bande-alt";

export default function LandingPage() {
  return (
    <PageSite>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main>
        {/* ── Haut de page et parcours d'un devis, en une seule histoire ──
            La promesse à gauche, le brief qui s'écrit à droite ; en faisant
            défiler, le même emplacement montre le devis, la signature, la
            facture, le paiement, puis la déclaration. */}
        <section id="parcours" className={`${CADRE} scroll-mt-20`}>
          <ParcoursDocument
            intro={
              <div>
                <h1 className="text-[clamp(31px,4.1vw,64px)] leading-[1.04] font-semibold tracking-[-0.04em] text-ink">
                  <span className="block xl:whitespace-nowrap">Vos devis rédigés,</span>
                  <span className="block xl:whitespace-nowrap">vos factures conformes,</span>
                  <span className="block xl:whitespace-nowrap">vos relances envoyées.</span>
                </h1>
                <p className={`mt-6 max-w-[48ch] ${LEAD}`}>
                  Pour votre entreprise, de l&apos;indépendant à la société avec son équipe. La plateforme agréée est
                  comprise&nbsp;: vos factures électroniques partent sans rien brancher ni payer en plus.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link href="/signup" className={BOUTON_PLEIN}>Essayer 14 jours gratuitement</Link>
                  <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
                </div>
                <p className="mt-4 text-[14px] text-gray-400">Sans carte bancaire. La démo s&apos;ouvre en un clic, sans inscription.</p>
              </div>
            }
          />
        </section>

        {/* ── Pourquoi Deviso, face aux outils gratuits ── */}
        <section id="pourquoi" className={`${BANDE} ${FOND_2} scroll-mt-20`} aria-labelledby="titre-pourquoi"><div className={CADRE}>
          <PourquoiDeviso titre={H2} />
        </div></section>

        {/* ── L'application : ce que le parcours ne montre pas ── */}
        <section id="fonctionnalites" className={`${BANDE} scroll-mt-20`}><div className={CADRE}>
          <div className="reveal max-w-[760px]">
            <h2 className={H2}>Vos ventes, vos achats et vos prix, au même endroit.</h2>
            <p className={`mt-5 ${LEAD}`}>Vos factures, celles de vos fournisseurs et votre catalogue se répondent&nbsp;: rien à ressaisir, rien à recopier dans un tableur.</p>
          </div>
          <div className="mt-12 sm:mt-16">
            <SlideFonctionnalites />
          </div>
        </div></section>

        {/* ── Réforme 2026 ── */}
        <section className={`${BANDE} ${FOND_2}`} aria-labelledby="titre-reforme"><div className={CADRE}>
          <div className="reveal rounded-xl bg-blue-800 text-ink px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-8">
              <h2 id="titre-reforme" className="text-[clamp(28px,2.6vw,40px)] leading-[1.1] font-semibold tracking-[-0.035em]">La facture électronique, déjà en place.</h2>
              <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed max-w-[56ch]">
                Deviso reçoit déjà les factures électroniques de vos fournisseurs et émet les vôtres par la plateforme agréée.
                Quand votre tour viendra, vous n&apos;aurez rien à changer.
              </p>
              <Link href="/conformite" className="mt-6 inline-flex items-center gap-2 text-[17px] font-semibold underline decoration-ink/40 underline-offset-4 hover:decoration-ink transition-colors">
                Comprendre la réforme <span aria-hidden="true">→</span>
              </Link>
              <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                {[
                  ["Le format officiel", "Chaque facture est un Factur-X : un PDF lisible par votre client, qui porte aussi les données lues par les logiciels."],
                  ["Le secteur public aussi", "Vos factures aux administrations sont déposées pour vous sur Chorus Pro, le portail de l'État."],
                ].map(([t, d]) => (
                  <li key={t}>
                    <div className="text-[17px] font-semibold">{t}</div>
                    <p className="mt-1.5 text-[17px] leading-relaxed text-ink/75">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
            <ol className="lg:col-span-4 lg:col-start-9 grid gap-4 self-center" aria-label="Calendrier de la réforme">
              {[
                ["Septembre 2026", "Toute entreprise doit pouvoir recevoir des factures électroniques."],
                ["Septembre 2027", "Les petites et moyennes entreprises, les micro-entrepreneurs et les indépendants doivent aussi les émettre."],
              ].map(([d, t]) => (
                <li key={d} className="rounded-lg bg-ink/10 px-5 py-4">
                  <div className="text-[14px] font-semibold text-blue-200">{d}</div>
                  <div className="mt-1 text-[17px] leading-snug">{t}</div>
                </li>
              ))}
            </ol>
          </div>
        </div></section>

        {/* ── Le mot du fondateur ──
            Remplace d'anciens témoignages fictifs : sur un produit encore en
            pré-lancement, sans clients réels, on dit la vérité. À remplacer
            par de vrais témoignages, avec accord, quand il y en aura. */}
        <section className={`${BANDE}`} aria-labelledby="titre-fondateur"><div className={CADRE}>
          <div className="reveal grid gap-10 lg:grid-cols-12 lg:gap-16">
            <h2 id="titre-fondateur" className={`${H2} lg:col-span-5`}>Un fondateur qui vous répond.</h2>
            <div className="lg:col-span-7">
              <p className="text-[20px] sm:text-[24px] leading-[1.5] tracking-[-0.01em] text-ink">
                J&apos;ai créé Deviso parce que je perdais trop de temps sur mes propres devis et factures, et parce que la réforme
                de la facturation électronique arrivait sans outil vraiment simple pour les entreprises, de l&apos;indépendant à la société avec son équipe.
              </p>
              <p className="mt-6 text-[17px] leading-relaxed text-gray-300 max-w-[62ch]">
                Je lis chaque message et j&apos;y réponds moi-même. Écrivez-moi avant même de vous inscrire.
              </p>
              <div className="mt-8">
                <div className="text-[17px] font-semibold text-ink">S. Albert, fondateur</div>
                <a href="mailto:support@getdeviso.fr" className="mt-1 inline-block text-[17px] text-indigo-400 hover:text-indigo-300 transition-colors">support@getdeviso.fr</a>
              </div>
            </div>
          </div>
        </div></section>

        {/* ── Tarifs ── */}
        <section id="tarifs" className={`${BANDE} ${FOND_2} scroll-mt-20`}><div className={CADRE}>
          <TarifsTable />
        </div></section>

        {/* ── Questions avant de commencer ── */}
        <section id="faq" className={`${BANDE} scroll-mt-20`} aria-labelledby="titre-faq"><div className={CADRE}>
          <FaqAccueil titre={H2} />
        </div></section>

        {/* ── Dernière action ── */}
        <section className={`${BANDE} ${FOND_2}`} aria-labelledby="titre-action"><div className={CADRE}>
          <div className="reveal rounded-xl bg-ds-surface px-6 py-14 sm:px-12 sm:py-20 lg:px-16 lg:py-24 grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 id="titre-action" className={H2}>Essayez Deviso sur votre prochain devis.</h2>
              <p className={`mt-5 ${LEAD}`}>Essai gratuit de 14 jours, sans carte bancaire. Rien ne se déclenche à la fin.</p>
            </div>
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
              <Link href="/signup" className={BOUTON_PLEIN}>Essayer 14 jours gratuitement</Link>
              <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
            </div>
          </div>
        </div></section>
      </main>

    </PageSite>
  );
}
