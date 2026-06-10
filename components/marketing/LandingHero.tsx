import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Check,
  Droplet,
  HeartPulse,
  Pill,
  ShieldCheck,
  TrendingUp,
  Wind,
} from "lucide-react";

/** Server-rendered hero: headline + CTAs on the left; the WhatsApp-message →
 * escalation-card causality composition on the right; honest product-fact
 * proof chips closing the first viewport. Zero client JS. */
export async function LandingHero() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const signals = [
    { icon: TrendingUp, label: t("preview.signal1") },
    { icon: Wind, label: t("preview.signal2") },
    { icon: Droplet, label: t("preview.signal3") },
    { icon: Pill, label: t("preview.signal4") },
  ];

  const proof = [t("proof.item1"), t("proof.item2"), t("proof.item3"), t("proof.item4")];

  return (
    <section className="flex flex-col justify-center gap-12 py-8 lg:min-h-[calc(100svh-9rem)]">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        {/* Left: message */}
        <div className="cl-rise-solid">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <HeartPulse className="size-3.5" /> {t("badge")}
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {t("heroTitle")} <span className="text-primary">{t("heroTitleAccent")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary-foreground/80">
            {t("heroSub")}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {tc("requestDemo")} <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-6 text-sm font-semibold outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("heroCtaSecondary")}
            </a>
          </div>
          <div className="mt-6 flex max-w-xl items-start gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>{t("safetyLine")}</p>
          </div>
        </div>

        {/* Right: WhatsApp message → escalation, in one glance. pt-16 clears
            the two-line bubble (~70px) while keeping a few px of layered
            overlap with the card below it. */}
        <div className="relative mx-auto w-full max-w-md pt-16 lg:max-w-none">
          {/* the cause: a patient's WhatsApp message */}
          <div
            className="cl-rise absolute left-1 top-0 z-0 max-w-[250px] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3.5 py-2 text-sm text-neutral-800 shadow-md"
            style={{ animationDelay: "120ms" }}
          >
            <p>{t("preview.bubbleText")}</p>
            <p className="mt-0.5 text-[10px] text-neutral-600">{t("preview.bubbleMeta")}</p>
          </div>

          {/* the effect: the escalation card */}
          <div
            className="cl-rise relative z-10 ml-auto w-[min(100%,26rem)] rounded-2xl border border-border bg-card p-5 shadow-xl"
            style={{ animationDelay: "260ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("preview.label")}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                <span className="size-1.5 rounded-full bg-red-500" /> {t("preview.escalate")}
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold tracking-tight">{t("preview.name")}</p>
            <p className="text-sm text-muted-foreground">{t("preview.profile")}</p>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("preview.latestSignals")}
            </p>
            <ul className="mt-2 space-y-2">
              {signals.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 text-sm">
                  <s.icon className="size-4 text-red-500" />
                  {s.label}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("preview.matchedRules")}
            </p>
            <div className="mt-2 flex gap-2">
              {["HF-001", "HF-002"].map((r) => (
                <span
                  key={r}
                  className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs [font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]"
                >
                  {r}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {t("preview.escalateLine")}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("preview.forReview")}</p>
          </div>
        </div>
      </div>

      {/* proof: honest product facts (no fake logos) */}
      <div className="cl-fade" style={{ animationDelay: "400ms" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("proof.label")}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {proof.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <Check aria-hidden className="size-3.5 text-primary" /> {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
