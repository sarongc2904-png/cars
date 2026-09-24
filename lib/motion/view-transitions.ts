/**
 * Reference transition type for build-to-build navigation.
 *
 * Matched by `html:active-view-transition-type(next-build)` in `app/scroll.css`.
 * Deliberately no `"use client"` so Server Components can import the value.
 */
export const NEXT_BUILD_TRANSITION = "next-build" as const;

export type TransitionType = typeof NEXT_BUILD_TRANSITION;