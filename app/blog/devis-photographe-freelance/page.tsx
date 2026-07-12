import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis photographe freelance : droits d'auteur, acompte, exemple | Deviso",
  description:
    "Comment rédiger un devis de photographe freelance : droits d'utilisation, retouches, frais de déplacement, acompte. Exemple concret et erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-photographe-freelance" },
  openGraph: {
    title: "Devis photographe freelance : droits d'auteur, acompte, exemple",
    description: "Droits d'utilisation, retouches, frais de déplacement, acompte, tout ce qu'un devis photo doit contenir. Exemple concret.",
    url: "https://getdeviso.fr/blog/devis-photographe-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis photographe freelance : droits d'auteur, acompte, exemple",
    description: "Droits d'utilisation, retouches, frais de déplacement, acompte, guide complet pour votre devis photo.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis de photographe freelance : droits d'auteur, acompte et exemple concret",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-photographe-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment calculer les droits d'auteur sur un devis photo ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les droits d'auteur sont calculés selon le support (web, print, publicité), la zone géographique (France, Europe, monde), la durée d'utilisation et la diffusion (tirage, impressions, clics). En pratique, les droits représentent 20 à 50% du prix de la prise de vue pour une utilisation commerciale.",
        },
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPost
        h1="Devis de photographe freelance : droits d'auteur, acompte et exemple concret"
        datePublished="2026-06-29"
        readingTime={5}
        profession="photographe freelance"
        professionPlural="photographes freelances"
        landingHref="/freelance-photographe"
        landingLabel="logiciel de devis pour photographes"
        intro="Un devis photo sans clause sur les droits d'utilisation, c'est une source de litige quasi garantie. Et oublier les frais de déplacement, c'est travailler à perte. Voici comment rédiger un devis de photographe freelance complet, qui protège vos droits et accélère vos paiements."
        mandatoryTitle="Les mentions indispensables d'un devis photo"
        mandatoryIntro="La photographie cumule deux enjeux spécifiques : les droits d'auteur (propriété intellectuelle) et les frais variables (déplacement, matériel). Voici ce que votre devis doit absolument mentionner :"
        mandatoryItems={[
          {
            title: "Description précise de la prestation",
            desc: "Lieu du shooting, durée (demi-journée, journée), sujet (portrait, produit, événement, reportage corporate), nombre de photos livrées après sélection.",
          },
          {
            title: "Post-production et retouches",
            desc: "Nombre de photos retouchées incluses dans le forfait, niveau de retouche (colorimétrie et exposition, ou retouche avancée), délai de livraison après shooting.",
          },
          {
            title: "Droits d'utilisation (à ne jamais oublier)",
            desc: "Précisez : support (web, print, publicité, réseaux sociaux), zone géographique (France, Europe, monde), durée (1 an, 2 ans, illimitée). Sans clause, vous conservez tous les droits, mais votre client l'ignore.",
          },
          {
            title: "Format de livraison",
            desc: "Galerie privée en ligne, clé USB, fichiers HD par WeTransfer, formats JPEG, TIFF ou RAW. Précisez aussi si vous livrez les fichiers bruts (RAW) et sous quelles conditions.",
          },
          {
            title: "Frais de déplacement",
            desc: "Kilométrage, péage, stationnement, transport en commun. Indiquez si ces frais sont inclus dans le forfait ou refacturés au réel avec justificatifs.",
          },
          {
            title: "Acompte à la commande",
            desc: "30 à 50% à la commande est standard pour un shooting. L'acompte bloque la date dans votre agenda et vous protège en cas d'annulation de dernière minute.",
          },
          {
            title: "Conditions d'annulation",
            desc: "Si le client annule 48h avant le shooting, vous avez peut-être refusé d'autres missions. Précisez : acompte non remboursable si annulation à moins de X jours, report possible sous conditions.",
          },
        ]}
        exampleClient="PME industrielle, Nantes (120 personnes)"
        exampleLines={[
          { desc: "Shooting corporate demi-journée (portrait équipe + locaux)", qty: "1 forfait", price: "800 €" },
          { desc: "Post-production et retouches (60 photos sélectionnées)", qty: "1 forfait", price: "600 €" },
          { desc: "Droits d'utilisation web + print (2 ans, France)", qty: "1 forfait", price: "400 €" },
          { desc: "Frais de déplacement Nantes A/R (voiture)", qty: "1 forfait", price: "120 €" },
          { desc: "Livraison galerie privée en ligne + fichiers HD", qty: "1 forfait", price: "80 €" },
        ]}
        exampleTotal="2 000 € HT"
        exampleNote="Acompte 40% à la commande (800 €), solde à la livraison des fichiers. Annulation à moins de 48h : acompte non remboursable. Livraison sous 10 jours ouvrés après le shooting."
        mistakes={[
          {
            title: "Ne pas préciser les droits d'utilisation",
            desc: "Vous livrez les photos, le client les utilise sur son site, son catalogue print, ses publicités Facebook, ses panneaux d'affichage. Sans clause, c'est légalement problématique, mais vous aurez toutes les difficultés à faire valoir vos droits. Soyez précis : support, durée, zone.",
          },
          {
            title: "Oublier les frais de déplacement",
            desc: "Un shooting à 200 km de chez vous avec 4h de route aller-retour, c'est une journée entière. Sans mention des frais dans le devis, certains clients refuseront de les rembourser après coup.",
          },
          {
            title: "Pas de conditions d'annulation",
            desc: "Un client qui annule 24h avant le shooting vous coûte une journée de travail perdue. L'acompte non remboursable en cas d'annulation tardive est votre seule protection, il doit être mentionné explicitement dans le devis.",
          },
          {
            title: "Ne pas limiter le nombre de photos retouchées",
            desc: "Retoucher 60 photos ou 200 photos, ce n'est pas le même temps. Précisez toujours : nombre de photos sélectionnées par le client, niveau de retouche inclus (basique ou avancé), et tarif pour les photos supplémentaires.",
          },
        ]}
        faq={[
          {
            q: "Comment calculer les droits d'auteur sur un devis photo ?",
            a: "Les droits d'auteur sont calculés selon le support (web, print, publicité), la zone géographique (France, Europe, monde), la durée d'utilisation et la diffusion estimée (tirage, impressions). En pratique, les droits représentent 20 à 50% du prix de la prise de vue pour une utilisation commerciale. Pour une utilisation web simple, comptez 15 à 25%. Pour de la publicité nationale, montez à 50-100% du forfait shooting.",
          },
          {
            q: "Faut-il demander un acompte pour un shooting photo ?",
            a: "Oui, absolument. Un acompte de 30 à 50% à la commande bloque la date dans votre agenda et vous protège en cas d'annulation de dernière minute. Sans acompte, vous risquez de refuser d'autres missions pour un client qui annule la veille. L'acompte est non remboursable en cas d'annulation à moins de 48 ou 72h.",
          },
          {
            q: "Doit-on livrer les fichiers RAW au client ?",
            a: "Non, vous n'y êtes pas obligé. Les fichiers RAW sont vos fichiers de travail, comme un sculpteur ne doit pas livrer ses esquisses. Précisez dans le devis les formats livrés : JPEG HD, TIFF. Si le client souhaite les RAW, c'est une prestation supplémentaire que vous pouvez facturer.",
          },
          {
            q: "Comment gérer un devis photo pour un mariage ?",
            a: "Le mariage est une prestation spécifique avec des risques élevés (événement unique). Votre devis doit absolument mentionner : équipement de backup prévu, nombre de photos livrées minimum, délai de livraison du dossier complet (4 à 12 semaines est la norme), droits d'utilisation personnels uniquement, et acompte conséquent (40 à 50%).",
          },
        ]}
      />
    </>
  );
}
