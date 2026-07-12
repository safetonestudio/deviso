import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deviso, Devis & Factures IA",
    short_name: "Deviso",
    description: "Créez des devis et factures Factur-X en quelques secondes grâce à l'IA.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    orientation: "portrait-primary",
    categories: ["business", "finance", "productivity"],
    lang: "fr",
    icons: [
      {
        src: "/api/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
