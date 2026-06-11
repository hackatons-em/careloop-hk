# Miruwa — production launch checklist

Status legend: ✅ done · 🔧 config/external (you) · 📝 draft ready, needs review

## Code / platform (mostly done)
- ✅ All DB migrations applied on the live project (init → rule_config → caregiver_notified_at).
- ✅ Crons wired (`/api/agent/send-round` 08:00 HKT, `/api/agent/sweep`).
- ✅ Consent registry, audit trail, notification + SLA chain, realtime, deny-all RLS.
- ✅ Privacy policy + Terms ("not a medical device") pages live.
- 🔧 Final security review (RLS deny-all, CSP, secrets only in Vercel env, webhook signature).

## Hard blockers to onboard a real hospital (external)
- 🔧 **WhatsApp Business API** — leave the Twilio sandbox: approved sender number +
  Meta business verification + the 4 templates in `whatsapp-templates.md` approved.
- 🔧 **Custom domain** — buy + DNS → Vercel; set `NEXT_PUBLIC_SITE_URL`.
- 🔧 **Resend domain verification** (SPF/DKIM/DMARC) — so nurse/caregiver/family emails
  deliver to anyone (today: owner inbox only). Set `RESEND_FROM_EMAIL`, `LEADS_NOTIFY_EMAIL`.
- 🔧 **Supabase custom SMTP** — for auth/team invites (built-in mailer ~2/hr).
- 🔧 **Prod secrets in Vercel** — `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
  `GROQ_API_KEY`/`OPENAI_API_KEY` (transcription); **`DEMO_MODE` off**.

## Per-customer provisioning
- 📝 Follow `provisioning-runbook.md` for each hospital (own instance, no demo data).

## Ops / reliability (recommended)
- 🔧 Uptime monitor on `/api/health`; Sentry DSNs; log drain; Upstash rate limiting;
  Supabase daily backups / PITR.

## Legal / commercial
- 📝 **DPA** — `docs/legal/DPA-TEMPLATE.md` ready; counsel to review + fill brackets.
- 📝 **Pilot agreement** — `docs/legal/PILOT-AGREEMENT-DRAFT.md` ready; counsel to review.
- 🔧 PDPO review + clinical-safety sign-off; confirm pricing + invoicing.
- 🔧 Track the **≥70% check-in response-rate** pilot metric from real data (Program page).

## Promo video (marketing asset)
- ✅ 16:9 master, 60fps, loudness-normalized (−14 LUFS): `Downloads/Miruwa-Promo-16x9.mp4`.
- ✅ English captions: `Downloads/Miruwa-Promo-16x9.en.srt`.
- 🔧 Human watch-through with sound (VO sync + mix); native zh-HK review of the new on-screen lines.
- 🔧 9:16 vertical + 15s/30s cuts (for social/ads); add a contact/URL to the CTA once the domain is set.
