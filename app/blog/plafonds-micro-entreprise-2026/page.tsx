import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "plafonds-micro-entreprise-2026";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "tableau",
    titre: "Les plafonds du régime micro, période 2026-2028",
    intro:
      "Les seuils du régime micro-fiscal sont revalorisés tous les trois ans. La période 2026-2028 a apporté une hausse d&rsquo;environ 7,6 %.",
    colonnes: ["Activité", "2023-2025", "2026-2028"],
    lignes: [
      ["Vente de marchandises et fourniture d&rsquo;hébergement", "188 700 €", "<strong>203 100 €</strong>"],
      ["Prestations de services commerciales et artisanales (BIC)", "77 700 €", "<strong>83 600 €</strong>"],
      ["Activités libérales (micro-BNC)", "77 700 €", "<strong>83 600 €</strong>"],
      ["Activité mixte", "188 700 € dont 77 700 € de services", "<strong>203 100 € dont 83 600 €</strong> de services"],
    ],
    note:
      "Ces montants s&rsquo;entendent en chiffre d&rsquo;affaires hors taxes encaissé sur l&rsquo;année civile. Ils déterminent le maintien au régime micro, pas l&rsquo;assujettissement à la TVA — et c&rsquo;est tout l&rsquo;objet de la section suivante.",
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Le piège : ce ne sont pas les seuils que vous franchirez en premier",
    texte:
      "Si vous rendez des services, votre plafond de régime micro est de <strong>83 600 €</strong> — mais votre seuil de franchise en base de TVA n&rsquo;est que de <strong>37 500 €</strong>. Ce sont deux dispositifs différents, avec des montants différents et des conséquences différentes. Dans l&rsquo;immense majorité des cas, vous deviendrez assujetti à la TVA bien avant de sortir du régime micro. Confondre les deux, c&rsquo;est se croire tranquille jusqu&rsquo;à 83 600 € et découvrir une TVA rétroactive à 37 500 €.",
  },
  {
    type: "comparaison",
    titre: "Deux séries de seuils, deux effets",
    intro:
      "C&rsquo;est la confusion numéro un des micro-entrepreneurs, et elle est entretenue par le fait que les deux séries sont souvent présentées côte à côte sans être distinguées.",
    colonnes: [
      {
        titre: "Plafonds du régime micro",
        ton: "neutre",
        sousTitre: "203 100 € · 83 600 €",
        texte:
          "Déterminent si vous <strong>restez au régime micro</strong> : abattement forfaitaire, comptabilité allégée, cotisations calculées sur le chiffre d&rsquo;affaires. Les dépasser deux années de suite vous fait basculer au régime réel. Revalorisés tous les trois ans.",
      },
      {
        titre: "Seuils de franchise en base de TVA",
        ton: "positif",
        sousTitre: "85 000 / 93 500 € · 37 500 / 41 250 €",
        texte:
          "Déterminent si vous <strong>facturez la TVA</strong>. Bien plus bas pour les services. Deux niveaux : un seuil de base apprécié sur l&rsquo;année précédente, et un seuil majoré qui, lui, fait basculer <strong>en cours d&rsquo;année</strong>. Inchangés pour 2026.",
      },
    ],
  },
  {
    type: "tableau",
    titre: "Les seuils de TVA, avec leurs deux niveaux",
    intro:
      "Le mécanisme à deux étages est ce qui rend ce dispositif contre-intuitif. Le seuil de base regarde l&rsquo;année passée, le seuil majoré regarde l&rsquo;année en cours.",
    colonnes: ["Activité", "Seuil de base (année N-1)", "Seuil majoré (en cours d&rsquo;année)"],
    lignes: [
      ["Ventes de biens", "85 000 €", "93 500 €"],
      ["Prestations de services", "37 500 €", "41 250 €"],
      ["Avocats, auteurs, artistes-interprètes", "50 000 €", "régime spécifique"],
    ],
    note:
      "Si vous dépassez le seuil de base une année, vous devenez assujetti au 1<sup>er</sup> janvier de l&rsquo;année suivante. Si vous dépassez le seuil <em>majoré</em> en cours d&rsquo;année, vous devenez assujetti <strong>dès le premier jour du mois de dépassement</strong> — et les factures de ce mois-là doivent porter la TVA.",
  },
  {
    type: "texte",
    titre: "Ce qu&rsquo;il se passe quand vous dépassez un seuil de TVA en cours d&rsquo;année",
    paragraphes: [
      "C&rsquo;est le scénario qui prend les gens au dépourvu, et il mérite d&rsquo;être décrit précisément.",
      "Imaginons que vous rendiez des services et que votre chiffre d&rsquo;affaires cumulé franchisse <strong>41 250 €</strong> le 18 octobre. Vous devenez assujetti à la TVA <strong>au 1<sup>er</sup> octobre</strong>, rétroactivement. Toutes les factures émises depuis le début du mois doivent donc porter la TVA — celles que vous avez déjà envoyées sans TVA sont à corriger par un avoir et une facture rectificative.",
      "Si vous dépassez seulement le seuil de base — entre 37 500 € et 41 250 € — vous restez en franchise jusqu&rsquo;au 31 décembre, et vous devenez assujetti au 1<sup>er</sup> janvier suivant. C&rsquo;est beaucoup plus confortable, et c&rsquo;est la raison pour laquelle la zone entre les deux seuils mérite d&rsquo;être surveillée de près plutôt que franchie par inadvertance.",
      "Dans les deux cas, il faut demander un numéro de TVA à votre service des impôts des entreprises, et vos factures changent : taux, montant de TVA, total TTC, et disparition de la mention de l&rsquo;article 293 B.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Le seuil unique à 25 000 € : c&rsquo;est abrogé, pas reporté",
    texte:
      "La loi de finances pour 2025 avait institué un seuil unique de franchise en base à 25 000 €. Il a été suspendu au printemps 2025 après la mobilisation des fédérations professionnelles, puis <strong>abrogé</strong> par la loi du 3 novembre 2025, qui a rétabli les seuils antérieurs. Beaucoup de contenus en ligne parlent encore d&rsquo;un « report » ou d&rsquo;une « suspension » : c&rsquo;est périmé. Les seuils applicables sont bien 85 000 / 93 500 € et 37 500 / 41 250 €.",
  },
  {
    type: "texte",
    titre: "Sortir du régime micro : deux années, pas une",
    paragraphes: [
      "Dépasser le plafond du régime micro une seule année ne vous en fait pas sortir. Il faut <strong>deux années civiles consécutives</strong> de dépassement pour basculer au régime réel, à compter du 1<sup>er</sup> janvier de l&rsquo;année suivante.",
      "C&rsquo;est une tolérance réelle, et elle laisse le temps de s&rsquo;organiser : changer de statut juridique si c&rsquo;est pertinent, prendre un comptable, ajuster sa tarification. Ce n&rsquo;est pas un couperet.",
      "Attention tout de même à ne pas lire cette tolérance comme une autorisation : le franchissement du seuil de TVA, lui, est immédiat. Vous pouvez donc parfaitement être assujetti à la TVA tout en restant au régime micro — c&rsquo;est même la situation de beaucoup d&rsquo;indépendants qui font entre 40 000 et 80 000 € de chiffre d&rsquo;affaires en services.",
    ],
  },
  {
    type: "liste",
    titre: "Ce qu&rsquo;il faut surveiller, et à quel rythme",
    items: [
      {
        titre: "Votre chiffre d&rsquo;affaires encaissé, cumulé depuis le 1<sup>er</sup> janvier",
        texte:
          "Encaissé, pas facturé. Une facture émise en décembre et payée en février compte sur l&rsquo;année suivante. C&rsquo;est aussi ce qui permet de piloter un franchissement de seuil de façon légitime, en décalant l&rsquo;encaissement plutôt qu&rsquo;en antidatant une facture.",
      },
      {
        titre: "La distance au seuil de TVA, pas au plafond micro",
        texte:
          "Si vous rendez des services, 37 500 € est la ligne qui compte. C&rsquo;est elle qu&rsquo;il faut afficher sur votre tableau de bord, pas 83 600 €.",
      },
      {
        titre: "Le franchissement du seuil majoré, qui est mensuel",
        texte:
          "Un dépassement de 41 250 € en cours de mois rend la TVA due depuis le premier jour de ce mois. Il faut donc suivre le cumul en continu, pas à la fin du trimestre.",
      },
      {
        titre: "Vos frais refacturés, qui gonflent le cumul",
        texte:
          "Un train refacturé à un client entre dans votre chiffre d&rsquo;affaires, et donc dans le calcul des seuils — sauf s&rsquo;il remplit les conditions du débours, qui sont strictes.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Des pages officielles encore périmées",
    texte:
      "Au moment d&rsquo;écrire cet article, certaines pages de <em>impots.gouv.fr</em> affichaient encore 188 700 € et 77 700 € en les qualifiant de seuils « 2023-2025 » — sans mentionner la revalorisation. Ce n&rsquo;est pas rassurant, mais c&rsquo;est utile à savoir : si vous tombez sur ces chiffres, vérifiez la date de mise à jour de la page. Nous indiquons nos sources et la date de la nôtre en bas de cet article, précisément pour que vous puissiez faire le même contrôle sur nous.",
  },
];

const FAQ = [
  {
    q: "Quels sont les plafonds de la micro-entreprise en 2026 ?",
    a: "203 100 € pour la vente de marchandises et la fourniture d'hébergement, 83 600 € pour les prestations de services (BIC comme BNC). Ces montants s'appliquent à la période 2026-2028, après une revalorisation d'environ 7,6 % par rapport aux seuils 2023-2025, qui étaient de 188 700 € et 77 700 €.",
  },
  {
    q: "Quelle est la différence entre le plafond micro et le seuil de TVA ?",
    a: "Ce sont deux dispositifs distincts. Le plafond micro (83 600 € en services) détermine si vous restez au régime micro-fiscal : abattement forfaitaire, comptabilité allégée. Le seuil de franchise en base de TVA (37 500 € en services) détermine si vous devez facturer la TVA. Le second est bien plus bas, donc vous deviendrez presque toujours assujetti à la TVA avant de sortir du régime micro. C'est la confusion la plus coûteuse du statut.",
  },
  {
    q: "Le seuil de TVA à 25 000 € s'applique-t-il ?",
    a: "Non. Il avait été institué par la loi de finances pour 2025, puis suspendu au printemps 2025, puis abrogé par la loi du 3 novembre 2025, qui a rétabli les seuils antérieurs. Beaucoup de contenus en ligne parlent encore d'un « report » ou d'une « suspension » : c'est périmé. Les seuils en vigueur sont 85 000 / 93 500 € pour les biens et 37 500 / 41 250 € pour les services.",
  },
  {
    q: "Que se passe-t-il si je dépasse le seuil de TVA en cours d'année ?",
    a: "Tout dépend du seuil franchi. Si vous dépassez le seuil de base (37 500 € en services) sans atteindre le seuil majoré, vous restez en franchise jusqu'au 31 décembre et devenez assujetti au 1er janvier suivant. Si vous dépassez le seuil majoré (41 250 €), vous devenez assujetti dès le premier jour du mois de dépassement, rétroactivement : les factures déjà émises ce mois-là doivent être corrigées par un avoir et une facture rectificative.",
  },
  {
    q: "Combien de temps puis-je dépasser le plafond micro avant d'en sortir ?",
    a: "Deux années civiles consécutives. Un dépassement sur une seule année ne vous fait pas sortir du régime micro : la bascule au régime réel intervient au 1er janvier suivant deux années de dépassement. C'est une tolérance réelle, qui laisse le temps de s'organiser. Attention toutefois : cette tolérance ne concerne que le régime micro, pas la TVA, dont le franchissement est immédiat.",
  },
  {
    q: "Les frais que je refacture comptent-ils dans le plafond ?",
    a: "Oui, sauf exception. Un frais refacturé à un client — un billet de train, une nuit d'hôtel, l'achat d'une licence — entre dans votre chiffre d'affaires, et donc dans le calcul des seuils comme dans l'assiette de vos cotisations. La seule échappatoire est le mécanisme du débours, dont les conditions sont strictes et souvent mal comprises.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "BOFiP — BOI-TVA-DECLA-40-10-10, version du 1er juillet 2026",
    url: "https://bofip.impots.gouv.fr/bofip/849-PGP.html/identifiant=BOI-TVA-DECLA-40-10-10-20260701",
    precision: "seuils de franchise en base de TVA : 85 000 / 93 500 € et 37 500 / 41 250 €",
  },
  {
    libelle: "BOFiP — actualité ACTU-2025-00144",
    url: "https://bofip.impots.gouv.fr/bofip/14799-PGP.html/ACTU-2025-00144",
    precision: "abrogation du seuil unique à 25 000 € par la loi du 3 novembre 2025",
  },
  {
    libelle: "Article 50-0 du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051230005",
    precision: "régime micro-BIC et mécanisme de revalorisation triennale des plafonds",
  },
  {
    libelle: "Article 102 ter du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051230089",
    precision: "régime micro-BNC",
  },
  {
    libelle: "CCI Paris Île-de-France — Revalorisation des seuils pour 2026-2028",
    url: "https://www.entreprises.cci-paris-idf.fr/actualites/micro-entrepreneur-revalorisation-des-seuils-pour-2026-2028",
    precision: "montants revalorisés de la période triennale",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Les plafonds ont bougé au 1<sup>er</sup> janvier 2026, et beaucoup de pages — y compris officielles — affichent encore les anciens. Mais le vrai problème n&rsquo;est pas là : c&rsquo;est qu&rsquo;il existe <strong>deux séries de seuils</strong>, et que la plus basse est celle qu&rsquo;on oublie."
      enBref={[
        "Plafonds du régime micro 2026-2028 : <strong>203 100 €</strong> en vente, <strong>83 600 €</strong> en services.",
        "Seuils de <strong>franchise en base de TVA</strong>, inchangés : 85 000 / 93 500 € en biens, <strong>37 500 / 41 250 €</strong> en services.",
        "Ce sont deux dispositifs distincts : en services, vous serez assujetti à la TVA <strong>bien avant</strong> de sortir du régime micro.",
        "Le seuil unique de TVA à 25 000 € a été <strong>abrogé</strong>, pas reporté.",
        "Sortir du régime micro demande <strong>deux années consécutives</strong> de dépassement. Le franchissement du seuil de TVA, lui, est immédiat.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Savoir où vous en êtes, sans tenir un tableur",
        texte:
          "Deviso suit votre chiffre d&rsquo;affaires encaissé depuis le 1<sup>er</sup> janvier et affiche la distance au seuil qui compte pour vous — pas seulement au plafond du régime micro.",
      }}
    />
  );
}
