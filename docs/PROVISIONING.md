# Miruwa — Dedicated-Instance Provisioning Runbook

Every production hospital runs its **own** Miruwa instance: its own Supabase
project (in the customer's preferred region), its own Vercel deployment (or
Docker host), and its own WhatsApp number. Nothing is shared between
hospitals — that is the product's data-isolation promise (see `/security`).

Mechanical details (env tables, SMTP, cron) live in [`DEPLOYMENT.md`](../DEPLOYMENT.md);
this runbook is the per-customer sequence.

## 0. Intake (owner: sales · 15 min)

Collect from the hospital:
- Legal organization name (appears in Settings → Organization)
- Preferred data region (HK deployments: **ap-southeast-1 Singapore**)
- Domain choice (`<hospital>.careloop.app` subdomain or customer-owned domain)
- Admin contact (name + email — becomes the first admin)
- Expected patient cohort size + language mix

## 1. Supabase project (owner: ops · 20 min)

1. Create a new Supabase project **in the customer's region**.
2. SQL editor → apply migrations **in order**:
   `supabase/migrations/0001_careloop_init.sql` → `0002_alert_one_open.sql` →
   `0003_orgs_auth.sql` → `0004_leads.sql`.
3. Enable daily backups (default). Enterprise tier: enable PITR.
4. Configure **custom SMTP** (Authentication → SMTP) — required before
   inviting nurses (built-in mailer ≈ 2 emails/hour).
5. Collect: project URL, anon key, service-role key.

## 2. Seed the organization (owner: ops · 5 min)

1. Dashboard → Authentication → Users → **Add user** (admin email, temp
   password, auto-confirm).
2. Run [`scripts/provision-org.sql`](../scripts/provision-org.sql) with the
   placeholders filled (renames the default org, links the admin profile).
3. Verify the two SELECTs at the end of the script.

## 3. Application deployment (owner: ops · 20 min)

Vercel (default):
1. New Vercel project from this repo.
2. Env vars per `.env.example`. Required: `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `CRON_SECRET` (fresh random),
   `NEXT_PUBLIC_SITE_URL` (the final domain).
   **Never set on a hospital instance:** `DEMO_MODE`, `RESEND_API_KEY`,
   `LEADS_NOTIFY_EMAIL` (the contact form is a vendor-site feature; on hospital
   instances `/contact` still renders but leads route to that instance's DB —
   acceptable, or strip the page per contract).
3. Attach the domain; confirm `NEXT_PUBLIC_SITE_URL` matches it exactly.

Self-hosted (enterprise option): build the Docker image per `DEPLOYMENT.md` §5;
set `CARELOOP_CHECKIN_TIME` + `CARELOOP_TZ` (the in-process scheduler replaces
Vercel Cron).

## 4. WhatsApp (owner: ops + customer · days–weeks, start early)

1. Dedicated WhatsApp sender per hospital via Twilio: WhatsApp Business API
   sender registration (Meta business verification → number approval). Realistic
   lead time: **2–6 weeks** — start at contract signature.
2. Point the sender's inbound webhook (POST) at
   `https://<domain>/api/whatsapp/inbound`.
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
   (the approved sender), and `TWILIO_WEBHOOK_URL` (**byte-identical** to the
   URL registered in Twilio — signature validation fails otherwise).

## 5. Smoke checklist (owner: ops · 15 min)

- [ ] `GET https://<domain>/api/health` → `{"ok":true}`
- [ ] Admin signs in; dashboard renders (empty patient list)
- [ ] Settings → Team → invite a nurse → invite email arrives → nurse sets
      password and reaches the dashboard
- [ ] Create a TEST patient with a test WhatsApp number
- [ ] Patient detail → "Send check-in" → message arrives on the phone
- [ ] Reply from the phone → message appears in the conversation panel; risk
      evaluates
- [ ] Weekly summary generates; PDF downloads; FHIR export renders
- [ ] Audit trail shows every step above
- [ ] **Delete the test patient** (edit → archive) and resolve test alerts
- [ ] Language switcher: 繁 renders the dashboard in Traditional Chinese

## 6. Handover (owner: sales · 30 min)

- Credentials to the hospital admin (password reset on first login)
- Walkthrough: invite team, add patients, both onboarding paths, alert flow
- Support contact + response expectations (per contract/SLA)
- Add the instance to the uptime monitor (`/api/health`) and the internal
  instance registry (domain, region, Supabase project ref, Twilio sender)
