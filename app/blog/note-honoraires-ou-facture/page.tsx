import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "note-honoraires-ou-facture";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "La réponse courte, avant le détail",
    paragraphes: [
      "La « note d&rsquo;honoraires » n&rsquo;est pas une catégorie juridique distincte de la facture. C&rsquo;est un <strong>usage de vocabulaire</strong>, propre aux professions libérales, pour désigner le document par lequel on réclame le prix d&rsquo;une prestation intellectuelle ou de soin.",
      "Juridiquement, dès que vous facturez un professionnel, les obligations de facturation s&rsquo;appliquent, que vous intituliez votre document « facture » ou « note d&rsquo;honoraires ». Les mentions obligatoires sont les mêmes, la numérotation continue est la même, la conservation est la même.",
      "Ce qui change est réel, mais se situe ailleurs : dans ce que vous avez le droit de faire figurer, dans le régime de TVA de certaines activités, et dans ce que votre client attend de vous.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Pourquoi ce flou existe",
    texte:
      "Le mot « honoraires » vient d&rsquo;une tradition où la rémunération d&rsquo;un professionnel libéral n&rsquo;était pas un prix de marché mais une reconnaissance. Il a survécu dans l&rsquo;usage — et dans les intitulés de logiciels — bien après que le droit a cessé de distinguer. Résultat : beaucoup de praticiens pensent être soumis à un régime documentaire particulier, alors que non.",
  },
  {
    type: "comparaison",
    titre: "Ce qui est identique, ce qui diffère",
    colonnes: [
      {
        titre: "Identique",
        ton: "neutre",
        sousTitre: "Tout le socle documentaire",
        texte:
          "Mentions obligatoires, numérotation unique et continue, date d&rsquo;émission, identité et SIREN, désignation de la prestation, conditions de règlement, conservation pendant dix ans. Et depuis la réforme, les mêmes obligations de facturation électronique face à un client professionnel.",
      },
      {
        titre: "Différent",
        ton: "positif",
        sousTitre: "Le régime de TVA, pour certaines activités",
        texte:
          "Les soins dispensés par les professions médicales et paramédicales réglementées sont exonérés de TVA par l&rsquo;article 261-4-1° du CGI. Ce n&rsquo;est pas la franchise en base : c&rsquo;est une exonération qui tient à la nature de l&rsquo;activité, et qui ne dépend pas du chiffre d&rsquo;affaires.",
      },
    ],
  },
  {
    type: "texte",
    titre: "L&rsquo;exonération de TVA des soins : une nuance qui compte",
    paragraphes: [
      "C&rsquo;est le point où la distinction devient concrète, et où beaucoup de praticiens se trompent de mention.",
      "Si vous êtes <strong>une profession médicale ou paramédicale réglementée</strong> — médecin, infirmier, kinésithérapeute, sage-femme, orthophoniste, pédicure-podologue, et les autres professions dont le titre est protégé — vos actes de soin sont exonérés de TVA au titre de l&rsquo;article 261-4-1° du CGI. La mention à porter est celle de l&rsquo;exonération, pas celle de la franchise en base.",
      "Si vous exercez une <strong>activité de bien-être non réglementée</strong> — sophrologie, naturopathie, réflexologie, coaching, massage de détente — vous n&rsquo;êtes pas dans ce cas. Votre activité est une prestation de services ordinaire. Tant que vous restez sous le seuil, vous êtes en franchise en base avec la mention de l&rsquo;article 293 B ; au-delà, vous facturez la TVA à 20 %.",
      "La différence n&rsquo;est pas cosmétique : l&rsquo;exonération des soins est définitive et indépendante du chiffre d&rsquo;affaires, la franchise en base tombe dès que vous dépassez le seuil. Porter la mauvaise mention, c&rsquo;est soit s&rsquo;exonérer à tort, soit se croire exonéré et découvrir une TVA rétroactive.",
    ],
  },
  {
    type: "liste",
    titre: "Ce que votre note d&rsquo;honoraires doit contenir",
    intro:
      "Rien d&rsquo;exotique : les mentions de toute facture. Ce sont les trois dernières qui distinguent la pratique libérale.",
    items: [
      {
        titre: "Votre identité complète et votre numéro SIREN",
        texte:
          "Plus, le cas échéant, votre numéro d&rsquo;inscription à l&rsquo;ordre professionnel ou votre numéro ADELI / RPPS. Ce n&rsquo;est pas une mention fiscale, mais c&rsquo;est ce que votre patient ou son assureur cherchera.",
      },
      {
        titre: "Un numéro unique, dans une série continue",
        texte:
          "Une seule série pour toute votre activité, sans trou. C&rsquo;est la même obligation que pour une facture, et c&rsquo;est l&rsquo;erreur la plus fréquente : beaucoup de praticiens numérotent par patient ou repartent à 1 chaque année sans préfixe distinctif.",
      },
      {
        titre: "La date d&rsquo;émission et la date de la prestation",
        texte: "Les deux quand elles diffèrent. Sur une série de séances, la période couverte suffit.",
      },
      {
        titre: "La désignation précise de la prestation",
        texte:
          "« Consultation », « séance de suivi », « bilan initial ». Évitez le détail clinique : un document comptable n&rsquo;a pas à porter d&rsquo;information de santé, et il peut être lu par un tiers.",
      },
      {
        titre: "La mention de TVA applicable",
        texte:
          "« Exonération de TVA, art. 261-4-1° du CGI » pour les soins d&rsquo;une profession réglementée. « TVA non applicable, art. 293 B du CGI » si vous êtes en franchise en base. Le taux et le montant si vous êtes assujetti. Jamais de ligne de TVA à 0 %.",
      },
      {
        titre: "Les conditions de règlement",
        texte:
          "Délai, moyens acceptés, et — pour un client professionnel — les pénalités de retard et l&rsquo;indemnité forfaitaire de 40 €, qui sont obligatoires en B2B.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Ne faites pas figurer d&rsquo;information de santé",
    texte:
      "Un diagnostic, un motif de consultation, un nom de pathologie n&rsquo;ont rien à faire sur un document comptable. Il peut être transmis à un comptable, à une mutuelle, à un employeur qui rembourse. Écrivez la nature de l&rsquo;acte, pas son contenu — c&rsquo;est suffisant pour justifier le prix, et c&rsquo;est la seule version respectueuse de votre patient.",
  },
  {
    type: "texte",
    titre: "Et face à la facturation électronique ?",
    paragraphes: [
      "La réforme ne distingue pas les notes d&rsquo;honoraires des factures. Ce qui compte est la <strong>nature du client</strong>, pas l&rsquo;intitulé du document.",
      "Vos patients particuliers relèvent du B2C : il n&rsquo;y a pas de facture électronique à leur transmettre, mais une obligation d&rsquo;<strong>e-reporting</strong> — la transmission des données de transaction à l&rsquo;administration — qui arrivera pour les micro-entreprises au 1<sup>er</sup> septembre 2027.",
      "En revanche, si vous facturez une entreprise, une mutuelle, un centre de formation, une collectivité — autrement dit un professionnel — vous êtes dans le B2B, avec les obligations correspondantes. Et l&rsquo;obligation de <strong>pouvoir recevoir</strong> une facture électronique via une plateforme agréée, elle, s&rsquo;applique déjà depuis le 1<sup>er</sup> septembre 2026, à toute entreprise assujettie à la TVA, sans exception de taille ni de régime.",
    ],
  },
  {
    type: "liste",
    titre: "Les trois erreurs qui reviennent le plus",
    items: [
      {
        titre: "Repartir à 1 chaque année, sans préfixe",
        texte:
          "Deux factures n° 7 dans votre historique, c&rsquo;est un doublon. Si vous voulez repartir à 1, l&rsquo;année doit faire partie du numéro : <code>2026-007</code> puis <code>2027-001</code>. Le préfixe est ce qui rend la série unique.",
      },
      {
        titre: "Tenir deux séries selon le type de client",
        texte:
          "Une numérotation pour les patients, une autre pour les entreprises. Chaque série a alors des trous, et la continuité s&rsquo;apprécie sur l&rsquo;ensemble de votre activité, pas par catégorie de client.",
      },
      {
        titre: "Créer une ligne de TVA à 0 %",
        texte:
          "Une exonération et une franchise en base ne sont pas « une TVA à zéro ». Ce sont des mentions, pas des taux. Une ligne à 0 % est une erreur visible, et un contrôle automatique de facturation électronique peut la rejeter.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Une note d'honoraires a-t-elle la même valeur qu'une facture ?",
    a: "Oui. Ce n'est pas une catégorie juridique distincte : c'est un usage de vocabulaire propre aux professions libérales. Dès que vous facturez un professionnel, les obligations de facturation s'appliquent à l'identique, quel que soit l'intitulé du document. Mentions obligatoires, numérotation continue, conservation pendant dix ans : tout est le même.",
  },
  {
    q: "Quelle mention de TVA porter sur une note d'honoraires ?",
    a: "Trois cas. Si vous exercez une profession médicale ou paramédicale réglementée, vos actes de soin sont exonérés : « Exonération de TVA, art. 261-4-1° du CGI ». Si votre activité n'est pas réglementée (sophrologie, naturopathie, coaching) et que vous êtes sous le seuil : « TVA non applicable, art. 293 B du CGI ». Si vous êtes assujetti : le taux et le montant de TVA. Dans aucun cas on ne crée une ligne de TVA à 0 % — c'est une erreur fréquente et visible.",
  },
  {
    q: "Un praticien de bien-être est-il exonéré de TVA ?",
    a: "Non, pas au titre des soins. L'exonération de l'article 261-4-1° du CGI vise les professions médicales et paramédicales réglementées, dont le titre est protégé. Un sophrologue, un naturopathe, un réflexologue ou un coach exerce une prestation de services ordinaire : il est en franchise en base tant qu'il reste sous le seuil, puis assujetti à 20 % au-delà. Confondre les deux mène soit à s'exonérer à tort, soit à découvrir une TVA rétroactive.",
  },
  {
    q: "Faut-il une numérotation particulière pour les notes d'honoraires ?",
    a: "Non, et c'est justement là que beaucoup se trompent. Il faut une seule série unique et continue pour toute votre activité, sans trou et sans doublon. Numéroter par patient, repartir à 1 chaque année sans préfixe qui distingue l'année, ou tenir deux séries selon le type de client : ces trois habitudes créent des ruptures dans la séquence, ce que la réglementation interdit.",
  },
  {
    q: "Peut-on mentionner le motif de consultation ?",
    a: "Techniquement oui, mais ne le faites pas. Une note d'honoraires est un document comptable qui peut circuler : comptable, mutuelle, employeur qui rembourse, conjoint qui règle. Écrivez la nature de l'acte — « consultation », « séance de suivi », « bilan initial » — et pas son contenu clinique. C'est suffisant pour justifier le prix, et c'est la seule version qui respecte votre patient.",
  },
  {
    q: "Les notes d'honoraires sont-elles concernées par la facturation électronique ?",
    a: "Ce qui détermine l'obligation est la nature du client, pas l'intitulé du document. Des patients particuliers relèvent du B2C : pas de facture électronique à leur transmettre, mais un e-reporting des données de transaction, qui arrive au 1er septembre 2027 pour les micro-entreprises. Une entreprise, une mutuelle ou une collectivité relèvent du B2B. Et l'obligation de pouvoir recevoir une facture électronique via une plateforme agréée s'applique, elle, depuis le 1er septembre 2026 à toute entreprise assujettie à la TVA.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Article 261-4-1° du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044983231",
    precision: "exonération de TVA des soins dispensés par les professions médicales et paramédicales réglementées",
  },
  {
    libelle: "Article 293 B du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051230147",
    precision: "franchise en base de TVA",
  },
  {
    libelle: "Article 242 nonies A du CGI, annexe II",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006294613",
    precision: "mentions obligatoires et numérotation continue",
  },
  {
    libelle: "Article L441-9 du Code de commerce",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414123",
    precision: "mentions de facturation entre professionnels, pénalités de retard et indemnité forfaitaire",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="La question revient chez tous les praticiens et toutes les professions libérales, et la réponse est plus simple qu&rsquo;on ne croit : ce n&rsquo;est pas un document différent. Mais il y a bien une distinction qui compte, et elle ne se situe pas là où on la cherche."
      enBref={[
        "La note d&rsquo;honoraires n&rsquo;est <strong>pas une catégorie juridique</strong> : c&rsquo;est un usage de vocabulaire libéral.",
        "Mentions obligatoires, numérotation continue, conservation : <strong>identiques</strong> à celles d&rsquo;une facture.",
        "Ce qui diffère vraiment : l&rsquo;<strong>exonération de TVA des soins</strong> (art. 261-4-1° du CGI), réservée aux professions réglementées.",
        "Une activité de bien-être non réglementée n&rsquo;est <strong>pas</strong> exonérée : elle relève de la franchise en base, puis de la TVA à 20 %.",
        "N&rsquo;y faites jamais figurer d&rsquo;information de santé : c&rsquo;est un document qui circule.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Des notes d&rsquo;honoraires numérotées correctement, sans y penser",
        texte:
          "Deviso tient une série unique et continue pour toute votre activité, et porte la mention de TVA qui correspond à votre situation — exonération, franchise en base ou assujettissement.",
      }}
    />
  );
}
