"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface IntakeFormProps {
  /** Clinic/org name shown in the consent line. */
  clinic: string;
  /** WhatsApp sender number (E.164, no leading +) for the success deep link. */
  waNumber: string;
  /** Twilio sandbox join code, if running against the sandbox. */
  joinCode: string;
  isSandbox: boolean;
}

// Mirrors the server-side e164 schema so we can show a friendly inline error
// before the round trip.
const PHONE_RE = /^\+[1-9]\d{6,14}$/;

export function IntakeForm({ clinic, waNumber, joinCode, isSandbox }: IntakeFormProps) {
  const t = useTranslations("intake");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; consent?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/[\s-]/g, "");
    const next: { name?: string; phone?: string; consent?: string } = {};
    if (!name.trim()) next.name = t("errors.name");
    if (!PHONE_RE.test(cleanPhone)) next.phone = t("errors.phone");
    if (!consent) next.consent = t("errors.consent");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          preferred_language: locale,
          consent_messaging: true,
          website,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
    } catch {
      setSubmitting(false);
      toast.error(t("errors.failed"));
    }
  }

  if (done) {
    // Sandbox needs the "join <code>" opt-in; a real number just needs a
    // greeting. Either way the patient initiates, satisfying WhatsApp's
    // user-initiated-session rule, and the webhook matches the stored number.
    const text = isSandbox && joinCode ? `join ${joinCode}` : t("waGreeting");
    const waUrl = waNumber
      ? `https://wa.me/${waNumber.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`
      : null;
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">{t("successTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {waUrl ? t("successBody") : t("successNoWhatsapp")}
        </p>
        {waUrl && (
          <a
            href={waUrl}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("whatsappButton")}
          </a>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
      noValidate
    >
      <Field label={t("nameLabel")} required error={errors.name}>
        {(props) => (
          <Input
            {...props}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={120}
          />
        )}
      </Field>

      <Field label={t("phoneLabel")} required hint={t("phoneHint")} error={errors.phone}>
        {(props) => (
          <Input
            {...props}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+852…"
          />
        )}
      </Field>

      <div>
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
          />
          <span className="text-muted-foreground">{t("consentLabel", { clinic })}</span>
        </label>
        {errors.consent && (
          <p className="mt-1 text-xs font-medium text-destructive">{errors.consent}</p>
        )}
      </div>

      {/* Honeypot — off-screen; bots fill it, humans don't. Non-empty on the
          server returns a silent OK. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <Button type="submit" disabled={submitting} className="w-full gap-1.5">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
