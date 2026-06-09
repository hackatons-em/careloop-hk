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
    themeVariables: { fontSize: "18px" },
    flowchart: { htmlLabels: true, curve: "basis", padding: 12, nodeSpacing: 45, rankSpacing: 50 },
  });
  initialized = true;
}

/** Renders a Mermaid diagram from a definition string (client-side).
 * `label` is announced to screen readers in place of the SVG content. */
export function Mermaid({ chart, label }: { chart: string; label: string }) {
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
      role="img"
      aria-label={label}
      className="flex justify-center [&_svg]:!h-auto [&_svg]:!w-auto [&_svg]:!max-h-[62vh] [&_svg]:!max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
