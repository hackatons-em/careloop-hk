export const metadata = {
  title: "Privacy policy",
  description: "How CareLoop handles patient monitoring data.",
};

// Baseline policy for pilot deployments — review with legal counsel before any
// production contract.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: June 2026</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-secondary-foreground/90">
        <h2 className="text-base font-semibold text-foreground">What CareLoop does</h2>
        <p>
          CareLoop provides monitoring support for chronic-care programs: it collects daily
          check-ins and vital readings, applies deterministic escalation rules, and surfaces
          results to the care team. CareLoop does not diagnose, prescribe, or replace clinical
          judgment.
        </p>

        <h2 className="text-base font-semibold text-foreground">Data we process</h2>
        <p>
          On behalf of the deploying healthcare organization, CareLoop processes: patient
          identification details entered by the care team (name, age, conditions, caregiver
          contact), WhatsApp messages and voice-note transcripts sent to the check-in number,
          vital readings (weight, blood pressure, heart rate, activity, sleep), and the resulting
          risk evaluations. An append-only audit trail records every access and action for
          accountability.
        </p>

        <h2 className="text-base font-semibold text-foreground">Where it lives and who sees it</h2>
        <p>
          Data is stored in the organization&apos;s dedicated database (Supabase Postgres) and is
          scoped to that organization. Access requires a staff account provisioned by the
          organization&apos;s administrator. Voice notes are transcribed and free-text messages are
          structured using AI services (speech-to-text and language models); these services
          process message content only and never decide clinical severity.
        </p>

        <h2 className="text-base font-semibold text-foreground">Retention and rights</h2>
        <p>
          The deploying organization controls retention and deletion. Patients and caregivers can
          direct questions, correction requests, or deletion requests to their care provider, who
          administers the data. Hong Kong&apos;s Personal Data (Privacy) Ordinance (PDPO) applies to
          deployments in Hong Kong.
        </p>

        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p>
          For privacy questions about a specific deployment, contact the deploying
          organization&apos;s administrator.
        </p>
      </section>
    </article>
  );
}
