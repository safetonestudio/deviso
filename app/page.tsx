import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { DemoButton } from "@/components/landing/DemoButton";
import { Apparitions } from "@/components/landing/Apparitions";
import { ParcoursDocument } from "@/components/landing/ParcoursDocument";
import { SlideFonctionnalites } from "@/components/landing/SlideFonctionnalites";
import { TarifsTable } from "@/components/landing/TarifsTable";
import { ModeNuit } from "@/components/landing/ModeNuit";
import { policesApp } from "@/app/polices-app";

export const metadata: Metadata = {
  title: "Deviso, logiciel de devis et factures pour indépendants et petites entreprises",
  description:
    "Créez vos devis en 30 secondes avec l'IA, facturez en Factur-X (norme 2026) via une plateforme agréée, relances automatiques, chiffre d'affaires, TVA et échéances suivis pour vous. Essai gratuit 14 jours.",
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
const H2 = "text-[clamp(32px,3.4vw,52px)] leading-[1.06] font-semibold tracking-[-0.035em] text-ink";
const LEAD = "text-[17px] sm:text-[20px] leading-relaxed text-gray-300";
const BOUTON = "inline-flex items-center justify-center h-12 px-6 rounded-md text-[17px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const BOUTON_PLEIN = `${BOUTON} bg-indigo-600 hover:bg-indigo-700 text-on-accent`;
const BOUTON_DOUX = `${BOUTON} bg-ds-surface hover:bg-ds-elevated text-ink`;
const LIENS = [
  ["#parcours", "Comment ça marche"],
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
      <header className="sticky top-0 z-40 bg-ds-bg">
        <div className={`${CADRE} flex items-center justify-between gap-4 h-16 sm:h-[72px]`}>
          <Link href="/" aria-label="Deviso, accueil" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-indigo-600 text-on-accent grid place-items-center font-semibold text-[14px]" aria-hidden="true">D</span>
            <span className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Deviso</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium" aria-label="Navigation principale">
            {LIENS.map(([href, nom]) => (
              <Link key={href} href={href} className="text-gray-400 hover:text-ink transition-colors">{nom}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex items-center h-10 px-4 rounded-md text-[14px] font-semibold text-gray-300 hover:text-ink transition-colors">Connexion</Link>
            <Link href="/signup?plan=solo" className="hidden sm:inline-flex items-center h-10 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[14px] font-semibold transition-colors">Essayer gratuitement</Link>
            <details className="lg:hidden relative">
              <summary className="list-none [&::-webkit-details-marker]:hidden h-10 px-4 rounded-md bg-ds-surface text-[14px] font-semibold text-ink flex items-center cursor-pointer">Menu</summary>
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg bg-ds-elevated p-2 shadow-ds-leve">
                {[...LIENS, ["/login", "Connexion"] as const, ["/signup?plan=solo", "Essayer gratuitement"] as const].map(([href, nom]) => (
                  <Link key={href} href={href} className="block px-3 py-3 rounded-md text-[17px] font-medium text-ink hover:bg-ds-surface">{nom}</Link>
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
                <h1 className="text-[clamp(40px,4.2vw,62px)] leading-[1.03] font-semibold tracking-[-0.045em] text-ink">
                  Ton devis rédigé en 30&nbsp;secondes.
                </h1>
                <p className={`mt-6 max-w-[44ch] ${LEAD}`}>
                  Décris ta mission en quelques mots, au clavier ou à la voix. L&apos;IA rédige un devis complet et chiffré à partir de
                  ton catalogue ; la signature, la facture Factur-X et tes déclarations suivent.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <DemoButton className={`w-full sm:w-auto ${BOUTON_PLEIN}`} />
                  <Link href="/signup?plan=solo" className={BOUTON_DOUX}>Essayer 14 jours gratuitement</Link>
                </div>
                <p className="mt-4 text-[14px] text-gray-400">Démo instantanée, sans carte bancaire.</p>
              </div>
            }
          />
        </section>

        {/* ── L'application ── */}
        <section id="fonctionnalites" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <div className="reveal max-w-[760px]">
            <h2 className={H2}>Et tout le reste, dans ton espace.</h2>
            <p className={`mt-5 ${LEAD}`}>Les écrans de Deviso, tels que tu les utiliseras chaque jour.</p>
          </div>
          <div className="mt-12 sm:mt-16">
            <SlideFonctionnalites />
          </div>
        </section>

        {/* ── Réforme 2026 ── */}
        <section className={`${CADRE} ${SECTION}`} aria-labelledby="titre-reforme">
          <div className="reveal rounded-lg bg-blue-800 text-ink px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h2 id="titre-reforme" className="text-[clamp(32px,3.4vw,52px)] leading-[1.06] font-semibold tracking-[-0.035em]">Prêt pour la réforme 2026.</h2>
              <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed max-w-[56ch]">
                La facturation électronique entre entreprises devient obligatoire en France. Deviso génère du Factur-X et passe
                par une plateforme agréée : tu n&apos;as rien à installer.
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link href="/conformite" className={`${BOUTON} bg-ink text-(color:--ds-bg) hover:opacity-90`}>Comprendre la réforme</Link>
            </div>
            <ul className="lg:col-span-12 flex flex-wrap gap-x-8 gap-y-2 pt-8 text-[17px] font-semibold">
              {["Factur-X", "EN 16931", "PDF/A-3", "Plateforme agréée Super PDP", "Chorus Pro", "Export FEC"].map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Le mot du fondateur ──
            Remplace d'anciens témoignages fictifs : sur un produit encore en
            pré-lancement, sans clients réels, on dit la vérité. À remplacer
            par de vrais témoignages, avec accord, quand il y en aura. */}
        <section className={`${CADRE} ${SECTION}`} aria-labelledby="titre-fondateur">
          <div className="reveal grid gap-10 lg:grid-cols-12">
            <h2 id="titre-fondateur" className={`${H2} lg:col-span-4`}>Le mot du fondateur</h2>
            <div className="lg:col-span-8">
              <p className="text-[20px] sm:text-[24px] leading-[1.5] tracking-[-0.01em] text-ink">
                J&apos;ai créé Deviso parce que je perdais trop de temps sur mes propres devis et factures, et parce que la réforme
                de la facturation électronique arrivait sans outil vraiment simple pour les indépendants et les petites structures.
              </p>
              <p className="mt-6 text-[17px] leading-relaxed text-gray-300 max-w-[62ch]">
                Deviso est encore jeune : je le développe et l&apos;éprouve avec soin avant de l&apos;ouvrir largement. Si vous
                l&apos;essayez maintenant, votre retour façonne directement ce qu&apos;il devient, écrivez-moi, je lis tout.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-ds-surface text-indigo-400 text-[17px] font-semibold grid place-items-center" aria-hidden="true">SA</div>
                <div>
                  <div className="text-[17px] font-semibold text-ink">S. Albert</div>
                  <div className="text-[14px] text-gray-400">Fondateur de Deviso</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tarifs ── */}
        <section id="tarifs" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <TarifsTable />
        </section>

        {/* ── Dernière action ── */}
        <section className={`${CADRE} ${SECTION} pb-28 sm:pb-36`} aria-labelledby="titre-action">
          <div className="reveal rounded-lg bg-ds-surface px-6 py-14 sm:px-12 sm:py-20 lg:px-16 lg:py-24 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 id="titre-action" className={H2}>Ton prochain devis, en 30 secondes.</h2>
              <p className={`mt-5 ${LEAD}`}>Essai gratuit de 14 jours, sans carte bancaire, résiliable à tout moment.</p>
            </div>
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
              <Link href="/signup?plan=solo" className={BOUTON_PLEIN}>Commencer l&apos;essai</Link>
              <DemoButton className={`w-full sm:w-auto ${BOUTON} bg-ds-elevated hover:bg-ds-bg text-ink`} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
