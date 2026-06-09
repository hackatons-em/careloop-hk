import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check, FlaskConical, Building2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("pricingTitle"), description: t("pricingDescription") };
}

export default async function PricingPage() {
  const t = await getTranslations("public.pricing");

  const tiers = [
    {
      icon: FlaskConical,
      name: t("pilotName"),
      tag: t("pilotTag"),
      highlight: false,
      points: [t("pilot1"), t("pilot2"), t("pilot3"), t("pilot4")],
      cta: t("pilotCta"),
      href: "/contact?interest=pilot",
    },
    {
      icon: Rocket,
      name: t("standardName"),
      tag: t("standardTag"),
      highlight: true,
      points: [t("standard1"), t("standard2"), t("standard3"), t("standard4")],
      cta: t("standardCta"),
      href: "/contact?interest=demo",
    },
    {
      icon: Building2,
      name: t("enterpriseName"),
      tag: t("enterpriseTag"),
      highlight: false,
      points: [t("enterprise1"), t("enterprise2"), t("enterprise3"), t("enterprise4")],
      cta: t("enterpriseCta"),
      href: "/contact?interest=pricing",
    },
  ];

  return (
    <div className="space-y-8 py-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("sub")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {tiers.map((tier, i) => (
          <section
            key={tier.name}
            className={cn(
              "cl-rise flex flex-col rounded-2xl border bg-card p-6",
              tier.highlight ? "border-primary/40" : "border-border",
            )}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <tier.icon className="size-5" />
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  tier.highlight
                    ? "border-primary/20 bg-accent text-accent-foreground"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {tier.tag}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">{tier.name}</h2>
            <ul className="mt-4 flex-1 space-y-2.5">
              {tier.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-foreground/90">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href={tier.href}
              className={cn(
                "mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                tier.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-offset-2"
                  : "border border-border bg-card hover:bg-muted",
              )}
            >
              {tier.cta} <ArrowRight className="size-4" />
            </Link>
          </section>
        ))}
      </div>

      <section
        className="cl-rise mx-auto max-w-2xl rounded-2xl border border-border bg-muted/40 p-6 text-center"
        style={{ animationDelay: "240ms" }}
      >
        <h2 className="text-base font-semibold">{t("whyTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("whyBody")}</p>
      </section>
    </div>
  );
}
