"use client";

/**
 * Per-page scroll choreography for the inner routes (builds, stock, contact...).
 *
 * Refactored onto the project's single smooth scroller: the document no longer
 * scrolls, so every trigger is created with `scroller: <the .lenis element>` and
 * runs inside `useScrollAnimation`, which reverts its `gsap.context()` on
 * unmount — the reference's own cleanup strategy (it never calls
 * `ScrollTrigger.getAll().forEach(t => t.kill())`).
 *
 * Reveal easing/durations come from the reference's `AnimatedHeading`
 * (`expo.out`, `0.6s` per character, rest opacity `.18`) and its `CinematicText`
 * word entrance.
 */

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isLoaderComplete, onLoaderComplete } from "@/lib/motion/dom";
import { useScrollAnimation } from "@/lib/motion/use-scroll-animation";
import { useScrollScroller } from "@/lib/motion/scroll/scroll-context";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { revealFillHeading } from "@/lib/motion/reveal";

/** Reference `AnimatedHeading`: rest alpha for text that has not filled yet. */
const FILL_REST_ALPHA = 0.18;
/** Reference `AnimatedHeading`: per-character duration and easing. */
const CHAR_DURATION = 0.6;
const CHAR_EASE = "expo.out";
/** Reference palette: theme `feedback.negative` and `brand.bc5`. */
const ACCENT = "#cc4b37";
const REVEALED = "#f2f1ed";
const REST = "#292929";

/**
 * Word-level colour reveal.
 *
 * The reference's gradient fill (see `--fill-pos` in the extraction notes) uses
 * `background-clip: text` plus one `linear-gradient(97deg, ...)` per line; this
 * component keeps the simpler per-word colour tween used by this project's inner
 * pages, which is the same reversible scrub behaviour.
 */
export function ColorRevealText({
  children,
  accents = [],
  className = "",
}: {
  children: string;
  accents?: string[];
  className?: string;
}) {
  const accentSet = new Set(accents.map((word) => word.toLowerCase()));
  return (
    <p className={("color-reveal " + className).trim()} data-color-reveal>
      {children.split(/\s+/).map((word, index) => {
        const key = word.toLowerCase().replace(/[.,;:¿?¡!]/g, "");
        return (
          <span className={accentSet.has(key) ? "is-accent" : undefined} data-word key={word + "-" + index}>
            {word}{" "}
          </span>
        );
      })}
    </p>
  );
}

/**
 * Split-by-word heading with the reference's word entrance.
 *
 * The accessible name stays on the heading (`aria-label`) while the visual copy
 * is `aria-hidden` — the pattern the reference uses alongside SplitText so
 * assistive technology reads the sentence, not a sequence of spans.
 */
export function RevealHeading({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: string;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag className={className} data-fill-heading aria-label={children}>
      {children}
    </Tag>
  );
}

export function PageMotion({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scroller = useScrollScroller();
  const reducedMotion = useReducedMotion();

  // Route entrance: waits for the loader, then reveals the hero block.
  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;

    const animateHero = () => {
      const scope = gsap.context(() => {
        const heroLines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", root);
        const heroCopy = gsap.utils.toArray<HTMLElement>("[data-hero-copy]", root);

        gsap.fromTo(
          heroLines,
          { yPercent: 110 },
          { yPercent: 0, duration: 1.05, stagger: 0.075, ease: "power4.out", delay: 0.12 },
        );
        gsap.fromTo(
          heroCopy,
          { autoAlpha: 0, y: 22, filter: "blur(4px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.85, stagger: 0.08, ease: "power3.out", delay: 0.42 },
        );
      }, root);

      return () => scope.revert();
    };

    if (isLoaderComplete()) {
      return animateHero();
    }

    // The hero context may be created after this effect has been cleaned up, so
    // its revert function is released together with the listener.
    let revert: (() => void) | undefined;
    const unsubscribe = onLoaderComplete(() => {
      revert = animateHero();
    });

    return () => {
      unsubscribe();
      revert?.();
    };
  }, [reducedMotion]);

  useScrollAnimation(
    ({ isDesktop }) => {
      const root = rootRef.current;
      if (!root) return;
      const scrollerOption = scroller ?? undefined;
      const headingStart = isDesktop ? "top 85%" : "top 90%";

      gsap.utils.toArray<HTMLElement>("[data-reveal-card]", root).forEach((card) => {
        const media = card.querySelector<HTMLElement>("[data-reveal-image]");
        const copy = card.querySelector<HTMLElement>("[data-reveal-copy]");
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            scroller: scrollerOption,
            start: "top 82%",
            end: "top 42%",
            toggleActions: "play none none reverse",
          },
        });
        if (media) {
          timeline.fromTo(
            media,
            { clipPath: "inset(12% 0 12% 0)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "power4.out" },
            0,
          );
          const image = media.querySelector("img");
          if (image) {
            timeline.fromTo(image, { scale: 1.08 }, { scale: 1, duration: 1.2, ease: "power3.out" }, 0);
          }
        }
        if (copy) {
          timeline.fromTo(
            copy,
            { autoAlpha: 0, y: 34 },
            { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" },
            0.16,
          );
        }
      });

      gsap.utils.toArray<HTMLElement>("[data-fill-heading]", root).forEach((heading) => {
        revealFillHeading(heading, { trigger: heading, scroller: scrollerOption });
      });

      gsap.utils.toArray<HTMLElement>("[data-copy-reveal]", root).forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 28, filter: "blur(3px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              scroller: scrollerOption,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-secondary-reveal]", root).forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 26, filter: "blur(3px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              scroller: scrollerOption,
              start: "top 86%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      // Reversible word-by-word colour fill (scrubbed), matching the reference's
      // "A vehicle should say something before it moves..." block.
      gsap.utils.toArray<HTMLElement>("[data-color-reveal]", root).forEach((block) => {
        const words = gsap.utils.toArray<HTMLElement>("[data-word]", block);
        gsap.fromTo(
          words,
          { color: REST },
          {
            color: (_, word: HTMLElement) => (word.classList.contains("is-accent") ? ACCENT : REVEALED),
            duration: 1,
            stagger: Math.min(0.1, 1.1 / Math.max(words.length - 1, 1)),
            ease: "none",
            scrollTrigger: {
              trigger: block,
              scroller: scrollerOption,
              start: "top 82%",
              end: "bottom 42%",
              scrub: 0.4,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax-image]", root).forEach((image) => {
        gsap.fromTo(
          image,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: image.parentElement,
              scroller: scrollerOption,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.45,
            },
          },
        );
      });

      const stockHero = root.querySelector<HTMLElement>("[data-stock-hero]");
      const stockHeroImage = root.querySelector<HTMLElement>("[data-stock-hero-image]");
      const stockHeroCopy = root.querySelector<HTMLElement>("[data-stock-hero-copy]");
      if (stockHero && stockHeroImage) {
        gsap.fromTo(
          stockHeroImage,
          { yPercent: -7, scale: 1.06 },
          {
            yPercent: 9,
            scale: 1.015,
            ease: "none",
            scrollTrigger: {
              trigger: stockHero,
              scroller: scrollerOption,
              start: "top top",
              end: "bottom top",
              scrub: 0.55,
            },
          },
        );
      }
      if (stockHero && stockHeroCopy) {
        gsap.to(stockHeroCopy, {
          autoAlpha: 0,
          yPercent: -18,
          ease: "none",
          scrollTrigger: {
            trigger: stockHero,
            scroller: scrollerOption,
            start: "55% top",
            end: "bottom top",
            scrub: 0.45,
          },
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-stock-panel]", root).forEach((panel) => {
        const image = panel.querySelector<HTMLElement>("[data-stock-image]");
        const copy = panel.querySelector<HTMLElement>("[data-stock-copy]");

        gsap.fromTo(
          panel,
          {
            clipPath: isDesktop
              ? "polygon(0 14%, 100% 0, 100% 100%, 0 100%)"
              : "polygon(0 7%, 100% 0, 100% 100%, 0 100%)",
          },
          {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              scroller: scrollerOption,
              start: "top bottom",
              end: isDesktop ? "top top" : "top 18%",
              scrub: isDesktop ? 0.5 : 0.35,
            },
          },
        );

        if (image) {
          gsap.fromTo(
            image,
            { yPercent: isDesktop ? -22 : -8, scale: isDesktop ? 1.1 : 1.06 },
            {
              yPercent: isDesktop ? 22 : 8,
              scale: 1.015,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                scroller: scrollerOption,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
              },
            },
          );
        }
        if (copy) {
          gsap.fromTo(
            copy,
            { autoAlpha: FILL_REST_ALPHA, y: isDesktop ? 72 : 42 },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                scroller: scrollerOption,
                start: "top 82%",
                end: "top 34%",
                scrub: 0.45,
              },
            },
          );
        }
      });

      const stockList = root.querySelector<HTMLElement>("[data-stock-list]");
      const stockPanels = stockList
        ? gsap.utils.toArray<HTMLElement>("[data-stock-panel]", stockList)
        : [];
      stockPanels.forEach((panel, index) => {
        const copy = panel.querySelector<HTMLElement>("[data-stock-copy]");
        const exitTrigger = stockPanels[index + 1] ?? root.querySelector<HTMLElement>(".page-footer");
        if (!copy || !exitTrigger) return;

        gsap.to(copy, {
          autoAlpha: 0,
          y: isDesktop ? -64 : -36,
          ease: "none",
          scrollTrigger: {
            trigger: exitTrigger,
            scroller: scrollerOption,
            start: "top 96%",
            end: "top 58%",
            scrub: 0.35,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(".contact-field", root).forEach((field, index) => {
        gsap.fromTo(
          field,
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            delay: index * 0.025,
            ease: "power3.out",
            scrollTrigger: {
              trigger: field,
              scroller: scrollerOption,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    {
      scope: rootRef,
      key: "page-motion:" + (scroller ? "scroller" : "document"),
      disabled: reducedMotion,
    },
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(frame);
  }, [scroller]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}