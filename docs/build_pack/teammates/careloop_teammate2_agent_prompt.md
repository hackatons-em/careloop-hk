# CareLoop HK — Teammate 2 AI Agent Build Prompt

## Role

You are building the **UI Polish, Presentation, Demo Story, Business Layer, and Judging Materials** for CareLoop HK.

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

Your job is to make the product look and present like a serious, polished, hackathon-winning HealthTech product.

You are **not** responsible for the core backend risk engine, seed data, FHIR export, or audit events unless needed for UI integration.

You are responsible for:

```txt
1. Visual UI polish
2. Landing / demo intro page
3. Business case page or README section
4. Pitch slides content
5. 2-minute business video script
6. 3-minute demo script
7. Judge Q&A sheet
8. Safety disclaimers across UI
9. Product storytelling
```

Do not make the product look like a generic AI wellness app.

Do not use cartoon elderly illustrations, AI gradients, fake hospital branding, or overclaimed medical language.

CareLoop must be presented as:

```txt
monitoring support
nurse workflow
caregiver coordination
clinician summary
FHIR-style interoperability
```

not:

```txt
AI doctor
diagnosis tool
treatment recommender
emergency triage
medical device
```

---

# Product Positioning

Use this positioning everywhere:

```txt
CareLoop HK helps elderly chronic-disease patients stay safe between clinic visits by turning daily check-ins and vital signals into nurse-review workflows.
```

Short version:

```txt
CareLoop watches the gaps between visits.
```

Do not say:

```txt
AI diagnoses deterioration
AI treats elderly patients
AI replaces nurses
AI predicts emergencies
```

Say:

```txt
CareLoop flags monitoring risks for professional review.
```

---

# Build 1 — Visual Design Polish

The app should feel:

```txt
clean
clinical
modern
trustworthy
Hong Kong-relevant
calm under pressure
```

Use:

```txt
light theme
soft blue/green healthcare accents
clear typography
readable charts
professional dashboard layout
simple risk badges
good spacing
visible safety disclaimers
```

Avoid:

```txt
AI gradients
cartoon elderly illustrations
medical stock photos
fake hospital logos
overly dark dashboard
cluttered cards
busy colors
generic SaaS visuals
```

## Risk Color System

Use:

```txt
Stable: green
Watch: blue
Review today: amber
Escalate: red
```

Every alert/high-risk screen must include:

```txt
For nurse/clinician review
Not diagnosis
No treatment recommendation
Demo data
```

---

# Build 2 — Landing / Demo Intro Page

Create the first screen judges see before the dashboard.

## Page content

```txt
CareLoop HK

Remote chronic-care monitoring for elderly patients between visits.

Daily Cantonese check-ins + wearable/vital signals + deterministic escalation rules + nurse dashboard + weekly clinician summary.

CareLoop does not diagnose or prescribe. It flags monitoring risks for professional review.
```

## Buttons

```txt
Start demo
View HONESTY.md
```

## Proof Cards

Add three small proof cards:

```txt
Elderly chronic-care monitoring
Rule-based escalation
FHIR-style export
```

## Design style

Clean and serious. No hype. The judge should understand the product in 10 seconds.

---

# Build 3 — UI Copy Pass

Go through the app and replace generic text with specific healthcare workflow text.

## Good copy

```txt
Risk alert created for nurse review
Matched rule: HF-002
Weight increased 2.3kg over 3 days
Caregiver alert generated
Weekly clinician summary ready
FHIR-style bundle exported
```

## Bad copy

```txt
AI detected a health issue
Patient is in danger
Diagnosis generated
Treatment recommended
Smart AI insights
```

The copy must always make it clear that the product flags monitoring risks, not clinical diagnoses.

---

# Build 4 — Business Case Page / README Section

Create a page or README section titled:

```txt
Business Case
```

It should answer these exact questions.

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

## KPI

```txt
time to nurse review
number of high-risk patients reviewed
missed check-ins
medication adherence
avoidable escalation signals
caregiver response time
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
data completeness score
human-in-the-loop nurse review
audit trail
clear disclaimers
FHIR-style export
no diagnosis or treatment recommendation
```

This can be a dedicated app page, README section, or both.

---

# Build 5 — Pitch Slides

Create content for 6 clean slides.

If you can generate actual slides, create them. Otherwise create a polished `pitch_slides.md`.

## Slide 1 — Title

```txt
CareLoop HK
Remote chronic-care monitoring for elderly patients between visits
```

Subtitle:

```txt
Daily check-ins, vital signals, rule-based escalation, and nurse review.
```

## Slide 2 — Problem

```txt
Elderly chronic-care patients deteriorate between visits.

Families and care teams often miss early signals until the patient needs urgent care.
```

Examples:

```txt
weight gain
shortness of breath
missed medication
low activity
high blood pressure
```

## Slide 3 — Product

```txt
CareLoop turns daily signals into nurse action.

1. Daily Cantonese check-in
2. Wearable/vital data
3. Rule-based risk alerts
4. Nurse review queue
5. Caregiver alert
6. Weekly clinician summary
7. FHIR-style export
```

## Slide 4 — Demo Case

```txt
Mrs. Chan, 78
Heart failure + hypertension

Signals:
+2.3kg in 3 days
shortness of breath
swelling
missed medication

Result:
HF-001 and HF-002 matched
Escalate to nurse review
```

## Slide 5 — Business

```txt
Who pays:
elderly-care operators
care agencies
private clinics
insurers
NGOs

KPI:
earlier nurse review
fewer missed deteriorations
better follow-up adherence
```

## Slide 6 — Why Hong Kong / Why Now

```txt
Hong Kong faces ageing and chronic-care pressure.

CareLoop supports between-visit monitoring and eHealth-style interoperability without replacing clinicians.
```

Closing:

```txt
CareLoop watches the gaps between visits.
```

---

# Build 6 — 2-Minute Business Video Script

Create a file:

```txt
business_video_script.md
```

Use this script:

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

Make the text readable and easy for a teammate to record.

---

# Build 7 — 3-Minute Demo Script

Create a file:

```txt
demo_script.md
```

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

Use this script:

```txt
CareLoop HK is a remote chronic-care monitoring platform for elderly Hong Kong patients. We are focusing first on heart-failure and hypertension patients between clinic visits.

This is the nurse dashboard. It shows elderly patients, their latest check-in, risk state, and the top reason for review.

Mrs. Chan is flagged because her recent monitoring data suggests possible deterioration.

The product is not waiting for one dramatic emergency event. It combines small signals over time: weight, symptoms, medication adherence, and activity.

Now Mrs. Chan reports shortness of breath and swelling, and her weight has increased by more than 2 kg in three days.

CareLoop does not ask an LLM to decide severity. The rule engine matched HF-001 and HF-002, so the case is escalated for nurse review.

The alert enters the nurse queue with the matched rules, evidence, and suggested operational action.

The family gets a plain-language alert. It does not recommend treatment; it tells them what changed and that nurse review is recommended.

At the end of the week, CareLoop generates a clinician-ready summary and exports a FHIR-style bundle. This is designed to fit into healthcare workflows, not become another isolated app.

Our HONESTY.md explains what is real, what is mocked, and the safety boundaries. This is monitoring support, not diagnosis.
```

---

# Build 8 — Judge Q&A Sheet

Create a file:

```txt
judge_qa.md
```

Include these exact answers.

## Is this diagnosis?

```txt
No. CareLoop does not diagnose or prescribe. It uses deterministic monitoring rules to flag when a nurse or clinician should review a patient.
```

## What is real?

```txt
The dashboard, check-in simulation, rule engine, alert queue, summary generation, PDF export, and FHIR-style export are real. Hospital/eHealth integration is mocked for the hackathon.
```

## Who pays?

```txt
Initial buyers are care agencies, elderly-care operators, private clinics, NGOs, and insurers managing chronic-care populations.
```

## What breaks at scale?

```txt
False alarms, incomplete data, device fragmentation, and clinical liability. We handle this with conservative thresholds, data completeness scoring, human-in-the-loop nurse review, audit logs, and no diagnosis or treatment recommendations.
```

## Why Hong Kong?

```txt
Hong Kong has strong ageing and chronic-disease pressure, and its health system is moving toward stronger primary-care and eHealth infrastructure. CareLoop fits that direction by turning between-visit monitoring into a workflow.
```

## Why not just a phone call?

```txt
Phone calls are unstructured and easy to miss. CareLoop turns check-ins into structured monitoring data, matched rules, nurse tasks, caregiver alerts, and clinician-ready summaries.
```

## Why is this AI?

```txt
AI is used where it is safe: summarising monitoring data and rewriting it for caregivers and clinicians. The actual risk logic is deterministic and auditable.
```

---

# Build 9 — UI Safety Disclaimers

Add visible safety copy in:

```txt
landing page
patient detail
risk alert card
caregiver alert
weekly summary
footer
HONESTY.md link
```

Use:

```txt
CareLoop flags monitoring risks for professional review. It does not diagnose or prescribe.
```

On alert pages, add:

```txt
This alert is not a diagnosis or treatment recommendation.
```

---

# Build 10 — Final Presentation Checklist

Before calling your part done, verify:

```txt
App looks polished and credible.
Landing/demo intro page exists.
Business case section exists.
Pitch slides or pitch_slides.md exists.
2-minute video script exists.
3-minute demo script exists.
Judge Q&A sheet exists.
UI has safety disclaimers.
UI does not look generic.
UI does not overclaim medical capability.
Product feels Hong Kong-specific and healthcare-serious.
```

---

# Acceptance Criteria

Your part is complete when:

1. The app looks polished and serious.
2. A judge understands the product in 10 seconds from the intro page.
3. The business case is clear.
4. The demo story is clear.
5. The pitch materials are ready.
6. Safety disclaimers are visible.
7. No text claims diagnosis, treatment, or emergency triage.
8. The product feels narrow, real, and hackathon-winning.

---

# Final Instruction

Do not add random extra product features.

Do not make generic AI pitch material.

Make the existing product look credible, clear, and judge-ready.

Your output should make the team able to say:

```txt
We have a polished product, a clean demo story, a business case, and answers to judge objections.
```
