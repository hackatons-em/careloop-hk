import type { Metadata } from "next";
import { LandingSlides } from "@/components/LandingSlides";

export const metadata: Metadata = {
  title: "CareLoop — Remote chronic-care monitoring",
  description:
    "WhatsApp check-ins, vital signals, and explainable deterministic rules help nurses monitor elderly chronic-care patients between clinic visits. Monitoring support — not diagnosis.",
  alternates: { canonical: "/" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CareLoop",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Remote chronic-care monitoring for elderly Hong Kong patients: daily WhatsApp check-ins, deterministic risk rules, and an exception-first nurse dashboard.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "HKD" },
};

export default function Landing() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, trusted JSON-LD literal — no user input flows in.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingSlides />
    </>
  );
}
