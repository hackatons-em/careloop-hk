"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    flowchart: { htmlLabels: true, curve: "basis", padding: 14, nodeSpacing: 45, rankSpacing: 55 },
  });
  initialized = true;
}

/** Renders a Mermaid diagram from a definition string (client-side). */
export function Mermaid({ chart }: { chart: string }) {
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");

  useEffect(() => {
    ensureInit();
    let alive = true;
    mermaid
      .render(id, chart)
      .then((r) => {
        if (alive) setSvg(r.svg);
      })
      .catch((e) => console.error("[mermaid]", e));
    return () => {
      alive = false;
    };
  }, [chart, id]);

  return (
    <div
      className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
