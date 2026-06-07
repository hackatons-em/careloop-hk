# CareLoop — Technical Deep Dive (2-min screen recording)

Read-aloud script for the technical deep-dive recording: ~40s architecture, then
the live flow on screen. Target ~2 minutes total.

## Setup (before recording)

- **Left of screen:** CareLoop open on the patient's detail page (the live WhatsApp panel visible).
- **Right of screen:** a phone with WhatsApp, already connected to the demo patient.
- Prepare a **voice note** saying _"My breath is short."_
- Have the architecture page ready: `/architecture`.

---

## 0:00–0:40 · Architecture — show `/architecture`

> This is how CareLoop works under the hood. The patient lives entirely inside
> WhatsApp — no app to install. They onboard once by scanning a QR code, then just
> message our Twilio number. Twilio forwards everything into our app. Our engine
> transcribes Cantonese voice notes with **Groq Whisper**, and uses **Anthropic's
> Claude** to turn each message into structured data and write the reply. But —
> key design decision — **the AI never decides how serious anything is.** That's a
> **deterministic, unit-tested rule engine**: same input, same output, every alert
> traceable to a rule and the data behind it. It's all persisted in **Postgres on
> Supabase**, surfaced on the nurse dashboard. Stack: Next.js, TypeScript, Twilio,
> Anthropic, Groq, Supabase — on Vercel.

---

## 0:40–2:00 · Live flow — screenshare (dashboard left · phone right)

> Now let's see it end to end. On the left, the nurse dashboard — patients ranked
> by risk, exception-first. On the right, a patient's real phone.

**[Open the patient on the left so the live WhatsApp thread is visible]**

> Here's this patient's live WhatsApp thread.

**[On the phone, send the voice note: "My breath is short"]**

> I'll send a **voice note** — exactly what an elderly patient would do.

**[Wait ~2–3s — the message appears on the left]**

> Watch the left. The voice note hits our webhook, **Whisper transcribes it**, and
> it lands here in real time — you can see the transcript appear. **Claude**
> extracts the symptom — shortness of breath — and the **rule engine fires
> SYM-001**. The patient jumps to **"Review today,"** with the exact rule and the
> evidence that triggered it.

**[Point at the caregiver alert / export]**

> From here it's nurse-ready: a **bilingual caregiver alert** — English and
> Traditional Chinese — a weekly clinician summary with **PDF**, and a **FHIR-style
> export**. That's CareLoop: meet elderly patients where they already are, and turn
> their replies into safe, **auditable** nurse-review tasks — never an AI diagnosis.

---

_~300 words ≈ 2 minutes. "My breath is short" → shortness of breath → rule SYM-001
→ Review today, so the risk visibly escalates on screen._
