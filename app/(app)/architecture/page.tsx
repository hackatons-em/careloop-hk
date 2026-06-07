import { Mermaid } from "@/components/Mermaid";

export const metadata = { title: "Architecture — CareLoop" };

// Hidden technical page (not in the nav) — a pure component diagram of the system.
const CHART = `
flowchart TB
  Patient(["Patient · WhatsApp<br/>text / Cantonese voice"])

  subgraph FE["Next.js frontend · App Router / RSC"]
    Landing["Landing"]
    Dashboard["Nurse Dashboard"]
    Detail["Patient Detail<br/>Conversation · Risk · Caregiver"]
    Onboard["Onboard · QR"]
  end

  subgraph APIs["API route handlers"]
    Inbound["POST /whatsapp/inbound"]
    AgentAPI["/agent/send-checkin · send-round"]
    PatAPI["/patients/:id · /alerts · /demo"]
  end

  subgraph Core["Server libraries (server-only)"]
    Ingest["ingest · pipeline"]
    STT["stt · Whisper"]
    Extract["symptomExtraction · Claude"]
    Followup["followup · Claude"]
    Conversation["conversation · sessions / links"]
    RiskEngine["riskEngine · deterministic rules"]
    Store["store · data access"]
    Agent["agent · outbound"]
    WhatsAppLib["whatsapp · Twilio REST"]
    Fhir["fhirService"]
  end

  Twilio{{"Twilio · WhatsApp"}}
  Anthropic{{"Anthropic · Claude API"}}
  Groq{{"Groq · Whisper API"}}
  Supabase[("Supabase · Postgres")]

  Patient -->|message| Twilio --> Inbound --> Ingest
  Ingest --> STT --> Groq
  Ingest --> Extract --> Anthropic
  Ingest --> Followup --> Anthropic
  Ingest --> Conversation
  Ingest --> Store
  Store --> RiskEngine
  Store --> Supabase
  Conversation --> Supabase
  Inbound -->|TwiML reply| Twilio
  Twilio -->|delivers| Patient
  Dashboard --> PatAPI
  Detail --> PatAPI
  Detail --> AgentAPI
  PatAPI --> Store
  PatAPI --> Fhir
  Fhir --> Store
  AgentAPI --> Agent --> WhatsAppLib --> Twilio
  Onboard -->|"QR: join code"| Twilio
  Landing --> Dashboard

  classDef ai fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef rules fill:#ccfbf1,stroke:#0d9488,color:#0f766e
  classDef data fill:#e2e8f0,stroke:#475569,color:#334155
  classDef ext fill:#ffffff,stroke:#94a3b8,color:#334155,stroke-dasharray:5 3
  class STT,Extract,Followup ai
  class RiskEngine rules
  class Supabase data
  class Twilio,Anthropic,Groq ext
`;

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">CareLoop — System Architecture</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-violet-600">violet</span> = AI / language ·{" "}
          <span className="font-medium text-teal-600">teal</span> = deterministic rules ·{" "}
          dashed = external services
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-6">
        <Mermaid chart={CHART} />
      </div>
    </div>
  );
}
