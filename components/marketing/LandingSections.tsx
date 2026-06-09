import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FileOutput,
  History,
  Languages,
  ShieldCheck,
  Users,
} from "lucide-react";

/** Server-rendered marketing sections below the slide hero — SEO-indexable,
 * same card idiom as the rest of the product. */
export async function LandingSections() {
  const t = await getTranslations("sections");

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
      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("how.title")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("how.sub")}</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, n) => (
            <div
              key={s.title}
              className="cl-rise rounded-2xl border border-border bg-card p-5"
              style={{ animationDelay: `${n * 60}ms` }}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {n + 1}
              </span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

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
              style={{ animationDelay: `${n * 50}ms` }}
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
          <ul className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-white/85">
                <ShieldCheck className="size-4 shrink-0 text-teal-300" />
                {item}
              </li>
            ))}
          </ul>
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
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("cta.title")}</h2>
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
