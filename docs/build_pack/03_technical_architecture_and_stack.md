# CareLoop HK — Technical Architecture and Stack

## Recommended Stack

```txt
Frontend:
Next.js 14 / React / TypeScript
Tailwind CSS
shadcn/ui
Recharts

Backend:
FastAPI / Python
SQLite for hackathon speed or PostgreSQL if already available
SQLAlchemy
Pydantic

AI:
OpenAI / Gemini / Claude API for summarisation only

Voice:
Twilio Voice if possible
Fallback: browser-based simulated Cantonese call/check-in flow

Data:
Mock Apple Health / Fitbit CSV import
Manual vitals input
FHIR-style JSON export

Exports:
PDF weekly summary
FHIR JSON bundle
HONESTY.md

Deployment:
Vercel for frontend
Render / Fly.io / Railway for backend
Supabase if using fast Postgres/Auth
```

## Architecture

```txt
Frontend
  ↓
Backend API
  ↓
Database
  ↓
Risk Engine
  ↓
Alert Queue
  ↓
AI Summary Service
  ↓
PDF Export / FHIR Export
```

## Risk Engine

Risk engine must be rule-based.

Create:

```txt
backend/app/services/risk_engine.py
```

or:

```txt
src/lib/riskEngine.ts
```

Example output:

```json
{
  "severity": "escalate",
  "matched_rules": ["HF-001", "HF-002"],
  "reason": "Weight increased by 2.3 kg over 3 days with shortness of breath and swelling.",
  "recommended_action": "Nurse review recommended today. If symptoms are severe, seek urgent care."
}
```

Do not let the LLM decide severity.

## AI Summary Service

AI receives structured data and produces:
- weekly clinician summary
- caregiver-friendly explanation
- optional Traditional Chinese caregiver message

Prompt safety rules:
- Do not diagnose.
- Do not recommend medication changes.
- Do not prescribe.
- Do not tell patient to stop medication.
- Say “review with nurse/clinician/pharmacist”.
- Use plain language.
- Mention this is based on monitoring data.

## Data Import

Implement one of:

### Option A — CSV Import

```csv
date,weight_kg,systolic_bp,diastolic_bp,heart_rate,steps,sleep_hours
2026-01-01,62.1,132,82,74,3400,6.5
```

### Option B — Seeded Data

Hard-code realistic seed data for demo reliability. Do this first.

## FHIR-style Export

Generate JSON bundle like:

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-mrs-chan",
        "name": [{ "text": "Mrs. Chan" }],
        "birthDate": "1948-01-01"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-weight-latest",
        "status": "final",
        "code": { "text": "Body weight" },
        "subject": { "reference": "Patient/patient-mrs-chan" },
        "valueQuantity": { "value": 64.4, "unit": "kg" }
      }
    }
  ]
}
```

It does not need to be fully certified, but must be plausible.

## PDF Export

Use one of:
- React PDF
- Playwright print-to-PDF
- jsPDF
- WeasyPrint
- ReportLab

Fastest:
```txt
backend generates HTML summary
Playwright or browser print exports PDF
```

## File Structure

```txt
careloop-hk/
  README.md
  HONESTY.md
  frontend/
    app/
      page.tsx
      patients/
      alerts/
      demo/
    components/
      Dashboard.tsx
      PatientTimeline.tsx
      CheckInSimulator.tsx
      RiskCard.tsx
      AlertQueue.tsx
      WeeklySummary.tsx
      FhirExportPanel.tsx
    lib/
      api.ts
      types.ts
  backend/
    app/
      main.py
      models.py
      schemas.py
      database.py
      seed.py
      routes/
        patients.py
        checkins.py
        alerts.py
        summaries.py
        fhir.py
        demo.py
      services/
        risk_engine.py
        summary_service.py
        pdf_service.py
        fhir_service.py
  sample_data/
    mrs_chan_vitals.csv
    wearable_sample.csv
```

## Environment Variables

Use `.env.example`.

```txt
OPENAI_API_KEY=
DATABASE_URL=
```

Do not commit real secrets.

## Test Cases

### Stable patient

Input: normal vitals, no symptoms, medication taken. Expected: Stable, no alert.

### Watch patient

Input: activity down 45% for 3 days. Expected: Watch, ACT-001 matched.

### Review today

Input: weight up >=2kg in 3 days. Expected: Review today, HF-001 matched.

### Escalate

Input: weight up >=2kg + shortness of breath + swelling. Expected: Escalate, HF-001 and HF-002 matched.

### High BP

Input: systolic > 180 or diastolic > 110. Expected: Escalate, BP-001 matched.

## Technical Acceptance Criteria

1. App runs locally from README.
2. Seed data loads consistently.
3. Risk engine works without AI.
4. AI summary failure does not break alerting.
5. PDF export works.
6. FHIR export works.
7. HONESTY.md exists.
8. No secrets are committed.
9. Demo can reset data.
10. UI is stable and polished.
