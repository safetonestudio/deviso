import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis consultant indépendant : propale, TJM, livrables | Deviso",
  description:
    "Comment rédiger une proposition commerciale de consultant indépendant : livrables, TJM, confidentialité, grands comptes. Exemple et erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-consultant-independant" },
  openGraph: {
    title: "Devis consultant indépendant : propale, TJM, livrables",
    description: "Livrables, TJM, confidentialité, Factur-X grands comptes, guide complet pour votre propale de consultant indépendant.",
    url: "https://getdeviso.fr/blog/devis-consultant-independant",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis consultant indépendant : propale, TJM, livrables",
    description: "Livrables, TJM, confidentialité, Factur-X grands comptes, guide complet pour votre propale de consultant.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis de consultant indépendant : rédiger une propale efficace en 2026",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-consultant-independant" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Faut-il un bon de commande en plus du devis de consultant ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pas obligatoirement. Le devis signé vaut contrat. Mais de nombreux grands comptes exigent leur propre bon de commande interne avant de payer. Acceptez-le, mais vérifiez qu'il reprend le montant et les conditions de votre devis.",
        },
      },
      {
        "@type": "Question",
        name: "Comment facturer une mission de conseil : à la régie ou au forfait ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La régie (TJM × jours) est adaptée aux missions longues ou évolutives. Le forfait convient aux livrables définis : audit, rapport, formation. Beaucoup de consultants combinent : forfait pour la phase de diagnostic et régie pour l'accompagnement.",
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
        h1="Devis de consultant indépendant : rédiger une propale efficace en 2026"
        datePublished="2026-06-29"
        readingTime={6}
        profession="consultant indépendant"
        professionPlural="consultants indépendants"
        landingHref="/freelance-consultant"
        landingLabel="logiciel de devis pour consultants"
        intro="La proposition commerciale, ou propale, est le document pivot de toute mission de conseil. Trop floue, elle génère des désaccords sur les livrables. Trop longue, elle ralentit la décision. Voici comment rédiger un devis de consultant indépendant qui convainc et vous protège juridiquement."
        mandatoryTitle="Les mentions clés d'une propale de consultant"
        mandatoryIntro="Au-delà des mentions légales obligatoires, une proposition commerciale de conseil doit couvrir ces points spécifiques :"
        mandatoryItems={[
          {
            title: "Contexte et enjeux de la mission",
            desc: "Reformulez la problématique du client en 3-5 lignes. C'est la preuve que vous avez compris son besoin, et un engagement contractuel sur ce périmètre.",
          },
          {
            title: "Livrables attendus",
            desc: "Listez précisément ce que vous livrez : rapport d'audit, roadmap, recommandations, ateliers, formations. Chaque livrable doit avoir une description et une date de remise.",
          },
          {
            title: "Jours estimés par phase",
            desc: "Décomposez la mission en phases (diagnostic, recommandations, accompagnement) avec le nombre de jours alloués à chacune. Cela permet d'identifier facilement ce qui est hors périmètre.",
          },
          {
            title: "Modalité de facturation : régie ou forfait",
            desc: "En régie, vous facturez un TJM × jours réels. Au forfait, vous facturez un montant fixe quel que soit le temps passé. Précisez clairement le mode retenu et les conditions de dépassement.",
          },
          {
            title: "Clause de confidentialité",
            desc: "Indispensable quand vous accédez aux données internes du client. Une clause NDA minimale dans le devis protège les deux parties sans avoir à rédiger un contrat séparé.",
          },
          {
            title: "Conditions d'annulation",
            desc: "Si la mission est annulée après le démarrage, quelle fraction est due ? 50% des jours planifiés ? 100% du montant de la phase en cours ? Précisez-le avant que la question se pose.",
          },
          {
            title: "Modalités de facturation",
            desc: "Acompte à la commande (20-30% est courant en conseil), facturation mensuelle ou à la fin de chaque phase, délai de paiement. Pour les grands comptes, précisez si vous utilisez la facturation Factur-X électronique.",
          },
        ]}
        exampleClient="Cabinet d'expertise comptable, Lyon (80 personnes)"
        exampleLines={[
          { desc: "Phase 1, Audit des processus et outils actuels (entretiens, cartographie)", qty: "5 j", price: "3 500 €" },
          { desc: "Phase 2, Benchmark solutions marché et analyse comparative", qty: "3 j", price: "2 100 €" },
          { desc: "Phase 3, Rapport de recommandations et présentation Comex", qty: "2 j", price: "1 400 €" },
          { desc: "Phase 4, Roadmap de transformation (plan détaillé sur 12 mois)", qty: "2 j", price: "1 400 €" },
          { desc: "Phase 5, Accompagnement au changement (suivi mensuel, 3 mois)", qty: "1 forfait", price: "2 800 €" },
        ]}
        exampleTotal="11 200 € HT"
        exampleNote="TJM : 700 €/jour. Acompte 25% à la commande. Facturation à l'issue de chaque phase. Clause de confidentialité incluse. Factur-X disponible pour paiement électronique."
        mistakes={[
          {
            title: "Mission mal définie, désaccord sur les livrables",
            desc: "\"Accompagnement stratégique\" sans livrables précis mène invariablement au désaccord. Votre client pense que vous allez tout faire, vous pensez que votre rapport de recommandations est le livrable final. Soyez concret : 'Rapport de 20-30 pages, présentation Comex de 45 minutes'.",
          },
          {
            title: "Oublier la clause de confidentialité",
            desc: "Dans une mission de conseil, vous accédez souvent à des données sensibles : CA, marge, conflits internes. Une clause NDA dans le devis vous protège mutuellement, sans avoir besoin d'un contrat séparé.",
          },
          {
            title: "Pas de conditions d'annulation ou de suspension",
            desc: "Un client peut annuler une mission après que vous ayez réservé 3 semaines dans votre agenda. Sans clause, vous n'avez aucun recours. Prévoyez : 'En cas d'annulation après démarrage, les jours réalisés sont dus, plus X% des jours restants planifiés'.",
          },
          {
            title: "Ne pas anticiper la facturation grands comptes",
            desc: "Les grandes entreprises et organismes publics exigent souvent la facturation Factur-X (électronique). Si vous ne pouvez pas émettre de facture Factur-X, certains refuseront de travailler avec vous à partir de 2026.",
          },
        ]}
        faq={[
          {
            q: "Faut-il un bon de commande en plus du devis de consultant ?",
            a: "Pas obligatoirement : le devis signé vaut contrat. Mais de nombreux grands comptes exigent leur propre bon de commande interne avant de déclencher un paiement. Acceptez-le, mais vérifiez qu'il reprend bien le montant, les conditions et le périmètre de votre devis. En cas de divergence, c'est votre devis signé qui prime juridiquement.",
          },
          {
            q: "Comment facturer une mission de conseil : à la régie ou au forfait ?",
            a: "La régie (TJM × jours réels) est adaptée aux missions longues ou à périmètre évolutif. Le forfait convient aux livrables définis : audit, rapport, formation ponctuelle. Beaucoup de consultants combinent les deux : forfait pour la phase de diagnostic (livrable précis) et régie pour l'accompagnement (durée variable selon les besoins).",
          },
          {
            q: "Peut-on facturer des frais de déplacement en plus du TJM ?",
            a: "Oui, mais il faut le préciser explicitement dans le devis. Indiquez si les déplacements sont inclus dans le TJM ou refacturés au réel (billets, hôtel, repas avec plafond). Sans mention, certains clients refuseront de rembourser des frais qui n'étaient pas prévus.",
          },
          {
            q: "Quelle est la durée de validité standard d'une propale de consultant ?",
            a: "30 jours est la pratique courante. Sans mention de validité, un client pourrait théoriquement accepter votre devis 3 mois plus tard au même prix alors que votre agenda ou vos tarifs ont changé. Indiquez systématiquement : 'Devis valable 30 jours à compter de la date d'émission'.",
          },
        ]}
      />
    </>
  );
}
