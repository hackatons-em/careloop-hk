# CareLoop

**Remote chronic-care monitoring for elderly Hong Kong patients — between clinic visits.**

Live: **https://careloop-hk.vercel.app** · Disclosure: [`HONESTY.md`](./HONESTY.md) · In-app: `/honesty`

Patients check in over **WhatsApp** (text or Cantonese voice note). CareLoop transcribes and
extracts the message into structured data, runs a **deterministic, auditable rule engine** to decide
severity, and surfaces only the patients a nurse needs to review — with caregiver alerts, weekly
clinician summaries, and FHIR-style exports.

CareLoop is **monitoring support, not a medical device.** It does not diagnose or prescribe. AI is
used only for the *language* layer (transcription, extraction, message wording); **clinical severity
is always decided by explicit rules, never by an LLM.**

## How it works

```
WhatsApp check-in (text / Cantonese voice)
  → speech-to-text (Whisper)                     — language
  → symptom extraction (Claude → structured JSON) — language
  → deterministic risk rules (lib/riskEngine.ts)  — severity, auditable
  → exception-first nurse review queue
  → caregiver alert (EN + 繁體中文) · weekly clinician PDF · FHIR-style export
```

The agent asks AI-worded follow-up questions until the day's check-in is complete; the rule engine
re-evaluates on every message and raises an alert the moment a red flag appears.

## Features

- **WhatsApp agent** — real Twilio inbound/outbound; text and Cantonese voice notes; a new number is
  auto-assigned its own patient that fills from the sender's replies.
- **Deterministic risk engine** — `lib/riskEngine.ts`, unit-tested; every alert carries the matched
  rules and the data evidence that fired them.
- **Nurse dashboard** — exception-first review queue (acknowledge, status, notes), and a per-patient
  timeline of weight / blood pressure / heart rate / activity with a risk trend.
- **Caregiver alert** — plain-language English + Traditional Chinese.
- **Weekly clinician summary** with server-rendered **PDF**, and **FHIR-style JSON export**
  (Patient / Observation / QuestionnaireResponse / ServiceRequest).
- **Append-only audit trail**; one-click demo reset, risky-check-in replay, and CSV vitals import.

## Tech stack

- **App:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v4, shadcn / base-ui, Recharts.
- **Backend:** Supabase Postgres (Row-Level Security; the server uses a service-role key that never
  reaches the browser). All patient, conversation, alert, and audit data is persisted.
- **WhatsApp:** Twilio. **Speech-to-text:** Groq Whisper (or OpenAI). **Language AI:** Anthropic Claude.
- **PDF:** `@react-pdf/renderer`. Deploys as a single app on **Vercel**.

## Deterministic rules

| Rule | Condition | Severity |
| --- | --- | --- |
| HF-001 | weight ↑ ≥ 2 kg over 3 days | Review today |
| HF-002 | weight gain + shortness of breath + swelling | Escalate |
| MED-001 | medication missed 2 days in a row | Review today |
| BP-001 | systolic > 180 or diastolic > 110 mmHg | Escalate |
| ACT-001 | activity > 40% below baseline for 3 days | Watch |
| SYM-001 | patient reports breathlessness / swelling / chest discomfort | Review today |

Thresholds are demonstration values informed by ESC/HFSA and ACC/AHA guidance — not clinically
validated. See [`HONESTY.md`](./HONESTY.md).

## Try it

**Live demo:** open https://careloop-hk.vercel.app — the nurse dashboard shows the seeded patients.
Use **Run risky check-in** (Demo tools) to replay Mrs. Chan's deterioration and watch an alert
escalate. For the WhatsApp loop, open `/onboard`, scan the QR (or message the Twilio sandbox with the
join code), then reply to the check-in and watch the dashboard update.

**Run locally:**

```bash
npm install
cp .env.example .env.local     # set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (required)
npm run dev                    # http://localhost:3000
```

```bash
npm test                       # Vitest — risk engine + seed/CSV/FHIR (DB-backed tests skip without SUPABASE_*)
npm run build                  # production build
```

A Supabase project is required (apply `supabase/migrations/*.sql`). Seed or reset the demo data with
`POST /api/demo/reset`. AI / WhatsApp / STT keys are optional — without them the app falls back to
templates and a pinned transcript, so it still runs end-to-end (see `.env.example`).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | yes | Postgres backend (server-only) |
| `ANTHROPIC_API_KEY` | no | Symptom extraction + message/summary wording (else templates) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | no | WhatsApp send + voice-note download |
| `GROQ_API_KEY` (or `OPENAI_API_KEY`) | no | Voice-note speech-to-text (else pinned transcript) |

See `.env.example` for the full list (scheduler, sandbox onboarding, model overrides).

## Safety & honesty

CareLoop is monitoring support — not a diagnosis or treatment tool, and not a replacement for a
clinician or emergency service. All demo data is synthetic; no secrets are committed.
[`HONESTY.md`](./HONESTY.md) and the in-app `/honesty` page document exactly what is real vs mocked.
