import { Mermaid } from "@/components/Mermaid";

export const metadata = { title: "Architecture — CareLoop" };

// Hidden technical page (not in the nav) — a coarse, big-bubble system diagram:
// channel on top, the CareLoop app (with its sub-components) in the middle, the
// external services at the bottom. Easy to read in a recording.
const CHART = `
flowchart TB
  Patient(["Patient · WhatsApp"]):::ext
  Twilio(["Twilio · WhatsApp"]):::ext

  subgraph CL["CareLoop · our app"]
    direction LR
    Onboard(["Onboard · QR"]):::core
    Engine(["Agent + rule engine"]):::core
    Dashboard(["Nurse Dashboard"]):::core
  end

  Claude(["Anthropic · Claude"]):::ai
  Whisper(["Groq · Whisper"]):::ai
  DB[("Postgres · Supabase")]:::data

  Onboard --> Patient
  Patient <--> Twilio
  Twilio <--> Engine
  Engine --> Claude
  Engine --> Whisper
  DB <--> CL

  classDef ext fill:#ffffff,stroke:#94a3b8,color:#334155
  classDef core fill:#ccfbf1,stroke:#0d9488,color:#0f766e
  classDef ai fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef data fill:#e2e8f0,stroke:#475569,color:#334155
  style CL fill:#f0fdfa,stroke:#0d9488,stroke-width:1.5px
`;

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-center text-xl font-semibold tracking-tight">
        CareLoop — Architecture
      </h1>
      <p className="mb-5 text-center text-sm text-muted-foreground">
        Patient on WhatsApp → Twilio → our app → Claude &amp; Whisper, persisted in Postgres.
      </p>
      <Mermaid chart={CHART} />
    </div>
  );
}
