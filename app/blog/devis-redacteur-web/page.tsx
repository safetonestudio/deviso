import { BlogPost } from "@/components/blog/BlogPost";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "devis-redacteur-web";

export const metadata = metadonneesArticle(SLUG);

export default function Page() {
  return (
    <BlogPost
      slug={SLUG}
      intro="Les rédacteurs web, indépendants ou en agence, jonglent souvent avec de nombreux petits clients, des délais serrés et des demandes de révisions sans fin. Un bon devis de rédacteur web pose les règles dès le départ et évite les dérapages. Voici tout ce qu'il doit contenir, tarifs et exemple compris."
      mandatoryTitle="Les mentions clés d'un devis de rédaction web"
      mandatoryIntro="Un devis de rédaction doit être précis sur le volume, le périmètre et les conditions, pour éviter les révisions infinies et les clients qui changent d'avis après livraison :"
      mandatoryItems={[
        {
          title: "Type de contenu et volume",
          desc: "Articles de blog (avec nombre de mots cible), pages web, fiches produits, séquences email, livres blancs. Précisez le volume exact : '4 articles de 1 000-1 200 mots chacun'.",
        },
        {
          title: "Niveau de recherche inclus",
          desc: "Rédaction sur brief fourni par le client, ou recherche de sources et d'études de cas incluse ? Le temps de recherche peut doubler la durée d'un article. Précisez ce qui est inclus.",
        },
        {
          title: "Optimisation SEO",
          desc: "Si vous intégrez l'optimisation SEO on-page (balises, maillage, méta-descriptions), indiquez-le explicitement dans le devis et éventuellement l'outil utilisé (Semrush, Ahrefs, Surfer SEO).",
        },
        {
          title: "Nombre de révisions incluses",
          desc: "C'est le point le plus souvent omis et le plus source de litiges. Précisez : '2 cycles de révisions inclus par contenu. Au-delà : X €/h'. Définissez aussi ce qu'est une révision (reformulation légère vs refonte complète).",
        },
        {
          title: "Cession de droits",
          desc: "En France, vous êtes auteur du contenu que vous rédigez. Sans clause de cession, votre client ne peut légalement pas publier votre texte en son nom. Mentionnez chaque droit cédé (reproduction, représentation, adaptation), avec son étendue, sa destination, son lieu et sa durée (art. L131-3 du Code de la propriété intellectuelle), et prévoyez que la cession prend effet après paiement. Votre droit moral (nom, intégrité de l'œuvre) reste inaliénable.",
        },
        {
          title: "Délai de livraison",
          desc: "Date de livraison ou délai à compter de la réception du brief client. Précisez aussi la procédure si le brief arrive en retard.",
        },
        {
          title: "Brief et conditions de démarrage",
          desc: "Indiquez ce dont vous avez besoin pour démarrer : brief complet, accès aux ressources, persona cible, ton éditorial. Sans brief, pas de rédaction, et le délai ne commence pas à courir.",
        },
      ]}
      exampleClient="Agence de recrutement tech, Bordeaux"
      exampleLines={[
        { desc: "Brief éditorial et arborescence du site (8 pages)", qty: "1 forfait", price: "250 €" },
        { desc: "Rédaction pages corporate (accueil, services, équipe)", qty: "3 pages", price: "750 €" },
        { desc: "Rédaction articles de blog SEO (1 000-1 200 mots/article)", qty: "4 articles", price: "800 €" },
        { desc: "Page contact + mentions légales (template)", qty: "1 forfait", price: "150 €" },
        { desc: "Optimisation SEO on-page (balises, méta, maillage interne)", qty: "1 forfait", price: "200 €" },
      ]}
      exampleTotal="2 150 € HT"
      exampleNote="2 cycles de révisions inclus par livrable. Brief client requis avant démarrage. Livraison sous 15 jours ouvrés après réception du brief. Cession après paiement des droits de reproduction et de représentation du texte (web, print), France, 5 ans."
      mistakes={[
        {
          title: "Pas de limite sur les révisions",
          desc: "\"Révisions jusqu'à satisfaction\" est la phrase qui peut vous piéger. Certains clients demandent 8 versions différentes en changeant complètement d'avis à chaque fois. Limitez toujours : '2 cycles de révisions inclus, révisions supplémentaires facturées X €/h'.",
        },
        {
          title: "Brief client flou non documenté",
          desc: "Si votre client vous donne des instructions vagues par téléphone, mettez-les par écrit dans un email avant de démarrer. Ce brief de démarrage sera votre référence en cas de désaccord sur le contenu livré.",
        },
        {
          title: "Oublier la cession de droits",
          desc: "En droit français, vous êtes auteur des textes que vous rédigez. Sans clause explicite de cession, la légalité de la publication est questionnable. C'est une erreur souvent ignorée des deux côtés, mais elle peut créer des complications lors d'un audit ou d'une revente d'entreprise.",
        },
        {
          title: "Ne pas préciser si la recherche de sources est incluse",
          desc: "Rédiger un article de fond sur un sujet technique que vous ne connaissez pas peut demander 2 à 3 heures de recherche avant d'écrire une ligne. Si ce temps n'est pas inclus dans votre tarif, vous travaillez à perte.",
        },
      ]}
      faq={[
        {
          q: "Vaut-il mieux facturer au mot, à la page ou au forfait en rédaction web ?",
          a: "Le tarif au mot est transparent mais peut inciter au padding (remplissage). La page (500 mots) est plus lisible pour le client. Le forfait par article est une pratique répandue : il inclut brief, recherche, rédaction et optimisation SEO dans un prix global. Le prix par article dépend du niveau de recherche requis, de la longueur et de votre positionnement : l'exemple de devis ci-dessus n'est qu'une illustration, à adapter à vos coûts.",
        },
        {
          q: "Comment gérer un client qui demande des révisions à n'en plus finir ?",
          a: "La limite de révisions dans le devis est votre seule protection. Quand un client dépasse le quota, envoyez un email récapitulatif : 'Les 2 cycles de révisions inclus dans le devis ont été utilisés. Les modifications suivantes seront facturées à X €/h selon nos conditions'. Cette formalisation évite les conflits.",
        },
        {
          q: "Peut-on publier un article sous son propre nom même si on l'a écrit pour un client ?",
          a: "Non, si vous avez cédé les droits dans votre devis. Le ghostwriting repose sur une cession large des droits d'exploitation au client, que le contrat doit délimiter droit par droit. Le droit moral du rédacteur (nom, intégrité de l'œuvre) est inaliénable : l'engagement de ne pas être cité doit être prévu expressément. Si vous souhaitez conserver un droit de portfolio (mentionner que vous êtes l'auteur dans votre book), précisez-le explicitement dans les conditions du devis.",
        },
        {
          q: "Faut-il demander un acompte pour une mission de rédaction ?",
          a: "Pour les missions ponctuelles (1-2 articles), un acompte est facultatif mais recommandé pour les nouveaux clients. Pour les missions récurrentes (package mensuel), facturez en début de mois. Pour les gros projets (site complet, livre blanc), demandez un acompte à la commande (souvent entre 30 et 50 %, à titre indicatif).",
        },
      ]}
    />
  );
}
