# Data Processing Agreement — TEMPLATE (PDPO-aligned)

> **DRAFT — NOT LEGAL ADVICE.** To be reviewed and adapted by licensed Hong
> Kong counsel before signature. Designed to attach to the Pilot Agreement or
> a subscription agreement. Bracketed fields are placeholders.

**Data User (Controller):** [Hospital / Institution legal name] ("Customer")
**Data Processor:** [CareLoop legal entity name] ("Provider")

## 1. Subject matter & roles
Provider processes personal data on the Customer's behalf solely to provide
the CareLoop monitoring service. Customer determines the purposes and means;
Provider acts only on the Customer's documented instructions (this DPA, the
Agreement, and the Service's documented behavior).

## 2. Data processed
- **Data subjects:** patients enrolled by the Customer; their caregivers;
  Customer clinical staff (account data).
- **Categories:** patient identification details entered by staff (name, age,
  conditions, caregiver contact, WhatsApp number); WhatsApp messages and
  voice-note transcripts sent to the check-in number; vital readings (weight,
  blood pressure, heart rate, activity, sleep); deterministic risk
  evaluations; staff account details; append-only audit records.
- **Sensitivity:** includes health data — treated with the protections in §4.

## 3. Sub-processors
Provider uses the following sub-processors, each bound by data-protection
obligations no less protective than this DPA:

| Sub-processor | Purpose | Data touched | Region |
|---|---|---|---|
| Supabase | Managed Postgres database + authentication | All stored data | [customer-selected region] |
| Vercel | Application hosting | Data in transit through the app | [region/edge] |
| Twilio | WhatsApp message transport | Message content, phone numbers | [per Twilio] |
| Anthropic | Language structuring (symptom extraction, summary wording) | Message text only; never decides clinical severity | [per Anthropic] |
| Groq or OpenAI | Voice-note transcription | Voice audio → text | [per provider] |

Provider gives [30] days' notice of sub-processor changes; Customer may
object on reasonable data-protection grounds.

## 4. Security measures
- Dedicated instance per Customer: database, application deployment, and
  WhatsApp number exclusive to the Customer.
- Encryption in transit (TLS 1.2+) and at rest (AES-256).
- Role-based access (administrator/nurse), provisioned only by the
  Customer's administrator; no public registration.
- Server-side authorization checks on every request; webhook signature
  validation; rate limiting.
- Append-only audit trail of access and actions, attributed to the signed-in
  user, available to the Customer.
- Daily automated backups; [point-in-time recovery on enterprise tier].
- Provider personnel access on a need-to-support basis, logged.

## 5. PDPO compliance
- Provider assists the Customer in meeting its obligations under the
  Personal Data (Privacy) Ordinance (Cap. 486), including Data Protection
  Principles 2 (accuracy/retention), 3 (use), 4 (security), and responses to
  data access/correction requests (DPP6) within [10] business days of
  Customer request.
- Provider does not use Customer personal data for any purpose other than
  providing the Service (no training of models, no marketing, no resale).

## 6. Data subject requests & incidents
- Provider forwards any direct data-subject request to the Customer within
  [3] business days and assists with fulfilment.
- Personal-data breach: Provider notifies the Customer without undue delay
  and within [48] hours of becoming aware, with the information reasonably
  required for the Customer's PCPD notification assessment.

## 7. Retention, return & deletion
- Retention follows the Customer's instructions/configuration.
- On termination, Provider returns (export in machine-readable form: CSV /
  FHIR-style JSON) and/or deletes all Customer personal data within [30]
  days, and certifies deletion on request, excepting backups which expire on
  their [35-day] cycle.

## 8. Audit
Customer may audit Provider's compliance [once annually / on reasonable
notice], via written questionnaire or, where reasonably required, a remote
review session. Provider shares its security documentation and questionnaire
answers with evaluating Customers.

## 9. Liability & general
Liability follows the main Agreement's cap and exclusions. Governing law:
Hong Kong SAR.

**Signatures**

| Provider | Customer |
|---|---|
| Name: | Name: |
| Title: | Title: |
| Date: | Date: |
