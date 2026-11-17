import { PageSite, CADRE_LECTURE, SECTION, H1 } from "@/components/site/PageSite";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de Deviso : éditeur, hébergeur, propriété intellectuelle et contact.",
  alternates: { canonical: "https://getdeviso.fr/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <PageSite>

      <main className={`${CADRE_LECTURE} ${SECTION} pb-24`}>
        <h1 className={`${H1} mb-3`}>Mentions légales</h1>
        <p className="text-gray-500 text-sm mb-14">Dernière mise à jour : juin 2026</p>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">Éditeur du site</h2>
          <p className="text-gray-400 leading-relaxed">
            Le site <strong>getdeviso.fr</strong> est édité par :<br /><br />
            <strong>SafeTone Studio</strong><br />
            Nom commercial de Selim Berrabah, entrepreneur individuel (auto-entrepreneur)<br />
            SIREN : 103 340 857<br />
            Adresse : 24 avenue de Gradignan, 33850 Léognan, France<br />
            Téléphone : +33 7 63 08 04 34<br />
            Email : <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:underline">support@getdeviso.fr</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">Directeur de la publication</h2>
          <p className="text-gray-400 leading-relaxed">
            Le directeur de la publication est Selim Berrabah, fondateur de SafeTone Studio.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">Hébergement</h2>
          <p className="text-gray-400 leading-relaxed">
            Le site est hébergé par :<br /><br />
            <strong>Vercel Inc.</strong><br />
            340 Pine Street, Suite 900<br />
            San Francisco, CA 94104, États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">vercel.com</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">Propriété intellectuelle</h2>
          <p className="text-gray-400 leading-relaxed">
            L&apos;ensemble des contenus présents sur ce site (textes, images, logo, interface) sont la propriété exclusive
            de SafeTone Studio et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
            Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">Données personnelles</h2>
          <p className="text-gray-400 leading-relaxed">
            Pour toute information relative au traitement de vos données personnelles, consultez notre{" "}
            <Link href="/confidentialite" className="text-indigo-400 hover:underline">politique de confidentialité</Link>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">Droit applicable</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes mentions légales sont soumises au droit français.
            En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <div className="mt-10 pt-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-ink transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </main>
    </PageSite>
  );
}
