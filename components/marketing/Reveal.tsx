"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Reveals its children with a fade-up the first time they scroll into view.
 *
 *  SSR / no-JS safe: the hidden initial state lives in CSS gated on the `.js`
 *  class (set before paint in the root layout), so without JS the content is
 *  shown. Reduced-motion users get the content immediately (see globals.css).
 *  One-shot: the observer disconnects after the first reveal. */
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Rare (JS on, no IO): reveal on the next frame rather than synchronously.
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            return;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("cl-reveal", visible && "is-visible", className)}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
