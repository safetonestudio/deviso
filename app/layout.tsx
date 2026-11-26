import type { Metadata, Viewport } from "next";
import { BETA_OUVERTE } from "@/lib/beta";
import { Inter } from "next/font/google";
import "./globals.css";

// Police téléchargée et servie depuis notre domaine au moment du build :
// aucune requête vers Google côté visiteur, aucun ajustement de CSP requis.
//
// Quatre graisses, et pas sept. Sept étaient chargées (300 à 900) ; en comptant
// les classes Tailwind réellement utilisées, `normal` (400), `medium` (500),
// `semibold` (600) et `bold` (700) le sont massivement, `300` ne l'était jamais,
// et `800`/`900` apparaissaient cinq fois en tout, désormais remplacées par 700.
// Chaque graisse est un fichier woff2 de plus sur le chemin critique de rendu,
// sur mobile en 4G.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});
import { ServiceWorkerRegistration } from "@/components/ServiceWorker";
// Sous-chemin /next (et non /react) : il branche le suivi sur le routeur de
// Next.js, sinon les changements de page côté client ne sont pas comptabilisés.
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://getdeviso.fr"),
  title: {
    default: "Deviso, logiciel de devis et de facturation pour les entreprises",
    template: "%s | Deviso",
  },
  description:
    "Créez vos devis en 30 secondes avec l'IA, facturez en Factur-X conforme 2026, relances automatiques, suivi du chiffre d'affaires et de la TVA. Pour l'indépendant comme pour la société avec son équipe. " + (BETA_OUVERTE ? "Bêta gratuite, sans carte bancaire." : "Essai gratuit sans carte bancaire."),
  keywords: [
    "logiciel devis entreprise",
    "devis en ligne gratuit",
    "logiciel facturation auto-entrepreneur",
    "devis IA",
    "facture électronique entreprise",
    "facture électronique 2026",
    "Factur-X",
    "générateur devis professionnel",
    "logiciel devis facture France",
    "logiciel facturation PME",
    "signature électronique devis",
    "devis auto-entrepreneur",
  ],
  authors: [{ name: "Deviso", url: "https://getdeviso.fr" }],
  creator: "Deviso",
  publisher: "Deviso",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deviso",
  },
  openGraph: {
    title: "Deviso, devis et factures pour les entreprises, de l'indépendant à la société",
    description:
      "Vos devis rédigés, vos factures conformes, vos relances envoyées. Plateforme agréée comprise, " + (BETA_OUVERTE ? "bêta gratuite." : "essai gratuit de 14 jours."),
    type: "website",
    locale: "fr_FR",
    url: "https://getdeviso.fr",
    siteName: "Deviso",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deviso, devis et factures pour les entreprises, de l'indépendant à la société",
    description:
      "Vos devis rédigés, vos factures conformes, vos relances envoyées. Plateforme agréée comprise, " + (BETA_OUVERTE ? "bêta gratuite." : "essai gratuit de 14 jours."),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  // Pas de canonical global, chaque page définit le sien explicitement
};

export const viewport: Viewport = {
  themeColor: "#0E1512",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#0E1512] text-ink antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
