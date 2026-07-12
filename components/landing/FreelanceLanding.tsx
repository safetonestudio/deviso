import Link from "next/link";
import type { Metadata } from "next";
import { NavbarMobile } from "@/components/NavbarMobile";
import { DemoButton } from "@/components/landing/DemoButton";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export interface MockupLine {
  desc: string;
  qty: string;
  price: string;
}

export interface PainPoint {
  icon: string;
  title: string;
  desc: string;
}

export interface FreelanceLandingProps {
  // SEO
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  // Hero
  professionLabel: string; // "graphiste freelance"
  heroTitle: string; // "Tes devis de graphiste"
  heroHighlight: string; // "en 30 secondes"
  heroSubtitle: string;
  // Pain points section
  painPoints: PainPoint[];
  // Mockup
  mockupPrompt: string;
  mockupClient: string;
  mockupRef: string;
  mockupLines: MockupLine[];
  mockupTotal: string;
}

const steps = [
  {
    num: "01",
    title: "Tu décris, l'IA génère",
    desc: "Quelques phrases sur ta mission. En 30 secondes, un devis complet avec les lignes, les prix et les conditions. Tu ajustes, tu envoies.",
  },
  {
    num: "02",
    title: "Ton client reçoit et signe",
    desc: "Il reçoit un lien sécurisé, ouvre le devis depuis son téléphone, signe en quelques secondes. Tu reçois une notification dès qu'il a signé.",
  },
  {
    num: "03",
    title: "Tu factures, tu encaisses, tu déclares",
    desc: "1 clic pour convertir en facture Factur-X conforme. Ton CA s'actualise en temps réel. Si ça traîne, Deviso relance ton client à ta place.",
  },
];

const features = [
  {
    icon: "⚡",
    title: "Devis par IA en 30 secondes",
    desc: "Tu décris ta mission en quelques phrases. L'IA génère un devis complet, chiffré, structuré, prêt à envoyer. Aucun logiciel concurrent ne fait ça.",
  },
  {
    icon: "✍️",
    title: "Signature électronique",
    desc: "Ton client reçoit un lien sécurisé, ouvre le devis sur son téléphone et signe en quelques secondes. Tu es notifié instantanément.",
  },
  {
    icon: "🔔",
    title: "Relances automatiques",
    desc: "Après 3, 7 ou 14 jours sans réponse, Deviso relance ton client à ta place. Tu configures le délai et le message, Deviso s'occupe du reste.",
  },
  {
    icon: "📄",
    title: "Factur-X + Chorus Pro",
    desc: "Facture électronique conforme à la réforme 2026 en 1 clic. Dépôt Chorus Pro pour le secteur public directement depuis la facture.",
  },
  {
    icon: "📊",
    title: "Widget CA URSSAF",
    desc: "Ton chiffre d'affaires mensuel et trimestriel affiché en temps réel. Tu sais exactement quoi déclarer, sans calculer.",
  },
  {
    icon: "🧾",
    title: "Factures acompte & solde",
    desc: "Facturez en deux temps : un acompte à la commande, le solde à la livraison. Numérotation automatique, PDFs conformes générés.",
  },
];

const metierLinks = [
  { label: "Graphiste freelance", href: "/freelance-graphiste" },
  { label: "Développeur web", href: "/freelance-developpeur" },
  { label: "Consultant indépendant", href: "/freelance-consultant" },
  { label: "Photographe freelance", href: "/freelance-photographe" },
  { label: "Rédacteur & copywriter", href: "/freelance-redacteur" },
  { label: "Formateur indépendant", href: "/freelance-formateur" },
  { label: "Artisan BTP", href: "/freelance-artisan" },
  { label: "Community manager", href: "/freelance-community-manager" },
  { label: "Coach freelance", href: "/freelance-coach" },
  { label: "Traducteur freelance", href: "/freelance-traducteur" },
];

export function FreelanceLanding({
  metaTitle,
  metaDescription,
  canonical,
  professionLabel,
  heroTitle,
  heroHighlight,
  heroSubtitle,
  painPoints,
  mockupPrompt,
  mockupClient,
  mockupRef,
  mockupLines,
  mockupTotal,
}: FreelanceLandingProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Deviso",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: canonical,
    description: metaDescription,
    offers: [
      { "@type": "Offer", name: "Solo", price: "18", priceCurrency: "EUR", billingIncrement: "P1M" },
      { "@type": "Offer", name: "Pro", price: "34", priceCurrency: "EUR", billingIncrement: "P1M" },
    ],
    inLanguage: "fr",
    audience: {
      "@type": "Audience",
      audienceType: `${professionLabel.charAt(0).toUpperCase() + professionLabel.slice(1)}s en France`,
    },
  };

  return (
    <div className="min-h-screen bg-ds-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Bandeau réforme 2026 ── */}
      <div
        className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm"
        style={{ zIndex: 60 }}
      >
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire en France.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X, sans rien faire de votre côté.</span>
        <a href="#fonctionnalites" className="ml-2 text-indigo-300 hover:text-white font-semibold transition-colors underline underline-offset-2">
          Voir comment →
        </a>
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-9 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#pourquoi" className="text-gray-400 hover:text-white transition-colors">Pourquoi Deviso</a>
            <a href="#fonctionnalites" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</a>
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Connexion
            </Link>
            <WaitlistButton
              plan="free"
              label="Essayer gratuitement"
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-6">
            Fait pour les {professionLabel}s
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white leading-tight tracking-tight mb-6">
            {heroTitle}{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {heroHighlight}
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <DemoButton className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-indigo-900/50" />
            <WaitlistButton
              plan="free"
              label="Créer un compte gratuit"
              className="w-full sm:w-auto text-gray-300 font-semibold px-8 py-4 rounded-xl text-lg border border-ds-border hover:bg-ds-surface transition-all text-center"
            />
          </div>
          <p className="text-sm text-gray-600">
            Démo instantanée · Aucune carte bancaire · Compte Pro complet pré-rempli
          </p>
        </div>

        {/* Mockup */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-1 shadow-2xl">
            <div className="bg-slate-900 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 mx-4 bg-slate-700 rounded-md px-3 py-1 text-xs text-gray-500">
                  app.deviso.fr/proposals/new
                </div>
              </div>
              <div className="p-6 text-white">
                <div className="mb-4 text-sm text-gray-500 font-medium uppercase tracking-wider">
                  Décris ton projet
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
                  <p className="text-gray-400 text-sm leading-relaxed">{mockupPrompt}</p>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-sm font-semibold">
                    ⚡ Générer le devis
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{mockupRef}</div>
                      <div className="text-xs text-gray-400">{mockupClient}</div>
                    </div>
                    <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      Brouillon
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    {mockupLines.map((line) => (
                      <div key={line.desc} className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-600 flex-1">{line.desc}</span>
                        <span className="text-gray-400 mx-4">{line.qty}</span>
                        <span className="font-semibold text-gray-900">{line.price}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-semibold">
                      <span className="text-gray-900">Total TTC (TVA 20%)</span>
                      <span className="text-indigo-600">{mockupTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pourquoi Deviso pour ce métier ── */}
      <section id="pourquoi" className="py-20 px-4 sm:px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-semibold text-white mb-4">
              Fait pour les {professionLabel}s
            </h2>
            <p className="text-lg text-gray-400">
              Ces situations te parlent ? Deviso les résout.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="bg-ds-surface/50 border border-ds-border rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-ds-surface transition-all duration-200"
              >
                <div className="bg-indigo-500/10 rounded-lg p-2 text-2xl mb-4 w-fit">{p.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="py-20 px-4 sm:px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-semibold text-white mb-4">Comment ça marche</h2>
            <p className="text-lg text-gray-400">De la description à la facture signée. Trois étapes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-500/20 via-indigo-500/40 to-indigo-500/20" />
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xl flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-semibold text-white mb-4">Tout ce dont tu as besoin</h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Tout ce que tes concurrents font à la main, Deviso le fait automatiquement.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-ds-surface/50 border border-ds-border rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-ds-surface transition-all duration-200"
              >
                <div className="bg-indigo-500/10 rounded-lg p-2 text-xl mb-4 w-fit">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section id="tarifs" className="py-20 px-4 sm:px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-semibold text-white mb-4">Tarifs simples</h2>
          <p className="text-lg text-gray-400 mb-10">Sans engagement. Sans surprise.</p>
          <div className="grid sm:grid-cols-2 gap-4 text-left mb-10">
            {[
              { name: "Solo", price: "18€/mois", desc: "Factur-X, Chorus Pro, acompte/solde, sans branding Deviso. 14 jours d'essai gratuit.", highlight: false },
              { name: "Pro", price: "34€/mois", desc: "Relances auto, CRM, équipe, exports FEC, domaine custom. 14 jours d'essai gratuit.", highlight: true },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border ${p.highlight ? "bg-indigo-950/50 border-indigo-500/40 ring-1 ring-indigo-500/20" : "bg-ds-surface/50 border-ds-border"}`}
              >
                <div className="text-lg font-semibold text-white mb-1">{p.name}</div>
                <div className="text-2xl font-semibold text-white mb-3">{p.price}</div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{p.desc}</p>
                <WaitlistButton
                  plan={p.name === "Solo" ? "solo" : "pro"}
                  label={`Essayer ${p.name} gratuitement`}
                  className={`w-full text-center font-semibold py-2.5 px-4 rounded-xl transition-all text-sm ${p.highlight ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-ds-elevated text-gray-200 hover:bg-gray-700 border border-ds-border"}`}
                />
              </div>
            ))}
          </div>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            Voir tous les détails des plans →
          </Link>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-white/[0.08] rounded-3xl p-16 text-center">
            <h2 className="text-4xl font-semibold text-white mb-4">
              Prêt à envoyer ton prochain devis en 30 secondes ?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Rejoins les {professionLabel}s qui gèrent leur activité commerciale avec Deviso.
            </p>
            <WaitlistButton
              plan="solo"
              label="Essayer gratuitement 14 jours →"
              className="inline-block bg-white text-black font-semibold text-lg px-10 py-4 rounded-xl hover:bg-zinc-100 transition-all"
            />
            <p className="text-gray-600 text-sm mt-4">Essai gratuit 14 jours · Sans carte bancaire</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ds-bg border-t border-zinc-900 text-gray-500 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">D</span>
                </div>
                <span className="font-semibold text-white">Deviso</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                Du devis à la facture Factur-X, pour les freelances et petites équipes en France. 🇫🇷
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-white font-semibold mb-3">Produit</div>
                <ul className="space-y-2">
                  <li><Link href="/#fonctionnalites" className="hover:text-gray-300 transition-colors">Fonctionnalités</Link></li>
                  <li><Link href="/#tarifs" className="hover:text-gray-300 transition-colors">Tarifs</Link></li>
                  <li><Link href="/login" className="hover:text-gray-300 transition-colors">Connexion</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Métiers</div>
                <ul className="space-y-2">
                  {metierLinks.map((m) => (
                    <li key={m.href}>
                      <Link href={m.href} className="hover:text-gray-300 transition-colors">{m.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Légal</div>
                <ul className="space-y-2">
                  <li><Link href="/cgu" className="hover:text-gray-300 transition-colors">CGU</Link></li>
                  <li><Link href="/confidentialite" className="hover:text-gray-300 transition-colors">Confidentialité</Link></li>
                  <li><Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">Mentions légales</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-900 pt-6 text-xs text-center">
            © {new Date().getFullYear()} Deviso. Fait avec ❤️ en France.
          </div>
        </div>
      </footer>
    </div>
  );
}
