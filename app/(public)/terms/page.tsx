export const metadata = {
  title: "Terms of use",
  description: "Terms of use for the CareLoop monitoring platform.",
};

// Baseline terms for pilot deployments — review with legal counsel before any
// production contract.
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Terms of use</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: June 2026</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-secondary-foreground/90">
        <h2 className="text-base font-semibold text-foreground">Not a medical device</h2>
        <p>
          CareLoop is monitoring support software. It flags monitoring signals for professional
          review using deterministic, auditable rules. It does not diagnose, prescribe, or provide
          treatment recommendations, and it is not a substitute for clinical judgment or emergency
          services. In an emergency, call local emergency services immediately.
        </p>

        <h2 className="text-base font-semibold text-foreground">Authorized use</h2>
        <p>
          The nurse dashboard and patient records are restricted to staff accounts provisioned by
          the deploying organization&apos;s administrator. Accounts are personal; credentials must
          not be shared. The organization is responsible for revoking access when staff leave.
        </p>

        <h2 className="text-base font-semibold text-foreground">Service expectations</h2>
        <p>
          Daily check-ins depend on third-party messaging (WhatsApp via Twilio) and patient
          response; the care team remains responsible for following up on missed check-ins.
          CareLoop is provided as part of a service agreement with the deploying organization,
          which governs uptime, support, and liability.
        </p>

        <h2 className="text-base font-semibold text-foreground">Data</h2>
        <p>
          Use of patient data is governed by the deploying organization&apos;s agreements and the{" "}
          <a href="/privacy" className="text-primary underline-offset-2 hover:underline">
            privacy policy
          </a>
          .
        </p>
      </section>
    </article>
  );
}
