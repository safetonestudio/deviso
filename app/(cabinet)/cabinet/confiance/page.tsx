import type { Metadata } from "next";
import Link from "next/link";
import { BoutonImprimer } from "@/components/cabinet/BoutonImprimer";

export const metadata: Metadata = { title: "Sécurité et confiance" };

/**
 * Fiche de confiance remise au cabinet (20/11/2026), recommandation de
 * l'étude de marché : les cabinets se méfient des éditeurs (réversibilité,
 * souveraineté, démarchage de leurs clients).
 *
 * Chaque affirmation est vérifiée dans le code ou l'infrastructure le jour de
 * l'écriture, ne rien y ajouter sans l'avoir vérifié :
 * - lecture seule : lib/droits.ts (droitsDe court-circuite le rôle comptable),
 *   gardée par check:comptable-acces et test:comptable ;
 * - rattachement par code à usage unique, retrait par le client : app/api/
 *   cabinet/rejoindre, components/ComptableAcces.tsx ;
 * - journal : lib/cabinet-journal.ts ;
 * - hébergement : projet Supabase en région eu-central-2 (Zurich), fonctions
 *   Vercel en fra1 (Francfort, vercel.json).
 */
export default function CabinetConfiance() {
  const bloc = "carte p-5";
  const titre = "text-ink font-semibold mb-2";
  const texte = "text-sm text-gray-300 leading-relaxed";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titre-page">Sécurité et confiance</h1>
          <p className="sous-titre-page">Ce que vous pouvez faire dans les dossiers de vos clients, et ce que Deviso garantit.</p>
        </div>
        <BoutonImprimer />
      </div>

      <div className="space-y-4">
        <section className={bloc}>
          <h2 className={titre}>Lecture seule, garantie par le serveur</h2>
          <p className={texte}>
            Vous consultez les factures, la TVA et les anomalies de vos clients. Vous ne pouvez rien créer, modifier,
            envoyer ni supprimer : la règle est appliquée par le serveur à chaque demande, pas seulement masquée à
            l&apos;écran. Le seul message possible est un signalement, que votre client lit et clôt lui-même.
          </p>
        </section>

        <section className={bloc}>
          <h2 className={titre}>Votre client décide</h2>
          <p className={texte}>
            L&apos;accès ne s&apos;ouvre que lorsque votre client saisit le code que vous lui avez transmis, à usage
            unique. Il voit le nom de votre cabinet dans ses paramètres et peut retirer l&apos;accès à tout moment.
            L&apos;accès est gratuit pour vous comme pour lui, sans siège facturé.
          </p>
        </section>

        <section className={bloc}>
          <h2 className={titre}>Tout est tracé</h2>
          <p className={texte}>
            Chaque consultation de dossier et chaque export sont enregistrés avec leur date dans votre{" "}
            <Link href="/cabinet/journal" className="text-indigo-400 hover:text-indigo-300">journal des accès</Link>.
          </p>
        </section>

        <section className={bloc}>
          <h2 className={titre}>Vos données restent récupérables</h2>
          <p className={texte}>
            Vous exportez à tout moment le FEC (avec ou sans les PDF des factures) ou la liste des factures en CSV,
            pour un dossier ou tout le portefeuille. Votre client exporte de son côté son FEC depuis son espace.
            Aucun format propriétaire n&apos;est nécessaire pour reprendre l&apos;historique ailleurs.
          </p>
        </section>

        <section className={bloc}>
          <h2 className={titre}>Hébergement en Europe</h2>
          <p className={texte}>
            La base de données est hébergée à Zurich (Suisse, pays reconnu par la Commission européenne comme
            offrant une protection adéquate des données) ; l&apos;application tourne à Francfort. Les échanges sont
            chiffrés. Les factures électroniques transitent par une plateforme agréée par l&apos;administration
            fiscale, comprise dans l&apos;abonnement de votre client.
          </p>
        </section>

        <section className={bloc}>
          <h2 className={titre}>Deviso ne vend pas de comptabilité</h2>
          <p className={texte}>
            Deviso est un outil de devis et de facturation. Il ne propose aucune mission comptable et ne démarche pas
            vos clients pour en vendre une. Votre client reste le vôtre.
          </p>
        </section>

        <p className="text-[13px] text-gray-400 px-1">
          La liste des sous-traitants et la durée de conservation des données figurent dans la{" "}
          <Link href="/confidentialite" className="text-indigo-400 hover:text-indigo-300">politique de confidentialité</Link>.
          Une question : support@getdeviso.fr.
        </p>
      </div>
    </div>
  );
}
