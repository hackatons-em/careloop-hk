# CareLoop HK — Teammate 2 Simple Task List

## Your role

You are responsible for **UI polish, presentation, pitch, and judging materials**.

The product must look serious, clean, and healthcare-ready — not like a generic AI app.

## What you build

### 1. Make the UI look good

The app should feel:

```txt
clean
clinical
modern
trustworthy
Hong Kong-relevant
```

Use:

```txt
light theme
soft blue/green accents
clear charts
calm alert colors
professional cards
good spacing
readable text
```

Avoid:

```txt
cartoon elderly images
AI gradients
fake hospital logos
stock medical photos
messy dashboard
claims like “AI diagnosis”
```

Risk colors:

```txt
Stable = green
Watch = blue
Review today = amber
Escalate = red
```

Every risky screen should show:

```txt
Not diagnosis
For nurse/clinician review
No treatment recommendation
Demo data
```

---

### 2. Build the intro page

First screen should say:

```txt
CareLoop HK

Remote chronic-care monitoring for elderly patients between visits.

Daily Cantonese check-ins + wearable/vital signals + deterministic escalation rules + nurse dashboard + weekly clinician summary.

CareLoop does not diagnose or prescribe. It flags monitoring risks for professional review.
```

Buttons:

```txt
Start demo
View HONESTY.md
```

---

### 3. Add business case section

Create a page or README section called:

```txt
Business Case
```

It should answer:

## Who pays?

```txt
elderly-care operators
home-care agencies
private clinics
insurers
NGOs running elderly chronic-care programs
care coordination providers
```

## Why they pay

```txt
earlier nurse review
fewer missed deteriorations
better caregiver coordination
better follow-up adherence
less avoidable urgent escalation
clinician-ready summaries
structured export for healthcare workflows
```

## What breaks at scale?

```txt
false alarms
incomplete data
device fragmentation
caregiver trust
clinical liability
workflow adoption
```

## How we handle it

```txt
conservative rules
human-in-the-loop nurse review
audit trail
clear disclaimers
FHIR-style export
no diagnosis or treatment recommendation
```

---

### 4. Create 6 pitch slides

Slide 1:

```txt
CareLoop HK
Remote chronic-care monitoring for elderly patients between visits
```

Slide 2:

```txt
Problem:
Elderly chronic-care patients deteriorate between visits.
Families and care teams often miss early signals until urgent care is needed.
```

Slide 3:

```txt
Product:
Daily Cantonese check-ins
Wearable/vital data
Rule-based risk alerts
Nurse dashboard
Caregiver alerts
Weekly clinician summaries
FHIR-style export
```

Slide 4:

```txt
Demo case:
Mrs. Chan, 78
Heart failure + hypertension
+2.3kg in 3 days
shortness of breath
swelling
missed medication
alert created for nurse review
```

Slide 5:

```txt
Business:
Who pays: elderly-care operators, care agencies, private clinics, insurers, NGOs
KPI: earlier nurse review, fewer missed deteriorations, better follow-up adherence
```

Slide 6:

```txt
Why Hong Kong / Why now:
Hong Kong faces ageing and chronic-care pressure.
CareLoop supports between-visit monitoring and eHealth-style interoperability without replacing clinicians.
```

Closing line:

```txt
CareLoop watches the gaps between visits.
```

---

### 5. Prepare 2-minute business video script

Use this:

```txt
Hong Kong’s population is ageing, and chronic disease management is becoming a system-level pressure. But many elderly patients are only reviewed months later, unless they deteriorate badly enough to seek urgent care.

The dangerous part is the gap between visits.

CareLoop HK monitors that gap. It combines daily Cantonese check-ins, wearable or vital-sign data, and deterministic escalation rules into a nurse dashboard.

It is not an AI doctor. It does not diagnose or prescribe. It flags monitoring risks for nurse or clinician review.

In our demo, Mrs. Chan is a 78-year-old heart-failure and hypertension patient. She reports shortness of breath and swelling, her weight has increased by more than 2 kg in three days, and she missed medication.

CareLoop matches explainable rules, creates an alert, and moves her into the nurse review queue.

The nurse can acknowledge the alert, notify family, and generate a weekly clinician summary. The platform also exports a PDF and a FHIR-style JSON bundle, so the information can fit into clinical workflows.

Our first buyers would be elderly-care operators, care agencies, private clinics, insurers, and NGOs managing chronic-care populations.

CareLoop is built around one idea: earlier signals, fewer missed deteriorations, and safer chronic-care follow-up.
```

---

### 6. Prepare 3-minute demo script

Use this flow:

```txt
1. Show intro page.
2. Open nurse dashboard.
3. Open Mrs. Chan.
4. Show worsening charts.
5. Run risky check-in.
6. Show matched rules.
7. Open nurse alert queue.
8. Show caregiver alert.
9. Generate weekly summary.
10. Export FHIR JSON.
11. Open HONESTY.md.
```

Key line:

```txt
CareLoop does not ask an LLM to decide severity. The risk engine is deterministic and explainable.
```

---

### 7. Prepare judge Q&A

Must answer:

## Is this diagnosis?

```txt
No. CareLoop does not diagnose or prescribe. It uses deterministic monitoring rules to flag when a nurse or clinician should review a patient.
```

## What is real?

```txt
The dashboard, check-in simulation, rule engine, alert queue, summary generation, PDF export, and FHIR-style export are real. Hospital/eHealth integration is mocked.
```

## Who pays?

```txt
Care agencies, elderly-care operators, private clinics, NGOs, and insurers.
```

## What breaks at scale?

```txt
False alarms, incomplete data, device fragmentation, and clinical liability.
```

## How do we handle it?

```txt
Conservative rules, nurse review, data completeness scoring, audit logs, and no diagnosis or treatment recommendations.
```

---

## Done means

You are done when:

```txt
app looks polished
intro page exists
business section exists
pitch slides are ready
2-minute script is ready
3-minute demo script is ready
judge Q&A is ready
UI has safety disclaimers
nothing looks generic or medically overclaimed
```

Your goal:

```txt
Make the project look serious, understandable, and winning.
```
