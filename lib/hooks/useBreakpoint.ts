"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

function classify(w: number): Breakpoint {
  if (w < 480) return "xs";
  if (w < 768) return "sm";
  if (w < 1024) return "md";
  if (w < 1280) return "lg";
  return "xl";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("xl");

  useEffect(() => {
    const update = () => setBp(classify(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}
