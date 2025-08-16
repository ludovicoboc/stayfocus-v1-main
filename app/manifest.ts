import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StayFocus - Alimentação",
    short_name: "StayFocus",
    description: "Aplicativo de gerenciamento de alimentação e hidratação",
    start_url: "/",
    display: "standalone",
    background_color: "#1e293b",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["health", "lifestyle", "productivity"],
    lang: "pt-BR",
  }
}
