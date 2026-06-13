"use client";

import { useEffect, useRef } from "react";

/** Wraps server-rendered children and applies a tiny, transform-only parallax
 *  drift as the element scrolls through the viewport.
 *
 *  Deliberately restrained: capped at `maxPx`, desktop only (lg+), and disabled
 *  for reduced-motion. Transform-only means no layout shift. Falls back to a
 *  plain wrapper when conditions aren't met. */
export function Parallax({
  children,
  className,
  maxPx = 12,
}: {
  children: React.ReactNode;
  className?: string;
  maxPx?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    let raf = 0;
    let active = desktop.matches && !reduce.matches;

    const apply = () => {
      raf = 0;
      if (!active) {
        el.style.transform = "";
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress: 0 when the element's center sits at viewport center,
      // negative above, positive below — clamped to [-1, 1].
      const center = rect.top + rect.height / 2;
      const progress = Math.max(-1, Math.min(1, (center - vh / 2) / (vh / 2)));
      el.style.transform = `translate3d(0, ${(-progress * maxPx).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onChange = () => {
      active = desktop.matches && !reduce.matches;
      apply();
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onChange);
    reduce.addEventListener?.("change", onChange);
    desktop.addEventListener?.("change", onChange);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onChange);
      reduce.removeEventListener?.("change", onChange);
      desktop.removeEventListener?.("change", onChange);
      cancelAnimationFrame(raf);
    };
  }, [maxPx]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
