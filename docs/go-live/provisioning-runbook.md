# New-hospital provisioning runbook

One isolated instance per hospital (own database, deployment, and WhatsApp
number) — this is the security model the DPA promises. ~½ day end to end, most
of it waiting on the WhatsApp sender. Steps reference `DEPLOYMENT.md`.

## 0. Before you start — collect from the customer
- Legal entity name (for the Pilot Agreement + DPA).
- Data region preference (Supabase region: Singapore is closest to HK).
- The nurse/admin who will be the first account (name + email).
- Pilot scope: number of patients, conditions, start date, the check-in time.

## 1. Database (Supabase)
1. Create a **new** Supabase project for this customer (don't reuse the demo
   project `lrwdzbnkutyoixbmcwdu`).
2. Apply **all** migrations in order (`supabase/migrations/0001 … latest`) — the
   demo instance is currently at `rule_config` / `caregiver_notified_at`; match it.
3. Create the first admin user (Auth → Users → add, auto-confirm) and link to the
   default org with the SQL in `DEPLOYMENT.md §1.4`.
4. Configure **custom SMTP** (Auth → SMTP) so team invites actually send.
5. Note the project URL + `anon` key + `service_role` key.

## 2. Hosting (Vercel)
1. New Vercel project from the repo (or a new environment).
2. Set env (Production scope) per `DEPLOYMENT.md §2`:
   - Supabase URL + both keys; `NEXT_PUBLIC_SITE_URL` = customer domain.
   - `CRON_SECRET` (required — agents fail closed without it).
   - `GROQ_API_KEY` **or** `OPENAI_API_KEY` (real voice-note transcription).
   - `ANTHROPIC_API_KEY` (optional wording), Upstash (rate limit), Sentry.
   - **`DEMO_MODE` unset / false** — never on for a real hospital.
3. Point the customer domain/subdomain at the deployment.
4. Confirm `vercel.json` crons run: `/api/agent/send-round` (08:00 HKT) and
   `/api/agent/sweep` (silence + SLA re-paging).

## 3. WhatsApp (per-hospital number)
1. Provision a dedicated WhatsApp sender (Twilio + Meta business verification).
2. Get the 4 templates in `whatsapp-templates.md` approved.
3. Set `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` and `TWILIO_WEBHOOK_URL`
   (byte-exact to `https://<customer-domain>/api/whatsapp/inbound`).
4. Point the sender's inbound webhook at that URL.

## 4. In-app configuration (as the customer admin)
- **Settings → Team:** invite the nurses.
- **Settings → Notifications:** set who is paged + the SLA windows.
- **Settings → Rules:** confirm/tune thresholds within guardrails (audited).
- Add patients (name, conditions, baselines, WhatsApp number, caregiver +
  consent). Or bulk import.

## 5. Verify (smoke test)
- `GET /api/health` returns OK; uptime monitor attached.
- Send a test check-in to a staff phone → reply → confirm it lands on the
  dashboard, risk evaluates, audit row written.
- Trigger a risky check-in → confirm nurse email + caregiver WhatsApp deliver
  (real addresses, not just owner inbox) and the realtime toast fires.
- Confirm the daily cron fired the next morning.

## 6. Handover
- 30-min nurse walkthrough; point them at the **Rules** transparency page.
- Confirm the Pilot Agreement + DPA are signed before real patient data is entered.
- Set the calendar checkpoint for the **≥70% response-rate** pilot metric
  (Program page → board PDF).
