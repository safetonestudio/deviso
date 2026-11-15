import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { DemoButton } from "@/components/landing/DemoButton";
import { Apparitions } from "@/components/landing/Apparitions";
import { DemoAnimee } from "@/components/landing/DemoAnimee";
import { SlideFonctionnalites } from "@/components/landing/SlideFonctionnalites";
import { TarifsTable } from "@/components/landing/TarifsTable";
import { ModeNuit } from "@/components/landing/ModeNuit";
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


/* Page d'accueil, refonte du 16/11/2026.
   Système : une police (Hanken Grotesk) en graisse moyenne ; six tailles
   (14, 17, 20, 24, titre de section, titre principal) ; angles de 8 à 10 px ;
   aucune ombre ni bordure décorative, les surfaces se distinguent par leur
   ton (fond, surface, surface relevée) ; un seul accent, le vert. Grands
   espaces entre sections. Références étudiées : Attio, Vercel, Ramp, Stripe,
   Plain, Clerk, Resend, Raycast. */
const CADRE = "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";
const SECTION = "pt-28 sm:pt-36 lg:pt-44";
const H2 = "text-[clamp(32px,3.4vw,52px)] leading-[1.06] font-semibold tracking-[-0.035em] text-ink";
const LEAD = "text-[17px] sm:text-[20px] leading-relaxed text-gray-300";
const BOUTON = "inline-flex items-center justify-center h-12 px-6 rounded-md text-[17px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const BOUTON_PLEIN = `${BOUTON} bg-indigo-600 hover:bg-indigo-700 text-on-accent`;
const BOUTON_DOUX = `${BOUTON} bg-ds-surface hover:bg-ds-elevated text-ink`;
const LIENS = [
  ["#fonctionnalites", "Fonctionnalités"],
  ["#comment", "Comment ça marche"],
  ["#tarifs", "Tarifs"],
  ["/experts-comptables", "Experts-comptables"],
  ["/blog", "Blog"],
] as const;

/** Le même devis à trois moments de sa vie : un fragment du produit. */
function CarteDevis({ etat, detail, ton }: { etat: string; detail: string; ton: "neutre" | "vert" | "plein" }) {
  const pastille =
    ton === "plein" ? "bg-indigo-600 text-on-accent" : ton === "vert" ? "bg-indigo-500/15 text-indigo-400" : "bg-ds-surface text-gray-300";
  return (
    <div data-ui className="rounded-md bg-ds-elevated p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-ink">DEV-2026-048</span>
        <span className={`text-[14px] font-semibold px-2.5 py-0.5 rounded-full ${pastille}`}>{etat}</span>
      </div>
      <div className="mt-1 text-[14px] text-gray-400">Cabinet Durand et Associés</div>
      <div className="mt-5 text-[24px] leading-none font-semibold tabular-nums text-ink">4 500 €</div>
      <div className="mt-2 text-[14px] text-gray-400">{detail}</div>
    </div>
  );
}

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
        {/* ── Haut de page ── */}
        <section className={`${CADRE} pt-16 sm:pt-24 lg:pt-28`}>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="lg:col-span-7 text-[clamp(36px,5.4vw,84px)] leading-[1.02] font-semibold tracking-[-0.045em] text-ink">
              Ton devis rédigé en 30&nbsp;secondes.
            </h1>
            <div className="lg:col-span-5 lg:pb-2">
              <p className={LEAD}>
                Décris ta mission en quelques mots, l&apos;IA rédige un devis complet et chiffré, prêt à signer. Factures Factur-X,
                relances et suivi URSSAF suivent, conformes à la réforme 2026.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <DemoButton className={`w-full sm:w-auto ${BOUTON_PLEIN}`} />
                <Link href="/signup?plan=solo" className={BOUTON_DOUX}>Essayer 14 jours gratuitement</Link>
              </div>
              <p className="mt-4 text-[14px] text-gray-400">Démo instantanée, sans carte bancaire.</p>
            </div>
          </div>
          <div className="mt-14 sm:mt-20">
            <DemoAnimee />
          </div>
        </section>

        {/* ── Conformité ── */}
        <section className={`${CADRE} pt-20 sm:pt-28`} aria-labelledby="titre-conformite">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-4">
              <h2 id="titre-conformite" className="text-[24px] leading-snug font-semibold tracking-[-0.02em] text-ink">Conforme à la réforme 2026</h2>
              <p className="mt-2 text-[17px] leading-relaxed text-gray-300">Les formats et les raccordements exigés, déjà en place.</p>
            </div>
            <dl className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ["Factur-X", "Chaque facture émise"],
                ["EN 16931", "La norme européenne"],
                ["PDF/A-3", "L'archivage des PDF"],
                ["Super PDP", "Plateforme agréée"],
                ["Chorus Pro", "Le secteur public"],
                ["URSSAF", "Un CA prêt à déclarer"],
              ].map(([nom, ligne]) => (
                <div key={nom} className="rounded-md bg-ds-surface px-5 py-4">
                  <dt className="text-[17px] font-semibold text-ink">{nom}</dt>
                  <dd className="mt-0.5 text-[14px] text-gray-400">{ligne}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Comment ça marche ── */}
        <section id="comment" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <div className="reveal max-w-[760px]">
            <h2 className={H2}>Du brief à l&apos;encaissement.</h2>
            <p className={`mt-5 ${LEAD}`}>Trois étapes, sans changer d&apos;outil.</p>
          </div>
          <ol className="mt-12 sm:mt-16 grid gap-2 lg:grid-cols-3">
            {steps.map((step, i) => {
              const carte = [
                { etat: "Brouillon", detail: "Rédigé par l'IA, à relire", ton: "neutre" as const },
                { etat: "Signé", detail: "Signé le 14/11/2026 à 10 h 42", ton: "vert" as const },
                { etat: "Payée", detail: "Facture Factur-X, encaissée le 02/12", ton: "plein" as const },
              ][i];
              return (
                <li key={step.title} className="reveal rounded-lg bg-ds-surface p-6 sm:p-8 flex flex-col gap-8" style={{ transitionDelay: `${i * 80}ms` }}>
                  <CarteDevis {...carte} />
                  <div>
                    <h3 className="text-[24px] leading-snug font-semibold tracking-[-0.02em] text-ink">{step.title}</h3>
                    <p className="mt-3 text-[17px] leading-relaxed text-gray-300">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── Fonctionnalités ── */}
        <section id="fonctionnalites" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <div className="reveal max-w-[760px]">
            <h2 className={H2}>Toute ta gestion, au même endroit.</h2>
            <p className={`mt-5 ${LEAD}`}>Ce que tes concurrents font à la main, Deviso le fait pour toi.</p>
          </div>
          <div className="mt-12 sm:mt-16">
            <SlideFonctionnalites />
          </div>
        </section>

        {/* ── Réforme 2026 ── */}
        <section className={`${CADRE} ${SECTION}`} aria-labelledby="titre-reforme">
          <div className="reveal rounded-lg bg-indigo-600 text-on-accent px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 grid gap-8 lg:grid-cols-12 lg:items-end">
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
          <div className="reveal rounded-lg bg-ds-surface px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 grid gap-8 lg:grid-cols-12 lg:items-end">
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
