"use client";

/** Small DOM helpers shared by the navigation and motion components. */

import type { MouseEvent } from "react";

/**
 * The reference's `isModifiedClick` (`3dca2icpnmf5w.js`), verbatim:
 *
 *   e => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || 1 === e.button
 *
 * Lets the browser handle "open in new tab" and middle clicks instead of
 * intercepting them for a client-side navigation.
 */
export function isModifiedClick(event: MouseEvent<HTMLElement>): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1;
}

/** True when the browser can run the View Transitions API. */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

/**
 * Loader lifecycle.
 *
 * `MotionSystem` is the only writer: it holds the page while the loader is on
 * screen (adding `body.is-loading`, which also stops the smooth scroller) and
 * then dispatches this event exactly once. Every consumer reads the same
 * constant, so producer and listeners cannot drift apart.
 */
export const LOADER_COMPLETE_EVENT = "awar:loader-complete";

/** `true` while the loader is still gating the page. */
export function isLoaderPending(): boolean {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains("is-loading");
}

/** `true` once the loader finished and entrance animations may run. */
export function isLoaderComplete(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("motion-ready");
}

/**
 * Runs `callback` when the loader is done — immediately if it already is.
 * Returns an unsubscribe function.
 */
export function onLoaderComplete(callback: () => void): () => void {
  if (isLoaderComplete()) {
    callback();
    return () => {};
  }
  window.addEventListener(LOADER_COMPLETE_EVENT, callback, { once: true });
  return () => window.removeEventListener(LOADER_COMPLETE_EVENT, callback);
}