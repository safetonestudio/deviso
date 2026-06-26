import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logiciel de devis IA pour freelances — Devis en 30 secondes",
  description:
    "Créez des devis professionnels en 30 secondes grâce à l'IA. Signature client en ligne, facturation électronique Factur-X conforme 2026/2027. Gratuit pour commencer.",
  alternates: {
    canonical: "https://getdeviso.fr",
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
    "Logiciel de devis et facturation IA pour freelances et auto-entrepreneurs français. Générez des devis professionnels en 30 secondes, envoyez-les pour signature et créez des factures électroniques Factur-X conformes.",
  offers: [
    {
      "@type": "Offer",
      name: "Gratuit",
      price: "0",
      priceCurrency: "EUR",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "49",
      priceCurrency: "EUR",
      billingIncrement: "P1M",
    },
  ],
  featureList: [
    "Génération de devis par IA",
    "Signature électronique client",
    "Facturation électronique Factur-X",
    "Conformité droit français",
    "Devis illimités",
  ],
  inLanguage: "fr",
  audience: {
    "@type": "Audience",
    audienceType: "Freelances et auto-entrepreneurs français",
  },
};

const features = [
  {
    icon: "⚡",
    title: "Devis en 30 secondes",
    desc: "Décris ton projet en langage naturel. L'IA génère un devis complet, structuré et professionnel instantanément.",
  },
  {
    icon: "🇫🇷",
    title: "Conforme au droit français",
    desc: "Mentions légales, TVA, auto-liquidation, délai de validité — tout est géré automatiquement selon la réglementation en vigueur.",
  },
  {
    icon: "✍️",
    title: "Signature électronique",
    desc: "Envoie un lien de signature à ton client. Il consulte, commente et signe depuis son téléphone ou son ordinateur.",
  },
  {
    icon: "📊",
    title: "Suivi en temps réel",
    desc: "Sache exactement quand ton client a ouvert ton devis. Relances automatiques si pas de réponse après 3 jours.",
  },
  {
    icon: "🎨",
    title: "Design premium",
    desc: "Des devis qui donnent envie de signer. Ajoute ton logo, tes couleurs. Tes clients vont remarquer la différence.",
  },
  {
    icon: "🔗",
    title: "Lien de partage viral",
    desc: "Chaque devis partagé porte ta marque. Tes clients deviennent tes ambassadeurs sans effort de ta part.",
  },
];

const steps = [
  {
    num: "01",
    title: "Décris ton projet",
    desc: 'Tape quelque chose comme "Refonte site pour un cabinet d\'avocats à Paris, budget 4500€, 3 semaines" et laisse faire l\'IA.',
  },
  {
    num: "02",
    title: "Révise et personnalise",
    desc: "L'IA génère le devis complet. Tu ajustes les lignes, les prix, les délais en quelques clics.",
  },
  {
    num: "03",
    title: "Envoie et encaisse",
    desc: "Partage le lien de signature par email. Ton client signe. Tu reçois la notification instantanément.",
  },
];

const testimonials = [
  {
    name: "Marie L.",
    role: "Développeuse freelance",
    avatar: "ML",
    text: "J'envoyais mes devis dans Word. Maintenant je les génère en 30 secondes et mes clients les signent le jour même. Jeu de monstre.",
  },
  {
    name: "Thomas R.",
    role: "Designer UX/UI",
    avatar: "TR",
    text: "L'IA comprend exactement ce que je lui demande. Elle décompose le projet en lignes cohérentes que je n'aurais pas pensé à mettre moi-même.",
  },
  {
    name: "Camille D.",
    role: "Consultante marketing",
    avatar: "CD",
    text: "Le taux d'acceptation de mes devis a augmenté de 40% depuis que j'utilise Deviso. Le design professionnel fait toute la différence.",
  },
];

const pricingPlans = [
  {
    name: "Gratuit",
    price: "0€",
    period: "pour toujours",
    features: [
      "3 devis par mois",
      "Génération IA incluse",
      "PDF téléchargeable",
      'Signature "Créé avec Deviso"',
      "Support par email",
    ],
    cta: "Commencer gratuitement",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "49€",
    period: "par mois, sans engagement",
    features: [
      "Devis illimités",
      "Génération IA illimitée",
      "Ton logo et ta marque",
      "Signature électronique",
      "Relances automatiques",
      "Analytics (ouvertures, clics)",
      "Support prioritaire",
    ],
    cta: "Essayer 14 jours gratuit",
    href: "/signup?plan=pro",
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg text-slate-900">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#fonctionnalites" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#comment" className="hover:text-slate-900 transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-slate-900 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Connexion
            </Link>
            <Link
              href="/signup"
              className="bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-100">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            1 500+ freelances déjà inscrits
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            Ton devis en{" "}
            <span className="gradient-text">30 secondes</span>,{" "}
            <br className="hidden sm:block" />
            grâce à l'IA
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tu décris ton projet. L'IA génère un devis professionnel, conforme
            au droit français, prêt à envoyer pour signature. Fini les heures
            perdues sur Word ou Google Docs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-brand-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-brand-700 transition-all hover:scale-105 shadow-lg shadow-brand-200"
            >
              Créer mon premier devis →
            </Link>
            <a
              href="#comment"
              className="w-full sm:w-auto text-slate-600 font-semibold px-8 py-4 rounded-xl text-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Voir comment ça marche
            </a>
          </div>

          <p className="text-sm text-slate-400">
            Gratuit • Aucune carte bancaire • Résultat en 30 secondes
          </p>
        </div>

        {/* Mockup */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-1 shadow-2xl">
            <div className="bg-slate-900 rounded-xl overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 mx-4 bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400">
                  app.deviso.fr/proposals/new
                </div>
              </div>
              {/* App UI mockup */}
              <div className="p-6 text-white">
                <div className="mb-4 text-sm text-slate-400 font-medium uppercase tracking-wider">
                  Décris ton projet
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Refonte complète du site vitrine d&apos;un cabinet d&apos;avocats
                    spécialisé en droit des affaires à Lyon. Design moderne,
                    responsive, avec formulaire de contact et page d&apos;équipe.
                    Budget client : 4 500€, délai 3 semaines.
                  </p>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-sm font-semibold">
                    ⚡ Générer le devis avec l'IA
                  </div>
                </div>
                {/* Generated result preview */}
                <div className="bg-white rounded-xl p-4 text-slate-900">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-sm">Devis n°2024-047</div>
                      <div className="text-xs text-slate-500">Cabinet Durand & Associés • Lyon</div>
                    </div>
                    <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      Brouillon
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      ["Audit UX et benchmark concurrentiel", "1 forfait", "500€"],
                      ["Maquettes et design UI (5 pages)", "1 forfait", "1 400€"],
                      ["Intégration WordPress + responsive", "1 forfait", "1 800€"],
                      ["Formulaire de contact + RGPD", "1 forfait", "400€"],
                      ["Mise en ligne et formation", "1 forfait", "400€"],
                    ].map(([desc, qty, price]) => (
                      <div key={desc} className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-700">{desc}</span>
                        <span className="text-slate-500">{qty}</span>
                        <span className="font-semibold">{price}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold">
                      <span>Total TTC (TVA 20%)</span>
                      <span className="text-brand-600">5 400€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section id="comment" className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Comment ça marche
            </h2>
            <p className="text-lg text-slate-500">Trois étapes. C&apos;est tout.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Tout ce dont tu as besoin
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Conçu exclusivement pour les freelances et indépendants. Pas pour
              les équipes commerciales, pas pour les grandes entreprises. Pour toi.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Ce qu&apos;ils en disent
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl border border-slate-100">
                <p className="text-slate-600 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-slate-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section id="tarifs" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Tarifs simples</h2>
            <p className="text-lg text-slate-500">Aucun per-seat. Aucune limite cachée.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.highlight
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-slate-200"
                }`}
              >
                {plan.highlight && (
                  <div className="text-brand-200 text-xs font-bold uppercase tracking-widest mb-3">
                    ⭐ Le plus populaire
                  </div>
                )}
                <h3
                  className={`text-2xl font-extrabold mb-1 ${
                    plan.highlight ? "text-white" : "text-slate-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <div
                  className={`text-4xl font-black mb-1 ${
                    plan.highlight ? "text-white" : "text-slate-900"
                  }`}
                >
                  {plan.price}
                </div>
                <div
                  className={`text-sm mb-6 ${
                    plan.highlight ? "text-brand-200" : "text-slate-400"
                  }`}
                >
                  {plan.period}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          plan.highlight ? "text-brand-200" : "text-brand-600"
                        }
                      >
                        ✓
                      </span>
                      <span
                        className={
                          plan.highlight ? "text-white" : "text-slate-700"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center font-bold py-3 px-6 rounded-xl transition-all ${
                    plan.highlight
                      ? "bg-white text-brand-600 hover:bg-brand-50"
                      : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 px-4 sm:px-6 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Prêt à envoyer ton prochain devis en 30 secondes ?
          </h2>
          <p className="text-brand-200 text-lg mb-8">
            Rejoins les 1 500 freelances qui ont dit adieu à Word et Google Docs.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-brand-600 font-bold text-lg px-10 py-4 rounded-xl hover:bg-brand-50 transition-all hover:scale-105"
          >
            Créer mon compte gratuitement →
          </Link>
          <p className="text-brand-300 text-sm mt-4">Gratuit • Sans carte bancaire</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">D</span>
                </div>
                <span className="font-bold text-white">Deviso</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                L&apos;outil de devis IA conçu pour les freelances et indépendants
                français.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <div className="text-white font-semibold mb-3">Produit</div>
                <ul className="space-y-2">
                  <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                  <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
                  <li><Link href="/signup" className="hover:text-white transition-colors">S&apos;inscrire</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Légal</div>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-xs text-center">
            © {new Date().getFullYear()} Deviso. Fait avec ❤️ en France.
          </div>
        </div>
      </footer>
    </div>
  );
}
