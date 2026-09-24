"use client";

/**
 * Text-reveal primitives.
 *
 * The reference reveals headings by splitting them and animating the pieces
 * inside an overflow mask — `SplitText` for the splitting, `AnimatedHeading` for
 * the motion. Its parameters (chunk `0c9f9uugv3qwz.js`, module `221781`):
 *
 *   lines   clipPath: "inset(-0.14em)", opacity: .18
 *   chars   yPercent: 120
 *   duration 0.6s per piece, ease "expo.out"
 *   stagger  min(0.025, 0.5 / (count - 1))
 *   trigger  isDesktop ? "top 85%" : "top 90%"
 *
 * `SplitText` is a paid GSAP plugin and is not a dependency here, so this module
 * provides an equivalent DOM splitter for the piece types this project needs.
 * The mask is the important part: the pieces rise from *inside* a clipped box,
 * which is what makes the reveal read as a mask rather than a fade — exactly the
 * mechanism the brief warns against replacing with `opacity + translateY`.
 */

import gsap from "gsap";
import { DESKTOP_MEDIA_QUERY } from "@/lib/motion/tokens";

/** Reference `AnimatedHeading` parameters. */
export const REVEAL_DURATION = 0.6;
export const REVEAL_EASE = "expo.out";
export const REVEAL_REST_ALPHA = 0.18;
export const REVEAL_START_DESKTOP = "top 85%";
export const REVEAL_START_MOBILE = "top 90%";

/** Reference stagger: `min(0.025, 0.5 / (count - 1))`. */
export function revealStagger(count: number): number {
  return count > 1 ? Math.min(0.025, 0.5 / (count - 1)) : 0;
}

/**
 * Splits `element` into one masked span per word, in place.
 *
 * Idempotent: calling it again returns the pieces created the first time, so a
 * setup that re-runs (viewport change, scroller arriving) never double-splits.
 * The element keeps an `aria-label` with the original sentence and the visual
 * pieces are `aria-hidden`, mirroring how the reference pairs SplitText with
 * assistive technology.
 */
export function splitWordsIntoMasks(element: HTMLElement): HTMLElement[] {
  const existing = element.querySelectorAll<HTMLElement>("[data-reveal-word]");
  if (existing.length) return Array.from(existing);

  const label = (element.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!label) return [];

  element.setAttribute("aria-label", label);
  element.textContent = "";

  const pieces: HTMLElement[] = [];
  const words = label.split(" ");

  words.forEach((word, index) => {
    const mask = document.createElement("span");
    mask.className = "reveal-mask";
    mask.setAttribute("aria-hidden", "true");

    const inner = document.createElement("span");
    inner.className = "reveal-word";
    inner.setAttribute("data-reveal-word", "");
    inner.textContent = word;

    mask.appendChild(inner);
    element.appendChild(mask);
    if (index < words.length - 1) element.appendChild(document.createTextNode(" "));
    pieces.push(inner);
  });

  return pieces;
}

export type WordRevealOptions = {
  /** Element the ScrollTrigger watches (usually the heading itself). */
  trigger: Element;
  /** Element every trigger must use as its `scroller`. */
  scroller: HTMLElement | null;
  /** Override the start; defaults to the reference's desktop/mobile pair. */
  start?: string;
  /** Reversible: plays on enter, reverses on leave. */
  reversible?: boolean;
};

/**
 * Builds the masked rise for already-split pieces. Must be called from inside a
 * `gsap.context()` so the trigger is reverted with its component.
 */
export function createWordReveal(
  pieces: readonly HTMLElement[],
  { trigger, scroller, start, reversible = false }: WordRevealOptions,
): gsap.core.Tween | null {
  if (!pieces.length) return null;

  const isDesktop =
    typeof window !== "undefined" && window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

  return gsap.fromTo(
    pieces,
    { yPercent: 120 },
    {
      yPercent: 0,
      duration: REVEAL_DURATION,
      ease: REVEAL_EASE,
      stagger: revealStagger(pieces.length),
      scrollTrigger: {
        scroller: scroller ?? undefined,
        trigger,
        start: start ?? (isDesktop ? REVEAL_START_DESKTOP : REVEAL_START_MOBILE),
        toggleActions: reversible ? "play none none reverse" : "play none none none",
      },
    },
  );
}

/**
 * Convenience: split then reveal. Returns the tween, or `null` for an empty
 * heading.
 */
export function revealHeading(
  element: HTMLElement,
  options: WordRevealOptions,
): gsap.core.Tween | null {
  return createWordReveal(splitWordsIntoMasks(element), options);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Gradient fill wipe — the reference's heading treatment.
 *
 * Measured on the live site (`forgeautomotive.co.uk`) and confirmed in the
 * mirror: "Identity / Insight / Cohesion", the service names, "Previous Builds",
 * "Available Stock", "Ends Here" etc. do NOT mask-rise. They set
 * `color: transparent` with `background-clip: text`, paint one
 * `linear-gradient(97deg, …)` whose stops are the resting colour (white at
 * `0.18`) up to `--fill`, the accent at `--fill`, then full white after, and
 * scrub a single custom property with the scroll. The live DOM shows exactly
 * `--fill-pos: -16`, `--fill-from: rgba(255,255,255,0.18)`,
 * `--fill-to: rgb(255,255,255)` and the leading-edge accent `rgb(204,75,55)`.
 *
 * The reference fills LINE BY LINE (each visual line is its own block with its
 * own gradient, and the lines fill in sequence), so this module splits by
 * measured visual line, not by word.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Reference `ServicesHeroHeading`: rest alpha for unfilled text. */
export const FILL_FROM = "rgba(255, 255, 255, 0.18)";
export const FILL_TO = "rgb(255, 255, 255)";
/** Reference leading-edge accent: `rgb(204, 75, 55)` = `#cc4b37`. */
export const FILL_ACCENT = "rgb(204, 75, 55)";
/** Reference spacing between successive fills (18 % stops). */
export const FILL_STAGGER = 0.18;
/** Reference `--fill-pos` range: -16 -> 111 (100 + (n-1)*18 + 11, n=1). */
export const FILL_START = "-16%";
export const FILL_END = "111%";

/**
 * Splits `element` into one block span per VISUAL line (idempotent), so the fill
 * sweeps line by line, exactly like the reference's SplitText `lines`.
 *
 * Measurement strategy: wrap each word in a temporary inline-block, group words
 * that share the same `offsetTop` into a line, then replace with one
 * `reveal-fill-line` block per line. `aria-label` keeps the sentence intact for
 * assistive technology; the pieces are `aria-hidden`.
 */
export function splitLinesForFill(element: HTMLElement): HTMLElement[] {
  const existing = element.querySelectorAll<HTMLElement>("[data-fill-line]");
  if (existing.length) return Array.from(existing);

  const label = (element.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!label) return [];

  element.setAttribute("aria-label", label);

  // 1) Temporary word probes to discover the wrapped line boundaries.
  const words = label.split(" ");
  const probes: HTMLElement[] = [];
  element.textContent = "";
  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.textContent = word;
    element.appendChild(span);
    if (index < words.length - 1) element.appendChild(document.createTextNode(" "));
    probes.push(span);
  });

  // 2) Group consecutive words that share a top (within 2px) into one line.
  const lineGroups: number[][] = [];
  let current: number[] = [];
  let currentTop = -1;
  probes.forEach((probe, index) => {
    const top = Math.round(probe.getBoundingClientRect().top);
    if (currentTop === -1 || Math.abs(top - currentTop) <= 2) {
      current.push(index);
      if (currentTop === -1) currentTop = top;
    } else {
      lineGroups.push(current);
      current = [index];
      currentTop = top;
    }
  });
  if (current.length) lineGroups.push(current);

  // 3) Rebuild as one block span per line.
  element.textContent = "";
  const lines: HTMLElement[] = [];
  lineGroups.forEach((indexes) => {
    const line = document.createElement("span");
    line.className = "reveal-fill-line";
    line.setAttribute("data-fill-line", "");
    line.setAttribute("aria-hidden", "true");
    line.textContent = indexes.map((i) => words[i]).join(" ");
    element.appendChild(line);
    lines.push(line);
  });

  return lines;
}

export type FillRevealOptions = {
  trigger: Element;
  scroller: HTMLElement | null | undefined;
  start?: string;
  end?: string;
};

/**
 * Builds the scrubbed fill for already-split lines. Must be created inside a
 * `gsap.context()` so the trigger is reverted with its component.
 */
export function createFillReveal(
  pieces: readonly HTMLElement[],
  { trigger, scroller, start = "top bottom", end = "bottom center" }: FillRevealOptions,
): gsap.core.Timeline | null {
  if (!pieces.length) return null;

  return gsap
    .timeline({
      scrollTrigger: {
        scroller: scroller ?? undefined,
        trigger,
        start,
        end,
        scrub: true,
      },
    })
    .fromTo(
      pieces,
      { "--fill": FILL_START },
      { "--fill": FILL_END, duration: 1, ease: "none", stagger: FILL_STAGGER },
      0,
    );
}

/** Convenience: split into fill lines, then reveal. */
export function revealFillHeading(element: HTMLElement, options: FillRevealOptions): gsap.core.Timeline | null {
  return createFillReveal(splitLinesForFill(element), options);
}
