import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "experts-comptables-equiper-clients-micro";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Le dossier micro, ce petit client qui coûte cher",
    paragraphes: [
      "Les clients en micro-entreprise ont un point commun : leurs honoraires sont bas, mais leur <strong>dossier n&rsquo;est pas proportionnellement plus simple</strong>. Il arrive souvent en tableur approximatif, en captures d&rsquo;écran, parfois en pochette de factures, et c&rsquo;est le cabinet qui absorbe la mise en ordre.",
      "Résultat : une rentabilité faible, du temps passé en ressaisie et en relances, et une exposition au risque quand les pièces ne tiennent pas la route. Le levier n&rsquo;est pas de facturer plus, mais de <strong>tarir le désordre à la source</strong>, chez le client.",
    ],
  },
  {
    type: "liste",
    titre: "Ce que le dossier micro mal tenu coûte au cabinet",
    items: [
      {
        titre: "De la ressaisie",
        texte:
          "Reprendre un tableur, retrouver les encaissements, reconstituer une numérotation : du temps non facturable.",
      },
      {
        titre: "Des relances",
        texte:
          "Pièces manquantes, montants incohérents, factures introuvables : chaque échange rallonge le traitement.",
      },
      {
        titre: "Un risque de non-conformité",
        texte:
          "Numérotation à trous, recettes au facturé plutôt qu&rsquo;à l&rsquo;encaissé, mentions absentes : autant de points qui fragilisent le dossier.",
      },
      {
        titre: "Une exposition à la réforme",
        texte:
          "Un client non équipé pour la facturation électronique devient un problème à gérer en urgence, pas un dossier serein.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "La réforme fait de l&rsquo;équipement un sujet, pas un confort",
    texte:
      "Depuis septembre 2026, les assujettis à la TVA doivent pouvoir <strong>recevoir</strong> des factures électroniques, et l&rsquo;émission arrive pour tous. Vos clients micro vont devoir s&rsquo;équiper d&rsquo;un outil compatible, qu&rsquo;ils le veuillent ou non. Autant que ce soit un outil <strong>que vous avez choisi</strong>, dont vous connaissez les exports, plutôt qu&rsquo;une solution différente par client.",
  },
  {
    type: "comparaison",
    titre: "Client sur tableur, ou client équipé",
    colonnes: [
      {
        titre: "Client sur tableur",
        sousTitre: "Le cabinet absorbe tout",
        ton: "negatif",
        texte:
          "Données hétérogènes, encaissements à reconstituer, numérotation à vérifier, pièces à réclamer. Chaque dossier est un cas particulier, et la réforme reste à gérer.",
      },
      {
        titre: "Client équipé d&rsquo;un outil conforme",
        sousTitre: "Le cabinet supervise",
        ton: "positif",
        texte:
          "Factures conformes et numérotées, livre des recettes tenu à l&rsquo;encaissement, exports standardisés, conformité réforme intégrée. Le cabinet contrôle au lieu de ressaisir.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Équiper plutôt que subir",
    paragraphes: [
      "L&rsquo;idée est simple : donner à vos clients micro un outil de facturation qui produit, sans effort de leur part, exactement ce dont vous avez besoin. Côté client, une interface qu&rsquo;ils tiennent seuls au quotidien. Côté cabinet, une <strong>vue d&rsquo;ensemble</strong> de vos dossiers : conformité, échéances de TVA, points à traiter, exports prêts.",
      "C&rsquo;est l&rsquo;approche que nous développons avec Deviso : un outil pensé d&rsquo;abord pour le micro-entrepreneur, doublé d&rsquo;un cockpit pour l&rsquo;expert-comptable qui suit plusieurs dossiers. Nous en parlons en détail sur notre page dédiée aux experts-comptables.",
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Un cockpit pour le cabinet",
    texte:
      "Au-delà de l&rsquo;outil client, Deviso donne au cabinet un tableau de bord de ses dossiers : état de <strong>conformité</strong> (SIRET, raccordement à la réforme, régime de TVA), <strong>calendrier des échéances de TVA</strong>, signalements à traiter, et exports comptables standardisés. De quoi superviser un portefeuille de micro-entrepreneurs sans ressaisir dossier par dossier.",
  },
];

const FAQ = [
  {
    q: "Pourquoi les dossiers de clients en micro-entreprise sont-ils peu rentables ?",
    a: "Parce que leurs honoraires sont bas mais que le dossier arrive souvent mal tenu (tableur, captures, factures en vrac). Le cabinet absorbe la mise en ordre, la ressaisie et les relances, qui ne sont pas facturables.",
  },
  {
    q: "La réforme de la facturation électronique oblige-t-elle mes clients micro à s'équiper ?",
    a: "Oui. Depuis septembre 2026, les assujettis à la TVA doivent pouvoir recevoir des factures électroniques, et l'émission se généralise. Les clients micro devront disposer d'un outil compatible.",
  },
  {
    q: "Quel intérêt à choisir moi-même l'outil de mes clients ?",
    a: "Un outil unique, dont vous connaissez les exports et les règles, évite d'avoir une solution différente par client. Vous passez du temps à superviser plutôt qu'à ressaisir des données hétérogènes.",
  },
  {
    q: "Qu'apporte un cockpit cabinet par rapport à un simple outil de facturation ?",
    a: "Il donne une vue d'ensemble du portefeuille : état de conformité par dossier, calendrier des échéances de TVA, points à traiter et exports standardisés, pour superviser plusieurs micro-entrepreneurs sans traiter chaque dossier isolément.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Facturation électronique entre entreprises",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23208",
    precision: "calendrier de réception et d'émission des factures électroniques",
  },
  {
    libelle: "Deviso, page dédiée aux experts-comptables",
    url: "https://getdeviso.fr/experts-comptables",
    precision: "outil client et cockpit cabinet",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Le dossier micro est peu rentable non pas parce qu&rsquo;il est simple, mais parce qu&rsquo;il arrive en désordre. Plutôt que d&rsquo;absorber ce désordre, l&rsquo;équiper à la source. Comment, et ce que la réforme y change."
      enBref={[
        "Le dossier micro coûte cher au cabinet en <strong>ressaisie et relances</strong>, pas en complexité.",
        "La <strong>réforme 2026-2027</strong> oblige les clients assujettis à s&rsquo;équiper d&rsquo;un outil compatible.",
        "Choisir soi-même l&rsquo;outil, c&rsquo;est des <strong>exports standardisés</strong> au lieu d&rsquo;une solution par client.",
        "Un client équipé produit des factures conformes et un livre des recettes à l&rsquo;encaissement.",
        "Un <strong>cockpit cabinet</strong> ajoute conformité, échéances de TVA et supervision de portefeuille.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Découvrir Deviso côté cabinet",
        texte:
          "Nous construisons Deviso avec des experts-comptables, et cherchons des cabinets pilotes. La page experts-comptables détaille l&rsquo;outil client et le cockpit, et comment nous associer à sa conception.",
      }}
    />
  );
}
