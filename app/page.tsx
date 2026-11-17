import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { DemoButton } from "@/components/landing/DemoButton";
import { Apparitions } from "@/components/landing/Apparitions";
import { ParcoursDocument } from "@/components/landing/ParcoursDocument";
import { SlideFonctionnalites } from "@/components/landing/SlideFonctionnalites";
import { PourquoiDeviso } from "@/components/landing/PourquoiDeviso";
import { FaqAccueil } from "@/components/landing/FaqAccueil";
import { TarifsTable } from "@/components/landing/TarifsTable";
import { ModeNuit } from "@/components/landing/ModeNuit";
import { policesApp } from "@/app/polices-app";

export const metadata: Metadata = {
  title: "Deviso, logiciel de devis et factures pour indépendants et petites entreprises",
  description:
    "Tes devis rédigés en 30 secondes, tes factures conformes 2026 envoyées par une plateforme agréée comprise dans l'abonnement, tes relances automatiques. Pour indépendants et petites entreprises. Essai gratuit 14 jours, sans carte.",
  alternates: {
    canonical: "https://getdeviso.fr",
  },
  openGraph: {
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
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
    "Logiciel de devis et facturation pour les indépendants et les petites entreprises en France. Devis IA, Factur-X, relances automatiques.",
  offers: [
    { "@type": "Offer", name: "Solo", price: "18", priceCurrency: "EUR", billingIncrement: "P1M" },
    { "@type": "Offer", name: "Pro", price: "34", priceCurrency: "EUR", billingIncrement: "P1M" },
  ],
  featureList: [
    "Génération de devis par IA",
    "Signature électronique client",
    "Facturation électronique Factur-X",
    "Émission et réception de factures via une plateforme agréée (Super PDP)",
    "Conformité droit français",
    "Suivi du chiffre d'affaires, de la TVA et des échéances",
    "Relances automatiques",
  ],
  inLanguage: "fr",
  audience: {
    "@type": "Audience",
    audienceType: "Indépendants et petites entreprises en France",
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
const CADRE = "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";
const SECTION = "pt-28 sm:pt-36 lg:pt-44";
const H2 = "text-[clamp(26px,2.6vw,40px)] leading-[1.1] font-semibold tracking-[-0.035em] text-ink";
const LEAD = "text-[17px] sm:text-[20px] leading-relaxed text-gray-300";
const BOUTON = "inline-flex items-center justify-center h-12 px-6 rounded-lg text-[17px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const BOUTON_PLEIN = `${BOUTON} bg-indigo-600 hover:bg-indigo-700 text-on-accent`;
const BOUTON_DOUX = `${BOUTON} border border-ink/15 hover:border-ink/30 hover:bg-ink/5 text-ink`;
const LIENS = [
  ["#etapes", "Comment ça marche"],
  ["#fonctionnalites", "Fonctionnalités"],
  ["#tarifs", "Tarifs"],
  ["/experts-comptables", "Experts-comptables"],
  ["/blog", "Blog"],
] as const;

export default function LandingPage() {
  return (
    <div className={`ds-app ${policesApp} page-pleine accueil min-h-screen bg-ds-bg text-ink`}>
      {/* Mode nuit uniquement : retire le thème clair avant le premier affichage. */}
      <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.classList.remove("light")' }} />
      <ModeNuit />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Apparitions />

      {/* ── Barre ── */}
      <header className="sticky top-0 z-40 bg-ds-bg border-b border-ink/5">
        <div className={`${CADRE} grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-4 h-16 sm:h-[72px]`}>
          <Link href="/" aria-label="Deviso, accueil" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-indigo-600 text-on-accent grid place-items-center font-semibold text-[14px]" aria-hidden="true">D</span>
            <span className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Deviso</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium" aria-label="Navigation principale">
            {LIENS.map(([href, nom]) => (
              <Link key={href} href={href} className="text-gray-400 hover:text-ink transition-colors">{nom}</Link>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <Link href="/login" className="hidden sm:inline-flex items-center h-10 px-4 rounded-lg text-[14px] font-semibold text-gray-300 hover:text-ink transition-colors">Connexion</Link>
            <Link href="/signup" className="inline-flex items-center h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[14px] font-semibold transition-colors"><span className="sm:hidden">Essai gratuit</span><span className="hidden sm:inline">Essayer 14 jours gratuitement</span></Link>
            <details className="lg:hidden relative">
              <summary className="list-none [&::-webkit-details-marker]:hidden h-10 px-4 rounded-lg bg-ds-surface text-[14px] font-semibold text-ink flex items-center cursor-pointer">Menu</summary>
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl bg-ds-elevated p-2 shadow-ds-leve">
                {[...LIENS, ["/login", "Connexion"] as const].map(([href, nom]) => (
                  <Link key={href} href={href} className="block px-3 py-3 rounded-lg text-[17px] font-medium text-ink hover:bg-ds-surface">{nom}</Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>

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
                  <span className="block xl:whitespace-nowrap">Tes devis rédigés,</span>
                  <span className="block xl:whitespace-nowrap">tes factures conformes,</span>
                  <span className="block xl:whitespace-nowrap">tes relances envoyées.</span>
                </h1>
                <p className={`mt-6 max-w-[48ch] ${LEAD}`}>
                  Pour les indépendants et les petites entreprises, de la micro à la société. La plateforme agréée est
                  comprise&nbsp;: tes factures électroniques partent sans rien brancher ni payer en plus.
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
        <section id="pourquoi" className={`${CADRE} ${SECTION} scroll-mt-20`} aria-labelledby="titre-pourquoi">
          <PourquoiDeviso titre={H2} />
        </section>

        {/* ── L'application : ce que le parcours ne montre pas ── */}
        <section id="fonctionnalites" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <div className="reveal max-w-[760px]">
            <h2 className={H2}>Tes ventes, tes achats et tes prix, au même endroit.</h2>
            <p className={`mt-5 ${LEAD}`}>Ce que tu vends, ce que tu achètes et tes prix, sans un seul tableur.</p>
          </div>
          <div className="mt-12 sm:mt-16">
            <SlideFonctionnalites />
          </div>
        </section>

        {/* ── Réforme 2026 ── */}
        <section className={`${CADRE} ${SECTION}`} aria-labelledby="titre-reforme">
          <div className="reveal rounded-xl bg-blue-800 text-ink px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-8">
              <h2 id="titre-reforme" className="text-[clamp(28px,2.6vw,40px)] leading-[1.1] font-semibold tracking-[-0.035em]">La facture électronique, déjà en place.</h2>
              <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed max-w-[56ch]">
                Toute entreprise doit désormais pouvoir recevoir des factures électroniques, et les petites entreprises devront
                aussi les émettre. Avec Deviso, tu es prêt aux deux dates, sans rien installer.
              </p>
              <Link href="/conformite" className="mt-6 inline-flex items-center gap-2 text-[17px] font-semibold underline decoration-ink/40 underline-offset-4 hover:decoration-ink transition-colors">
                Comprendre la réforme <span aria-hidden="true">→</span>
              </Link>
              <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                {[
                  ["Le format officiel", "Chaque facture est un Factur-X : un PDF lisible par ton client, qui porte aussi les données lues par les logiciels."],
                  ["Le secteur public aussi", "Tes factures aux administrations sont déposées pour toi sur Chorus Pro, le portail de l'État."],
                ].map(([t, d]) => (
                  <li key={t}>
                    <div className="text-[17px] font-semibold">{t}</div>
                    <p className="mt-1.5 text-[17px] leading-relaxed text-ink/75">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
            <ol className="lg:col-span-4 lg:col-start-9 grid gap-4 self-start" aria-label="Calendrier de la réforme">
              {[
                ["Septembre 2026", "Toute entreprise doit pouvoir recevoir des factures électroniques."],
                ["Septembre 2027", "Les petites entreprises et les indépendants doivent aussi les émettre."],
              ].map(([d, t]) => (
                <li key={d} className="rounded-lg bg-ink/10 px-5 py-4">
                  <div className="text-[14px] font-semibold text-blue-200">{d}</div>
                  <div className="mt-1 text-[17px] leading-snug">{t}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Le mot du fondateur ──
            Remplace d'anciens témoignages fictifs : sur un produit encore en
            pré-lancement, sans clients réels, on dit la vérité. À remplacer
            par de vrais témoignages, avec accord, quand il y en aura. */}
        <section className={`${CADRE} ${SECTION}`} aria-labelledby="titre-fondateur">
          <div className="reveal grid gap-10 lg:grid-cols-12 lg:gap-16">
            <h2 id="titre-fondateur" className={`${H2} lg:col-span-5`}>Un fondateur qui te répond.</h2>
            <div className="lg:col-span-7">
              <p className="text-[20px] sm:text-[24px] leading-[1.5] tracking-[-0.01em] text-ink">
                J&apos;ai créé Deviso parce que je perdais trop de temps sur mes propres devis et factures, et parce que la réforme
                de la facturation électronique arrivait sans outil vraiment simple pour les indépendants et les petites entreprises.
              </p>
              <p className="mt-6 text-[17px] leading-relaxed text-gray-300 max-w-[62ch]">
                Je lis chaque message et j&apos;y réponds moi-même. Écris-moi avant même de t&apos;inscrire.
              </p>
              <div className="mt-8">
                <div className="text-[17px] font-semibold text-ink">Selim Albert, fondateur</div>
                <a href="mailto:support@getdeviso.fr" className="mt-1 inline-block text-[17px] text-indigo-400 hover:text-indigo-300 transition-colors">support@getdeviso.fr</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tarifs ── */}
        <section id="tarifs" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <TarifsTable />
        </section>

        {/* ── Questions avant de commencer ── */}
        <section id="faq" className={`${CADRE} ${SECTION} scroll-mt-20`} aria-labelledby="titre-faq">
          <FaqAccueil titre={H2} />
        </section>

        {/* ── Dernière action ── */}
        <section className={`${CADRE} ${SECTION} pb-16 sm:pb-20`} aria-labelledby="titre-action">
          <div className="reveal rounded-xl bg-ds-surface px-6 py-14 sm:px-12 sm:py-20 lg:px-16 lg:py-24 grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 id="titre-action" className={H2}>Essaie Deviso sur ton prochain devis.</h2>
              <p className={`mt-5 ${LEAD}`}>Essai gratuit de 14 jours, sans carte bancaire, résiliable à tout moment.</p>
            </div>
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
              <Link href="/signup" className={BOUTON_PLEIN}>Essayer 14 jours gratuitement</Link>
              <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
