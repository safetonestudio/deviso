import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "facturer-client-etranger-freelance";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Deux questions, dans cet ordre",
    paragraphes: [
      "La mention à porter sur votre facture ne dépend pas du pays du client. Elle dépend de deux choses, et il faut les trancher dans l&rsquo;ordre : <strong>votre client est-il un professionnel ou un particulier ?</strong> puis <strong>est-il dans l&rsquo;Union européenne ou hors UE ?</strong>",
      "Deux réponses, quatre combinaisons, quatre traitements différents. Les inverser est l&rsquo;erreur la plus fréquente : on regarde d&rsquo;abord le drapeau, alors que c&rsquo;est la qualité du client qui commande.",
      "Tout ce qui suit concerne les <strong>prestations de services</strong>, le cas de l&rsquo;immense majorité des freelances. La vente de biens suit des règles distinctes (livraisons intracommunautaires, exportations, DEB) qui ne sont pas traitées ici.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Comment savoir si votre client est « professionnel »",
    texte:
      "Au sens de la TVA, un professionnel est un <strong>assujetti</strong>. La preuve pratique : il vous donne un numéro de TVA intracommunautaire valide. Vérifiez-le sur <em>VIES</em>, le service de contrôle de la Commission européenne — gratuit, instantané. Un numéro invalide ou absent vous ramène au régime des particuliers, avec les conséquences qui vont avec. Gardez la copie d&rsquo;écran de la vérification : en contrôle, c&rsquo;est elle qui vous protège.",
  },
  {
    type: "tableau",
    titre: "Les quatre cas, en un coup d&rsquo;œil",
    colonnes: ["Client", "TVA", "Mention à porter", "Déclaration"],
    lignes: [
      [
        "<strong>Pro dans l&rsquo;UE</strong>",
        "Non facturée — autoliquidée par le client",
        "« Autoliquidation — TVA due par le preneur, art. 283-2 du CGI »",
        "<strong>DES</strong> mensuelle",
      ],
      [
        "<strong>Particulier dans l&rsquo;UE</strong>",
        "TVA française (ou franchise)",
        "Votre régime habituel",
        "Aucune",
      ],
      [
        "<strong>Pro hors UE</strong>",
        "Hors champ de la TVA française",
        "« Prestation non soumise à la TVA française, art. 259-1° du CGI »",
        "Aucune",
      ],
      [
        "<strong>Particulier hors UE</strong>",
        "Dépend de la nature du service",
        "Voir la section dédiée",
        "Aucune",
      ],
    ],
    note:
      "Les services fournis par voie électronique à des particuliers de l&rsquo;UE forment une exception importante, traitée plus bas.",
  },
  {
    type: "texte",
    titre: "Cas 1 — Un professionnel dans l&rsquo;Union européenne",
    paragraphes: [
      "C&rsquo;est le cas le plus courant et celui qui réserve la plus grosse surprise. La prestation est imposable dans <strong>le pays du client</strong>, pas en France. Vous facturez donc hors taxe, et c&rsquo;est lui qui déclare et paie la TVA chez lui : c&rsquo;est l&rsquo;autoliquidation.",
      "La surprise : <strong>cela s&rsquo;applique même si vous êtes en franchise en base de TVA</strong>. Être dispensé de TVA en France ne vous dispense pas du mécanisme européen. Concrètement, un micro-entrepreneur en franchise qui facture un client professionnel allemand doit demander un <strong>numéro de TVA intracommunautaire</strong> à son service des impôts des entreprises — sans pour autant devenir assujetti en France, ni facturer de TVA à ses clients français.",
      "Et il doit déposer une <strong>Déclaration européenne de services</strong>, la DES, auprès de la douane : tous les mois où il a facturé un client pro de l&rsquo;UE, au plus tard le <strong>10<sup>e</sup> jour ouvrable du mois suivant</strong>. La déclaration se fait en ligne sur le portail pro.douane. Elle est courte — numéro de TVA du client, montant HT — mais elle est obligatoire et son oubli est sanctionné.",
    ],
  },
  {
    type: "liste",
    titre: "Ce que la facture doit contenir, en plus des mentions habituelles",
    items: [
      {
        titre: "Votre numéro de TVA intracommunautaire",
        texte: "Celui que vous avez obtenu auprès du SIE, même si vous êtes en franchise.",
      },
      {
        titre: "Le numéro de TVA intracommunautaire du client",
        texte: "Vérifié sur VIES, reproduit à l&rsquo;identique.",
      },
      {
        titre: "La mention d&rsquo;autoliquidation",
        texte:
          "« <strong>Autoliquidation</strong> — TVA due par le preneur, article 283-2 du CGI ». Certains clients demandent la formule anglaise « Reverse charge » : vous pouvez ajouter la traduction, pas remplacer la mention française.",
      },
      {
        titre: "Aucune TVA dans le total",
        texte:
          "Le montant HT est le montant dû. Et si vous êtes en franchise, n&rsquo;ajoutez <strong>pas</strong> la mention « TVA non applicable, art. 293 B » sur cette facture : elle n&rsquo;a rien à y faire et brouille le message envoyé au client.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Cas 2 — Un particulier dans l&rsquo;Union européenne",
    paragraphes: [
      "Pour un particulier de l&rsquo;UE, la prestation est en principe imposable <strong>là où vous êtes établi</strong>, donc en France. Vous facturez comme à un client français : TVA française si vous y êtes assujetti, mention « TVA non applicable, article 293 B du CGI » si vous êtes en franchise. Pas de DES, pas de numéro intracommunautaire requis.",
      "L&rsquo;exception concerne les <strong>services fournis par voie électronique</strong> : formations en ligne préenregistrées, logiciels, modèles téléchargeables, abonnements numériques. Ceux-là sont imposables dans le pays du consommateur dès que vos ventes de ce type vers l&rsquo;UE dépassent <strong>10 000 € par an</strong>, tous pays confondus. Au-delà, il faut appliquer le taux de chaque pays — en pratique via le guichet unique OSS, qui centralise la déclaration.",
      "Un point de vigilance : une formation en <em>direct</em>, avec un intervenant humain, n&rsquo;est pas un service électronique. Une formation <em>préenregistrée</em> vendue en libre-service l&rsquo;est. La frontière se joue sur l&rsquo;automatisation, pas sur le support.",
    ],
  },
  {
    type: "texte",
    titre: "Cas 3 — Un professionnel hors UE",
    paragraphes: [
      "Entreprise américaine, canadienne, suisse, britannique : la prestation est imposable chez le client, donc <strong>hors du champ de la TVA française</strong>. Vous facturez hors taxe, avec la mention « Prestation non soumise à la TVA française — article 259-1° du CGI ».",
      "Bonne nouvelle : <strong>pas de DES</strong>. Cette déclaration ne concerne que l&rsquo;Union européenne. Pas de numéro intracommunautaire requis non plus.",
      "En revanche le client n&rsquo;a souvent aucun numéro de TVA à vous donner. Conservez donc d&rsquo;autres preuves de sa qualité professionnelle : extrait de registre local, numéro d&rsquo;identification fiscale, contrat au nom de la société, correspondance sur un domaine d&rsquo;entreprise. C&rsquo;est à vous de démontrer que vous aviez de bonnes raisons de le traiter comme un assujetti.",
    ],
  },
  {
    type: "texte",
    titre: "Cas 4 — Un particulier hors UE",
    paragraphes: [
      "Le cas le moins intuitif. Le principe voudrait une TVA française, mais l&rsquo;article 259 B du CGI retire du champ français une liste de services immatériels lorsqu&rsquo;ils sont rendus à une personne non assujettie établie <strong>hors de l&rsquo;Union</strong> : conseil, études, publicité, traitement de données et fourniture d&rsquo;information, cessions de droits, locations de biens meubles corporels, entre autres.",
      "Autrement dit : du conseil vendu à un particulier brésilien échappe à la TVA française, tandis qu&rsquo;une prestation qui ne figure pas dans cette liste y reste soumise. Quand le doute subsiste, c&rsquo;est le cas à faire trancher — la liste est limitative et son interprétation n&rsquo;est pas toujours évidente.",
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "L&rsquo;erreur qui coûte le plus cher",
    texte:
      "Facturer hors taxe à un client étranger qui n&rsquo;était pas assujetti. Si la vérification du numéro de TVA n&rsquo;a pas été faite, ou si le numéro était invalide, c&rsquo;est <strong>vous</strong> qui devez la TVA — sur une facture déjà encaissée hors taxe, donc sur votre marge. La vérification VIES prend dix secondes et sa copie d&rsquo;écran vaut une assurance.",
  },
  {
    type: "texte",
    titre: "Ce que la facturation électronique change pour l&rsquo;international",
    paragraphes: [
      "Une précision qui rassure : l&rsquo;obligation de <strong>facture électronique</strong> ne concerne que les opérations entre entreprises établies en France. Une facture à un client allemand ou américain reste, de ce point de vue, une facture ordinaire — PDF, mail, canal habituel.",
      "Mais ces opérations entrent dans le périmètre de l&rsquo;<strong>e-reporting</strong> : les données de la transaction devront être transmises à l&rsquo;administration, via votre plateforme agréée, selon le même calendrier que l&rsquo;émission — septembre 2027 pour les TPE, PME et micro-entreprises.",
      "La conséquence pratique est qu&rsquo;il faudra, dans votre outil de facturation, que le statut du client (pro ou particulier, UE ou hors UE) soit une <em>donnée</em> et non une mention tapée à la main. C&rsquo;est elle qui détermine le traitement à déclarer.",
    ],
  },
  {
    type: "liste",
    titre: "La procédure, dans l&rsquo;ordre, pour une première facture à l&rsquo;étranger",
    numerotee: true,
    items: [
      {
        titre: "Qualifier le client",
        texte: "Professionnel ou particulier ? UE ou hors UE ? Les deux réponses, avant d&rsquo;écrire la facture.",
      },
      {
        titre: "Vérifier le numéro de TVA sur VIES",
        texte: "Pour un pro de l&rsquo;UE. Conserver la copie d&rsquo;écran datée avec la facture.",
      },
      {
        titre: "Demander son numéro intracommunautaire au SIE",
        texte:
          "Si c&rsquo;est votre première prestation à un pro de l&rsquo;UE et que vous êtes en franchise. Par la messagerie sécurisée de l&rsquo;espace professionnel impots.gouv.fr. Comptez quelques jours.",
      },
      {
        titre: "Émettre la facture avec la bonne mention",
        texte: "Celle du tableau, reprise mot pour mot. Pas deux mentions contradictoires.",
      },
      {
        titre: "Déposer la DES avant le 10e jour ouvrable du mois suivant",
        texte: "Sur pro.douane, uniquement pour les clients pro de l&rsquo;UE, et uniquement les mois concernés.",
      },
      {
        titre: "Déclarer le montant dans votre CA URSSAF",
        texte:
          "Le chiffre d&rsquo;affaires encaissé à l&rsquo;étranger est du chiffre d&rsquo;affaires. Absence de TVA ne veut pas dire absence de cotisations.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Dois-je facturer la TVA à un client professionnel en Allemagne ?",
    a: "Non. La prestation est imposable dans le pays du client, qui autoliquide la TVA chez lui. Vous facturez hors taxe avec la mention « Autoliquidation — TVA due par le preneur, article 283-2 du CGI », après avoir vérifié son numéro de TVA sur VIES.",
  },
  {
    q: "Un micro-entrepreneur en franchise en base doit-il un numéro de TVA intracommunautaire ?",
    a: "Oui, dès qu'il facture une prestation à un professionnel d'un autre État membre. Il le demande à son service des impôts des entreprises. Cela ne le rend pas assujetti en France : il continue de facturer ses clients français sans TVA, avec la mention de l'article 293 B.",
  },
  {
    q: "Qu'est-ce que la DES et qui doit la déposer ?",
    a: "La Déclaration européenne de services récapitule les prestations facturées à des professionnels d'autres États membres. Elle est mensuelle, se dépose en ligne sur le portail pro.douane, et doit être transmise au plus tard le 10e jour ouvrable du mois suivant. Elle s'impose même en franchise en base de TVA, mais ne concerne jamais les clients hors UE ni les particuliers.",
  },
  {
    q: "Comment facturer un client aux États-Unis ?",
    a: "S'il s'agit d'une entreprise, la prestation est hors du champ de la TVA française : facture hors taxe, mention « Prestation non soumise à la TVA française — article 259-1° du CGI », pas de DES. Conservez une preuve de sa qualité professionnelle, puisqu'il n'aura pas de numéro de TVA européen à vous fournir.",
  },
  {
    q: "Que se passe-t-il si le numéro de TVA du client est invalide ?",
    a: "Vous ne pouvez pas le traiter comme un assujetti. Soit vous obtenez un numéro valide avant d'émettre, soit vous facturez selon le régime des particuliers. Facturer hors taxe sur un numéro invalide vous expose à devoir la TVA vous-même, sur une facture déjà encaissée.",
  },
  {
    q: "Le chiffre d'affaires facturé à l'étranger compte-t-il dans mes plafonds ?",
    a: "Oui, intégralement : dans le chiffre d'affaires déclaré à l'URSSAF, dans le plafond du régime micro, et dans le seuil de franchise en base de TVA. L'absence de TVA sur la facture ne change rien à l'assiette des cotisations.",
  },
  {
    q: "La facture électronique obligatoire s'applique-t-elle à mes clients étrangers ?",
    a: "Non. L'obligation d'émettre des factures électroniques ne vise que les opérations entre entreprises établies en France. Les factures à l'étranger restent émises par le canal habituel, mais leurs données entrent dans le périmètre de l'e-reporting, selon le même calendrier que l'émission.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Légifrance — article 259 du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000021658073",
    precision: "lieu d'imposition des prestations de services",
  },
  {
    libelle: "Légifrance — article 259 B du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006304599",
    precision: "services immatériels rendus à un non-assujetti hors UE",
  },
  {
    libelle: "Bpifrance Création — importer et exporter en micro-entreprise",
    url: "https://bpifrance-creation.fr/encyclopedie/micro-entreprise-regime-auto-entrepreneur/divers/comment-importer-ou-exporter-quand-on",
    precision: "numéro de TVA intracommunautaire et DES au 10e jour ouvrable du mois suivant",
  },
  {
    libelle: "Commission européenne — vérification des numéros de TVA (VIES)",
    url: "https://ec.europa.eu/taxation_customs/vies/",
    precision: "contrôle de validité du numéro du client",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="La mention à porter ne dépend pas du pays du client, mais de deux questions dans cet ordre : professionnel ou particulier, puis UE ou hors UE. Quatre combinaisons, quatre traitements — et une obligation que presque personne n&rsquo;anticipe en micro-entreprise."
      enBref={[
        "<strong>Pro dans l&rsquo;UE</strong> : hors taxe, mention d&rsquo;autoliquidation, et <strong>DES mensuelle</strong> avant le 10<sup>e</sup> jour ouvrable.",
        "Un micro-entrepreneur <strong>en franchise</strong> doit quand même obtenir un numéro de TVA intracommunautaire pour ces factures.",
        "<strong>Pro hors UE</strong> : hors champ de la TVA française, pas de DES.",
        "<strong>Particulier dans l&rsquo;UE</strong> : régime français habituel — sauf services électroniques au-delà de 10 000 €/an.",
        "Vérifiez toujours le numéro de TVA sur <strong>VIES</strong> : sans ça, la TVA non facturée peut vous être réclamée.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "La bonne mention, sans la chercher",
        texte:
          "Deviso déduit le traitement TVA du statut de votre client et porte la mention exacte sur la facture — autoliquidation, hors champ, franchise — sans que vous ayez à trancher à chaque fois.",
      }}
    />
  );
}
