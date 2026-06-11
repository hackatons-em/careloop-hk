# WhatsApp Business templates — for Meta / Twilio submission

Miruwa opens conversations with patients (the daily morning check-in) and with
caregivers (alerts). WhatsApp requires **pre-approved templates** for any
*business-initiated* message and for any message sent **>24h** after the
contact's last inbound message. Replies *within* the 24-hour customer-service
window (the back-and-forth of a same-day check-in) are free-form and need no
template.

Submit the templates below in **Twilio Console → Messaging → Content Template
Builder** (or Meta WhatsApp Manager). Categories matter for approval: these are
**UTILITY** (account/transactional), not MARKETING.

Variables: `{{1}}` = patient or caregiver name.

---

### 1. `careloop_daily_checkin` — UTILITY — zh-HK + en
Opens the daily check-in. Sent ~08:00 HKT by the cron round.
```
早晨，{{1}}。係時候做你今日嘅每日報到。今日身體覺得點呀？

Good morning, {{1}}. It's time for your daily check-in. How are you feeling today?
```

### 2. `careloop_checkin_reminder` — UTILITY — zh-HK + en
One gentle re-prompt if no reply by the afternoon cutoff (silence detection).
```
提提你，{{1}} — 今日嘅健康報到仲未完成。得閒嘅話，覆返我哋幾句就得。

A gentle reminder, {{1}} — today's check-in isn't complete yet. Whenever you're free, just reply with a few words.
```

### 3. `careloop_caregiver_alert` — UTILITY — zh-HK + en
Business-initiated message to a consented caregiver when a patient escalates.
`{{1}}` = caregiver name, `{{2}}` = patient name.
```
{{1}}你好。{{2}}今日嘅報到顯示有需要關注嘅變化，護理團隊已收到通知並會跟進。這是監測提示，並非診斷。

Hello {{1}}. {{2}}'s check-in today showed a change worth attention; the care team has been notified and will follow up. This is a monitoring alert, not a diagnosis.
```

### 4. `careloop_weekly_digest` — UTILITY — zh-HK + en (optional, family digest)
`{{1}}` = caregiver name, `{{2}}` = patient name.
```
{{1}}你好。這是{{2}}今週的健康摘要。整體情況平穩；如有任何變化，護理團隊會主動聯絡你。

Hello {{1}}. Here is {{2}}'s weekly health summary. Things look steady overall; the care team will reach out if anything changes.
```

---

**Notes for the reviewer**
- The conversational follow-up questions (shortness of breath, swelling,
  medication, etc.) are sent *inside* the 24-hour window after the patient's
  reply, so they are free-form and do **not** require templates.
- Keep the "not a diagnosis / 並非診斷" line in any caregiver-facing template —
  it matches the product's honest-claims stance and the Terms ("not a medical
  device").
- One dedicated WhatsApp sender number **per hospital** (matches the
  one-instance-per-customer model in the DPA).
- After approval, set `TWILIO_*` and `TWILIO_WEBHOOK_URL` (byte-exact to the
  customer's domain) per `DEPLOYMENT.md §4`.
