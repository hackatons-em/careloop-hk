# zh-HK Native Reviewer Guide

A guided sign-off read of the Traditional Chinese (Hong Kong) UI catalog —
**~30–45 minutes** for a native reader. The catalog was machine-drafted and
then corrected by a multi-reviewer AI QA round (15 fixes applied 2026-06-10),
so this is a verification pass, not a rewrite.

## What to review
One file: [`messages/zh-HK.json`](../messages/zh-HK.json)
(English source for meaning: [`messages/en.json`](../messages/en.json) — same key structure.)

## Established glossary (keep consistent — flag deviations, don't introduce new terms)

| English | zh-HK |
|---|---|
| check-in | 報到 |
| nurse | 護士 |
| alert | 警示 |
| caregiver | 照顧者 |
| dashboard | 儀表板 |
| Escalate (severity) | 需立即跟進 |
| Review today (severity) | 今日覆查 |
| Watch (severity) | 觀察 |
| Stable (severity) | 穩定 |
| medication adherence | 服藥依從性 |
| audit trail | 審計紀錄 |
| shortness of breath | 呼吸急促 |
| pilot program | 先導計劃 |
| leads (sales inquiries) | 客戶查詢 |
| baseline values | 基線值 |

## Priority order (most clinically sensitive first)
1. `domain.*` — severity labels, alert statuses, rule descriptions,
   recommended actions, safety disclaimers. **A clinician should read these.**
2. `patient.*`, `alerts.*`, `panels.*` — nurse daily-use surfaces.
3. `public.privacy` + `public.terms` — legal text (counsel reviews the
   English; this pass checks the Chinese says the same thing).
4. `public.*` marketing, `landing.*`, `sections.*` — buyer-facing tone.
5. Everything else (`common`, `nav`, `auth`, `settings`, …).

## What to check
- Reads naturally to a Hong Kong reader (書面語; no mainland/simplified
  vocabulary or phrasing).
- Clinical wording is accurate and appropriately cautious — disclaimers must
  not overstate or understate what the product does.
- Glossary consistency (table above).
- Curly braces are placeholders — `{name}`, `{count}`, `{date}` etc. **must
  remain exactly as-is** (they are substituted at runtime).
- Strings render in small UI elements (buttons, badges, table headers):
  flag anything so long it would obviously break a button.

## What NOT to change
- `messages/en.json` (source of truth).
- Stored clinical text policy: alert evidence/reasons, weekly summaries, and
  PDF/FHIR exports are **English by design** (HK clinical-documentation
  convention + audit stability). Their absence from the catalog is intentional.
- Condition values like `heart failure` in suggestions — stored data
  identifiers, English by design.

## How to deliver feedback
Either edit `messages/zh-HK.json` directly in a branch/PR, or list changes as
`json.path → suggested text` lines. After changes: `npm test` must pass (a
parity test guards the key structure), then sign off here:

> Reviewed by: ______________________ (native zh-HK speaker)
> Clinical strings reviewed by: ______________________ (clinician, `domain.*`)
> Date: ____________
