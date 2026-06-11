# Miruwa — Go-To-Market Checklist (founder actions)

Everything here is OUTSIDE the codebase — accounts, approvals, and contracts
only you can do. The product is ready; these unlock selling it.

> **Status decisions (2026-06-10, founder-confirmed):** Resend → **LIVE**
> (key set on Vercel production, send tested end-to-end, deployed); native
> zh-HK sign-off → **DONE**; Sentry → deferred (JSON logs + GitHub uptime
> monitor cover ops); domain → `careloop-hk.vercel.app` accepted for pilots;
> WABA application and legal review → owned by the founder per the sections
> below. Each remaining item activates in minutes once its credential/approval
> exists — the wiring is already shipped.

## Domain & brand
- [ ] Buy the production domain (e.g. `careloop.health` / `careloop.hk`)
- [ ] Add it to the Vercel vendor project; update `NEXT_PUBLIC_SITE_URL`
- [ ] Re-register the Twilio webhook + `TWILIO_WEBHOOK_URL` for the new domain

## WhatsApp (longest lead time — start now)
- [ ] Meta Business verification for your company
- [ ] Apply for a WhatsApp Business API sender via Twilio (per-hospital senders
      are provisioned later per `docs/PROVISIONING.md` §4)
- [ ] Realistic timeline: **2–6 weeks**. The current sandbox (join-code) is
      demo-only: daily message caps, shared number, join friction

## Email
- [x] Resend account created; `RESEND_API_KEY` (send-only restricted key) set
      on Vercel **production**, `LEADS_NOTIFY_EMAIL=cickusiceman@gmail.com`
      already set. Verified end-to-end 2026-06-10 (test send id
      `f00ac2b7-133e-4fef-945c-64d63433bba5` delivered) and prod redeployed —
      lead submissions now email a notification.
- [ ] **Testing-mode limit:** with no verified domain, Resend's
      `onboarding@resend.dev` sender only delivers to the *account owner's*
      email (cickusiceman@gmail.com — which is the current notify target, so
      lead pings work today). To notify a different/shared inbox OR send from a
      branded `@careloop` address, verify a sending domain in Resend and set
      `RESEND_FROM_EMAIL`. Do this alongside the custom-domain purchase.
- [ ] Preview-environment key not set (only matters for PR preview deploys;
      they degrade to DB-only, which is safe). Add later if needed via
      `vercel env add RESEND_API_KEY preview`.
- [ ] Configure Supabase custom SMTP on the demo project (team invites) —
      reuse the same Resend key once a domain is verified.

## Reliability & monitoring
- [ ] Create a Sentry project; set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`
      (+ the Vercel↔Sentry integration for source maps)
- [x] Uptime monitoring: `.github/workflows/uptime.yml` probes `/api/health`
      every 15 min and opens a GitHub issue (label `outage`) on failure —
      zero-account baseline. Upgrade to UptimeRobot / Checkly / BetterStack
      when you want SMS/phone paging
- [ ] Optional: public status page (BetterStack/openstatus) — hospitals ask
- [ ] Create an Upstash Redis database; set `UPSTASH_REDIS_REST_URL/TOKEN`
      (production-grade rate limiting across serverless instances)
- [ ] Review Vercel plan limits (cron frequency, log retention); consider Pro
- [ ] Confirm Supabase backups on every project; PITR for enterprise instances

## Legal (before the FIRST paying contract)
- [ ] Counsel review of `/privacy` and `/terms` (both marked "pilot baseline";
      now bilingual — review BOTH languages)
- [x] Pilot agreement template — DRAFTED at `docs/legal/PILOT-AGREEMENT-TEMPLATE.md`
      (scope, fees, not-a-medical-device clause, success criteria, liability,
      termination); counsel adapts + approves before first signature
- [x] Data Processing Agreement template — DRAFTED at `docs/legal/DPA-TEMPLATE.md`
      (PDPO-aligned: roles, sub-processor table, security measures, breach
      notice, return/deletion, audit); counsel adapts + approves
- [x] Native-speaker sign-off of the zh-HK catalog (`messages/zh-HK.json`) —
      **completed by the founder (2026-06-10).** Backed by a prior 19-agent AI
      linguistic QA pass (15 corrections applied) and the reviewer package at
      `docs/ZH-HK-REVIEW-GUIDE.md`.
- [ ] Position statement: monitoring support, not a medical device (HONESTY.md
      wording is the base)

## Sales operations
- [ ] Check **Settings → Leads** daily (email ping is now live via Resend)
- [ ] Demo flow: the DEMO_MODE deployment + `/presentation` script; reset via
      Settings → Demo before every call
- [ ] Keep `docs/Careloop Pitch.pdf` + `/business` + `/security` as the
      send-after-meeting pack
- [ ] First pilot: use `docs/PROVISIONING.md` end-to-end; budget half a day
      plus the WhatsApp sender lead time

## Compliance roadmap (sell-ahead honestly)
- [ ] SOC 2 Type I engagement (the `/security` page already promises the
      roadmap honestly — keep it truthful)
- [ ] Security questionnaire answer bank (start from SECURITY.md + /security)
