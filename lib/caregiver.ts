// Bilingual caregiver alert builder (pure). Plain language for families:
// describes WHAT CHANGED in monitoring and that nurse review is recommended.
// NEVER includes diagnosis, medication changes, or treatment instructions.

import { weightGain3d } from "./riskEngine";
import type { DailyCheckIn, DailyVitals, Patient, Severity } from "./types";

export interface CaregiverAlert {
  en: string;
  zh: string;
}

const ZH_SURNAME: Record<string, string> = {
  Chan: "陳",
  Lee: "李",
  Wong: "黃",
  Ho: "何",
  Lam: "林",
};

function zhName(patient: Patient): string {
  const m = patient.name.match(/^(Mrs?\.)\s+(\w+)/);
  if (m) {
    const honorific = m[1].toLowerCase().startsWith("mrs") ? "女士" : "先生";
    const surname = ZH_SURNAME[m[2]];
    if (surname) return `${surname}${honorific}`;
  }
  return patient.name;
}

function pronouns(gender: string) {
  if (gender === "female") return { subj: "She", poss: "Her" };
  if (gender === "male") return { subj: "He", poss: "His" };
  return { subj: "They", poss: "Their" };
}

const RECO_EN: Record<Severity, string> = {
  escalate:
    "CareLoop recommends nurse review today. If symptoms are severe or get worse, please seek urgent medical care.",
  review_today: "CareLoop recommends nurse review today.",
  watch: "CareLoop suggests keeping a close eye and continuing daily check-ins.",
  stable: "Monitoring looks stable today. Please continue daily check-ins.",
};

const RECO_ZH: Record<Severity, string> = {
  escalate: "CareLoop 建議今日由護士跟進。如症狀嚴重或惡化，請盡快尋求緊急醫療協助。",
  review_today: "CareLoop 建議今日由護士跟進。",
  watch: "CareLoop 建議繼續密切觀察，並保持每日報到。",
  stable: "今日監測情況穩定，請繼續每日報到。",
};

const DISCLAIMER_EN =
  "This message shares what changed in monitoring. It is not a diagnosis or treatment advice.";
const DISCLAIMER_ZH = "此訊息只說明監測上的變化，並非診斷或治療建議。";

export function buildCaregiverAlert(
  patient: Patient,
  daily: DailyVitals[],
  checkins: DailyCheckIn[],
  severity: Severity,
): CaregiverAlert {
  const latest = [...checkins].sort((a, b) => a.date.localeCompare(b.date)).pop();
  const p = pronouns(patient.gender);
  const name = patient.name;
  const zName = zhName(patient);

  const symptomsEn: string[] = [];
  const symptomsZh: string[] = [];
  if (latest?.shortness_of_breath) {
    symptomsEn.push("shortness of breath");
    symptomsZh.push("呼吸急促");
  }
  if (latest?.swelling) {
    symptomsEn.push("swelling in the legs or feet");
    symptomsZh.push("腳部或腳踝水腫");
  }
  if (latest?.dizziness) {
    symptomsEn.push("dizziness");
    symptomsZh.push("頭暈");
  }
  if (latest?.chest_discomfort) {
    symptomsEn.push("chest discomfort");
    symptomsZh.push("胸口不適");
  }

  const gainRaw = weightGain3d(daily);
  const gain = gainRaw === null ? null : Math.round(gainRaw * 10) / 10;
  const medMissed = latest?.medication_taken === false;

  // --- English ---
  const en: string[] = [];
  if (symptomsEn.length > 0) {
    en.push(`${name} reported ${joinList(symptomsEn)} today.`);
  } else if (severity === "stable") {
    en.push(`${name}'s daily check-in looks stable today.`);
  } else {
    en.push(`${name}'s recent monitoring data has changed.`);
  }
  if (gain !== null && gain >= 1) {
    en.push(`${p.poss} weight increased ${gain} kg over the last 3 days.`);
  }
  if (medMissed) en.push("A dose of medicine was also missed.");
  en.push(RECO_EN[severity]);
  en.push(DISCLAIMER_EN);

  // --- Traditional Chinese ---
  const zh: string[] = [];
  if (symptomsZh.length > 0) {
    zh.push(`今日${zName}表示有${symptomsZh.join("、")}。`);
  } else if (severity === "stable") {
    zh.push(`今日${zName}的每日報到情況穩定。`);
  } else {
    zh.push(`${zName}近期的監測數據出現變化。`);
  }
  if (gain !== null && gain >= 1) {
    zh.push(`體重在過去3天內增加了 ${gain} 公斤。`);
  }
  if (medMissed) zh.push("今日亦漏服了一次藥物。");
  zh.push(RECO_ZH[severity]);
  zh.push(DISCLAIMER_ZH);

  return { en: en.join(" "), zh: zh.join("") };
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
