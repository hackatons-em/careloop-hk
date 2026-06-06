# CareLoop HK — Teammate 1 Simple Task List

## Your role

You are responsible for the **data and technical credibility**.

The main app needs good data, reset buttons, FHIR export, and audit logs so it does not look like a fake dashboard.

## What you build

### 1. Fake elderly patient data

Create 5 demo patients:

```txt
Mrs. Chan — 78 — heart failure + hypertension — high risk
Mr. Lee — 72 — diabetes — watch
Mrs. Wong — 81 — COPD — stable
Mr. Ho — 76 — post-stroke — watch
Mrs. Lam — 84 — kidney disease — stable
```

Each patient needs 7 days of:

```txt
weight
blood pressure
heart rate
steps/activity
medication taken yes/no
daily check-in answers
```

Mrs. Chan must clearly get worse over time.

---

### 2. Sample CSV file

Create:

```txt
sample_data/mrs_chan_vitals.csv
```

It should show Mrs. Chan’s weight increasing, activity dropping, symptoms appearing, and medication being missed.

---

### 3. Demo reset button

Build backend endpoint:

```txt
POST /api/demo/reset
```

This should reset all demo data so we can run the demo again.

---

### 4. Risky check-in button

Build backend endpoint:

```txt
POST /api/demo/run-risky-checkin
```

This should create the demo scenario:

```txt
Mrs. Chan gained 2.3kg in 3 days
she has shortness of breath
she has leg swelling
she missed medication
activity is low
```

This should trigger a nurse alert.

---

### 5. FHIR-style export

Build:

```txt
GET /api/patients/:id/fhir-export
```

It should export patient + vitals + check-in + nurse task as FHIR-style JSON.

It does not need to be perfect production FHIR, but it must look structured and credible.

---

### 6. Audit events

Track events like:

```txt
demo reset
check-in submitted
risk evaluated
alert created
alert acknowledged
summary generated
FHIR exported
PDF exported
```

Build:

```txt
GET /api/audit-events
```

---

### 7. HONESTY.md

Create/update `HONESTY.md`.

It must clearly say:

```txt
Real:
seed data, check-in simulation, risk engine, FHIR export, audit events

Mocked:
real hospital integration, real eHealth+ integration, real wearable connection, clinical validation

Safety:
not diagnosis, not treatment, not emergency triage, professional review needed
```

---

## Done means

You are done when:

```txt
seed data works
Mrs. Chan demo works
reset works
risky check-in works
FHIR export works
audit events work
HONESTY.md exists
no secrets are committed
```

Your goal:

```txt
Make the project feel technically real and demo-safe.
```
