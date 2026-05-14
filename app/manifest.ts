import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thanos Command",
    short_name: "Thanos",
    description: "Central operacional inteligente de segurança patrimonial",
    start_url: "/ronda-operacional",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#dc2626",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
