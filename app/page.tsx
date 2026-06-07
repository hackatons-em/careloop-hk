"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
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

const SIGNALS = [
  { icon: TrendingUp, label: "+2.3kg in 3 days" },
  { icon: Wind, label: "Shortness of breath" },
  { icon: Droplet, label: "Leg swelling" },
  { icon: Pill, label: "Medication missed" },
];

const GAP_STEPS = [
  { icon: Stethoscope, title: "Clinic visit", body: "Patient seen, plan updated.", tone: "text-teal-600" },
  { icon: CalendarDays, title: "Long gap", body: "Days to weeks pass with little visibility.", tone: "text-blue-600" },
  { icon: AlertCircle, title: "Missed symptoms", body: "Symptoms worsen, signals are missed.", tone: "text-amber-600" },
  { icon: Siren, title: "Urgent care", body: "Condition worsens, costs go up, stress rises.", tone: "text-red-600" },
];

const BOTTLENECK = [
  { icon: Smartphone, body: "Elderly patients may not open new apps or remember daily check-ins." },
  { icon: Users, body: "Families and care teams have limited visibility." },
  { icon: Clock, body: "Delays can lead to avoidable deterioration and urgent care." },
];

const TOTAL = 2;

export default function Landing() {
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
    <div className="flex flex-1 flex-col">
      {/* top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Care<span className="text-primary">Loop</span>{" "}
            <span className="text-muted-foreground">HK</span>
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip to demo →
        </Link>
      </header>

      {/* slide */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6">
        <div key={i} className="cl-fade">
          {i === 0 && <SlideHero />}
          {i === 1 && <SlideProblem />}
        </div>
      </main>

      {/* one control row: progress + back on the left, single Next / Start-demo on the right */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL }).map((_, d) => (
              <button
                key={d}
                onClick={() => setI(d)}
                aria-label={`Slide ${d + 1}`}
                className={`h-2 rounded-full transition-all ${
                  d === i ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
          {i > 0 && (
            <button
              onClick={prev}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </button>
          )}
        </div>

        {i < TOTAL - 1 ? (
          <button
            onClick={next}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Next slide <ArrowRight className="size-4" />
          </button>
        ) : (
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Start the demo <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ---------- Slide 1 · Hero ---------- */
function SlideHero() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <HeartPulse className="size-3.5" /> Hong Kong elderly chronic-care monitoring
        </span>
        <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          CareLoop watches the <span className="text-primary">gaps between visits.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary-foreground/80">
          WhatsApp check-ins, vital signals, and explainable rules help nurses monitor elderly
          chronic-care patients between clinic visits.
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>Monitoring support only. Not diagnosis. No treatment recommendation.</p>
        </div>
      </div>

      {/* patient escalate card */}
      <div className="lg:pl-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Patient · CareLoop</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <span className="size-1.5 rounded-full bg-red-500" /> Escalate
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight">Mrs. Chan, 78</h3>
          <p className="text-sm text-muted-foreground">Heart failure + hypertension · lives alone</p>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Latest signals
          </p>
          <ul className="mt-2 space-y-2">
            {SIGNALS.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <s.icon className="size-4 text-red-500" />
                {s.label}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Matched rules
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
            ● Escalate — nurse review recommended
          </div>
          <p className="mt-3 text-xs text-muted-foreground">For nurse review · not diagnosis</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Slide 2 · The gap ---------- */
function SlideProblem() {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          The gap between visits
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          The risk is not only inside the clinic. It is the long period where symptoms, adherence,
          and daily changes become invisible.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GAP_STEPS.map((s, n) => (
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
          The real bottleneck is <span className="text-primary">adherence,</span>
          <br />
          not only monitoring.
        </h3>
        <ul className="space-y-3">
          {BOTTLENECK.map((b) => (
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
