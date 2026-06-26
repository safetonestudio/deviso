import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorker";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://getdeviso.fr"),
  title: {
    default: "Deviso — Logiciel de devis IA pour freelances",
    template: "%s | Deviso",
  },
  description:
    "Créez des devis professionnels en 30 secondes grâce à l'IA. Facturation électronique Factur-X, signature client en ligne. Conçu pour les freelances et auto-entrepreneurs français.",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deviso",
  },
  openGraph: {
    title: "Deviso — Logiciel de devis IA pour freelances",
    description:
      "Créez des devis professionnels en 30 secondes grâce à l'IA. Facturation électronique, signature client en ligne.",
    type: "website",
    locale: "fr_FR",
    url: "https://getdeviso.fr",
    siteName: "Deviso",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deviso — Logiciel de devis IA pour freelances",
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
  alternates: {
    canonical: "https://getdeviso.fr",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-white text-slate-900 antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
