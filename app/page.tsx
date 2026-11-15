import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { DemoButton } from "@/components/landing/DemoButton";
import Image from "next/image";
import { Apparitions } from "@/components/landing/Apparitions";
import { DemoAnimee } from "@/components/landing/DemoAnimee";
import { TarifsTable } from "@/components/landing/TarifsTable";
import { DashboardThemeProvider, ThemeToggleIcone } from "@/components/DashboardTheme";
import { policesApp } from "@/app/polices-app";

export const metadata: Metadata = {
  title: "Deviso, Logiciel devis et facturation pour freelances français",
  description:
    "Créez vos devis en 30 secondes avec l'IA, facturez en Factur-X (norme 2026) via une plateforme agréée, relances automatiques, suivi du CA URSSAF. Essai gratuit 14 jours.",
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
    "Logiciel de devis et facturation pour freelances et petites équipes en France. Devis IA, Factur-X, relances automatiques.",
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
    "Suivi du chiffre d'affaires URSSAF",
    "Relances automatiques",
  ],
  inLanguage: "fr",
  audience: {
    "@type": "Audience",
    audienceType: "Freelances et petites équipes en France",
  },
};

const features = [
  {
    title: "Devis par IA en 30 secondes",
    desc: "Tu décris ta mission en quelques phrases. L'IA génère un devis complet, chiffré, structuré, prêt à envoyer. Aucun logiciel concurrent ne fait ça.",
  },
  {
    title: "Signature électronique",
    desc: "Ton client reçoit un lien sécurisé, ouvre le devis sur son téléphone et signe en quelques secondes. Tu es notifié instantanément.",
  },
  {
    title: "Relances automatiques",
    desc: "Après 3, 7 ou 14 jours sans réponse, Deviso relance ton client à ta place. Tu configures le délai et le message, Deviso s'occupe du reste.",
  },
  {
    title: "Factur-X & Plateforme Agréée",
    desc: "Factures au format Factur-X (norme EN 16931), émises et reçues via Super PDP, la plateforme agréée. Suivi du cycle de vie de chaque facture, refus compris. Dépôt Chorus Pro pour le secteur public, sans quitter Deviso.",
  },
  {
    title: "Widget CA URSSAF",
    desc: "Ton chiffre d'affaires mensuel et trimestriel affiché en temps réel dans le tableau de bord. Tu sais exactement quoi déclarer, sans calculer.",
  },
  {
    title: "Suivi du temps & catalogue",
    desc: "Facture à l'heure ou au forfait. Catalogue de prestations réutilisable en un clic, avec sélecteur de durée directement dans le devis.",
  },
];

const steps = [
  {
    title: "Tu décris, l'IA génère",
    desc: "Quelques phrases sur ta mission. En 30 secondes, un devis complet avec les lignes, les prix et les conditions. Tu ajustes, tu envoies.",
  },
  {
    title: "Ton client reçoit et signe",
    desc: "Il reçoit un lien sécurisé, ouvre le devis depuis son téléphone, signe en quelques secondes. Tu reçois une notification dès qu'il a signé.",
  },
  {
    title: "Tu factures, tu encaisses, tu déclares",
    desc: "1 clic pour convertir en facture Factur-X conforme. Ton CA s'actualise en temps réel. Si ça traîne, Deviso relance ton client à ta place.",
  },
];


/* Mise en forme inspirée des sites de référence (Linear, Pennylane) :
   titre à gauche, le vrai produit en grand dessous, de l'air entre les
   sections, des cartes à relief qui montrent chacune une vraie capture de
   l'application. Couleurs, polices et relief sont ceux de l'app. */
const CADRE = "mx-auto w-full max-w-[1560px] px-5 sm:px-8 lg:px-10";
const H2 = "text-[clamp(30px,3.6vw,54px)] leading-[1.05] font-semibold tracking-[-0.03em] text-ink";
const CARTE = "relative overflow-hidden rounded-2xl bg-ds-surface border border-ds-border shadow-ds-card";
const LIENS = [
  ["#fonctionnalites", "Fonctionnalités"],
  ["#comment", "Comment ça marche"],
  ["#tarifs", "Tarifs"],
  ["/experts-comptables", "Experts-comptables"],
  ["/blog", "Blog"],
] as const;

/** Une vraie capture de l'application, dans le thème du visiteur. */
function Capture({ nom, alt, priority = false, className = "", style }: { nom: string; alt: string; priority?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <>
      <Image src={`/landing/${nom}-clair.jpg`} alt={alt} width={2880} height={1800} priority={priority} quality={90} sizes="(min-width: 1800px) 3400px, (min-width: 1024px) 1700px, 100vw" className={`capture-clair ${className}`} style={style} />
      <Image src={`/landing/${nom}-sombre.jpg`} alt="" aria-hidden="true" width={2880} height={1800} priority={priority} quality={90} sizes="(min-width: 1800px) 3400px, (min-width: 1024px) 1700px, 100vw" className={`capture-sombre ${className}`} style={style} />
    </>
  );
}

/** Petite étiquette flottante posée sur une capture. */
function Etiquette({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute z-10 rounded-xl bg-ds-surface border border-ds-border shadow-ds-leve px-4 py-3 text-[14px] font-semibold text-ink ${className}`}>
      {children}
    </div>
  );
}

/** Le même devis à trois moments de sa vie. */
function CarteDevis({ etat, detail, ton }: { etat: string; detail: string; ton: "neutre" | "vert" | "plein" }) {
  const pastille =
    ton === "plein" ? "bg-indigo-600 text-on-accent" : ton === "vert" ? "bg-indigo-500/10 text-indigo-400" : "bg-ds-elevated text-gray-300";
  return (
    <div className="rounded-xl bg-ds-surface border border-ds-border shadow-ds-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-ink">DEV-2026-048</span>
        <span className={`text-[13px] font-semibold px-2.5 py-0.5 rounded-full ${pastille}`}>{etat}</span>
      </div>
      <div className="text-[13px] text-gray-400 mt-1">Cabinet Durand et Associés</div>
      <div className="mt-4 text-[28px] leading-none font-semibold tabular-nums text-ink">4 500 €</div>
      <div className="mt-2 text-[13px] text-gray-400">{detail}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <DashboardThemeProvider className={`${policesApp} page-pleine min-h-screen bg-ds-bg text-ink`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Apparitions />

      {/* ── Barre ── */}
      <header className="sticky top-0 z-40 bg-ds-bg/85 backdrop-blur-md border-b border-ds-border">
        <div className={`${CADRE} flex items-center justify-between gap-4 h-16`}>
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-on-accent grid place-items-center font-bold text-[15px]" style={{ fontFamily: "var(--font-display)" }}>D</span>
            <span className="text-[20px] font-bold tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>Deviso</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium" aria-label="Navigation principale">
            {LIENS.map(([href, nom]) => (
              <Link key={href} href={href} className="text-gray-300 hover:text-ink transition-colors">{nom}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggleIcone />
            <Link href="/login" className="hidden sm:inline-flex items-center h-10 px-4 rounded-lg text-[15px] font-semibold text-ink hover:bg-ds-elevated transition-colors">Connexion</Link>
            <Link href="/signup?plan=solo" className="hidden sm:inline-flex items-center h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[15px] font-semibold transition-colors">Essayer gratuitement</Link>
            <details className="lg:hidden relative">
              <summary className="list-none [&::-webkit-details-marker]:hidden h-10 px-4 rounded-lg border border-ds-border bg-ds-surface text-[15px] font-semibold text-ink flex items-center cursor-pointer">Menu</summary>
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl bg-ds-surface border border-ds-border p-2 shadow-ds-leve">
                {[...LIENS, ["/login", "Connexion"] as const, ["/signup?plan=solo", "Essayer gratuitement"] as const].map(([href, nom]) => (
                  <Link key={href} href={href} className="block px-3 py-3 rounded-lg text-[16px] font-medium text-ink hover:bg-ds-elevated">{nom}</Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>
        {/* ── Haut de page : le titre, puis le vrai produit en grand ── */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="halo-accueil absolute inset-x-0 top-0 h-[900px] pointer-events-none" />
          <div className={`${CADRE} relative pt-10 sm:pt-12`}>
            <h1 className="text-[clamp(34px,4.6vw,70px)] leading-[1.04] font-bold tracking-[-0.04em] text-ink max-w-[1100px]">
              Ton devis complet, rédigé en 30&nbsp;secondes.
            </h1>
            <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <p className="text-[clamp(17px,1.35vw,21px)] leading-relaxed text-gray-300 max-w-[56ch]">
                Tu écris ton projet en quelques mots, l&apos;IA rédige un devis complet, chiffré et personnalisé, prêt à envoyer.
                Signature, Factur-X, relances et suivi URSSAF suivent, conformes à la réforme 2026.
              </p>
              <div className="shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <DemoButton className="w-full sm:w-auto h-13 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[16px] font-semibold shadow-ds-card transition-colors" />
                  <Link href="/signup?plan=solo" className="inline-flex items-center justify-center h-13 px-7 rounded-xl bg-ds-surface border border-ds-border hover:bg-ds-elevated text-ink text-[16px] font-semibold shadow-ds-sm transition-colors">
                    Essayer gratuitement 14 jours
                  </Link>
                </div>
                <p className="mt-3 text-[14px] text-gray-400">Démo instantanée, 14 jours gratuits, sans carte bancaire.</p>
              </div>
            </div>

            <div className="relative mt-9 sm:mt-10 pb-16 sm:pb-24">
              <DemoAnimee />
            </div>
          </div>
        </section>

        {/* ── Conformité, en une ligne ── */}
        <section className="border-y border-ds-border bg-ds-surface" aria-label="Conformité">
          <div className={`${CADRE} py-7 flex flex-wrap items-center gap-x-10 gap-y-3`}>
            <span className="text-[15px] text-gray-400">Conforme à la réforme 2026</span>
            {["Factur-X", "EN 16931", "PDF/A-3", "Super PDP, plateforme agréée", "Chorus Pro", "Suivi URSSAF"].map((n) => (
              <span key={n} className="text-[17px] font-semibold tracking-[-0.01em] text-ink" style={{ fontFamily: "var(--font-display)" }}>{n}</span>
            ))}
          </div>
        </section>

        {/* ── Comment ça marche ── */}
        <section id="comment" className={`${CADRE} pt-16 sm:pt-24 scroll-mt-20`}>
          <div className="reveal max-w-[860px]">
            <h2 className={H2}>Comment ça marche</h2>
            <p className="mt-4 text-[19px] leading-relaxed text-gray-300">De la description à la facture signée en trois étapes.</p>
          </div>
          <ol className="mt-10 grid gap-5 lg:grid-cols-3">
            {steps.map((step, i) => {
              const carte = [
                { etat: "Brouillon", detail: "Rédigé par l'IA, à relire", ton: "neutre" as const },
                { etat: "Signé", detail: "Signé le 14/11/2026 à 10 h 42", ton: "vert" as const },
                { etat: "Payée", detail: "Facture Factur-X, encaissée le 02/12", ton: "plein" as const },
              ][i];
              return (
                <li key={step.title} className="reveal rounded-2xl bg-ds-elevated border border-ds-border p-6 sm:p-7 flex flex-col gap-6" style={{ transitionDelay: `${i * 90}ms` }}>
                  <CarteDevis {...carte} />
                  <div>
                    <h3 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink">{step.title}</h3>
                    <p className="mt-3 text-[16px] leading-relaxed text-gray-300">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── Fonctionnalités : une carte, une vraie capture ── */}
        <section id="fonctionnalites" className={`${CADRE} pt-16 sm:pt-24 scroll-mt-20`}>
          <div className="reveal max-w-[860px]">
            <h2 className={H2}>Tout ce dont tu as besoin</h2>
            <p className="mt-4 text-[19px] leading-relaxed text-gray-300">Tout ce que tes concurrents font à la main, Deviso le fait automatiquement.</p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-12">
            {/* Devis par IA : la seule carte qui montre une capture */}
            <article className={`reveal ${CARTE} lg:col-span-7 lg:row-span-2 flex flex-col`}>
              <div className="p-7 sm:p-8">
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{features[0].title}</h3>
                <p className="mt-2.5 text-[16px] leading-relaxed text-gray-300 max-w-[56ch]">{features[0].desc}</p>
              </div>
              <div className="relative mt-auto h-[240px] sm:h-[280px] ml-7 sm:ml-8 rounded-tl-xl border-l border-t border-ds-border overflow-hidden shadow-ds-card">
                <Capture nom="devis" alt="Un devis rédigé dans Deviso, avec ses lignes, ses prix et ses conditions" className="absolute max-w-none w-[1500px] h-auto" style={{ left: -300, top: -210 }} />
              </div>
              <Etiquette className="hidden sm:block bottom-6 right-6">Rédigé en 30 secondes</Etiquette>
            </article>

            {/* Signature */}
            <article className={`reveal ${CARTE} lg:col-span-5 p-7 sm:p-8`}>
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{features[1].title}</h3>
                <svg viewBox="0 0 260 90" aria-hidden="true" className="shrink-0 w-28 -mt-2 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 62c14-30 26-46 34-44 10 3-12 52-2 54 10 2 22-40 34-38 9 2-6 30 4 32 12 2 20-28 32-26 8 2-2 22 8 22 14 0 26-30 40-30 10 0 4 24 16 24 16 0 30-18 78-22" />
                </svg>
              </div>
              <p className="mt-2.5 text-[16px] leading-relaxed text-gray-300">{features[1].desc}</p>
            </article>

            {/* Relances */}
            <article className={`reveal ${CARTE} lg:col-span-5 p-7 sm:p-8`}>
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{features[2].title}</h3>
                <div className="shrink-0 flex gap-1.5 text-[13px] font-semibold tabular-nums" aria-hidden="true">
                  <span className="px-2 py-1 rounded-md bg-ds-elevated border border-ds-border text-gray-300">J+3</span>
                  <span className="px-2 py-1 rounded-md bg-indigo-600 text-on-accent">J+7</span>
                  <span className="px-2 py-1 rounded-md bg-ds-elevated border border-ds-border text-gray-300">J+14</span>
                </div>
              </div>
              <p className="mt-2.5 text-[16px] leading-relaxed text-gray-300">{features[2].desc}</p>
            </article>

            {/* Factur-X, URSSAF, temps et catalogue : trois cartes de texte */}
            {[3, 4, 5].map((i) => (
              <article key={features[i].title} className={`reveal ${CARTE} lg:col-span-4 p-7 sm:p-8`}>
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{features[i].title}</h3>
                <p className="mt-2.5 text-[16px] leading-relaxed text-gray-300">{features[i].desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Réforme 2026 : la bande verte ── */}
        <section className={`${CADRE} pt-16 sm:pt-24`}>
          <div className="reveal rounded-3xl bg-indigo-600 text-on-accent p-8 sm:p-10 lg:p-14 grid gap-8 lg:grid-cols-12 items-end shadow-ds-leve">
            <div className="lg:col-span-8">
              <h2 className="text-[clamp(26px,2.8vw,42px)] leading-[1.08] font-semibold tracking-[-0.03em]">
                Réforme 2026 : la facturation électronique entre entreprises devient obligatoire.
              </h2>
              <p className="mt-5 text-[19px] leading-relaxed max-w-[52ch]">Deviso génère du Factur-X et s&apos;appuie sur une plateforme agréée.</p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link href="/conformite" className="inline-flex items-center h-13 px-7 rounded-xl bg-ds-surface text-gray-50 text-[16px] font-semibold hover:bg-ds-elevated transition-colors">
                En savoir plus
              </Link>
            </div>
          </div>
        </section>

        {/* ── Le mot du fondateur ──
            Remplace d'anciens témoignages fictifs : sur un produit encore en
            pré-lancement, sans clients réels, on dit la vérité. À remplacer
            par de vrais témoignages, avec accord, quand il y en aura. */}
        <section className={`${CADRE} pt-16 sm:pt-24`} aria-labelledby="titre-fondateur">
          <div className="reveal grid gap-10 lg:grid-cols-12">
            <h2 id="titre-fondateur" className={`${H2} lg:col-span-4`}>Le mot du fondateur</h2>
            <div className="lg:col-span-8">
              <p className="text-[clamp(19px,1.6vw,24px)] leading-[1.45] tracking-[-0.01em] text-ink">
                J&apos;ai créé Deviso parce que je perdais trop de temps sur mes propres devis et factures, et parce que la réforme
                de la facturation électronique arrivait sans outil vraiment simple pour les indépendants et les petites structures.
              </p>
              <p className="mt-6 text-[18px] leading-relaxed text-gray-300 max-w-[62ch]">
                Deviso est encore jeune : je le développe et l&apos;éprouve avec soin avant de l&apos;ouvrir largement. Si vous
                l&apos;essayez maintenant, votre retour façonne directement ce qu&apos;il devient, écrivez-moi, je lis tout.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/15 text-indigo-400 font-semibold grid place-items-center">SA</div>
                <div>
                  <div className="text-[17px] font-semibold text-ink">S. Albert</div>
                  <div className="text-[15px] text-gray-400">Fondateur de Deviso</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tarifs ── */}
        <section id="tarifs" className={`${CADRE} pt-16 sm:pt-24 scroll-mt-20`}>
          <div className="reveal">
            <TarifsTable />
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-gray-300">
            <li>14 jours gratuits, sans carte</li>
            <li>Résiliable en un clic</li>
            <li>Données chiffrées, hébergées en Europe</li>
            <li>Support par chat inclus</li>
          </ul>
        </section>

        {/* ── Dernière action ── */}
        <section className={`${CADRE} py-16 sm:py-24`} aria-labelledby="titre-action">
          <div className="reveal rounded-3xl bg-ds-surface border border-ds-border shadow-ds-leve p-8 sm:p-12 lg:p-14 text-center">
            <h2 id="titre-action" className={`${H2} mx-auto max-w-[20ch]`}>Prêt à envoyer ton prochain devis en 30 secondes ?</h2>
            <p className="mt-5 text-[19px] text-gray-300">Rejoins les freelances et petites équipes qui gèrent leur facturation avec Deviso.</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup?plan=solo" className="inline-flex items-center justify-center w-full sm:w-auto h-13 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[16px] font-semibold shadow-ds-card transition-colors">
                Commencer l&apos;essai gratuit
              </Link>
              <DemoButton className="w-full sm:w-auto h-13 px-8 rounded-xl bg-ds-elevated border border-ds-border hover:bg-ds-bg text-ink text-[16px] font-semibold transition-colors" />
            </div>
            <p className="mt-4 text-[14px] text-gray-400">14 jours gratuits, sans carte bancaire, résiliable à tout moment.</p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </DashboardThemeProvider>
  );
}
