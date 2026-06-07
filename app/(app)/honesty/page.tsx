import { Check, X, ShieldAlert, Sparkles, Database, FileJson } from "lucide-react";
import { SafetyBanner } from "@/components/SafetyLabels";

export const metadata = { title: "Honesty — CareLoop" };

const REAL = [
  "Real WhatsApp integration via Twilio — inbound webhook + outbound send",
  "Text and Cantonese voice notes (Whisper speech-to-text)",
  "AI symptom extraction: free text / transcript → structured check-in",
  "Conversational agent: AI-written follow-ups, deterministic escalation",
  "Personalized WhatsApp onboarding (per-patient QR)",
  "Persistent backend — Supabase Postgres (RLS; service-role server-only)",
  "Deterministic, rule-based risk engine (unit-tested)",
  "Matched-rule explanations with data evidence",
  "Nurse review queue: acknowledge, status, notes",
  "Patient timeline — weight, BP, heart rate, activity charts",
  "Bilingual caregiver alert (English + 繁體中文)",
  "Weekly clinician summary + PDF export",
  "FHIR-style JSON export",
  "Audit events for every action; demo reset + risky replay + CSV import",
];

const MOCKED = [
  "Production WhatsApp Business API (uses the Twilio sandbox — daily message cap)",
  "Real Apple Health / Fitbit / Garmin integration (sample CSV)",
  "Real Hong Kong eHealth+ integration",
  "Real hospital EHR integration",
  "Real clinical validation of thresholds",
  "Real Cantonese clinical review",
  "Real emergency escalation & nurse staffing",
  "Nurse-side authentication / access control (open dashboard, synthetic data)",
  "Real patient identity proofing & clinical consent",
];

const RULES = [
  ["HF-001", "Weight increase ≥ 2 kg over 3 days", "Review today"],
  ["HF-002", "Weight gain + shortness of breath + swelling", "Escalate"],
  ["MED-001", "Medication missed 2 days in a row", "Review today"],
  ["BP-001", "Systolic > 180 or diastolic > 110 mmHg", "Escalate"],
  ["ACT-001", "Activity > 40% below baseline for 3 days", "Watch"],
  ["SYM-001", "Reports breathlessness / swelling / chest discomfort", "Review today"],
];

export default function HonestyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Honesty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What is real, what is mocked, and the safety boundaries. CareLoop is monitoring
          support — not diagnosis.
        </p>
      </div>

      <SafetyBanner />

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-emerald-800">
            <Check className="size-4" /> What is real
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {REAL.map((r) => (
              <li key={r} className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-amber-800">
            <X className="size-4" /> What is mocked or simulated
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {MOCKED.map((r) => (
              <li key={r} className="flex gap-2">
                <X className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-primary" /> AI usage
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AI (Anthropic Claude + a Whisper speech-to-text provider) powers the <strong>language
          layer only</strong>: transcribing voice notes, extracting structured symptoms from natural
          language, and wording the agent&apos;s follow-up questions, confirmations, and the weekly
          summary. Every step is gated behind its API key — with no key, or on any error, CareLoop
          falls back to fixed templates / a pinned transcript, so the product never depends on AI to
          function. AI never decides severity, diagnoses, or recommends treatment — risk is always
          the deterministic engine.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="size-4 text-primary" /> Deterministic risk engine
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Demonstration thresholds — not clinically validated.
        </p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Rule</th>
                <th className="px-3 py-2 font-medium">Condition</th>
                <th className="px-3 py-2 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map(([code, cond, sev]) => (
                <tr key={code} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs font-semibold">{code}</td>
                  <td className="px-3 py-2">{cond}</td>
                  <td className="px-3 py-2">{sev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Database className="size-4 text-primary" /> Data
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            All demo patient data is synthetic. No real patient, hospital, or eHealth+ data is
            included. It is stored in Supabase Postgres with Row-Level Security (no public policies;
            the service-role key stays server-side). No secrets are committed; keys are configured
            via environment variables.
          </p>
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileJson className="size-4 text-primary" /> FHIR export
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The FHIR-style JSON export demonstrates interoperability thinking. It is not certified
            for production clinical exchange.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
        <h2 className="font-semibold text-destructive">Safety boundaries</h2>
        <p className="mt-2 text-sm">
          CareLoop is not a medical device. It does not diagnose disease or prescribe treatment,
          and does not replace a doctor, nurse, pharmacist, or emergency service. All alerts are
          monitoring prompts for professional review. If a patient has severe symptoms, they should
          seek urgent medical care according to local emergency guidance.
        </p>
      </section>
    </div>
  );
}
