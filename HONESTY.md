# HONESTY.md — CareLoop

CareLoop is a **prototype** for remote chronic-care monitoring of elderly patients
in Hong Kong. Patients check in through **WhatsApp** (text or Cantonese voice
note); CareLoop turns those replies into structured monitoring data, runs
**deterministic** escalation rules, and surfaces only the patients who need a
nurse to review them.

**AI converts messy human communication into structured data and writes the
conversational messages. It never decides clinical severity — that is
deterministic, rule-based, and auditable. CareLoop does not diagnose, prescribe,
or replace clinical judgement.**

---

## What is real (implemented in this prototype)

**Patient communication layer (the wedge):**
- **Real WhatsApp integration** via Twilio (sandbox): inbound webhook + outbound
  send. The patient messages a real WhatsApp number and gets real replies.
- **Text and Cantonese voice notes** are both handled.
- **Speech-to-text** for voice notes (Groq Whisper `whisper-large-v3`; OpenAI
  Whisper also supported) — configurable provider.
- **AI symptom extraction** (Anthropic Claude): a free-text / transcribed message
  becomes a structured check-in (symptoms, medication, mood) as JSON.
- **Conversational agent**: if a reply is incomplete, the agent asks a natural
  **AI-written follow-up question** (in the patient's language) and accumulates
  the check-in step by step until complete; it short-circuits and escalates on a
  red-flag symptom. Replies come back in the language the patient used.
- **Outbound daily check-in**: the agent messages patients first (per patient or
  a "morning round"); an in-process scheduler can run it on a daily schedule.
- **Live conversation panel** in the nurse dashboard (the WhatsApp thread + the
  extraction per message).

**Clinical / workflow layer:**
- **Deterministic, rule-based risk engine** (`lib/riskEngine.ts`) — see rules below.
- Matched-rule explanations with the data evidence that triggered each rule.
- Nurse dashboard (5 synthetic patients), exception-first review queue,
  acknowledge / status / notes.
- Patient timeline — weight, blood pressure, heart rate, activity charts.
- Bilingual caregiver alert (English + Traditional Chinese 繁體中文).
- Weekly clinician summary + server-rendered PDF export.
- FHIR-style JSON export (Patient, Observations, QuestionnaireResponse, ServiceRequest).
- Append-only audit events; demo reset and a one-click "risky check-in" replay.
- **Persistent backend (Supabase Postgres):** patients, vitals, check-ins,
  alerts, audit, weekly summaries, and the full WhatsApp conversation (messages,
  check-in sessions, and phone↔patient links) are stored in Postgres — so state
  survives restarts and is shared across serverless instances, and the agent
  runs on normal multi-instance Vercel. Row-Level Security is enabled with no
  public policies; the server uses a service-role key that never reaches the
  browser.

The rule engine is covered by unit tests (`lib/riskEngine.test.ts`) — severity is
computed, never hard-coded.

## What is mocked / simulated / limited

- **WhatsApp delivery is the Twilio sandbox**, not the production WhatsApp
  Business API. Each tester first sends the sandbox join code, and the trial
  sandbox has a daily message cap. A demo onboarding flow lets you add a patient
  and scan its QR to bind your phone to it (a `careloop-link:` registration
  message); otherwise inbound numbers are mapped to demo patients by sticky
  round-robin. There is no real identity proofing or clinical consent.
- **No STT key configured → a voice note falls back to a pinned demo transcript**
  (flagged as `pinned` in the message log). With a key, real transcription runs.
- **Cantonese STT is not clinically validated** — it's good enough for the demo,
  not for production clinical use.
- **Single shared demo dataset.** All testers act on the same five synthetic
  patients (plus any added through the demo onboarding); a one-click reset
  reseeds the database to a known state for everyone, so the demo stays
  reproducible. A real deployment would isolate data per clinic and add
  authentication.
- **No real device integration** (Apple Health / Fitbit / scale / BP cuff) — CSV
  / seed data stands in for wearable vitals.
- **No real eHealth+ / hospital EHR integration.** FHIR export is illustrative.
- **No nurse-side authentication or access control.** The dashboard and the
  demo / agent endpoints are open (synthetic data only). The database itself is
  locked down — Row-Level Security with no public policies, and a server-only
  service-role key that never reaches the browser — and inbound media fetches
  are host-allowlisted to Twilio. The inbound webhook's Twilio-signature
  verification is currently disabled for the demo and the cron secret is
  optional; a production deployment would add auth, enable signature checks, and
  set the cron secret.
- Photo / short-video replies are part of the vision but are **not processed**
  yet (text + voice are).

## AI usage — exactly where, and where not

AI (Anthropic Claude + a Whisper STT provider) is used for the **language layer**:

- **Transcription** of voice notes (Whisper).
- **Extraction** of structured symptoms from natural language (Claude → JSON).
- **Wording** of the agent's follow-up questions, confirmations, and the weekly
  summary (Claude). If the API key is missing or a call fails, fixed templates
  are used so the agent never stalls — but in normal operation Claude writes them.

AI is **never** used for:

- Diagnosis or treatment / medication recommendations
- Emergency triage
- **Risk severity classification** — this is decided by the deterministic engine.

AI prompts are constrained: no diagnosis, no medication changes, no invented data.

## Risk engine (deterministic, demonstration only)

| Rule | Condition | Severity |
| --- | --- | --- |
| HF-001 | weight increase ≥ 2 kg over 3 days | Review today |
| HF-002 | weight gain (≥ 1.5 kg/3d) + shortness of breath + swelling | Escalate |
| MED-001 | medication missed 2 days in a row | Review today |
| BP-001 | systolic > 180 OR diastolic > 110 mmHg | Escalate |
| ACT-001 | activity > 40% below baseline for 3 days | Watch |
| SYM-001 | patient reports breathlessness / swelling / chest discomfort | Review today |

**Threshold provenance:** the HF weight-gain trigger (~2 kg / 3 days) reflects
heart-failure self-care guidance (e.g. ESC / HFSA), and the BP threshold reflects
hypertensive-crisis definitions (ACC/AHA define crisis at 180/120; we use a more
conservative 180/110). MED-001, ACT-001 and SYM-001 are operational heuristics.
**None of these are clinically validated in this system.**

## Safety boundaries

- CareLoop is **not a medical device**. It does not diagnose or prescribe.
- It does not replace a doctor, nurse, pharmacist, or emergency service.
- All alerts are monitoring prompts for **professional review**.
- Output is "nurse review required", never "disease detected".
- Patients with severe symptoms should seek urgent care per local guidance.

## Data & secrets

All demo patient data is **synthetic** — no real patient, hospital, or eHealth+
data. API keys, Twilio credentials, and the Supabase service-role key are
configured via `.env.local` (gitignored) locally and the Vercel project's
encrypted environment variables in production. **Never commit real keys**
(including in `.env.example`).

## Why this is still useful

It demonstrates a narrow, safe, operational workflow that solves the real
bottleneck — **adherence**, by meeting elderly patients in the channel they
already use:

```
daily WhatsApp check-in (text / Cantonese voice)
→ STT + AI extraction (language → structured data)
→ deterministic risk rules (severity, auditable)
→ exception-based nurse review
→ caregiver alert + clinician summary + FHIR-style export
```
