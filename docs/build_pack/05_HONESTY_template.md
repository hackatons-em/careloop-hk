# HONESTY.md — CareLoop HK

## Project

CareLoop HK is a hackathon prototype for remote chronic-care monitoring among elderly patients in Hong Kong.

It uses daily check-ins, vital/wearable sample data, and deterministic escalation rules to identify patients who may need nurse review.

AI is used only for summarisation and caregiver-friendly wording.

CareLoop does not diagnose, prescribe, or replace clinical judgement.

## What Is Real

The following parts are implemented in this hackathon prototype:

- Patient dashboard
- Patient detail timeline
- Daily check-in simulation
- Rule-based risk flagging
- Matched-rule explanations
- Nurse review queue
- Alert acknowledgement flow
- Caregiver alert text generation
- Weekly summary generation
- PDF summary export
- FHIR-style JSON export
- Audit event logging
- Demo reset / seeded patient data

## What Is Mocked or Simulated

The following parts are mocked or simulated:

- Real Twilio phone calls, if Twilio is not enabled
- Real Apple Health / Fitbit / Garmin integration, if sample CSV is used
- Real Hong Kong eHealth+ integration
- Real hospital EHR integration
- Real clinical validation
- Real deployment in care homes or clinics
- Real Cantonese clinical review
- Real emergency escalation
- Real nurse staffing workflow
- Production-grade identity and access control

## AI Usage

AI is used only for:

- Summarising weekly patient monitoring data
- Producing caregiver-friendly wording
- Optional Traditional Chinese translation
- Formatting clinician summary text

AI is not used for:

- Diagnosis
- Treatment recommendations
- Medication changes
- Emergency triage
- Risk severity classification

Risk severity is calculated by deterministic rules.

## Risk Engine

The risk engine is rule-based.

Example rules:

- HF-001: weight increase >= 2 kg in 3 days → Review today
- HF-002: weight gain + shortness of breath + swelling → Escalate
- MED-001: missed medication 2 days in a row → Review today
- BP-001: systolic BP > 180 or diastolic BP > 110 → Escalate
- ACT-001: activity drop >40% from baseline for 3 days → Watch

These rules are for demonstration only and are not clinically validated.

## Safety Boundaries

CareLoop HK is not a medical device.

CareLoop HK does not diagnose disease.

CareLoop HK does not prescribe treatment.

CareLoop HK does not replace a doctor, nurse, pharmacist, or emergency service.

All alerts are intended as monitoring prompts for professional review.

If a patient has severe symptoms, they should seek urgent medical care according to local emergency guidance.

## Data

All demo patient data is synthetic.

No real patient data is included.

No real hospital data is included.

No real eHealth+ data is included.

## FHIR Export

The FHIR-style JSON export is a prototype intended to demonstrate interoperability thinking.

It is not certified for production clinical exchange.

## Known Limitations

- Synthetic demo data only
- Limited chronic-care rules
- Limited patient population
- No clinical validation
- No real device integration unless implemented separately
- No production security review
- No regulatory approval
- Not suitable for live patient care

## Why This Is Still Useful

This prototype demonstrates a narrow workflow:

```txt
daily elderly check-in
+ vital/wearable monitoring
+ deterministic risk rules
+ nurse review
+ caregiver alert
+ clinician summary
+ FHIR-style export
```

The goal is to show how between-visit chronic-care monitoring could become safer, more explainable, and more operational for Hong Kong elderly care.
