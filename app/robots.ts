import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://careloop-hk.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/business", "/privacy", "/terms"],
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
