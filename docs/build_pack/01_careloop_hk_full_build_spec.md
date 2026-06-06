# CareLoop HK — Full Hackathon Build Spec

## Context

Build for the EuroTech × HKTE HealthTech × AI Hackathon.

Judging criteria:
- Innovation: 20
- Impact and Scalability: 20
- Feasibility: 15
- Hong Kong Alignment: 15
- Presentation: 10

Build one narrow, real, demoable product. Do not build an AI doctor, diagnosis tool, treatment recommender, or generic elderly companion app.

## One-liner

CareLoop HK combines daily Cantonese check-ins, wearable/vital data, and rule-based escalation into a nurse dashboard and clinician-ready weekly summary for elderly chronic-disease patients.

## Problem

Elderly chronic-disease patients in Hong Kong are often reviewed only after they deteriorate enough to seek urgent care or wait months for follow-up. Between visits, families and clinicians can miss early warning signs: sudden weight gain, high blood pressure, missed medication, shortness of breath, swelling, low activity, worsening fatigue, poor sleep, or mood decline.

CareLoop turns between-visit monitoring into an operational workflow.

## Product Positioning

CareLoop HK is:
- monitoring and escalation platform
- nurse dashboard
- caregiver alert system
- clinician summary generator
- FHIR-style interoperability demo

CareLoop HK is not:
- diagnosis tool
- medical device
- treatment recommender
- replacement for doctors or nurses
- emergency service
- AI consultation chatbot

## First Wedge

Focus only on elderly heart-failure / hypertension patients after discharge or between clinic visits.

Expansion later: diabetes, COPD, kidney disease, post-stroke monitoring.

## Core Demo Patient

```yaml
name: Mrs. Chan
age: 78
conditions:
  - heart failure
  - hypertension
living_status: lives alone
caregiver: daughter
assigned_nurse: Nurse Lee
risk_context:
  - recent discharge
  - possible fluid retention risk
  - medication adherence risk
```

Data sources:
- daily Cantonese check-in
- daily weight
- blood pressure
- heart rate
- steps/activity
- medication adherence
- symptoms

## Required MVP Screens

### 1. Landing / Product Intro

Show:
- CareLoop HK logo/name
- one-line product explanation
- Start demo button
- safety disclaimer

Disclaimer:
```txt
CareLoop flags monitoring risks for professional review. It does not diagnose or prescribe.
```

### 2. Patient List / Nurse Dashboard

Show 5 mock elderly patients.

Columns:
- patient name
- age
- condition
- last check-in
- risk level
- top reason
- assigned nurse
- escalation status

Risk levels:
- Stable
- Watch
- Review today
- Escalate

Seed patients:
- Mrs. Chan, 78, heart failure + hypertension, Review today / Escalate
- Mr. Lee, 72, diabetes, Watch
- Mrs. Wong, 81, COPD, Stable
- Mr. Ho, 76, post-stroke, Watch
- Mrs. Lam, 84, kidney disease, Stable

### 3. Patient Detail Timeline

For Mrs. Chan, show:
- 7-day weight chart
- 7-day blood pressure chart
- heart rate
- steps/activity
- medication adherence
- daily check-in responses
- symptom trend
- risk score over time

### 4. Daily Cantonese Check-in Simulation

Build a simulated phone/check-in screen with Cantonese/English script.

Questions:
- How are you feeling today?
- Any shortness of breath?
- Any swelling in legs or feet?
- Did you take your medicine today?
- What is your weight today?
- Any dizziness or chest discomfort?

Example risky answers:
- weight increased by 2.3 kg in 3 days
- shortness of breath: yes
- leg swelling: yes
- missed medicine yesterday
- activity lower than usual

After submission, save as a check-in record.

### 5. Risk Engine Result

Do not use AI for diagnosis. Use deterministic rules.

Rules:

```yaml
HF-001:
  if: weight increases by >= 2 kg in 3 days
  severity: Review today
  reason: Rapid weight gain can indicate fluid retention in heart-failure monitoring.

HF-002:
  if: weight gain + shortness of breath + swelling
  severity: Escalate
  reason: Combined symptoms require nurse/clinician review.

MED-001:
  if: medication missed 2 days in a row
  severity: Review today
  reason: Repeated missed medication increases chronic-care risk.

BP-001:
  if: systolic BP > 180 OR diastolic BP > 110
  severity: Escalate
  reason: Very high blood pressure should be reviewed urgently.

ACT-001:
  if: steps/activity drops by >40% from baseline for 3 days
  severity: Watch
  reason: Reduced activity may signal deterioration or frailty risk.
```

Show:
- risk level
- matched rules
- reason
- recommended operational action

Allowed operational actions:
- Nurse review recommended
- Call family
- Book clinic follow-up
- If severe symptoms, contact emergency services

Do not output treatment recommendations.

### 6. Nurse Review Queue

Show alerts needing review.

Each alert includes:
- patient
- severity
- matched rule
- explanation
- last data points
- suggested owner
- status

Statuses:
- new
- acknowledged
- family contacted
- clinician review requested
- resolved

Allow nurse to acknowledge and add note.

### 7. Family / Caregiver Alert

Generate a family-facing alert.

Example:
```txt
Mrs. Chan reported shortness of breath and leg swelling today. Her weight increased 2.3 kg over 3 days. CareLoop recommends nurse review today. If symptoms are severe, seek urgent care.
```

Include Traditional Chinese version if possible. Do not include diagnosis, medication changes, or treatment instructions.

### 8. Weekly Clinician Summary

Generate a one-page summary:
- patient details
- condition
- weekly risk trend
- vitals summary
- symptom summary
- medication adherence
- matched rules
- nurse notes
- recommended review items
- data completeness
- disclaimer

Export as PDF.

### 9. FHIR Export

Generate a FHIR-style JSON bundle with:
- Patient
- Observation for blood pressure
- Observation for heart rate
- Observation for body weight
- Observation for steps/activity
- QuestionnaireResponse for daily check-in
- CarePlan or ServiceRequest-like object for follow-up task

This does not need to be production-certified FHIR, but it should be clean and plausible.

### 10. HONESTY.md Link

Create `HONESTY.md` at repo root. Show an “Honesty” link in the app footer.

## AI Usage

Use AI only for:
- summarising weekly patient data
- rewriting nurse summary in plain language
- generating caregiver-friendly wording
- optional Cantonese / Traditional Chinese translation

Do not use AI for:
- diagnosis
- risk classification
- treatment recommendation
- emergency decision-making

Risk classification must be deterministic and explainable.

## Data Model

```yaml
Patient:
  id: string
  name: string
  age: integer
  gender: string
  language: string
  living_status: string
  conditions: string[]
  caregiver_name: string
  caregiver_phone: string
  assigned_nurse: string
  baseline_weight: number
  baseline_steps: integer

DailyCheckIn:
  id: string
  patient_id: string
  date: datetime
  mood: string
  shortness_of_breath: boolean
  swelling: boolean
  dizziness: boolean
  chest_discomfort: boolean
  medication_taken: boolean
  free_text_note: string | null
  source: simulated_call | web_form | imported

VitalReading:
  id: string
  patient_id: string
  timestamp: datetime
  type: weight | blood_pressure_systolic | blood_pressure_diastolic | heart_rate | steps | sleep_hours
  value: number
  unit: string
  source: manual | wearable_csv | mock

RiskAlert:
  id: string
  patient_id: string
  created_at: datetime
  severity: stable | watch | review_today | escalate
  matched_rules: string[]
  reason: string
  status: new | acknowledged | family_contacted | clinician_review_requested | resolved
  assigned_to: string
  nurse_note: string | null

WeeklySummary:
  id: string
  patient_id: string
  week_start: datetime
  week_end: datetime
  generated_text: string
  pdf_url: string | null
  fhir_json: object | null

AuditEvent:
  id: string
  actor: string
  action: string
  target_type: string
  target_id: string
  metadata: object
  created_at: datetime
```

## API Routes

```http
GET /api/patients
GET /api/patients/:id
GET /api/patients/:id/timeline
POST /api/patients/:id/checkins
POST /api/patients/:id/vitals
POST /api/patients/:id/evaluate-risk
GET /api/alerts
PATCH /api/alerts/:id
POST /api/patients/:id/weekly-summary
GET /api/patients/:id/fhir-export
GET /api/audit-events
POST /api/demo/reset
POST /api/demo/run-risky-checkin
```

## Design Requirements

Avoid:
- cartoon elderly illustrations
- generic AI gradients
- medical stock imagery
- fake hospital branding
- cluttered dashboards
- overclaiming clinical language

Use:
- clean white/light theme
- soft clinical green/blue accent
- readable charts
- calm alert colors
- clear typography
- Hong Kong-specific copy
- bilingual support where useful

## Build Priorities

1. Data models and mock seed data
2. Nurse dashboard
3. Patient detail timeline
4. Daily check-in simulation
5. Rule-based risk engine
6. Alert queue
7. Weekly AI summary
8. PDF export
9. FHIR-style JSON export
10. HONESTY.md
11. Polish UI
12. Demo script and sample data reset button

## Acceptance Criteria

1. Judge understands the problem in 30 seconds.
2. Dashboard shows elderly chronic-care patients and risk states.
3. Daily check-in can create a new risk alert.
4. Risk alert shows matched deterministic rules.
5. Product never claims to diagnose or prescribe.
6. Nurse can acknowledge an alert.
7. App generates a weekly clinician summary.
8. App exports a PDF.
9. App exports FHIR-style JSON.
10. HONESTY.md clearly states what is real and mocked.
11. Demo is specific to Hong Kong ageing/chronic-care needs.
12. No secrets are committed.
13. App looks polished and reliable.
