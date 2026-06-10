# CareLoop Pilot Program Agreement — TEMPLATE

> **DRAFT — NOT LEGAL ADVICE.** This template structures the commercial terms
> a CareLoop pilot needs. It MUST be reviewed and adapted by licensed Hong
> Kong counsel before signature. Bracketed fields are placeholders.

**Between:** [CareLoop legal entity name] ("Provider")
**And:** [Hospital / Institution legal name] ("Customer")
**Effective date:** [date]

## 1. Pilot scope
- Service: the CareLoop remote chronic-care monitoring platform (the
  "Service"), deployed as a dedicated instance for the Customer.
- Cohort: up to [N] patients in [ward / program name].
- Term: [3] months from the Go-Live Date, non-renewing unless extended in
  writing.
- Languages: English and Traditional Chinese (zh-HK) user interface; patient
  check-ins in Cantonese and English over WhatsApp.

## 2. Fees
- Fixed pilot fee: [HKD amount], invoiced [on signature / 50-50], payable
  [30] days net.
- The pilot fee includes provisioning, training ([X] hours), and support per
  §6. No per-clinician charges.

## 3. What the Service is — and is not
- The Service provides **monitoring support**: it collects daily check-ins
  and vital readings, applies deterministic escalation rules, and surfaces
  results to the Customer's clinical staff.
- The Service is **not a medical device**, does not diagnose, prescribe, or
  recommend treatment, and does not replace clinical judgment or emergency
  services. Clinical decisions remain solely the Customer's responsibility.
- Escalation thresholds are demonstration values informed by published
  guidance (ESC/HFSA, ACC/AHA) and are **not clinically validated**; the
  Customer's clinicians must review and accept the rule set before Go-Live
  ([Appendix B] lists the active rules).

## 4. Data
- Roles: Customer is the data user/controller; Provider is the data
  processor, per the Data Processing Agreement at [Appendix A / separate DPA].
- Dedicated instance: Customer data resides in a database and application
  deployment exclusive to the Customer, in [region], and is not shared with
  any other Provider customer.
- On termination: Provider returns or deletes all Customer data within [30]
  days, per the DPA.

## 5. Customer responsibilities
- Obtain any patient/caregiver consents required for WhatsApp-based
  monitoring under PDPO and the Customer's own policies.
- Designate an administrator; manage staff access; follow up on alerts and
  missed check-ins per the Customer's clinical protocols.
- Provide clinical feedback at the weekly pilot reviews.

## 6. Support & service levels (pilot)
- Support channel: [email/phone], business hours [HKT 9:00–18:00, Mon–Fri].
- Response targets: [P1 outage: 4 business hours; P2: 1 business day].
- Weekly pilot review meeting with the Provider team.
- No uptime SLA during the pilot; production SLAs are defined in the
  subsequent subscription agreement.

## 7. Success criteria (jointly owned)
[Define 3–5 measurable criteria, e.g.:]
- ≥ [70]% daily check-in completion across the cohort by week [4]
- Median time-to-nurse-review of escalations ≤ [X hours]
- Nurse-reported usability score ≥ [X]
- Zero unresolved P1 incidents in the final month

## 8. Liability
- Aggregate liability cap: [the pilot fee paid].
- Neither party liable for indirect or consequential loss.
- Nothing limits liability for fraud, or death/personal injury caused by
  negligence, or other liability that cannot be limited under Hong Kong law.
- [Counsel: review interaction with clinical-responsibility allocation in §3.]

## 9. Term & termination
- Either party may terminate on [14] days' written notice.
- Provider may suspend the Service immediately for security necessity, with
  prompt notice.
- §§3, 4, 8, 10 survive termination.

## 10. General
- Confidentiality: mutual, standard terms.
- IP: Provider retains all rights in the Service; Customer retains all
  rights in Customer data.
- Governing law: Hong Kong SAR; jurisdiction: Hong Kong courts.
- Entire agreement; amendments in writing.

**Signatures**

| Provider | Customer |
|---|---|
| Name: | Name: |
| Title: | Title: |
| Date: | Date: |

---
*Appendix A — Data Processing Agreement (see `DPA-TEMPLATE.md`)*
*Appendix B — Active escalation rule set (export from the deployed instance)*
