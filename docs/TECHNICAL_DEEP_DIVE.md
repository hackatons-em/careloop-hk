# Miruwa — Technical Deep Dive (2-min screen recording)

Read-aloud script for the technical video. Just read the indented lines top to
bottom — each line is about one breath, broken where you'd naturally pause.
`[DO]` lines are actions on screen, not spoken. Target ~2 minutes.

## Setup (before you hit record)

- **Left of screen:** Miruwa on a patient's detail page (the live WhatsApp panel visible).
- **Right of screen:** a phone with WhatsApp, already connected to that demo patient.
- Have a **voice note** ready that says: _"My breath is short."_
- Open the `/architecture` page in a tab.

---

## 0:00 – 0:40 · Architecture

`[DO]` Show the `/architecture` page.

> This is how Miruwa works under the hood.
>
> The patient lives entirely inside WhatsApp — there's no app to install.
> They scan a QR code once to onboard,
> then they just message our Twilio number.
> Twilio forwards every message into our app.
>
> We transcribe Cantonese voice notes with Groq Whisper,
> and we use Anthropic's Claude to turn each message into structured data and write the reply.
>
> But here's the key design decision:
> the AI never decides how serious anything is.
>
> That's a deterministic, unit-tested rule engine —
> same input, same output,
> every alert traceable to a rule and the data behind it.
>
> Everything is stored in Postgres on Supabase and surfaced on the nurse dashboard.
> The stack is Next.js and TypeScript, with Twilio, Anthropic, Groq, and Supabase — on Vercel.

---

## 0:40 – 2:00 · Live flow

`[DO]` Dashboard on the left, the patient's phone on the right.

> Now let's see it end to end.
> On the left is the nurse dashboard — patients ranked by risk, most urgent first.
> On the right is a patient's real phone.

`[DO]` Open the patient on the left so the live WhatsApp thread is visible.

> Here's this patient's live WhatsApp thread.

`[DO]` On the phone, send the voice note: _"My breath is short."_

> I'll send a voice note — exactly what an elderly patient would do.

`[DO]` Wait 2–3 seconds. The message appears on the left.

> Watch the left.
> The voice note hits our webhook, Whisper transcribes it,
> and it lands here in real time — you can see the transcript appear.
>
> Claude extracts the symptom — shortness of breath —
> and the rule engine fires SYM-001.
>
> The patient jumps to "Review today,"
> with the exact rule and the evidence that triggered it.

`[DO]` Point at the caregiver alert and the export.

> From here it's nurse-ready:
> a bilingual caregiver alert, in English and Traditional Chinese,
> a weekly clinician summary with a PDF,
> and a FHIR-style export.
>
> That's Miruwa:
> meet elderly patients where they already are,
> and turn their replies into safe, auditable nurse-review tasks —
> never an AI diagnosis.

---

_~2 minutes. The through-line: "My breath is short" → shortness of breath → rule
SYM-001 → "Review today", so the patient's risk visibly escalates on screen._
