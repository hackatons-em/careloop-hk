# HONESTY.md

> Mandatory disclosure for the hackathon. This file lives at the root of your repository. Judges cross-check it against your code and your technical video.
>
> **The deal:** disclosed shortcuts are **not** penalized — that is the entire point of this file. Hidden ones are. Undisclosed pre-built code is heavily penalized, each undisclosed mock carries a small penalty, and a faked demo is heavily penalized. Telling the truth here costs you nothing.

CareLoop is a remote chronic-care monitoring prototype for elderly Hong Kong patients. Patients check in over WhatsApp (text or Cantonese voice); AI turns the messy reply into structured data; a **deterministic, auditable rule engine** — never an LLM — decides clinical severity; nurses review only the patients who need it. CareLoop is **monitoring support, not a medical device** — it never diagnoses, prescribes, or replaces clinical judgement.

---

## 1. Team — who did what
Judges compare this against `git shortlog -sn`, so keep it honest.

| Member | GitHub handle | Main contributions |
|---|---|---|
| Eman Cickusic | `eman-cickusic` | Lead. App scaffold, deterministic risk engine, nurse dashboard / alert queue / patient timeline, data + FHIR + audit layer, the **Supabase persistence migration**, security hardening, deploys. |
| Alexander Freitag | `alexander-freitag` | WhatsApp conversational agent (Twilio inbound/outbound, Whisper STT, Claude symptom extraction, multi-turn check-in) and the personalized onboarding flow. |
| Ferhad Jukic | `FerhadJukicc` | UI polish, landing + business pages, and the nurse-facing UI simplification. |

*Development was AI-assisted (Claude Code); the relevant commits carry `Co-Authored-By` trailers.*

---

## 2. What is fully working
Features that run end-to-end on the live app, with real data and real logic.

- **WhatsApp daily check-in (real Twilio).** A patient messages our WhatsApp number (text or Cantonese voice note); the inbound webhook runs the pipeline and replies in their WhatsApp chat. Input: a WhatsApp message → output: a structured check-in + a natural reply (a follow-up question, or a completion/escalation message).
- **Speech-to-text for voice notes** (Groq Whisper `whisper-large-v3`, OpenAI Whisper also supported). Input: a voice-note URL → output: transcript text.
- **AI symptom extraction** (Anthropic Claude). Input: free text / transcript → output: structured JSON (mood, shortness of breath, swelling, dizziness, chest discomfort, medication taken, weight).
- **Conversational agent.** Deterministically asks for any still-missing required field (AI-worded, in the patient's language) and accumulates the check-in until complete; escalation is decided by the rule engine, not the LLM.
- **Deterministic risk engine** (`lib/riskEngine.ts`, unit-tested in `lib/riskEngine.test.ts`). Input: a patient's vitals + check-ins → output: severity + the matched rules with the data evidence that fired each.
- **Nurse dashboard + exception-first review queue** — acknowledge, change status, add a note (persisted).
- **Patient timeline** — weight, blood pressure, heart rate, activity charts + per-day risk trend.
- **Bilingual caregiver alert** (English + 繁體中文), **weekly clinician summary + server-rendered PDF**, and **FHIR-style JSON export** (Patient / Observation / QuestionnaireResponse / ServiceRequest).
- **Append-only audit trail** for every action; one-click demo reset + "risky check-in" replay + CSV vitals import.
- **Persistent backend (Supabase Postgres).** Patients, vitals, check-ins, alerts, audit, summaries, and the full WhatsApp conversation (messages, sessions, phone↔patient links) survive restarts and are shared across serverless instances — the app runs on normal multi-instance Vercel.
- **Self-serve onboarding.** A new WhatsApp number is auto-assigned its own patient that then fills live from the sender's replies.

---

## 3. What is mocked, stubbed, or hardcoded
**Undisclosed mocks carry a small penalty each. Anything listed here = free.**

| What is faked | Where | Why we mocked it | What the real version would do |
|---|---|---|---|
| Patient population & 7-day history | `lib/seed.ts` | No real patients in a hackathon | Real enrolled patients + their real records |
| Wearable vitals (weight, BP, HR, steps, sleep) | `lib/seed.ts`, `sample_data/`, `lib/csv.ts` | No device hardware | Apple Health / Fitbit / smart scale / BP-cuff sync |
| WhatsApp transport = Twilio **sandbox** | `lib/whatsapp.ts`, `app/api/whatsapp/inbound/route.ts` | No approved WhatsApp Business sender | Production WhatsApp Business API (verified sender, no join step, no daily cap) |
| Voice-note transcript fallback | `lib/stt.ts` (`PINNED_DEMO_TRANSCRIPT`) | Demo works with no STT key | Always real Whisper transcription (it already runs when a key is set) |
| AI wording fallback to fixed templates | `lib/followup.ts`, `lib/summaryService.ts` | Agent must never stall without a key | Claude writes every message (it already does when the key is set) |
| FHIR export | `lib/fhirService.ts` | Illustrate interoperability | Certified FHIR exchange against a real EHR endpoint |

The deterministic risk engine and the AI extraction are **real logic, not mocks** (no if/else "fake AI", no canned responses).

---

## 4. External APIs, services & data sources
Everything the project calls. Marked real or mocked.

| Service / API / dataset | Used for | Real call or mocked? | Auth |
|---|---|---|---|
| Supabase (Postgres / PostgREST) | All persistence (core data + conversation) | **Real** | Service-role key, server-only; RLS deny-all |
| Twilio WhatsApp | Inbound webhook + outbound messages | **Real** (sandbox / trial account) | Account SID + auth token (sandbox) |
| Anthropic Claude | Symptom extraction + message / summary wording | **Real** (optional) | API key; falls back to templates if absent |
| Groq Whisper (or OpenAI Whisper) | Voice-note speech-to-text | **Real** (optional) | API key; falls back to a pinned transcript if absent |

No other external service is called or faked.

---

## 5. Pre-existing code
**Undisclosed pre-built code is heavily penalized. Anything listed here = free.**

| Item | Source | Roughly how much | License |
|---|---|---|---|
| `create-next-app` scaffold | `npx create-next-app` starter (initial commit) | Boilerplate only | MIT |
| shadcn / base-ui UI primitives | generated via the shadcn CLI (`components/ui/*`) | A handful of components | MIT |
| npm libraries | Next.js, React, Tailwind, Recharts, `@react-pdf/renderer`, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `qrcode`, lucide | Standard dependencies | Respective OSS licenses |

All CareLoop application code (risk engine, data layer, WhatsApp agent, dashboard, exports) was written during the hackathon window.

---

## 6. Known limitations & next steps
Naming these honestly is a strength, not a flaw.

- **Twilio trial daily message cap.** On a trial account, replies fail with error `63038` once the daily quota is used; sustained multi-user testing needs the account upgraded off trial (no code change).
- **Single shared demo dataset.** All testers act on the same patients unless they onboard their own via WhatsApp; the one-click reset reseeds a known state for everyone.
- **No nurse-side authentication or access control** — the dashboard and demo/agent endpoints are open (synthetic data only). The database itself is locked down (RLS, server-only service-role key) and inbound media fetches are host-allowlisted to Twilio.
- **Inbound webhook Twilio-signature verification is currently disabled** for demo reliability (it was prototyped); production would re-enable it and set a cron secret.
- **Cantonese STT and the risk thresholds are not clinically validated** — demonstration values informed by ESC/HFSA and ACC/AHA guidance, not certified for clinical use.
- **No real device, hospital EHR, or Hong Kong eHealth+ integration** — wearable data is CSV/seed; FHIR export is illustrative.
- **Next:** production WhatsApp Business API · real device + EHR integrations · per-clinic data isolation + authentication · clinical validation of the rules · photo/short-video replies (vision, not yet processed).
