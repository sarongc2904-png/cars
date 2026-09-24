/**
 * Motion + layout tokens.
 *
 * Every value here is transcribed from the Forge Automotive mirror used as the
 * technical reference:
 *   - `reference-notes` equivalent: the compiled `:root` block in the
 *     server-rendered markup (styled-components output).
 *   - `_next/static/chunks/2u_v-vubcx27g.css`: global page / lenis /
 *     view-transition CSS.
 *
 * Duplicated in CSS custom properties (see `app/scroll.css`) because GSAP needs
 * numeric easings and breakpoints in JavaScript. Keep both in sync.
 *
 * ROOT FONT-SIZE: the reference sets `html { font-size: 62.5% }` (1rem = 10px,
 * 68.75% at 1600px, 75% at 1920px). This project keeps the browser default
 * (1rem = 16px) because `globals.css` + `editorial.css` already express ~70 KB
 * of layout in rem against that assumption; so reference `rem` values are
 * restated as px at 1rem = 10px.
 */

/** Named easings, mirroring `--easing-*`. */
export const EASING = {
  /** `--easing-bezzy` */
  bezzy: "cubic-bezier(0.8, 0, 0, 1)",
  /** `--easing-bezzy2` — used by the menu page-shrink. */
  bezzy2: "cubic-bezier(0.430, 0.195, 0.020, 1)",
  /** `--easing-bezzy3` — used by the Navigate/Close label swap. */
  bezzy3: "cubic-bezier(0.5, 0, 0, 1)",
  /** `--easing-ease` */
  ease: "ease-in-out",
} as const;

/** Named durations, mirroring `--time-*`. */
export const TIME = { s: 0.15, m: 0.3, l: 0.6 } as const;

/** Page-transition beat (`--page-beat-dur`); 0.6s on touch devices. */
export const PAGE_BEAT_DUR = 1.2;
export const PAGE_BEAT_DUR_TOUCH = 0.6;
export const PAGE_ENTER_EASE = "cubic-bezier(.2, .7, .2, 1)";

/** Build-to-build view transition. */
export const NEXT_BUILD_DUR = 1.2;
export const NEXT_BUILD_DUR_TOUCH = 0.6;
export const NEXT_BUILD_EASE = "cubic-bezier(.7, .05, .13, 1)";

/** The menu page-shrink transition (`--speed: 1s` + `--easing-bezzy2`). */
export const MENU_SHRINK_DURATION = 1;
/** Fallback when `transitionend` never fires (reference: `setTimeout(..., 1100)`). */
export const MENU_SHRINK_FALLBACK_MS = 1100;

export const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
export const WIDE_MEDIA_QUERY = "(min-width: 1600px)";
export const ULTRAWIDE_MEDIA_QUERY = "(min-width: 1920px)";
export const HOVER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";
export const TOUCH_MEDIA_QUERY = "(hover: none)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Breakpoint ladder from the reference theme. */
export const BREAKPOINTS = {
  xs: 320, sm: 420, md: 700, lg: 1024, xl: 1200, xxl: 1400, wide: 1600, ultrawide: 1920,
} as const;

/** Brand colours, mirroring `--brand-bc*`. */
export const BRAND = {
  bc1: "#0C0C0C", bc2: "#161616", bc3: "#410306", bc4: "#C5A064", bc5: "#F2F1ED",
  black: "#000000", white: "#ffffff",
} as const;

/** Feedback colours, mirroring `--feedback-*`. */
export const FEEDBACK = {
  positive: "#3adb76", negative: "#cc4b37", warning: "#face10",
} as const;

/** Spacing scale `--gap-*`, in px at the reference root (1rem = 10px). */
export const GAP = {
  xxs: 2, xs: 4, s: 8, sm: 16, m: 24, l: 32, xl: 40, xxl: 64,
  huge: 80, uber: 96, massive: 128,
} as const;

/** Section rhythm `--space-*`, in px at the reference root. */
export const SPACE = { s: 48, m: 60, l: 100, xl: 120 } as const;

/** Type scale, in px at the reference root. */
export const TYPE = {
  displayL: 140, headlineL: 96, headlineS: 80,
  body: 16, bodyLg: 18, caption: 9, captionLg: 10,
  leadingDisplay: 1.2, leadingBody: 1.4,
  trackingDisplay: -2, trackingBody: -0.5, trackingCaption: 3,
} as const;

export function isDesktopViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(HOVER_MEDIA_QUERY).matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}