# Security

## Reporting a vulnerability

Email the maintainers (see repository owner profile) with details and
reproduction steps. Please do not open public issues for security reports, and
never include real patient data in a report.

## Architecture notes

- **Authentication**: Supabase Auth (cookie sessions). Roles (`admin`/`nurse`)
  and organization membership live in `careloop_profiles`. Every page and API
  handler re-checks the session server-side — the proxy is UX only.
- **Tenancy**: every row carries `org_id`; all queries are org-scoped in
  `lib/store.ts`.
- **Service-role key** is server-only (`import "server-only"` guard); the
  browser only ever holds the anon key, which RLS denies all table access.
- **Webhook**: Twilio `X-Twilio-Signature` HMAC validation + per-phone rate
  limiting. Media URLs are restricted to Twilio hosts (SSRF guard).
- **Cron**: bearer `CRON_SECRET`, timing-safe comparison, fail-closed in
  production.
- **Input validation**: zod schemas on every mutating route
  (`lib/validation.ts`), including clinical range checks on vitals.
- **Headers**: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy
  (`next.config.ts`).
- **Audit**: append-only `careloop_audit_events`, actor = signed-in user.

## Handling patient data

No PHI in issues, commits, logs, or error reports. Demo data is synthetic.
