import type { Metadata } from "next";
import { policesApp } from "@/app/polices-app";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Écrans de passage entre le site et l'app : même palette et même police que
 * l'app (.ds-app), sinon ils s'affichaient avec l'ancien fond et l'indigo
 * d'origine de Tailwind juste avant le nouveau design (retour Selim 20/11/2026).
 */
export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return <div className={`ds-app ${policesApp} min-h-screen bg-ds-bg`}>{children}</div>;
}
