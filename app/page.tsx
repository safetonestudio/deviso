import Link from "next/link";
import type { Metadata } from "next";
import { NavbarMobile } from "@/components/NavbarMobile";
import { DemoButton } from "@/components/landing/DemoButton";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { PricingSection } from "@/components/landing/PricingSection";

export const metadata: Metadata = {
  title: "Deviso, Logiciel devis et facturation pour freelances français",
  description:
    "Créez vos devis en 30 secondes avec l'IA, facturez en Factur-X conforme 2026, relances automatiques, suivi CA URSSAF. Essai gratuit 14 jours, sans carte bancaire.",
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
    desc: "Facture électronique conforme à la réforme 2026 en 1 clic. Dépôt Chorus Pro pour le secteur public directement depuis la facture, sans quitter Deviso.",
  },
  {
    icon: "📊",
    title: "Widget CA URSSAF",
    desc: "Ton chiffre d'affaires mensuel et trimestriel affiché en temps réel dans le tableau de bord. Tu sais exactement quoi déclarer, sans calculer.",
  },
  {
    icon: "⏱️",
    title: "Suivi du temps & catalogue",
    desc: "Facture à l'heure ou au forfait. Catalogue de prestations réutilisable en un clic, avec sélecteur de durée directement dans le devis.",
  },
];

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


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Bandeau réforme 2026 ── */}
      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-xs sm:text-sm" style={{ zIndex: 60 }}>
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5 hidden sm:inline">La facturation électronique B2B devient obligatoire en France.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X.</span>
        <a href="#fonctionnalites" className="ml-2 text-indigo-300 hover:text-white font-semibold transition-colors underline underline-offset-2 hidden sm:inline">Voir comment →</a>
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed left-0 right-0 z-50 bg-ds-bg/90 backdrop-blur-xl border-b border-white/[0.06]" style={{ top: "36px" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-xs">D</span>
            </div>
            <span className="font-semibold text-base text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#fonctionnalites" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#comment" className="text-gray-400 hover:text-white transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</a>
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Connexion
            </Link>
            <WaitlistButton
              plan="solo"
              label="Essayer gratuitement"
              className="bg-white text-black text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-44 sm:pt-40 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.05] text-gray-400 border border-white/[0.08] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>Conforme réforme facturation 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-tight tracking-tight mb-5">
            Devis et facturation<br className="hidden sm:block" />{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              pour freelances français.
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Devis IA en 30 secondes, signature électronique, facturation Factur-X, relances automatiques, suivi CA URSSAF.{" "}
            <span className="text-gray-300">Tu travailles, Deviso gère le reste.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <DemoButton className="w-full sm:w-auto bg-white text-black font-semibold px-7 py-3 rounded-lg text-base transition-all hover:bg-zinc-100" />
            <WaitlistButton
              plan="solo"
              label="Essayer gratuitement 14 jours →"
              className="w-full sm:w-auto text-gray-300 font-medium px-7 py-3 rounded-lg text-base border border-white/[0.10] hover:bg-white/[0.04] transition-all text-center"
            />
          </div>

          <p className="text-xs text-gray-600">
            Démo instantanée · 14 jours gratuits · Sans carte bancaire
          </p>
        </div>

        {/* Mockup */}
        <div className="max-w-3xl mx-auto mt-14">
          <div className="bg-[#111111] rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1A1A1A] border-b border-white/[0.06]">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="flex-1 mx-4 bg-white/[0.06] rounded-md px-3 py-1 text-xs text-gray-500">
                app.getdeviso.fr/proposals/new
              </div>
            </div>
            <div className="p-6 text-white">
              <div className="mb-3 text-xs text-gray-600 font-medium uppercase tracking-wider">
                Décris ton projet
              </div>
              <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06] mb-4">
                <p className="text-gray-400 text-sm leading-relaxed">
                  Refonte complète du site vitrine d&apos;un cabinet d&apos;avocats
                  spécialisé en droit des affaires à Lyon. Design moderne,
                  responsive, avec formulaire de contact et page d&apos;équipe.
                  Budget client : 4 500€, délai 3 semaines.
                </p>
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-sm font-semibold">
                  ⚡ Générer le devis
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Devis n°2026-047</div>
                    <div className="text-xs text-gray-400 mt-0.5">Cabinet Durand &amp; Associés • Lyon</div>
                  </div>
                  <div className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Brouillon
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ["Audit UX et benchmark concurrentiel", "500€"],
                    ["Maquettes et design UI (5 pages)", "1 400€"],
                    ["Intégration WordPress + responsive", "1 800€"],
                    ["Formulaire de contact + RGPD", "400€"],
                    ["Mise en ligne et formation", "400€"],
                  ].map(([desc, price]) => (
                    <div key={desc} className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600 truncate mr-4">{desc}</span>
                      <span className="font-semibold text-gray-900 shrink-0">{price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-semibold">
                    <span className="text-gray-900">Total TTC (TVA 20%)</span>
                    <span className="text-indigo-600">5 400€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section id="comment" className="py-20 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">
              Comment ça marche
            </h2>
            <p className="text-gray-500">De la description à la facture signée en trois étapes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="bg-ds-surface border border-white/[0.07] rounded-xl p-6">
                <div className="text-xs font-semibold text-indigo-400 mb-3 tabular-nums">{step.num}</div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">
              Tout ce dont tu as besoin
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Tout ce que tes concurrents font à la main, Deviso le fait automatiquement.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-ds-surface border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.14] transition-colors"
              >
                <div className="text-xl mb-3" aria-hidden="true">{f.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Témoignages ── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">Quelques retours</h2>
            <p className="text-gray-500">Ce que nos utilisateurs nous disent.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Sarah M.", role: "Graphiste indépendante", initials: "SM", text: "Avant je faisais mes devis sur Pages, ça me prenait une heure. Maintenant je le génère pendant que je suis encore au téléphone avec le client." },
              { name: "Julien T.", role: "Développeur web freelance", initials: "JT", text: "Ce que j'apprécie surtout, c'est de savoir exactement quand mon client a ouvert le devis. Je sais quand c'est le bon moment pour le relancer." },
              { name: "Antoine B.", role: "Studio de création, 3 personnes", initials: "AB", text: "On est trois associés. On avait besoin que tout le monde crée des devis cohérents sans se marcher dessus. Deviso a vraiment simplifié ça." },
            ].map((t) => (
              <div key={t.initials} className="bg-ds-surface border border-white/[0.07] rounded-xl p-5">
                <div className="flex gap-0.5 mb-4" aria-label="5 étoiles">
                  {Array(5).fill(null).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm" aria-hidden="true">★</span>
                  ))}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.07] text-gray-300 font-semibold text-xs flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{t.name}</div>
                    <div className="text-gray-600 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <PricingSection />

      {/* ── CTA Final ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-ds-surface border border-white/[0.07] rounded-xl p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 tracking-tight">
              Prêt à envoyer ton prochain devis en 30 secondes ?
            </h2>
            <p className="text-gray-500 mb-8">
              Rejoins les freelances et petites équipes qui gèrent leur facturation avec Deviso.
            </p>
            <Link
              href="/signup?plan=solo"
              className="inline-block bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-100 transition-all text-sm"
            >
              Commencer l'essai gratuit →
            </Link>
            <p className="text-gray-600 text-xs mt-4">14 jours gratuits · Sans carte bancaire · Résiliable à tout moment</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ds-bg border-t border-white/[0.04] text-gray-500 py-12 px-4 sm:px-6">
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
                Logiciel de devis et facturation pour freelances et petites équipes en France. 🇫🇷
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-white font-semibold mb-3">Produit</div>
                <ul className="space-y-2">
                  <li><a href="#fonctionnalites" className="hover:text-gray-300 transition-colors">Fonctionnalités</a></li>
                  <li><a href="#tarifs" className="hover:text-gray-300 transition-colors">Tarifs</a></li>
                  <li><Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link></li>
                  <li><Link href="/login" className="hover:text-gray-300 transition-colors">Connexion</Link></li>
                  <li><a href="mailto:support@getdeviso.fr" className="hover:text-gray-300 transition-colors">Support</a></li>
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Métiers</div>
                <ul className="space-y-2">
                  <li><Link href="/freelance-developpeur" className="hover:text-gray-300 transition-colors">Développeur</Link></li>
                  <li><Link href="/freelance-graphiste" className="hover:text-gray-300 transition-colors">Graphiste</Link></li>
                  <li><Link href="/freelance-consultant" className="hover:text-gray-300 transition-colors">Consultant</Link></li>
                  <li><Link href="/freelance-photographe" className="hover:text-gray-300 transition-colors">Photographe</Link></li>
                  <li><Link href="/freelance-redacteur" className="hover:text-gray-300 transition-colors">Rédacteur</Link></li>
                  <li><Link href="/freelance-artisan" className="hover:text-gray-300 transition-colors">Artisan</Link></li>
                  <li><Link href="/freelance-formateur" className="hover:text-gray-300 transition-colors">Formateur</Link></li>
                  <li><Link href="/freelance-coach" className="hover:text-gray-300 transition-colors">Coach</Link></li>
                  <li><Link href="/freelance-community-manager" className="hover:text-gray-300 transition-colors">Community manager</Link></li>
                  <li><Link href="/freelance-traducteur" className="hover:text-gray-300 transition-colors">Traducteur</Link></li>
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
          <div className="border-t border-white/[0.04] pt-6 text-xs text-center">
            © {new Date().getFullYear()} Deviso. Fait avec ❤️ en France.
          </div>
        </div>
      </footer>
    </div>
  );
}
