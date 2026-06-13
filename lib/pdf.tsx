// Server-side weekly clinician PDF (uses @react-pdf/renderer in Node).
// Marked external in next.config.ts. Imported only by the PDF route handler.
//
// English/Helvetica/LTR by design. User-provided fields (patient/nurse/caregiver
// names, conditions, living situation) use a registered Noto Naskh Arabic face
// via pdfFontFor() so Arabic renders instead of tofu; Latin stays Helvetica. A
// bidi failure retries once with Arabic disabled so the export never fails.

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatDayYear } from "./format";
import { logger } from "./logger";
import { pdfFontFor } from "./pdfFonts";
import { SEVERITY_STYLE } from "./severity";
import type { SummaryStats } from "./summaryService";
import { SEVERITY_LABEL, type Patient } from "./types";

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
    marginBottom: 12,
  },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.primary },
  brandSub: { fontSize: 9, color: C.muted },
  docTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "right" },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: { flexDirection: "row", flexWrap: "wrap" },
  kv: { width: "50%", marginBottom: 3, flexDirection: "row" },
  k: { width: 90, color: C.muted },
  v: { flex: 1, fontFamily: "Helvetica-Bold" },
  badge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  card: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  narrative: { fontSize: 10, lineHeight: 1.5 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10 },
  ruleChip: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    backgroundColor: "#eef2ff",
    color: "#3730a3",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    marginRight: 4,
  },
  disclaimer: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    fontSize: 8,
    color: C.muted,
  },
});

export interface PdfArgs {
  patient: Patient;
  stats: SummaryStats;
  narrative: string;
  generatedBy: "ai" | "template";
  /** Accepted for API symmetry; field fonts auto-detect Arabic per string. */
  locale?: string | null;
}

function signed(n: number | null): string {
  if (n === null) return "—";
  return n >= 0 ? `+${n}` : `${n}`;
}

function SummaryDoc({ patient, stats, narrative, generatedBy, useArabic }: PdfArgs & { useArabic: boolean }) {
  const sev = SEVERITY_STYLE[stats.endSeverity];
  // Arabic-aware font for a user-provided value (bold to match the `v` style).
  const vf = (text: string) => [styles.v, { fontFamily: pdfFontFor(text, { bold: true, useArabic }) }];
  return (
    <Document
      title={`Miruwa weekly summary — ${patient.name}`}
      author="Miruwa"
      subject="Weekly chronic-care monitoring summary"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>Miruwa</Text>
            <Text style={styles.brandSub}>Remote chronic-care monitoring · Hong Kong</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Weekly Clinician Summary</Text>
            <Text style={[styles.brandSub, { textAlign: "right" }]}>
              {formatDayYear(stats.weekStart)} – {formatDayYear(stats.weekEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.row}>
            <View style={styles.kv}>
              <Text style={styles.k}>Name</Text>
              <Text style={vf(patient.name)}>{patient.name}</Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Age / sex</Text>
              <Text style={styles.v}>
                {patient.age} · {patient.gender}
              </Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Conditions</Text>
              <Text style={vf(patient.conditions.join(", "))}>{patient.conditions.join(", ")}</Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Nurse</Text>
              <Text style={vf(patient.assigned_nurse)}>{patient.assigned_nurse}</Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Caregiver</Text>
              <Text style={vf(patient.caregiver_name)}>{patient.caregiver_name}</Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Living</Text>
              <Text style={vf(patient.living_status)}>{patient.living_status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly risk trend</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ marginRight: 6 }}>
              {SEVERITY_LABEL[stats.startSeverity]} →{" "}
            </Text>
            <Text style={[styles.badge, { backgroundColor: sev.hex }]}>
              {SEVERITY_LABEL[stats.endSeverity]}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vitals summary</Text>
          <View style={styles.row}>
            <View style={styles.kv}>
              <Text style={styles.k}>Weight</Text>
              <Text style={styles.v}>
                {stats.weightStart ?? "—"} → {stats.weightEnd ?? "—"} kg ({signed(stats.weightGainTotal)} kg)
              </Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>3-day Δ</Text>
              <Text style={styles.v}>{signed(stats.weightGain3d)} kg</Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Blood pressure</Text>
              <Text style={styles.v}>
                {stats.sysMin ?? "—"}–{stats.sysMax ?? "—"}/{stats.diaMin ?? "—"}–{stats.diaMax ?? "—"} mmHg
              </Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Heart rate</Text>
              <Text style={styles.v}>
                {stats.hrMin ?? "—"}–{stats.hrMax ?? "—"} bpm
              </Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Activity</Text>
              <Text style={styles.v}>
                {stats.stepsAvg ?? "—"} steps/day ({Math.abs(stats.stepsPctBelow ?? 0)}%{" "}
                {(stats.stepsPctBelow ?? 0) >= 0 ? "below" : "above"} baseline)
              </Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.k}>Adherence</Text>
              <Text style={styles.v}>
                {stats.medTakenDays}/{stats.totalCheckins} days
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <Text>
            Shortness of breath on {stats.sobDays} day(s); swelling on {stats.swellDays} day(s).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matched rules (deterministic)</Text>
          {stats.matchedCodes.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {stats.matchedCodes.map((c) => (
                <Text key={c} style={styles.ruleChip}>
                  {c}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={{ color: C.muted }}>No rules triggered.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Summary ({generatedBy === "ai" ? "AI-assisted wording" : "deterministic template"})
          </Text>
          <Text style={[styles.narrative, { fontFamily: pdfFontFor(narrative, { useArabic }) }]}>
            {narrative}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended review items</Text>
          {stats.reviewItems.map((item) => (
            <View key={item} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={[{ flex: 1 }, { fontFamily: pdfFontFor(item, { useArabic }) }]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data completeness</Text>
          <Text>{Math.round(stats.dataCompleteness * 100)}% of expected daily data this week.</Text>
        </View>

        <Text style={styles.disclaimer}>
          Miruwa flags monitoring risks for professional review. It does not diagnose,
          prescribe, or replace clinical judgement. Risk severity is determined by deterministic
          rules; AI is used only for wording. All data shown is synthetic demo data.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderSummaryPdf(args: PdfArgs): Promise<Buffer> {
  try {
    return await renderToBuffer(<SummaryDoc {...args} useArabic={true} />);
  } catch (err) {
    // @react-pdf/textkit bidi can throw on pathological mixed Arabic+number/dash
    // runs — retry with Arabic disabled so the export never fails.
    logger.warn("Weekly PDF render failed; retrying with Arabic fonts disabled.", { err });
    return await renderToBuffer(<SummaryDoc {...args} useArabic={false} />);
  }
}
