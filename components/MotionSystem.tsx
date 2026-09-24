"use client";

/**
 * Loader, scroll cue and the global scroll-progress bar.
 *
 * This component no longer creates a Lenis instance. The reference has exactly
 * one (`<ReactLenis options={{ autoRaf: false, lerp: .09 }}>` inside its
 * `SmoothScroll` component); here that single instance lives in
 * `ScrollProvider`. Creating a second one was the source of the scroll-feel
 * mismatch: two tickers advancing two different scroll models while every
 * ScrollTrigger read only one of them.
 *
 * What remains is presentation plus the loader state machine. The reference
 * keeps loader state in a `LoaderContext` (`loaderEnabled` / `loaderMounted`)
 * with a `LoaderBypass` escape hatch; its word entrance is `CinematicText`.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LOADER_COMPLETE_EVENT } from "@/lib/motion/dom";
import { useScroll, useScrollScroller } from "@/lib/motion/scroll/scroll-context";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/** Loader copy — AWAR branding, revealed with the reference's `CinematicText` timing. */
const LOADER_WORDS = ["Precisión.", "Potencia.", "Carácter."] as const;

/** Reference `CinematicText`: `delay: .4`, per-word `.65s power3.out`, `+.11` stagger. */
const WORD_DURATION = 0.65;
const WORD_STAGGER = 0.11;
const WORD_DELAY = 0.4;
/** Reference punctuation pause: `+.42` after a `.!?` sentence end. */
const SENTENCE_PAUSE = 0.42;
/** Loader progress bar tween. */
const PROGRESS_DURATION = 1.7;

export function MotionSystem() {
  const scroller = useScrollScroller();
  const { lenis, stop, start } = useScroll();
  const reducedMotion = useReducedMotion();

  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderProgressRef = useRef<HTMLSpanElement>(null);
  const scrollProgressRef = useRef<HTMLSpanElement>(null);
  const [loaderDone, setLoaderDone] = useState(false);
  const [entryReady, setEntryReady] = useState(false);

  /*
   * The page must not scroll behind the loader, and consumers need one reliable
   * "loader finished" signal. The reference locks Lenis with `lenis.stop()`.
   */
  useEffect(() => {
    if (loaderDone) return;
    document.body.classList.add("is-loading");
    stop();
    return () => {
      document.body.classList.remove("is-loading");
      start();
    };
  }, [loaderDone, stop, start]);

  // Reduced motion: skip the loader entirely, as the reference does.
  useEffect(() => {
    if (!reducedMotion) return;
    document.documentElement.classList.add("motion-ready");
    document.body.classList.remove("is-loading");
    setLoaderDone(true);
    setEntryReady(true);
    window.dispatchEvent(new Event(LOADER_COMPLETE_EVENT));
  }, [reducedMotion]);

  // Loader copy reveal + progress fill.
  useEffect(() => {
    if (loaderDone || reducedMotion) return;
    const loader = loaderRef.current;
    if (!loader) return;

    const context = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>("[data-loader-word]", loader);
      if (!words.length) return;

      gsap.set(words, { autoAlpha: 0, y: 12, filter: "blur(0.8rem)" });

      const timeline = gsap.timeline({
        delay: WORD_DELAY,
        onComplete: () => setEntryReady(true),
      });

      let position = 0;
      words.forEach((word, index) => {
        timeline.to(
          word,
          { autoAlpha: 1, y: 0, filter: "blur(0rem)", duration: WORD_DURATION, ease: "power3.out" },
          position,
        );
        position += WORD_STAGGER;
        if (index < words.length - 1 && /[.!?]$/.test(word.textContent?.trim() ?? "")) {
          position += SENTENCE_PAUSE;
        }
      });

      const fill = loaderProgressRef.current;
      if (fill) {
        gsap.set(fill, { scaleX: 0, transformOrigin: "left center" });
        timeline.to(fill, { scaleX: 1, duration: PROGRESS_DURATION, ease: "power2.inOut" }, 0);
      }
    }, loader);

    return () => context.revert();
  }, [loaderDone, reducedMotion]);

  // Global scroll-progress bar — reads the smooth scroller, never `window`.
  useEffect(() => {
    if (reducedMotion || !loaderDone) return;
    const fill = scrollProgressRef.current;
    if (!fill) return;

    const update = () => {
      const element = scroller ?? document.documentElement;
      const max = element.scrollHeight - element.clientHeight;
      const offset = lenis ? lenis.scroll : window.scrollY;
      // The reference clamps the low end to 5e-4 so the bar never fully vanishes.
      const progress = max <= 0 ? 0.0005 : Math.min(1, Math.max(0.0005, offset / max));
      fill.style.transform = "scaleX(" + progress + ")";
    };

    update();
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener("scroll", update, { passive: true });
    lenis?.on("scroll", update);
    const frame = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(frame);
      target.removeEventListener("scroll", update);
      lenis?.off("scroll", update);
    };
  }, [lenis, loaderDone, reducedMotion, scroller]);

  // Scroll cue fades out as the opening track starts moving.
  useEffect(() => {
    if (reducedMotion || !loaderDone) return;

    const cue = document.querySelector<HTMLElement>(".motion-scroll-cue");
    const track = document.querySelector<HTMLElement>(".forge-opening-track");
    if (!cue || !track) return;

    const trigger = ScrollTrigger.create({
      trigger: track,
      scroller: scroller ?? undefined,
      start: "top top",
      end: () => "+=" + window.innerHeight * 0.2,
      scrub: true,
      onUpdate: (self) => {
        gsap.set(cue, { autoAlpha: 1 - self.progress, y: 12 * self.progress });
      },
    });

    return () => trigger.kill();
  }, [loaderDone, reducedMotion, scroller]);

  const enterSite = () => {
    const loader = loaderRef.current;
    if (!loader || !entryReady) return;

    const words = gsap.utils.toArray<HTMLElement>("[data-loader-word]", loader);

    gsap
      .timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          document.documentElement.classList.add("motion-ready");
          setLoaderDone(true);
          window.dispatchEvent(new Event(LOADER_COMPLETE_EVENT));
          ScrollTrigger.refresh();
        },
      })
      .to(words, { autoAlpha: 0, y: -16, filter: "blur(8px)", duration: 0.45, stagger: 0.04 }, 0)
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.92, ease: "power4.inOut" }, 0.24);
  };

  return (
    <>
      {!loaderDone && (
        <div ref={loaderRef} className="forge-loader">
          <p className="forge-loader-brand" aria-hidden="true">
            AWAR
          </p>
          <div className="forge-loader-copy" aria-label="Precisión. Potencia. Carácter.">
            {LOADER_WORDS.map((word) => (
              <span className="forge-loader-word" data-loader-word key={word} aria-hidden="true">
                {word}
              </span>
            ))}
          </div>
          <button className="forge-loader-enter" type="button" disabled={!entryReady} onClick={enterSite}>
            Entrar <span aria-hidden="true">↗</span>
          </button>
          <div className="forge-loader-progress" aria-hidden="true">
            <span ref={loaderProgressRef} />
          </div>
        </div>
      )}

      <div className="motion-scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>

      <div className="motion-progress scroll-progress" aria-hidden="true">
        <span ref={scrollProgressRef} className="scroll-progress__fill" />
      </div>
    </>
  );
}