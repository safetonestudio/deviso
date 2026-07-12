import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <nav className="border-b border-ds-border px-4 sm:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">D</span>
          </div>
          <span className="font-semibold text-white">Deviso</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-semibold text-white mb-2">Mentions légales</h1>
        <p className="text-gray-500 text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Éditeur du site</h2>
          <p className="text-gray-400 leading-relaxed">
            Le site <strong>getdeviso.fr</strong> est édité par :<br /><br />
            <strong>SafeTone Studio</strong><br />
            Auto-entrepreneur<br />
            SIREN : 103 340 857<br />
            Adresse : 24 avenue de Gradignan, 33850 Léognan, France<br />
            Téléphone : +33 7 63 08 04 34<br />
            Email : <a href="mailto:safetonestudio@proton.me" className="text-indigo-600 hover:underline">safetonestudio@proton.me</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Directeur de la publication</h2>
          <p className="text-gray-400 leading-relaxed">
            Le directeur de la publication est le fondateur de SafeTone Studio.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Hébergement</h2>
          <p className="text-gray-400 leading-relaxed">
            Le site est hébergé par :<br /><br />
            <strong>Vercel Inc.</strong><br />
            340 Pine Street, Suite 900<br />
            San Francisco, CA 94104, États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">vercel.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Propriété intellectuelle</h2>
          <p className="text-gray-400 leading-relaxed">
            L&apos;ensemble des contenus présents sur ce site (textes, images, logo, interface) sont la propriété exclusive
            de SafeTone Studio et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
            Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Données personnelles</h2>
          <p className="text-gray-400 leading-relaxed">
            Pour toute information relative au traitement de vos données personnelles, consultez notre{" "}
            <Link href="/confidentialite" className="text-indigo-600 hover:underline">politique de confidentialité</Link>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Droit applicable</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes mentions légales sont soumises au droit français.
            En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <div className="mt-10 pt-6 border-t border-ds-border text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-400 transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </main>
    </div>
  );
}
