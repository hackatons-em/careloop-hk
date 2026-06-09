"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/ui/select";
import { api, type Lead } from "@/lib/api";
import { useFormat } from "@/lib/useFormat";

export function LeadsPanel() {
  const t = useTranslations("settings.leads");
  const { formatDateTime } = useFormat();
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listLeads()
      .then((rows) => {
        if (!cancelled) setLeads(rows);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        toast.error(e instanceof Error ? e.message : t("loadFailed"));
        setLeads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function setStatus(id: string, status: Lead["status"]) {
    try {
      const updated = await api.patchLead(id, { status });
      setLeads((prev) => prev?.map((l) => (l.id === id ? updated : l)) ?? prev);
      toast.success(t("updated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("updateFailed"));
    }
  }

  return (
    <div className="cl-rise rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Inbox className="size-4 text-primary" />
        {t("title")}
      </div>

      {leads === null ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("loading")}
        </div>
      ) : leads.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {leads.map((lead) => (
            <li key={lead.id} className="space-y-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{lead.name}</span>
                  <span className="text-sm text-muted-foreground">· {lead.organization}</span>
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                    {t(`interest.${lead.interest}`)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(lead.created_at)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                  {lead.email}
                </a>
                {lead.phone ? ` · ${lead.phone}` : ""}
                {lead.role ? ` · ${lead.role}` : ""}
              </p>
              {lead.message && (
                <p className="line-clamp-3 text-sm text-foreground/90">{lead.message}</p>
              )}
              <div className="max-w-44">
                <NativeSelect
                  aria-label={t("statusLabel")}
                  value={lead.status}
                  onChange={(e) => void setStatus(lead.id, e.target.value as Lead["status"])}
                  className="h-8 text-xs"
                >
                  <option value="new">{t("status.new")}</option>
                  <option value="contacted">{t("status.contacted")}</option>
                  <option value="closed">{t("status.closed")}</option>
                </NativeSelect>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
