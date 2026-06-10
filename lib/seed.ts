// CareLoop — Synthetic seed data (teammate-1 zone)
//
// All data is SYNTHETIC. No real patients. Five elderly Hong Kong chronic-care
// patients with 7 days of vitals + daily check-ins. The numbers are tuned so
// the DETERMINISTIC risk engine independently computes each patient's intended
// state — severity is never hard-coded, it falls out of lib/riskEngine.ts.
//
//   Mrs. Chan  → Escalate  (HF-001 + HF-002, missed meds, low activity)
//   Mr. Lee    → Watch     (ACT-001 sustained activity drop)
//   Mrs. Wong  → Stable
//   Mr. Ho     → Watch     (ACT-001 sustained activity drop)
//   Mrs. Lam   → Stable

import type {
  DailyCheckIn,
  Patient,
  VitalReading,
  VitalType,
} from "./types";

/** Seven consecutive demo days ending "today" (2026-06-06). */
export const DEMO_DATES = [
  "2026-05-31",
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
  "2026-06-05",
  "2026-06-06",
] as const;

export const WEEK_START: string = DEMO_DATES[0];
export const WEEK_END: string = DEMO_DATES[DEMO_DATES.length - 1];

export interface SeedDataset {
  patients: Patient[];
  vitals: VitalReading[];
  checkins: DailyCheckIn[];
}

interface DayRow {
  w: number; // weight kg
  sys: number; // systolic mmHg
  dia: number; // diastolic mmHg
  hr: number; // heart rate bpm
  steps: number;
  sleep: number; // hours
  med: boolean; // medication taken
  sob: boolean; // shortness of breath
  sw: boolean; // swelling
  dz: boolean; // dizziness
  ch: boolean; // chest discomfort
  mood: string;
  note?: string;
  skipCheckin?: boolean; // patient missed the daily check-in that day
}

interface PatientDef {
  // Seed literals omit the production-only columns (phone, status, caregiver
  // email, consent); buildSeed fills the defaults so the dataset always
  // matches the Patient type.
  patient: Omit<
    Patient,
    | "phone"
    | "status"
    | "caregiver_email"
    | "consent_caregiver_alerts"
    | "consent_family_digest"
    | "consent_updated_at"
  >;
  rows: DayRow[]; // exactly 7, aligned with DEMO_DATES
}

const UNIT: Record<VitalType, string> = {
  weight: "kg",
  blood_pressure_systolic: "mmHg",
  blood_pressure_diastolic: "mmHg",
  heart_rate: "bpm",
  steps: "steps",
  sleep_hours: "h",
};

const PATIENT_DEFS: PatientDef[] = [
  {
    patient: {
      id: "patient-mrs-chan",
      name: "Mrs. Chan",
      age: 78,
      gender: "female",
      language: "Cantonese",
      living_status: "lives alone",
      conditions: ["heart failure", "hypertension"],
      caregiver_name: "Daughter (Ms. Chan)",
      caregiver_phone: "+852 9123 4567",
      assigned_nurse: "Nurse Lee",
      baseline_weight: 62.0,
      baseline_steps: 3500,
    },
    rows: [
      { w: 61.6, sys: 138, dia: 84, hr: 76, steps: 3400, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 61.8, sys: 140, dia: 85, hr: 77, steps: 3250, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 61.9, sys: 142, dia: 86, hr: 78, steps: 3000, sleep: 6.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "a little tired" },
      { w: 62.0, sys: 148, dia: 88, hr: 80, steps: 2600, sleep: 6.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 62.8, sys: 152, dia: 90, hr: 82, steps: 2050, sleep: 5.8, med: false, sob: true, sw: false, dz: false, ch: false, mood: "breathless at times", note: "Short of breath after walking to the kitchen." },
      { w: 63.6, sys: 156, dia: 92, hr: 85, steps: 1900, sleep: 5.5, med: false, sob: true, sw: true, dz: false, ch: false, mood: "breathless", note: "Ankles look swollen this evening." },
      { w: 64.3, sys: 158, dia: 94, hr: 88, steps: 1750, sleep: 5.4, med: false, sob: true, sw: true, dz: false, ch: false, mood: "very tired", note: "Breathless climbing stairs, feet and ankles puffy, did not take evening medicine." },
    ],
  },
  {
    patient: {
      id: "patient-mr-lee",
      name: "Mr. Lee",
      age: 72,
      gender: "male",
      language: "Cantonese, English",
      living_status: "lives with spouse",
      conditions: ["diabetes"],
      caregiver_name: "Wife (Mrs. Lee)",
      caregiver_phone: "+852 9234 5678",
      assigned_nurse: "Nurse Wong",
      baseline_weight: 70.0,
      baseline_steps: 4200,
    },
    rows: [
      { w: 70.1, sys: 132, dia: 80, hr: 74, steps: 4100, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 70.0, sys: 130, dia: 79, hr: 73, steps: 4000, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 69.9, sys: 131, dia: 80, hr: 75, steps: 3800, sleep: 6.7, med: false, sob: false, sw: false, dz: false, ch: false, mood: "ok", note: "Forgot morning tablet." },
      { w: 70.0, sys: 133, dia: 81, hr: 74, steps: 3000, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 69.8, sys: 132, dia: 80, hr: 76, steps: 2400, sleep: 6.4, med: true, sob: false, sw: false, dz: false, ch: false, mood: "a bit tired" },
      { w: 69.9, sys: 134, dia: 82, hr: 77, steps: 2200, sleep: 6.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", note: "Staying in more, knees sore." },
      { w: 70.0, sys: 133, dia: 81, hr: 76, steps: 2000, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", skipCheckin: true },
    ],
  },
  {
    patient: {
      id: "patient-mrs-wong",
      name: "Mrs. Wong",
      age: 81,
      gender: "female",
      language: "Cantonese",
      living_status: "lives with family",
      conditions: ["COPD"],
      caregiver_name: "Son (Mr. Wong)",
      caregiver_phone: "+852 9345 6789",
      assigned_nurse: "Nurse Lee",
      baseline_weight: 58.0,
      baseline_steps: 2800,
    },
    rows: [
      { w: 58.0, sys: 128, dia: 78, hr: 76, steps: 2750, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.1, sys: 126, dia: 77, hr: 75, steps: 2800, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 57.9, sys: 129, dia: 79, hr: 77, steps: 2700, sleep: 7.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.0, sys: 127, dia: 78, hr: 76, steps: 2850, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.2, sys: 128, dia: 78, hr: 78, steps: 2800, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.0, sys: 130, dia: 80, hr: 77, steps: 2750, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.1, sys: 128, dia: 79, hr: 76, steps: 2820, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
    ],
  },
  {
    patient: {
      id: "patient-mr-ho",
      name: "Mr. Ho",
      age: 76,
      gender: "male",
      language: "Cantonese",
      living_status: "lives with spouse",
      conditions: ["post-stroke recovery"],
      caregiver_name: "Wife (Mrs. Ho)",
      caregiver_phone: "+852 9456 7890",
      assigned_nurse: "Nurse Chan",
      baseline_weight: 68.0,
      baseline_steps: 3000,
    },
    rows: [
      { w: 68.0, sys: 132, dia: 80, hr: 72, steps: 2900, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 68.1, sys: 131, dia: 79, hr: 73, steps: 2800, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 67.9, sys: 133, dia: 81, hr: 74, steps: 2500, sleep: 6.6, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 68.0, sys: 132, dia: 80, hr: 73, steps: 2000, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 68.0, sys: 134, dia: 81, hr: 75, steps: 1700, sleep: 6.4, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", note: "Less steady walking today." },
      { w: 68.1, sys: 133, dia: 80, hr: 74, steps: 1600, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 68.0, sys: 132, dia: 81, hr: 76, steps: 1500, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "low energy" },
    ],
  },
  {
    patient: {
      id: "patient-mrs-lam",
      name: "Mrs. Lam",
      age: 84,
      gender: "female",
      language: "Cantonese",
      living_status: "lives in care home",
      conditions: ["kidney disease", "hypertension"],
      caregiver_name: "Care home staff",
      caregiver_phone: "+852 9567 8901",
      assigned_nurse: "Nurse Wong",
      baseline_weight: 54.0,
      baseline_steps: 2200,
    },
    rows: [
      { w: 54.0, sys: 142, dia: 84, hr: 74, steps: 2150, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.1, sys: 140, dia: 83, hr: 73, steps: 2200, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 53.9, sys: 144, dia: 85, hr: 75, steps: 2100, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.0, sys: 138, dia: 82, hr: 74, steps: 2250, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.2, sys: 146, dia: 86, hr: 76, steps: 2200, sleep: 7.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.0, sys: 143, dia: 84, hr: 75, steps: 2180, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.1, sys: 141, dia: 83, hr: 74, steps: 2210, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
    ],
  },
  {
    // Escalate — BP-001 (hypertensive crisis on the latest reading)
    patient: {
      id: "patient-mr-cheung",
      name: "Mr. Cheung",
      age: 79,
      gender: "male",
      language: "Cantonese",
      living_status: "lives with spouse",
      conditions: ["COPD", "hypertension"],
      caregiver_name: "Daughter (Ms. Cheung)",
      caregiver_phone: "+852 9678 9012",
      assigned_nurse: "Nurse Lee",
      baseline_weight: 66.0,
      baseline_steps: 2600,
    },
    rows: [
      { w: 66.0, sys: 150, dia: 88, hr: 78, steps: 2550, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 66.1, sys: 154, dia: 90, hr: 79, steps: 2500, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 65.9, sys: 158, dia: 92, hr: 80, steps: 2550, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 66.0, sys: 162, dia: 96, hr: 81, steps: 2500, sleep: 6.6, med: true, sob: false, sw: false, dz: false, ch: false, mood: "slight headache" },
      { w: 66.1, sys: 170, dia: 100, hr: 83, steps: 2480, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "headache" },
      { w: 66.0, sys: 178, dia: 106, hr: 85, steps: 2520, sleep: 6.4, med: true, sob: false, sw: false, dz: false, ch: false, mood: "headache, not great" },
      { w: 66.1, sys: 188, dia: 112, hr: 88, steps: 2500, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "bad headache", note: "Blood pressure very high with a persistent headache." },
    ],
  },
  {
    // Review today — HF-001 (weight up >=2kg/3d, no breathlessness/swelling)
    patient: {
      id: "patient-mrs-ng",
      name: "Mrs. Ng",
      age: 83,
      gender: "female",
      language: "Cantonese",
      living_status: "lives alone",
      conditions: ["heart failure", "hypertension"],
      caregiver_name: "Son (Mr. Ng)",
      caregiver_phone: "+852 9789 0123",
      assigned_nurse: "Nurse Chan",
      baseline_weight: 60.0,
      baseline_steps: 2400,
    },
    rows: [
      { w: 59.8, sys: 138, dia: 84, hr: 76, steps: 2350, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 60.0, sys: 140, dia: 85, hr: 77, steps: 2300, sleep: 6.4, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 60.1, sys: 142, dia: 86, hr: 77, steps: 2250, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 60.3, sys: 144, dia: 86, hr: 78, steps: 2200, sleep: 6.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "a little tired" },
      { w: 61.1, sys: 146, dia: 88, hr: 79, steps: 2150, sleep: 6.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 61.9, sys: 148, dia: 89, hr: 80, steps: 2100, sleep: 6.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 62.6, sys: 150, dia: 90, hr: 81, steps: 2080, sleep: 5.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", note: "Weight up and feeling more tired this week." },
    ],
  },
  {
    // Review today — MED-001 (medication missed two days in a row)
    patient: {
      id: "patient-mrs-tang",
      name: "Mrs. Tang",
      age: 75,
      gender: "female",
      language: "Cantonese, English",
      living_status: "lives with family",
      conditions: ["diabetes"],
      caregiver_name: "Daughter (Ms. Tang)",
      caregiver_phone: "+852 9890 1234",
      assigned_nurse: "Nurse Wong",
      baseline_weight: 64.0,
      baseline_steps: 3000,
    },
    rows: [
      { w: 64.0, sys: 130, dia: 80, hr: 74, steps: 2950, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 64.1, sys: 131, dia: 80, hr: 73, steps: 3000, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 63.9, sys: 129, dia: 79, hr: 75, steps: 2900, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 64.0, sys: 132, dia: 81, hr: 74, steps: 2950, sleep: 6.6, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 64.1, sys: 130, dia: 80, hr: 75, steps: 2900, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 64.0, sys: 131, dia: 81, hr: 75, steps: 2950, sleep: 6.4, med: false, sob: false, sw: false, dz: false, ch: false, mood: "forgot my pills", note: "Forgot the diabetes tablets today." },
      { w: 64.1, sys: 130, dia: 80, hr: 76, steps: 2900, sleep: 6.5, med: false, sob: false, sw: false, dz: false, ch: false, mood: "forgot again", note: "Forgot the tablets again." },
    ],
  },
  {
    // Review today — HF-001 (weight up, no breathlessness/swelling)
    patient: {
      id: "patient-mr-chow",
      name: "Mr. Chow",
      age: 80,
      gender: "male",
      language: "Cantonese",
      living_status: "lives with spouse",
      conditions: ["heart failure"],
      caregiver_name: "Wife (Mrs. Chow)",
      caregiver_phone: "+852 9901 2345",
      assigned_nurse: "Nurse Lee",
      baseline_weight: 71.0,
      baseline_steps: 3200,
    },
    rows: [
      { w: 70.8, sys: 134, dia: 82, hr: 75, steps: 3150, sleep: 6.6, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 71.0, sys: 135, dia: 82, hr: 76, steps: 3100, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 71.0, sys: 136, dia: 83, hr: 76, steps: 3050, sleep: 6.4, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 71.2, sys: 138, dia: 84, hr: 77, steps: 3000, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 71.9, sys: 140, dia: 85, hr: 78, steps: 2950, sleep: 6.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "a bit tired" },
      { w: 72.6, sys: 142, dia: 86, hr: 79, steps: 2900, sleep: 6.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 73.5, sys: 144, dia: 87, hr: 80, steps: 2880, sleep: 6.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", note: "Weight creeping up over the last few days." },
    ],
  },
  {
    // Review today — SYM-001 (reports breathlessness, stable weight)
    patient: {
      id: "patient-mrs-yip",
      name: "Mrs. Yip",
      age: 77,
      gender: "female",
      language: "Cantonese",
      living_status: "lives with family",
      conditions: ["COPD"],
      caregiver_name: "Son (Mr. Yip)",
      caregiver_phone: "+852 9012 3456",
      assigned_nurse: "Nurse Wong",
      baseline_weight: 56.0,
      baseline_steps: 2700,
    },
    rows: [
      { w: 56.0, sys: 128, dia: 78, hr: 76, steps: 2650, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 56.1, sys: 127, dia: 77, hr: 75, steps: 2700, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 55.9, sys: 129, dia: 79, hr: 77, steps: 2650, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 56.0, sys: 128, dia: 78, hr: 76, steps: 2700, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 56.1, sys: 130, dia: 80, hr: 78, steps: 2650, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 56.0, sys: 129, dia: 79, hr: 77, steps: 2680, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "a bit wheezy" },
      { w: 56.1, sys: 130, dia: 80, hr: 79, steps: 2650, sleep: 6.7, med: true, sob: true, sw: false, dz: false, ch: false, mood: "short of breath", note: "Wheezy and short of breath today." },
    ],
  },
  {
    // Stable — diabetes + hypertension, well controlled (South Asian HK resident)
    patient: {
      id: "patient-mr-singh",
      name: "Mr. Singh",
      age: 71,
      gender: "male",
      language: "English, Punjabi",
      living_status: "lives with family",
      conditions: ["diabetes", "hypertension"],
      caregiver_name: "Son (Mr. Singh)",
      caregiver_phone: "+852 9123 4500",
      assigned_nurse: "Nurse Chan",
      baseline_weight: 74.0,
      baseline_steps: 3500,
    },
    rows: [
      { w: 74.0, sys: 134, dia: 82, hr: 74, steps: 3450, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 74.1, sys: 133, dia: 81, hr: 73, steps: 3500, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 73.9, sys: 135, dia: 83, hr: 75, steps: 3400, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 74.0, sys: 132, dia: 80, hr: 74, steps: 3550, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 74.1, sys: 134, dia: 82, hr: 75, steps: 3500, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 74.0, sys: 133, dia: 81, hr: 74, steps: 3450, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 74.1, sys: 134, dia: 82, hr: 75, steps: 3500, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
    ],
  },
  {
    // Watch — ACT-001 (sustained activity drop, Filipino HK resident)
    patient: {
      id: "patient-mrs-santos",
      name: "Mrs. Santos",
      age: 68,
      gender: "female",
      language: "English, Tagalog",
      living_status: "lives in care home",
      conditions: ["kidney disease"],
      caregiver_name: "Care home staff",
      caregiver_phone: "+852 9234 5601",
      assigned_nurse: "Nurse Wong",
      baseline_weight: 58.0,
      baseline_steps: 3000,
    },
    rows: [
      { w: 58.0, sys: 138, dia: 84, hr: 76, steps: 2950, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.1, sys: 140, dia: 85, hr: 75, steps: 2900, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 57.9, sys: 139, dia: 84, hr: 77, steps: 2850, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.0, sys: 141, dia: 85, hr: 76, steps: 2200, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 58.1, sys: 140, dia: 84, hr: 77, steps: 1700, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", note: "Resting more than usual." },
      { w: 58.0, sys: 139, dia: 85, hr: 76, steps: 1600, sleep: 6.6, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 58.1, sys: 140, dia: 84, hr: 77, steps: 1550, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "low energy", note: "Staying in bed most of the day." },
    ],
  },
  {
    // Stable — post-stroke recovery, steady
    patient: {
      id: "patient-mr-lau",
      name: "Mr. Lau",
      age: 74,
      gender: "male",
      language: "Cantonese",
      living_status: "lives with spouse",
      conditions: ["post-stroke recovery"],
      caregiver_name: "Wife (Mrs. Lau)",
      caregiver_phone: "+852 9345 6012",
      assigned_nurse: "Nurse Chan",
      baseline_weight: 67.0,
      baseline_steps: 2900,
    },
    rows: [
      { w: 67.0, sys: 132, dia: 80, hr: 73, steps: 2850, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 67.1, sys: 131, dia: 79, hr: 74, steps: 2900, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 66.9, sys: 133, dia: 81, hr: 75, steps: 2800, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 67.0, sys: 132, dia: 80, hr: 73, steps: 2900, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 67.1, sys: 134, dia: 81, hr: 74, steps: 2850, sleep: 6.6, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 67.0, sys: 133, dia: 80, hr: 74, steps: 2880, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 67.1, sys: 132, dia: 81, hr: 75, steps: 2900, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
    ],
  },
];

function shortId(patientId: string): string {
  return patientId.replace(/^patient-/, "");
}

function vital(
  patientId: string,
  date: string,
  type: VitalType,
  value: number,
): VitalReading {
  return {
    id: `vital-${shortId(patientId)}-${date}-${type}`,
    patient_id: patientId,
    timestamp: `${date}T09:00:00Z`,
    type,
    value,
    unit: UNIT[type],
    source: "mock",
  };
}

/** Build a fresh, deterministic copy of the full demo dataset. */
export function buildSeed(): SeedDataset {
  const patients: Patient[] = [];
  const vitals: VitalReading[] = [];
  const checkins: DailyCheckIn[] = [];

  for (const def of PATIENT_DEFS) {
    patients.push({
      ...def.patient,
      conditions: [...def.patient.conditions],
      phone: null,
      status: "active",
      caregiver_email: "",
      // Demo patients consent to family messaging so caregiver auto-delivery
      // is demonstrable out of the box (synthetic contacts, no real sends).
      consent_caregiver_alerts: true,
      consent_family_digest: true,
      consent_updated_at: `${WEEK_START}T08:00:00Z`,
    });
    def.rows.forEach((row, i) => {
      const date = DEMO_DATES[i];
      const pid = def.patient.id;
      vitals.push(
        vital(pid, date, "weight", row.w),
        vital(pid, date, "blood_pressure_systolic", row.sys),
        vital(pid, date, "blood_pressure_diastolic", row.dia),
        vital(pid, date, "heart_rate", row.hr),
        vital(pid, date, "steps", row.steps),
        vital(pid, date, "sleep_hours", row.sleep),
      );
      if (!row.skipCheckin) {
        checkins.push({
          id: `checkin-${shortId(pid)}-${date}`,
          patient_id: pid,
          date,
          mood: row.mood,
          shortness_of_breath: row.sob,
          swelling: row.sw,
          dizziness: row.dz,
          chest_discomfort: row.ch,
          medication_taken: row.med,
          free_text_note: row.note ?? null,
          source: "simulated_call",
        });
      }
    });
  }

  return { patients, vitals, checkins };
}

/** Canonical "risky check-in" scenario for the demo replay button. */
export const RISKY_CHECKIN_PATIENT_ID = "patient-mrs-chan";
