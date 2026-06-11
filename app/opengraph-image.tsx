import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Miruwa watches the gaps between visits.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Mirrors the landing hero: logo, evaluation badge, two-tone headline,
 * product-fact line, and the monitoring-not-diagnosis safety line. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          backgroundColor: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "#0f766e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* heart-pulse mark */}
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px" }}>
            Miruwa
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 44,
            padding: "8px 20px",
            borderRadius: 9999,
            border: "1px solid rgba(15, 118, 110, 0.25)",
            backgroundColor: "#e6f2f1",
            color: "#134e4a",
            fontSize: 22,
            fontWeight: 500,
            alignSelf: "flex-start",
          }}
        >
          Hong Kong elderly chronic-care monitoring
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            fontSize: 74,
            fontWeight: 700,
            letterSpacing: "-2px",
            lineHeight: 1.12,
            maxWidth: 1040,
          }}
        >
          <span style={{ color: "#0f172a" }}>Miruwa watches the</span>
          <span style={{ color: "#0f766e" }}>gaps between visits.</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 24,
            color: "#64748b",
            lineHeight: 1.4,
          }}
        >
          WhatsApp check-ins · deterministic rules — no AI diagnosis · exception-first dashboard
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 22,
            color: "#0f766e",
            fontWeight: 600,
          }}
        >
          Monitoring support — not diagnosis.
        </div>
      </div>
    ),
    { ...size },
  );
}
