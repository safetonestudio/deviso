import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Deviso — Votre devis en 30 secondes",
  description:
    "Créez des devis professionnels en quelques secondes grâce à l'IA. Conçu pour les freelances et indépendants français.",
  keywords: ["devis", "freelance", "facturation", "IA", "proposition commerciale"],
  authors: [{ name: "Deviso" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deviso",
  },
  openGraph: {
    title: "Deviso — Votre devis en 30 secondes",
    description: "Créez des devis professionnels en quelques secondes grâce à l'IA.",
    type: "website",
    locale: "fr_FR",
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
      </body>
    </html>
  );
}
