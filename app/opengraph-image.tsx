import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CareLoop — Remote chronic-care monitoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: "80px",
          backgroundColor: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              backgroundColor: "#0f766e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* heart-pulse mark */}
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#0f172a", letterSpacing: "-2px" }}>
            CareLoop
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 44,
            fontWeight: 600,
            color: "#0f172a",
            letterSpacing: "-1px",
            lineHeight: 1.2,
            maxWidth: 980,
          }}
        >
          Remote chronic-care monitoring for the gaps between clinic visits.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 28,
            color: "#64748b",
            maxWidth: 940,
            lineHeight: 1.4,
          }}
        >
          Daily WhatsApp check-ins · deterministic risk rules · exception-first nurse dashboard
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 52,
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
