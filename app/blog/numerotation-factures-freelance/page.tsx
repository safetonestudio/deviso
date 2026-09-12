import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "numerotation-factures-freelance";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Ce que la loi demande, en une phrase",
    paragraphes: [
      "L&rsquo;article 242 nonies A de l&rsquo;annexe II au Code général des impôts impose que chaque facture porte <strong>un numéro unique, fondé sur une séquence chronologique et continue</strong>. Trois mots, trois contraintes : unique, chronologique, continue.",
      "<strong>Unique</strong> : deux factures ne portent jamais le même numéro. <strong>Chronologique</strong> : les numéros suivent l&rsquo;ordre d&rsquo;émission, une facture du 3 mars ne peut pas avoir un numéro postérieur à une facture du 12 mars. <strong>Continue</strong> : aucun trou dans la série — et c&rsquo;est celle qu&rsquo;on casse sans le vouloir.",
      "Le format, lui, est libre. La loi ne vous impose ni préfixe, ni année, ni longueur. Elle impose la propriété de la suite, pas son apparence.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Pourquoi l&rsquo;administration y tient autant",
    texte:
      "Une séquence continue est une <strong>preuve d&rsquo;exhaustivité</strong>. Si les factures vont de 1 à 150 sans trou, toutes les recettes sont là. Un trou devient une question : qu&rsquo;y avait-il à cet endroit ? C&rsquo;est pour cela qu&rsquo;un numéro manquant n&rsquo;est pas une coquille administrative mais un indice de recette dissimulée — la charge de la preuve se retourne contre vous.",
  },
  {
    type: "texte",
    titre: "Les formats qui tiennent dans le temps",
    paragraphes: [
      "Un bon format de numérotation se reconnaît à trois qualités : il se trie correctement par ordre alphabétique, il ne casse pas quand le volume augmente, et il reste lisible au téléphone quand un client vous appelle à propos d&rsquo;une facture.",
      "La remise à zéro annuelle est autorisée et largement pratiquée. Elle suppose simplement que l&rsquo;année fasse partie du numéro : sans préfixe d&rsquo;année, repartir à 001 en janvier crée des doublons purs et simples.",
    ],
  },
  {
    type: "tableau",
    titre: "Quatre formats, évalués",
    colonnes: ["Format", "Exemple", "Verdict"],
    lignes: [
      [
        "<code>AAAA-NNN</code>",
        "2026-001, 2026-002",
        "<strong>Le meilleur choix par défaut.</strong> Se trie bien, supporte 999 factures par an, remise à zéro nette en janvier.",
      ],
      [
        "<code>AAAA-MM-NNN</code>",
        "2026-03-001, 2026-03-002",
        "Bon si vous émettez beaucoup. Attention : la séquence doit rester continue <em>dans l&rsquo;année</em>, donc soit vous numérotez en continu sur l&rsquo;année, soit chaque mois devient une série distincte à justifier.",
      ],
      [
        "<code>FNNNNN</code>",
        "F00001, F00002",
        "Simple et sûr, jamais de remise à zéro. Moins lisible pour retrouver une facture par son année.",
      ],
      [
        "<code>NomClient-NNN</code>",
        "DUPONT-001",
        "<strong>À éviter.</strong> Une série par client est difficile à justifier, et la doctrine précise que la dispersion géographique des clients ne suffit pas à fonder des séries distinctes.",
      ],
    ],
    note:
      "Quel que soit le format retenu : on ne le change pas en cours d&rsquo;année. Un changement de format se fait au 1<sup>er</sup> janvier, jamais au milieu d&rsquo;une série.",
  },
  {
    type: "texte",
    titre: "Les séries distinctes : autorisées, mais à condition",
    paragraphes: [
      "La doctrine fiscale admet plusieurs séries de numérotation en parallèle, lorsque les conditions d&rsquo;exercice de l&rsquo;activité le justifient. Les exemples qu&rsquo;elle retient : plusieurs sites de facturation, plusieurs catégories de clients soumis à des règles différentes, ou plusieurs modalités d&rsquo;émission — papier, électronique, autofacturation.",
      "Dans ce cas, chaque série doit recevoir un <strong>préfixe distinct</strong> écartant toute confusion, chaque série reste chronologique et continue pour elle-même, et deux factures de la même année ne peuvent pas porter le même numéro, toutes séries confondues.",
      "Ce que la doctrine <strong>refuse</strong> explicitement : créer une série par client ou par État membre au seul motif que vos clients sont dans plusieurs pays. Ce n&rsquo;est pas une condition d&rsquo;exercice, c&rsquo;est une commodité de classement.",
      "Pour un freelance seul, la réponse est presque toujours la même : <strong>une seule série</strong>. Le besoin de séries multiples apparaît avec plusieurs établissements, pas avec plusieurs types de missions.",
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Les devis ne sont pas des factures",
    texte:
      "Un devis n&rsquo;entre pas dans la séquence des factures et n&rsquo;est soumis à aucune obligation de numérotation fiscale. Mais numérotez-les quand même, dans une suite <em>séparée</em> — <code>DEV-2026-001</code> —, pour pouvoir y faire référence sur la facture correspondante. Mélanger devis et factures dans une même suite crée des trous le jour où un devis n&rsquo;est pas signé.",
  },
  {
    type: "liste",
    titre: "Les cinq façons de casser une série sans le savoir",
    intro: "Aucune n&rsquo;est malhonnête. Toutes produisent un trou.",
    items: [
      {
        titre: "Supprimer une facture émise par erreur",
        texte:
          "C&rsquo;est l&rsquo;erreur numéro un. Une facture émise ne se supprime jamais : elle se corrige par un avoir, qui porte son propre numéro dans la série. Supprimer la 2026-042 laisse un trou que rien ne comble.",
      },
      {
        titre: "« Réserver » un numéro pour une facture à venir",
        texte:
          "Vous attribuez 2026-043 à une mission qui ne se fait finalement pas. La suite reprend à 044 et 043 n&rsquo;existe pas. Un numéro s&rsquo;attribue <strong>à l&rsquo;émission</strong>, pas à l&rsquo;intention.",
      },
      {
        titre: "Tenir deux outils en parallèle",
        texte:
          "Un tableur pour les petites factures, un logiciel pour les grosses. Chacun croit connaître le dernier numéro utilisé, les deux se trompent. Un seul compteur, un seul endroit.",
      },
      {
        titre: "Émettre un brouillon, puis le refaire",
        texte:
          "Un brouillon n&rsquo;est pas une facture et ne consomme pas de numéro. Mais si l&rsquo;outil numérote dès la création, le brouillon abandonné laisse un trou. Vérifiez à quel moment votre outil attribue le numéro.",
      },
      {
        titre: "Changer de format en cours d&rsquo;année",
        texte:
          "Passer de <code>F00012</code> à <code>2026-013</code> en juin : la continuité de la série n&rsquo;est plus lisible, même si aucun numéro ne manque matériellement.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Réparer une série déjà cassée",
    paragraphes: [
      "Voici la partie que les pages sur le sujet escamotent, parce qu&rsquo;elle n&rsquo;a pas de réponse réglementaire nette : la doctrine décrit l&rsquo;obligation, pas le rattrapage. Il ne faut donc pas chercher une procédure officielle — elle n&rsquo;existe pas — mais adopter la conduite la plus défendable.",
      "Et le premier réflexe est de résister à la tentation de renuméroter. <strong>On ne renumérote jamais des factures déjà envoyées.</strong> Elles sont chez vos clients, dans leur comptabilité, parfois déjà payées et rapprochées d&rsquo;un relevé bancaire. Les changer crée deux versions d&rsquo;un même document : un problème bien plus grave que le trou d&rsquo;origine.",
    ],
  },
  {
    type: "liste",
    titre: "La marche à suivre",
    numerotee: true,
    items: [
      {
        titre: "Arrêter l&rsquo;hémorragie",
        texte:
          "Identifiez la cause — deux outils, un brouillon numéroté, une suppression — et corrigez-la avant tout. Réparer une série qui continue de se casser ne sert à rien.",
      },
      {
        titre: "Lister les numéros manquants",
        texte:
          "Faites la liste exhaustive des trous, avec la date approximative à laquelle chacun aurait dû être émis. C&rsquo;est cette liste que vous présenterez si la question se pose.",
      },
      {
        titre: "Écrire une note explicative, datée, et la conserver",
        texte:
          "Un simple document : « Les numéros 2026-017 et 2026-023 n&rsquo;ont jamais été attribués à une facture. Cause : brouillons numérotés puis abandonnés avant émission. Aucune recette ne correspond à ces numéros. » Daté, signé, archivé avec les factures de l&rsquo;exercice. Cette note est votre réponse préparée à l&rsquo;avance — et elle vaut infiniment mieux qu&rsquo;une explication improvisée deux ans plus tard.",
      },
      {
        titre: "Reprendre la suite là où elle est",
        texte:
          "Ne comblez pas le trou à rebours en émettant aujourd&rsquo;hui une facture portant un ancien numéro : vous casseriez la chronologie pour réparer la continuité. Continuez simplement la série.",
      },
      {
        titre: "Repartir proprement au 1<sup>er</sup> janvier",
        texte:
          "Le changement d&rsquo;exercice est le bon moment pour adopter un format sain et une source unique de numérotation. La série précédente reste ce qu&rsquo;elle est, documentée par la note.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Ce que la facturation électronique change",
    paragraphes: [
      "À partir du moment où vos factures transitent par une plateforme agréée, le numéro cesse d&rsquo;être une information interne : il devient une <strong>donnée structurée transmise à l&rsquo;administration</strong>, au même titre que le montant ou le SIREN du client. C&rsquo;est la différence majeure avec le PDF d&rsquo;hier.",
      "Et ce numéro est la clé qui relie tout le reste : c&rsquo;est par lui que le cycle de vie de la facture est suivi — déposée, refusée, encaissée, rejetée —, et c&rsquo;est lui que vous citerez dans un avoir ou une facture rectificative. Un numéro en doublon devient un conflit d&rsquo;identification, pas seulement une maladresse.",
      "La conséquence concrète : la numérotation à la main, dans un tableur, n&rsquo;a plus vraiment de place après septembre 2027. Le numéro doit être généré par l&rsquo;outil qui émet, au moment où il émet, et une seule fois.",
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "La règle qui règle tout",
    texte:
      "<strong>Un seul outil attribue les numéros, et il les attribue à l&rsquo;émission.</strong> Si cette phrase est vraie chez vous, vous ne casserez plus jamais votre série — et vous n&rsquo;aurez plus à vous demander quel était le dernier numéro utilisé.",
  },
];

const FAQ = [
  {
    q: "Quel format de numéro de facture choisir ?",
    a: "Le format est libre : la loi n'impose que l'unicité, la chronologie et la continuité de la suite. Le format AAAA-NNN (2026-001) est le meilleur choix par défaut — il se trie correctement, il supporte une remise à zéro annuelle sans créer de doublon, et il reste lisible.",
  },
  {
    q: "Puis-je recommencer ma numérotation à 1 chaque année ?",
    a: "Oui, à condition que l'année figure dans le numéro. Sans préfixe d'année, repartir à 001 crée des doublons avec l'exercice précédent, ce qui viole l'exigence d'unicité.",
  },
  {
    q: "Que faire s'il manque un numéro dans ma série de factures ?",
    a: "Ne renumérotez pas les factures déjà envoyées et ne comblez pas le trou à rebours. Identifiez et corrigez la cause, listez les numéros manquants, puis rédigez une note datée expliquant qu'aucune recette ne correspond à ces numéros et conservez-la avec les pièces de l'exercice. La doctrine ne prévoit pas de procédure de rattrapage : c'est la traçabilité de l'explication qui vous protège.",
  },
  {
    q: "Puis-je supprimer une facture émise par erreur ?",
    a: "Non, jamais. Une facture émise est définitive ; elle se corrige par un avoir, qui porte son propre numéro dans la même série. La suppression est la première cause de trou dans une numérotation.",
  },
  {
    q: "Puis-je utiliser plusieurs séries de numérotation en même temps ?",
    a: "Oui lorsque les conditions d'exercice de l'activité le justifient — plusieurs sites de facturation, plusieurs catégories de clients aux règles différentes, plusieurs modalités d'émission — avec un préfixe distinct par série et aucune collision de numéro sur l'année. En revanche, avoir des clients dans plusieurs pays ne justifie pas, à lui seul, une série par client ou par État.",
  },
  {
    q: "Les devis doivent-ils suivre la même numérotation que les factures ?",
    a: "Non, et il vaut mieux qu'ils ne la suivent pas. Les devis ne sont soumis à aucune obligation de numérotation fiscale : donnez-leur une suite séparée, par exemple DEV-2026-001. Les mélanger aux factures crée un trou chaque fois qu'un devis n'est pas signé.",
  },
  {
    q: "La facturation électronique change-t-elle les règles de numérotation ?",
    a: "Les règles restent les mêmes, mais leur portée change : le numéro devient une donnée structurée transmise à l'administration et sert de clé de suivi du cycle de vie de la facture. Un doublon ou un trou cesse d'être une anomalie interne pour devenir un problème d'identification visible de l'extérieur.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Légifrance — article 242 nonies A de l'annexe II au CGI",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000050811276",
    precision: "mentions obligatoires, dont le numéro unique fondé sur une séquence chronologique continue",
  },
  {
    libelle: "BOFiP — BOI-TVA-DECLA-30-20-20-10, mentions obligatoires générales",
    url: "https://bofip.impots.gouv.fr/bofip/140-PGP.html/identifiant=BOI-TVA-DECLA-30-20-20-10-20131018",
    precision: "§ 70 à 130 : numérotation, séries distinctes et cas admis",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Unique, chronologique, continue : trois mots du Code général des impôts qui font toute la règle. Le format, lui, est libre. Voici ceux qui tiennent dans le temps, les cinq façons de casser une série sans le vouloir — et la conduite à tenir quand c&rsquo;est déjà fait."
      enBref={[
        "La loi exige un <strong>numéro unique fondé sur une séquence chronologique et continue</strong>. Le format est libre.",
        "Le format <code>AAAA-NNN</code> est le meilleur choix par défaut ; la remise à zéro annuelle est permise si l&rsquo;année figure dans le numéro.",
        "Les <strong>séries multiples</strong> sont admises quand l&rsquo;activité le justifie — mais avoir des clients dans plusieurs pays ne le justifie pas.",
        "Première cause de trou : <strong>supprimer une facture</strong>. On la corrige par un avoir, on ne l&rsquo;efface jamais.",
        "Série déjà cassée : on ne renumérote pas. On corrige la cause et on <strong>documente les trous par une note datée</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Un seul compteur, au bon moment",
        texte:
          "Deviso attribue le numéro à l&rsquo;émission et à ce moment seulement : un brouillon abandonné ne consomme rien, et la série ne peut pas se casser dans votre dos.",
      }}
    />
  );
}
