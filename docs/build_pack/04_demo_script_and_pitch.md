# CareLoop HK — Demo Script and Pitch

## 30-second Business Pitch

CareLoop HK helps elderly chronic-disease patients stay safe between clinic visits. It combines daily Cantonese check-ins, wearable/vital data, and rule-based escalation into a nurse dashboard, so families and care teams can catch deterioration earlier. AI is used only to summarise monitoring data into caregiver and clinician-friendly reports; the risk alerts are deterministic, explainable, and designed for professional review.

## Killer Opening

```txt
Elderly chronic-care patients do not deteriorate only during clinic visits. CareLoop watches the gaps between visits.
```

Alternative:

```txt
Hong Kong’s elderly patients may wait months between reviews. CareLoop turns daily signals into nurse action before deterioration becomes an emergency.
```

## 2-minute Business Video Script

### 0:00–0:20 — Problem

Hong Kong’s population is ageing, and chronic disease management is becoming a system-level pressure. Many elderly patients are only reviewed months later, unless they deteriorate badly enough to seek urgent care.

The dangerous part is the gap between visits.

### 0:20–0:45 — Product

CareLoop HK monitors that gap. It combines daily Cantonese check-ins, wearable or vital-sign data, and deterministic escalation rules into a nurse dashboard.

It is not an AI doctor. It does not diagnose or prescribe. It flags monitoring risks for nurse or clinician review.

### 0:45–1:15 — Demo

In the demo, Mrs. Chan is a 78-year-old heart-failure and hypertension patient. She reports shortness of breath and swelling, her weight has increased by more than 2 kg in three days, and she missed medication.

CareLoop matches explainable rules, creates an alert, and moves her into the nurse review queue.

### 1:15–1:40 — Outputs

The nurse can acknowledge the alert, notify family, and generate a weekly clinician summary. The platform also exports a PDF and a FHIR-style JSON bundle, so the information can fit into clinical workflows.

### 1:40–2:00 — Why now

The business opportunity is care agencies, elderly-care operators, clinics, insurers, and NGOs that need scalable monitoring without replacing clinicians.

CareLoop is built around one idea: earlier signals, fewer missed deteriorations, and safer chronic-care follow-up.

## 3-minute Demo Script

### 0:00–0:20 — Intro

Say:

```txt
CareLoop HK is a remote chronic-care monitoring platform for elderly Hong Kong patients. We are focusing first on heart-failure and hypertension patients between clinic visits.
```

Show landing page.

### 0:20–0:50 — Nurse Dashboard

Open dashboard.

Say:

```txt
This is the nurse dashboard. It shows elderly patients, their latest check-in, risk state, and the top reason for review.
```

Point to Mrs. Chan.

Say:

```txt
Mrs. Chan is flagged because her recent monitoring data suggests possible deterioration.
```

### 0:50–1:25 — Patient Timeline

Open Mrs. Chan.

Show weight, BP, activity, medication adherence, daily check-ins.

Say:

```txt
The product is not waiting for one dramatic emergency event. It combines small signals over time: weight, symptoms, medication adherence, and activity.
```

### 1:25–2:00 — Run Risky Check-in

Click “Run risky check-in”.

Say:

```txt
Now Mrs. Chan reports shortness of breath and swelling, and her weight has increased by more than 2 kg in three days.
```

Show risk result.

Say:

```txt
CareLoop does not ask an LLM to decide severity. The rule engine matched HF-001 and HF-002, so the case is escalated for nurse review.
```

### 2:00–2:30 — Nurse Queue and Caregiver Alert

Open alert queue.

Say:

```txt
The alert enters the nurse queue with the matched rules, evidence, and suggested operational action.
```

Show caregiver message.

Say:

```txt
The family gets a plain-language alert. It does not recommend treatment; it tells them what changed and that nurse review is recommended.
```

### 2:30–2:50 — Summary and FHIR Export

Generate weekly summary.

Say:

```txt
At the end of the week, CareLoop generates a clinician-ready summary and exports a FHIR-style bundle. This is designed to fit into healthcare workflows, not become another isolated app.
```

Show PDF/FHIR.

### 2:50–3:00 — Honesty

Open HONESTY.md.

Say:

```txt
Our HONESTY.md explains what is real, what is mocked, and the safety boundaries. This is monitoring support, not diagnosis.
```

## Slide Structure

Use 6 slides:

### Slide 1 — Title

```txt
CareLoop HK
Remote chronic-care monitoring for elderly patients between visits
```

### Slide 2 — Problem

```txt
Elderly chronic-care patients deteriorate between visits.
Families and nurses often miss early signals until the patient needs urgent care.
```

### Slide 3 — Product

```txt
Daily Cantonese check-ins
Wearable/vital data
Rule-based risk alerts
Nurse dashboard
Caregiver alerts
Weekly clinician summaries
FHIR-style export
```

### Slide 4 — Demo

```txt
Mrs. Chan, 78
Heart failure + hypertension
Weight +2.3kg in 3 days
Shortness of breath
Swelling
Missed meds
Alert created for nurse review
```

### Slide 5 — Business

```txt
Who pays:
care agencies
elderly-care operators
private clinics
insurers
NGOs

KPI:
earlier nurse review
fewer missed deteriorations
better follow-up adherence
less avoidable escalation
```

### Slide 6 — Why Now / Why Hong Kong

```txt
Hong Kong faces ageing and chronic-care pressure.
CareLoop supports primary-care monitoring and eHealth-style interoperability.
The product is narrow, safe, and demoable.
```

## Judge Q&A

### Is this diagnosis?

No. CareLoop does not diagnose or prescribe. It uses deterministic monitoring rules to flag when a nurse or clinician should review a patient.

### What is real?

The dashboard, check-in simulation, rule engine, alert queue, summary generation, PDF export, and FHIR-style export are real. Hospital/eHealth integration is mocked for the hackathon.

### Who pays?

Initial buyers are care agencies, elderly-care operators, private clinics, NGOs, and insurers managing chronic-care populations.

### What breaks at scale?

False alarms, incomplete data, device fragmentation, and clinical liability. We handle this with conservative thresholds, data completeness scoring, human-in-the-loop nurse review, audit logs, and no diagnosis or treatment recommendations.

### Why Hong Kong?

Hong Kong has strong ageing and chronic-disease pressure, and its health system is moving toward stronger primary-care and eHealth infrastructure. CareLoop fits that direction by turning between-visit monitoring into a workflow.
