// Server-side monthly program-outcomes PDF (board/renewal report).
// The document is English/Helvetica/LTR by design (standard for HK hospital
// administration; deterministic layout). Every number comes from
// getProgramMetrics (recorded data only, no projections).
//
// Arabic glyphs: user-provided fields (org name, nurse names) use a registered
// Noto Naskh Arabic face via pdfFontFor() so Arabic renders instead of tofu;
// Latin text stays Helvetica. If @react-pdf's bidi engine throws on a
// pathological mixed-script string, we retry once with Arabic disabled so the
// export never fails. (CJK names remain a separate, documented limitation —
// Helvetica has no CJK glyphs.)

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { logger } from "./logger";
import { pdfFontFor } from "./pdfFonts";
import type { ProgramMetrics } from "./store";
import { SEVERITY_LABEL, type Severity } from "./types";
import { SEVERITY_STYLE } from "./severity";

const C = {
  primary: "#0d7a72",
  ink: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f8fafc",
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.45 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    paddingBottom: 8,
    marginBottom: 14,
  },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.primary },
  brandSub: { fontSize: 9, color: C.muted },
  docTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "right" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  metric: { width: "25%", paddingRight: 8, marginBottom: 8 },
  metricBox: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
  },
  metricLabel: { fontSize: 8, color: C.muted, marginBottom: 2 },
  metricValue: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  metricSub: { fontSize: 7.5, color: C.muted, marginTop: 2 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
    marginTop: 8,
  },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  barLabel: { width: 90, fontSize: 9 },
  barTrack: { flex: 1, height: 8, backgroundColor: C.bg, borderRadius: 2 },
  barCount: { width: 28, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 9 },
  spark: { flexDirection: "row", alignItems: "flex-end", height: 50, marginTop: 4 },
  nurseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 3,
  },
  disclaimer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    fontSize: 8,
    color: C.muted,
  },
});

type Styles = typeof styles;

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function minutes(m: number | null): string {
  if (m === null) return "—";
  if (m < 60) return `${m} min`;
  return `${Math.round((m / 60) * 10) / 10} h`;
}

export async function renderProgramPdf(args: {
  orgName: string;
  metrics: ProgramMetrics;
  generatedAt: string;
  /** Accepted for API symmetry with the weekly PDF; layout is locale-agnostic. */
  locale?: string | null;
}): Promise<Buffer> {
  const { orgName, metrics: m, generatedAt } = args;
  const severities: Severity[] = ["watch", "review_today", "escalate"];
  const totalAlerts = severities.reduce((acc, s) => acc + (m.alerts_by_severity[s] ?? 0), 0);
  const maxDay = Math.max(1, ...m.daily_checkins.map((d) => d.count));
  const completionOnTarget = m.checkin_completion_rate >= 0.7;

  const build = (useArabic: boolean) => (
    <Document title="Miruwa program outcomes" author="Miruwa">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>Miruwa</Text>
            <Text style={[styles.brandSub, { fontFamily: pdfFontFor(orgName, { useArabic }) }]}>
              {orgName}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Program outcomes — last {m.window_days} days</Text>
            <Text style={[styles.brandSub, { textAlign: "right" }]}>Generated {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <Metric
            styles={styles}
            label="Check-in completion"
            value={pct(m.checkin_completion_rate)}
            sub={
              completionOnTarget
                ? "Meets the >=70% pilot commitment"
                : "Below the 70% pilot commitment"
            }
          />
          <Metric
            styles={styles}
            label="Medication adherence"
            value={pct(m.adherence_rate)}
            sub="Of check-ins reporting medication"
          />
          <Metric
            styles={styles}
            label="Median time to acknowledge"
            value={minutes(m.ack_minutes.median)}
            sub={`p90 ${minutes(m.ack_minutes.p90)} - ${m.ack_minutes.samples} alerts`}
          />
          <Metric
            styles={styles}
            label="Patients monitored"
            value={String(m.active_patients)}
            sub={`${m.silent_patients} currently not responding`}
          />
        </View>

        <Text style={styles.sectionTitle}>Daily completed check-ins</Text>
        <View style={styles.spark}>
          {m.daily_checkins.map((d) => (
            <View
              key={d.date}
              style={{
                flex: 1,
                marginRight: 1,
                height: Math.max(2, (d.count / maxDay) * 50),
                backgroundColor: d.count === 0 ? C.border : C.primary,
                borderTopLeftRadius: 1,
                borderTopRightRadius: 1,
              }}
            />
          ))}
        </View>
        <Text style={styles.metricSub}>
          {m.daily_checkins[0]?.date} to {m.daily_checkins[m.daily_checkins.length - 1]?.date}
        </Text>

        <Text style={styles.sectionTitle}>Alerts raised, by severity</Text>
        {severities.map((s) => {
          const count = m.alerts_by_severity[s] ?? 0;
          return (
            <View key={s} style={styles.barRow}>
              <Text style={styles.barLabel}>{SEVERITY_LABEL[s]}</Text>
              <View style={styles.barTrack}>
                <View
                  style={{
                    width: totalAlerts > 0 ? `${(count / totalAlerts) * 100}%` : "0%",
                    height: 8,
                    backgroundColor: SEVERITY_STYLE[s].hex,
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          );
        })}
        <Text style={styles.metricSub}>
          {m.sla_breaches_in_window} acknowledgement-window breach event(s) recorded in the audit trail.
        </Text>

        <Text style={styles.sectionTitle}>Open alerts by assignee</Text>
        {Object.entries(m.open_alerts_by_nurse)
          .sort(([, a], [, b]) => b - a)
          .map(([nurse, count]) => (
            <View key={nurse} style={styles.nurseRow}>
              <Text style={{ fontFamily: pdfFontFor(nurse, { useArabic }) }}>
                {nurse && nurse !== "Unassigned" ? nurse : "Unassigned (no nurse)"}
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{count}</Text>
            </View>
          ))}
        {Object.keys(m.open_alerts_by_nurse).length === 0 && (
          <Text style={styles.metricSub}>No open alerts.</Text>
        )}

        <Text style={styles.disclaimer}>
          Every figure in this report is computed from recorded monitoring data only — check-ins,
          vitals, alerts, and the append-only audit trail. Miruwa provides monitoring support, not
          diagnosis. Severity is decided by deterministic rules, never by AI.
        </Text>
      </Page>
    </Document>
  );

  try {
    return await renderToBuffer(build(true));
  } catch (err) {
    // @react-pdf/textkit bidi can throw on pathological mixed Arabic+number/dash
    // runs — retry with Arabic disabled so the export never fails.
    logger.warn("Program PDF render failed; retrying with Arabic fonts disabled.", { err });
    return await renderToBuffer(build(false));
  }
}

function Metric({
  styles,
  label,
  value,
  sub,
}: {
  styles: Styles;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricBox}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricSub}>{sub}</Text>
      </View>
    </View>
  );
}
