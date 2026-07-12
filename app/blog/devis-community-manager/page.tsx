import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis community manager freelance : périmètre, forfait mensuel, erreurs | Deviso",
  description:
    "Comment rédiger un devis de community manager freelance : définir le périmètre exact (plateformes, posts, visuels), forfaits mensuels, conditions de résiliation. Exemple et erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-community-manager" },
  openGraph: {
    title: "Devis community manager freelance : périmètre, forfait mensuel, erreurs",
    description: "Périmètre précis, forfaits mensuels, conditions résiliation, tout ce qu'un devis de CM freelance doit contenir.",
    url: "https://getdeviso.fr/blog/devis-community-manager",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis community manager freelance : périmètre, forfait mensuel, erreurs",
    description: "Périmètre précis, forfaits mensuels, résiliation, guide complet pour votre devis de CM freelance.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis community manager freelance : périmètre, forfait mensuel et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-community-manager" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment définir le périmètre dans un devis community manager ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Listez précisément : les plateformes incluses (Instagram, LinkedIn, Facebook, TikTok...), le nombre de posts par mois et par plateforme, si la création de visuels est incluse, si la gestion des publicités payantes est dans le périmètre, le délai de réponse aux commentaires/DM, et si le reporting mensuel est inclus.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle durée d'engagement prévoir dans un devis CM freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La plupart des community managers freelances travaillent sur des contrats de 3 mois minimum reconductibles. C'est le temps minimum pour observer des résultats mesurables sur les réseaux sociaux. Prévoyez une clause de résiliation avec préavis d'un mois pour vous protéger.",
        },
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPost
        h1="Devis community manager freelance : périmètre, forfait mensuel et erreurs à éviter"
        datePublished="2026-06-29"
        readingTime={6}
        profession="community manager freelance"
        professionPlural="community managers freelances"
        landingHref="/freelance-community-manager"
        landingLabel="logiciel de devis pour community managers"
        intro="Un devis de community management vague, c'est la garantie de travailler deux fois plus que prévu sans être payé en conséquence. Périmètre flou, livrables non définis, absence de clause de résiliation, voici comment rédiger un devis CM freelance qui vous protège et vous positionne comme un professionnel."
        mandatoryTitle="Les mentions obligatoires d'un devis community manager freelance"
        mandatoryIntro="Au-delà des mentions légales classiques, un devis de CM freelance doit détailler le périmètre de la mission avec précision :"
        mandatoryItems={[
          {
            title: "Vos coordonnées et statut juridique",
            desc: "Nom ou raison sociale, SIRET, adresse. Si vous êtes auto-entrepreneur en franchise de TVA, mentionnez 'TVA non applicable, art. 293 B du CGI'. Si vous êtes assujetti à la TVA, indiquez votre numéro de TVA intracommunautaire.",
          },
          {
            title: "Les plateformes incluses dans la mission",
            desc: "Instagram, LinkedIn, Facebook, TikTok, Pinterest, Twitter/X, chaque plateforme représente un travail différent. Listez précisément les plateformes incluses dans le forfait et précisez que toute plateforme supplémentaire fera l'objet d'un avenant tarifé.",
          },
          {
            title: "Le volume de contenu par plateforme",
            desc: "Nombre de posts par mois et par plateforme, nombre de stories, nombre de reels/vidéos courts. Soyez précis : '12 posts Instagram/mois' évite le client qui en demande 20. Si la fréquence est quotidienne, précisez les jours de publication.",
          },
          {
            title: "La création de visuels (inclus ou non ?)",
            desc: "C'est souvent la source de malentendus. Créez-vous les visuels ? Utilisez-vous les assets du client ? Faites-vous appel à un graphiste externe (et qui le paye) ? Mentionnez le nombre de visuels originaux inclus par mois et les formats livrés (carré, story, cover LinkedIn...).",
          },
          {
            title: "La gestion des publicités payantes (inclus ou non ?)",
            desc: "La gestion de campagnes Meta Ads, LinkedIn Ads ou TikTok Ads est une prestation distincte qui se facture séparément. Indiquez clairement si la publicité payante est incluse dans le forfait, et si oui, quel est le budget média géré (distinct de vos honoraires).",
          },
          {
            title: "La modération et l'engagement",
            desc: "Répondez-vous aux commentaires ? Aux DM ? Dans quel délai ? La modération quotidienne représente une charge de travail significative. Définissez le périmètre : jours ouvrés uniquement, délai de réponse garanti sous 24h, langues couvertes.",
          },
          {
            title: "Le reporting mensuel et les KPIs",
            desc: "Reporting mensuel avec quels indicateurs ? Reach, engagement rate, croissance abonnés, clics, impressions ? Format du rapport (PDF, tableau de bord, présentation visio) ? C'est une valeur ajoutée à mettre en avant, mais aussi une charge de travail à prévoir dans votre tarif.",
          },
          {
            title: "Durée de l'engagement et conditions de résiliation",
            desc: "Durée minimale du contrat (3 mois recommandés), reconduction tacite ou non, préavis de résiliation (1 mois recommandé). Sans ces clauses, un client peut vous arrêter du jour au lendemain après que vous ayez organisé toute votre planning.",
          },
        ]}
        exampleClient="PME e-commerce mode, Lyon (15 salariés, boutique en ligne + physique)"
        exampleLines={[
          { desc: "Gestion Instagram, 12 posts/mois (visuels + captions + hashtags)", qty: "1 forfait/mois", price: "500 €" },
          { desc: "Gestion LinkedIn, 8 posts/mois (articles + visuels)", qty: "1 forfait/mois", price: "350 €" },
          { desc: "Gestion Facebook, 8 posts/mois + stories hebdomadaires", qty: "1 forfait/mois", price: "250 €" },
          { desc: "Modération et engagement (DM + commentaires, du lun. au ven.)", qty: "1 forfait/mois", price: "200 €" },
          { desc: "Reporting mensuel KPIs (reach, engagement, croissance, PDF)", qty: "1 rapport/mois", price: "150 €" },
        ]}
        exampleTotal="1 450 € HT / mois"
        exampleNote="Durée minimale 3 mois, puis reconduction tacite par mois. Résiliation avec préavis d'1 mois. Visuels créés sur Canva Pro (licence client). Budget publicitaire non inclus dans ce forfait. Bilan de lancement en semaine 1 (accès comptes, brief marque)."
        mistakes={[
          {
            title: "Un périmètre vague qui fait exploser la charge de travail",
            desc: "\"Gestion des réseaux sociaux\" sans détailler le volume et les plateformes, c'est un chèque en blanc au client. Il va demander 2 posts de plus par semaine, des stories quotidiennes, des réponses le week-end, et vous n'aurez aucun argument pour refuser ou surfacturer.",
          },
          {
            title: "Ne pas distinguer votre forfait du budget publicitaire",
            desc: "Si vous gérez des campagnes payantes, votre honoraire de gestion (ex: 200€/mois) et le budget média du client (ex: 500€/mois dépensés en publicités) sont deux montants distincts. Si ce n'est pas clair dans le devis, vous pouvez vous retrouver à avancer des budgets pub pour le compte du client.",
          },
          {
            title: "Pas de durée minimale d'engagement",
            desc: "Le community management produit des résultats progressivement. Un client peut vous arrêter après 1 mois si les résultats ne sont pas immédiats, alors que le travail de fond que vous avez réalisé (calendrier, stratégie, templates) bénéficiera à son prochain CM. Protégez-vous avec un minimum de 3 mois.",
          },
          {
            title: "Oublier de mentionner les accès nécessaires",
            desc: "Pour démarrer la mission, vous avez besoin d'accès : comptes réseaux sociaux (éditeur ou admin), outils de planification, charte graphique, brand kit. Mentionnez dans le devis que le client doit vous fournir ces accès avant le démarrage, et que tout retard repousse la date de lancement.",
          },
        ]}
        faq={[
          {
            q: "Comment définir le périmètre dans un devis community manager ?",
            a: "Listez précisément : les plateformes incluses, le nombre de posts par mois et par plateforme, si la création de visuels est incluse (et combien), si la gestion des publicités payantes est dans le scope, le délai de réponse aux commentaires et DM, et si le reporting mensuel est inclus. Tout ce qui n'est pas mentionné dans le devis sera source de litige.",
          },
          {
            q: "Quelle durée d'engagement prévoir dans un devis CM freelance ?",
            a: "La plupart des CM freelances travaillent sur des contrats de 3 mois minimum, reconductibles tacitement par mois. C'est le temps minimum pour observer des résultats mesurables. Prévoyez un préavis de résiliation d'1 mois pour que ni vous ni votre client ne soient pris au dépourvu.",
          },
          {
            q: "Doit-on facturer la création de visuels séparément ?",
            a: "Vous avez le choix : inclure la création de visuels dans votre forfait mensuel (en précisant le nombre et les formats), ou facturer séparément au volume. L'important est de préciser dans le devis ce qui est inclus ou non, pour éviter tout malentendu. La création de visuels représente souvent 30 à 40% du temps de la mission.",
          },
          {
            q: "Comment facturer les publications supplémentaires en cours de mission ?",
            a: "Prévoyez dans le devis une clause 'livrables supplémentaires' avec un tarif unitaire : ex. 'Tout post supplémentaire au-delà du forfait sera facturé 50 €/post'. Cela vous permet d'accepter facilement des demandes ponctuelles sans avoir à renégocier le contrat, et le client sait à quoi s'attendre.",
          },
        ]}
      />
    </>
  );
}
