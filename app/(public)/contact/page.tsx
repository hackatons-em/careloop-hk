import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { ContactForm } from "@/components/marketing/ContactForm";
import { leadInterests, type LeadInterest } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("contactTitle"), description: t("contactDescription") };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  const t = await getTranslations("public.contact");
  const { interest } = await searchParams;
  const defaultInterest: LeadInterest = (leadInterests as readonly string[]).includes(
    interest ?? "",
  )
    ? (interest as LeadInterest)
    : "demo";

  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <div className="grid gap-8 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:gap-12">
      <div className="cl-rise">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("sub")}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-foreground/90">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="cl-rise" style={{ animationDelay: "80ms" }}>
        <ContactForm defaultInterest={defaultInterest} />
      </div>
    </div>
  );
}
