import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis artisan BTP : TVA réduite, garantie décennale, exemple | Deviso",
  description:
    "Comment rédiger un devis d'artisan BTP : taux de TVA selon les travaux, mention garantie décennale obligatoire, acompte. Exemple concret et erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-artisan-btp" },
  openGraph: {
    title: "Devis artisan BTP : TVA réduite, garantie décennale, exemple",
    description: "TVA 5,5% / 10% / 20%, garantie décennale obligatoire, acompte, tout ce qu'un devis artisan BTP doit contenir.",
    url: "https://getdeviso.fr/blog/devis-artisan-btp",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis artisan BTP : TVA réduite, garantie décennale, exemple",
    description: "TVA 5,5% / 10% / 20%, garantie décennale, acompte, guide complet pour votre devis artisan BTP.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis artisan BTP : TVA réduite, garantie décennale et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-artisan-btp" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quel taux de TVA appliquer sur un devis de travaux ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "5,5% pour les travaux de rénovation énergétique (isolation, chaudière, pompe à chaleur) sur résidence principale de plus de 2 ans. 10% pour la plupart des travaux de rénovation et d'entretien sur logements de plus de 2 ans. 20% pour les constructions neuves et les travaux sur logements de moins de 2 ans.",
        },
      },
      {
        "@type": "Question",
        name: "La garantie décennale est-elle obligatoire sur un devis artisan ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. Depuis la loi Spinetta de 1978, tout constructeur (artisan, entrepreneur BTP) doit obligatoirement mentionner son assurance décennale sur les devis et contrats : nom de l'assureur, numéro de police, et étendue géographique de la couverture.",
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
        h1="Devis artisan BTP : TVA réduite, garantie décennale et erreurs à éviter"
        datePublished="2026-06-29"
        readingTime={7}
        profession="artisan BTP"
        professionPlural="artisans BTP"
        landingHref="/freelance-artisan"
        landingLabel="logiciel de devis pour artisans"
        intro="Un devis de travaux mal rédigé, c'est un redressement fiscal possible (mauvais taux de TVA), une mise en cause juridique (garantie décennale absente) ou un litige client (périmètre flou). Voici comment rédiger un devis artisan BTP conforme, qui vous protège et accélère vos paiements."
        mandatoryTitle="Les mentions obligatoires d'un devis artisan BTP"
        mandatoryIntro="Au-delà des mentions légales classiques, un devis de travaux a des exigences spécifiques imposées par la réglementation BTP :"
        mandatoryItems={[
          {
            title: "Vos coordonnées et numéro SIRET",
            desc: "Raison sociale ou nom, adresse, numéro SIRET, et si applicable numéro de TVA intracommunautaire. Pour les auto-entrepreneurs en franchise, mentionnez 'TVA non applicable, art. 293 B du CGI'.",
          },
          {
            title: "Qualifications professionnelles",
            desc: "Si vous êtes certifié RGE (Reconnu Garant de l'Environnement), mentionnez-le, c'est indispensable pour que votre client bénéficie des aides MaPrimeRénov'. Ajoutez aussi vos qualifications Qualibat ou Qualifelec si applicables.",
          },
          {
            title: "Description précise des travaux",
            desc: "Nature des travaux, surfaces concernées, matériaux utilisés (références, marques, qualité). Plus votre description est précise, moins il y a de risque de litige sur 'ce qui était prévu'. Séparez la fourniture de matériaux et la main d'œuvre.",
          },
          {
            title: "Taux de TVA applicable selon le type de travaux",
            desc: "5,5% pour la rénovation énergétique éligible (isolation, chaudière, pompe à chaleur). 10% pour les travaux de rénovation courants sur logements de plus de 2 ans. 20% pour la construction neuve ou les logements de moins de 2 ans. Une erreur de taux est un risque fiscal direct.",
          },
          {
            title: "Assurance garantie décennale (obligatoire)",
            desc: "Nom de l'assureur, numéro de police d'assurance, et couverture géographique. La garantie décennale couvre les dommages compromettant la solidité de l'ouvrage pendant 10 ans après réception. Son absence dans le devis est illégale.",
          },
          {
            title: "Délai d'exécution et planning prévisionnel",
            desc: "Date de démarrage prévue, durée estimée du chantier, jalons si projet long. En cas de retard non imputable à vous (intempéries, client absent), une clause de prorogation vous protège.",
          },
          {
            title: "Acompte et modalités de paiement",
            desc: "30 à 40% à la commande pour couvrir l'achat des matériaux. Solde à la réception des travaux. Pénalités de retard obligatoires entre professionnels. Notez que les acomptes supérieurs à 5% sont réglementés pour les particuliers (loi anti-arnaque).",
          },
        ]}
        exampleClient="M. Durand, Particulier, Paris 11e (appartement résidence principale, construit en 1985)"
        exampleLines={[
          { desc: "Dépose et évacuation ancienne installation (baignoire, carrelage, équipements)", qty: "1 forfait", price: "350 €" },
          { desc: "Fourniture et pose douche italienne 120×90 + receveur extra-plat", qty: "1 unité", price: "1 200 €" },
          { desc: "Carrelage mural et sol, fourniture + pose (15 m²)", qty: "15 m²", price: "1 800 €" },
          { desc: "Robinetterie thermostatique + accessoires, fourniture + pose", qty: "1 forfait", price: "650 €" },
          { desc: "Main d'œuvre plomberie, étanchéité, finitions", qty: "3 jours", price: "900 €" },
        ]}
        exampleTotal="4 900 € HT"
        exampleNote="TVA 10% applicable (travaux de rénovation, logement de plus de 2 ans, résidence principale). Acompte 35% à la commande (1 715 €), solde à la réception. Garantie décennale : Allianz, police n°XX-XXX-XXXX, France entière."
        mistakes={[
          {
            title: "Appliquer le mauvais taux de TVA",
            desc: "C'est l'erreur la plus courante et la plus coûteuse. Appliquer 20% sur des travaux éligibles au taux réduit de 10% ou 5,5% fait perdre des marchés. À l'inverse, appliquer 10% sur une construction neuve expose à un redressement fiscal. En cas de doute, consultez le site impots.gouv.fr ou un expert-comptable.",
          },
          {
            title: "Omettre la garantie décennale",
            desc: "Son absence dans le devis est illégale depuis 1978. En cas de sinistre, vous seriez personnellement responsable sans couverture. Certains clients refuseront de signer un devis sans cette mention, et ils ont raison.",
          },
          {
            title: "Devis trop vague sur les matériaux",
            desc: "\"Carrelage fourni et posé\" sans préciser la marque, la référence, le prix au m² et la surface exacte laisse la porte ouverte à des incompréhensions. Le client choisit du carrelage à 80 €/m², vous aviez chiffré à 30 €/m².",
          },
          {
            title: "Ne pas mentionner les imprévus de chantier",
            desc: "Murs porteurs découverts, canalisations pourries, amiante, les chantiers réservent des surprises. Ajoutez une clause : 'En cas de découverte d'imprévus techniques modifiant substantiellement le périmètre, un avenant tarifé sera établi avant poursuite des travaux'.",
          },
        ]}
        faq={[
          {
            q: "Quel taux de TVA appliquer sur un devis de travaux ?",
            a: "5,5% pour les travaux de rénovation énergétique éligibles (isolation thermique, installation de chaudière à condensation, pompe à chaleur, panneaux solaires) sur résidence principale de plus de 2 ans. 10% pour la plupart des travaux de rénovation, d'amélioration et d'entretien sur logements de plus de 2 ans. 20% pour les constructions neuves et les travaux sur logements de moins de 2 ans. En cas de doute, demandez à votre client une attestation simplifiée de TVA (formulaire Cerfa n°1301-SD).",
          },
          {
            q: "La garantie décennale est-elle obligatoire sur un devis artisan ?",
            a: "Oui, c'est une obligation légale depuis la loi Spinetta de 1978. Tout constructeur (artisan, entrepreneur BTP) doit mentionner son assurance décennale sur les devis et contrats : nom de l'assureur, numéro de police, et étendue géographique de la couverture. Sans cette mention, vous engagez votre responsabilité personnelle en cas de sinistre.",
          },
          {
            q: "Peut-on demander plus de 30% d'acompte à un particulier ?",
            a: "Pour les contrats avec les particuliers supérieurs à 500 €, la loi réglemente les acomptes. L'acompte ne peut pas dépasser 5% du prix total avant la signature du contrat (loi relative à la protection des consommateurs). Des règles spéciales s'appliquent selon le type de contrat. Entre professionnels, il n'y a pas de plafond légal.",
          },
          {
            q: "Doit-on obligatoirement remettre un devis écrit pour des petits travaux ?",
            a: "Pour les travaux de plus de 150 € TTC chez un particulier, le devis écrit préalable est obligatoire si le client le demande. Pour les travaux de plus de 1 500 € TTC, le devis préalable est systématiquement obligatoire. En pratique, mieux vaut toujours remettre un devis signé, même pour de petits montants, pour vous protéger en cas de litige.",
          },
        ]}
      />
    </>
  );
}
