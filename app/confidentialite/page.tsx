import { PageSite, CADRE_LECTURE, SECTION, H1 } from "@/components/site/PageSite";
import type { Metadata } from "next";
import Link from "next/link";
import { PolitiqueConfidentialiteTexte } from "@/components/legal/PolitiqueConfidentialiteTexte";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Deviso : données collectées, finalités, sous-traitants, durées de conservation et vos droits.",
  alternates: { canonical: "https://getdeviso.fr/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <PageSite>

      <main className={`${CADRE_LECTURE} ${SECTION} pb-24`}>
        <h1 className={`${H1} mb-3`}>
          Politique de confidentialité
        </h1>
        <PolitiqueConfidentialiteTexte />

        <div className="mt-10 pt-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-ink transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </main>
    </PageSite>
  );
}
