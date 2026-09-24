"use client";

/** Reactive `prefers-reduced-motion: reduce`. */

import { useEffect, useState } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/tokens";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}