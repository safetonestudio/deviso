import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Les clauses indispensables dans un devis freelance, Guide complet 2026",
  description:
    "Périmètre, acompte, révisions, propriété intellectuelle, résiliation, NDA, toutes les clauses à inclure dans votre devis freelance pour vous protéger juridiquement. Guide complet avec exemples de formulations.",
  alternates: { canonical: "https://getdeviso.fr/blog/clauses-devis-freelance" },
  openGraph: {
    title: "Les clauses indispensables dans un devis freelance, Guide complet 2026",
    description: "Périmètre, acompte, révisions, droits d'auteur, résiliation, NDA, les 9 clauses à ne jamais oublier dans votre devis freelance.",
    url: "https://getdeviso.fr/blog/clauses-devis-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Les clauses indispensables dans un devis freelance, Guide complet 2026",
    description: "Les 9 clauses à ne jamais oublier dans votre devis freelance pour vous protéger de tous les risques.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Les clauses indispensables dans un devis freelance, Guide complet 2026",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/clauses-devis-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Un devis freelance a-t-il la même valeur juridique qu'un contrat ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, un devis signé des deux parties constitue un contrat au sens juridique. Il engage le freelance à réaliser la prestation décrite aux conditions mentionnées, et le client à payer le prix convenu. Les clauses que vous incluez dans votre devis ont donc une valeur contractuelle pleine et entière.",
        },
      },
      {
        "@type": "Question",
        name: "Les pénalités de retard sont-elles obligatoires dans une facture ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, pour les relations entre professionnels (B2B), la mention des pénalités de retard est obligatoire sur les factures (Code de commerce, art. L441-9). Le taux minimum légal est 3 fois le taux d'intérêt légal. Il est fortement recommandé de les mentionner aussi dans le devis.",
        },
      },
      {
        "@type": "Question",
        name: "Quand les droits d'auteur sont-ils transférés au client ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sans mention contraire, les droits d'auteur appartiennent au créateur (graphiste, développeur, photographe, traducteur, rédacteur). La cession des droits doit être explicitement mentionnée dans le devis ou contrat, avec la durée, le territoire et les supports d'exploitation. La pratique la plus courante : la cession est conditionnée au paiement intégral de la facture.",
        },
      },
    ],
  },
};

const clauses = [
  {
    id: "perimetre",
    num: "01",
    title: "Clause de périmètre",
    risk: "Scope creep",
    color: "indigo",
    desc: "C'est la clause la plus importante pour la majorité des freelances. Elle définit exactement ce que couvre la mission, et implicitement, tout ce qui n'en fait pas partie. Sans elle, votre client peut légitimement considérer que \"une page de plus\", \"un onglet supplémentaire\" ou \"juste une petite modification\" sont inclus dans le prix.",
    formulation: "La présente mission couvre exclusivement les prestations décrites ci-dessus. Toute demande supplémentaire non prévue dans ce devis fera l'objet d'un avenant tarifé, établi et accepté avant toute exécution.",
    professions: [
      { label: "Développeur web", href: "/freelance-developpeur" },
      { label: "Consultant indépendant", href: "/freelance-consultant" },
      { label: "Community manager", href: "/freelance-community-manager" },
      { label: "Graphiste freelance", href: "/freelance-graphiste" },
    ],
    tip: "Soyez aussi précis que possible dans la description de la mission. Plus le périmètre est détaillé, plus la clause est solide.",
  },
  {
    id: "acompte",
    num: "02",
    title: "Clause d'acompte",
    risk: "Défaut de paiement, annulation",
    color: "violet",
    desc: "L'acompte protège votre trésorerie et dissuade les clients de mauvaise foi. Un client qui a payé 40% d'acompte est beaucoup plus engagé qu'un client sans acompte. Cette clause doit préciser le montant de l'acompte, sa non-restituabilité en cas d'annulation, et les conditions de démarrage de la mission.",
    formulation: "Un acompte de [X]% du montant total HT, soit [montant] €, est exigible à la signature du présent devis. La mission débutera à réception de cet acompte. En cas d'annulation de la mission par le client après signature, l'acompte versé reste acquis au prestataire à titre d'indemnité.",
    professions: [
      { label: "Artisan BTP", href: "/freelance-artisan" },
      { label: "Photographe freelance", href: "/freelance-photographe" },
      { label: "Coach freelance", href: "/freelance-coach" },
      { label: "Formateur indépendant", href: "/freelance-formateur" },
    ],
    tip: "30 à 40% est la norme B2B. Pour les particuliers, la loi réglemente les acomptes selon le type de prestation.",
  },
  {
    id: "revisions",
    num: "03",
    title: "Clause de révisions",
    risk: "Aller-retours infinis",
    color: "blue",
    desc: "Sans cette clause, vous pouvez vous retrouver à refaire votre travail indéfiniment. Le client a \"juste quelques retours\", et le cycle ne s'arrête jamais. Définissez le nombre de cycles de révisions inclus, ce qu'est une révision (vs une modification de brief), et le tarif applicable au-delà.",
    formulation: "Le présent devis inclut [X] cycle(s) de révisions mineures (ajustements limités dans le cadre du brief initial). Au-delà, toute modification sera facturée au taux horaire de [X] €/heure. Toute modification substantielle du brief initial (changement d'orientation, de cible, de format) constitue une nouvelle prestation et fera l'objet d'un avenant.",
    professions: [
      { label: "Graphiste freelance", href: "/freelance-graphiste" },
      { label: "Rédacteur & copywriter", href: "/freelance-redacteur" },
      { label: "Développeur web", href: "/freelance-developpeur" },
      { label: "Traducteur freelance", href: "/freelance-traducteur" },
    ],
    tip: "Distinguez toujours \"révision mineure\" (corriger une faute, ajuster une couleur) de \"modification substantielle\" (changer complètement le concept).",
  },
  {
    id: "propriete-intellectuelle",
    num: "04",
    title: "Clause de propriété intellectuelle",
    risk: "Utilisation non autorisée, litige sur les droits",
    color: "emerald",
    desc: "Par défaut en droit français, les créations intellectuelles appartiennent à leur auteur, pas au client. Sans clause de cession, votre client n'est pas légalement autorisé à utiliser votre travail pour des usages non convenus. Cette clause doit préciser ce qui est cédé : durée, territoire, supports, et à quelle condition (souvent : paiement intégral).",
    formulation: "Les droits d'exploitation de la création réalisée dans le cadre de la présente mission sont cédés au client à titre exclusif, pour une durée de [X ans / indéfinie], sur le territoire [France / monde entier], pour les supports [web, print, broadcast...]. Cette cession est conditionnée au paiement intégral des sommes dues. En cas de non-paiement, le prestataire se réserve le droit de réclamer le retrait de toute utilisation de la création.",
    professions: [
      { label: "Graphiste freelance", href: "/freelance-graphiste" },
      { label: "Photographe freelance", href: "/freelance-photographe" },
      { label: "Rédacteur & copywriter", href: "/freelance-redacteur" },
      { label: "Traducteur freelance", href: "/freelance-traducteur" },
      { label: "Développeur web", href: "/freelance-developpeur" },
    ],
    tip: "La cession conditionnée au paiement est votre meilleure garantie : le client ne peut pas utiliser votre travail sans vous avoir payé.",
  },
  {
    id: "penalites-retard",
    num: "05",
    title: "Clause de pénalités de retard",
    risk: "Retards de paiement chroniques",
    color: "amber",
    desc: "Entre professionnels, la mention des pénalités de retard est une obligation légale sur les factures (Code de commerce). Il est fortement conseillé de les mentionner aussi dans le devis. Une indemnité forfaitaire de 40€ pour frais de recouvrement est également due de plein droit en cas de retard B2B, sans mise en demeure préalable.",
    formulation: "Tout retard de paiement au-delà de la date d'échéance entraînera automatiquement l'application de pénalités de retard au taux de [3 fois le taux légal en vigueur / taux conventionnel], calculées sur le montant TTC impayé. Une indemnité forfaitaire de 40 € pour frais de recouvrement sera également due conformément à l'article L441-10 du Code de commerce.",
    professions: [
      { label: "Consultant indépendant", href: "/freelance-consultant" },
      { label: "Développeur web", href: "/freelance-developpeur" },
      { label: "Community manager", href: "/freelance-community-manager" },
    ],
    tip: "En 2026, le taux légal est publié annuellement au Journal Officiel. Vous pouvez aussi fixer un taux conventionnel supérieur, librement négocié.",
  },
  {
    id: "resiliation",
    num: "06",
    title: "Clause de résiliation",
    risk: "Arrêt brutal de la mission",
    color: "rose",
    desc: "Essentielle pour les missions récurrentes (forfaits mensuels, programmes longs). Sans clause de résiliation, un client peut vous arrêter du jour au lendemain après que vous avez organisé tout votre planning. Prévoyez un préavis, les conditions de remboursement, et ce qui se passe pour les prestations déjà réalisées.",
    formulation: "En cas de résiliation du présent contrat par l'une ou l'autre des parties, un préavis de [30 jours] est requis. Les prestations réalisées jusqu'à la date effective de résiliation restent dues et seront facturées au prorata. L'acompte versé à la signature n'est pas remboursable. En cas de résiliation à l'initiative du client avant le terme prévu, le prestataire se réserve le droit de facturer [X% du montant restant] au titre de manque à gagner.",
    professions: [
      { label: "Community manager", href: "/freelance-community-manager" },
      { label: "Coach freelance", href: "/freelance-coach" },
      { label: "Formateur indépendant", href: "/freelance-formateur" },
    ],
    tip: "Pour les programmes longs (coaching, formation, abonnements CM), un minimum de 3 mois d'engagement est fortement recommandé.",
  },
  {
    id: "annulation",
    num: "07",
    title: "Clause d'annulation",
    risk: "Annulation de dernière minute, perte de créneau",
    color: "orange",
    desc: "Différente de la résiliation (qui concerne les missions longues), la clause d'annulation protège pour les prestations ponctuelles : shooting photo, chantier, session de formation. Si votre client annule la veille, vous perdez le créneau que vous auriez pu vendre à quelqu'un d'autre.",
    formulation: "En cas d'annulation par le client dans un délai de [48h / 7 jours] avant la date de prestation, l'acompte versé reste acquis au prestataire. En cas d'annulation avec moins de [24h] de préavis, le montant total de la prestation reste dû. Le prestataire se réserve le droit d'annuler en cas de force majeure (intempéries, sinistre, maladie) et proposera un report à une date convenue d'un commun accord.",
    professions: [
      { label: "Photographe freelance", href: "/freelance-photographe" },
      { label: "Artisan BTP", href: "/freelance-artisan" },
      { label: "Formateur indépendant", href: "/freelance-formateur" },
      { label: "Coach freelance", href: "/freelance-coach" },
    ],
    tip: "Adaptez le délai de préavis à votre métier : 24h pour un shooting, 7 jours pour un chantier, 15 jours pour une formation inter-entreprises.",
  },
  {
    id: "confidentialite",
    num: "08",
    title: "Clause de confidentialité (NDA)",
    risk: "Divulgation d'informations sensibles",
    color: "slate",
    desc: "Si votre client partage des informations sensibles (stratégie, données clients, code source, formulations), il a besoin de savoir qu'elles restent confidentielles. Cette clause est particulièrement importante pour les missions en B2B avec des PME ou des grands comptes. Un NDA séparé peut être demandé pour les missions très sensibles.",
    formulation: "Le prestataire s'engage à traiter comme strictement confidentielles toutes les informations de nature confidentielle communiquées par le client dans le cadre de la mission (données commerciales, techniques, financières, stratégiques). Cette obligation de confidentialité s'applique pendant la durée de la mission et pour une période de [2 ans] après son terme. Le prestataire s'engage à ne pas utiliser ces informations à des fins autres que l'exécution de la mission.",
    professions: [
      { label: "Consultant indépendant", href: "/freelance-consultant" },
      { label: "Développeur web", href: "/freelance-developpeur" },
      { label: "Traducteur freelance", href: "/freelance-traducteur" },
    ],
    tip: "Pour les missions très sensibles (levée de fonds, fusion-acquisition, produit en stealth mode), demandez un NDA signé séparément avant même de commencer les discussions.",
  },
  {
    id: "force-majeure",
    num: "09",
    title: "Clause de force majeure",
    risk: "Événements exceptionnels imprévus",
    color: "zinc",
    desc: "La force majeure couvre les événements imprévisibles, extérieurs et irrésistibles qui empêchent l'exécution de la mission : pandémie, catastrophe naturelle, grève générale, sinistre. Sans cette clause, vous pouvez être tenu responsable d'un retard dû à des circonstances totalement indépendantes de votre volonté.",
    formulation: "Ni le prestataire ni le client ne pourront être tenus responsables d'un retard ou d'une inexécution de leurs obligations résultant d'un cas de force majeure au sens de l'article 1218 du Code civil. En cas de force majeure persistant plus de [30 jours], chaque partie pourra résilier le contrat sans pénalités, les prestations réalisées restant dues.",
    professions: [
      { label: "Artisan BTP", href: "/freelance-artisan" },
      { label: "Formateur indépendant", href: "/freelance-formateur" },
      { label: "Photographe freelance", href: "/freelance-photographe" },
    ],
    tip: "Depuis la pandémie de 2020, cette clause est devenue incontournable. Les tribunaux ont développé une jurisprudence claire sur ce qui constitue ou non un cas de force majeure.",
  },
];

const colorMap: Record<string, string> = {
  indigo: "border-indigo-500/30 bg-indigo-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  rose: "border-rose-500/30 bg-rose-500/5",
  orange: "border-orange-500/30 bg-orange-500/5",
  slate: "border-slate-400/30 bg-slate-500/5",
  zinc: "border-zinc-400/30 bg-zinc-500/5",
};

const numColorMap: Record<string, string> = {
  indigo: "text-indigo-400",
  violet: "text-violet-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  orange: "text-orange-400",
  slate: "text-slate-400",
  zinc: "text-zinc-400",
};

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

const faq = [
  {
    q: "Un devis freelance a-t-il la même valeur juridique qu'un contrat ?",
    a: "Oui. Un devis signé des deux parties constitue un contrat au sens juridique. Il engage le freelance à réaliser la prestation aux conditions décrites, et le client à payer le prix convenu. Les clauses que vous incluez ont donc une valeur contractuelle pleine et entière, d'où l'importance de les rédiger avec soin.",
  },
  {
    q: "Les pénalités de retard sont-elles obligatoires ?",
    a: "Entre professionnels (B2B), leur mention est une obligation légale sur les factures (Code de commerce, art. L441-9). Le taux minimum est 3 fois le taux d'intérêt légal. Une indemnité forfaitaire de 40€ pour frais de recouvrement est également due de plein droit. En B2C, les pénalités sont librement fixées mais doivent être mentionnées avant la conclusion du contrat.",
  },
  {
    q: "Quand les droits d'auteur sont-ils transférés au client ?",
    a: "Sans mention contraire, jamais, les droits restent à l'auteur. La cession doit être explicitement prévue dans le devis ou contrat : durée, territoire, supports d'exploitation. La pratique la plus courante est de conditionner la cession au paiement intégral : tant que le client n'a pas payé, il n'a pas légalement le droit d'utiliser la création.",
  },
  {
    q: "Faut-il des Conditions Générales de Vente en plus du devis ?",
    a: "Les CGV sont recommandées, surtout si vous travaillez avec de nombreux clients. Elles complètent le devis en posant un cadre général (droit applicable, tribunal compétent, modalités de facturation). Dans la pratique, pour les missions ponctuelles, un devis bien rédigé avec les clauses essentielles suffit souvent. Pour les missions récurrentes ou les grands comptes, des CGV séparées sont préférables.",
  },
  {
    q: "Un client peut-il refuser de signer un devis avec ces clauses ?",
    a: "Il peut négocier, mais il ne peut pas exiger que vous retiriez des clauses légitimes qui vous protègent. Si un client refuse catégoriquement des clauses standard (comme la limitation de révisions ou la clause d'acompte), c'est souvent un signal d'alerte sur la relation commerciale. Vous êtes libre de refuser une mission dont les conditions ne vous conviennent pas.",
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Bandeau 2026 ── */}
      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire en France.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X, sans rien faire de votre côté.</span>
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

      {/* ── Article ── */}
      <article className="pt-36 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-400 transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-400 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-gray-400">Clauses devis freelance</span>
          </nav>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">Guide complet</span>
              <span className="text-xs text-gray-600">29 juin 2026 · 10 min</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              Les clauses indispensables dans un devis freelance
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Un devis signé est un contrat. Sans les bonnes clauses, il peut se retourner contre vous. Voici les 9 clauses à inclure systématiquement, avec des formulations prêtes à l'emploi.
            </p>
          </div>

          {/* Sommaire */}
          <div className="bg-ds-surface border border-ds-border rounded-2xl p-6 mb-12">
            <p className="text-sm font-semibold text-white mb-4">Sommaire</p>
            <ol className="space-y-2">
              {clauses.map((c) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors group">
                    <span className={`font-mono text-xs font-bold ${numColorMap[c.color]} w-6`}>{c.num}</span>
                    <span className="group-hover:underline underline-offset-2">{c.title}</span>
                    <span className="text-gray-700 text-xs">— {c.risk}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* Intro */}
          <div className="prose prose-invert max-w-none mb-12">
            <p className="text-gray-300 leading-relaxed text-base mb-4">
              La plupart des litiges entre freelances et clients ne viennent pas d&apos;une mauvaise volonté, mais d&apos;un malentendu sur ce qui était convenu. Le devis vague est l&apos;origine de 90% des conflits : le freelance pensait que &quot;le projet&quot; couvrait X, le client pensait que Y était inclus aussi.
            </p>
            <p className="text-gray-300 leading-relaxed text-base mb-4">
              La solution ? Des clauses claires, rédigées en français simple, qui définissent les règles du jeu avant que la mission commence. Chaque clause ci-dessous correspond à un risque réel que des freelances ont subi, et que vous pouvez éviter.
            </p>
          </div>

          {/* Clauses */}
          <div className="space-y-14">
            {clauses.map((clause) => (
              <section key={clause.id} id={clause.id} className="scroll-mt-28">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className={`font-mono text-2xl font-bold ${numColorMap[clause.color]}`}>{clause.num}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{clause.title}</h2>
                    <span className="text-xs text-gray-600">Risque couvert : {clause.risk}</span>
                  </div>
                </div>

                <p className="text-gray-400 leading-relaxed mb-5 text-sm">{clause.desc}</p>

                {/* Formulation */}
                <div className={`border rounded-xl p-5 mb-5 ${colorMap[clause.color]}`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Formulation type</p>
                  <p className="text-sm text-gray-200 leading-relaxed italic">&ldquo;{clause.formulation}&rdquo;</p>
                </div>

                {/* Professions */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Particulièrement important pour :</p>
                  <div className="flex flex-wrap gap-2">
                    {clause.professions.map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        className="text-xs px-3 py-1.5 rounded-lg bg-ds-elevated border border-ds-border text-gray-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-all"
                      >
                        {p.label} →
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Tip */}
                <div className="flex gap-3 bg-ds-elevated rounded-xl p-4 border border-ds-border">
                  <span className="text-indigo-400 text-sm mt-0.5 flex-shrink-0">💡</span>
                  <p className="text-xs text-gray-400 leading-relaxed">{clause.tip}</p>
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 bg-gradient-to-br from-indigo-900/40 to-violet-900/20 rounded-2xl border border-indigo-500/20 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Intégrez ces clauses dans vos devis en 30 secondes
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
              Avec Deviso, décrivez votre mission et l&apos;IA génère un devis complet avec les clauses adaptées à votre métier. Vos clients signent électroniquement, vous êtes protégé juridiquement.
            </p>
            <WaitlistButton
              plan="free"
              label="Générer mon premier devis, gratuit"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/50"
            />
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-white mb-6">Questions fréquentes</h2>
            <div className="space-y-4">
              {faq.map((item) => (
                <div key={item.q} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <p className="font-medium text-white text-sm mb-2">{item.q}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Métiers */}
          <div className="mt-16 pt-8 border-t border-ds-border">
            <p className="text-xs text-gray-600 mb-4">Guides par métier</p>
            <div className="flex flex-wrap gap-2">
              {metierLinks.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="text-xs px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-gray-500 hover:text-gray-300 hover:border-indigo-500/30 transition-all"
                >
                  {m.label}
                </Link>
              ))}
              <Link
                href="/blog"
                className="text-xs px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-indigo-400 hover:text-indigo-300 transition-all"
              >
                ← Tous les articles
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* ── Footer ── */}
      <footer className="border-t border-ds-border py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-sm text-gray-500 mb-8">
            <div>
              <div className="text-white font-semibold mb-3">Produit</div>
              <ul className="space-y-2">
                <li><Link href="/#fonctionnalites" className="hover:text-gray-300 transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/#tarifs" className="hover:text-gray-300 transition-colors">Tarifs</Link></li>
                <li><Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Métiers</div>
              <ul className="space-y-2">
                {metierLinks.slice(0, 6).map((m) => (
                  <li key={m.href}><Link href={m.href} className="hover:text-gray-300 transition-colors">{m.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Légal</div>
              <ul className="space-y-2">
                <li><Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">Mentions légales</Link></li>
                <li><Link href="/confidentialite" className="hover:text-gray-300 transition-colors">Confidentialité</Link></li>
                <li><Link href="/cgu" className="hover:text-gray-300 transition-colors">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <p>© 2026 Deviso · SafeTone Studio · SIREN 103 340 857</p>
            <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">getdeviso.fr</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
