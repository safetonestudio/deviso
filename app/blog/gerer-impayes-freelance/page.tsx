import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Gérer les impayés en freelance : relance, mise en demeure, tribunal | Deviso",
  description:
    "Comment récupérer vos factures impayées en freelance : de la relance amiable à l'injonction de payer. Étapes concrètes, modèles de lettres et conseils pour se protéger dès le devis.",
  alternates: { canonical: "https://getdeviso.fr/blog/gerer-impayes-freelance" },
  openGraph: {
    title: "Gérer les impayés en freelance : relance, mise en demeure, tribunal",
    description: "Relance amiable, mise en demeure LRAR, injonction de payer, le guide complet pour récupérer vos factures impayées.",
    url: "https://getdeviso.fr/blog/gerer-impayes-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Gérer les impayés en freelance : de la relance à l'injonction de payer",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/gerer-impayes-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quel est le délai de prescription pour les factures impayées en freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "En France, les créances professionnelles se prescrivent en 5 ans à compter de la date d'exigibilité de la facture (date d'échéance). Vous avez donc 5 ans pour agir juridiquement. Mais plus vous attendez, plus le recouvrement est difficile : agissez dès le premier mois de retard.",
        },
      },
      {
        "@type": "Question",
        name: "Comment fonctionne l'injonction de payer pour un freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "L'injonction de payer est une procédure judiciaire simplifiée, sans audience. Vous déposez une requête au tribunal compétent avec vos justificatifs (devis signé, facture, relances). Si le juge l'accorde, le débiteur a 1 mois pour contester. Si ce délai passe sans contestation, l'ordonnance devient exécutoire et un huissier peut saisir les biens du débiteur.",
        },
      },
    ],
  },
};

const metierLinks = [
  { label: "Graphiste freelance", href: "/freelance-graphiste" },
  { label: "Développeur web", href: "/freelance-developpeur" },
  { label: "Consultant indépendant", href: "/freelance-consultant" },
  { label: "Community manager", href: "/freelance-community-manager" },
  { label: "Coach freelance", href: "/freelance-coach" },
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
            <span className="text-gray-400">Gérer les impayés en freelance</span>
          </nav>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">Problèmes freelance</span>
              <span className="text-xs text-gray-600">29 juin 2026 · 7 min</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              Gérer les impayés en freelance : de la relance à l&apos;injonction de payer
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              1 freelance sur 3 a déjà subi un impayé. La bonne nouvelle : la loi vous protège. La mauvaise : vous devez connaître les étapes pour l&apos;activer efficacement, et ne pas attendre 6 mois avant d&apos;agir.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Étape 0 : se protéger avant la mission (prévention)</h2>
              <p className="mb-4">
                Le meilleur traitement des impayés, c&apos;est de les éviter. Avant de commencer à travailler pour un nouveau client :
              </p>
              <div className="space-y-3">
                {[
                  { icon: "✓", text: "Exigez un acompte de 30 à 50% à la signature du devis, un client qui a payé un acompte est infiniment plus fiable." },
                  { icon: "✓", text: "Faites signer le devis avant de démarrer. Une signature électronique suffit et est juridiquement valable." },
                  { icon: "✓", text: "Mentionnez des pénalités de retard dans votre devis (obligatoire en B2B). Elles dissuadent les mauvais payeurs." },
                  { icon: "✓", text: "Pour les gros montants ou les nouveaux clients : vérifiez l'existence légale de l'entreprise sur Pappers.fr." },
                ].map((item) => (
                  <div key={item.text} className="flex gap-3 bg-ds-elevated rounded-xl p-4 border border-ds-border">
                    <span className="text-emerald-400 font-bold flex-shrink-0">{item.icon}</span>
                    <p className="text-gray-400 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-5">Le processus de recouvrement en 4 étapes</h2>

              {[
                {
                  step: "1",
                  title: "Relance amiable (J+1 à J+14)",
                  color: "amber",
                  content: [
                    "Dès le premier jour de retard, envoyez une relance, par email d'abord, par téléphone ensuite. Ne laissez pas trainer : plus vous attendez, plus le client considère que l'impayé est acceptable.",
                    "Ton : professionnel et neutre. Ne culpabilisez pas, ne vous excusez pas. Rappelez simplement le fait : \"La facture n°XXX de X€, arrivée à échéance le [date], n'apparaît pas encore dans nos paiements reçus. Pouvez-vous confirmer sa mise en règlement ?\"",
                    "Si pas de réponse sous 48h : relancez par téléphone. Dans 80% des cas, l'impayé se résout à cette étape, c'est simplement un oubli ou un problème de trésorerie ponctuel.",
                  ],
                },
                {
                  step: "2",
                  title: "Mise en demeure par LRAR (J+15 à J+30)",
                  color: "orange",
                  content: [
                    "Si la relance amiable reste sans effet, envoyez une mise en demeure par lettre recommandée avec accusé de réception (LRAR). C'est un acte formel qui marque officiellement le début du contentieux.",
                    "La mise en demeure doit mentionner : le montant exact dû, le numéro de facture, la date d'échéance initiale, le délai accordé pour payer (généralement 8 à 15 jours), et la mention que sans paiement vous engagerez des poursuites judiciaires.",
                    "Le cachet de la poste fait foi pour la date d'envoi, conservez l'avis de réception. C'est votre preuve que le débiteur a bien été notifié.",
                  ],
                },
                {
                  step: "3",
                  title: "Injonction de payer (J+30 à J+90)",
                  color: "rose",
                  content: [
                    "C'est la procédure judiciaire simplifiée pour les créances non contestées. Pas d'audience, pas d'avocat obligatoire (pour les montants inférieurs à 10 000€). Vous déposez une requête au tribunal judiciaire compétent avec vos preuves.",
                    "Documents à réunir : devis signé, facture, échanges confirmant la réalisation de la mission, copie des relances et de la mise en demeure. Le juge rend une ordonnance sous quelques semaines. Si le débiteur ne conteste pas sous 1 mois, l'ordonnance devient exécutoire.",
                    "Avec une ordonnance exécutoire, un huissier peut saisir les comptes bancaires, les créances clients ou le matériel professionnel du débiteur.",
                  ],
                },
                {
                  step: "4",
                  title: "Recours à un avocat / saisie (J+90+)",
                  color: "red",
                  content: [
                    "Pour les montants importants ou les débiteurs qui contestent, consultez un avocat spécialisé en droit des affaires. Une consultation coûte 150 à 300€, à mettre en perspective avec la créance à récupérer.",
                    "Vous pouvez aussi mandater une société de recouvrement (commission de 10 à 30% sur les montants récupérés). Solution pratique si vous ne voulez pas gérer la procédure vous-même.",
                  ],
                },
              ].map((step) => (
                <div key={step.step} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-ds-elevated border border-ds-border flex items-center justify-center text-sm font-bold text-indigo-400 font-mono flex-shrink-0">{step.step}</span>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  </div>
                  <div className="pl-11 space-y-3">
                    {step.content.map((para, i) => (
                      <p key={i} className="text-gray-400 text-sm leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Et si le client conteste la facture ?</h2>
              <p className="mb-4">
                Certains clients ne paient pas parce qu&apos;ils sont de mauvaise foi ou en difficulté financière. D&apos;autres contestent sincèrement : ils estiment que le travail n&apos;a pas été livré conforme à ce qui était prévu.
              </p>
              <p className="mb-4">
                Votre meilleure défense : votre <strong className="text-white">devis signé</strong>. Il définit exactement ce qui était convenu. Si vous avez un devis précis, avec une clause de périmètre et de révision, les marges de contestation sont très limitées.
              </p>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <p className="text-sm font-semibold text-white mb-2">Ce que le juge regardera en premier</p>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>— Le devis : a-t-il été signé ? Ce qui était convenu est-il clairement décrit ?</li>
                  <li>— La livraison : avez-vous une preuve que la mission a été accomplie ?</li>
                  <li>— Les échanges : le client a-t-il validé les livrables par email ?</li>
                  <li>— Les relances : avez-vous mis en demeure avant d&apos;agir ?</li>
                </ul>
              </div>
            </section>

            {/* Lien hub clauses */}
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5 flex gap-4 items-start">
              <span className="text-indigo-400 text-xl flex-shrink-0">🛡️</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Prévenir les impayés dès le devis</p>
                <p className="text-xs text-gray-500 mb-3">Clause d&apos;acompte, pénalités de retard, conditions de paiement, les clauses qui protègent votre trésorerie avant même de commencer.</p>
                <Link href="/blog/clauses-devis-freelance" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  Lire le guide des clauses indispensables →
                </Link>
              </div>
            </div>

          </div>

          {/* CTA */}
          <div className="mt-14 bg-gradient-to-br from-indigo-900/40 to-violet-900/20 rounded-2xl border border-indigo-500/20 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">Les relances automatiques, c&apos;est Deviso</h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
              Deviso envoie automatiquement des relances aux clients en retard, aux intervalles que vous choisissez. Moins de stress, plus de trésorerie.
            </p>
            <WaitlistButton plan="free" label="Essayer Deviso gratuitement" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all" />
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
