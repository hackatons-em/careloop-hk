# CareLoop — Deployment guide

Production deployment on Vercel + Supabase, or self-hosted via Docker.

## 1. Supabase setup

1. Create a Supabase project (one per environment: production, staging, E2E).
2. Apply the migrations **in order** via the SQL editor (or `supabase db push`):
   - `supabase/migrations/0001_careloop_init.sql`
   - `supabase/migrations/0002_alert_one_open.sql`
   - `supabase/migrations/0003_orgs_auth.sql`
   - `supabase/migrations/0004_leads.sql`
3. Collect from **Project Settings → API**: the project URL, the `anon` (public)
   key, and the `service_role` (secret) key.
4. **Create the first admin user** (no public signup exists):
   - Dashboard → Authentication → Users → *Add user* → email + password
     (check "auto-confirm").
   - SQL editor — link the user to the default org as admin:
     ```sql
     insert into careloop_profiles (id, org_id, role, name, email)
     select u.id, o.id, 'admin', 'Your Name', u.email
     from auth.users u, careloop_organizations o
     where u.email = 'you@example.com' and o.is_default;
     ```
   - Further users are invited from **Settings → Team** inside the app.
5. **Custom SMTP (required for real invites):** Supabase's built-in mailer is
   limited to ~2 emails/hour. Configure Authentication → SMTP with your
   provider before inviting a team.
6. Optional demo data: sign in as the admin with `DEMO_MODE=true` and use
   **Settings → Demo → Reset demo data**.

## 2. Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server-only secret** — bypasses RLS |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Same project URL (browser session) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key — RLS denies it all data access |
| `CRON_SECRET` | ✅ prod | Agent endpoints **fail closed** in production without it |
| `NEXT_PUBLIC_SITE_URL` | ✅ prod | Canonical origin, e.g. `https://care.example.org` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | for WhatsApp | Twilio credentials |
| `TWILIO_WEBHOOK_URL` | ✅ when Twilio set | **Must byte-match** the webhook URL registered in the Twilio console, e.g. `https://care.example.org/api/whatsapp/inbound` — all inbound webhooks are rejected otherwise |
| `ANTHROPIC_API_KEY` | optional | AI wording; deterministic templates otherwise |
| `GROQ_API_KEY` or `OPENAI_API_KEY` | optional | Voice-note transcription |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | recommended | Cross-instance rate limiting |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | optional | Error tracking |
| `DEMO_MODE` | optional | `true` = demo tooling + frozen demo clock. **Never on real deployments** |

Full annotated list: `.env.example`.

## 3. Vercel

1. Import the repo; framework auto-detects Next.js. Node 24.
2. Set the env vars above (Production scope).
3. `vercel.json` schedules the daily WhatsApp round:
   `GET /api/agent/send-round` at `0 0 * * *` UTC = **08:00 Hong Kong time**.
   Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`.
4. Sentry source maps: add the Sentry integration (sets `SENTRY_AUTH_TOKEN`).

## 4. Twilio WhatsApp

1. Point the WhatsApp sender's inbound webhook (POST) at
   `https://<your-domain>/api/whatsapp/inbound`.
2. Set `TWILIO_WEBHOOK_URL` to **exactly** that URL (scheme, host, path).
3. Signature validation (`X-Twilio-Signature`) is enforced whenever Twilio is
   configured in production.

## 5. Self-hosted (Docker)

```bash
docker build -t careloop .
docker run -p 3000:3000 --env-file .env.production careloop
```

- The in-process scheduler replaces Vercel Cron: set
  `CARELOOP_CHECKIN_TIME=08:00` and `CARELOOP_TZ=Asia/Hong_Kong`.
- `GET /api/health` is the container healthcheck / uptime probe target.
- Smoke-test the PDF route after image changes (`/api/patients/<id>/pdf`) —
  `@react-pdf/renderer` relies on file tracing in standalone output.

## 6. Monitoring

- Point an uptime monitor (UptimeRobot, Checkly, …) at `GET /api/health`.
- Logs are one-line JSON on stdout in production — attach a Vercel Log Drain
  or your Docker log collector.
- Sentry captures server, edge, and browser errors when DSNs are set.

## 7. CI / E2E

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests,
and build on every PR. The E2E job runs when the repo variable `E2E_ENABLED`
is `true` and these secrets exist (use a **dedicated** Supabase project, never
production): `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`,
`E2E_SUPABASE_ANON_KEY`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` (a
pre-provisioned admin user in that project).
