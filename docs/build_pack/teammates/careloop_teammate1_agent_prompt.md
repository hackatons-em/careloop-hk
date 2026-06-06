# CareLoop HK — Teammate 1 AI Agent Build Prompt

## Role

You are building the **Data, Integration, FHIR, Audit, and Demo Reliability** layer for CareLoop HK.

CareLoop HK is a remote chronic-care monitoring platform for elderly Hong Kong patients between clinic visits.

The core product flow is:

```txt
elderly patient dashboard
→ daily Cantonese check-in
→ wearable/vital data
→ deterministic risk rules
→ nurse review queue
→ caregiver alert
→ weekly clinician PDF
→ FHIR-style export
→ HONESTY.md
```

Your job is to make the project technically credible and reliable for a hackathon demo.

You are **not** building diagnosis, medical advice, treatment recommendations, emergency triage, or an AI doctor.

Risk classification must be deterministic and rule-based. AI may only be used for summaries or caregiver-friendly wording.

---

# What You Own

You own:

```txt
1. Synthetic patient data
2. Sample wearable/vital data
3. FHIR-style export
4. Audit events
5. Demo reset and replay
6. HONESTY.md accuracy
```

You do **not** own:

```txt
main UI polish
pitch deck
business video
demo script
visual design
```

Those are Teammate 2’s responsibility.

---

# Build 1 — Synthetic Patient Dataset

Create realistic seeded demo data for 5 elderly Hong Kong patients.

## Patient 1 — Mrs. Chan

```yaml
name: Mrs. Chan
age: 78
conditions:
  - heart failure
  - hypertension
status: Escalate
reason: weight gain + shortness of breath + swelling
assigned_nurse: Nurse Lee
caregiver: daughter
living_status: lives alone
baseline_weight: 62.0
baseline_steps: 3500
```

Mrs. Chan is the main demo patient. Her data should show deterioration over the last 7 days.

## Patient 2 — Mr. Lee

```yaml
name: Mr. Lee
age: 72
conditions:
  - diabetes
status: Watch
reason: low activity + missed check-in
assigned_nurse: Nurse Wong
baseline_steps: 4200
```

## Patient 3 — Mrs. Wong

```yaml
name: Mrs. Wong
age: 81
conditions:
  - COPD
status: Stable
reason: no recent deterioration
assigned_nurse: Nurse Lee
baseline_steps: 2800
```

## Patient 4 — Mr. Ho

```yaml
name: Mr. Ho
age: 76
conditions:
  - post-stroke recovery
status: Watch
reason: reduced activity
assigned_nurse: Nurse Chan
baseline_steps: 3000
```

## Patient 5 — Mrs. Lam

```yaml
name: Mrs. Lam
age: 84
conditions:
  - kidney disease
  - hypertension
status: Stable
reason: recent vitals normal
assigned_nurse: Nurse Wong
baseline_steps: 2200
```

Each patient must have:

```txt
7 days of weight data
7 days of blood pressure data
7 days of heart rate data
7 days of steps/activity data
7 days of medication adherence data
daily check-in records
baseline weight
baseline steps
caregiver contact
assigned nurse
```

Use synthetic data only. Do not include any real patient data.

---

# Build 2 — Mrs. Chan Worsening Data

Mrs. Chan’s demo must clearly show deterioration.

Use this sample trend:

```csv
date,weight_kg,systolic_bp,diastolic_bp,heart_rate,steps,sleep_hours,medication_taken,shortness_of_breath,swelling
2026-01-01,62.0,138,84,76,3400,6.5,true,false,false
2026-01-02,62.3,140,86,78,3200,6.2,true,false,false
2026-01-03,62.8,145,88,80,2900,6.0,true,false,false
2026-01-04,63.4,150,90,82,2500,5.7,false,true,false
2026-01-05,64.3,158,94,86,1900,5.4,false,true,true
```

Create this file:

```txt
sample_data/mrs_chan_vitals.csv
```

If CSV import is too slow, seed equivalent data directly in the database and still include the CSV file for transparency.

---

# Build 3 — Sample Data Import

Preferred endpoint:

```http
POST /api/demo/import-csv
```

Minimum acceptable version:

```txt
seed script loads sample_data/mrs_chan_vitals.csv into the database
```

The importer should populate:

```txt
weight
blood pressure
heart rate
steps
sleep
medication adherence
symptoms
```

---

# Build 4 — FHIR-style Export

Create endpoint:

```http
GET /api/patients/:id/fhir-export
```

The export should return a FHIR-style JSON bundle.

Include these resources:

```txt
Bundle
Patient
Observation: body weight
Observation: blood pressure
Observation: heart rate
Observation: steps/activity
QuestionnaireResponse: daily check-in
CarePlan or ServiceRequest: nurse review task
```

Example structure:

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
        "gender": "female",
        "birthDate": "1948-01-01"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-weight-latest",
        "status": "final",
        "code": {
          "text": "Body weight"
        },
        "subject": {
          "reference": "Patient/patient-mrs-chan"
        },
        "effectiveDateTime": "2026-01-05T09:00:00Z",
        "valueQuantity": {
          "value": 64.3,
          "unit": "kg"
        }
      }
    }
  ]
}
```

This does not need to be certified production FHIR, but it must look intentional and credible.

Add a UI-accessible response or file export so the main app can display/download this JSON.

---

# Build 5 — Audit Events

Create audit events for:

```txt
demo_data_seeded
checkin_submitted
risk_evaluated
alert_created
alert_acknowledged
caregiver_alert_generated
weekly_summary_generated
pdf_exported
fhir_exported
demo_data_reset
```

Each audit event should have:

```yaml
AuditEvent:
  id: string
  actor: string
  action: string
  target_type: string
  target_id: string
  metadata: object
  created_at: datetime
```

Add endpoint:

```http
GET /api/audit-events
```

Optional but valuable:

```txt
small audit trail drawer or panel on patient detail page
```

---

# Build 6 — Demo Reset and Replay

Add these endpoints:

```http
POST /api/demo/reset
POST /api/demo/run-risky-checkin
```

## `/api/demo/reset`

Should restore all seed data to a known clean state.

## `/api/demo/run-risky-checkin`

Should create the exact risky Mrs. Chan scenario:

```txt
weight increased by 2.3kg in 3 days
shortness_of_breath: true
swelling: true
medication_taken: false
activity lower than baseline
```

This should trigger the rule engine and create an alert.

This is critical for demo reliability.

Main app should have buttons:

```txt
Reset demo data
Run risky check-in
```

---

# Build 7 — HONESTY.md Technical Section

Create or update `HONESTY.md` at repo root.

It must say:

## Real

```txt
seeded patient data
check-in simulation
deterministic risk engine
FHIR-style JSON export
audit events
PDF generation if implemented
```

## Mocked

```txt
real Apple Health/Fitbit connection unless actually implemented
real eHealth+ integration
real hospital integration
real clinical validation
real nurse workflow
production security
```

## Safety

```txt
no diagnosis
no treatment recommendation
not emergency triage
professional review required
synthetic demo data only
```

---

# Integration Contract With Main App

Expose these endpoints reliably:

```http
GET /api/patients
GET /api/patients/:id
GET /api/patients/:id/timeline
GET /api/patients/:id/fhir-export
GET /api/audit-events
POST /api/demo/reset
POST /api/demo/run-risky-checkin
```

If route naming differs, document it clearly in README.

---

# Acceptance Criteria

Your part is done when:

1. Seed data loads reliably.
2. Mrs. Chan has realistic 7-day worsening data.
3. Demo reset works.
4. Risky check-in replay works.
5. FHIR-style export works.
6. Audit events are generated.
7. Sample CSV exists.
8. No secrets are committed.
9. HONESTY.md accurately describes what is real and mocked.
10. Main app can call your endpoints without manual setup.
11. Demo can be run repeatedly without breaking.
12. The data layer makes the project look technically credible.

---

# Final Instruction

Do not overbuild.

Do not add random health features.

Make the demo reliable.

Your output should make the team able to say:

```txt
The app has realistic synthetic data, reproducible demo states, audit events, and a credible FHIR-style export.
```
