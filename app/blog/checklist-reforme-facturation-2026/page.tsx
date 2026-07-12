import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Checklist réforme facturation 2026 : êtes-vous prêt ? (7 points à vérifier)",
  description:
    "La réforme de la facturation électronique entre en vigueur le 1er septembre 2026. En 7 points clés, vérifiez si vous êtes prêt : logiciel, format Factur-X, PDP, e-reporting, mentions légales et plus.",
  alternates: { canonical: "https://getdeviso.fr/blog/checklist-reforme-facturation-2026" },
  openGraph: {
    title: "Checklist réforme facturation 2026 pour freelances",
    description: "7 points à vérifier avant septembre 2026 pour être en conformité avec la réforme de facturation électronique.",
    url: "https://getdeviso.fr/blog/checklist-reforme-facturation-2026",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Checklist réforme facturation 2026" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Checklist réforme facturation 2026 : êtes-vous prêt ?",
  datePublished: "2026-07-10",
  dateModified: "2026-07-10",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/checklist-reforme-facturation-2026" },
};

type ChecklistItem = {
  num: string;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  action: string;
  details?: string[];
};

const CHECKLIST: ChecklistItem[] = [
  {
    num: "01",
    title: "Identifier si vous êtes une grande entreprise, ETI ou PME/TPE",
    description: "Votre date d'obligation dépend de votre taille. Si vous êtes freelance ou micro-entrepreneur, votre échéance est le 1er septembre 2027, mais vous devrez aussi recevoir des e-factures dès septembre 2026.",
    urgency: "high",
    action: "Vérifier votre catégorie dans le portail impots.gouv.fr ou avec votre expert-comptable.",
    details: [
      "Grande entreprise (CA > 250M€) → obligation émission : sept. 2026",
      "ETI (50M–250M€ CA) → obligation émission : déc. 2026",
      "PME, TPE, micro-entrepreneur → obligation émission : sept. 2027",
      "Tous → obligation réception : sept. 2026",
    ],
  },
  {
    num: "02",
    title: "Vérifier que votre logiciel de facturation supporte le Factur-X",
    description: "Le format Factur-X (PDF/A-3 + XML EN 16931) est le format pivot de la réforme pour les PME et indépendants. Si votre logiciel génère des PDF classiques ou des factures Word, il n'est pas conforme.",
    urgency: "high",
    action: "Contacter l'éditeur de votre logiciel et demander : « Générez-vous des factures Factur-X BASIC conformes à la norme EN 16931 ? »",
    details: [
      "Factur-X BASIC = le profil adapté aux PME et indépendants",
      "Factur-X MINIMUM = très simplifié, limité à certains cas",
      "XRechnung, UBL = autres formats admis mais moins courants en France",
    ],
  },
  {
    num: "03",
    title: "Confirmer que votre logiciel sera connecté à une PDP avant votre date d'obligation",
    description: "Le Portail Public de Facturation (PPF) est abandonné. Seules les PDP (plateformes privées certifiées) peuvent transmettre les e-factures à la DGFiP. Votre logiciel doit être connecté à une PDP.",
    urgency: "high",
    action: "Demander à votre éditeur logiciel : « Avez-vous un partenariat PDP ? Quelle PDP ? Pour quand ? »",
    details: [
      "Si votre éditeur dit « on passera par le PPF » → c'est faux, le PPF est abandonné depuis oct. 2024",
      "Vérifier que la PDP partenaire est bien immatriculée sur la liste DGFiP",
    ],
  },
  {
    num: "04",
    title: "Vérifier les mentions légales obligatoires sur vos factures",
    description: "La réforme impose des données structurées dans le XML Factur-X. Certains champs sont désormais obligatoires dans la partie visible (PDF) ET dans les données XML : SIRET, N° de TVA, adresse complète, numéro de commande si applicable.",
    urgency: "medium",
    action: "Passer en revue vos modèles de facture et vous assurer que tous les champs requis par l'article 242 nonies A du CGI sont présents.",
    details: [
      "SIRET (pas seulement SIREN)",
      "Numéro de TVA intracommunautaire (si applicable)",
      "Adresse de livraison si différente de l'adresse de facturation",
      "Numéro de bon de commande du client (souvent exigé en B2B)",
    ],
  },
  {
    num: "05",
    title: "Déterminer si vous avez une obligation d'e-reporting (B2C ou international)",
    description: "Si vous avez des clients particuliers OU des clients à l'étranger, vous avez une obligation d'e-reporting TVA en plus de l'e-invoicing B2B. L'e-reporting est souvent oublié dans les guides, mais les amendes sont significatives (250€/transaction).",
    urgency: "medium",
    action: "Lister vos types de clients : B2B France, B2B étranger, B2C (particuliers), associations. Chaque catégorie a un traitement différent.",
    details: [
      "B2B France → e-invoicing via PDP",
      "B2C (particuliers) → e-reporting à la DGFiP",
      "B2B étranger → e-reporting à la DGFiP",
      "Associations (non assujetties TVA) → e-reporting généralement",
    ],
  },
  {
    num: "06",
    title: "Vérifier la gestion de la TVA et votre statut franchise",
    description: "Si vous êtes en franchise de TVA (micro-entrepreneur sous seuils), vous devrez probablement faire de l'e-reporting simplifié. Si vous avez dépassé les seuils et êtes passé au régime réel, vous êtes pleinement concerné par l'e-invoicing.",
    urgency: "medium",
    action: "Vérifier votre statut TVA actuel (franchise 293B CGI vs assujetti) et les seuils applicables à votre activité pour 2026-2027.",
    details: [
      "Seuil franchise BNC : 36 800€ (2024-2026), vérifier la revalorisation 2027",
      "Si CA > seuil franchise → vous devenez assujetti TVA → e-invoicing plein",
      "Si franchise → e-reporting simplifié (modalités à préciser par décret)",
    ],
  },
  {
    num: "07",
    title: "Planifier la formation et le test avant votre date d'obligation",
    description: "La réforme introduit de nouveaux workflows : envoi via PDP, suivi des statuts (DEPOSEE, VALIDEE, REJETEE), gestion des rejets. Tester avant le go-live est indispensable pour éviter les incidents en production.",
    urgency: "low",
    action: "Demander à votre éditeur logiciel l'accès à un environnement de test (sandbox) et réaliser au moins 5 factures de test avec votre PDP avant septembre.",
    details: [
      "Tester une facture standard B2B",
      "Tester un avoir/note de crédit",
      "Tester une facture avec TVA à taux réduit et une en franchise",
      "Vérifier le suivi de statuts (DEPOSEE → VALIDEE ou REJETEE)",
      "Tester la réception d'une e-facture de fournisseur",
    ],
  },
];

export default function ChecklistReforme2026Page() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-white font-semibold">1er septembre 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">Grandes entreprises → e-facturation obligatoire. Toutes → obligation de réception.</span>
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
          <span className="text-gray-400">Checklist</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">Réforme 2026 · Checklist</span>
            <span className="text-xs text-gray-600">10 min · Mis à jour juillet 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            Checklist réforme facturation 2026 : 7 points à vérifier pour être prêt
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            La réforme de la facturation électronique est complexe. Pour éviter de passer à côté d&apos;un point critique, nous avons condensé les actions essentielles en une checklist actionnable, à partager avec votre comptable.
          </p>
        </div>

        {/* Score global */}
        <div className="mb-10 bg-ds-surface border border-ds-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Votre score de préparation</h2>
            <span className="text-xs text-gray-500">7 points à cocher</span>
          </div>
          <div className="h-2 bg-ds-elevated rounded-full overflow-hidden">
            <div className="h-full w-0 bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-gray-600 mt-3 italic">Cochez les points au fur et à mesure dans cet article pour évaluer votre préparation.</p>
        </div>

        {/* Légende urgence */}
        <div className="flex items-center gap-4 text-xs mb-8 text-gray-500">
          <span>Priorité :</span>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/60 shrink-0" /> Haute</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500/60 shrink-0" /> Moyenne</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500/40 shrink-0" /> Planification</div>
        </div>

        {/* Checklist items */}
        <div className="space-y-6 mb-14">
          {CHECKLIST.map((item) => (
            <div
              key={item.num}
              className={`rounded-2xl border overflow-hidden ${
                item.urgency === "high"
                  ? "border-red-500/25"
                  : item.urgency === "medium"
                  ? "border-amber-500/20"
                  : "border-ds-border"
              }`}
            >
              <div
                className={`px-5 py-4 flex items-start gap-4 ${
                  item.urgency === "high"
                    ? "bg-red-500/[0.04]"
                    : item.urgency === "medium"
                    ? "bg-amber-500/[0.03]"
                    : "bg-ds-surface"
                }`}
              >
                <div className="flex items-center gap-3 shrink-0 mt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.urgency === "high" ? "bg-red-500/60" : item.urgency === "medium" ? "bg-amber-500/60" : "bg-indigo-500/40"
                    }`}
                  />
                  <span className="text-2xl font-black text-white/10 leading-none tabular-nums">{item.num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-ds-border bg-ds-bg space-y-3">
                <div className="flex gap-2">
                  <span className="text-xs font-semibold text-indigo-400 shrink-0 mt-0.5">→ ACTION</span>
                  <p className="text-xs text-gray-300">{item.action}</p>
                </div>
                {item.details && item.details.length > 0 && (
                  <ul className="space-y-1.5">
                    {item.details.map((d) => (
                      <li key={d} className="flex gap-2 text-xs text-gray-500">
                        <span className="text-gray-700 shrink-0">·</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif des échéances */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-white mb-5">Récapitulatif des échéances</h2>
          <div className="bg-ds-surface border border-ds-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-ds-border text-sm">
              {[
                { date: "1er sept. 2026", action: "Grandes entreprises : émission e-factures obligatoire", extra: "Toutes entreprises : réception obligatoire" },
                { date: "1er déc. 2026", action: "ETI : émission e-factures obligatoire", extra: "" },
                { date: "1er sept. 2027", action: "PME, TPE, micro-entrepreneurs : émission obligatoire", extra: "E-reporting B2C/international obligatoire pour tous" },
              ].map(({ date, action, extra }) => (
                <div key={date} className="flex gap-4 px-5 py-4">
                  <span className="font-semibold text-indigo-300 shrink-0 min-w-[120px]">{date}</span>
                  <div>
                    <p className="text-white">{action}</p>
                    {extra && <p className="text-gray-500 text-xs mt-0.5">{extra}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Liens cluster */}
        <div className="mb-10 bg-ds-surface border border-ds-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Pour aller plus loin</p>
          <div className="space-y-3">
            {[
              { href: "/blog/facturation-electronique-2026", title: "Guide complet réforme facturation électronique 2026" },
              { href: "/blog/reforme-facturation-micro-entrepreneur", title: "Micro-entrepreneur : tout ce que la réforme change" },
              { href: "/blog/choisir-plateforme-agreee-freelance", title: "Choisir sa PDP (plateforme agréée) : guide comparatif" },
              { href: "/blog/e-reporting-freelance-2026", title: "E-reporting B2C : l'obligation oubliée de la réforme" },
            ].map(({ href, title }) => (
              <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors group">
                <span className="text-indigo-500 group-hover:text-indigo-300 shrink-0">→</span>
                {title}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 p-8 text-center mb-14">
          <h2 className="text-xl font-bold text-white mb-3">Préparez-vous sans stress avec Deviso</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Deviso génère déjà des factures Factur-X BASIC. L&apos;intégration PDP arrive avant septembre 2027. Essayez gratuitement pendant 14 jours, sans carte bancaire.
          </p>
          <WaitlistButton plan="free" label="Essayer Deviso gratuitement →" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm" />
          <p className="text-xs text-gray-600 mt-3">Factur-X inclus · PDP avant sept. 2027 · E-reporting géré automatiquement</p>
        </div>

        <footer className="border-t border-ds-border pt-8">
          <Link href="/blog" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Retour au blog</Link>
        </footer>
      </main>
    </div>
  );
}
