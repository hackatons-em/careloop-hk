// Bilingual caregiver alert builder (pure). Plain language for families:
// describes WHAT CHANGED in monitoring and that nurse review is recommended.
// NEVER includes diagnosis, medication changes, or treatment instructions.

import { weightGain3d } from "./riskEngine";
import type { DailyCheckIn, DailyVitals, Patient, Severity } from "./types";

export interface CaregiverAlert {
  en: string;
  zh: string;
  ar: string;
}

/** Format a caregiver alert for delivery. Arabic-preference families get the
 * Arabic text; everyone else gets the historical bilingual (zh + en) message. */
export function formatCaregiverMessage(text: CaregiverAlert, preferred?: string | null): string {
  if (preferred === "ar") return text.ar;
  return `${text.zh}\n\n${text.en}`;
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
    "Miruwa recommends nurse review today. If symptoms are severe or get worse, please seek urgent medical care.",
  review_today: "Miruwa recommends nurse review today.",
  watch: "Miruwa suggests keeping a close eye and continuing daily check-ins.",
  stable: "Monitoring looks stable today. Please continue daily check-ins.",
};

const RECO_ZH: Record<Severity, string> = {
  escalate: "Miruwa 建議今日由護士跟進。如症狀嚴重或惡化，請盡快尋求緊急醫療協助。",
  review_today: "Miruwa 建議今日由護士跟進。",
  watch: "Miruwa 建議繼續密切觀察，並保持每日報到。",
  stable: "今日監測情況穩定，請繼續每日報到。",
};

const DISCLAIMER_EN =
  "This message shares what changed in monitoring. It is not a diagnosis or treatment advice.";
const DISCLAIMER_ZH = "此訊息只說明監測上的變化，並非診斷或治療建議。";

const RECO_AR: Record<Severity, string> = {
  escalate:
    "توصي Miruwa بمراجعة الممرضة اليوم. إذا كانت الأعراض شديدة أو ازدادت سوءًا، فيُرجى طلب الرعاية الطبية العاجلة.",
  review_today: "توصي Miruwa بمراجعة الممرضة اليوم.",
  watch: "تقترح Miruwa المتابعة عن كثب والاستمرار في تسجيل الدخول اليومي.",
  stable: "تبدو المتابعة مستقرة اليوم. يُرجى الاستمرار في تسجيل الدخول اليومي.",
};

const DISCLAIMER_AR =
  "تشرح هذه الرسالة ما تغيّر في المتابعة. وهي ليست تشخيصًا أو نصيحة علاجية.";

/** Arabic "and"-join: "أ"، "أ وب"، "أ، ب وج". The conjunction و attaches to
 * the following word without a space, per Arabic convention. */
function joinListAr(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} و${items[1]}`;
  return `${items.slice(0, -1).join("، ")} و${items[items.length - 1]}`;
}

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
  const symptomsAr: string[] = [];
  if (latest?.shortness_of_breath) {
    symptomsEn.push("shortness of breath");
    symptomsZh.push("呼吸急促");
    symptomsAr.push("ضيق في التنفس");
  }
  if (latest?.swelling) {
    symptomsEn.push("swelling in the legs or feet");
    symptomsZh.push("腳部或腳踝水腫");
    symptomsAr.push("تورّم في الساقين أو القدمين");
  }
  if (latest?.dizziness) {
    symptomsEn.push("dizziness");
    symptomsZh.push("頭暈");
    symptomsAr.push("دوخة");
  }
  if (latest?.chest_discomfort) {
    symptomsEn.push("chest discomfort");
    symptomsZh.push("胸口不適");
    symptomsAr.push("انزعاج في الصدر");
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

  // --- Arabic (MSA) ---
  // Gender drives verb/possessive agreement; unknown defaults to the masculine
  // generic, as is conventional in MSA.
  const female = patient.gender === "female";
  const reported = female ? "أبلغت" : "أبلغ";
  const poss = female ? "وزنها" : "وزنه";
  const ar: string[] = [];
  if (symptomsAr.length > 0) {
    ar.push(`${reported} ${name} اليوم عن ${joinListAr(symptomsAr)}.`);
  } else if (severity === "stable") {
    ar.push(`يبدو تسجيل الدخول اليومي لـ ${name} مستقرًا اليوم.`);
  } else {
    ar.push(`تغيّرت بيانات المتابعة الأخيرة لـ ${name}.`);
  }
  if (gain !== null && gain >= 1) {
    ar.push(`زاد ${poss} ${gain} كجم خلال آخر 3 أيام.`);
  }
  if (medMissed) ar.push("كما فاتت جرعة من الدواء اليوم.");
  ar.push(RECO_AR[severity]);
  ar.push(DISCLAIMER_AR);

  return { en: en.join(" "), zh: zh.join(""), ar: ar.join(" ") };
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
