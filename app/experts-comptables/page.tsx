import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { SiteFooter } from "@/components/SiteFooter";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { DemoButton } from "@/components/landing/DemoButton";
import {
  ShieldCheck,
  CalendarClock,
  Inbox,
  FileSpreadsheet,
  AlertTriangle,
  ScrollText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deviso pour les experts-comptables : vos clients micro et TPE, conformes à la réforme",
  description:
    "Un cockpit gratuit pour suivre tous vos clients micro et TPE depuis une seule interface : conformité à la réforme 2026, calendrier TVA, exports FEC et livre des recettes. Programme pilote gratuit.",
  alternates: { canonical: "https://getdeviso.fr/experts-comptables" },
  openGraph: {
    title: "Deviso pour les experts-comptables | Deviso",
    description:
      "Vos clients micro et TPE conformes à la réforme, suivis depuis un seul cockpit. Gratuit pour votre cabinet. Programme pilote.",
    url: "https://getdeviso.fr/experts-comptables",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso pour les experts-comptables" }],
  },
};

const CONTACT = "mailto:support@getdeviso.fr?subject=Deviso%20Cabinet%20-%20demande%20de%20d%C3%A9mo&body=Bonjour%2C%20je%20suis%20expert-comptable%20et%20j%27aimerais%20voir%20Deviso%20pour%20mes%20clients.";

const douleurs = [
  {
    icon: AlertTriangle,
    titre: "La réforme, c'est vous qu'on attend",
    desc: "La réception des factures électroniques est obligatoire depuis septembre 2026, l'émission arrive, et la tolérance s'arrête le 31 décembre 2026. La plupart de vos clients micro et TPE n'ont encore rien choisi et attendent que vous leur disiez quoi faire.",
  },
  {
    icon: ShieldCheck,
    titre: "Une mauvaise donnée, une facture rejetée",
    desc: "Un SIRET faux, un n° de TVA incohérent, une entreprise raccordée mais pas joignable à l'annuaire : c'est ce qui fait rejeter les factures à la plateforme. Multiplié par tout un portefeuille, c'est un risque difficile à surveiller à la main.",
  },
  {
    icon: Inbox,
    titre: "La course aux pièces, chaque période",
    desc: "Relancer les clients pour récupérer leurs factures de vente, ressaisir, attendre les retardataires. Quand le client facture dans Deviso, ses factures de vente sont déjà là, conformes et structurées. Il n'y a plus rien à réclamer.",
  },
];

const fonctions = [
  {
    icon: ShieldCheck,
    titre: "Tableau de conformité par client",
    desc: "D'un coup d'œil, qui peut émettre ET recevoir des factures conformes : raccordement à une plateforme, joignabilité à l'annuaire, SIRET, TVA. Les dossiers à régulariser avant la fin de la tolérance ressortent en premier.",
  },
  {
    icon: CalendarClock,
    titre: "Calendrier de TVA du portefeuille",
    desc: "Pour chaque dossier assujetti, la TVA de la dernière période close prête à déclarer et celle de la période en cours, selon sa périodicité. Sans ouvrir chaque dossier.",
  },
  {
    icon: AlertTriangle,
    titre: "File « à traiter »",
    desc: "Factures rejetées, impayés échus, trous de numérotation, SIREN client manquant, incohérences de TVA. Les anomalies de tout le portefeuille, triées par urgence.",
  },
  {
    icon: FileSpreadsheet,
    titre: "Exports comptables en un clic",
    desc: "FEC, CSV des factures, livre des recettes, pour un client, une sélection, ou tout le portefeuille en une archive. Même source que l'export du client, aucun écart.",
  },
  {
    icon: ScrollText,
    titre: "Journal des accès et signalements",
    desc: "Chaque consultation et chaque export sont tracés, pour vous seul. Et vous pointez une anomalie précise au client, qu'il voit dans son tableau de bord.",
  },
  {
    icon: Inbox,
    titre: "En lecture seule, sans vous connecter chez chacun",
    desc: "Vous voyez tous vos dossiers depuis votre propre interface, en lecture seule. Vos clients gardent la main sur leur facturation, vous gardez la vue d'ensemble.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Deviso pour les experts-comptables",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://getdeviso.fr/experts-comptables",
  description: metadata.description,
  inLanguage: "fr",
  audience: { "@type": "Audience", audienceType: "Experts-comptables en France" },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-site">
      <DonneesStructurees donnees={jsonLd} />

      {/* Bandeau réforme */}
      <div
        className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm"
        style={{ zIndex: 60 }}
      >
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">la tolérance s'arrête le 31 décembre 2026.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Équipez vos clients micro et TPE sans les quitter des yeux.</span>
      </div>

      {/* Navbar */}
      <nav className="fixed top-9 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-ink/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-ink font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-ink">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#pourquoi" className="text-gray-400 hover:text-ink transition-colors">Pourquoi</a>
            <a href="#cockpit" className="text-gray-400 hover:text-ink transition-colors">Le cockpit</a>
            <a href="#offre" className="text-gray-400 hover:text-ink transition-colors">L'offre</a>
            <Link href="/blog" className="text-gray-400 hover:text-ink transition-colors">Blog</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-ink transition-colors">Connexion</Link>
            <a href={CONTACT} className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors">
              Demander une démo
            </a>
          </div>
          <NavbarMobile />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-ds-surface border border-ds-border rounded-full px-3 py-1 text-xs text-gray-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Pour les cabinets d'expertise comptable
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-ink leading-tight tracking-tight">
            Vos clients micro et TPE, conformes à la réforme,
            <span className="block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">suivis depuis un seul cockpit</span>
          </h1>
          <p className="text-lg text-gray-400 mt-6 max-w-2xl mx-auto leading-relaxed">
            Deviso est un outil de facturation simple et conforme pour vos clients indépendants, micro et TPE.
            Vous les suivez tous depuis une interface dédiée, en lecture seule. Gratuit pour votre cabinet.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={CONTACT} className="inline-block bg-white text-black font-semibold px-8 py-3.5 rounded-xl hover:bg-zinc-100 transition-all">
              Demander une démo
            </a>
            <DemoButton
              label="Voir Deviso côté client"
              className="inline-block bg-ds-elevated text-gray-200 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-700 border border-ds-border transition-all"
            />
          </div>
          <p className="text-gray-600 text-sm mt-4">Cockpit cabinet gratuit · Programme pilote sans engagement</p>
        </div>
      </section>

      {/* Pourquoi */}
      <section id="pourquoi" className="py-20 px-4 sm:px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-ink text-center mb-3">Ce que la réforme change pour votre cabinet</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Le plus dur n'est pas votre logiciel de production, c'est d'amener tout un portefeuille de petits clients
            à être conforme, et de le rester.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {douleurs.map((d) => (
              <div key={d.titre} className="bg-ds-surface border border-ds-border rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <d.icon size={18} className="text-indigo-400" />
                </div>
                <h3 className="text-ink font-semibold mb-2">{d.titre}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Le cockpit */}
      <section id="cockpit" className="py-20 px-4 sm:px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-ink text-center mb-3">Un cockpit pensé pour un portefeuille</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour suivre vos clients, dans une seule interface. Gratuit, en lecture seule.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fonctions.map((f) => (
              <div key={f.titre} className="bg-ds-surface border border-ds-border rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <f.icon size={18} className="text-indigo-400" />
                </div>
                <h3 className="text-ink font-semibold mb-2">{f.titre}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* L'offre */}
      <section id="offre" className="py-20 px-4 sm:px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-ink text-center mb-3">Simple, et gratuit pour vous</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Vous ne changez rien à votre logiciel de production. Vous ajoutez un outil conforme pour vos petits clients,
            et un cockpit pour les suivre.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-ds-surface border border-ds-border rounded-2xl p-6">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Votre cabinet</p>
              <p className="text-2xl font-semibold text-ink mb-2">Gratuit</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Le cockpit, l'accès en lecture seule à chaque dossier, la conformité, le calendrier de TVA et les exports.
                Aucun coût pour le cabinet.
              </p>
            </div>
            <div className="bg-ds-surface border border-ds-border rounded-2xl p-6">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Vos clients</p>
              <p className="text-2xl font-semibold text-ink mb-2">18 à 34 €/mois</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Deviso complet pour le client : Solo 18 €/mois, Pro 34 €/mois, 14 jours d'essai. Factur-X, raccordement
                à la plateforme, relances, livre des recettes.
              </p>
            </div>
            <div className="bg-indigo-950/85 border border-indigo-500/40 ring-1 ring-indigo-500/20 rounded-2xl p-6">
              <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-2">Programme pilote</p>
              <p className="text-2xl font-semibold text-ink mb-2">Gratuit, sans engagement</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                On démarre petit : vous mettez 2 ou 3 clients sur Deviso, gratuitement, et on construit avec vous l'outil
                dont votre cabinet a vraiment besoin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-ink/[0.08] rounded-3xl p-12 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-ink mb-4">Prenons 20 minutes</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Je vous montre le cockpit, et surtout j'aimerais votre retour de professionnel. Si ça vous parle,
              on lance un pilote gratuit sur quelques-uns de vos clients.
            </p>
            <a href={CONTACT} className="inline-block bg-white text-black font-semibold text-lg px-10 py-4 rounded-xl hover:bg-zinc-100 transition-all">
              Demander une démo
            </a>
            <p className="text-gray-600 text-sm mt-4">Gratuit pour votre cabinet · Sans engagement</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
