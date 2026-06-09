import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.privacy");
  const tm = await getTranslations("metadata");
  return { title: t("title"), description: tm("privacyDescription") };
}

// Baseline policy for pilot deployments — review with legal counsel before any
// production contract.
export default async function PrivacyPage() {
  const t = await getTranslations("public.privacy");
  const sections = [
    { h: t("s1h"), p: t("s1p") },
    { h: t("s2h"), p: t("s2p") },
    { h: t("s3h"), p: t("s3p") },
    { h: t("s4h"), p: t("s4p") },
    { h: t("s5h"), p: t("s5p") },
  ];

  return (
    <article className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("updated")}</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-secondary-foreground/90">
        {sections.map((s) => (
          <div key={s.h} className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">{s.h}</h2>
            <p>{s.p}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
