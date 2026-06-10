"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { api } from "@/lib/api";
import type { FollowUpTask } from "@/lib/types";
import { useFormat } from "@/lib/useFormat";

/**
 * Follow-up tasks due lane: open ward to-dos, overdue/today first. Hidden
 * entirely when there is nothing open — the dashboard stays exception-first.
 */
export function TasksLane() {
  const t = useTranslations("tasks");
  const { rows, audit } = useApp();
  const { formatDay } = useFormat();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .openTasks()
      .then(setTasks)
      .catch(() => {
        /* lane is auxiliary — stay quiet on transient failures */
      });
  }, []);

  // Refresh whenever app data refreshes (audit array identity changes on
  // every AppProvider refresh, including realtime pings).
  useEffect(() => {
    load();
  }, [load, audit]);

  async function done(id: string) {
    setBusyId(id);
    try {
      await api.completeTask(id);
      setTasks((ts) => ts.filter((x) => x.id !== id));
      toast.success(t("completed"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("completeFailed"));
    } finally {
      setBusyId(null);
    }
  }

  if (tasks.length === 0) return null;

  const nameById = new Map(rows.map((r) => [r.patient.id, r.patient.name]));
  const now = Date.now();

  return (
    <div className="cl-rise rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ListTodo className="size-4 text-primary" />
        {t("title")}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {tasks.slice(0, 6).map((task) => {
          const overdue = Date.parse(task.due_at) < now;
          return (
            <li key={task.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  <Link
                    href={`/patients/${task.patient_id}`}
                    className="font-semibold hover:text-primary hover:underline"
                  >
                    {nameById.get(task.patient_id) ?? task.patient_id}
                  </Link>{" "}
                  — {task.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {/* overdue is an operational state, not a clinical severity —
                      foreground emphasis only, no severity colors */}
                  <span className={overdue ? "font-semibold text-foreground" : undefined}>
                    {overdue ? t("overdue") : t("due")} {formatDay(task.due_at.slice(0, 10))}
                  </span>
                  {task.assigned_to ? ` · ${task.assigned_to}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === task.id}
                onClick={() => done(task.id)}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5 text-primary" /> {t("markDone")}
              </button>
            </li>
          );
        })}
      </ul>
      {tasks.length > 6 && (
        <p className="mt-2 text-xs text-muted-foreground">{t("more", { count: tasks.length - 6 })}</p>
      )}
    </div>
  );
}
