// Conversational daily check-in agent — state + policy (server-only, Supabase).
//
// Holds the WhatsApp message thread, the in-progress check-in "session" per
// patient/day, and the phone <-> patient links — all persisted in Supabase
// (careloop_messages / careloop_sessions / careloop_links) so they survive
// serverless cold starts and span instances (the inbound webhook and a page
// render hit different instances in production).
//
// The agent POLICY (which fields are required, when the check-in is complete,
// when to escalate) stays DETERMINISTIC and PURE — requiredFields/missingFields/
// mergeExtraction don't touch the DB. AI is used only for language. The risk
// engine is untouched — it still only ever sees structured check-ins.

import { getPatient } from "./store";
import { supa } from "./supabase";
import type { ExtractedCheckIn } from "./symptomExtraction";
import type { Severity } from "./types";

export type Lang = "zh" | "en";
export type Direction = "inbound" | "outbound";
export type MessageKind = "text" | "voice" | "system";
export type FieldKey = "mood" | "sob" | "swelling" | "dizziness" | "chest" | "meds";

export interface Message {
  id: string;
  patient_id: string;
  created_at: string;
  direction: Direction;
  channel: "whatsapp";
  kind: MessageKind;
  body: string;
  language: Lang;
  transcript_source?: "text" | "stt" | "pinned";
  extracted?: ExtractedCheckIn;
  severity_after?: Severity;
}

export interface Collected {
  mood: string | null;
  shortness_of_breath: boolean | null;
  swelling: boolean | null;
  dizziness: boolean | null;
  chest_discomfort: boolean | null;
  medication_taken: boolean | null;
  weight_kg: number | null;
}

export interface CheckInSession {
  patient_id: string;
  date: string;
  status: "in_progress" | "complete" | "escalated";
  collected: Collected;
  required: FieldKey[];
  pending_field: FieldKey | null;
  updated_at: string;
}

// --- helpers --------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}
function genId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}
function emptyCollected(): Collected {
  return {
    mood: null,
    shortness_of_breath: null,
    swelling: null,
    dizziness: null,
    chest_discomfort: null,
    medication_taken: null,
    weight_kg: null,
  };
}

/** Clear conversation state for a clean demo. The careloop_truncate_conversations
 * RPC truncates messages + sessions but KEEPS careloop_links, so captured phone
 * numbers (and the sticky sender->patient mapping) survive a reset and the
 * outbound "send check-in" still works afterwards. */
export async function resetConversations(): Promise<void> {
  const { error } = await supa().rpc("careloop_truncate_conversations");
  if (error) throw new Error(`Supabase: ${error.message}`);
}

// --- phone <-> patient links (careloop_links) -----------------------------

// The webhook creates a fresh mock patient per new number (lib/store
// createPatientFromMock); these helpers manage the persisted phone <-> patient
// links so replies and outbound check-ins always route back.
async function linkPatientForPhone(phone: string): Promise<string | null> {
  const { data, error } = await supa()
    .from("careloop_links")
    .select("patient_id")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data?.patient_id as string | undefined) ?? null;
}

/** Insert/overwrite a phone -> patient link (used for outbound capture + fixed
 * presenter mode). phone is the PK; on conflict we update the patient. */
async function linkUpsert(phone: string, patientId: string): Promise<void> {
  const { error } = await supa()
    .from("careloop_links")
    .upsert({ phone, patient_id: patientId }, { onConflict: "phone" });
  if (error) throw new Error(`Supabase: ${error.message}`);
}

/** The patient a phone is already linked to, or null (no new assignment). */
export async function getPatientForPhone(phone: string): Promise<string | null> {
  return phone ? linkPatientForPhone(phone) : null;
}

export async function setPatientPhone(patientId: string, phone: string): Promise<void> {
  if (phone) await linkUpsert(phone, patientId);
}

export async function getPatientPhone(patientId: string): Promise<string | undefined> {
  const { data, error } = await supa()
    .from("careloop_links")
    .select("phone")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data?.[0]?.phone as string | undefined) ?? undefined;
}

// --- field metadata (pure) ------------------------------------------------

const CONDITION_SYMPTOMS: Record<string, FieldKey[]> = {
  "heart failure": ["sob", "swelling"],
  COPD: ["sob"],
  diabetes: ["dizziness"],
  "post-stroke recovery": ["dizziness"],
  "kidney disease": ["swelling"],
  hypertension: [],
};

const COLLECTED_KEY: Record<FieldKey, keyof Collected> = {
  mood: "mood",
  sob: "shortness_of_breath",
  swelling: "swelling",
  dizziness: "dizziness",
  chest: "chest_discomfort",
  meds: "medication_taken",
};

export const FIELD_QUESTION: Record<FieldKey, { zh: string; en: string }> = {
  mood: { zh: "今日覺得點呀？", en: "How are you feeling today?" },
  sob: { zh: "今日有冇覺得氣促？", en: "Any shortness of breath today?" },
  swelling: { zh: "對腳或腳踝有冇腫？", en: "Any swelling in your legs or feet?" },
  dizziness: { zh: "有冇頭暈？", en: "Any dizziness?" },
  chest: { zh: "胸口有冇唔舒服？", en: "Any chest discomfort?" },
  meds: { zh: "今日食咗藥未？", en: "Have you taken your medicine today?" },
};

/** Required field set: mood + BREATHING are asked of every patient (breathing is
 * a core red-flag worth a daily check regardless of condition) + each condition's
 * specific symptoms + medication adherence. */
export function requiredFields(conditions: string[]): FieldKey[] {
  const set = new Set<FieldKey>(["mood", "sob"]);
  for (const c of conditions) (CONDITION_SYMPTOMS[c] ?? []).forEach((k) => set.add(k));
  set.add("meds");
  const order: FieldKey[] = ["mood", "sob", "swelling", "dizziness", "chest", "meds"];
  return order.filter((k) => set.has(k));
}

export function questionFor(field: FieldKey, lang: Lang): string {
  return FIELD_QUESTION[field][lang];
}

/** Merge an extraction into the session — only fields the patient actually
 * mentioned (non-null) update; nothing previously reported is erased. Pure
 * (mutates the in-memory session); persist with saveSession afterwards. */
export function mergeExtraction(session: CheckInSession, ex: ExtractedCheckIn): void {
  const c = session.collected;
  if (ex.mood !== null) c.mood = ex.mood;
  if (ex.shortness_of_breath !== null) c.shortness_of_breath = ex.shortness_of_breath;
  if (ex.swelling !== null) c.swelling = ex.swelling;
  if (ex.dizziness !== null) c.dizziness = ex.dizziness;
  if (ex.chest_discomfort !== null) c.chest_discomfort = ex.chest_discomfort;
  if (ex.medication_taken !== null) c.medication_taken = ex.medication_taken;
  if (ex.weight_kg !== null) c.weight_kg = ex.weight_kg;
  session.updated_at = nowIso();
}

export function missingFields(session: CheckInSession): FieldKey[] {
  return session.required.filter((f) => session.collected[COLLECTED_KEY[f]] === null);
}

// --- sessions (careloop_sessions) -----------------------------------------

function rowToSession(r: Record<string, unknown>): CheckInSession {
  return {
    patient_id: r.patient_id as string,
    date: r.date as string,
    status: r.status as CheckInSession["status"],
    collected: { ...emptyCollected(), ...(r.collected as Partial<Collected> | null) },
    required: (r.required as FieldKey[]) ?? [],
    pending_field: (r.pending_field as FieldKey | null) ?? null,
    updated_at: r.updated_at as string,
  };
}

/** Persist a session (upsert by patient_id+date). Call after mutating a session
 * via mergeExtraction or status/pending_field changes. */
export async function saveSession(session: CheckInSession): Promise<void> {
  session.updated_at = nowIso();
  const { error } = await supa()
    .from("careloop_sessions")
    .upsert(
      {
        patient_id: session.patient_id,
        date: session.date,
        status: session.status,
        collected: session.collected,
        required: session.required,
        pending_field: session.pending_field,
        updated_at: session.updated_at,
      },
      { onConflict: "patient_id,date" },
    );
  if (error) throw new Error(`Supabase: ${error.message}`);
}

export async function getSession(
  patientId: string,
  date: string,
): Promise<CheckInSession | undefined> {
  const { data, error } = await supa()
    .from("careloop_sessions")
    .select("*")
    .eq("patient_id", patientId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data ? rowToSession(data as Record<string, unknown>) : undefined;
}

export async function getOrCreateSession(
  patientId: string,
  date: string,
): Promise<CheckInSession> {
  const existing = await getSession(patientId, date);
  if (existing) return existing;
  const patient = await getPatient(patientId);
  const session: CheckInSession = {
    patient_id: patientId,
    date,
    status: "in_progress",
    collected: emptyCollected(),
    required: requiredFields(patient?.conditions ?? []),
    pending_field: null,
    updated_at: nowIso(),
  };
  await saveSession(session);
  return session;
}

/** Start a fresh daily check-in session — used when the agent sends the morning
 * prompt. Resets today's collected data and waits on the mood answer. */
export async function beginSession(patientId: string, date: string): Promise<CheckInSession> {
  const patient = await getPatient(patientId);
  const session: CheckInSession = {
    patient_id: patientId,
    date,
    status: "in_progress",
    collected: emptyCollected(),
    required: requiredFields(patient?.conditions ?? []),
    pending_field: "mood",
    updated_at: nowIso(),
  };
  await saveSession(session);
  return session;
}

// --- message log (careloop_messages) --------------------------------------

function rowToMessage(r: Record<string, unknown>): Message {
  const m: Message = {
    id: r.id as string,
    patient_id: r.patient_id as string,
    created_at: r.created_at as string,
    direction: r.direction as Direction,
    channel: "whatsapp",
    kind: r.kind as MessageKind,
    body: r.body as string,
    language: r.language as Lang,
  };
  if (r.transcript_source) m.transcript_source = r.transcript_source as Message["transcript_source"];
  if (r.extracted) m.extracted = r.extracted as ExtractedCheckIn;
  if (r.severity_after) m.severity_after = r.severity_after as Severity;
  return m;
}

export async function appendMessage(m: Omit<Message, "id" | "created_at">): Promise<Message> {
  const msg: Message = { ...m, id: genId("msg"), created_at: nowIso() };
  const { error } = await supa()
    .from("careloop_messages")
    .insert({
      id: msg.id,
      patient_id: msg.patient_id,
      created_at: msg.created_at,
      direction: msg.direction,
      channel: msg.channel,
      kind: msg.kind,
      body: msg.body,
      language: msg.language,
      transcript_source: msg.transcript_source ?? null,
      extracted: msg.extracted ?? null,
      severity_after: msg.severity_after ?? null,
    });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return msg;
}

export async function getThread(patientId: string): Promise<Message[]> {
  const { data, error } = await supa()
    .from("careloop_messages")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true }); // stable tiebreaker for same-millisecond inserts
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []).map((r) => rowToMessage(r as Record<string, unknown>));
}

export async function getAllMessages(): Promise<Message[]> {
  const { data, error } = await supa()
    .from("careloop_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []).map((r) => rowToMessage(r as Record<string, unknown>));
}
