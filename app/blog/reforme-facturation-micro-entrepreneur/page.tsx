import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Micro-entrepreneur et réforme facturation 2026 : ce qui change vraiment",
  description:
    "Vous êtes auto-entrepreneur ou micro-entrepreneur ? Voici ce que la réforme de facturation électronique 2026-2027 change concrètement pour vous : franchise TVA, Factur-X, plateforme agréée.",
  alternates: { canonical: "https://getdeviso.fr/blog/reforme-facturation-micro-entrepreneur" },
  openGraph: {
    title: "Micro-entrepreneur et réforme facturation 2026 : ce qui change vraiment",
    description: "La franchise TVA ne vous exempte pas. Voici ce que vous devez savoir et faire avant septembre 2027.",
    url: "https://getdeviso.fr/blog/reforme-facturation-micro-entrepreneur",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Réforme facturation micro-entrepreneur 2027" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Micro-entrepreneur et réforme facturation 2026 : ce qui change vraiment",
  datePublished: "2026-07-10",
  dateModified: "2026-07-10",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/reforme-facturation-micro-entrepreneur" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Un micro-entrepreneur est-il concerné par la réforme de facturation électronique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. À partir du 1er septembre 2027, tous les micro-entrepreneurs ayant des clients B2B (entreprises, associations, professionnels) devront émettre leurs factures au format électronique structuré (Factur-X) via une plateforme agréée (PDP). La franchise en base de TVA ne dispense pas de cette obligation.",
        },
      },
      {
        "@type": "Question",
        name: "La franchise TVA dispense-t-elle de la facturation électronique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Non. La franchise en base de TVA (régime fiscal sous seuil) et l'obligation de facturation électronique (obligation administrative) sont deux choses indépendantes. Un micro-entrepreneur en franchise de TVA devra quand même émettre des factures Factur-X pour ses clients B2B à partir de septembre 2027. Il mentionnera 'TVA non applicable - article 293B du CGI' dans les données structurées.",
        },
      },
      {
        "@type": "Question",
        name: "Un auto-entrepreneur qui facture uniquement des particuliers est-il concerné ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pas par l'e-invoicing (réservé au B2B). En revanche, il sera concerné par l'e-reporting : obligation de transmettre à la DGFiP les données de ses transactions B2C via une PDP. Le calendrier est le même : septembre 2027 pour les TPE et micro-entrepreneurs.",
        },
      },
    ],
  },
};

export default function ReformeFacturationMicroEntrepreneurPage() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso génère déjà des factures Factur-X conformes.</span>
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
          <span className="text-gray-400">Micro-entrepreneur</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">Réforme 2026 · Micro-entrepreneur</span>
            <span className="text-xs text-gray-600">7 min · Mis à jour juillet 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            Micro-entrepreneur : ce que la réforme de facturation 2026 change vraiment pour toi
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            La plupart des auto-entrepreneurs croient qu&apos;être en franchise de TVA les exemptent de la réforme. C&apos;est faux. Voici ce qui change concrètement pour toi, et ce que tu dois faire avant septembre 2027.
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-400 leading-relaxed">

          {/* Mythe 1 */}
          <section>
            <div className="bg-red-500/[0.06] border border-red-500/20 rounded-2xl p-6 mb-6">
              <p className="text-sm font-bold text-red-400 mb-2">❌ Le mythe le plus répandu</p>
              <p className="text-sm text-gray-300">&quot;Je suis en franchise de TVA, donc la facturation électronique ne me concerne pas.&quot;</p>
            </div>
            <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl p-6">
              <p className="text-sm font-bold text-emerald-400 mb-2">✓ La réalité</p>
              <p className="text-sm text-gray-300">
                La franchise en base de TVA est un <strong className="text-white">régime fiscal</strong>. La réforme de facturation électronique est une <strong className="text-white">obligation administrative et fiscale</strong> distincte. Les deux ne sont pas liés. Un micro-entrepreneur en franchise de TVA devra quand même émettre ses factures B2B au format électronique structuré à partir du 1er septembre 2027.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Ta situation selon ton type de clients</h2>
            <div className="space-y-4">
              <div className="bg-ds-surface border border-indigo-500/30 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-2">Tu factures des entreprises (B2B)</p>
                <p className="text-sm">→ Tu devras émettre tes factures au format <strong className="text-white">Factur-X</strong> via une PDP à partir du <strong className="text-white">1er septembre 2027</strong>. Les factures PDF classiques ne seront plus valides pour les transactions B2B.</p>
              </div>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-2">Tu factures des particuliers (B2C)</p>
                <p className="text-sm">→ Tu n&apos;es pas concerné par l&apos;e-invoicing (réservé au B2B). En revanche, tu seras concerné par l&apos;<strong className="text-white">e-reporting</strong> : obligation de transmettre à la DGFiP les données de tes transactions B2C (montants, dates). Même calendrier : septembre 2027.</p>
              </div>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-2">Tu factures les deux</p>
                <p className="text-sm">→ Double obligation : e-invoicing pour les clients pros, e-reporting pour les clients particuliers. Concrètement, ton logiciel de facturation s&apos;en occupera automatiquement.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Ce que la franchise TVA change dans les données de ta facture</h2>
            <p>
              Ta facture Factur-X ne contiendra pas de montant TVA (puisque tu es en franchise). Mais elle devra quand même inclure les <strong className="text-white">champs TVA</strong> dans ses données structurées, avec le code d&apos;exonération correct : <code className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded text-xs">E</code> (exempté) et la mention &quot;TVA non applicable - article 293B du CGI&quot;.
            </p>
            <p className="mt-3">
              Ce n&apos;est pas toi qui le gères : c&apos;est ton logiciel de facturation. Deviso détecte ton régime TVA (franchisé) et génère automatiquement la bonne catégorie dans le XML Factur-X. Tu n&apos;as rien à faire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Le calendrier pour toi, micro-entrepreneur</h2>
            <div className="space-y-4">
              {[
                {
                  date: "Maintenant (juillet 2026)",
                  action: "Vérifier que ton logiciel génère du Factur-X",
                  detail: "Si tu utilises Deviso, c'est déjà le cas. Si tu utilises Word, Excel ou un autre outil, c'est le moment de changer.",
                  status: "now",
                },
                {
                  date: "Septembre 2026",
                  action: "Être prêt à recevoir des e-factures de tes fournisseurs",
                  detail: "Tes fournisseurs grandes entreprises (opérateur télécom, expert-comptable corporate...) vont commencer à t'envoyer des e-factures. Assure-toi que tu peux les ouvrir.",
                  status: "soon",
                },
                {
                  date: "Début 2027",
                  action: "Choisir ta PDP",
                  detail: "Identifie la plateforme agréée par laquelle tu émettras tes factures. Dans la plupart des cas, ce sera intégré à ton logiciel de facturation.",
                  status: "future",
                },
                {
                  date: "1er septembre 2027",
                  action: "Obligation universelle, passer en e-invoicing",
                  detail: "À partir de cette date, toutes tes factures B2B doivent transiter via une PDP. Les factures PDF par email ne sont plus valides fiscalement.",
                  status: "deadline",
                },
              ].map(({ date, action, detail, status }) => (
                <div key={date} className={`rounded-xl border p-4 ${
                  status === "now" ? "border-emerald-500/30 bg-emerald-500/[0.04]" :
                  status === "soon" ? "border-amber-500/30 bg-amber-500/[0.04]" :
                  status === "deadline" ? "border-red-500/20 bg-red-500/[0.03]" :
                  "border-ds-border bg-ds-surface"
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${
                    status === "now" ? "text-emerald-400" :
                    status === "soon" ? "text-amber-400" :
                    status === "deadline" ? "text-red-400" :
                    "text-gray-500"
                  }`}>{date}</p>
                  <p className="text-sm font-medium text-white">{action}</p>
                  <p className="text-xs text-gray-500 mt-1">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Le seuil de franchise ne change pas avec la réforme</h2>
            <p>
              Autre point de confusion : certains pensent que la réforme modifie les seuils de franchise TVA. Non. Les seuils restent inchangés :
            </p>
            <div className="mt-4 bg-ds-surface border border-ds-border rounded-xl p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Prestation de services BIC :</span></div>
                <div className="text-white font-semibold">36 800 € / an</div>
                <div><span className="text-gray-500">Activités libérales BNC :</span></div>
                <div className="text-white font-semibold">36 800 € / an</div>
                <div><span className="text-gray-500">Commerce / hébergement :</span></div>
                <div className="text-white font-semibold">91 900 € / an</div>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Si tu dépasses ces seuils, tu deviens assujetti à la TVA, mais c&apos;est une question fiscale distincte de la réforme de facturation électronique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Questions fréquentes des micro-entrepreneurs</h2>
            <div className="space-y-5">
              {[
                {
                  q: "Je n'ai qu'un ou deux clients entreprises. Suis-je vraiment obligé ?",
                  a: "Oui. L'obligation ne dépend pas du nombre de clients ni du CA. Dès qu'une transaction est B2B (professionnel à professionnel), elle sera soumise à l'e-invoicing à partir de septembre 2027, quel que soit votre volume.",
                },
                {
                  q: "Mon client me demande déjà une facture Factur-X. Que faire ?",
                  a: "Certains grands groupes anticipent la réforme et demandent des factures Factur-X avant l'obligation légale. Si vous utilisez Deviso, vous pouvez télécharger votre facture en format Factur-X dès maintenant, c'est le format par défaut.",
                },
                {
                  q: "Combien va coûter la PDP ?",
                  a: "Le prix des PDP varie selon les prestataires. Certains logiciels de facturation incluront l'accès à une PDP dans leur abonnement. Deviso intégrera une PDP sans coût supplémentaire pour les utilisateurs Solo et Pro.",
                },
                {
                  q: "Est-ce que ça change quelque chose à mes déclarations URSSAF ?",
                  a: "Non. Les déclarations URSSAF (cotisations sociales) sont indépendantes de la facturation électronique. La réforme concerne uniquement le format des factures et leur transmission à la DGFiP, pas les cotisations.",
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

        {/* Liens cluster */}
        <div className="mt-14 mb-10 bg-ds-surface border border-ds-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Guide réforme 2026, tous les articles</p>
          <div className="space-y-3">
            {[
              { href: "/blog/facturation-electronique-2026", title: "Guide complet réforme facturation électronique 2026" },
              { href: "/blog/choisir-plateforme-agreee-freelance", title: "Comment choisir sa plateforme agréée (PDP)" },
              { href: "/blog/e-reporting-freelance-2026", title: "E-reporting : l'obligation B2C dont personne ne parle" },
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
          <h2 className="text-xl font-bold text-white mb-3">Factur-X inclus dans Deviso</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Toutes vos factures Deviso sont déjà au format Factur-X BASIC, le format requis par la réforme. La mention &ldquo;franchise TVA&rdquo; est gérée automatiquement selon votre régime.
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
