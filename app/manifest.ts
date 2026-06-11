import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Miruwa — Remote chronic-care monitoring",
    short_name: "Miruwa",
    description:
      "Daily WhatsApp check-ins, deterministic risk rules, and an exception-first nurse dashboard for chronic care between clinic visits.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
