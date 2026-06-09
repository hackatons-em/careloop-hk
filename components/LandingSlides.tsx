"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowDown,
  HeartPulse,
  ShieldCheck,
  TrendingUp,
  Wind,
  Droplet,
  Pill,
  Stethoscope,
  CalendarDays,
  AlertCircle,
  Siren,
  Users,
  Smartphone,
  Clock,
} from "lucide-react";

const TOTAL = 2;

export function LandingSlides() {
  const t = useTranslations("landing");
  const [i, setI] = useState(0);
  const next = useCallback(() => setI((v) => Math.min(v + 1, TOTAL - 1)), []);
  const prev = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="flex min-h-[calc(100svh-9rem)] flex-col">
      {/* slide */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
        <div key={i} className="cl-fade">
          {i === 0 && <SlideHero />}
          {i === 1 && <SlideProblem />}
        </div>
      </div>

      {/* one control row: progress + back on the left, primary CTA on the right */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between py-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL }).map((_, d) => (
              <button
                key={d}
                onClick={() => setI(d)}
                aria-label={t("controls.slide", { n: d + 1 })}
                className={`h-2 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  d === i ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
          {i > 0 && (
            <button
              onClick={prev}
              className="rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("controls.back")}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {i < TOTAL - 1 ? (
            <button
              onClick={next}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t("controls.next")} <ArrowRight className="size-4" />
            </button>
          ) : (
            <Link
              href="/contact"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t("controls.requestDemo")} <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {/* scroll cue into the marketing sections */}
      <div className="mx-auto w-full max-w-6xl pb-4">
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowDown aria-hidden className="size-3.5" /> {t("controls.scrollCue")}
        </a>
      </div>
    </div>
  );
}

/* ---------- Slide 1 · Hero ---------- */
function SlideHero() {
  const t = useTranslations("landing");
  const signals = [
    { icon: TrendingUp, label: t("preview.signal1") },
    { icon: Wind, label: t("preview.signal2") },
    { icon: Droplet, label: t("preview.signal3") },
    { icon: Pill, label: t("preview.signal4") },
  ];
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <HeartPulse className="size-3.5" /> {t("badge")}
        </span>
        <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          {t("heroTitle")} <span className="text-primary">{t("heroTitleAccent")}</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary-foreground/80">
          {t("heroSub")}
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>{t("safetyLine")}</p>
        </div>
      </div>

      {/* patient escalate card */}
      <div className="lg:pl-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("preview.label")}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <span className="size-1.5 rounded-full bg-red-500" /> {t("preview.escalate")}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">{t("preview.name")}</h2>
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
                className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs"
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
  );
}

/* ---------- Slide 2 · The gap ---------- */
function SlideProblem() {
  const t = useTranslations("landing");
  const steps = [
    { icon: Stethoscope, title: t("problem.step1Title"), body: t("problem.step1Body"), tone: "text-teal-600" },
    { icon: CalendarDays, title: t("problem.step2Title"), body: t("problem.step2Body"), tone: "text-blue-600" },
    { icon: AlertCircle, title: t("problem.step3Title"), body: t("problem.step3Body"), tone: "text-amber-600" },
    { icon: Siren, title: t("problem.step4Title"), body: t("problem.step4Body"), tone: "text-red-600" },
  ];
  const bottlenecks = [
    { icon: Smartphone, body: t("problem.bottleneck1") },
    { icon: Users, body: t("problem.bottleneck2") },
    { icon: Clock, body: t("problem.bottleneck3") },
  ];
  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("problem.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("problem.sub")}</p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, n) => (
          <div key={s.title} className="rounded-2xl border border-border bg-card p-5 text-center">
            <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {n + 1}
            </span>
            <s.icon className={`mx-auto mt-3 size-7 ${s.tone}`} />
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-6 rounded-2xl bg-[#0a1626] p-7 text-white md:grid-cols-2 md:items-center md:p-8">
        <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">
          {t("problem.bottleneckTitle1")}{" "}
          <span className="text-primary">{t("problem.bottleneckAccent")}</span>
          <br />
          {t("problem.bottleneckTitle2")}
        </h3>
        <ul className="space-y-3">
          {bottlenecks.map((b) => (
            <li key={b.body} className="flex items-start gap-3 text-sm text-white/80">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-teal-300">
                <b.icon className="size-4" />
              </span>
              {b.body}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
