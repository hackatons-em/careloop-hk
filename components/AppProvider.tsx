"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { AuditEvent, PatientRow, RiskAlert } from "@/lib/types";

interface AppState {
  rows: PatientRow[];
  alerts: RiskAlert[];
  audit: AuditEvent[];
  busy: boolean;
  /** True while live refresh is failing (connectivity / server trouble). */
  degraded: boolean;
  refresh: () => Promise<void>;
  resetDemo: () => Promise<void>;
  runRiskyCheckIn: () => Promise<string | null>; // returns affected patient id
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export function AppProvider({
  children,
  initialRows,
  initialAlerts,
  initialAudit,
}: {
  children: React.ReactNode;
  initialRows: PatientRow[];
  initialAlerts: RiskAlert[];
  initialAudit: AuditEvent[];
}) {
  // Initial data is server-rendered from the store, so there's no mount fetch
  // (and no loading flash). refresh() pulls live data after any mutation.
  const [rows, setRows] = useState<PatientRow[]>(initialRows);
  const [alerts, setAlerts] = useState<RiskAlert[]>(initialAlerts);
  const [audit, setAudit] = useState<AuditEvent[]>(initialAudit);
  const [busy, setBusy] = useState(false);
  const [degraded, setDegraded] = useState(false);
  // Toast once per outage, not every 5s poll tick.
  const failStreak = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const [r, a, ev] = await Promise.all([api.patients(), api.alerts(), api.audit(60)]);
      setRows(r);
      setAlerts(a);
      setAudit(ev);
      if (failStreak.current >= 2) toast.success("Connection restored");
      failStreak.current = 0;
      setDegraded(false);
    } catch (e) {
      failStreak.current += 1;
      if (failStreak.current === 2) {
        setDegraded(true);
        toast.error(e instanceof Error ? e.message : "Failed to refresh data", {
          description: "Live updates are paused until the connection recovers.",
        });
      }
    }
  }, []);

  const resetDemo = useCallback(async () => {
    setBusy(true);
    try {
      await api.reset();
      await refresh();
      toast.success("Demo data reset to a clean state");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const runRiskyCheckIn = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.runRiskyCheckIn();
      await refresh();
      toast.warning("Risky check-in recorded for Mrs. Chan", {
        description: `Matched ${res.risk.matched_rules.map((m) => m.code).join(", ")} → ${res.risk.severity.replace("_", " ")}. Alert sent to nurse queue.`,
      });
      return res.checkin.patient_id;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not run risky check-in");
      return null;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  // Live updates: poll so the dashboard/alerts update when WhatsApp messages arrive.
  useEffect(() => {
    const t = setInterval(() => {
      void refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <Ctx.Provider
      value={{ rows, alerts, audit, busy, degraded, refresh, resetDemo, runRiskyCheckIn }}
    >
      {children}
    </Ctx.Provider>
  );
}
