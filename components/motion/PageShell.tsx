"use client";

/**
 * `PageShell` — the `#page` element that wraps the whole scrolling page and
 * shrinks when the navigation menu opens. It renders OUTSIDE the smooth scroller,
 * exactly as in the reference (`#page { height: 100%; overflow: hidden }`
 * wrapping `.lenis { height: 100dvh; overflow: auto }`).
 *
 * Reference evidence (`2pq7yl53l2imk.js`, `PageWrapper`, styled component
 * `sc-d3167531-0`):
 *
 *   const PageWrapper = ({ children }) => {
 *     const { menuOpen, menuReady, setMenuVisible } = use(MenuContext)
 *     const isShrunk = menuOpen && menuReady
 *     const ref = useRef(null)
 *     const hasOpened = useRef(false)
 *     useEffect(() => {
 *       if (isShrunk) { hasOpened.current = true; setMenuVisible(true); return }
 *       if (!hasOpened.current || !ref.current) return
 *       const el = ref.current
 *       let done = false
 *       const finish = () => { if (!done) { done = true; setMenuVisible(false); ScrollTrigger.refresh() } }
 *       const onEnd = (e) => { if (e.target === el && e.propertyName === "scale") finish() }
 *       el.addEventListener("transitionend", onEnd)
 *       const timer = window.setTimeout(finish, 1100)
 *       return () => { el.removeEventListener("transitionend", onEnd); clearTimeout(timer) }
 *     }, [isShrunk, setMenuVisible])
 *     return <Div id="page" ref={ref} $isMenuOpen={isShrunk} $isPrimed={menuReady}>{children}</Div>
 *   }
 *
 *   styled css:
 *     --speed: 1s;
 *     --ease: bezzy2;                              // cubic-bezier(0.430, 0.195, 0.020, 1)
 *     pointer-events: ${isShrunk ? "none" : "all"};
 *     clip-path: inset(${50 * !!isShrunk}%);        // open: inset(50%), closed: inset(0%)
 *     scale: ${isShrunk ? .5 : 1};                  // open: .5,          closed: 1
 *     transition: clip-path var(--speed) var(--ease), scale var(--speed) var(--ease);
 *     will-change: ${isPrimed ? "clip-path, scale" : "auto"};
 *
 *   Developer comment preserved from the reference:
 *     "NOTE • Promoted BEFORE the first open, not during it. Animating clip-path
 *      and scale together forces this element onto its own compositor layer, and
 *      on the very first open that promotion happened as the transition started —
 *      the frame painted before the new layer had rasterised showed the page
 *      unclipped, whatever happened to be on screen at that scroll position. One
 *      frame, first open only, because every later open reuses the layer.
 *      Keyed to menuReady rather than menuOpen so the promotion lands when the
 *      lazy menu warm-mounts at idle, with no click waiting on it."
 *
 * The geometry itself lives in `app/scroll.css` (`#page`,
 * `#page[data-menu-open]`, `#page[data-menu-primed]`) so the values are
 * inspectable in devtools.
 *
 * Note: this project renders `#page` as a `<div>`, not a `<main>`, because the
 * routes already render their own `<main>` and nesting `main` landmarks is
 * invalid HTML.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMenu } from "@/lib/motion/menu-context";
import { MENU_SHRINK_FALLBACK_MS } from "@/lib/motion/tokens";

export function PageShell({ children }: { children: ReactNode }) {
  const { isShrunk, menuReady, setMenuVisible } = useMenu();
  const pageRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (isShrunk) {
      hasOpenedRef.current = true;
      setMenuVisible(true);
      return;
    }

    if (!hasOpenedRef.current || !pageRef.current) return;

    const element = pageRef.current;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      setMenuVisible(false);
      // The page geometry changed while the menu was open, so every trigger
      // must be re-measured — exactly what the reference does here.
      ScrollTrigger.refresh();
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === "scale") finish();
    };

    element.addEventListener("transitionend", onTransitionEnd);
    const fallback = window.setTimeout(finish, MENU_SHRINK_FALLBACK_MS);

    return () => {
      element.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(fallback);
    };
  }, [isShrunk, setMenuVisible]);

  return (
    <div
      id="page"
      ref={pageRef}
      className="page-shell"
      data-menu-open={isShrunk ? "" : undefined}
      data-menu-primed={menuReady ? "" : undefined}
    >
      {children}
    </div>
  );
}