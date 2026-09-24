"use client";

/**
 * CTA link/button, tag chip and "back to top".
 *
 * The reference calls this component `Button` (module `124821`, styled
 * `135741`). It renders the label split into one `<span>` per character,
 * wrapped as `<><span>{chars}</span><aside /></>`, and takes
 * `aria-label = aria ?? label`.
 *
 * The character split is NOT two stacked text layers — see the long comment in
 * `app/controls.css` for the `text-shadow` ghost + `translateY(4em)` mechanism
 * and its per-character `0.02s` delays. The reference defines 25 `nth-child`
 * delay rules; all 25 are reproduced.
 *
 * The `<aside>` is a conic-gradient ring whose `--play-state` is flipped by an
 * IntersectionObserver, so the 4.5s `gradient-angle` animation only runs while
 * the control is actually on screen.
 *
 * The reference has no arrow icon on this control; the `↗` this project used
 * previously was removed because the reference's second visual layer is the
 * conic-gradient ring.
 */

import Link from "next/link";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { PROGRAMMATIC_SCROLL_DURATION, useScroll } from "@/lib/motion/scroll/scroll-context";
import { isModifiedClick } from "@/lib/motion/dom";

/** Reference: `"Back to Top".split("")`, spaces rendered as `\u00a0`. */
function splitCharacters(label: string): string[] {
  return Array.from(label).map((character) => (character === " " ? "\u00a0" : character));
}

/** The clipped span of per-character spans that produces the roll. */
function CtaLabel({ label }: { label: string }) {
  return (
    <span aria-hidden="true">
      {splitCharacters(label).map((character, index) => (
        <span key={character + "-" + index}>{character}</span>
      ))}
    </span>
  );
}

function labelFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(labelFromChildren).join("");
  return "";
}

/**
 * Runs the ring's `gradient-angle` animation only while on screen. The reference
 * toggles `--play-state` from an IntersectionObserver for the same reason.
 */
function useRingPlayState<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        element.style.setProperty("--play-state", entry?.isIntersecting ? "running" : "paused");
      },
      { rootMargin: "10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}

type AnimatedLinkProps = {
  href: string;
  children: ReactNode;
  /** Explicit accessible name; defaults to the visible label, as in the reference. */
  ariaLabel?: string;
  className?: string;
  /** Kept for compatibility with existing call sites; both map to the same CTA. */
  variant?: "text" | "button";
  isFullWidth?: boolean;
  /** Passed to the router so a View Transition type can be selected. */
  transitionTypes?: string[];
  onNavigate?: () => void;
};

export function AnimatedLink({
  href,
  children,
  ariaLabel,
  className = "",
  isFullWidth = false,
  transitionTypes,
  onNavigate,
}: AnimatedLinkProps) {
  const ringRef = useRingPlayState<HTMLAnchorElement>();
  const label = labelFromChildren(children);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(event)) return;
    onNavigate?.();
  };

  return (
    <Link
      ref={ringRef}
      href={href}
      className={["cta", isFullWidth ? "cta--full" : "", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel ?? (label || undefined)}
      transitionTypes={transitionTypes}
      onClick={handleClick}
    >
      <CtaLabel label={label} />
      <aside aria-hidden="true" />
    </Link>
  );
}

type PremiumButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  isFullWidth?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
};

export function PremiumButton({
  children,
  type = "button",
  className = "",
  disabled = false,
  isFullWidth = false,
  ariaLabel,
  onClick,
}: PremiumButtonProps) {
  const ringRef = useRingPlayState<HTMLButtonElement>();
  const label = labelFromChildren(children);

  return (
    <button
      ref={ringRef}
      type={type}
      className={["cta", isFullWidth ? "cta--full" : "", className].filter(Boolean).join(" ")}
      disabled={disabled}
      aria-label={ariaLabel ?? (label || undefined)}
      onClick={onClick}
    >
      <CtaLabel label={label} />
      <aside aria-hidden="true" />
    </button>
  );
}

/**
 * Reference `BackToTop`:
 *   `<button type="button" aria-label="Back to Top" onClick={() => lenis?.scrollTo(0, { duration: 1.2 })}>`
 * with the label split per character.
 */
export function BackToTop({ label = "Volver arriba" }: { label?: string }) {
  const { scrollTo } = useScroll();

  return (
    <button
      type="button"
      className="back-to-top"
      aria-label={label}
      onClick={() => scrollTo(0, { duration: PROGRAMMATIC_SCROLL_DURATION })}
    >
      <span aria-hidden="true">
        {splitCharacters(label).map((character, index) => (
          <span key={character + "-" + index}>{character}</span>
        ))}
      </span>
    </button>
  );
}

/** Reference `Tag` (module `88664`): `({ text, isLight })`. */
export function Tag({ text, isLight = false }: { text: string; isLight?: boolean }) {
  return <span className={"tag" + (isLight ? " tag--light" : "")}>{text}</span>;
}