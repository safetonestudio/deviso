import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Facturation électronique 2026 : le guide complet pour freelances et indépendants",
  description:
    "Tout ce que vous devez savoir sur la réforme de facturation électronique 2026 : qui est concerné, à quelle date, quel format, et comment vous préparer. Guide complet pour freelances, auto-entrepreneurs et TPE.",
  alternates: { canonical: "https://getdeviso.fr/blog/facturation-electronique-2026" },
  openGraph: {
    title: "Facturation électronique 2026 : le guide complet pour freelances",
    description:
      "Calendrier, formats Factur-X, plateformes agréées, e-reporting, tout comprendre en 10 minutes.",
    url: "https://getdeviso.fr/blog/facturation-electronique-2026",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Réforme facturation électronique 2026" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Facturation électronique 2026 : le guide complet pour freelances et indépendants",
  datePublished: "2026-07-10",
  dateModified: "2026-07-10",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/facturation-electronique-2026" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que la réforme de facturation électronique 2026 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La réforme de facturation électronique oblige les entreprises françaises à émettre et recevoir leurs factures B2B dans un format électronique structuré (Factur-X, UBL, CII) via une plateforme agréée par la DGFiP. Elle s'applique en B2B uniquement. Le calendrier : grandes entreprises dès le 1er septembre 2026, ETI au 1er décembre 2026, PME et micro-entrepreneurs au 1er septembre 2027.",
        },
      },
      {
        "@type": "Question",
        name: "Les freelances et micro-entrepreneurs sont-ils concernés par la réforme 2026 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, mais à partir de septembre 2027 pour l'obligation d'émettre. En revanche, dès septembre 2026, ils devront être capables de RECEVOIR des e-factures de la part de leurs clients qui sont de grandes entreprises. L'obligation ne disparaît pas si vous êtes en franchise de TVA, le régime fiscal et l'obligation de facturation électronique sont indépendants.",
        },
      },
      {
        "@type": "Question",
        name: "Qu'est-ce que le format Factur-X ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Factur-X est le format hybride franco-allemand (PDF lisible + données XML structurées intégrées) reconnu comme standard en France. C'est le format accepté par la DGFiP et le plus simple à adopter pour les indépendants. Deviso génère automatiquement des factures au format Factur-X BASIC, aucune action n'est requise de votre part.",
        },
      },
      {
        "@type": "Question",
        name: "Le portail public de facturation (PPF) existe-t-il encore ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Non. Le PPF (portail public de facturation) a été abandonné en octobre 2024. La DGFiP a décidé de ne pas développer le portail public. Seules les Plateformes de Dématérialisation Partenaires (PDP), ou plateformes agréées privées, seront habilitées à transmettre les e-factures.",
        },
      },
    ],
  },
};

const metierLinks = [
  { label: "Graphiste freelance", href: "/freelance-graphiste" },
  { label: "Développeur web", href: "/freelance-developpeur" },
  { label: "Consultant indépendant", href: "/freelance-consultant" },
  { label: "Formateur indépendant", href: "/freelance-formateur" },
  { label: "Artisan BTP", href: "/freelance-artisan" },
  { label: "Traducteur freelance", href: "/freelance-traducteur" },
];

export default function FacturationElectronique2026Page() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Bandeau */}
      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso génère déjà des factures Factur-X conformes.</span>
      </div>

      {/* Navbar */}
      <nav className="fixed top-9 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
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

      {/* Article */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-36 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-400 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gray-400 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-400">Réforme 2026</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">⚡ Urgent, 1er sept. 2026</span>
            <span className="text-xs text-gray-600">10 min de lecture · Mis à jour juillet 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            Facturation électronique 2026 : le guide complet pour freelances et indépendants
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            La réforme de la facturation électronique change la façon dont toutes les entreprises françaises facturent leurs clients B2B. Voici ce qui change, pour qui, et quand, expliqué simplement.
          </p>
        </div>

        {/* Encadré synthèse */}
        <div className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-2xl p-6 mb-10">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">L&apos;essentiel en 30 secondes</p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> Obligation d&apos;émettre des e-factures B2B via une plateforme agréée (PDP)</li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> Freelances et micro-entrepreneurs : obligation à partir du <strong className="text-white">1er septembre 2027</strong></li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> Grandes entreprises : dès le <strong className="text-white">1er septembre 2026</strong>, ce qui signifie que vous recevrez des e-factures d&apos;elles dès cette date</li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> Format requis : Factur-X, UBL ou CII, Deviso génère Factur-X <strong className="text-white">nativement</strong></li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> Le portail public (PPF) a été <strong className="text-white">abandonné</strong> en octobre 2024, seules les PDP privées subsistent</li>
          </ul>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-400 leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Qu&apos;est-ce que la réforme de facturation électronique ?</h2>
            <p>
              La réforme, inscrite dans la loi de finances 2020 et précisée par les ordonnances successives de la DGFiP, impose à toutes les entreprises françaises assujetties à la TVA d&apos;émettre et de recevoir leurs factures B2B (entre professionnels) dans un format électronique structuré, transmis via une <strong className="text-white">Plateforme de Dématérialisation Partenaire (PDP)</strong> agréée par la DGFiP.
            </p>
            <p className="mt-3">
              Une facture électronique au sens de la réforme, ce n&apos;est <strong className="text-white">pas un PDF envoyé par email</strong>. C&apos;est un document dans un format structuré (données lisibles par une machine) qui transite obligatoirement par une plateforme agréée, laquelle transmet les données fiscales à la DGFiP en temps réel.
            </p>
            <p className="mt-3">
              Deux obligations distinctes coexistent :
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0 font-bold">1.</span> <span><strong className="text-white">L&apos;e-invoicing</strong> : obligation d&apos;émettre et de recevoir les factures B2B en format électronique structuré</span></li>
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0 font-bold">2.</span> <span><strong className="text-white">L&apos;e-reporting</strong> : obligation de transmettre à la DGFiP les données des transactions B2C (clients particuliers) et des transactions B2B avec des partenaires étrangers</span></li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Calendrier : qui est concerné et quand ?</h2>

            <div className="space-y-4">
              {[
                {
                  date: "1er septembre 2026",
                  entreprises: "Grandes entreprises (+ 250 salariés ou CA > 50 M€)",
                  obligation: "Obligation d'émettre ET de recevoir des e-factures",
                  urgence: "high",
                },
                {
                  date: "1er décembre 2026",
                  entreprises: "ETI (250–4 999 salariés)",
                  obligation: "Obligation d'émettre ET de recevoir",
                  urgence: "medium",
                },
                {
                  date: "1er septembre 2027",
                  entreprises: "PME, TPE, micro-entrepreneurs, toutes tailles",
                  obligation: "Obligation d'émettre ET de recevoir (obligation universelle)",
                  urgence: "low",
                },
              ].map((row) => (
                <div key={row.date} className={`rounded-xl border p-4 ${
                  row.urgence === "high" ? "border-amber-500/40 bg-amber-500/[0.05]" :
                  row.urgence === "medium" ? "border-indigo-500/30 bg-indigo-500/[0.04]" :
                  "border-ds-border bg-ds-surface"
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <span className={`text-sm font-bold ${row.urgence === "high" ? "text-amber-300" : row.urgence === "medium" ? "text-indigo-300" : "text-gray-300"}`}>
                      {row.date}
                    </span>
                    {row.urgence === "high" && (
                      <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5">Dans 7 semaines</span>
                    )}
                  </div>
                  <p className="text-sm text-white font-medium">{row.entreprises}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{row.obligation}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4">
              <p className="text-sm text-emerald-300">
                <strong>Ce que ça signifie pour vous dès septembre 2026</strong>, même si votre obligation d&apos;émettre ne commence qu&apos;en 2027, vos clients grandes entreprises doivent vous envoyer leurs factures fournisseurs en format électronique dès septembre 2026. Vous devrez donc être capable de les recevoir.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Les formats acceptés : Factur-X, UBL, CII</h2>
            <p>
              Trois formats sont reconnus par la réforme française :
            </p>
            <div className="mt-4 space-y-3">
              <div className="bg-ds-surface border border-ds-border rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">Factur-X (recommandé pour les indépendants)</p>
                <p className="text-sm">Format hybride : un PDF lisible par l&apos;humain, dans lequel sont intégrées des données XML structurées lisibles par les machines. Développé conjointement par la France et l&apos;Allemagne (norme EN 16931). C&apos;est le format le plus simple à adopter : votre facture ressemble à un PDF normal, mais contient toutes les données structurées. <strong className="text-white">C&apos;est ce que génère Deviso.</strong></p>
              </div>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">UBL 2.1 (Universal Business Language)</p>
                <p className="text-sm">Format XML pur, standard européen. Plus utilisé dans les échanges B2B automatisés entre grands groupes, ERP à ERP. Peu adapté aux indépendants.</p>
              </div>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">CII (Cross Industry Invoice)</p>
                <p className="text-sm">Standard UN/CEFACT, utilisé notamment dans les échanges internationaux. Peu courant pour les TPE françaises.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Le portail public (PPF) est abandonné, que se passe-t-il ?</h2>
            <p>
              En octobre 2024, la DGFiP a officiellement annoncé l&apos;abandon du Portail Public de Facturation (PPF) qu&apos;elle développait initialement. Ce portail gratuit devait permettre à toutes les entreprises d&apos;émettre et de recevoir des e-factures sans passer par une plateforme privée.
            </p>
            <p className="mt-3">
              Sa suppression change tout : <strong className="text-white">il n&apos;existe plus d&apos;option gratuite fournie par l&apos;État.</strong> Toutes les entreprises devront passer par une <strong className="text-white">Plateforme de Dématérialisation Partenaire (PDP)</strong> privée, certifiée par la DGFiP.
            </p>
            <div className="mt-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-amber-300">
                <strong>Conséquence pratique</strong>, Les logiciels de facturation (comme Deviso) doivent soit devenir eux-mêmes une PDP, soit s&apos;interfacer avec une PDP certifiée. Deviso est en cours de partenariat avec des PDP pour septembre 2027. En attendant, vos factures Factur-X sont déjà dans le bon format.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Franchise TVA et réforme : une confusion courante</h2>
            <p>
              <strong className="text-white">Mythe fréquent : "Je suis en franchise de TVA, donc je ne suis pas concerné."</strong>
            </p>
            <p className="mt-3">
              C&apos;est faux. La franchise en base de TVA (auto-entrepreneurs sous 36 800 € de CA, ou TPE sous seuil) est un régime fiscal. L&apos;obligation de facturation électronique est une obligation administrative distincte.
            </p>
            <p className="mt-3">
              Un freelance en franchise de TVA devra quand même :
            </p>
            <ul className="mt-3 space-y-1.5">
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">✓</span> Émettre ses factures B2B au format Factur-X (ou équivalent) via une PDP dès septembre 2027</li>
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">✓</span> Mentionner &quot;TVA non applicable - article 293B du CGI&quot; dans les données structurées (pas de montant TVA, mais le champ doit exister)</li>
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">✓</span> Recevoir les e-factures de ses fournisseurs/clients qui en émettent</li>
            </ul>
            <p className="mt-3">
              La seule vraie exemption : les <strong className="text-white">transactions B2C</strong> (avec des particuliers). L&apos;e-invoicing s&apos;applique uniquement aux transactions B2B. Pour les clients particuliers, c&apos;est l&apos;e-reporting qui s&apos;applique (voir{" "}
              <Link href="/blog/e-reporting-freelance-2026" className="text-indigo-400 hover:text-indigo-300 underline">notre article dédié</Link>).
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Ce que vous devez faire, et quand</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">✓</div>
                <div>
                  <p className="text-sm font-semibold text-white">Dès maintenant, Vérifiez votre logiciel de facturation</p>
                  <p className="text-sm mt-1">Votre outil génère-t-il du Factur-X ? Si vous utilisez Deviso, c&apos;est déjà le cas, vos factures sont conformes au format. Rien à faire de ce côté.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">→</div>
                <div>
                  <p className="text-sm font-semibold text-white">Septembre 2026, Préparez-vous à recevoir des e-factures</p>
                  <p className="text-sm mt-1">Si vous avez des clients grandes entreprises, ils commenceront à vous envoyer des e-factures (pour leur achats chez vous). Assurez-vous que votre outil peut les recevoir et les traiter.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">→</div>
                <div>
                  <p className="text-sm font-semibold text-white">Début 2027, Choisissez votre PDP</p>
                  <p className="text-sm mt-1">Identifiez la plateforme agréée par laquelle vous transmettrez vos factures. Certains logiciels de facturation intégreront directement une PDP. Deviso sera connecté à une PDP avant l&apos;échéance de septembre 2027.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">→</div>
                <div>
                  <p className="text-sm font-semibold text-white">1er septembre 2027, Obligation universelle</p>
                  <p className="text-sm mt-1">À cette date, toute facture B2B doit transiter par une PDP. Les factures PDF classiques envoyées par email ne seront plus valides fiscalement.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. FAQ</h2>
            <div className="space-y-5">
              {[
                {
                  q: "Ma facture PDF actuelle est-elle encore valide ?",
                  a: "Oui, jusqu'au 31 août 2027 pour les PME et micro-entrepreneurs. Après cette date, les factures PDF envoyées par email ne seront plus acceptées comme factures légales pour les transactions B2B. Pour le B2C (clients particuliers), la facture PDF reste valide.",
                },
                {
                  q: "Est-ce que je risque une amende si je ne suis pas prêt en septembre 2027 ?",
                  a: "La non-émission d'une facture électronique lorsqu'elle est obligatoire peut entraîner une amende de 15 € par facture, plafonnée à 15 000 € par an. La réglementation prévoit également des dispositions de tolérance pendant la période de démarrage.",
                },
                {
                  q: "Deviso sera-t-il conforme en septembre 2027 ?",
                  a: "Deviso génère déjà des factures au format Factur-X (la donnée est prête). L'interface avec une PDP certifiée est en cours de développement et sera disponible avant l'échéance de septembre 2027. Vous n'aurez rien à changer de votre côté.",
                },
                {
                  q: "Qu'arrive-t-il à mes factures pour les clients étrangers ?",
                  a: "Les factures B2B avec des clients hors de France ne sont pas soumises à l'e-invoicing (c'est une obligation franco-française). En revanche, elles sont soumises à l'e-reporting : vous devrez transmettre les données de ces transactions à la DGFiP via votre PDP.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-ds-border pb-5 last:border-0">
                  <h3 className="text-sm font-semibold text-white mb-2">{q}</h3>
                  <p className="text-sm">{a}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Articles connexes réforme */}
        <div className="mt-14 mb-12 bg-ds-surface border border-ds-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Articles du cluster réforme 2026</p>
          <div className="space-y-3">
            {[
              { href: "/blog/reforme-facturation-micro-entrepreneur", title: "Micro-entrepreneur : ce que la réforme change vraiment pour toi" },
              { href: "/blog/choisir-plateforme-agreee-freelance", title: "Comment choisir sa plateforme agréée (PDP) quand on est indépendant" },
              { href: "/blog/e-reporting-freelance-2026", title: "E-reporting : l'obligation dont personne ne parle pour les freelances" },
              { href: "/blog/checklist-reforme-facturation-2026", title: "Checklist : êtes-vous prêt pour le 1er septembre 2026 ?" },
            ].map(({ href, title }) => (
              <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors group">
                <span className="text-indigo-500 group-hover:text-indigo-300 shrink-0">→</span>
                {title}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 p-8 text-center mb-14">
          <h2 className="text-xl font-bold text-white mb-3">Vos factures sont déjà conformes Factur-X</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Deviso génère automatiquement des factures Factur-X BASIC, le format requis par la réforme. Aucune action de votre part, la conformité est intégrée.
          </p>
          <WaitlistButton plan="free" label="Essayer Deviso gratuitement →" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm" />
        </div>

        {/* Footer métiers */}
        <footer className="border-t border-ds-border pt-8">
          <p className="text-xs text-gray-600 mb-4">Deviso, logiciel de devis et facturation pour freelances</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {metierLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">{label}</Link>
            ))}
            <Link href="/blog" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Blog</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
