import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "E-reporting freelance 2026 : l'obligation B2C dont personne ne parle",
  description:
    "La facturation électronique ne concerne que le B2B ? Faux. Si vous avez des clients particuliers, vous avez une obligation d'e-reporting. Ce que les freelances B2C doivent faire avant le 1er septembre 2027.",
  alternates: { canonical: "https://getdeviso.fr/blog/e-reporting-freelance-2026" },
  openGraph: {
    title: "E-reporting freelance 2026 : l'obligation B2C oubliée",
    description: "Vous avez des clients particuliers ? L'e-reporting TVA vous concerne, même si vous n'émettez pas d'e-factures. Calendrier, obligations, amendes.",
    url: "https://getdeviso.fr/blog/e-reporting-freelance-2026",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "E-reporting freelance 2026" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "E-reporting freelance 2026 : l'obligation B2C dont personne ne parle",
  datePublished: "2026-07-10",
  dateModified: "2026-07-10",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/e-reporting-freelance-2026" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que l'e-reporting ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "L'e-reporting est l'obligation de transmettre à la DGFiP les données de transactions commerciales qui ne font pas l'objet d'une e-facture. Cela concerne principalement les ventes aux particuliers (B2C) et les ventes à l'étranger. Contrairement à l'e-invoicing (envoi de la facture structurée au client), l'e-reporting n'est pas une facture, c'est une déclaration de données fiscales.",
        },
      },
      {
        "@type": "Question",
        name: "L'e-reporting concerne-t-il les freelances en franchise de TVA ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La franchise de TVA (article 293B CGI) exonère les micro-entrepreneurs de la collecte et du versement de TVA. Elle n'exempte pas des obligations d'e-reporting. Cependant, comme les données d'e-reporting concernent principalement la TVA, les franchisés auront des déclarations simplifiées (montants HT uniquement). La DGFiP doit préciser les modalités exactes pour les franchisés.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle est l'amende en cas de non-respect de l'e-reporting ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "L'article 1737 IV du CGI prévoit une amende de 250 € par transaction non transmise, plafonnée à 15 000 € par an. Une remise totale est possible pour les petits manquements involontaires (premier manquement, régularisation rapide). Le plafond est haut, les freelances B2C réguliers ont intérêt à mettre en place le reporting rapidement.",
        },
      },
    ],
  },
};

export default function EReportingFreelancePage() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="fixed top-0 left-0 right-0 bg-amber-950/90 backdrop-blur-sm border-b border-amber-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-amber-400 font-semibold">Angle mort de la réforme&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">L&apos;e-reporting B2C est rarement mentionné, mais il concerne aussi les freelances qui vendent aux particuliers.</span>
      </div>

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
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Connexion</Link>
            <WaitlistButton plan="free" label="Essayer gratuitement" className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors" />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-36 pb-20">
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-400 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gray-400 transition-colors">Blog</Link>
          <span>/</span>
          <Link href="/blog/facturation-electronique-2026" className="hover:text-gray-400 transition-colors">Réforme 2026</Link>
          <span>/</span>
          <span className="text-gray-400">E-reporting</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">Réforme 2026 · E-reporting</span>
            <span className="text-xs text-gray-600">7 min · Mis à jour juillet 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            E-reporting freelance 2026 : l&apos;obligation B2C dont personne ne parle
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Tout le monde parle de la facturation électronique pour les transactions B2B. Mais si vous avez des clients particuliers, ou si vous vendez à l&apos;étranger, vous avez une deuxième obligation : l&apos;<strong className="text-white">e-reporting</strong>. Tour d&apos;horizon complet.
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-4">E-invoicing vs e-reporting : quelle différence ?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-indigo-500/[0.05] border border-indigo-500/20 rounded-xl p-5">
                <p className="text-sm font-bold text-indigo-300 mb-3">E-invoicing (facturation électronique)</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> <span>Transactions <strong className="text-white">B2B</strong> entre entreprises françaises assujetties à la TVA</span></li>
                  <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> <span>La <strong className="text-white">facture elle-même</strong> est transmise via une PDP dans un format structuré (Factur-X)</span></li>
                  <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> <span>Remplace le PDF classique</span></li>
                  <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span> <span>Obligation à partir de sept. 2026 (grandes entreprises) → sept. 2027 (tous)</span></li>
                </ul>
              </div>
              <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-xl p-5">
                <p className="text-sm font-bold text-amber-300 mb-3">E-reporting (déclaration de données)</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="text-amber-400 shrink-0">→</span> <span>Transactions <strong className="text-white">B2C</strong> (clients particuliers) + ventes à l&apos;étranger</span></li>
                  <li className="flex gap-2"><span className="text-amber-400 shrink-0">→</span> <span><strong className="text-white">Données fiscales</strong> transmises à la DGFiP (pas la facture complète)</span></li>
                  <li className="flex gap-2"><span className="text-amber-400 shrink-0">→</span> <span>Le client ne reçoit pas d&apos;e-facture : il reçoit un PDF ou un ticket comme avant</span></li>
                  <li className="flex gap-2"><span className="text-amber-400 shrink-0">→</span> <span>Mêmes échéances que l&apos;e-invoicing</span></li>
                </ul>
              </div>
            </div>
            <p className="mt-4">
              En résumé : <strong className="text-white">l&apos;e-invoicing change comment vous envoyez vos factures B2B ; l&apos;e-reporting ajoute une obligation de reporting fiscal sur toutes les autres transactions.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Qui est concerné par l&apos;e-reporting ?</h2>
            <p>L&apos;e-reporting concerne toutes les entreprises assujetties à la TVA qui réalisent des opérations non couvertes par l&apos;e-invoicing :</p>
            <div className="mt-4 space-y-3">
              {[
                { icon: "✓", color: "text-amber-400", label: "Freelances avec des clients particuliers (B2C)", desc: "Photographe de mariage, coach personnel, rédacteur pour des blogueurs indépendants, etc." },
                { icon: "✓", color: "text-amber-400", label: "Exportateurs et prestataires de services à l'étranger", desc: "Clients en dehors de l'UE, mais aussi clients professionnels hors de France." },
                { icon: "✓", color: "text-amber-400", label: "Ventes à des associations ou entités non-TVA", desc: "Les associations qui ne récupèrent pas la TVA sont traitées comme des particuliers pour l'e-reporting." },
                { icon: "×", color: "text-gray-600", label: "Non concerné : freelance 100% B2B avec des entreprises françaises", desc: "Dans ce cas, toutes les transactions sont couvertes par l'e-invoicing. Pas d'e-reporting supplémentaire." },
              ].map(({ icon, color, label, desc }) => (
                <div key={label} className="flex gap-3 bg-ds-surface border border-ds-border rounded-xl p-4">
                  <span className={`font-bold shrink-0 ${color}`}>{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Quelles données déclarer et à quelle fréquence ?</h2>
            <p>
              Pour chaque période, vous transmettez à la DGFiP via votre PDP un <strong className="text-white">récapitulatif de vos opérations B2C</strong>. Vous n&apos;avez pas à déclarer chaque facture unitairement (sauf si votre logiciel le fait automatiquement) : vous pouvez regrouper par période.
            </p>
            <div className="mt-5 bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
              <div className="bg-ds-elevated px-4 py-3 border-b border-ds-border">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Données à transmettre</p>
              </div>
              <div className="divide-y divide-ds-border">
                {[
                  { champ: "Montant HT total", detail: "Total des ventes B2C de la période" },
                  { champ: "Montant de TVA collectée", detail: "Par taux applicable (0%, 5,5%, 10%, 20%)" },
                  { champ: "Période de reporting", detail: "Mensuelle (si CA > seuil) ou trimestrielle" },
                  { champ: "Nature de l'opération", detail: "Vente de biens / prestation de services" },
                  { champ: "Pays du client", detail: "France / UE / hors UE" },
                ].map(({ champ, detail }) => (
                  <div key={champ} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <span className="font-medium text-white">{champ}</span>
                    <span className="text-gray-500 text-right">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm">
              <strong className="text-white">Fréquence :</strong> mensuelle pour les assujettis avec un CA élevé ou un régime réel mensuel de TVA. Trimestrielle pour les autres. La périodicité suit celle de votre déclaration de TVA (CA3 mensuelle ou trimestrielle).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Et si je suis en franchise de TVA ?</h2>
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <p className="text-sm font-semibold text-white mb-3">Franchise de TVA (article 293B CGI), statut des micro-entrepreneurs</p>
              <p className="text-sm mb-3">
                La franchise de TVA vous <strong className="text-white">exonère de la collecte et du versement de TVA</strong>. Elle ne supprime pas automatiquement l&apos;obligation d&apos;e-reporting, mais elle la simplifie considérablement.
              </p>
              <p className="text-sm mb-3">
                Comme vous ne facturez pas de TVA, vos déclarations d&apos;e-reporting ne contiendront <strong className="text-white">que des montants HT à 0% de TVA</strong>. En pratique, le reporting sera minimal : vous confirmez simplement vos ventes avec mention TVA non applicable.
              </p>
              <p className="text-sm text-amber-400">
                La DGFiP n&apos;a pas encore publié les modalités exactes pour les franchisés TVA. Deviso mettra à jour ses outils dès que les décrets d&apos;application seront publiés.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Calendrier e-reporting</h2>
            <p className="text-sm text-gray-500 mb-4">Mêmes échéances que l&apos;e-invoicing, par tranche d&apos;entreprise :</p>
            <div className="space-y-3">
              {[
                {
                  date: "1er septembre 2026",
                  qui: "Grandes entreprises (CA > 250M€)",
                  obligation: "E-reporting obligatoire",
                  urgency: "high",
                },
                {
                  date: "1er décembre 2026",
                  qui: "ETI (50M€ – 250M€ de CA)",
                  obligation: "E-reporting obligatoire",
                  urgency: "medium",
                },
                {
                  date: "1er septembre 2027",
                  qui: "PME, TPE, micro-entrepreneurs",
                  obligation: "E-reporting obligatoire, tous les freelances concernés",
                  urgency: "low",
                },
              ].map(({ date, qui, obligation, urgency }) => (
                <div
                  key={date}
                  className={`flex gap-4 rounded-xl p-4 border ${
                    urgency === "high"
                      ? "border-red-500/30 bg-red-500/[0.04]"
                      : urgency === "medium"
                      ? "border-amber-500/30 bg-amber-500/[0.04]"
                      : "border-ds-border bg-ds-surface"
                  }`}
                >
                  <div className="shrink-0 text-right min-w-[130px]">
                    <p className={`text-sm font-bold ${urgency === "high" ? "text-red-400" : urgency === "medium" ? "text-amber-400" : "text-gray-300"}`}>{date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{qui}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{obligation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Risques en cas de non-conformité</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-red-500/[0.05] border border-red-500/20 rounded-xl p-5">
                <p className="text-sm font-bold text-red-400 mb-3">Amende e-reporting (art. 1737 IV CGI)</p>
                <p className="text-sm text-gray-300">
                  <strong>250 € par transaction</strong> non déclarée, plafonnée à <strong>15 000 € / an</strong>.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Remise possible si premier manquement et régularisation dans les 30 jours.
                </p>
              </div>
              <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-xl p-5">
                <p className="text-sm font-bold text-amber-400 mb-3">Contrôle fiscal facilité</p>
                <p className="text-sm text-gray-300">
                  La DGFiP aura accès en temps réel aux données de transactions. L&apos;incohérence entre l&apos;e-reporting et votre déclaration de TVA sera détectée automatiquement.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Ce que Deviso fait pour vous</h2>
            <p>
              Deviso intégrera l&apos;e-reporting de manière transparente. Concrètement :
            </p>
            <ul className="mt-3 space-y-3">
              {[
                "Chaque facture créée dans Deviso alimente automatiquement les données d'e-reporting (B2C ou B2B).",
                "La classification B2C / B2B est déduite du type de client (particulier vs entreprise avec SIRET).",
                "Le rapport de données est transmis à la DGFiP via PDP aux dates prévues, sans action de votre part.",
                "Un tableau de bord e-reporting vous montrera l'état de vos déclarations en temps réel.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-indigo-400 shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">FAQ e-reporting</h2>
            <div className="space-y-5">
              {[
                {
                  q: "Je facture des entreprises ET des particuliers. Dois-je faire e-invoicing ET e-reporting ?",
                  a: "Oui. Les factures B2B françaises passeront en e-invoicing (via PDP). Les ventes aux particuliers (B2C) seront couvertes par l'e-reporting. Si votre logiciel est connecté à une PDP, les deux obligations seront gérées automatiquement selon le type de client.",
                },
                {
                  q: "J'ai un client association qui paye des prestations. C'est du B2B ou du B2C pour l'e-reporting ?",
                  a: "Les associations n'étant généralement pas assujetties à la TVA, elles sont traitées comme des particuliers pour l'e-reporting : vos factures à des associations relèvent de l'e-reporting, pas de l'e-invoicing. Exception : certaines associations réalisant des activités économiques peuvent être assujetties. Vérifiez avec votre expert-comptable.",
                },
                {
                  q: "Ai-je besoin d'un logiciel spécifique pour faire l'e-reporting ?",
                  a: "Non. Vous avez besoin d'un logiciel connecté à une PDP (ou qui est lui-même une PDP). La PDP gère la transmission. Si votre logiciel de facturation intègre une PDP, vous n'avez rien à faire de plus.",
                },
                {
                  q: "L'e-reporting remplace-t-il ma déclaration de TVA (CA3) ?",
                  a: "Non. L'e-reporting et la déclaration de TVA CA3 coexistent. L'e-reporting sert à la DGFiP à pré-remplir et contrôler votre CA3. À terme, la DGFiP espère pouvoir proposer des déclarations TVA pré-remplies, mais ce n'est pas l'objectif immédiat.",
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

        <div className="mt-14 mb-10 bg-ds-surface border border-ds-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Cluster réforme 2026</p>
          <div className="space-y-3">
            {[
              { href: "/blog/facturation-electronique-2026", title: "Guide complet réforme facturation électronique 2026" },
              { href: "/blog/reforme-facturation-micro-entrepreneur", title: "Micro-entrepreneur : ce que la réforme change pour toi" },
              { href: "/blog/choisir-plateforme-agreee-freelance", title: "Comment choisir sa plateforme agréée (PDP)" },
              { href: "/blog/checklist-reforme-facturation-2026", title: "Checklist réforme 2026 : êtes-vous prêt ?" },
            ].map(({ href, title }) => (
              <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors group">
                <span className="text-indigo-500 group-hover:text-indigo-300 shrink-0">→</span>
                {title}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 p-8 text-center mb-14">
          <h2 className="text-xl font-bold text-white mb-3">E-reporting intégré, rien à faire</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Deviso gérera automatiquement l&apos;e-reporting B2C et l&apos;e-invoicing B2B. Vous créez vos factures comme aujourd&apos;hui, la conformité 2026-2027 est prise en charge.
          </p>
          <WaitlistButton plan="free" label="Essayer Deviso 14 jours →" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm" />
        </div>

        <footer className="border-t border-ds-border pt-8">
          <Link href="/blog" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Retour au blog</Link>
        </footer>
      </main>
    </div>
  );
}
