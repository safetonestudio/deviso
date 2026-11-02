import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "livre-des-recettes-micro-entrepreneur";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Qu&rsquo;est-ce que le livre des recettes, et pourquoi à l&rsquo;encaissement",
    paragraphes: [
      "Le livre des recettes est le registre où vous notez, dans l&rsquo;ordre, toutes les sommes que vous encaissez au titre de votre activité. C&rsquo;est la <strong>comptabilité ultra-simplifiée</strong> du régime micro, et elle est obligatoire quelle que soit votre activité : commerçant, prestataire, profession libérale.",
      "Le mot qui compte est <strong>encaissées</strong>. Une recette entre dans le livre le jour où l&rsquo;argent arrive, pas le jour où vous émettez la facture. Une facture envoyée en décembre et payée en février est une recette de février. C&rsquo;est exactement la logique de votre déclaration de chiffre d&rsquo;affaires à l&rsquo;URSSAF, qui porte elle aussi sur l&rsquo;encaissé, et les deux doivent coïncider.",
      "Ce n&rsquo;est donc pas un formalisme : le livre des recettes justifie, pièce par pièce, le chiffre d&rsquo;affaires que vous déclarez. En cas de contrôle, c&rsquo;est le premier document qu&rsquo;on vous demande.",
    ],
  },
  {
    type: "tableau",
    titre: "Les mentions obligatoires, pour chaque encaissement",
    intro:
      "Les recettes se notent par ordre chronologique. Voici ce que chaque ligne doit porter.",
    colonnes: ["Mention", "Ce qu&rsquo;on y porte"],
    lignes: [
      ["Date", "La date de l&rsquo;<strong>encaissement</strong>, pas celle de la facture."],
      ["Montant", "La somme réellement encaissée."],
      ["Origine", "L&rsquo;identité du client, ou de la société mandataire."],
      ["Mode de règlement", "Virement, carte, chèque, <strong>espèces</strong>, prélèvement."],
      ["Référence de la pièce", "Le n° de la facture ou de la note. Obligatoire pour les commerçants et les hébergeurs."],
    ],
    note:
      "Le total des recettes doit être fait <strong>au moins tous les trois mois</strong>. Pour les ventes au détail et les services rendus à des particuliers d&rsquo;un montant unitaire inférieur à 76 €, les écritures peuvent être regroupées en fin de journée.",
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Vente de biens ou prestations : ce n&rsquo;est pas la même obligation",
    texte:
      "Si vous <strong>vendez des biens</strong> ou fournissez de l&rsquo;hébergement, vous devez aussi tenir un <strong>registre des achats</strong> : le récapitulatif annuel de vos achats, avec le mode de paiement et la référence des pièces. Les professions libérales n&rsquo;y sont tenues que lorsqu&rsquo;elles sont en franchise de TVA. Et au-delà du registre, la distinction biens / services commande vos abattements et vos seuils : ce n&rsquo;est pas un détail de forme, c&rsquo;est ce qui décide de ce que vous payez.",
  },
  {
    type: "texte",
    titre: "Sur quel support le tenir",
    paragraphes: [
      "La loi vous laisse libre du support : un cahier, un tableur, ou un logiciel. Deux règles seulement : les écritures ne doivent pas pouvoir être <strong>modifiées une fois enregistrées</strong>, et l&rsquo;ensemble se conserve <strong>10 ans</strong> à compter de la clôture de l&rsquo;exercice, avec les pièces justificatives.",
      "Le tableur fonctionne tant que l&rsquo;activité est modeste, mais il montre vite ses limites : il faut reporter chaque paiement à la bonne date, distinguer l&rsquo;encaissement de la facturation, ne rien oublier, et ne jamais réécrire une ligne passée. C&rsquo;est précisément ce qu&rsquo;un logiciel de facturation tient tout seul, à partir des factures que vous marquez payées.",
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Ce qui est vraiment sanctionné",
    texte:
      "Fait contre-intuitif : l&rsquo;<strong>absence</strong> de livre des recettes n&rsquo;est pas sanctionnée en tant que telle. Mais ne pas en tenir vous laisse sans rien pour justifier votre chiffre d&rsquo;affaires, ce qui ouvre la voie à une reconstitution par l&rsquo;administration. Et surtout, une <strong>fausse inscription</strong> ou un usage de faux est puni de 3 ans d&rsquo;emprisonnement et de 45 000 € d&rsquo;amende. Autrement dit : un livre tenu de travers coûte bien plus cher qu&rsquo;un livre tenu simplement et honnêtement.",
  },
  {
    type: "liste",
    titre: "Les erreurs qui coûtent cher",
    items: [
      {
        titre: "Le tenir à la facturation, pas à l&rsquo;encaissement",
        texte:
          "C&rsquo;est l&rsquo;erreur la plus fréquente. Votre chiffre d&rsquo;affaires serait décalé, et le livre ne collerait plus à vos déclarations URSSAF.",
      },
      {
        titre: "Oublier le mode de règlement",
        texte:
          "C&rsquo;est une mention obligatoire. Les espèces, en particulier, doivent apparaître clairement.",
      },
      {
        titre: "Ne pas distinguer ventes de biens et prestations",
        texte:
          "Les deux n&rsquo;ont ni le même abattement ni le même seuil. Mélangées, vous ne pouvez plus remplir correctement votre déclaration.",
      },
      {
        titre: "Réécrire une ligne passée",
        texte:
          "Les écritures sont intangibles. Une correction se fait par une nouvelle écriture, jamais en modifiant l&rsquo;ancienne.",
      },
      {
        titre: "Oublier le registre des achats quand on revend",
        texte:
          "Si vous achetez pour revendre, le registre des achats est obligatoire au même titre que le livre des recettes.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Le lien avec la déclaration et la réforme",
    paragraphes: [
      "Le livre des recettes ne vit pas seul. Il alimente votre <strong>déclaration de chiffre d&rsquo;affaires</strong> à l&rsquo;URSSAF, mensuelle ou trimestrielle, dont dépendent vos cotisations. Tenu à jour, il transforme la déclaration en simple report ; négligé, il la transforme en reconstitution de dernière minute.",
      "Et depuis le 1<sup>er</sup> septembre 2026, la facturation électronique ajoute une couche : les micro-entrepreneurs assujettis à la TVA doivent pouvoir <strong>recevoir</strong> des factures électroniques, et devront en <strong>émettre</strong> à partir de septembre 2027. Un outil qui tient vos factures et votre livre des recettes au même endroit vous met en règle sur les deux fronts d&rsquo;un coup.",
    ],
  },
];

const FAQ = [
  {
    q: "Le livre des recettes est-il obligatoire en micro-entreprise ?",
    a: "Oui, pour tous les micro-entrepreneurs, quelle que soit l'activité. Il recense, par ordre chronologique, toutes les sommes encaissées, avec leur montant, leur origine et le mode de règlement.",
  },
  {
    q: "Les recettes se notent-elles à la facturation ou à l'encaissement ?",
    a: "À l'encaissement. Une recette entre dans le livre le jour où l'argent est reçu, pas le jour où la facture est émise. C'est la même base que la déclaration de chiffre d'affaires à l'URSSAF, et les deux doivent coïncider.",
  },
  {
    q: "Puis-je tenir mon livre des recettes sur un tableur ?",
    a: "Oui. Le support est libre : papier, tableur ou logiciel. Deux conditions seulement : les écritures ne doivent pas pouvoir être modifiées une fois enregistrées, et l'ensemble doit être conservé 10 ans avec les pièces justificatives.",
  },
  {
    q: "Dois-je aussi tenir un registre des achats ?",
    a: "Si vous vendez des biens ou fournissez de l'hébergement, oui. Les professions libérales n'y sont tenues que lorsqu'elles sont en franchise de TVA. Le registre des achats récapitule, par année, vos achats avec le mode de paiement et les références des pièces.",
  },
  {
    q: "Que risque-t-on si on ne tient pas de livre des recettes ?",
    a: "L'absence de livre n'est pas sanctionnée en elle-même, mais elle vous prive de toute justification de votre chiffre d'affaires en cas de contrôle. En revanche, une fausse inscription ou un usage de faux est puni de 3 ans d'emprisonnement et de 45 000 € d'amende.",
  },
  {
    q: "Combien de temps dois-je conserver mon livre des recettes ?",
    a: "10 ans à compter de la clôture de l'exercice, comme le registre des achats et les pièces justificatives.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Obligations comptables du micro-entrepreneur",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/R54994",
    precision: "mentions du livre des recettes et du registre des achats, totalisation trimestrielle, conservation 10 ans",
  },
  {
    libelle: "Code général des impôts, article 50-0",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051230005",
    precision: "régime micro-BIC et obligation de tenir un livre des recettes",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="C&rsquo;est le seul document comptable que tout micro-entrepreneur doit tenir. Simple, mais avec quelques règles précises, et un point que beaucoup ratent : il se tient <strong>à l&rsquo;encaissement</strong>, pas à la facture."
      enBref={[
        "Le livre des recettes est <strong>obligatoire</strong> pour tous les micro-entrepreneurs, tenu par ordre chronologique.",
        "Il recense ce que vous <strong>encaissez</strong>, pas ce que vous facturez : une facture payée en février compte en février.",
        "Pour chaque encaissement : montant, origine (le client), mode de règlement, et pour les commerçants la référence de la pièce.",
        "Les revendeurs et hébergeurs tiennent <strong>aussi un registre des achats</strong> ; les libéraux seulement en franchise de TVA.",
        "À conserver <strong>10 ans</strong>. Les écritures ne se modifient pas, et une fausse inscription est lourdement sanctionnée.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Votre livre des recettes, tenu tout seul",
        texte:
          "Deviso construit votre livre des recettes à partir des factures que vous marquez payées : à l&rsquo;encaissement, avec le mode de règlement et la distinction biens / services, prêt à exporter pour votre comptable.",
      }}
    />
  );
}
