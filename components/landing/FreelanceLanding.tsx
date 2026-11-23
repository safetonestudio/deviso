import { PageSite, CADRE, SECTION, H1, H2, LEAD, BOUTON_PLEIN, BOUTON_DOUX } from "@/components/site/PageSite";
import Link from "next/link";
import type { Metadata } from "next";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { prix as grille } from "@/lib/grille-tarifaire";
import { metierDeLanding } from "@/lib/blog/metiers";
import { DemoButton } from "@/components/landing/DemoButton";
import { Zap, PenLine, Bell, FileText, BarChart3, Receipt, type LucideIcon } from "lucide-react";

export interface MockupLine {
  desc: string;
  qty: string;
  price: string;
}

export interface PainPoint {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface FreelanceLandingProps {
  // SEO
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  // Hero
  professionLabel: string; // "graphiste freelance"
  heroTitle: string; // "Tes devis de graphiste"
  heroHighlight: string; // "en 30 secondes"
  heroSubtitle: string;
  // Pain points section
  painPoints: PainPoint[];
  // Mockup
  mockupPrompt: string;
  mockupClient: string;
  mockupRef: string;
  mockupLines: MockupLine[];
  mockupTotal: string;
}

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

const features = [
  {
    icon: Zap as LucideIcon,
    title: "Devis par IA en 30 secondes",
    desc: "Tu décris ta mission en quelques phrases. L'IA génère un devis complet, chiffré, structuré, prêt à envoyer. Aucun logiciel concurrent ne fait ça.",
  },
  {
    icon: PenLine as LucideIcon,
    title: "Signature électronique",
    desc: "Ton client reçoit un lien sécurisé, ouvre le devis sur son téléphone et signe en quelques secondes. Tu es notifié instantanément.",
  },
  {
    icon: Bell as LucideIcon,
    title: "Relances automatiques",
    desc: "Après 3, 7 ou 14 jours sans réponse, Deviso relance ton client à ta place. Tu configures le délai et le message, Deviso s'occupe du reste.",
  },
  {
    icon: FileText as LucideIcon,
    title: "Factur-X + Chorus Pro",
    desc: "Facture électronique conforme à la réforme 2026 en 1 clic. Dépôt Chorus Pro pour le secteur public directement depuis la facture.",
  },
  {
    icon: BarChart3 as LucideIcon,
    title: "Widget CA URSSAF",
    desc: "Ton chiffre d'affaires mensuel et trimestriel affiché en temps réel. Tu sais exactement quoi déclarer, sans calculer.",
  },
  {
    icon: Receipt as LucideIcon,
    title: "Factures acompte & solde",
    desc: "Facturez en deux temps : un acompte à la commande, le solde à la livraison. Numérotation automatique, PDFs conformes générés.",
  },
];


/** Pluriel des libellés de métier : « artisan BTP » donne « artisans BTP »,
    « consultant indépendant » donne « consultants indépendants ». */
function pluriel(label: string) {
  return label
    .replace(/^community manager/, "community managers")
    .replace(/^(artisan|coach|consultant|développeur|formateur|graphiste|photographe|rédacteur|traducteur)\b/, "$1s")
    .replace(/\bindépendant$/, "indépendants");
}

export function FreelanceLanding({
  metaTitle,
  metaDescription,
  canonical,
  professionLabel,
  heroTitle,
  heroHighlight,
  heroSubtitle,
  painPoints,
  mockupPrompt,
  mockupClient,
  mockupRef,
  mockupLines,
  mockupTotal,
}: FreelanceLandingProps) {
  // Le libellé du total est déduit de la valeur, jamais écrit à côté d'elle.
  //
  // Pourquoi. Le libellé était figé à « Total TTC (TVA 20%) » dans ce composant,
  // pendant que quatre pages, artisan, coach, community manager, traducteur -
  // passaient un total exprimé « … € HT ». Résultat : une maquette de devis qui
  // annonçait 20 % de TVA sur un montant qui n'en contenait pas, affichée en
  // vitrine d'un logiciel de facturation. Le genre de détail qu'un prospect
  // attentif remarque, et qui coûte bien plus que sa taille.
  //
  // Déduire le libellé de la valeur rend la contradiction impossible : il n'y a
  // plus deux endroits à tenir d'accord. `scripts/check-blog.mjs` vérifie en
  // plus que le montant correspond bien à la somme des lignes, au HT près, ou
  // à 1,20 × le HT selon le cas.
  const totalHt = /\bHT\b/.test(mockupTotal);

  // Les deux autres pages du même métier, lues dans le registre.
  //
  // Pourquoi. Pour chaque métier il existe trois pages sur le même champ
  // sémantique : cette landing, l'article de blog, et la page tarifs. L'audit du
  // 11/09/2026 a mesuré le maillage réel entre elles : deux arêtes sur six, et
  // les deux pointant vers la landing. Autrement dit, la landing recevait des
  // liens et n'en renvoyait aucun à ses deux sœurs, qui en avaient besoin, la
  // page tarifs étant presque orpheline.
  //
  // Rien n'est écrit en dur ici : la correspondance vient du registre, donc un
  // métier ajouté est relié sans intervention.
  const chemin = canonical.replace("https://getdeviso.fr", "");
  const metier = metierDeLanding(chemin);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Deviso",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: canonical,
    description: metaDescription,
    offers: [
      { "@type": "Offer", name: "Solo", price: grille("solo").mensuel, priceCurrency: "EUR", billingIncrement: "P1M" },
      { "@type": "Offer", name: "Pro", price: grille("pro").mensuel, priceCurrency: "EUR", billingIncrement: "P1M" },
    ],
    inLanguage: "fr",
    audience: {
      "@type": "Audience",
      audienceType: `${professionLabel.charAt(0).toUpperCase() + professionLabel.slice(1)}s en France`,
    },
  };

  return (
    <PageSite>
      <DonneesStructurees donnees={jsonLd} />

      {/* Introduction */}
      <section className={`${CADRE} pt-14 sm:pt-20`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <p className="text-[15px] font-medium text-indigo-400 mb-4">Fait pour les {pluriel(professionLabel)}</p>
            <h1 className={H1}>
              {heroTitle} {heroHighlight}
            </h1>
            <p className={`${LEAD} mt-6`}>{heroSubtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className={`w-full sm:w-auto ${BOUTON_PLEIN}`}>Essayer 14 jours gratuitement</Link>
              <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
            </div>
            <p className="mt-4 text-[14px] text-gray-400">Démo instantanée · Aucune carte bancaire · Compte Pro complet pré-rempli</p>
          </div>

          {/* Exemple de devis */}
          <div className="lg:col-span-7 rounded-xl bg-ds-surface p-5 sm:p-7">
            <p className="text-[14px] font-medium text-gray-400 mb-2">Ce que tu décris</p>
            <div className="rounded-lg bg-ds-elevated p-4 mb-5">
              <p className="text-gray-300 text-[15px] leading-relaxed">{mockupPrompt}</p>
            </div>
            <div className="rounded-lg bg-ds-elevated p-4 sm:p-5">
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="font-semibold text-[15px] text-ink">{mockupRef}</div>
                  <div className="text-[13px] text-gray-400">{mockupClient}</div>
                </div>
                <div className="text-[13px] bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-md font-medium shrink-0">Brouillon</div>
              </div>
              <div className="text-[14px]">
                {mockupLines.map((line) => (
                  <div key={line.desc} className="flex justify-between gap-3 py-2 border-b border-ink/10">
                    <span className="text-gray-300 flex-1">{line.desc}</span>
                    <span className="text-gray-400 hidden sm:inline">{line.qty}</span>
                    <span className="font-semibold text-ink tabular-nums">{line.price}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-semibold">
                  <span className="text-ink">{totalHt ? "Total HT" : "Total TTC (TVA 20 %)"}</span>
                  <span className="text-indigo-400 tabular-nums">{mockupTotal}</span>
                </div>
                {totalHt && (
                  <p className="text-[13px] text-gray-400 pt-1">TVA non applicable, art. 293 B du CGI</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi Deviso pour ce métier */}
      <section id="pourquoi" className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className={H2}>Fait pour les {pluriel(professionLabel)}</h2>
            <p className={`${LEAD} mt-5`}>Ces situations te parlent ?&nbsp;Deviso les résout.</p>
          </div>
          <div className="lg:col-span-7 grid gap-4">
            {painPoints.map((p) => (
              <div key={p.title} className="rounded-xl bg-ds-surface p-6 flex gap-4">
                <div className="rounded-lg bg-ds-elevated p-2.5 h-fit text-indigo-400 shrink-0"><p.icon size={22} /></div>
                <div>
                  <h3 className="text-[18px] font-semibold text-ink mb-1.5">{p.title}</h3>
                  <p className="text-gray-300 text-[15px] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className={H2}>Comment ça marche</h2>
            <p className={`${LEAD} mt-5`}>De la description à la facture signée. Trois étapes.</p>
          </div>
          <ol className="lg:col-span-7 grid gap-4">
            {steps.map((step) => (
              <li key={step.num} className="rounded-xl bg-ds-surface p-6 flex gap-5">
                <span className="text-[22px] font-semibold text-indigo-400 tabular-nums">{step.num}</span>
                <div>
                  <h3 className="text-[18px] font-semibold text-ink mb-1.5">{step.title}</h3>
                  <p className="text-gray-300 text-[15px] leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className={`${CADRE} ${SECTION}`}>
        <div className="max-w-2xl">
          <h2 className={H2}>Tout ce dont tu as besoin</h2>
          <p className={`${LEAD} mt-5`}>Tout ce que tes concurrents font à la main, Deviso le fait automatiquement.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl bg-ds-surface p-6">
              <div className="rounded-lg bg-ds-elevated p-2.5 mb-4 w-fit text-indigo-400"><f.icon size={20} /></div>
              <h3 className="text-[18px] font-semibold text-ink mb-1.5">{f.title}</h3>
              <p className="text-gray-300 text-[15px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className={`${CADRE} ${SECTION}`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className={H2}>Tarifs simples</h2>
            <p className={`${LEAD} mt-5`}>Sans engagement. Sans surprise.</p>
            <Link href="/#tarifs" className="inline-block mt-6 text-indigo-400 hover:text-indigo-300 text-[15px] font-medium transition-colors">
              Voir tous les détails des plans →
            </Link>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              { name: "Solo", price: `${grille("solo").mensuel}€/mois`, desc: "Factur-X, Chorus Pro, acompte/solde, export FEC, sans branding Deviso. 14 jours d'essai gratuit." },
              { name: "Pro", price: `${grille("pro").mensuel}€/mois`, desc: "Relances auto, CRM, équipe, exports CSV et récap, sous-domaine de partage. 14 jours d'essai gratuit." },
            ].map((p) => (
              <div key={p.name} className="rounded-xl bg-ds-surface p-6">
                <div className="text-[18px] font-semibold text-ink mb-1">{p.name}</div>
                <div className="text-[26px] font-semibold text-indigo-400 mb-3">{p.price}</div>
                <p className="text-gray-300 text-[15px] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pour aller plus loin : les deux autres pages du même métier */}
      {metier && (metier.article || metier.tarifs) && (
        <section className={`${CADRE} ${SECTION}`}>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-5">
              <h2 className={H2}>Pour aller plus loin</h2>
              <p className={`${LEAD} mt-5`}>Deux guides gratuits, écrits pour les {professionLabel}s.</p>
            </div>
            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
              {metier.article && (
                <Link href={metier.article.href} className="group rounded-xl bg-ds-surface hover:bg-ds-elevated p-6 transition-colors">
                  <p className="text-[14px] text-blue-400 font-medium mb-3">Guide pratique</p>
                  <p className="text-ink font-semibold leading-snug mb-2">
                    Ce qu&apos;un devis de {professionLabel} doit contenir
                  </p>
                  <p className="text-gray-300 text-[15px] leading-relaxed">
                    Mentions obligatoires, exemple chiffré, clauses qui protègent, et les erreurs qui coûtent cher.
                  </p>
                  <p className="text-indigo-400 text-[15px] font-medium mt-4">Lire le guide →</p>
                </Link>
              )}
              {metier.tarifs && (
                <Link href={metier.tarifs.href} className="group rounded-xl bg-ds-surface hover:bg-ds-elevated p-6 transition-colors">
                  <p className="text-[14px] text-blue-400 font-medium mb-3">Tarifs du marché</p>
                  <p className="text-ink font-semibold leading-snug mb-2">
                    Combien facturer quand on est {professionLabel} ?
                  </p>
                  <p className="text-gray-300 text-[15px] leading-relaxed">
                    Fourchettes de TJM par niveau d&apos;expérience, spécialités mieux payées, et un simulateur de revenu net après cotisations.
                  </p>
                  <p className="text-indigo-400 text-[15px] font-medium mt-4">Voir les tarifs →</p>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Appel final */}
      <section className={`${CADRE} ${SECTION} pb-24`}>
        <div className="rounded-xl bg-ds-surface p-8 sm:p-12 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <h2 className={H2}>Prêt à envoyer ton prochain devis en 30 secondes ?</h2>
            <p className={`${LEAD} mt-4`}>Rejoins les {professionLabel}s qui gèrent leur activité commerciale avec Deviso.</p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-start">
            <Link href="/signup" className={`w-full sm:w-auto ${BOUTON_PLEIN}`}>Essayer 14 jours gratuitement</Link>
            <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
            <p className="text-gray-400 text-[14px]">Essai gratuit 14 jours · Sans carte bancaire</p>
          </div>
        </div>
      </section>
    </PageSite>
  );
}
