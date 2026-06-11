import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingSections } from "@/components/marketing/LandingSections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("rootTitle"),
    description: t("landingDescription"),
    alternates: { canonical: "/" },
  };
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Miruwa",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Remote chronic-care monitoring for elderly Hong Kong patients: daily WhatsApp check-ins, deterministic risk rules, and an exception-first nurse dashboard.",
};

export default function Landing() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, trusted JSON-LD literal — no user input flows in.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingHero />
      <LandingSections />
    </>
  );
}
