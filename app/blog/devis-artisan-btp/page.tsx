import { BlogPost } from "@/components/blog/BlogPost";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "devis-artisan-btp";

export const metadata = metadonneesArticle(SLUG);

export default function Page() {
  return (
    <BlogPost
      slug={SLUG}
      intro="Un devis de travaux mal rédigé, c'est un redressement fiscal possible (mauvais taux de TVA), une mise en cause juridique (garantie décennale absente) ou un litige client (périmètre flou). Voici comment rédiger un devis artisan BTP conforme, qui protège votre entreprise, artisan indépendant ou société et accélère vos paiements."
      mandatoryTitle="Les mentions obligatoires d'un devis artisan BTP"
      mandatoryIntro="Au-delà des mentions légales classiques, un devis de travaux a des exigences spécifiques imposées par la réglementation BTP :"
      mandatoryItems={[
        {
          title: "Vos coordonnées et numéro SIRET",
          desc: "Raison sociale ou nom, adresse, numéro SIRET, et si applicable numéro de TVA intracommunautaire. Pour les micro-entrepreneurs en franchise, mentionnez 'TVA non applicable, art. 293 B du CGI'. À partir du 1er janvier 2027, les règles de TVA citées ici quittent le Code général des impôts pour le livre II du Code des impositions sur les biens et services (CIBS) : les numéros d'articles changeront.",
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
          desc: "5,5 % pour la rénovation énergétique éligible (isolation, pompe à chaleur). 10 % pour les travaux de rénovation courants sur logements de plus de 2 ans. 20 % pour la construction neuve ou les logements de moins de 2 ans. Une erreur de taux est un risque fiscal direct.",
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
          desc: "30 à 40 % à la commande pour couvrir l'achat des matériaux. Solde à la réception des travaux. Pénalités de retard obligatoires entre professionnels. Précisez s'il s'agit d'un acompte ou d'arrhes : sans précision, les sommes versées d'avance sont des arrhes.",
        },
      ]}
      exampleClient="M. Durand, Particulier, Paris 11e (appartement résidence principale, construit en 1985)"
      exampleLines={[
        { desc: "Dépose et évacuation ancienne installation (baignoire, carrelage, équipements)", qty: "1 forfait", price: "350 €" },
        { desc: "Fourniture et pose douche italienne 120×90 + receveur extra-plat", qty: "1 unité", price: "1 200 €" },
        { desc: "Carrelage mural et sol, fourniture + pose (15 m²)", qty: "15 m²", price: "1 800 €" },
        { desc: "Robinetterie thermostatique + accessoires, fourniture + pose", qty: "1 forfait", price: "650 €" },
        { desc: "Main d'œuvre plomberie, étanchéité, finitions", qty: "3 jours", price: "900 €" },
      ]}
      exampleTotal="4 900 € HT"
      exampleNote="TVA 10 % applicable (travaux de rénovation, logement de plus de 2 ans, résidence principale). Acompte 35 % à la commande (1 715 €), solde à la réception. Garantie décennale : Allianz, police n°XX-XXX-XXXX, France entière."
      mistakes={[
        {
          title: "Appliquer le mauvais taux de TVA",
          desc: "C'est l'erreur la plus courante et la plus coûteuse. Appliquer 20 % sur des travaux éligibles au taux réduit de 10 % ou 5,5 % fait perdre des marchés. À l'inverse, appliquer 10 % sur une construction neuve expose à un redressement fiscal. En cas de doute, consultez le site impots.gouv.fr ou un expert-comptable.",
        },
        {
          title: "Omettre la garantie décennale",
          desc: "L'assurance est obligatoire depuis la loi Spinetta de 1978, et ses références doivent figurer sur vos devis et vos factures. En cas de sinistre, vous seriez personnellement responsable sans couverture. Certains clients refuseront de signer un devis sans cette mention, et ils ont raison.",
        },
        {
          title: "Devis trop vague sur les matériaux",
          desc: "\"Carrelage fourni et posé\" sans préciser la marque, la référence, le prix au m² et la surface exacte laisse la porte ouverte à des incompréhensions. Le client choisit du carrelage à 80 €/m², vous aviez chiffré à 30 €/m².",
        },
        {
          title: "Ne pas mentionner les imprévus de chantier",
          desc: "Murs porteurs découverts, canalisations pourries, amiante, les chantiers réservent des surprises. Ajoutez une clause : 'En cas de découverte d'imprévus techniques modifiant substantiellement le périmètre, un avenant tarifé sera établi avant poursuite des travaux'.",
        },
      ]}
      faq={[
        {
          q: "Quel taux de TVA appliquer sur un devis de travaux ?",
          a: "5,5 % pour les travaux de rénovation énergétique éligibles (isolation thermique, pompe à chaleur et autres équipements de la liste officielle) dans un logement achevé depuis plus de 2 ans. 10 % pour la plupart des travaux de rénovation, d'amélioration et d'entretien sur logements de plus de 2 ans. 20 % pour les constructions neuves et les travaux sur logements de moins de 2 ans. Depuis le 16 février 2025, les attestations 1300-SD et 1301-SD n'existent plus : c'est votre client qui certifie, sur le devis ou la facture, que les conditions du taux réduit sont remplies.",
        },
        {
          q: "La garantie décennale est-elle obligatoire sur un devis artisan ?",
          a: "Oui. L'assurance décennale est obligatoire depuis la loi Spinetta de 1978, et tout artisan ou entrepreneur qui y est soumis doit en mentionner les références sur ses devis et ses factures (article 22-2 de la loi du 5 juillet 1996) : nom de l'assureur, numéro de police, et étendue géographique de la couverture. Sans cette mention, vous engagez votre responsabilité personnelle en cas de sinistre.",
        },
        {
          q: "Peut-on demander plus de 30 % d'acompte à un particulier ?",
          a: "Aucun plafond général ne s'applique aux acomptes d'un devis de travaux, mais des règles particulières existent selon le contrat (par exemple le contrat de construction de maison individuelle, ou l'interdiction de tout paiement pendant le délai de rétractation de 7 jours après une signature au domicile du client). Précisez toujours s'il s'agit d'un acompte ou d'arrhes : sans précision, ce sont des arrhes, que le client peut abandonner pour se dédire.",
        },
        {
          q: "Doit-on obligatoirement remettre un devis écrit pour des petits travaux ?",
          a: "Pour les travaux et dépannages du bâtiment chez un particulier (maçonnerie, plomberie, électricité, couverture, peinture, etc.), la réglementation impose un devis préalable, sans seuil de montant. Le devis peut être gratuit ou payant, mais il doit le préciser (et indiquer son coût s'il est payant) et mentionner la durée de validité de l'offre. En pratique, remettez toujours un devis signé, même pour de petits montants, pour vous protéger en cas de litige.",
        },
      ]}
    />
  );
}
