"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
} from "react";
import { Check, Droplet, Mic, Pill, Play, ShieldCheck, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

// useLayoutEffect on the client (pre-paint), useEffect on the server (no-op,
// avoids the SSR warning) — same pattern as CountUp.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Phase =
  | "recording"
  | "transcribing"
  | "transcript"
  | "structured"
  | "replying"
  | "hold";

// Phase boundaries (ms from cycle start). One language cycle = HOLD_END.
const PHASES: { name: Phase; end: number }[] = [
  { name: "recording", end: 1500 },
  { name: "transcribing", end: 2000 },
  { name: "transcript", end: 3600 },
  { name: "structured", end: 4500 },
  { name: "replying", end: 6300 },
  { name: "hold", end: 8000 },
];
const CYCLE = PHASES[PHASES.length - 1].end;
const ORDER: Phase[] = [
  "recording",
  "transcribing",
  "transcript",
  "structured",
  "replying",
  "hold",
];

function phaseFor(elapsed: number): Phase {
  for (const p of PHASES) if (elapsed < p.end) return p.name;
  return "hold";
}

// Structured symptoms shown on the nurse side. English by product policy
// (stored clinical text stays English even when the patient spoke another
// language), so these never localize.
const CHIPS: { label: string; icon: ElementType; tone: string }[] = [
  { label: "Shortness of breath", icon: Wind, tone: "bg-red-50 text-red-700 border-red-200" },
  { label: "Leg swelling", icon: Droplet, tone: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Medication missed", icon: Pill, tone: "bg-slate-100 text-slate-700 border-slate-200" },
];

// End-to-end demo languages (the three Miruwa actually replies in today).
// Transcripts/replies use the real demo phrases + reply templates.
const DEMO = [
  {
    key: "zh",
    label: "粵語 Cantonese",
    dir: "ltr" as const,
    patient: "陳太, 78",
    duration: "0:06",
    transcript: "今日有啲氣促，行幾步就要抖，對腳同腳踝腫咗，今日又唔記得食藥。",
    ruleId: "HF-001",
    reply: "多謝你嘅報到。今日有冇覺得氣促？",
  },
  {
    key: "ar",
    label: "العربية Arabic",
    dir: "rtl" as const,
    patient: "السيدة تشان، 78",
    duration: "0:05",
    transcript: "أشعر بضيق في التنفس، وتورّمت قدماي، نسيت دوائي اليوم.",
    ruleId: "HF-001",
    reply: "شكرًا لك على تسجيل الدخول. هل شعرت بضيق أكثر في التنفس اليوم؟",
  },
  {
    key: "en",
    label: "English",
    dir: "ltr" as const,
    patient: "Mrs. Chan, 78",
    duration: "0:07",
    transcript:
      "Short of breath today, winded after a few steps. My legs and feet are swelling. I forgot to take my medicine today.",
    ruleId: "HF-001",
    reply: "Thank you for checking in. Any shortness of breath today?",
  },
];

// Fixed (deterministic — no Math.random, so SSR matches client) bar heights for
// the voice-note waveform.
const BAR_HEIGHTS = [
  8, 14, 20, 11, 24, 16, 9, 22, 13, 27, 18, 10, 21, 15, 26, 12, 19, 23, 9, 17,
  25, 14, 20, 11, 16, 22, 8, 13,
];

export type VoiceShowcaseLabels = {
  recording: string;
  transcribing: string;
  nurseReview: string;
  patientLabel: string;
  transcribedLabel: string;
  matchedRule: string;
};

const TICKER = [
  "Cantonese", "العربية", "English", "Español", "Français", "Mandarin",
  "Gujarati", "தமிழ்", "ไทย", "Tiếng Việt", "اردو", "Português", "Nederlands",
  "Deutsch", "Italiano", "Kiswahili", "বাংলা", "हिन्दी", "ਪੰਜਾਬੀ", "मराठी",
  "Polski", "Türkçe", "한국어", "日本語", "Bahasa", "Filipino", "မြန်မာ",
  "ខ្មែរ", "ລາວ", "नेपाली",
];

/** Flagship "voice in → understood" showcase. A client island that auto-plays a
 *  looping pipeline (record → transcribe → structure → reply) and cycles through
 *  Cantonese, Arabic, and English.
 *
 *  Production contract:
 *  - SSR renders the COMPLETED frame (phase "hold", Cantonese) so no-JS visitors
 *    and crawlers see the full pipeline; hydration matches (same initial state).
 *  - prefers-reduced-motion: the loop never starts; the static completed frame
 *    stays. (Pure-CSS loops are neutralized by the global reduced-motion block.)
 *  - Zero CLS: every zone has a reserved min-height; text reveals inside fixed
 *    boxes; the longest language sets the reserve.
 *  - Pauses when off-screen (IntersectionObserver); rAF + observers torn down on
 *    unmount.
 *  - Decorative: the moving panes are aria-hidden; an sr-only line describes it. */
export function VoiceShowcase({
  claim,
  labels,
}: {
  claim: string;
  labels: VoiceShowcaseLabels;
}) {
  const [phase, setPhase] = useState<Phase>("hold");
  const [langIdx, setLangIdx] = useState(0);
  const [enabled, setEnabled] = useState(false); // mounted && motion allowed
  const [active, setActive] = useState(false); // in viewport

  const rootRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
  const phaseRef = useRef<Phase>("hold");

  // Motion gate: only animate with JS + no reduced-motion preference.
  useIsomorphicLayoutEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!reduce);
  }, []);

  // Pause/resume when the section enters/leaves the viewport.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The single rAF clock. Advances elapsed only while enabled + visible, so the
  // loop softly resumes from where it paused. Sets React state only on phase
  // change / language wrap (not per frame).
  useEffect(() => {
    if (!enabled || !active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;
      if (elapsedRef.current >= CYCLE) {
        elapsedRef.current -= CYCLE;
        setLangIdx((i) => (i + 1) % DEMO.length);
      }
      const p = phaseFor(elapsedRef.current);
      if (p !== phaseRef.current) {
        phaseRef.current = p;
        setPhase(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, active]);

  const demo = DEMO[langIdx];
  const pi = ORDER.indexOf(phase);
  const reached = (name: Phase) => pi >= ORDER.indexOf(name);
  const recording = phase === "recording";

  return (
    <div ref={rootRef}>
      {/* Accessible, static description of the decorative animation. */}
      <p className="sr-only">
        Demonstration: an elderly patient records a voice message over WhatsApp;
        Miruwa transcribes it, structures the symptoms in English for the nurse
        (shortness of breath, leg swelling, missed medication), matches a
        deterministic rule, and replies in the patient&apos;s language. It cycles
        through Cantonese, Arabic, and English. Demonstration data, not
        clinically validated.
      </p>

      <div
        aria-hidden="true"
        className="cl-rise rounded-2xl border border-teal-400/20 bg-[#0a1626] p-5 shadow-xl md:p-7"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
          {/* LEFT — patient WhatsApp thread */}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-300/80">
              {labels.patientLabel}
            </p>

            {/* Voice-note bubble */}
            <div className="mt-3 max-w-[19rem] rounded-2xl rounded-es-sm bg-[#dcf8c6] px-3.5 py-2.5 text-neutral-800 shadow-md">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-white transition-colors",
                    recording ? "bg-red-500" : "bg-[#0f766e]",
                  )}
                >
                  {recording ? <Mic className="size-3.5" /> : <Play className="size-3.5" />}
                </span>
                <div className="flex h-7 flex-1 items-center gap-[3px]">
                  {BAR_HEIGHTS.map((h, i) => (
                    <span
                      key={i}
                      className={cn(
                        "w-[3px] rounded-full bg-[#0f766e]/70",
                        recording && "cl-wave-bar",
                      )}
                      style={{ height: `${h}px`, animationDelay: `${(i % 7) * 90}ms` }}
                    />
                  ))}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-neutral-600">
                  {demo.duration}
                </span>
              </div>
              {recording && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-red-600">
                  <span className="cl-pulse-dot size-1.5 rounded-full bg-red-500" />
                  {labels.recording}
                </p>
              )}
            </div>

            {/* Transcript zone (reserved height → no CLS) */}
            <div className="relative mt-3 min-h-[7.5rem] max-w-[19rem] rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {phase === "recording"
                  ? " "
                  : phase === "transcribing"
                    ? labels.transcribing
                    : labels.transcribedLabel}
              </p>
              {phase === "recording" ? null : phase === "transcribing" ? (
                <div className="mt-2 space-y-2 overflow-hidden">
                  <div className="relative h-3 overflow-hidden rounded bg-white/5">
                    <span className="cl-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-teal-300/30 to-transparent" />
                  </div>
                  <div className="relative h-3 w-4/5 overflow-hidden rounded bg-white/5">
                    <span className="cl-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-teal-300/30 to-transparent" />
                  </div>
                </div>
              ) : (
                <p
                  dir={demo.dir}
                  lang={demo.key === "zh" ? "zh-HK" : demo.key}
                  className="mt-1.5 text-[15px] leading-relaxed text-white/90"
                >
                  <Typewriter
                    text={demo.transcript}
                    play={phase === "transcript"}
                    enabled={enabled}
                    durationMs={1400}
                  />
                </p>
              )}
            </div>

            {/* Miruwa reply bubble */}
            <div
              className={cn(
                "mt-3 max-w-[19rem] rounded-2xl rounded-ss-sm border border-teal-400/20 bg-white px-3.5 py-2.5 text-neutral-800 shadow-md transition-all duration-500",
                reached("replying")
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#0f766e]">
                <ShieldCheck className="size-3" /> Miruwa
              </p>
              <p dir={demo.dir} lang={demo.key === "zh" ? "zh-HK" : demo.key} className="min-h-[1.5rem] text-[15px] leading-relaxed">
                <Typewriter
                  text={demo.reply}
                  play={phase === "replying"}
                  enabled={enabled}
                  durationMs={1300}
                />
              </p>
            </div>
          </div>

          {/* RIGHT — nurse review (English by policy) */}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-300/80">
              {labels.nurseReview}
            </p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p
                    dir={demo.dir}
                    lang={demo.key === "zh" ? "zh-HK" : demo.key}
                    className="truncate text-sm font-semibold text-neutral-900"
                  >
                    {demo.patient}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    Heart failure + hypertension · lives alone
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 transition-all duration-500",
                    reached("structured") ? "scale-100 opacity-100" : "scale-95 opacity-0",
                  )}
                >
                  <span className="cl-pulse-dot size-1.5 rounded-full bg-red-500" /> Escalate
                </span>
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Structured symptoms
              </p>
              <div className="mt-2 flex min-h-[2rem] flex-wrap gap-1.5">
                {CHIPS.map((c, i) => (
                  <span
                    key={c.label}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-500",
                      c.tone,
                      reached("structured")
                        ? "translate-y-0 opacity-100"
                        : "translate-y-1 opacity-0",
                    )}
                    style={{ transitionDelay: reached("structured") ? `${i * 120}ms` : "0ms" }}
                  >
                    <c.icon className="size-3.5" />
                    {c.label}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {labels.matchedRule}
              </p>
              <div
                className={cn(
                  "mt-2 flex items-center gap-2 transition-all duration-500",
                  reached("structured") ? "opacity-100" : "opacity-0",
                )}
              >
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-700 [font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]">
                  {demo.ruleId}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                  <Check className="size-3 text-[#0f766e]" /> Deterministic rule · not AI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Breadth ticker — transcription reach only (decorative). */}
        <div className="mt-6 overflow-hidden border-t border-white/10 pt-4">
          <div className="cl-ticker-track flex gap-6 whitespace-nowrap text-xs text-white/45 [font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]">
            {[...TICKER, ...TICKER].map((lang, i) => (
              <span key={i} className="flex items-center gap-6">
                {lang}
                <span aria-hidden className="text-teal-300/40">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Honesty claim — static, always readable (not aria-hidden). */}
      <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
        {claim}
      </p>
    </div>
  );
}

/** Substring typewriter. Renders the full text by default (SSR / no-JS / reduced
 *  motion / not-playing), and reveals character-by-character only while `play`
 *  and `enabled`. Substring (not clip-path) keeps it bidi-safe for Arabic + CJK
 *  and reflow-free inside the parent's reserved box. */
function Typewriter({
  text,
  play,
  enabled,
  durationMs,
}: {
  text: string;
  play: boolean;
  enabled: boolean;
  durationMs: number;
}) {
  const [typed, setTyped] = useState(text);

  useIsomorphicLayoutEffect(() => {
    if (!enabled || !play) {
      setTyped(text);
      return;
    }
    setTyped("");
    let raf = 0;
    let start = 0;
    const chars = Array.from(text); // code-point safe
    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      const n = Math.round(t * chars.length);
      setTyped(chars.slice(0, n).join(""));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, play, enabled, durationMs]);

  // Zero-width space (U+200B) keeps the line height stable when text is momentarily empty.
  return <>{typed || "​"}</>;
}
