import type { Metadata } from "next";

/**
 * La page est un Client Component : elle ne peut pas exporter de metadata.
 * Ce layout lui donne un titre et une description qui lui sont propres, sinon
 * elle hérite de ceux de la racine et se retrouve en doublon avec /signup.
 */
export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre espace Deviso pour créer vos devis, suivre vos factures et relancer vos clients.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
