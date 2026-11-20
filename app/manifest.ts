import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deviso, devis et factures",
    short_name: "Deviso",
    description: "Devis rédigés, factures conformes à la réforme 2026, relances envoyées : pour les indépendants et les petites entreprises.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0E1512",
    theme_color: "#0E1512",
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
