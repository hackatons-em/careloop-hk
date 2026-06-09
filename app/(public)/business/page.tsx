import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Users, TrendingUp, Target, AlertTriangle, ShieldCheck } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.business");
  const tm = await getTranslations("metadata");
  return { title: t("title"), description: tm("businessDescription") };
}

export default async function BusinessPage() {
  const t = await getTranslations("public.business");

  const sections: { icon: React.ElementType; title: string; items: string[]; tone?: "warn" }[] = [
    {
      icon: Users,
      title: t("whoTitle"),
      items: [t("who1"), t("who2"), t("who3"), t("who4"), t("who5"), t("who6")],
    },
    {
      icon: TrendingUp,
      title: t("whyTitle"),
      items: [t("why1"), t("why2"), t("why3"), t("why4"), t("why5"), t("why6")],
    },
    {
      icon: Target,
      title: t("kpiTitle"),
      items: [t("kpi1"), t("kpi2"), t("kpi3"), t("kpi4"), t("kpi5"), t("kpi6")],
    },
    {
      icon: AlertTriangle,
      title: t("scaleTitle"),
      tone: "warn",
      items: [t("scale1"), t("scale2"), t("scale3"), t("scale4"), t("scale5"), t("scale6")],
    },
    {
      icon: ShieldCheck,
      title: t("handleTitle"),
      items: [
        t("handle1"),
        t("handle2"),
        t("handle3"),
        t("handle4"),
        t("handle5"),
        t("handle6"),
        t("handle7"),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("sub")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s, i) => (
          <section
            key={s.title}
            className="cl-rise cl-card rounded-2xl border border-border bg-card p-6 last:sm:col-span-2"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  s.tone === "warn"
                    ? "flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
                    : "flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                }
              >
                <s.icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {s.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/60" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
