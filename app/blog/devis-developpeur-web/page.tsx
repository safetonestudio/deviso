import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis développeur web freelance : guide complet 2026 | Deviso",
  description:
    "Comment rédiger un devis de développement web freelance : mentions obligatoires, TJM vs forfait, scope creep, Chorus Pro. Exemple concret inclus.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-developpeur-web" },
  openGraph: {
    title: "Devis développeur web freelance : guide complet 2026",
    description: "Mentions obligatoires, TJM vs forfait, scope creep, Chorus Pro, guide complet pour votre devis de dev web freelance.",
    url: "https://getdeviso.fr/blog/devis-developpeur-web",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis développeur web freelance : guide complet 2026",
    description: "Mentions obligatoires, TJM vs forfait, scope creep, Chorus Pro, guide complet pour votre devis de dev freelance.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis développeur web freelance : guide complet, exemple et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-developpeur-web" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Vaut-il mieux facturer en TJM ou au forfait en tant que développeur freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le TJM (Taux Journalier Moyen) est adapté aux missions longues avec périmètre évolutif. Le forfait convient aux projets bien définis avec des livrables précis. En pratique, beaucoup de développeurs utilisent le forfait pour la phase de cadrage et le TJM pour la phase de développement itérative.",
        },
      },
      {
        "@type": "Question",
        name: "Comment éviter le scope creep dans un devis de développement web ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Définissez explicitement le périmètre dans le devis : fonctionnalités incluses, technologies, livrables. Ajoutez une clause 'Toute fonctionnalité non listée fera l'objet d'un avenant tarifé'. Documentez les demandes hors périmètre dès qu'elles arrivent.",
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
        h1="Devis développeur web freelance : guide complet, exemple et erreurs à éviter"
        datePublished="2026-06-29"
        readingTime={7}
        profession="développeur web freelance"
        professionPlural="développeurs web freelances"
        landingHref="/freelance-developpeur"
        landingLabel="logiciel de devis pour développeurs"
        intro="Un devis de développement web mal rédigé peut transformer une mission rentable en enfer : périmètre flou, modifications en cascade, litige sur la propriété du code. Voici comment rédiger un devis développeur web freelance qui vous protège, avec un exemple concret et les erreurs classiques à éviter."
        mandatoryTitle="Les mentions obligatoires d'un devis de développement web"
        mandatoryIntro="Au-delà des mentions légales classiques, un devis de développeur doit couvrir des points techniques spécifiques pour éviter tout désaccord en cours de mission :"
        mandatoryItems={[
          {
            title: "Vos coordonnées et statut",
            desc: "Nom/raison sociale, SIRET, adresse, TVA intracommunautaire ou mention de franchise. En SASU ou EURL, indiquez votre capital social.",
          },
          {
            title: "Description technique précise",
            desc: "Stack technique utilisé (React, Node, PostgreSQL…), fonctionnalités développées, APIs tierces intégrées. Plus le périmètre est précis, moins il y a de risque de scope creep.",
          },
          {
            title: "Découpage en lots et jalons",
            desc: "Découpez le projet en phases : cadrage, maquettes, développement, tests, mise en production. Chaque lot a un livrable défini et un montant associé.",
          },
          {
            title: "Conditions de recette",
            desc: "Comment le client valide chaque livrable ? Délai de validation (5 à 10 jours ouvrés est standard), nombre de cycles de corrections inclus, procédure pour les bugs post-livraison.",
          },
          {
            title: "Propriété intellectuelle du code",
            desc: "Par défaut en France, vous êtes auteur du code produit. Précisez si vous cédez la propriété complète à la livraison (après paiement intégral), ou si vous conservez certains droits (librairies, composants réutilisables).",
          },
          {
            title: "Frais tiers et hébergement",
            desc: "Nom de domaine, hébergement, licences de plugins, précisez si ces coûts sont inclus dans le devis ou refacturés en sus. Évitez les mauvaises surprises.",
          },
          {
            title: "Modalités de paiement",
            desc: "Acompte à la commande (30-40%), jalons intermédiaires, solde à la livraison finale. Pour les missions DSI/publiques, indiquez si vous utilisez Chorus Pro.",
          },
        ]}
        exampleClient="Startup RH, Paris"
        exampleLines={[
          { desc: "Phase 1, Architecture et mise en place environnements (dev, staging, prod)", qty: "1 forfait", price: "1 200 €" },
          { desc: "Phase 2, Authentification et gestion des droits (JWT, rôles)", qty: "1 forfait", price: "800 €" },
          { desc: "Phase 3, Module utilisateurs (CRUD, invitation, désactivation)", qty: "1 forfait", price: "1 500 €" },
          { desc: "Phase 4, Dashboard analytics et graphiques (Recharts)", qty: "1 forfait", price: "1 000 €" },
          { desc: "Phase 5, Exports CSV et documentation API (Swagger)", qty: "1 forfait", price: "600 €" },
          { desc: "Recette, corrections et mise en production", qty: "1 forfait", price: "600 €" },
        ]}
        exampleTotal="5 700 € HT"
        exampleNote="Stack : React 19, Node.js, PostgreSQL. Hébergement (Vercel + Supabase) non inclus, estimé 30-80 €/mois selon charge. Acompte 30% à la commande, 30% à mi-projet (validation phase 3), 40% à la livraison."
        mistakes={[
          {
            title: "Périmètre fonctionnel trop vague",
            desc: "\"Développement d'un site web\" sans détail des fonctionnalités expose à des demandes illimitées. Le client entend \"tout ce dont j'ai besoin\", vous entendez \"ce qui est listé\". Détaillez chaque fonctionnalité avec son comportement attendu.",
          },
          {
            title: "Pas de clause sur les modifications en cours de dev",
            desc: "Sans clause explicite, chaque \"petite\" modification demandée en cours de développement est supposée incluse. Ajoutez : 'Toute modification du périmètre après validation des maquettes fera l'objet d'un avenant tarifé au TJM de X €'.",
          },
          {
            title: "Oublier les frais d'hébergement et de licences tierces",
            desc: "Nom de domaine, SSL, hébergement cloud, licences de plugins, ces coûts récurrents surprennent souvent les clients. Précisez dès le devis s'ils sont inclus, refacturés au coût réel, ou à la charge du client.",
          },
          {
            title: "Ne pas mentionner Chorus Pro pour le secteur public",
            desc: "Si votre client est une administration, DSI ou collectivité, le dépôt via Chorus Pro est obligatoire. Indiquez-le dans le devis et assurez-vous d'avoir les coordonnées SIRET du service destinataire.",
          },
        ]}
        faq={[
          {
            q: "Vaut-il mieux facturer en TJM ou au forfait en tant que développeur freelance ?",
            a: "Le TJM (Taux Journalier Moyen) est adapté aux missions longues avec périmètre évolutif : développement itératif, sprints agiles, maintenance. Le forfait convient aux projets bien définis avec des livrables précis : site vitrine, MVP documenté, intégration API. En pratique, beaucoup de développeurs mixent : forfait pour la phase de cadrage et TJM pour les phases de développement itératives.",
          },
          {
            q: "Comment éviter le scope creep dans un devis de développement web ?",
            a: "Définissez explicitement le périmètre : fonctionnalités incluses avec leur comportement attendu, technologies, livrables. Ajoutez une clause claire : 'Toute fonctionnalité non listée ci-dessus fera l'objet d'un avenant tarifé'. Documentez les demandes hors périmètre par écrit dès qu'elles arrivent, même par email.",
          },
          {
            q: "Qui est propriétaire du code après livraison ?",
            a: "En France, l'auteur du code est le développeur par défaut. Sans clause de cession, votre client paie pour utiliser votre création, pas pour en être propriétaire. Si vous cédez la propriété intellectuelle complète, précisez-le explicitement dans le devis, et prévoyez que la cession n'est effective qu'après paiement intégral.",
          },
          {
            q: "Comment facturer les bugs découverts après livraison ?",
            a: "Distinguez bug (non-conformité avec le devis accepté, gratuit à corriger) et évolution (nouvelle fonctionnalité, facturée). Précisez dans le devis la période de garantie (30 à 90 jours est courant) pendant laquelle les bugs sont corrigés gratuitement, et les conditions de facturation après cette période.",
          },
        ]}
      />
    </>
  );
}
