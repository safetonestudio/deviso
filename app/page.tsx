import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { DemoButton } from "@/components/landing/DemoButton";
import { DevisVivant } from "@/components/landing/DevisVivant";
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


/* La page est une planche de tuiles pleines, serrees, sur le papier de l'app :
   memes couleurs, memes polices, meme vert. Chaque tuile porte une chose vraie
   (un devis, une signature, un chiffre, un tarif). Pas de degrade, pas de
   contour, pas d'ombre : les surfaces se distinguent par leur ton. */
const TUILE = "rounded-lg p-5 sm:p-7";
const H2 = "text-[clamp(32px,4vw,60px)] leading-[1.02] font-semibold tracking-[-0.03em]";
const LIENS = [
  ["#fonctionnalites", "Fonctionnalités"],
  ["#comment", "Comment ça marche"],
  ["#tarifs", "Tarifs"],
  ["/experts-comptables", "Experts-comptables"],
  ["/blog", "Blog"],
] as const;

/** Le meme devis, a trois moments de sa vie : la carte du produit. */
function CarteDevis({ etat, detail, ton }: { etat: string; detail: string; ton: "neutre" | "vert" | "plein" }) {
  const pastille =
    ton === "plein" ? "bg-indigo-600 text-on-accent" : ton === "vert" ? "bg-indigo-500/10 text-indigo-700" : "bg-gray-200 text-gray-700";
  return (
    <div data-ui className="ds-papier w-full max-w-[280px] rounded-lg p-4" style={{ backgroundColor: "#FFFFFF", color: "rgb(22 33 28)" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold">DEV-2026-048</span>
        <span className={`text-[13px] font-semibold px-2.5 py-0.5 rounded-full ${pastille}`}>{etat}</span>
      </div>
      <div className="text-[13px] text-gray-500 mt-1">Cabinet Durand et Associés</div>
      <div className="mt-3 text-[24px] leading-none font-semibold tabular-nums">4 500 €</div>
      <div className="mt-2 text-[13px] text-gray-500">{detail}</div>
    </div>
  );
}

export default function LandingPage() {
  const annee = new Date().getFullYear();
  return (
    <DashboardThemeProvider className={`${policesApp} min-h-screen bg-ds-bg text-ink`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-[1680px] px-2 sm:px-3 pb-3 overflow-x-clip">
        {/* ── Barre : le nom, quelques liens, une action ── */}
        <header className="flex items-center justify-between gap-4 h-16 px-3 sm:px-4">
          <Link href="/" className="text-[22px] font-bold tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Deviso
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium" aria-label="Navigation principale">
            {LIENS.map(([href, nom]) => (
              <Link key={href} href={href} className="text-ink hover:text-indigo-600 transition-colors">
                {nom}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggleIcone />
            <Link href="/login" className="hidden sm:inline-flex items-center h-11 px-4 rounded-lg text-[15px] font-semibold text-ink hover:bg-ds-surface transition-colors">
              Connexion
            </Link>
            <Link href="/signup?plan=solo" className="hidden sm:inline-flex items-center h-11 px-5 rounded-lg bg-ink text-(color:--ds-bg) text-[15px] font-semibold hover:opacity-90 transition-opacity">
              Essayer gratuitement
            </Link>
            <details className="lg:hidden relative">
              <summary className="list-none [&::-webkit-details-marker]:hidden h-11 px-4 rounded-lg bg-ds-surface text-[15px] font-semibold text-ink flex items-center cursor-pointer">
                Menu
              </summary>
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg bg-ds-surface p-2 shadow-ds-card">
                {[...LIENS, ["/login", "Connexion"] as const, ["/signup?plan=solo", "Essayer gratuitement"] as const].map(([href, nom]) => (
                  <Link key={href} href={href} className="block px-3 py-3 rounded-lg text-[16px] font-medium text-ink hover:bg-ds-elevated">
                    {nom}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </header>

        <main>
          {/* ── Premier écran : la promesse, le devis vivant, l'essai, la réforme ── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-2">
            <div className={`${TUILE} bg-ds-surface lg:col-span-7 lg:row-span-2 flex flex-col justify-between gap-10 lg:min-h-[440px]`}>
              <h1 className="text-[clamp(30px,4.4vw,76px)] leading-[1] font-bold tracking-[-0.04em] text-ink">
                Ton devis complet, rédigé en 30 secondes.
              </h1>
              <div>
                <p className="text-[clamp(18px,1.5vw,22px)] leading-relaxed text-ink max-w-[52ch]">
                  Tu écris ton projet en quelques mots, l&apos;IA rédige un devis complet, chiffré et personnalisé, prêt à envoyer.
                  Signature, Factur-X, relances et suivi URSSAF suivent, conformes à la réforme 2026.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row sm:items-start gap-2">
                  <DemoButton className="w-full sm:w-auto h-13 px-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[17px] font-semibold transition-colors" />
                  <Link href="/signup?plan=solo" className="inline-flex items-center justify-center h-13 px-7 rounded-lg bg-ds-elevated hover:bg-ds-bg text-ink text-[17px] font-semibold transition-colors">
                    Essayer gratuitement 14 jours
                  </Link>
                </div>
                <p className="mt-4 text-[15px] text-gray-400">Démo instantanée, 14 jours gratuits, sans carte bancaire.</p>
              </div>
            </div>

            <div className={`${TUILE} bg-indigo-950 lg:col-span-5 lg:row-span-3`}>
              <DevisVivant />
            </div>

            <Link href="/conformite" className={`${TUILE} bg-ink text-(color:--ds-bg) lg:col-span-4 flex flex-col justify-between gap-6 hover:opacity-95 transition-opacity`}>
              <p className="text-[clamp(20px,1.7vw,26px)] leading-snug font-semibold">
                Réforme 2026 : la facturation électronique entre entreprises devient obligatoire en France.
              </p>
              <span className="text-[16px] font-semibold underline underline-offset-4">Ce que ça change pour toi</span>
            </Link>

            <div className={`${TUILE} bg-indigo-600 text-on-accent lg:col-span-3 flex flex-col justify-between gap-6`}>
              <p className="text-[clamp(20px,1.7vw,26px)] leading-snug font-semibold">
                Deviso génère du Factur-X et s&apos;appuie sur une plateforme agréée.
              </p>
              <span className="text-[16px]">Rien à installer, rien à paramétrer.</span>
            </div>
          </section>

          {/* ── Comment ça marche : la même carte, trois champs ── */}
          <section id="comment" className="mt-24 sm:mt-36 scroll-mt-6">
            <div className="px-3 sm:px-4 mb-6 grid lg:grid-cols-12 gap-4 items-end">
              <h2 className={`${H2} text-ink lg:col-span-6`}>Comment ça marche</h2>
              <p className="text-[18px] text-ink lg:col-span-6">De la description à la facture signée en trois étapes.</p>
            </div>
            <ol className="grid lg:grid-cols-3 rounded-lg overflow-hidden">
              {steps.map((step, i) => {
                const fond = ["bg-ds-elevated text-ink", "bg-indigo-950 text-ink", "bg-indigo-600 text-on-accent"][i];
                const carte = [
                  { etat: "Brouillon", detail: "Rédigé par l'IA, à relire", ton: "neutre" as const },
                  { etat: "Signé", detail: "Signé le 14/11/2026 à 10 h 42", ton: "vert" as const },
                  { etat: "Payée", detail: "Facture Factur-X, encaissée le 02/12", ton: "plein" as const },
                ][i];
                return (
                  <li key={step.title} className={`${fond} p-5 sm:p-8 flex flex-col gap-10 lg:min-h-[520px]`}>
                    <CarteDevis {...carte} />
                    <div className="mt-auto">
                      <h3 className="text-[clamp(22px,2vw,30px)] leading-tight font-semibold tracking-[-0.02em]">{step.title}</h3>
                      <p className="mt-3 text-[17px] leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ── Fonctionnalités : gros plans sur le produit ── */}
          <section id="fonctionnalites" className="mt-24 sm:mt-36 scroll-mt-6 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-2">
            <div className={`${TUILE} bg-ink text-(color:--ds-bg) md:col-span-6 lg:col-span-6 flex flex-col justify-between gap-8 lg:min-h-[260px]`}>
              <h2 className={H2}>Tout ce dont tu as besoin</h2>
              <p className="text-[18px] max-w-[44ch]">Tout ce que tes concurrents font à la main, Deviso le fait automatiquement.</p>
            </div>

            {/* Devis par IA */}
            <article className={`${TUILE} bg-indigo-950 md:col-span-6 lg:col-span-6 lg:row-span-2 overflow-hidden flex flex-col justify-between gap-8`}>
              <div data-ui aria-hidden="true" className="-mr-16 sm:-mr-24 text-[clamp(34px,5.4vw,84px)]">
                <div className="rounded-[0.35em] bg-ds-surface p-[0.5em] text-[0.42em] leading-snug text-gray-400">
                  Refonte du site vitrine d&apos;un cabinet d&apos;avocats à Lyon, cinq pages, délai de trois semaines
                </div>
                <div className="mt-[0.3em] inline-flex items-center rounded-[0.3em] bg-indigo-600 text-on-accent font-semibold px-[0.7em] py-[0.35em] whitespace-nowrap">
                  Générer le devis
                </div>
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-ink">{features[0].title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink max-w-[58ch]">{features[0].desc}</p>
              </div>
            </article>

            {/* Signature */}
            <article className={`${TUILE} bg-ds-surface md:col-span-3 lg:col-span-3 overflow-hidden flex flex-col justify-between gap-8`}>
              <div data-ui aria-hidden="true">
                <svg viewBox="0 0 260 90" className="w-[120%] max-w-none text-ink" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 62c14-30 26-46 34-44 10 3-12 52-2 54 10 2 22-40 34-38 9 2-6 30 4 32 12 2 20-28 32-26 8 2-2 22 8 22 14 0 26-30 40-30 10 0 4 24 16 24 16 0 30-18 78-22" />
                </svg>
                <div className="mt-2 text-[15px] font-semibold text-indigo-600">Signé le 14/11/2026 à 10 h 42</div>
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-ink">{features[1].title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink">{features[1].desc}</p>
              </div>
            </article>

            {/* Relances */}
            <article className={`${TUILE} bg-ds-elevated md:col-span-3 lg:col-span-3 overflow-hidden flex flex-col justify-between gap-8`}>
              <div data-ui aria-hidden="true" className="flex gap-2 -mr-20 text-[clamp(30px,3.4vw,52px)] font-semibold tabular-nums whitespace-nowrap">
                <span className="rounded-[0.25em] bg-ds-surface text-ink px-[0.4em] py-[0.15em]">J+3</span>
                <span className="rounded-[0.25em] bg-indigo-600 text-on-accent px-[0.4em] py-[0.15em]">J+7</span>
                <span className="rounded-[0.25em] bg-ds-surface text-ink px-[0.4em] py-[0.15em]">J+14</span>
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-ink">{features[2].title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink">{features[2].desc}</p>
              </div>
            </article>

            {/* Factur-X et Plateforme Agréée */}
            <article className={`${TUILE} bg-indigo-600 text-on-accent md:col-span-6 lg:col-span-5 overflow-hidden flex flex-col justify-between gap-8`}>
              <div data-ui aria-hidden="true" className="flex gap-2 -mr-24 text-[clamp(26px,3vw,46px)] font-semibold whitespace-nowrap">
                <span className="rounded-[0.25em] bg-ds-surface text-gray-50 px-[0.45em] py-[0.2em]">Déposée</span>
                <span className="rounded-[0.25em] bg-ds-surface text-gray-50 px-[0.45em] py-[0.2em]">Reçue</span>
                <span className="rounded-[0.25em] bg-indigo-950 text-gray-50 px-[0.45em] py-[0.2em]">Encaissée</span>
              </div>
              <div>
                <h3 className="text-[22px] font-semibold">{features[3].title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed max-w-[62ch]">{features[3].desc}</p>
              </div>
            </article>

            {/* URSSAF */}
            <article className={`${TUILE} bg-ds-surface md:col-span-3 lg:col-span-3 overflow-hidden flex flex-col justify-between gap-8`}>
              <div data-ui aria-hidden="true">
                <div className="text-[15px] text-gray-400">CA du trimestre à ce jour</div>
                <div className="text-[clamp(56px,6.4vw,104px)] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink whitespace-nowrap">
                  6 200 €
                </div>
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-ink">{features[4].title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink max-w-[58ch]">{features[4].desc}</p>
              </div>
            </article>

            {/* Temps et catalogue */}
            <article className={`${TUILE} bg-indigo-950 md:col-span-3 lg:col-span-4 overflow-hidden flex flex-col justify-between gap-8`}>
              <div data-ui aria-hidden="true" className="flex flex-col items-start gap-3 -mr-20 whitespace-nowrap">
                <span className="text-[clamp(56px,6.4vw,104px)] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">2 h 30</span>
                <span className="rounded-lg bg-ds-surface text-ink text-[16px] font-semibold px-3 py-2">Atelier, la journée : 1 200 €</span>
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-ink">{features[5].title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink max-w-[58ch]">{features[5].desc}</p>
              </div>
            </article>
          </section>

          {/* ── Conformité : les noms, en grand ── */}
          <section className="mt-24 sm:mt-36 grid grid-cols-2 lg:grid-cols-4 gap-2" aria-labelledby="titre-conformite">
            <div className={`${TUILE} bg-indigo-600 text-on-accent col-span-2 lg:min-h-[220px] flex flex-col justify-between gap-6`}>
              <h2 id="titre-conformite" className={H2}>Conforme à la réforme 2026</h2>
              <Link href="/conformite" className="text-[16px] font-semibold underline underline-offset-4">Lire le détail de la conformité</Link>
            </div>
            {[
              ["Factur-X", "Le format de chaque facture émise."],
              ["EN 16931", "La norme européenne suivie."],
              ["PDF/A-3", "Le format d'archivage des PDF."],
              ["Super PDP", "La plateforme agréée, pour émettre et recevoir."],
              ["Chorus Pro", "Le dépôt pour le secteur public."],
              ["URSSAF", "Un chiffre d'affaires prêt à déclarer."],
            ].map(([nom, ligne], i) => (
              <div key={nom} className={`${TUILE} ${i % 3 === 1 ? "bg-ds-elevated" : "bg-ds-surface"} lg:min-h-[220px] flex flex-col justify-between gap-6`}>
                <div className="text-[clamp(24px,2.4vw,34px)] leading-none font-bold tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>{nom}</div>
                <p className="text-[16px] text-ink">{ligne}</p>
              </div>
            ))}
          </section>

          {/* ── Le mot du fondateur ──
              Remplace d'anciens témoignages fictifs : sur un produit encore en
              pré-lancement, sans clients réels, on dit la vérité. À remplacer
              par de vrais témoignages, avec accord, quand il y en aura. */}
          <section className="mt-24 sm:mt-36" aria-labelledby="titre-fondateur">
            <div className="px-3 sm:px-4 grid lg:grid-cols-12 gap-4">
              <h2 id="titre-fondateur" className={`${H2} text-ink lg:col-span-5`}>Le mot du fondateur</h2>
              <p className="text-[clamp(19px,1.6vw,22px)] leading-relaxed text-ink lg:col-span-7">
                J&apos;ai créé Deviso parce que je perdais trop de temps sur mes propres devis et factures, et parce que la réforme
                de la facturation électronique arrivait sans outil vraiment simple pour les indépendants et les petites structures.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-2">
              <div className={`${TUILE} bg-ds-surface lg:col-span-8 flex flex-col justify-between gap-8`}>
                <p className="text-[clamp(18px,1.5vw,21px)] leading-relaxed text-ink max-w-[62ch]">
                  Deviso est encore jeune : je le développe et l&apos;éprouve avec soin avant de l&apos;ouvrir largement. Si vous
                  l&apos;essayez maintenant, votre retour façonne directement ce qu&apos;il devient, écrivez-moi, je lis tout.
                </p>
                <div>
                  <div className="text-[20px] font-semibold text-ink">S. Albert</div>
                  <div className="text-[16px] text-gray-400">Fondateur de Deviso</div>
                </div>
              </div>
              <dl className={`${TUILE} bg-indigo-950 lg:col-span-4 grid grid-cols-2 gap-x-6 gap-y-7 content-between`}>
                {[
                  ["Essai", "14 jours gratuits, sans carte"],
                  ["Résiliation", "En un clic"],
                  ["Données", "Chiffrées, hébergées en Europe"],
                  ["Support", "Par chat, inclus"],
                ].map(([quoi, valeur]) => (
                  <div key={quoi}>
                    <dt className="text-[15px] text-gray-400">{quoi}</dt>
                    <dd className="mt-1 text-[18px] leading-snug font-semibold text-ink">{valeur}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* ── Tarifs ── */}
          <section id="tarifs" className="mt-24 sm:mt-36 scroll-mt-6">
            <TarifsTable />
          </section>

          {/* ── L'action : une rangée de la planche ── */}
          <section className="mt-24 sm:mt-36 grid grid-cols-1 lg:grid-cols-12 gap-2" aria-labelledby="titre-action">
            <div aria-hidden="true" className="hidden lg:block rounded-lg bg-indigo-950 lg:col-span-2 -ml-6" />
            <div className={`${TUILE} sm:p-10 bg-indigo-600 text-on-accent lg:col-span-8 lg:min-h-[360px] flex flex-col justify-center gap-5`}>
              <h2 id="titre-action" className="text-[clamp(30px,3.2vw,48px)] leading-[1.05] font-semibold tracking-[-0.03em] max-w-[20ch]">
                Prêt à envoyer ton prochain devis en 30 secondes ?
              </h2>
              <p className="text-[18px] max-w-[52ch]">Rejoins les freelances et petites équipes qui gèrent leur facturation avec Deviso.</p>
              <div>
                <Link href="/signup?plan=solo" className="inline-flex items-center h-13 px-7 rounded-lg bg-ds-surface text-gray-50 text-[17px] font-semibold hover:bg-ds-elevated transition-colors">
                  Commencer l&apos;essai gratuit
                </Link>
                <p className="mt-4 text-[15px]">14 jours gratuits, sans carte bancaire, résiliable à tout moment.</p>
              </div>
            </div>
            <div aria-hidden="true" className="hidden lg:block rounded-lg bg-ink lg:col-span-2 -mr-6" />
          </section>

          {/* ── Le nom, construit en grand ── */}
          <div aria-hidden="true" className="mt-24 sm:mt-36 flex items-end gap-1 h-[22svh] sm:h-[34svh] overflow-hidden">
            {"DEVISO".split("").map((lettre, i) => {
              const h = ["100%", "72%", "88%", "64%", "94%", "78%"][i];
              const fond = ["bg-ink text-(color:--ds-bg)", "bg-indigo-600 text-on-accent", "bg-ds-surface text-ink", "bg-indigo-950 text-ink", "bg-ink text-(color:--ds-bg)", "bg-indigo-600 text-on-accent"][i];
              return (
                <div key={i} className={`${fond} flex-1 rounded-lg flex items-end justify-center overflow-hidden`} style={{ height: h }}>
                  <span className="font-bold leading-[0.8] text-[clamp(64px,15vw,260px)]" style={{ fontFamily: "var(--font-display)" }}>{lettre}</span>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <SiteFooter />
      <p className="sr-only">Deviso {annee}</p>
    </DashboardThemeProvider>
  );
}
