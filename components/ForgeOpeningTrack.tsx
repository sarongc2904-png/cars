"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedLink } from "@/components/AnimatedLink";
import { LOADER_COMPLETE_EVENT, isLoaderPending } from "@/lib/motion/dom";
import { revealFillHeading } from "@/lib/motion/reveal";
import { useScroll, useScrollScroller } from "@/lib/motion/scroll/scroll-context";

type AFManifest = {
  totalFrames: number;
  width: number;
  height: number;
};

type AFInstance = {
  loading: Promise<void>;
  manifest: AFManifest | null;
  process: ((frame: VideoFrame) => void | Promise<void>) | null;
  setFrame: (frame: number) => void;
  refresh: (frame?: number) => void;
  destroy: () => void;
};

type AFCtor = new (
  file: string,
  options: {
    process?: (frame: VideoFrame) => void | Promise<void>;
    hardwareAcceleration?: "prefer-hardware" | "prefer-software" | "no-preference";
  },
) => AFInstance;

const HERO_DESKTOP = "/sequences/hero-desktop.af";
const HERO_MOBILE = "/sequences/hero-mobile.af";
const INTRO_DESKTOP = "/sequences/intro-desktop.af";
const INTRO_MOBILE = "/sequences/intro-mobile.af";

const TITLE_WORD_GAP = 0.15;
const TITLE_WORD_REVEAL = 0.8;
const DESCRIPTION_LINE_GAP = 0.14;
const DESCRIPTION_LINE_REVEAL = 0.9;

const TRACK_SCROLL_VH = 140;
const APPROACH_SCROLL_VH = 100;
const APPROACH_HOLD_PX = 100;

const disciplines = [
  "Diagnóstico",
  "Performance",
  "Tuning",
  "Detailing",
  "Frenos",
  "Suspensión",
  "Electrónica",
  "Protección",
] as const;

let runtimePromise: Promise<void> | null = null;

function activeFrameCtor() {
  return (window as unknown as { ActiveFrame?: AFCtor }).ActiveFrame;
}

function ensureActiveFrameRuntime() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser runtime unavailable"));
  }

  if (activeFrameCtor()) return Promise.resolve();
  if (runtimePromise) return runtimePromise;

  runtimePromise = new Promise<void>((resolve, reject) => {
    const current = document.querySelector<HTMLScriptElement>(
      'script[data-active-frame-runtime="true"]',
    );

    if (current) {
      if (activeFrameCtor()) resolve();
      else {
        current.addEventListener("load", () => resolve(), { once: true });
        current.addEventListener(
          "error",
          () => reject(new Error("ActiveFrame runtime failed")),
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "/ActiveFrame.js";
    script.async = true;
    script.dataset.activeFrameRuntime = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("ActiveFrame runtime failed"));
    document.head.appendChild(script);
  });

  return runtimePromise;
}

function canUseActiveFrame() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "VideoDecoder" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function desktopViewport() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function setupCanvas(canvas: HTMLCanvasElement, host: HTMLElement) {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return null;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.imageSmoothingEnabled = true;

  return { context, width, height };
}

function drawCover(
  context: CanvasRenderingContext2D,
  frame: VideoFrame,
  width: number,
  height: number,
) {
  const frameWidth = frame.displayWidth || frame.codedWidth;
  const frameHeight = frame.displayHeight || frame.codedHeight;
  if (!frameWidth || !frameHeight) return;

  const scale = Math.max(width / frameWidth, height / frameHeight);
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;

  context.clearRect(0, 0, width, height);
  context.drawImage(
    frame as unknown as CanvasImageSource,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function staggeredProgress(
  progress: number,
  index: number,
  count: number,
  gap: number,
  duration: number,
) {
  if (!count || duration <= 0) return 0;
  return clamp01(
    (progress * ((count - 1) * gap + duration) - index * gap) / duration,
  );
}

function setWordsOrigin(container: HTMLElement, words: HTMLElement[]) {
  const rect = container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  words.forEach((word) => {
    const wordRect = word.getBoundingClientRect();
    gsap.set(word, {
      transformOrigin: `${centerX - wordRect.left}px ${centerY - wordRect.top}px`,
    });
  });
}

export function ForgeOpeningTrack() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroLayerRef = useRef<HTMLDivElement>(null);
  const heroCanvasHostRef = useRef<HTMLDivElement>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const introLayerRef = useRef<HTMLDivElement>(null);
  const introCanvasHostRef = useRef<HTMLDivElement>(null);
  const introCanvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const introHeadingRef = useRef<HTMLHeadingElement>(null);
  const approachTriggerRef = useRef<HTMLDivElement>(null);
  const approachPanelRef = useRef<HTMLDivElement>(null);

  const scroller = useScrollScroller();
  const { getScroll } = useScroll();
  const getScrollRef = useRef(getScroll);
  useEffect(() => {
    getScrollRef.current = getScroll;
  }, [getScroll]);

  const heroFrameRef = useRef<AFInstance | null>(null);
  const introFrameRef = useRef<AFInstance | null>(null);
  const heroFrameIndexRef = useRef(0);
  const introFrameIndexRef = useRef(0);
  const heroPlaybackRef = useRef<gsap.core.Tween | null>(null);
  const heroCompleteRef = useRef(false);

  useEffect(() => {
    if (!canUseActiveFrame()) {
      rootRef.current?.classList.add("is-fallback");
      return;
    }

    let disposed = false;
    let heroResize: ResizeObserver | null = null;
    let introResize: ResizeObserver | null = null;
    let pointerCleanup: (() => void) | null = null;
    let loaderCleanup: (() => void) | null = null;
    let heroInstance: AFInstance | null = null;
    let introInstance: AFInstance | null = null;

    const init = async () => {
      try {
        await ensureActiveFrameRuntime();

        const Ctor = activeFrameCtor();
        const heroHost = heroCanvasHostRef.current;
        const heroCanvas = heroCanvasRef.current;
        const introHost = introCanvasHostRef.current;
        const introCanvas = introCanvasRef.current;
        const stage = stageRef.current;

        if (
          disposed ||
          !Ctor ||
          !heroHost ||
          !heroCanvas ||
          !introHost ||
          !introCanvas ||
          !stage
        ) {
          return;
        }

        let heroDrawing = setupCanvas(heroCanvas, heroHost);
        let introDrawing = setupCanvas(introCanvas, introHost);
        if (!heroDrawing || !introDrawing) return;

        const hero = new Ctor(
          desktopViewport() ? HERO_DESKTOP : HERO_MOBILE,
          {
            hardwareAcceleration: "prefer-hardware",
            process: (frame) => {
              if (heroDrawing) {
                drawCover(
                  heroDrawing.context,
                  frame,
                  heroDrawing.width,
                  heroDrawing.height,
                );
                if (heroCanvasHostRef.current) {
                  heroCanvasHostRef.current.style.opacity = "1";
                }
                rootRef.current?.classList.add("hero-frame-ready");
              }
            },
          },
        );

        const intro = new Ctor(
          desktopViewport() ? INTRO_DESKTOP : INTRO_MOBILE,
          {
            hardwareAcceleration: "prefer-hardware",
            process: (frame) => {
              if (introDrawing) {
                drawCover(
                  introDrawing.context,
                  frame,
                  introDrawing.width,
                  introDrawing.height,
                );
                if (introCanvasHostRef.current) {
                  introCanvasHostRef.current.style.opacity = "1";
                }
                rootRef.current?.classList.add("intro-frame-ready");
              }
            },
          },
        );

        heroInstance = hero;
        introInstance = intro;

        await Promise.all([hero.loading, intro.loading]);
        if (disposed || !hero.manifest || !intro.manifest) return;

        heroFrameRef.current = hero;
        introFrameRef.current = intro;
        rootRef.current?.classList.add("has-active-frame");

        heroFrameIndexRef.current = 0;
        introFrameIndexRef.current = 0;
        hero.setFrame(0);
        intro.setFrame(0);

        const lastHeroFrame = Math.max(0, hero.manifest.totalFrames - 1);

        const startHeroPlayback = () => {
          if (
            disposed ||
            heroCompleteRef.current ||
            getScrollRef.current() > 2 ||
            heroPlaybackRef.current
          ) {
            return;
          }

          const state = { frame: 0 };

          heroPlaybackRef.current = gsap.to(state, {
            frame: lastHeroFrame,
            duration: 2,
            ease: "none",
            onUpdate: () => {
              const frame = Math.round(state.frame);
              if (frame === heroFrameIndexRef.current) return;
              heroFrameIndexRef.current = frame;
              hero.setFrame(frame);
            },
            onComplete: () => {
              heroCompleteRef.current = true;
              heroFrameIndexRef.current = lastHeroFrame;
              hero.setFrame(lastHeroFrame);
              hero.refresh(lastHeroFrame);
              heroPlaybackRef.current?.kill();
              heroPlaybackRef.current = null;
              rootRef.current?.classList.add("hero-playback-complete");
            },
          });
        };

        const onLoaderComplete = () => startHeroPlayback();

        if (isLoaderPending()) {
          window.addEventListener(
            LOADER_COMPLETE_EVENT,
            onLoaderComplete,
            { once: true },
          );
          loaderCleanup = () =>
            window.removeEventListener(
              LOADER_COMPLETE_EVENT,
              onLoaderComplete,
            );
        } else {
          startHeroPlayback();
        }

        heroResize = new ResizeObserver(() => {
          heroDrawing = setupCanvas(heroCanvas, heroHost);
          if (heroDrawing) hero.refresh(heroFrameIndexRef.current);
        });

        introResize = new ResizeObserver(() => {
          introDrawing = setupCanvas(introCanvas, introHost);
          if (introDrawing) intro.refresh(introFrameIndexRef.current);
        });

        heroResize.observe(heroHost);
        introResize.observe(introHost);

        if (
          desktopViewport() &&
          window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ) {
          const pointer = { x: 0, y: 0, strength: 0 };
          const apply = () => {
            if (!heroCompleteRef.current || getScrollRef.current() > 2) return;
            const x = pointer.x * pointer.strength;
            const y = pointer.y * pointer.strength;
            gsap.set(stage, {
              xPercent: 0.6 * x,
              yPercent: 0.6 * y,
              rotationY: -0.5 * x,
              rotationX: 0.5 * y,
              scale: 1 + 0.025 * pointer.strength,
              transformPerspective: 1200,
              transformOrigin: "50% 50%",
            });
          };

          const quickX = gsap.quickTo(pointer, "x", {
            duration: 0.7,
            ease: "power3.out",
            onUpdate: apply,
          });
          const quickY = gsap.quickTo(pointer, "y", {
            duration: 0.7,
            ease: "power3.out",
            onUpdate: apply,
          });
          const quickStrength = gsap.quickTo(pointer, "strength", {
            duration: 0.7,
            ease: "power3.out",
            onUpdate: apply,
          });

          const onPointerMove = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") return;
            quickX(
              gsap.utils.clamp(
                -1,
                1,
                (event.clientX / window.innerWidth) * 2 - 1,
              ),
            );
            quickY(
              gsap.utils.clamp(
                -1,
                1,
                (event.clientY / window.innerHeight) * 2 - 1,
              ),
            );
            quickStrength(1);
          };

          const resetPointer = () => {
            quickStrength(0);
            quickX(0);
            quickY(0);
          };

          window.addEventListener("pointermove", onPointerMove, {
            passive: true,
          });
          window.addEventListener("blur", resetPointer);
          document.documentElement.addEventListener(
            "pointerleave",
            resetPointer,
          );

          pointerCleanup = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("blur", resetPointer);
            document.documentElement.removeEventListener(
              "pointerleave",
              resetPointer,
            );
          };
        }
      } catch (error) {
        console.warn("Forge opening ActiveFrame unavailable:", error);
        heroInstance?.destroy();
        introInstance?.destroy();
        heroFrameRef.current = null;
        introFrameRef.current = null;
        rootRef.current?.classList.add("is-fallback");
      }
    };

    void init();

    return () => {
      disposed = true;
      loaderCleanup?.();
      pointerCleanup?.();
      heroResize?.disconnect();
      introResize?.disconnect();
      heroPlaybackRef.current?.kill();
      heroPlaybackRef.current = null;
      heroInstance?.destroy();
      introInstance?.destroy();
      heroFrameRef.current = null;
      introFrameRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = rootRef.current;
    const title = titleRef.current;
    const description = descriptionRef.current;
    const introHeading = introHeadingRef.current;
    const heroLayer = heroLayerRef.current;
    const introLayer = introLayerRef.current;
    const approachTrigger = approachTriggerRef.current;
    const approachPanel = approachPanelRef.current;

    if (
      !root ||
      !title ||
      !description ||
      !introHeading ||
      !heroLayer ||
      !introLayer ||
      !approachTrigger ||
      !approachPanel
    ) {
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;
    if (!scroller) return;

    const ctx = gsap.context(() => {
      const titleWords = gsap.utils.toArray<HTMLElement>(
        ".forge-opening-title-word",
        title,
      );
      const descriptionLines = gsap.utils.toArray<HTMLElement>(
        ".forge-opening-description-line",
        description,
      );
      const introWords = gsap.utils.toArray<HTMLElement>(
        ".forge-opening-intro-word",
        introHeading,
      );

      setWordsOrigin(title, titleWords);
      setWordsOrigin(introHeading, introWords);

      gsap.set(title, { autoAlpha: 1 });
      gsap.set(titleWords, {
        autoAlpha: 0,
        scale: 0,
        filter: "blur(8px)",
        display: "inline-block",
        verticalAlign: "top",
      });
      gsap.set(description, { autoAlpha: 1 });
      gsap.set(descriptionLines, {
        autoAlpha: 0,
        yPercent: 100,
        display: "block",
      });

      gsap.set(introHeading, { autoAlpha: 1 });
      gsap.set(introWords, {
        autoAlpha: 0,
        scale: 0,
        filter: "blur(8px)",
        display: "inline-block",
        verticalAlign: "top",
      });
      gsap.set(introLayer, { autoAlpha: 0 });

      const revealCopy = () => {
        setWordsOrigin(title, titleWords);

        gsap
          .timeline()
          .to(
            titleWords,
            {
              autoAlpha: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: TITLE_WORD_REVEAL,
              stagger: TITLE_WORD_GAP,
              ease: "power2.out",
            },
            0.75,
          )
          .to(
            descriptionLines,
            {
              autoAlpha: 1,
              yPercent: 0,
              duration: DESCRIPTION_LINE_REVEAL,
              stagger: DESCRIPTION_LINE_GAP,
              ease: "power3.out",
            },
            1,
          );
      };

      const onLoaderComplete = () => revealCopy();

      if (isLoaderPending()) {
        window.addEventListener(
          LOADER_COMPLETE_EVENT,
          onLoaderComplete,
          { once: true },
        );
      } else {
        revealCopy();
      }

      // The approach panel's heading gets the same letter sweep as every other
      // heading on the site.
      const approachTopHeading = root.querySelector<HTMLElement>(".original-approach-top h2");
      if (approachTopHeading) {
        revealFillHeading(approachTopHeading, { trigger: approachTopHeading, scroller });
      }

      const track = ScrollTrigger.create({
        scroller: scroller ?? undefined,
        trigger: root,
        start: "top top",
        end: () => `+=${window.innerHeight * 1.4}`,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const trackProgress = self.progress;

          if (trackProgress > 0.002) {
            heroPlaybackRef.current?.pause();
          }

          const heroTextProgress = clamp01(
            trackProgress / (0.6 / 1.4),
          );

          titleWords.forEach((word, index) => {
            const local = staggeredProgress(
              heroTextProgress,
              titleWords.length - 1 - index,
              titleWords.length,
              0.083,
              0.667,
            );
            const eased = local * local;

            gsap.set(word, {
              autoAlpha: 1 - eased,
              scale: 1 + eased,
              filter: `blur(${8 * eased}px)`,
            });
          });

          descriptionLines.forEach((line, index) => {
            const local = staggeredProgress(
              heroTextProgress,
              index,
              descriptionLines.length,
              DESCRIPTION_LINE_GAP,
              DESCRIPTION_LINE_REVEAL,
            );

            gsap.set(line, {
              autoAlpha: 1 - local,
              yPercent: 100 * local,
            });
          });

          const introProgress = clamp01(
            trackProgress / (2 / 2.4),
          );
          const introOutro =
            introProgress <= 0.5
              ? 0
              : clamp01((introProgress - 0.5) / 0.5);

          const intro = introFrameRef.current;
          if (intro?.manifest) {
            const frame = Math.round(
              introProgress * (intro.manifest.totalFrames - 1),
            );
            if (frame !== introFrameIndexRef.current) {
              introFrameIndexRef.current = frame;
              intro.setFrame(frame);
            }
          }

          const transition = clamp01(trackProgress / 0.025);
          gsap.set(heroLayer, { autoAlpha: 1 - transition });
          gsap.set(introLayer, { autoAlpha: transition });

          const introCanvas = introCanvasRef.current;
          if (introCanvas) {
            gsap.set(introCanvas, {
              autoAlpha: 1 - introOutro,
            });
          }

          introWords.forEach((word, index) => {
            const local = staggeredProgress(
              introOutro,
              index,
              introWords.length,
              TITLE_WORD_GAP,
              TITLE_WORD_REVEAL,
            );

            gsap.set(word, {
              autoAlpha: local,
              scale: local,
              filter: `blur(${(1 - local) * 8}px)`,
            });
          });
        },
      });

      const approach = ScrollTrigger.create({
        scroller: scroller ?? undefined,
        trigger: approachTrigger,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const remaining = 1 - progress;

          gsap.set(approachPanel, {
            y: -remaining * window.innerHeight,
            scale: 1 + 0.2 * remaining,
            clipPath: `inset(${50 * remaining}% ${50 * remaining}%)`,
          });

          const headingWrap =
            introHeading.parentElement as HTMLElement | null;
          if (headingWrap) {
            const fade = clamp01(progress / 0.7);
            gsap.set(headingWrap, {
              autoAlpha: 1 - fade,
              filter: `blur(${12 * fade}px)`,
            });
          }
        },
      });

      const onResize = () => {
        setWordsOrigin(title, titleWords);
        setWordsOrigin(introHeading, introWords);
      };

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener(
          LOADER_COMPLETE_EVENT,
          onLoaderComplete,
        );
        window.removeEventListener("resize", onResize);
        track.kill();
        approach.kill();
      };
    }, root);

    return () => ctx.revert();
  }, [scroller]);

  return (
    <section
      ref={rootRef}
      className="forge-opening-track"
      style={{
        position: "relative",
        zIndex: 4,
        height: "calc(340dvh + 100px)",
        minHeight: "calc(340dvh + 100px)",
        background: "#000",
      }}
    >
      <div
        ref={stageRef}
        className="forge-opening-stage"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          width: "100%",
          height: "100dvh",
          overflow: "hidden",
          background: "#000",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          ref={heroLayerRef}
          className="forge-opening-layer forge-opening-hero-layer"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100dvh",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <Image
            className="forge-opening-fallback"
            src="/media/ca1704ba19e7015f94cf5ccb51d5f3db32fd3d96-2880x1868__66e6fc0f.jpg"
            alt="Colección de vehículos de alto rendimiento"
            fill
            preload
            sizes="100vw"
            style={{
              objectFit: "cover",
              objectPosition: "center",
              opacity: 1,
              visibility: "visible",
              zIndex: 0,
            }}
          />
          <div
            ref={heroCanvasHostRef}
            className="forge-opening-canvas-host"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
              opacity: 0,
              transition: "opacity 180ms linear",
            }}
          >
            <canvas ref={heroCanvasRef} />
          </div>

          <div
            className="forge-opening-hero-copy"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              color: "#f2f1ed",
            }}
          >
            <h1
              ref={titleRef}
              className="forge-opening-title"
            >
              <span className="forge-opening-title-word">Rendimiento</span>
              <br className="forge-opening-title-break" />{" "}
              <span className="forge-opening-title-word">sin</span>{" "}
              <span className="forge-opening-title-word">concesiones</span>
            </h1>

            <p
              ref={descriptionRef}
              className="forge-opening-description"
            >
              <span
                className="forge-opening-description-line"
                style={{ display: "block", overflow: "hidden" }}
              >
                Mecánica premium, tuning y puesta a punto,
              </span>
              <span
                className="forge-opening-description-line"
                style={{ display: "block", overflow: "hidden" }}
              >
                ejecutados con precisión de taller.
              </span>
            </p>
          </div>
        </div>

        <div
          ref={introLayerRef}
          className="forge-opening-layer forge-opening-intro-layer"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100dvh",
            overflow: "hidden",
            zIndex: 3,
            opacity: 0,
          }}
        >
          <div
            ref={introCanvasHostRef}
            className="forge-opening-canvas-host"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              transition: "opacity 180ms linear",
            }}
          >
            <canvas ref={introCanvasRef} />
          </div>

          <div
            className="forge-opening-intro-copy"
          >
            <h2
              ref={introHeadingRef}
            >
              <span className="forge-opening-intro-word">No</span>{" "}
              <span className="forge-opening-intro-word">solo</span>{" "}
              <span className="forge-opening-intro-word">sumamos</span>{" "}
              <span className="forge-opening-intro-word">potencia</span>
              <br />
              <span className="forge-opening-intro-word">afinamos</span>{" "}
              <span className="forge-opening-intro-word">cómo</span>{" "}
              <span className="forge-opening-intro-word">se</span>{" "}
              <span className="forge-opening-intro-word">siente</span>
            </h2>
          </div>
        </div>
      </div>

      <div
        className="forge-opening-track-spacer"
        aria-hidden="true"
      />

      <div
        ref={approachTriggerRef}
        className="forge-opening-approach-trigger"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "140dvh",
          left: 0,
          width: 1,
          height: "100dvh",
          pointerEvents: "none",
        }}
      />

      <div
        className="forge-opening-approach-holder"
        style={{
          position: "absolute",
          zIndex: 2,
          top: "240dvh",
          left: 0,
          width: "100%",
          height: "calc(100dvh + 100px)",
        }}
      >
        <section
          id="approach"
          ref={approachPanelRef}
          className="original-approach-panel forge-opening-approach-panel"
        >
          <div className="original-approach-bg">
            <Image
              src="/media/fcdbdf14cba64b77f457e40c415f08366cd05043-2880x3600__66e6fc0f.jpg"
              alt="Trabajo de precisión en un interior automotriz"
              fill
              sizes="100vw"
            />
          </div>
          <div className="original-approach-shade" />

          <div className="original-approach-top">
            <h2>Del diagnóstico a la entrega</h2>
          </div>

          <div className="original-approach-bottom">
            <div
              className="original-logo-marquee"
              aria-label="Especialidades del taller"
            >
              <div className="original-logo-track">
                {[...disciplines, ...disciplines].map(
                  (label, index) => (
                    <span
                      className="original-logo-item original-capability-item"
                      key={`${label}-opening-${index}`}
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="original-approach-copy">
              <p>
                Cada ajuste parte de una medición real. Motor, chasis,
                estética y uso diario deben funcionar como un solo sistema.
              </p>
              <AnimatedLink className="original-text-link" href="/contact">Agenda tu diagnóstico</AnimatedLink>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
