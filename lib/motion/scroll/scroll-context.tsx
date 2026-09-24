"use client";

/**
 * Global smooth-scroll architecture.
 *
 * == Reference evidence (Forge Automotive mirror) ==
 *
 * 1. The single Lenis construction (`2pq7yl53l2imk.js`, module `945047`,
 *    component `SmoothScroll`), verbatim:
 *
 *      <ReactLenis ref={lenisRef} options={{ autoRaf: !1, lerp: .09 }} />
 *
 *    No `root`, no `duration`, no `easing`, no explicit `wrapper`/`content`, no
 *    `orientation`, no `prevent`. `ReactLenis` renders the wrapper `<div>`
 *    itself, so `lenis.rootElement` is that div — never `window`.
 *
 * 2. Under `prefers-reduced-motion: reduce` the reference's `SmoothScroll`
 *    returns bare children: Lenis is never mounted at all.
 *
 * 3. The GSAP bridge (same module), verbatim:
 *
 *      ScrollTrigger.scrollerProxy(el, {
 *        scrollTop: v => (v !== undefined && lenis.scrollTo(v, { immediate: true }), lenis.scroll),
 *        getBoundingClientRect: () => ({ top: 0, left: 0, width: el.clientWidth, height: el.clientHeight }),
 *        pinType: "fixed",
 *      })
 *      ScrollTrigger.defaults({ scroller: el })
 *      lenis.on("scroll", ScrollTrigger.update)
 *      const t = time => lenis.raf(time * 1000)
 *      gsap.ticker.add(t)
 *      ScrollTrigger.refresh()
 *
 *    cleanup: `lenis.off(...)`, `gsap.ticker.remove(t)`,
 *    `ScrollTrigger.defaults({ scroller: window })`, `ScrollTrigger.scrollerProxy(el)`.
 *    `gsap.ticker.lagSmoothing(0)` is NOT in the reference and is omitted here.
 *
 * 4. Scroll container CSS (`2u_v-vubcx27g.css`): `html, body { height: 100%;
 *    overflow: hidden }`, `#page { height: 100%; overflow: hidden }`,
 *    `.lenis { width: 100%; height: 100dvh; position: relative; overflow: auto }`.
 *    All of it lives in `app/scroll.css`. The reference's debug overlay prints
 *    `wrapper ${rootElement.scrollTop}/${rootElement.scrollHeight}`, confirming
 *    the document itself never scrolls.
 *
 * 5. Route change: `lenis.options.infinite = false`; set `data-scroll-resetting`;
 *    `lenis.scrollTo(0, { immediate: true, force: true })`; clear the attribute;
 *    `lenis.resize()`; next frame `ScrollTrigger.refresh()`.
 *
 * 6. `ScrollTrigger.getAll().forEach(t => t.kill())` is NEVER used by the
 *    reference — per-trigger cleanup happens through scoped `gsap.context()`
 *    reverts, which is what this project does too.
 *
 * -- Provider / root split ---------------------------------------------------
 * `ScrollProvider` owns the instance and the context but renders NO markup, and
 * `ScrollRoot` renders the `.lenis` element and registers it. That split exists
 * so the provider can wrap the whole shell — including the header and the
 * loader, which also read scroll state — while the scroller element itself still
 * nests INSIDE `#page`, exactly as in the reference.
 * ---------------------------------------------------------------------------
 */

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMenu } from "@/lib/motion/menu-context";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/tokens";

export type LenisScrollToTarget = number | string | HTMLElement;

export type ScrollContextValue = {
  /** The single Lenis instance, or `null` under reduced motion / before mount. */
  lenis: Lenis | null;
  /**
   * The element every ScrollTrigger must use as its `scroller`. `null` means
   * "ScrollTrigger default" — the reduced-motion path, where the document
   * scrolls natively.
   */
  scroller: HTMLElement | null;
  /** `true` once the smooth scroller is wired and triggers can be created. */
  ready: boolean;
  /** Called by `ScrollRoot` once its elements exist. */
  register: (scroller: HTMLElement | null, content: HTMLElement | null) => void;
  scrollTo: (
    target: LenisScrollToTarget,
    options?: { duration?: number; immediate?: boolean; offset?: number; force?: boolean },
  ) => void;
  /** Current offset in px. Falls back to `window.scrollY` under reduced motion. */
  getScroll: () => number;
  /** Current velocity in px/frame (`0` under reduced motion). */
  getVelocity: () => number;
  stop: () => void;
  start: () => void;
};

const ScrollContext = createContext<ScrollContextValue | null>(null);

/**
 * The reference's Lenis options, verbatim: `{ autoRaf: false, lerp: 0.09 }`.
 *
 * `autoRaf: false` is what lets GSAP's ticker be the single frame loop;
 * `lerp: 0.09` IS the scroll feel. The reference additionally ships a
 * `?scroll-debug` tuner (localStorage `forge:scroll-tuner:2`) with slider ranges
 * `lerp` .02–.30 step .005, `duration` .3–3 step .05, `wheelMultiplier` .5–3
 * step .05 and a `smoothWheel` toggle — but the shipped values are these two.
 */
export const LENIS_OPTIONS = { autoRaf: false, lerp: 0.09 } as const;

/**
 * Default duration for programmatic scrolls. CONFIRMED: the reference's
 * `BackToTop` calls `lenis.scrollTo(0, { duration: 1.2 })` and its
 * `scrollToForm` calls `lenis.scrollTo("#form", { duration: 1.2, offset: -200 })`,
 * and its scroll tuner reads `options.duration ?? 1.2`.
 */
export const PROGRAMMATIC_SCROLL_DURATION = 1.2;

/** `data-scroll-resetting` — the reference's flag around route scroll resets. */
export const SCROLL_RESETTING_ATTRIBUTE = "data-scroll-resetting";

function prefersReducedMotionNow(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function ScrollProvider({ children }: { children: ReactNode }) {
  const { menuOpen, menuVisible } = useMenu();
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const lockedRef = useRef(false);
  const restoreRef = useRef<number | null>(null);
  const firstPathRef = useRef(pathname);
  const [elements, setElements] = useState<{ scroller: HTMLElement | null; content: HTMLElement | null }>({
    scroller: null,
    content: null,
  });
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  const register = useCallback((nextScroller: HTMLElement | null, nextContent: HTMLElement | null) => {
    setElements((current) => {
      if (current.scroller === nextScroller && current.content === nextContent) return current;
      return { scroller: nextScroller, content: nextContent };
    });
  }, []);

  useEffect(() => {
    const { scroller: wrapper, content } = elements;
    if (!wrapper || !content) return;

    gsap.registerPlugin(ScrollTrigger);

    // Reduced motion: never construct Lenis (see note 2 above). The stylesheet
    // hands scrolling back to the document, so ScrollTrigger keeps its default.
    if (prefersReducedMotionNow()) {
      setScroller(null);
      return;
    }

    const lenis = new Lenis({
      wrapper,
      content,
      autoRaf: LENIS_OPTIONS.autoRaf,
      lerp: LENIS_OPTIONS.lerp,
    });

    lenisRef.current = lenis;

    ScrollTrigger.scrollerProxy(wrapper, {
      scrollTop: (value) => {
        if (value !== undefined) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      }),
      pinType: "fixed",
    });

    ScrollTrigger.defaults({ scroller: wrapper });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);

    const refresh = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };

    setScroller(wrapper);
    ScrollTrigger.refresh();

    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("orientationchange", refresh, { passive: true });
    const frame = window.requestAnimationFrame(refresh);
    const timer = window.setTimeout(refresh, 300);
    if (document.fonts) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      ScrollTrigger.defaults({ scroller: window });
      ScrollTrigger.scrollerProxy(wrapper);
      setScroller(null);
    };
  }, [elements]);

  // Route change: mirror the reference's reset sequence. Skipped on first mount
  // so the initial page keeps its restored offset.
  useEffect(() => {
    if (firstPathRef.current === pathname) return;
    firstPathRef.current = pathname;

    const lenis = lenisRef.current;
    const root = document.documentElement;

    if (lenis) {
      root.setAttribute(SCROLL_RESETTING_ATTRIBUTE, "");
      lenis.options.infinite = false;
      lenis.scrollTo(0, { immediate: true, force: true });
      root.removeAttribute(SCROLL_RESETTING_ATTRIBUTE);
      lenis.resize();
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    const frame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  // The menu locks the scroller and remembers the offset; the shrink
  // transition's completion restores it.
  useEffect(() => {
    const lenis = lenisRef.current;

    if (menuOpen) {
      restoreRef.current = lenis ? lenis.scroll : window.scrollY;
      lockedRef.current = true;
      lenis?.stop();
      return;
    }

    if (!lockedRef.current || menuVisible) return;

    const frame = window.requestAnimationFrame(() => {
      lockedRef.current = false;
      lenis?.start();
      const target = restoreRef.current;
      restoreRef.current = null;
      if (target !== null && lenis) {
        lenis.scrollTo(target, { immediate: true, force: true });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen, menuVisible]);

  const scrollTo = useCallback<ScrollContextValue["scrollTo"]>((target, options) => {
    const lenis = lenisRef.current;

    if (!lenis) {
      // Reduced motion / pre-mount: native scrolling, still functional.
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: "auto" });
      } else {
        const element = typeof target === "string" ? document.querySelector(target) : target;
        element?.scrollIntoView({ behavior: "auto", block: "start" });
      }
      return;
    }

    const config: Parameters<Lenis["scrollTo"]>[1] = {
      duration: options?.duration ?? PROGRAMMATIC_SCROLL_DURATION,
      immediate: options?.immediate ?? false,
      offset: options?.offset ?? 0,
    };
    if (options?.force) config.force = true;
    lenis.scrollTo(target, config);
  }, []);

  const getScroll = useCallback(
    () => lenisRef.current?.scroll ?? (typeof window === "undefined" ? 0 : window.scrollY),
    [],
  );
  const getVelocity = useCallback(() => lenisRef.current?.velocity ?? 0, []);
  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);

  const value = useMemo<ScrollContextValue>(
    () => ({
      lenis: lenisRef.current,
      scroller,
      ready: scroller !== null,
      register,
      scrollTo,
      getScroll,
      getVelocity,
      stop,
      start,
    }),
    [scroller, register, scrollTo, getScroll, getVelocity, stop, start],
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

/**
 * Renders the scroll container and registers it with the provider.
 *
 * This is the ONLY scroll container in the app; it must stay the only direct
 * `div` child of `.lenis` so `html, body { overflow: hidden }` keeps holding.
 */
export function ScrollRoot({ children }: { children: ReactNode }) {
  const { register } = useScroll();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    register(scrollerRef.current, contentRef.current);
    return () => register(null, null);
  }, [register]);

  return (
    <div className="lenis" ref={scrollerRef} data-lenis-root="">
      <div className="page-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}

export function useScroll(): ScrollContextValue {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScroll must be used inside <ScrollProvider>");
  }
  return context;
}

/**
 * The scroller every ScrollTrigger must use. `null` under reduced motion and
 * before mount, which components use to defer trigger creation.
 */
export function useScrollScroller(): HTMLElement | null {
  return useScroll().scroller;
}