import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Comment fixer ses tarifs en freelance : TJM, méthodes, erreurs à éviter | Deviso",
  description:
    "Comment calculer son TJM en freelance ? Les 3 méthodes, les erreurs classiques (syndrome de l'imposteur, sous-évaluation des charges), et comment augmenter ses tarifs sans perdre ses clients.",
  alternates: { canonical: "https://getdeviso.fr/blog/fixer-ses-tarifs-freelance" },
  openGraph: {
    title: "Comment fixer ses tarifs en freelance : TJM, méthodes, erreurs à éviter",
    description: "Les 3 méthodes pour calculer son TJM, les erreurs classiques, et comment augmenter ses tarifs. Guide complet pour freelances.",
    url: "https://getdeviso.fr/blog/fixer-ses-tarifs-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Comment fixer ses tarifs en freelance : TJM, méthodes et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/fixer-ses-tarifs-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment calculer son TJM en freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La méthode la plus fiable : (1) Estimez votre revenu net mensuel cible, (2) Ajoutez vos charges (URSSAF, mutuelle, retraite, frais professionnels, environ 45-55% du CA pour un auto-entrepreneur), (3) Divisez par votre nombre de jours facturables réels par mois (généralement 15-18 jours sur 20 jours ouvrés, en comptant les congés, la prospection, l'admin). Le résultat est votre TJM minimum. Ajoutez une marge selon votre positionnement et la demande.",
        },
      },
      {
        "@type": "Question",
        name: "Faut-il afficher ses tarifs publiquement en freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Il n'y a pas de règle universelle. Afficher une fourchette de tarifs sur son site filtre les clients qui n'ont pas le budget et réduit le temps passé à faire des devis non convertis. Garder ses tarifs confidentiels permet plus de flexibilité selon le client et la mission. La plupart des freelances B2B choisissent de ne pas afficher de tarifs mais de mentionner une fourchette dans les premiers échanges.",
        },
      },
    ],
  },
};

const metierLinks = [
  { label: "Graphiste freelance", href: "/freelance-graphiste" },
  { label: "Développeur web", href: "/freelance-developpeur" },
  { label: "Consultant indépendant", href: "/freelance-consultant" },
  { label: "Artisan BTP", href: "/freelance-artisan" },
  { label: "Community manager", href: "/freelance-community-manager" },
  { label: "Traducteur freelance", href: "/freelance-traducteur" },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X.</span>
      </div>

      <nav className="fixed top-9 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-white font-semibold">Blog</Link>
            <Link href="/#fonctionnalites" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</Link>
            <Link href="/#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Connexion</Link>
            <WaitlistButton plan="free" label="Essayer gratuitement" className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors" />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      <article className="pt-36 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-400">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-400">Blog</Link>
            <span>/</span>
            <span className="text-gray-400">Fixer ses tarifs en freelance</span>
          </nav>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">Problèmes freelance</span>
              <span className="text-xs text-gray-600">29 juin 2026 · 7 min</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              Comment fixer ses tarifs en freelance : TJM, méthodes et erreurs à éviter
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Sous-facturer, c&apos;est travailler pour rien. Sur-facturer sans le prouver, c&apos;est perdre des clients. La vérité : il existe une méthode rationnelle pour trouver le bon tarif, et elle n&apos;a rien à voir avec ce que pratique le voisin.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-white mb-5">Les 3 méthodes pour calculer son TJM</h2>

              <div className="space-y-6">
                <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-indigo-400 font-bold font-mono text-sm">01</span>
                    <h3 className="font-semibold text-white">La méthode du revenu cible (bottom-up)</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">C&apos;est la méthode la plus fiable. Vous partez de ce dont vous avez besoin pour vivre, et vous calculez ce que vous devez facturer pour y arriver.</p>
                  <div className="bg-ds-elevated rounded-xl p-4 font-mono text-xs text-gray-300 space-y-1">
                    <p>Revenu net mensuel souhaité : 3 000 €</p>
                    <p>+ Charges URSSAF + mutuelle + retraite (~45%) : 2 455 €</p>
                    <p className="border-t border-ds-border pt-1 mt-1">= CA mensuel nécessaire : 5 455 €</p>
                    <p>÷ Jours facturables / mois (17 sur 20) : 17 jours</p>
                    <p className="border-t border-ds-border pt-1 mt-1 text-indigo-400 font-bold">= TJM minimum : 321 €/jour</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">Ajoutez une marge de 20-30% pour les périodes creuses, les formations, les imprévus. TJM recommandé ici : ~400€/jour.</p>
                </div>

                <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-indigo-400 font-bold font-mono text-sm">02</span>
                    <h3 className="font-semibold text-white">La méthode du marché (benchmarking)</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">Regardez ce que pratiquent vos pairs avec le même niveau d&apos;expérience dans la même zone géographique. Malt, Crème de la crème, LinkedIn, les profils publics donnent une bonne indication des fourchettes pratiquées. Attention : les tarifs affichés sont souvent des tarifs maximums, pas des moyennes.</p>
                </div>

                <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-indigo-400 font-bold font-mono text-sm">03</span>
                    <h3 className="font-semibold text-white">La méthode de la valeur délivrée (value-based pricing)</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">Au lieu de facturer votre temps, vous facturez la valeur que vous créez pour le client. Un consultant qui aide une PME à gagner 100 000€ de CA supplémentaire peut facturer 20 000€ de mission, même si ça lui a pris 20 jours. C&apos;est la méthode la plus rentable, mais elle requiert une bonne compréhension de l&apos;impact de votre travail et la capacité à le quantifier.</p>
                  <p className="text-xs text-gray-600">Particulièrement adaptée aux consultants, coachs business, spécialistes SEO, experts en conversion.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Les erreurs classiques qui font sous-facturer</h2>

              <div className="space-y-4">
                {[
                  {
                    title: "Se comparer au salaire d'un salarié",
                    desc: "Un développeur salarié à 45 000€/an brut ne coûte pas 45 000€ à son employeur, il coûte environ 67 000€ avec les charges patronales. Et le freelance, lui, doit financer sa propre protection sociale, sa retraite, ses congés, sa formation. Un TJM de 450€ pour un dev senior n'est pas \"cher\", c'est l'équivalent d'un salarié à 50k brut, sans les avantages.",
                  },
                  {
                    title: "Oublier les temps non facturables",
                    desc: "Sur 20 jours ouvrés, combien facturez-vous réellement ? Comptez : prospection commerciale (2-3 jours), comptabilité/admin (1 jour), formation (1 jour), congés/maladie (1-2 jours). Vous facturez souvent 13 à 16 jours réels. Si vous calculez votre TJM sur 20 jours, vous sous-facturez structurellement.",
                  },
                  {
                    title: "Le syndrome de l'imposteur tarifaire",
                    desc: "\"Je ne peux pas facturer autant, je ne suis pas assez expérimenté / les clients ne vont pas accepter / il y a des gens meilleurs que moi.\" Ce discours intérieur pousse des milliers de freelances à sous-facturer pendant des années. La réalité : si un client vous propose une mission, c'est qu'il croit que vous pouvez la faire. Il vous a déjà validé.",
                  },
                  {
                    title: "Baisser ses tarifs pour \"ne pas perdre le client\"",
                    desc: "Un client qui choisit un prestataire uniquement sur le prix n'est pas un bon client. Il partira au moindre discount d'un concurrent. À l'inverse, les clients qui vous choisissent pour votre compétence sont fidèles et recommandent. Baisser vos tarifs attire les mauvais clients et éloigne les bons.",
                  },
                ].map((item) => (
                  <div key={item.title} className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-5">
                    <p className="font-semibold text-white text-sm mb-2">✗ {item.title}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Comment augmenter ses tarifs sans perdre ses clients</h2>
              <p className="mb-4 text-gray-400">L&apos;augmentation de tarifs est inévitable, l&apos;inflation, la progression de vos compétences, et la demande croissante l&apos;exigent. La plupart des freelances repoussent cette conversation indéfiniment. Voici comment l&apos;aborder.</p>
              <div className="space-y-3">
                {[
                  { tip: "Annoncez la hausse 1 à 3 mois à l'avance, par email. Pas d'excuse, pas d'explication longue : \"À partir du [date], mes tarifs passent de X à Y€/jour. Je souhaitais vous en informer en avance pour que vous puissiez anticiper.\"" },
                  { tip: "Commencez par appliquer les nouveaux tarifs aux nouveaux clients. Vos clients actuels les plus fidèles bénéficient d'une période de transition de 3 à 6 mois." },
                  { tip: "Hausse modérée mais régulière (5 à 10%/an) plutôt qu'une hausse forte tous les 5 ans. C'est plus facile à accepter et reflète mieux la réalité du marché." },
                  { tip: "Un client qui part parce que vous augmentez vos tarifs de 10% était probablement déjà en train de chercher quelqu'un de moins cher. Vous perdez peu." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 bg-ds-elevated rounded-xl p-4 border border-ds-border">
                    <span className="text-emerald-400 font-bold flex-shrink-0 text-sm">→</span>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.tip}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">TJM vs forfait : lequel choisir ?</h2>
              <p className="mb-4 text-gray-400">Les deux modèles coexistent et chacun a ses avantages.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <p className="font-semibold text-white text-sm mb-2">TJM (régie)</p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>✓ Adapté aux missions longues ou évolutives</li>
                    <li>✓ Protège contre le scope creep</li>
                    <li>✓ Simple à comprendre pour le client</li>
                    <li>✗ Limite votre rentabilité si vous devenez plus rapide</li>
                  </ul>
                </div>
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <p className="font-semibold text-white text-sm mb-2">Forfait</p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>✓ Rentabilité croissante avec l&apos;expérience</li>
                    <li>✓ Le client sait exactement son budget</li>
                    <li>✓ Favorise la value-based pricing</li>
                    <li>✗ Risque de sous-évaluation si scope mal défini</li>
                  </ul>
                </div>
              </div>
            </section>

          </div>

          {/* CTA */}
          <div className="mt-14 bg-gradient-to-br from-indigo-900/40 to-violet-900/20 rounded-2xl border border-indigo-500/20 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">Facturez au bon prix, présentez-vous comme un pro</h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
              Avec Deviso, vos devis sont générés en 30 secondes, signés électroniquement et relancés automatiquement. Professionnalisme et sérénité, dès le premier contact.
            </p>
            <WaitlistButton plan="free" label="Générer mon premier devis, gratuit" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all" />
          </div>

          <div className="mt-14 pt-8 border-t border-ds-border">
            <p className="text-xs text-gray-600 mb-4">Guides par métier</p>
            <div className="flex flex-wrap gap-2">
              {metierLinks.map((m) => (
                <Link key={m.href} href={m.href} className="text-xs px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-gray-500 hover:text-gray-300 hover:border-indigo-500/30 transition-all">{m.label}</Link>
              ))}
              <Link href="/blog" className="text-xs px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-indigo-400 hover:text-indigo-300 transition-all">← Tous les articles</Link>
            </div>
          </div>
        </div>
      </article>

      <footer className="border-t border-ds-border py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <p>© 2026 Deviso · SAS au capital de 1 000 € · SIRET en cours d&apos;immatriculation</p>
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">getdeviso.fr</Link>
        </div>
      </footer>
    </div>
  );
}
