import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "attestation-vigilance-urssaf-freelance";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Ce n&rsquo;est pas de la méfiance envers vous",
    paragraphes: [
      "Votre client ne vous demande pas ce document parce qu&rsquo;il doute de vous. Il le demande parce qu&rsquo;<strong>il y est obligé</strong>, et que s&rsquo;il ne le fait pas, c&rsquo;est lui qui risque.",
      "Le mécanisme s&rsquo;appelle la solidarité financière du donneur d&rsquo;ordre. Pour tout contrat d&rsquo;au moins <strong>5 000 € hors taxes</strong>, un client professionnel doit vérifier que son prestataire déclare bien son activité et paie ses cotisations. S&rsquo;il ne le fait pas et que le prestataire se révèle être en situation de travail dissimulé, le client peut être tenu solidairement responsable des cotisations, impôts et pénalités dus — et perdre ses propres exonérations.",
      "Autrement dit : quand votre interlocuteur bloque un paiement en attendant cette attestation, il protège son entreprise. Le comprendre change la conversation, et permet de répondre en trois minutes au lieu de s&rsquo;agacer.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Le seuil, la fréquence, et qui demande quoi",
    texte:
      "L&rsquo;obligation s&rsquo;applique aux contrats de <strong>5 000 € HT et plus</strong>, et la vérification doit être <strong>renouvelée tous les six mois</strong> jusqu&rsquo;au terme de la mission. Elle pèse sur le donneur d&rsquo;ordre, mais seul le prestataire peut obtenir le document : votre client ne peut pas le réclamer à l&rsquo;URSSAF à votre place.",
  },
  {
    type: "liste",
    titre: "Comment l&rsquo;obtenir, concrètement",
    numerotee: true,
    intro:
      "C&rsquo;est une affaire de quelques minutes, à condition de remplir une condition dont personne ne parle — elle est au point 1.",
    items: [
      {
        titre: "Avoir fait au moins une déclaration de chiffre d&rsquo;affaires",
        texte:
          "C&rsquo;est la condition qui bloque les nouveaux inscrits : tant que vous n&rsquo;avez pas transmis votre première déclaration, mensuelle ou trimestrielle, l&rsquo;URSSAF n&rsquo;a rien à attester. Et une déclaration à zéro compte : si vous n&rsquo;avez pas encore facturé, déclarez zéro, et l&rsquo;attestation devient disponible.",
      },
      {
        titre: "Être à jour de vos cotisations",
        texte:
          "Pas nécessairement à zéro de dette : un échéancier de paiement en cours, ou une contestation en cours d&rsquo;examen, permet généralement la délivrance. Ce qui la bloque franchement, c&rsquo;est une infraction de travail dissimulé non régularisée.",
      },
      {
        titre: "Vous connecter à votre espace URSSAF",
        texte:
          "Sur le site de l&rsquo;URSSAF dédié aux auto-entrepreneurs si vous en êtes un, sur votre espace en ligne sinon. Rubrique « Mes documents » ou « Mes attestations », puis « Attestation de vigilance ».",
      },
      {
        titre: "La télécharger et la transmettre",
        texte:
          "Vous obtenez un PDF immédiatement, avec un code de vérification. Envoyez-le à votre client, et notez la date : vous devrez en fournir une nouvelle dans six mois si la mission continue.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Sa durée de validité, et le piège du renouvellement",
    paragraphes: [
      "L&rsquo;attestation est valable <strong>six mois</strong>. Elle porte un code qui permet à votre client de vérifier son authenticité directement auprès de l&rsquo;URSSAF — c&rsquo;est d&rsquo;ailleurs la raison pour laquelle il ne sert à rien de modifier le PDF : la vérification se fait sur le code, pas sur le fichier.",
      "Le piège est là : sur une mission longue, votre client doit revérifier tous les six mois, et il le fera souvent en bloquant une facture. Si vous anticipez — une attestation fraîche envoyée avec la première facture du semestre — vous vous épargnez un retard de paiement d&rsquo;une ou deux semaines. C&rsquo;est une des rares démarches administratives où cinq minutes d&rsquo;avance évitent vraiment un problème.",
    ],
  },
  {
    type: "comparaison",
    titre: "Attestation de vigilance, attestation fiscale, extrait Kbis : ne pas confondre",
    intro:
      "Les trois sont réclamés dans les mêmes dossiers, et ne disent pas la même chose. Votre client demande souvent « les documents » sans savoir lesquels.",
    colonnes: [
      {
        titre: "Attestation de vigilance",
        ton: "positif",
        sousTitre: "URSSAF · 6 mois",
        texte:
          "Atteste que vous êtes déclaré et à jour de vos <strong>cotisations sociales</strong>. C&rsquo;est celle qu&rsquo;impose la loi au-delà de 5 000 € HT, et celle dont dépend la solidarité financière du client.",
      },
      {
        titre: "Attestation de régularité fiscale",
        ton: "neutre",
        sousTitre: "Impôts",
        texte:
          "Atteste que vous êtes à jour de vos <strong>obligations fiscales</strong>. Demandée surtout dans les marchés publics, depuis votre espace professionnel sur impots.gouv.fr.",
      },
      {
        titre: "Avis de situation SIRENE",
        ton: "neutre",
        sousTitre: "INSEE · gratuit",
        texte:
          "Atteste simplement de votre <strong>existence</strong> et de votre numéro SIREN. C&rsquo;est l&rsquo;équivalent du Kbis pour un micro-entrepreneur, qui n&rsquo;en a pas. Téléchargeable en un clic sur le site de l&rsquo;INSEE.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Si votre client réclame un « Kbis »",
    texte:
      "Un micro-entrepreneur n&rsquo;en a pas, et n&rsquo;en aura jamais : le Kbis est un extrait du registre du commerce, qui concerne les sociétés et les commerçants immatriculés. Ce que vous pouvez fournir, c&rsquo;est votre <strong>avis de situation au répertoire SIRENE</strong>, gratuit et immédiat. Dites-le simplement : la plupart du temps votre interlocuteur applique une liste sans savoir ce qu&rsquo;elle contient.",
  },
  {
    type: "liste",
    titre: "Si elle vous est refusée",
    intro: "Trois causes, et trois sorties.",
    items: [
      {
        titre: "Aucune déclaration transmise",
        texte:
          "Le cas le plus fréquent chez les nouveaux inscrits, et le plus facile à régler : déclarez, même à zéro. L&rsquo;attestation devient disponible ensuite.",
      },
      {
        titre: "Des cotisations en retard",
        texte:
          "Demandez un échéancier à votre URSSAF avant de demander l&rsquo;attestation. Un plan de paiement en cours ne bloque généralement pas la délivrance ; une dette ignorée, oui.",
      },
      {
        titre: "Une procédure de travail dissimulé",
        texte:
          "Là, aucune astuce : l&rsquo;attestation est refusée tant que la situation n&rsquo;est pas régularisée, et c&rsquo;est précisément l&rsquo;objet du dispositif.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Ce que vous pouvez dire à votre client en attendant",
    paragraphes: [
      "Si le délai est en cause — vous venez de vous inscrire, votre première déclaration n&rsquo;est pas encore due — dites-le franchement, avec la date à laquelle vous pourrez fournir le document. Beaucoup de clients acceptent de démarrer sur cette base, parce que leur obligation porte sur la vérification, pas sur l&rsquo;existence préalable d&rsquo;un papier.",
      "Et fournissez ce que vous avez déjà : avis de situation SIRENE, attestation de régularité fiscale, assurance responsabilité civile professionnelle si votre métier en exige une. Un dossier complet sur trois points sur quatre rassure beaucoup plus qu&rsquo;un silence en attendant le quatrième.",
    ],
  },
];

const FAQ = [
  {
    q: "À partir de quel montant mon client doit-il me demander une attestation de vigilance ?",
    a: "À partir de 5 000 € hors taxes de contrat. En dessous, il n'y a pas d'obligation légale — ce qui ne l'empêche pas de la demander par prudence ou par politique interne. Au-delà, la vérification doit être renouvelée tous les six mois jusqu'à la fin de la mission.",
  },
  {
    q: "Un micro-entrepreneur peut-il obtenir une attestation de vigilance ?",
    a: "Oui, sans difficulté particulière — à une condition que personne ne mentionne : il faut avoir transmis au moins une déclaration de chiffre d'affaires. Tant que vous n'avez rien déclaré, l'URSSAF n'a rien à attester. Et une déclaration à zéro compte : si vous n'avez pas encore facturé, déclarez zéro et le document devient disponible.",
  },
  {
    q: "Où la télécharger ?",
    a: "Dans votre espace en ligne URSSAF, rubrique « Mes documents » ou « Mes attestations », puis « Attestation de vigilance ». Le PDF est délivré immédiatement. Seul vous pouvez l'obtenir : votre client ne peut pas la réclamer à l'URSSAF à votre place, ce qui explique pourquoi il vous relance.",
  },
  {
    q: "Combien de temps est-elle valable ?",
    a: "Six mois. Elle porte un code qui permet à votre client de vérifier son authenticité auprès de l'URSSAF — c'est sur ce code que porte la vérification, pas sur le fichier. Sur une mission longue, anticipez : une attestation fraîche envoyée avec la première facture du semestre évite un blocage de paiement.",
  },
  {
    q: "Que se passe-t-il si je ne la fournis pas ?",
    a: "Vous ne risquez rien directement : l'obligation pèse sur votre client, pas sur vous. Mais lui risque beaucoup — la solidarité financière sur vos cotisations et impôts en cas de travail dissimulé, et la remise en cause de ses propres exonérations. En pratique, il bloquera donc le paiement ou ne renouvellera pas la mission. L'enjeu est commercial, pas légal.",
  },
  {
    q: "Mon client me demande un Kbis, que faire ?",
    a: "Expliquez-lui qu'un micro-entrepreneur n'en a pas : le Kbis est un extrait du registre du commerce, réservé aux sociétés et aux commerçants immatriculés. L'équivalent que vous pouvez fournir est l'avis de situation au répertoire SIRENE, gratuit et téléchargeable immédiatement sur le site de l'INSEE. La plupart du temps, votre interlocuteur applique une liste sans savoir ce qu'elle contient.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "URSSAF — Obtenir et vérifier une attestation de vigilance",
    url: "https://www.urssaf.fr/accueil/attestation-vigilance.html",
    precision: "délivrance, vérification par le donneur d'ordre, durée de validité",
  },
  {
    libelle: "Article L8222-1 du Code du travail",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006904828",
    precision: "obligation de vigilance du donneur d'ordre au-delà de 5 000 € HT",
  },
  {
    libelle: "Article L8222-2 du Code du travail",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006904830",
    precision: "solidarité financière du donneur d'ordre en cas de travail dissimulé",
  },
  {
    libelle: "INSEE — Avis de situation au répertoire SIRENE",
    url: "https://avis-situation-sirene.insee.fr/",
    precision: "l'équivalent du Kbis pour un micro-entrepreneur, gratuit",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Votre client bloque le paiement en réclamant une « attestation de vigilance », vous n&rsquo;avez jamais entendu parler de ce document, et vous vous demandez s&rsquo;il cherche à gagner du temps. Non : il applique une obligation légale, et vous pouvez la satisfaire en cinq minutes."
      enBref={[
        "Obligation de <strong>votre client</strong>, pas de vous : au-delà de <strong>5 000 € HT</strong> de contrat, il doit vérifier votre situation.",
        "Elle se télécharge dans votre <strong>espace URSSAF</strong>, en quelques clics, et vous seul pouvez l&rsquo;obtenir.",
        "La condition qui bloque les nouveaux inscrits : avoir fait <strong>au moins une déclaration</strong> de chiffre d&rsquo;affaires — même à zéro.",
        "Valable <strong>six mois</strong>, à renouveler sur les missions longues.",
        "Si on vous demande un « Kbis », un micro-entrepreneur n&rsquo;en a pas : c&rsquo;est l&rsquo;<strong>avis de situation SIRENE</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
    />
  );
}
