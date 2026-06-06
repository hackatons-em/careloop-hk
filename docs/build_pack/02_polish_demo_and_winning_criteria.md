# CareLoop HK — Polish, Demo, and Winning Criteria Pass

## Goal

Improve the MVP so it feels like a serious healthcare workflow tool, not a generic AI dashboard.

## Polish Tasks

### Dashboard

1. Make the dashboard clean and clinical.
2. Add realistic sample patients:
   - Mrs. Chan, 78, heart failure + hypertension, high risk
   - Mr. Lee, 72, diabetes, watch
   - Mrs. Wong, 81, COPD, stable
   - Mr. Ho, 76, post-stroke, watch
   - Mrs. Lam, 84, kidney disease, stable
3. Add filter tabs:
   - All
   - Stable
   - Watch
   - Review today
   - Escalate
4. Add risk reason badges:
   - weight gain
   - missed meds
   - low activity
   - high BP
   - symptoms reported

### Demo Controls

Add:
- Reset demo data
- Run risky check-in
- Generate weekly summary
- Export FHIR bundle
- Download PDF

These buttons are for demo reliability.

### Bilingual Support

Add bilingual snippets:
- English
- Traditional Chinese caregiver alert

Do not overdo translation. A few strong bilingual moments are enough.

### Safety Labels

Add visible safety labels:
- Not diagnosis
- For nurse/clinician review
- Demo data
- No treatment recommendation

### FHIR Export

Improve FHIR export formatting. It should look intentional and structured, not random JSON.

Include:
- resourceType
- id
- subject
- effectiveDateTime
- valueQuantity
- code
- system
- display

### PDF Weekly Summary

PDF should include:
- CareLoop HK logo/name
- Patient
- Week
- Risk trend
- Vitals
- Symptoms
- Medication adherence
- Matched rules
- Nurse notes
- Data completeness
- Safety disclaimer

### Audit Events

Add audit events:
- check-in submitted
- risk evaluated
- alert created
- alert acknowledged
- summary generated
- FHIR exported
- PDF generated
- demo data reset

### HONESTY.md

Add footer link:
```txt
View HONESTY.md
```

## Demo Must Prove

The demo should prove:
- real workflow
- real rule engine
- real summary generation
- real PDF export
- real FHIR-style export
- real safety boundaries

## Judge Questions To Answer In Product

### Who pays?

Answer:
- care agencies
- elderly-care operators
- private clinics
- insurers
- NGOs running elderly chronic-care programs

### What breaks at scale?

Answer:
- false alarms
- incomplete data
- device fragmentation
- clinical liability
- caregiver trust

### How we handle it

Answer:
- conservative rules
- data completeness score
- human-in-the-loop nurse review
- audit trail
- FHIR-compatible exports
- no diagnosis or treatment recommendations

## README Copy

Add:

```txt
CareLoop HK is a hackathon prototype for remote chronic-care monitoring among elderly patients in Hong Kong.

It uses daily check-ins, vital/wearable sample data, and deterministic escalation rules to identify patients who may need nurse review.

AI is used only for summarisation and caregiver-friendly wording.

CareLoop does not diagnose, prescribe, or replace clinical judgement.
```

## Presentation Polish

Opening line:

```txt
Elderly chronic-care patients do not deteriorate only during clinic visits. CareLoop watches the gaps between visits.
```

Demo flow:
1. Show patient dashboard.
2. Open Mrs. Chan.
3. Run risky check-in.
4. Show matched rules.
5. Show nurse queue.
6. Show caregiver alert.
7. Generate weekly PDF.
8. Export FHIR JSON.
9. Open HONESTY.md.

Closing line:

```txt
CareLoop is not trying to replace clinicians. It gives nurses, families, and clinics an earlier signal before an elderly patient becomes an emergency.
```

## Final Quality Bar

The app should make judges say:

```txt
This is narrow, Hong Kong-relevant, technically credible, and actually demoable.
```

If the product feels like a generic AI companion, rebuild around the nurse workflow and risk rules.
