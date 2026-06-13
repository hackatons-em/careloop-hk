"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { leadSchema, type LeadInterest } from "@/lib/validation";

export function ContactForm({ defaultInterest }: { defaultInterest: LeadInterest }) {
  const t = useTranslations("public.contact.form");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<LeadInterest>(defaultInterest);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      organization: organization.trim(),
      role: role.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
      interest,
      locale,
      website,
    };
    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) {
          errs[key] = t.has(`errors.${key}` as never)
            ? t(`errors.${key}` as never)
            : issue.message;
        }
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.submitLead(parsed.data);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="cl-fade rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent">
          <CheckCircle2 className="size-6 text-primary" />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{t("successTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("successBody", { email: email.trim() })}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative rounded-2xl border border-border bg-card p-6"
    >
      <div className="grid gap-4">
        <Field label={t("name")} error={errors.name} required>
          {(props) => (
            <Input
              {...props}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
        </Field>
        <Field label={t("organization")} error={errors.organization} required>
          {(props) => (
            <Input
              {...props}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder={t("organizationPlaceholder")}
              autoComplete="organization"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("role")} error={errors.role}>
            {(props) => (
              <Input
                {...props}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder={t("rolePlaceholder")}
                autoComplete="organization-title"
              />
            )}
          </Field>
          <Field label={t("interest")} error={errors.interest} required>
            {(props) => (
              <NativeSelect
                {...props}
                value={interest}
                onChange={(e) => setInterest(e.target.value as LeadInterest)}
              >
                <option value="pilot">{t("interestPilot")}</option>
                <option value="demo">{t("interestDemo")}</option>
                <option value="pricing">{t("interestPricing")}</option>
                <option value="other">{t("interestOther")}</option>
              </NativeSelect>
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("email")} error={errors.email} required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            )}
          </Field>
          <Field label={t("phone")} error={errors.phone} hint={t("phoneHint")}>
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            )}
          </Field>
        </div>
        <Field label={t("message")} error={errors.message}>
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
            />
          )}
        </Field>

        {/* Honeypot — visually hidden, skipped by humans, filled by bots. */}
        <div aria-hidden className="absolute -start-[9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full gap-1.5">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
