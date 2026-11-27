import { PageSite } from "@/components/site/PageSite";
import { APPEL, BETA_OUVERTE } from "@/lib/beta";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { Signature } from "@/components/blog/Signature";
import { jsonLdArticle, metadonneesArticle } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import Link from "next/link";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

const SLUG = "checklist-reforme-facturation-2026";

export const metadata = metadonneesArticle(SLUG);


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
    description: "Votre date d'obligation d'émettre dépend de votre taille : pour une PME, une TPE, un indépendant ou un micro-entrepreneur, c'est le 1er septembre 2027. Mais l'obligation de pouvoir RECEVOIR une facture électronique via une plateforme agréée s'applique déjà, depuis le 1er septembre 2026, quelle que soit votre taille.",
    urgency: "high",
    action: "Vérifier votre catégorie dans le portail impots.gouv.fr ou avec votre expert-comptable.",
    details: [
      "Grande entreprise (5 000 salariés ou plus, ou CA > 1,5 Md€ et bilan > 2 Md€) → obligation émission : sept. 2026",
      "ETI (250 à 4 999 salariés, ou moins de 250 salariés avec CA > 50 M€ et bilan > 43 M€) → obligation émission : sept. 2026",
      "PME, TPE, micro-entrepreneur → obligation émission : sept. 2027",
      "Tous → obligation réception : sept. 2026",
    ],
  },
  {
    num: "02",
    title: "Vérifier que votre logiciel de facturation supporte le Factur-X",
    description: "Le format Factur-X (PDF/A-3 + XML EN 16931) est l'un des trois formats acceptés par la réforme, avec UBL et CII, et le plus simple pour les PME, les TPE et les indépendants, car il reste lisible comme un PDF. Si votre logiciel génère des PDF classiques ou des factures Word, il n'est pas conforme.",
    urgency: "high",
    action: "Contacter l'éditeur de votre logiciel et demander : « Générez-vous des factures Factur-X au profil EN 16931 ? »",
    details: [
      "Factur-X EN 16931 = le profil recommandé pour les PME, les TPE et les indépendants",
      "UBL et CII = les deux autres formats acceptés, en XML seul, sans PDF lisible",
    ],
  },
  {
    num: "03",
    title: "Confirmer que votre logiciel sera connecté à une plateforme agréée avant votre date d'obligation",
    description: "Le Portail Public de Facturation (PPF) ne fait plus transiter les factures : il est recentré sur l'annuaire et la collecte des données. Seules les plateformes agréées (anciennement appelées PDP), immatriculées par l'administration fiscale, peuvent transmettre vos e-factures à vos clients et les données à la DGFiP. Votre logiciel doit être une plateforme agréée ou connecté à l'une d'elles.",
    urgency: "high",
    action: "Demander à votre éditeur logiciel : « Avez-vous un partenariat avec une plateforme agréée ? Laquelle ? Pour quand ? »",
    details: [
      "Si votre éditeur dit « on passera par le PPF » → c'est faux, le PPF n'assure plus l'échange des factures depuis le recentrage annoncé en octobre 2024",
      "Vérifier que la plateforme agréée partenaire est bien immatriculée sur la liste DGFiP",
      "Deviso est déjà raccordé à une Plateforme Agréée (Super PDP) et émet et reçoit déjà vos factures électroniques.",
    ],
  },
  {
    num: "04",
    title: "Vérifier les mentions légales obligatoires sur vos factures",
    description: "La réforme impose des données structurées dans le XML Factur-X, et ajoute quatre mentions obligatoires, à porter dans la partie visible (PDF) ET dans les données XML : numéro SIREN du client, adresse de livraison si elle diffère, nature des opérations (biens, services ou les deux), option pour la TVA sur les débits le cas échéant.",
    urgency: "medium",
    action: "Passer en revue vos modèles de facture et vous assurer que tous les champs requis par l'article 242 nonies A de l'annexe II du CGI sont présents.",
    details: [
      "Numéro SIREN du client, s'il s'agit d'une entreprise",
      "Adresse de livraison des biens si elle est différente de l'adresse du client",
      "Nature des opérations : livraisons de biens, prestations de services, ou les deux",
      "Option pour le paiement de la TVA d'après les débits, si vous l'avez choisie",
      "Numéro de bon de commande, lorsque l'acheteur l'a établi au préalable",
    ],
  },
  {
    num: "05",
    title: "Déterminer si vous avez une obligation d'e-reporting (B2C ou international)",
    description: "Si vous avez des clients particuliers OU des clients à l'étranger, vous avez une obligation d'e-reporting TVA en plus de l'e-invoicing B2B. L'e-reporting est souvent oublié dans les guides, mais l'amende est significative : 500 € par transmission manquante depuis le 1er septembre 2026, plafonnée à 15 000 € par an.",
    urgency: "medium",
    action: "Lister vos types de clients : B2B France, B2B étranger, B2C (particuliers), associations. Chaque catégorie a un traitement différent.",
    details: [
      "B2B France → e-invoicing via une plateforme agréée",
      "B2C (particuliers) → e-reporting à la DGFiP",
      "B2B étranger → e-reporting à la DGFiP",
      "Associations (non assujetties TVA) → e-reporting généralement",
    ],
  },
  {
    num: "06",
    title: "Vérifier la gestion de la TVA et votre statut franchise",
    description: "Même en franchise de TVA (micro-entrepreneur ou petite entreprise sous les seuils), vous êtes concerné : la réforme vise aussi les entreprises en franchise en base. Vous devez recevoir vos factures électroniques depuis le 1er septembre 2026, et émettre au format électronique celles destinées à des entreprises à partir du 1er septembre 2027.",
    urgency: "medium",
    action: "Vérifier votre statut TVA actuel (franchise 293B CGI vs assujetti) et les seuils applicables à votre activité pour 2026-2027.",
    details: [
      "Seuil de franchise TVA en services (BIC et BNC) : 37 500 € de base, 41 250 € en seuil majoré",
      "Si CA > seuil franchise → vous facturez la TVA ; l'obligation de facturation électronique, elle, reste la même",
      "Ventes aux particuliers ou à l'étranger → e-reporting, au même calendrier que l'émission",
    ],
  },
  {
    num: "07",
    title: "Planifier la formation et le test avant votre date d'obligation",
    description: "La réforme introduit de nouveaux workflows : envoi via une plateforme agréée, suivi des statuts de la facture, gestion des rejets. Tester avant le go-live est indispensable pour éviter les incidents en production.",
    urgency: "low",
    action: "Émettre quelques factures de test de bout en bout (création, envoi, suivi du statut) avant votre date d'obligation, avec le logiciel que vous utiliserez réellement.",
    details: [
      "Tester une facture standard B2B",
      "Tester un avoir/note de crédit",
      "Tester une facture avec TVA à taux réduit et une en franchise",
      "Vérifier le suivi des statuts de la facture, y compris en cas de rejet",
      "Tester la réception d'une e-facture de fournisseur",
    ],
  },
];

export default function ChecklistReforme2026Page() {
  return (
    <PageSite actif="/blog">
      <DonneesStructurees donnees={jsonLdArticle(SLUG)} />

      <div className="bg-indigo-950/95 backdrop-blur-xs border-b border-indigo-500/20 py-2 px-4 text-center text-sm">
        <span className="text-ink font-semibold">1er septembre 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">Grandes entreprises et ETI → e-facturation obligatoire. Toutes → obligation de réception.</span>
      </div>


      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
          <span>/</span>
          <Link href="/blog/facturation-electronique-2026" className="hover:text-ink transition-colors">Réforme 2026</Link>
          <span>/</span>
          <span className="text-gray-400">Checklist</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">Réforme 2026 · Checklist</span>
            <span className="text-xs text-gray-400">10 min · Mis à jour novembre 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink leading-tight mb-4">
            {article(SLUG).h1}
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            La réforme de la facturation électronique est complexe. Pour éviter de passer à côté d&apos;un point critique, nous avons condensé les actions essentielles en une checklist actionnable, à partager avec votre comptable.
          </p>
        </div>

        {/* Légende urgence */}
        <div className="flex items-center gap-4 text-xs mb-8 text-gray-500">
          <span>Priorité :</span>
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
                    ? "bg-[#241717]"
                    : item.urgency === "medium"
                    ? "bg-[#241d11]"
                    : "bg-ds-surface"
                }`}
              >
                <div className="flex items-center gap-3 shrink-0 mt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.urgency === "high" ? "bg-red-500/60" : item.urgency === "medium" ? "bg-amber-500/60" : "bg-indigo-500/40"
                    }`}
                  />
                  <span className="text-2xl font-bold text-ink/10 leading-none tabular-nums">{item.num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-ink mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <div className="px-5 py-4 bg-ds-bg space-y-3">
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
          <h2 className="text-xl font-bold text-ink mb-5">Récapitulatif des échéances</h2>
          <div className="bg-ds-surface border border-ds-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-ds-border text-sm">
              {[
                { date: "1er sept. 2026", action: "Grandes entreprises et ETI : émission e-factures et e-reporting obligatoires", extra: "Toutes entreprises : réception obligatoire" },
                { date: "1er sept. 2027", action: "PME, TPE, micro-entrepreneurs : émission e-factures et e-reporting obligatoires", extra: "" },
              ].map(({ date, action, extra }) => (
                <div key={date} className="flex gap-4 px-5 py-4">
                  <span className="font-semibold text-indigo-300 shrink-0 min-w-[120px]">{date}</span>
                  <div>
                    <p className="text-ink">{action}</p>
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
              { href: "/blog/reforme-facturation-micro-entrepreneur", title: "Micro-entrepreneur : tout ce que la réforme change" },
              { href: "/blog/choisir-plateforme-agreee-freelance", title: "Choisir sa plateforme agréée : guide comparatif" },
              { href: "/blog/e-reporting-freelance-2026", title: "E-reporting B2C : l'obligation oubliée de la réforme" },
            ].map(({ href, title }) => (
              <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors group">
                <span className="text-indigo-500 group-hover:text-indigo-300 shrink-0">→</span>
                {title}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#191830] border border-indigo-500/20 p-8 text-center mb-14">
          <h2 className="text-xl font-bold text-ink mb-3">Préparez-vous sans stress avec Deviso</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Deviso génère déjà des factures Factur-X au profil EN 16931 et, raccordé à une Plateforme Agréée (Super PDP), émet et reçoit déjà vos factures électroniques en conformité avec la réforme. {BETA_OUVERTE ? APPEL.phrase : "Essayez gratuitement pendant 14 jours, sans carte bancaire."}
          </p>
          <WaitlistButton plan="free" label="Essayer Deviso gratuitement →" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-6 py-3 rounded-xl transition-colors text-sm" />
          <p className="text-xs text-gray-400 mt-3">Factur-X inclus · Plateforme Agréée raccordée · E-reporting géré automatiquement</p>
          <Signature />
        </div>

              </main>
    </PageSite>
  );
}
