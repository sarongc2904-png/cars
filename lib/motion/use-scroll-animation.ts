"use client";

/**
 * `useScrollAnimation` — a small, dependency-free equivalent of the reference's
 * `useAnimation` helper (`1chgqkv70o29y.js`, which is `@gsap/react`'s `useGSAP`
 * re-implemented inline).
 *
 * Reference behaviour reproduced here:
 *  - the setup callback runs inside a `gsap.context()` scoped to `scope`;
 *  - the callback receives `{ isDesktop }`, derived from the reference's
 *    `DESKTOP_MEDIA_QUERY` (`(min-width: 1024px)`), and the whole context is
 *    rebuilt when that flips — which is how desktop/mobile choreography branches
 *    inside a single callback;
 *  - every trigger created inside the context is reverted automatically
 *    (`ctx.revert()`), which is what prevents orphaned ScrollTriggers on route
 *    changes. The reference never calls `ScrollTrigger.getAll().forEach(kill)`.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, type RefObject } from "react";
import { DESKTOP_MEDIA_QUERY } from "@/lib/motion/tokens";

export type ScrollAnimationContext = {
  /** `(min-width: 1024px)` — the reference's primary desktop breakpoint. */
  isDesktop: boolean;
  /** Scope element, when one was provided. */
  scope: HTMLElement | null;
};

export type ScrollAnimationOptions = {
  /** Element the `gsap.context()` is scoped to; selectors resolve inside it. */
  scope?: RefObject<HTMLElement | null>;
  /**
   * Extra rebuild trigger, passed as a *key* rather than a dependency array so
   * the list length can change safely. Typical use: the scroller element, so
   * triggers are created only once the smooth scroller exists.
   */
  key?: string;
  /** Skip the whole setup (e.g. `prefers-reduced-motion`). */
  disabled?: boolean;
};

export function useDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_MEDIA_QUERY);
    setIsDesktop(query.matches);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

export function useScrollAnimation(
  setup: (context: ScrollAnimationContext) => void | (() => void),
  options: ScrollAnimationOptions = {},
): void {
  const { scope, key = "", disabled = false } = options;
  const isDesktop = useDesktopViewport();

  // Keep the latest callback in a ref so `setup` never has to be a dependency.
  const setupRef = useRef(setup);
  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  useEffect(() => {
    if (disabled) return;

    gsap.registerPlugin(ScrollTrigger);

    const element = scope?.current ?? null;
    const context = gsap.context(
      () => setupRef.current({ isDesktop, scope: element }),
      element ?? undefined,
    );

    return () => context.revert();
  }, [isDesktop, disabled, key, scope]);
}

/**
 * `ScrollTrigger.refresh()` is expensive; the reference batches it to the next
 * frame plus a delayed pass so late-loading images and fonts are measured.
 */
export function useScheduledScrollRefresh(extraDelay = 300): void {
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    const frame = window.requestAnimationFrame(refresh);
    const timer = window.setTimeout(refresh, extraDelay);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [extraDelay]);
}