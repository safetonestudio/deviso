import { PageSite, CADRE, SECTION, H2, LEAD, BOUTON_PLEIN, BOUTON_DOUX } from "@/components/site/PageSite";
import type { Metadata } from "next";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { DemoButton } from "@/components/landing/DemoButton";
import {
  ShieldCheck,
  CalendarClock,
  Inbox,
  FileSpreadsheet,
  AlertTriangle,
  ScrollText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deviso pour les experts-comptables : vos clients micro et TPE, conformes à la réforme",
  description:
    "Un cockpit gratuit pour suivre tous vos clients micro et TPE depuis une seule interface : conformité à la réforme 2026, calendrier TVA, exports FEC et livre des recettes. Programme pilote gratuit.",
  alternates: { canonical: "https://getdeviso.fr/experts-comptables" },
  openGraph: {
    title: "Deviso pour les experts-comptables | Deviso",
    description:
      "Vos clients micro et TPE conformes à la réforme, suivis depuis un seul cockpit. Gratuit pour votre cabinet. Programme pilote.",
    url: "https://getdeviso.fr/experts-comptables",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso pour les experts-comptables" }],
  },
};

const NB = "\u00a0";
const CONTACT = "mailto:support@getdeviso.fr?subject=Deviso%20Cabinet%20-%20demande%20de%20d%C3%A9mo&body=Bonjour%2C%20je%20suis%20expert-comptable%20et%20j%27aimerais%20voir%20Deviso%20pour%20mes%20clients.";

const douleurs = [
  {
    icon: AlertTriangle,
    filet: "bg-amber-400",
    titre: "La réforme, c'est vous qu'on attend",
    desc: "La réception des factures électroniques est obligatoire depuis septembre 2026, l'émission arrive, et la tolérance s'arrête le 31 décembre 2026. La plupart de vos clients micro et TPE n'ont encore rien choisi et attendent que vous leur disiez quoi faire.",
  },
  {
    icon: ShieldCheck,
    filet: "bg-blue-400",
    titre: "Une mauvaise donnée, une facture rejetée",
    desc: "Un SIRET faux, un n° de TVA incohérent, une entreprise raccordée mais pas joignable à l'annuaire : c'est ce qui fait rejeter les factures à la plateforme. Multiplié par tout un portefeuille, c'est un risque difficile à surveiller à la main.",
  },
  {
    icon: Inbox,
    filet: "bg-indigo-500",
    titre: "La course aux pièces, chaque période",
    desc: "Relancer les clients pour récupérer leurs factures de vente, ressaisir, attendre les retardataires. Quand le client facture dans Deviso, ses factures de vente sont déjà là, conformes et structurées. Il n'y a plus rien à réclamer.",
  },
];

const fonctions = [
  {
    icon: ShieldCheck,
    titre: "Tableau de conformité par client",
    desc: "D'un coup d'œil, qui peut émettre ET recevoir des factures conformes : raccordement à une plateforme, joignabilité à l'annuaire, SIRET, TVA. Les dossiers à régulariser avant la fin de la tolérance ressortent en premier.",
  },
  {
    icon: CalendarClock,
    titre: "Calendrier de TVA du portefeuille",
    desc: "Pour chaque dossier assujetti, la TVA de la dernière période close prête à déclarer et celle de la période en cours, selon sa périodicité. Sans ouvrir chaque dossier.",
  },
  {
    icon: AlertTriangle,
    titre: "File « à traiter »",
    desc: "Factures rejetées, impayés échus, trous de numérotation, SIREN client manquant, incohérences de TVA. Les anomalies de tout le portefeuille, triées par urgence.",
  },
  {
    icon: FileSpreadsheet,
    titre: "Exports comptables en un clic",
    desc: "FEC, CSV des factures, livre des recettes, pour un client, une sélection, ou tout le portefeuille en une archive. Même source que l'export du client, aucun écart.",
  },
  {
    icon: ScrollText,
    titre: "Journal des accès et signalements",
    desc: "Chaque consultation et chaque export sont tracés, pour vous seul. Et vous pointez une anomalie précise au client, qu'il voit dans son tableau de bord.",
  },
  {
    icon: Inbox,
    titre: "En lecture seule, sans vous connecter chez chacun",
    desc: "Vous voyez tous vos dossiers depuis votre propre interface, en lecture seule. Vos clients gardent la main sur leur facturation, vous gardez la vue d'ensemble.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Deviso pour les experts-comptables",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://getdeviso.fr/experts-comptables",
  description: metadata.description,
  inLanguage: "fr",
  audience: { "@type": "Audience", audienceType: "Experts-comptables en France" },
};

/** Aperçu du cockpit cabinet, composé en HTML (données d'exemple). */
const PORTEFEUILLE: { client: string; conformite: [string, "vert" | "ambre" | "bleu"]; tva: string; aTraiter: string }[] = [
  { client: "Studio Durand", conformite: ["Conforme", "vert"], tva: "Prête, décembre", aTraiter: "Aucun" },
  { client: "Boulangerie Dupont", conformite: ["SIRET à vérifier", "ambre"], tva: "Franchise", aTraiter: "1 anomalie" },
  { client: "Atelier Morel", conformite: ["Conforme", "vert"], tva: "Prête, 4ᵉ trimestre", aTraiter: "1 impayé échu" },
  { client: "Garage Petit", conformite: ["Non raccordé", "ambre"], tva: "Prête, décembre", aTraiter: "À raccorder" },
  { client: "Cabinet Lefèvre", conformite: ["Conforme", "vert"], tva: "Prête, décembre", aTraiter: "Aucun" },
];
const TON = { vert: "bg-indigo-500/15 text-indigo-300", ambre: "bg-amber-500/15 text-amber-300", bleu: "bg-blue-500/15 text-blue-300" };

function ApercuCockpit() {
  return (
    <div data-ui role="img" aria-label="Aperçu du cockpit cabinet : cinq clients avec leur conformité, leur TVA et ce qu'il reste à traiter" className="rounded-xl bg-ds-bg ring-1 ring-ink/10 p-5 sm:p-6 text-[15px]">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Portefeuille</div>
          <div className="text-gray-400">5 clients suivis, en lecture seule</div>
        </div>
        <span className="shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold bg-amber-500/15 text-amber-300">3 à traiter</span>
      </div>
      <div className="mt-5 grid gap-1.5">
        <div className="hidden sm:grid grid-cols-[1.3fr_1.05fr_1fr_0.95fr] gap-3 px-3 pb-1 text-[13px] text-gray-500">
          <span>Client</span><span>Conformité</span><span>TVA</span><span>À traiter</span>
        </div>
        {PORTEFEUILLE.map((c) => (
          <div key={c.client} className="grid grid-cols-2 sm:grid-cols-[1.3fr_1.05fr_1fr_0.95fr] items-center gap-x-3 gap-y-1.5 rounded-lg bg-ds-elevated px-3 py-2.5">
            <span className="font-medium text-ink truncate">{c.client}</span>
            <span className="justify-self-end sm:justify-self-start">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap ${TON[c.conformite[1]]}`}>{c.conformite[0]}</span>
            </span>
            <span className="text-gray-300 text-[14px]">{c.tva}</span>
            <span className={`text-[14px] justify-self-end sm:justify-self-start ${c.aTraiter === "Aucun" ? "text-gray-500" : "text-amber-300"}`}>{c.aTraiter}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <PageSite actif="/experts-comptables">
      <DonneesStructurees donnees={jsonLd} />

      <main>
        {/* ── Haut de page : la promesse à gauche, le cockpit à droite ── */}
        <section className={`${CADRE} pt-14 sm:pt-20 lg:pt-24`}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-center">
            <div className="lg:col-span-6">
              <p className="text-[14px] font-medium text-gray-400">Pour les cabinets d&apos;expertise comptable</p>
              <h1 className="mt-4 text-[clamp(34px,3.8vw,58px)] leading-[1.05] font-semibold tracking-[-0.04em] text-ink">
                Vos clients micro et TPE, conformes à la réforme, suivis depuis un seul cockpit.
              </h1>
              <p className={`mt-6 max-w-[50ch] ${LEAD}`}>
                Deviso est un outil de facturation simple et conforme pour vos clients indépendants, micro et TPE. Vous les
                suivez tous depuis une interface dédiée, en lecture seule. Gratuit pour votre cabinet.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href={CONTACT} className={BOUTON_PLEIN}>Demander une démo</a>
                <DemoButton label="Voir Deviso côté client" className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
              </div>
              <p className="mt-4 text-[14px] text-gray-400">Cockpit cabinet gratuit. Programme pilote sans engagement.</p>
            </div>
            <div className="lg:col-span-6">
              <ApercuCockpit />
            </div>
          </div>
        </section>

        {/* ── Ce que la réforme change ── */}
        <section id="pourquoi" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <div className="reveal max-w-[760px]">
            <h2 className={H2}>Ce que la réforme change pour votre cabinet.</h2>
            <p className={`mt-5 ${LEAD}`}>
              Le plus dur n&apos;est pas votre logiciel de production, c&apos;est d&apos;amener tout un portefeuille de petits
              clients à être conforme, et de le rester.
            </p>
          </div>
          <ul className="mt-12 sm:mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {douleurs.map((d) => (
              <li key={d.titre} className="reveal">
                <span className={`block h-[3px] w-10 rounded-full ${d.filet}`} aria-hidden="true" />
                <h3 className="mt-6 text-[20px] sm:text-[24px] leading-[1.25] font-semibold tracking-[-0.02em] text-ink">{d.titre}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-gray-300">{d.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Le cockpit ── */}
        <section id="cockpit" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="reveal lg:col-span-5">
              <h2 className={H2}>Un cockpit pensé pour un portefeuille.</h2>
              <p className={`mt-5 ${LEAD}`}>
                Tout ce dont vous avez besoin pour suivre vos clients, dans une seule interface. Gratuit, en lecture seule.
              </p>
            </div>
            <ul className="lg:col-span-7 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {fonctions.map((f) => (
                <li key={f.titre} className="reveal">
                  <span className="w-10 h-10 rounded-lg bg-ds-surface grid place-items-center" aria-hidden="true">
                    <f.icon size={18} className="text-indigo-400" />
                  </span>
                  <h3 className="mt-4 text-[20px] leading-[1.3] font-semibold tracking-[-0.015em] text-ink">{f.titre}</h3>
                  <p className="mt-2 text-[17px] leading-relaxed text-gray-300">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── L'offre ── */}
        <section id="offre" className={`${CADRE} ${SECTION} scroll-mt-20`}>
          <div className="reveal max-w-[760px]">
            <h2 className={H2}>Simple, et gratuit pour vous.</h2>
            <p className={`mt-5 ${LEAD}`}>
              Vous ne changez rien à votre logiciel de production. Vous ajoutez un outil conforme pour vos petits clients, et
              un cockpit pour les suivre.
            </p>
          </div>
          <div className="mt-12 sm:mt-16 grid gap-6 md:grid-cols-3 items-stretch">
            {[
              { filet: "bg-indigo-500", qui: "Votre cabinet", prix: "Gratuit", texte: "Le cockpit, l'accès en lecture seule à chaque dossier, la conformité, le calendrier de TVA et les exports. Aucun coût pour le cabinet." },
              { filet: "bg-blue-400", qui: "Vos clients", prix: "18 à 34" + NB + "€ par mois", texte: "Deviso complet pour le client" + NB + ": Solo 18" + NB + "€ par mois, Pro 34" + NB + "€ par mois, 14 jours d'essai. Factur-X, raccordement à la plateforme, relances, livre des recettes." },
              { filet: "bg-amber-400", qui: "Programme pilote", prix: "Gratuit, sans engagement", texte: "On démarre petit" + NB + ": vous mettez 2 ou 3 clients sur Deviso, gratuitement, et on construit avec vous l'outil dont votre cabinet a vraiment besoin." },
            ].map((o) => (
              <div key={o.qui} className="reveal rounded-xl bg-ds-surface p-7 sm:p-8">
                <span className={`block h-[3px] w-10 rounded-full ${o.filet}`} aria-hidden="true" />
                <p className="mt-6 text-[14px] font-medium text-gray-400">{o.qui}</p>
                <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-ink">{o.prix}</p>
                <p className="mt-3 text-[17px] leading-relaxed text-gray-300">{o.texte}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Dernière action ── */}
        <section className={`${CADRE} ${SECTION} pb-16 sm:pb-20`} aria-labelledby="titre-action">
          <div className="reveal rounded-xl bg-ds-surface px-6 py-14 sm:px-12 sm:py-20 lg:px-16 lg:py-24 grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 id="titre-action" className={H2}>Prenons 20 minutes.</h2>
              <p className={`mt-5 ${LEAD}`}>
                Je vous montre le cockpit, et surtout j&apos;aimerais votre retour de professionnel. Si ça vous parle, on lance un
                pilote gratuit sur quelques-uns de vos clients.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
              <a href={CONTACT} className={BOUTON_PLEIN}>Demander une démo</a>
              <DemoButton label="Voir Deviso côté client" className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
            </div>
          </div>
        </section>
      </main>
    </PageSite>
  );
}
