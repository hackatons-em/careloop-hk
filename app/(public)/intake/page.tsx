import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { IntakeForm } from "@/components/IntakeForm";
import { getDefaultOrgId, getOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

// Twilio sandbox sender — the same default the onboard page uses. The intake
// success screen hands the patient off to WhatsApp; the sandbox needs a
// "join <code>" message, a real WhatsApp Business number just needs a greeting.
const SANDBOX_NUMBER = "14155238886";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("intake");
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function IntakePage() {
  const t = await getTranslations("intake");
  const waNumber = process.env.CARELOOP_WHATSAPP_SANDBOX_NUMBER ?? SANDBOX_NUMBER;
  const joinCode = process.env.CARELOOP_WHATSAPP_JOIN_CODE ?? "";
  const isSandbox = waNumber === SANDBOX_NUMBER;

  // Clinic name personalizes the consent line; fall back to a generic phrase if
  // the org lookup fails so the public page never errors out.
  let clinicName = "";
  try {
    const org = await getOrganization(await getDefaultOrgId());
    clinicName = org?.name?.trim() ?? "";
  } catch {
    clinicName = "";
  }
  const clinic = clinicName || t("defaultClinic");

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("sub")}</p>
      </div>

      <IntakeForm clinic={clinic} waNumber={waNumber} joinCode={joinCode} isSandbox={isSandbox} />

      <p className="text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
