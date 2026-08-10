import type { Metadata } from "next";

/**
 * Voir login/layout.tsx : la page est un Client Component, le titre et la
 * description doivent être déclarés ici pour éviter le doublon avec /login.
 */
export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte Deviso et générez votre premier devis en 30 secondes. Essai gratuit 14 jours, sans carte bancaire.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
