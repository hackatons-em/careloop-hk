"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { HeartPulse, Loader2 } from "lucide-react";
import { z } from "zod";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const schema = z
  .object({
    password: z.string().min(10),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"] });

export function UpdatePasswordForm({ email }: { email: string }) {
  const t = useTranslations("auth.updatePassword");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const errs: { password?: string; confirm?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "password" | "confirm";
        if (!errs[key]) errs[key] = t(`errors.${key}`);
      }
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      setSubmitting(false);
      setFormError(error.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="cl-rise w-full max-w-sm rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HeartPulse className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Miruwa</span>
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("subPrefix")} <span className="font-medium text-foreground">{email}</span>
        {t("subSuffix")}
      </p>

      {formError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
        <Field label={t("newPassword")} error={fieldErrors.password} required>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Field label={t("confirmPassword")} error={fieldErrors.confirm} required>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
