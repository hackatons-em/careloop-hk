# WhatsApp Business API (WABA) — setup guide

The longest-lead item to go live. Start now; Meta's reviews are the wait.
Miruwa already speaks to **Twilio**, so we register a WhatsApp sender **through
Twilio** (Twilio sits on top of Meta's WhatsApp Business Platform). Do **not**
switch to Meta Cloud API direct — the app's webhook + code target Twilio.

## Who owns the WhatsApp account (important — read this)
Two models exist. For Miruwa the realistic one is **vendor-owned**:
- **Vendor-owned WABA (use this):** *Miruwa* owns one WhatsApp Business Account,
  verified under *Miruwa's* business, and provisions a **dedicated sender number
  per hospital** under it. Hospitals never touch Meta. → This means **Miruwa
  needs its own registered business entity** (any country — NOT HK-specific).
- **Client-owned WABA:** a large enterprise connects its own number/WABA. Rare;
  hospitals won't do this. Don't plan around it.

## What you'll need first (gather these now)
- **A registered business entity for Miruwa** (any country). Cheapest realistic
  routes for a solo founder: Bosnian sole trader (obrt), Estonia e-Residency OÜ,
  or US LLC (Stripe Atlas). Meta verifies *this* entity.
- **Meta Business Account** + **Business Verification** docs for that entity:
  registration certificate, business address, a **business website** (your domain)
  and business email.
- A **dedicated phone number** that is **NOT** already on any WhatsApp (personal or
  Business app) and can receive an SMS/voice code. One per hospital, all under your WABA.
- **Display name**: "Miruwa" (Meta reviews display names).
- The **message templates** in `whatsapp-templates.md` (already drafted).

> Before you have an entity: run demos + a tiny opt-in pilot on the **Twilio
> sandbox** (no verification needed). Incorporate once a clinic commits.

## Steps (in order)
1. **Meta Business Manager** → create the business → submit **Business
   Verification** (upload BR cert etc.). *This is the slow step — days to ~2 weeks.*
2. **Twilio Console → Messaging → Senders → WhatsApp senders → register a sender.**
   Connect your Meta Business; Twilio guides the WABA + number registration.
3. **Verify the phone number** (SMS/voice code) and set the **display name**;
   Meta reviews the name.
4. **Submit message templates** (the 4 UTILITY templates) → Meta approval
   (minutes–days each). At minimum `careloop_daily_checkin` must be approved
   before you can open conversations with patients.
5. In Miruwa: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and
   `TWILIO_WEBHOOK_URL` (byte-exact to `https://<domain>/api/whatsapp/inbound`),
   and point the sender's inbound webhook there (`DEPLOYMENT.md §4`).
6. **Smoke test** end to end (send template → reply → dashboard → alert).

## Things that bite people (plan for them)
- **Patient opt-in is mandatory.** WhatsApp requires explicit opt-in before you
  message someone. Capture it at enrolment (the consent fields / onboarding flow)
  and keep a record.
- **Messaging tier starts low.** New WABAs begin at ~**250 business-initiated
  conversations / 24h**, then scale with quality rating. Fine for a pilot; plan
  ramp for scale.
- **Templates only for business-initiated / >24h.** The same-day conversational
  follow-ups are free-form within the 24h window (no template).
- **Healthcare is allowed** under WhatsApp's Business/Commerce policy (health
  reminders/monitoring), but keep the "monitoring, not diagnosis / 並非診斷"
  framing and **no marketing without opt-in**.
- **Quality rating**: if patients block/report, your number's quality drops and
  limits tighten — another reason the deterministic, opted-in, useful daily
  message matters.

## Realistic timeline
- Business Verification: **a few days to ~2 weeks** (the long pole).
- Sender registration + number verify: hours–1 day after verification.
- Template approval: minutes–days each.
- **Net: budget ~1–3 weeks. Kick off Business Verification today.**

## Until WABA is live
The Twilio **sandbox** still works for demos — recipients must join with a code
(`/onboard` page shows it). Use it for buyer demos; you cannot onboard real
elderly patients on the sandbox.
