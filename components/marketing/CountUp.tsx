"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect on the client (runs before paint, so the reset to 0 is never
// seen), useEffect on the server (no-op, avoids the SSR warning).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Counts up to `end` the first time it scrolls into view.
 *
 *  Renders `end` during SSR (correct for crawlers and no-JS visitors); the
 *  animation only runs on the client. Reduced-motion users see the final value
 *  with no animation. The `0` reset happens in a layout effect before paint,
 *  so the final value never flashes before counting. */
export function CountUp({
  end,
  durationMs = 1100,
}: {
  end: number;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(end);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setValue(end);
      return;
    }

    setValue(0);
    let raf = 0;
    const run = () => {
      let startTs = 0;
      const step = (ts: number) => {
        if (!startTs) startTs = ts;
        const p = Math.min(1, (ts - startTs) / durationMs);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setValue(Math.round(eased * end));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            run();
            return;
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [end, durationMs]);

  // Reserve the final width up-front (tabular digits + ch min-width) so the
  // badge never reflows as the digit count grows — zero layout shift.
  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        minWidth: `${String(end).length}ch`,
        textAlign: "center",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  );
}
