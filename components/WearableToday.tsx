"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Watch, Plus, Copy, ExternalLink, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { IntradayChart, type IntradayPoint } from "@/components/charts/IntradayChart";
import { Button } from "@/components/ui/button";
import { api, type WearableTodayResponse } from "@/lib/api";

const POLL_MS = 60_000;

function pointsFor(data: WearableTodayResponse | null, type: string): IntradayPoint[] {
  if (!data) return [];
  return data.samples.filter((s) => s.type === type).map((s) => ({ t: s.timestamp, value: s.value }));
}

/** Live "today" wearable panel: device-connection chip, a "Connect device" QR
 * flow, and intraday charts (HR / SpO₂ / steps). Polls every 60s so the doctor
 * sees data build through the day. Renders nothing when wearables are off. */
export function WearableToday({ patientId }: { patientId: string }) {
  const t = useTranslations("patient.wearable");
  const [data, setData] = useState<WearableTodayResponse | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);
  // "now" is captured in the poll effect (never during render) so the relative
  // "synced N min ago" label stays a pure function of state.
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    try {
      setData(await api.wearableToday(patientId));
    } catch {
      /* keep last good data */
    }
  }, [patientId]);

  useEffect(() => {
    const tick = async () => {
      setNow(Date.now());
      await load();
    };
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function connect() {
    setConnecting(true);
    try {
      const { url } = await api.wearableConnect(patientId);
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 });
      setQr({ url, dataUrl });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("connectError"));
    } finally {
      setConnecting(false);
    }
  }

  const hr = pointsFor(data, "heart_rate");
  const spo2 = pointsFor(data, "spo2");
  const steps = pointsFor(data, "steps");
  const hasData = hr.length > 0 || spo2.length > 0 || steps.length > 0;
  const connection = data?.connection ?? null;

  function syncLabel(lastSyncAt: string | null): string {
    if (!lastSyncAt || now === 0) return t("never");
    const mins = Math.max(0, Math.floor((now - Date.parse(lastSyncAt)) / 60000));
    return mins < 1 ? t("syncedJustNow") : t("syncedAgo", { mins });
  }
  function formatProvider(p: string): string {
    return p ? p.charAt(0) + p.slice(1).toLowerCase() : "";
  }

  return (
    <div className="cl-rise rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <Watch className="size-4 text-primary" />
          {t("title")}
          {connection && (
            <SyncBadge
              providerName={formatProvider(connection.provider)}
              label={syncLabel(connection.last_sync_at)}
            />
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={connect}
          disabled={connecting}
        >
          {connecting ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          {connection ? t("addDevice") : t("connectButton")}
        </Button>
      </div>

      {qr && (
        <div className="mb-3 flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">{t("connectHint")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.dataUrl} alt={t("connectHint")} className="size-44 rounded-lg bg-white p-2" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={qr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ExternalLink className="size-3.5" /> {t("openLink")}
            </a>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                void navigator.clipboard?.writeText(qr.url);
                toast.success(t("copied"));
              }}
            >
              <Copy className="size-3.5" /> {t("copyLink")}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setQr(null)}>
              <X className="size-3.5" /> {t("close")}
            </Button>
          </div>
          <p className="max-w-xs text-[11px] text-muted-foreground">{t("consentNote")}</p>
        </div>
      )}

      {!connection && !qr && (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("notConnected")}</p>
      )}
      {connection && !hasData && (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("noDataYet")}</p>
      )}

      {hasData && (
        <div className="space-y-4">
          {hr.length > 0 && (
            <Metric label={t("metrics.heart_rate")}>
              <IntradayChart
                data={hr}
                color="var(--chart-2)"
                unit="bpm"
                name={t("metrics.heart_rate")}
                ariaLabel={t("metrics.heart_rate")}
              />
            </Metric>
          )}
          {spo2.length > 0 && (
            <Metric label={t("metrics.spo2")}>
              <IntradayChart
                data={spo2}
                color="var(--chart-1)"
                unit="%"
                name={t("metrics.spo2")}
                domain={[80, 100]}
                ariaLabel={t("metrics.spo2")}
              />
            </Metric>
          )}
          {steps.length > 0 && (
            <Metric label={t("metrics.steps")}>
              <IntradayChart
                data={steps}
                color="var(--chart-3)"
                name={t("metrics.steps")}
                ariaLabel={t("metrics.steps")}
              />
            </Metric>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function SyncBadge({ providerName, label }: { providerName: string; label: string }) {
  return (
    <span className="ms-1 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
      {providerName ? `${providerName} · ` : ""}
      {label}
    </span>
  );
}
