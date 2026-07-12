import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Comment choisir sa plateforme agréée (PDP) quand on est freelance, Guide 2026",
  description:
    "Le portail public (PPF) est abandonné. Seules les Plateformes de Dématérialisation Partenaires (PDP) privées subsistent. Comment choisir la bonne pour votre activité freelance ?",
  alternates: { canonical: "https://getdeviso.fr/blog/choisir-plateforme-agreee-freelance" },
  openGraph: {
    title: "Comment choisir sa plateforme agréée (PDP) en tant que freelance",
    description: "PPF abandonné, PDP obligatoire. Critères de choix, questions à poser, intégration avec votre logiciel de facturation.",
    url: "https://getdeviso.fr/blog/choisir-plateforme-agreee-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Choisir plateforme agréée PDP freelance" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Comment choisir sa plateforme agréée (PDP) quand on est freelance",
  datePublished: "2026-07-10",
  dateModified: "2026-07-10",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/choisir-plateforme-agreee-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "C'est quoi une PDP (Plateforme de Dématérialisation Partenaire) ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Une PDP est une plateforme privée certifiée par la DGFiP pour transmettre les factures électroniques entre entreprises et déclarer les données fiscales à l'administration. Depuis l'abandon du PPF (portail public) en octobre 2024, seules les PDP privées sont habilitées pour la réforme de facturation électronique.",
        },
      },
      {
        "@type": "Question",
        name: "Un freelance doit-il choisir sa propre PDP ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pas nécessairement. Si votre logiciel de facturation est lui-même une PDP ou est connecté à une PDP, c'est transparent pour vous. Vous utilisez votre logiciel comme d'habitude, et la transmission à la DGFiP se fait automatiquement. Deviso sera connecté à une PDP avant l'échéance de septembre 2027.",
        },
      },
      {
        "@type": "Question",
        name: "Combien coûte une PDP pour un freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le coût varie selon les prestataires. Certaines PDP facturent à la transaction (0,05 à 0,30 € par facture), d'autres proposent des abonnements mensuels. Beaucoup de logiciels de facturation incluront l'accès à une PDP dans leur abonnement existant, sans surcoût.",
        },
      },
    ],
  },
};

export default function ChoisirPlateformeAgreeePage() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">PPF abandonné · Seules les PDP privées subsistent.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso intégrera une PDP avant septembre 2027.</span>
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
          <span className="text-gray-400">Plateforme agréée</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">Réforme 2026 · PDP</span>
            <span className="text-xs text-gray-600">8 min · Mis à jour juillet 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            Comment choisir sa plateforme agréée (PDP) quand on est freelance ou indépendant
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Le portail public de facturation (PPF) a été abandonné en octobre 2024. Toutes les entreprises, y compris les freelances, devront passer par une Plateforme de Dématérialisation Partenaire (PDP) privée. Voici comment choisir.
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Qu&apos;est-ce qu&apos;une PDP et pourquoi c&apos;est obligatoire ?</h2>
            <p>
              Une <strong className="text-white">Plateforme de Dématérialisation Partenaire (PDP)</strong> est un opérateur privé immatriculé par la DGFiP. Son rôle est double :
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">1.</span> <span><strong className="text-white">Transmettre les factures</strong> entre émetteur et destinataire dans un format structuré (Factur-X, UBL...)</span></li>
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">2.</span> <span><strong className="text-white">Déclarer les données fiscales</strong> à la DGFiP en temps réel (montants, TVA, parties, date)</span></li>
            </ul>
            <p className="mt-3">
              Avant 2024, on espérait pouvoir utiliser le Portail Public de Facturation (PPF) gratuitement. La DGFiP a annoncé son abandon en octobre 2024, laissant uniquement les PDP privées. Vous devrez en choisir une, mais dans la plupart des cas, votre logiciel de facturation s&apos;en chargera pour vous.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Dois-je vraiment choisir une PDP moi-même ?</h2>
            <p>
              <strong className="text-white">Probablement non.</strong> Il existe deux scénarios :
            </p>
            <div className="mt-4 space-y-4">
              <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl p-5">
                <p className="text-sm font-bold text-emerald-400 mb-2">Scénario 1 (le plus fréquent), Votre logiciel intègre une PDP</p>
                <p className="text-sm text-gray-300">
                  Vous utilisez un logiciel de facturation (Deviso, Pennylane, Abby...) qui a conclu un partenariat avec une ou plusieurs PDP. La transmission est transparente : vous créez votre facture comme d&apos;habitude, et le logiciel gère la transmission à la DGFiP automatiquement. C&apos;est le chemin le plus simple.
                </p>
              </div>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-2">Scénario 2, Vous devez choisir votre propre PDP</p>
                <p className="text-sm">
                  Si vous utilisez un outil qui ne gère pas la PDP, ou si vous émettez vos factures depuis un système interne, vous devrez vous connecter directement à une PDP. Dans ce cas, les critères ci-dessous s&apos;appliquent.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5 critères pour choisir sa PDP en tant qu&apos;indépendant</h2>
            <div className="space-y-4">
              {[
                {
                  num: "01",
                  titre: "Intégration avec votre outil existant",
                  desc: "La PDP doit être compatible avec votre logiciel de facturation actuel. Une intégration native (API) est bien plus simple qu'un import/export manuel. Vérifiez la liste des connecteurs disponibles.",
                },
                {
                  num: "02",
                  titre: "Gestion du Factur-X",
                  desc: "Assurez-vous que la PDP accepte le format Factur-X (le plus simple pour les indépendants). Certaines PDP visent surtout les grandes entreprises et proposent des formats complexes inadaptés aux TPE.",
                },
                {
                  num: "03",
                  titre: "Tarif adapté aux petits volumes",
                  desc: "Un freelance émet en moyenne 5 à 30 factures par mois. Méfiez-vous des PDP avec abonnement cher conçu pour des volumes de milliers de factures. Comparez le coût par facture ou les offres dédiées TPE.",
                },
                {
                  num: "04",
                  titre: "Support et accompagnement",
                  desc: "La réforme est complexe, surtout au démarrage. Une PDP qui propose un support en français, accessible, avec documentation claire est un avantage significatif. Testez le support avant de vous engager.",
                },
                {
                  num: "05",
                  titre: "Certification DGFiP à jour",
                  desc: "Vérifiez que la PDP est bien immatriculée et à jour dans sa certification. Une liste officielle est publiée sur impots.gouv.fr. Évitez les prestataires qui « prévoient » d'être certifiés mais ne le sont pas encore.",
                },
              ].map(({ num, titre, desc }) => (
                <div key={num} className="flex gap-4 bg-ds-surface border border-ds-border rounded-xl p-4">
                  <span className="text-2xl font-black text-indigo-500/30 shrink-0 leading-none">{num}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{titre}</p>
                    <p className="text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Questions à poser à une PDP avant de s&apos;engager</h2>
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5 space-y-3">
              {[
                "Êtes-vous immatriculé PDP par la DGFiP ? Quelle est votre date d'immatriculation ?",
                "Acceptez-vous le format Factur-X BASIC pour les petits volumes ?",
                "Quel est le coût pour une activité de 5 à 30 factures B2B par mois ?",
                "Comment gérez-vous les factures en franchise de TVA (article 293B CGI) ?",
                "Avez-vous une intégration avec [votre logiciel de facturation] ?",
                "Comment puis-je recevoir les e-factures de mes fournisseurs via votre plateforme ?",
                "Quel est votre support en cas de problème de transmission ou de rejet ?",
              ].map((q) => (
                <div key={q} className="flex gap-3 text-sm">
                  <span className="text-indigo-400 shrink-0 mt-0.5">?</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Et Deviso dans tout ça ?</h2>
            <p>
              Deviso est en cours d&apos;intégration avec des PDP certifiées. L&apos;objectif est que vous n&apos;ayez <strong className="text-white">rien à faire</strong> : vous créez votre facture dans Deviso comme aujourd&apos;hui, et la transmission à la DGFiP via PDP se fait automatiquement.
            </p>
            <p className="mt-3">
              En attendant, vos factures Deviso sont déjà au format Factur-X BASIC, le format que la PDP recevra et transmettra. Pas de travail de conversion, pas de reformatage. La donnée structurée est déjà là.
            </p>
            <p className="mt-3">
              Le calendrier Deviso : intégration PDP opérationnelle au <strong className="text-white">1er trimestre 2027</strong>, avant l&apos;obligation de septembre 2027.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">FAQ</h2>
            <div className="space-y-5">
              {[
                {
                  q: "Peut-on utiliser plusieurs PDP ?",
                  a: "Oui. Rien n'interdit d'émettre via une PDP et de recevoir via une autre (ou la même). Mais c'est une complexité inutile pour un freelance. Mieux vaut une PDP unique intégrée à votre logiciel.",
                },
                {
                  q: "Le PPF est-il vraiment abandonné ? Ne pourrait-il pas être rétabli ?",
                  a: "L'abandon du PPF est officiel depuis octobre 2024. La DGFiP a confirmé qu'elle ne développerait pas le portail public. Il n'existe aucune indication d'un possible retour en arrière sur ce point.",
                },
                {
                  q: "Mes factures seront-elles visibles par la DGFiP en temps réel ?",
                  a: "Oui. C'est l'un des objectifs de la réforme : la DGFiP dispose de données de facturation en temps quasi-réel pour améliorer la lutte contre la fraude TVA. Vos factures (montants HT, TVA, parties, date) seront transmises automatiquement.",
                },
                {
                  q: "La PDP peut-elle refuser de transmettre une facture ?",
                  a: "Oui, si la facture ne respecte pas le format (données manquantes, SIRET invalide, format non conforme). La PDP retourne alors un statut de rejet avec le motif. Votre logiciel de facturation vous préviendra et vous indiquera comment corriger.",
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
          <h2 className="text-xl font-bold text-white mb-3">Factur-X prêt, PDP en route</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Deviso génère déjà des factures au format Factur-X. L&apos;intégration PDP sera disponible bien avant l&apos;obligation de septembre 2027.
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
