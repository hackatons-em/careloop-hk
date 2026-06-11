import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://miruwa.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/business", "/privacy", "/terms", "/pricing", "/security", "/contact"],
        disallow: [
          "/dashboard",
          "/alerts",
          "/patients/",
          "/onboard",
          "/settings",
          "/login",
          "/auth/",
          "/api/",
          "/presentation",
          "/architecture",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
