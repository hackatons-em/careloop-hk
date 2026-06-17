import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboard");
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

// The QR opens the public self-intake form (/intake), where the patient enters
// their name + WhatsApp number + language and consents to messaging. On submit
// they're handed off to WhatsApp; because the number is captured at intake, the
// inbound webhook matches the real record (no placeholder, no demo clone).
//
// Prefer the configured public site URL; fall back to the request host so a
// fresh deployment still renders a working QR.
async function intakeUrl(): Promise<string> {
  let base = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (!base) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) base = `${proto}://${host}`;
  }
  return `${base.replace(/\/+$/, "")}/intake`;
}

export default async function OnboardPage() {
  const t = await getTranslations("onboard");
  const url = await intakeUrl();
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, width: 240 });

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("sub")}</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <div
          className="rounded-xl bg-white p-3 [&>svg]:size-56"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
      </div>

      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <div className="text-sm">
              <p className="font-medium text-foreground">{s.title}</p>
              <p className="mt-0.5 text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
