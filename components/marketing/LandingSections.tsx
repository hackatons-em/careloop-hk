import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock,
  FileOutput,
  History,
  Languages,
  ShieldCheck,
  Siren,
  Smartphone,
  Stethoscope,
  Users,
} from "lucide-react";
import { DashboardGlimpse } from "@/components/marketing/DashboardGlimpse";

/** Server-rendered marketing narrative below the hero — SEO-indexable, same
 * card idiom as the rest of the product, zero client JS. */
export async function LandingSections() {
  const t = await getTranslations("sections");
  const tl = await getTranslations("landing");

  const journey = [
    { icon: Stethoscope, title: tl("problem.step1Title"), body: tl("problem.step1Body"), tone: "text-teal-600" },
    { icon: CalendarDays, title: tl("problem.step2Title"), body: tl("problem.step2Body"), tone: "text-blue-600" },
    { icon: AlertCircle, title: tl("problem.step3Title"), body: tl("problem.step3Body"), tone: "text-amber-600" },
    { icon: Siren, title: tl("problem.step4Title"), body: tl("problem.step4Body"), tone: "text-red-600" },
  ];

  const bottlenecks = [
    { icon: Smartphone, body: tl("problem.bottleneck1") },
    { icon: Users, body: tl("problem.bottleneck2") },
    { icon: Clock, body: tl("problem.bottleneck3") },
  ];

  const steps = [
    { title: t("how.step1Title"), body: t("how.step1Body") },
    { title: t("how.step2Title"), body: t("how.step2Body") },
    { title: t("how.step3Title"), body: t("how.step3Body") },
    { title: t("how.step4Title"), body: t("how.step4Body") },
  ];

  const features = [
    { icon: ClipboardList, title: t("features.f1Title"), body: t("features.f1Body") },
    { icon: Languages, title: t("features.f2Title"), body: t("features.f2Body") },
    { icon: Activity, title: t("features.f3Title"), body: t("features.f3Body") },
    { icon: Users, title: t("features.f4Title"), body: t("features.f4Body") },
    { icon: FileOutput, title: t("features.f5Title"), body: t("features.f5Body") },
    { icon: History, title: t("features.f6Title"), body: t("features.f6Body") },
  ];

  const trustItems = [t("trust.item1"), t("trust.item2"), t("trust.item3"), t("trust.item4")];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 pb-16 pt-8">
      {/* The problem: the gap between visits */}
      <section>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {tl("problem.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            {tl("problem.sub")}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((s, n) => (
            <div
              key={s.title}
              className="cl-rise rounded-2xl border border-border bg-card p-5 text-center"
              style={{ animationDelay: `${n * 60}ms` }}
            >
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
            {tl("problem.bottleneckTitle1")}{" "}
            <span className="text-primary">{tl("problem.bottleneckAccent")}</span>
            <br />
            {tl("problem.bottleneckTitle2")}
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
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("how.title")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("how.sub")}</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((s, n) => (
            <div
              key={s.title}
              className="cl-rise relative rounded-2xl border border-border bg-card p-5"
              style={{ animationDelay: `${n * 60}ms` }}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {n + 1}
              </span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              {n < steps.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="absolute -right-5 top-[26px] hidden size-4 text-muted-foreground/40 lg:block"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Exception-first dashboard glimpse */}
      <DashboardGlimpse />

      {/* Features */}
      <section>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("features.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("features.sub")}
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, n) => (
            <div
              key={f.title}
              className="cl-rise cl-card rounded-2xl border border-border bg-card p-5"
              // Reveal in row waves (3-up at lg) — one story per section, ≤3 delay steps.
              style={{ animationDelay: `${Math.floor(n / 3) * 90}ms` }}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="rounded-2xl bg-[#0a1626] p-7 text-white md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {trustItems.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/85">
                  <ShieldCheck className="size-4 shrink-0 text-teal-300" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-white/65">
              {t("trust.honesty")}
            </p>
          </div>
          <Link
            href="/security"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            {t("trust.link")}
          </Link>
        </div>
      </section>

      {/* CTA band */}
      <section className="rounded-2xl border border-border bg-card p-8 text-center md:p-12">
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t("cta.sub")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("cta.primary")} <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-6 text-sm font-semibold outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("cta.secondary")}
          </Link>
        </div>
      </section>
    </div>
  );
}
