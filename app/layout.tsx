import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorker";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://getdeviso.fr"),
  title: {
    default: "Deviso, logiciel de devis et facturation pour freelances",
    template: "%s | Deviso",
  },
  description:
    "Créez vos devis en 30 secondes avec l'IA, facturez en Factur-X conforme 2026, relances automatiques, suivi CA URSSAF. Essai gratuit sans carte bancaire.",
  keywords: [
    "logiciel devis freelance",
    "devis en ligne gratuit",
    "logiciel facturation auto-entrepreneur",
    "devis IA",
    "facture électronique freelance",
    "facture électronique 2026",
    "Factur-X",
    "générateur devis professionnel",
    "logiciel devis facture France",
    "facturation freelance",
    "signature électronique devis",
    "devis auto-entrepreneur",
  ],
  authors: [{ name: "Deviso", url: "https://getdeviso.fr" }],
  creator: "Deviso",
  publisher: "Deviso",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deviso",
  },
  openGraph: {
    title: "Deviso, Logiciel de devis IA pour freelances",
    description:
      "Créez des devis professionnels en 30 secondes grâce à l'IA. Facturation électronique, signature client en ligne.",
    type: "website",
    locale: "fr_FR",
    url: "https://getdeviso.fr",
    siteName: "Deviso",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deviso, Logiciel de devis IA pour freelances",
    description:
      "Créez des devis professionnels en 30 secondes grâce à l'IA. Facturation électronique, signature client en ligne.",
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
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#080808] text-white antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
