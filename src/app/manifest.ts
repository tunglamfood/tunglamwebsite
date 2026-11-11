import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tung Lam Food",
    short_name: "Tung Lam",
    description: "Chilled & frozen food manufacturer in Perak, Malaysia since 1999.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#d71920",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
