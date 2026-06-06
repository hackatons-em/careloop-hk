// Minimal CSV parser for the wearable/vital sample format (teammate-1 zone).
// Header: date,weight_kg,systolic_bp,diastolic_bp,heart_rate,steps,sleep_hours,
//         medication_taken,shortness_of_breath,swelling

import type { CsvRow } from "./store";

function num(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const cleaned = v.replace(/,/g, "").trim(); // tolerate thousands separators
  if (cleaned === "") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function bool(v: string | undefined): boolean | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  return /^(true|1|yes|y)$/i.test(v.trim());
}

/** RFC-4180-ish split of one CSV line: handles "quoted, fields" and "" escapes. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseVitalsCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const col = {
    date: idx("date"),
    weight: idx("weight_kg"),
    sys: idx("systolic_bp"),
    dia: idx("diastolic_bp"),
    hr: idx("heart_rate"),
    steps: idx("steps"),
    sleep: idx("sleep_hours"),
    med: idx("medication_taken"),
    sob: idx("shortness_of_breath"),
    sw: idx("swelling"),
  };

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const date = col.date >= 0 ? cells[col.date] : undefined;
    if (!date) continue;
    rows.push({
      date,
      weight_kg: num(cells[col.weight]),
      systolic_bp: num(cells[col.sys]),
      diastolic_bp: num(cells[col.dia]),
      heart_rate: num(cells[col.hr]),
      steps: num(cells[col.steps]),
      sleep_hours: num(cells[col.sleep]),
      medication_taken: bool(cells[col.med]),
      shortness_of_breath: bool(cells[col.sob]),
      swelling: bool(cells[col.sw]),
    });
  }
  return rows;
}
