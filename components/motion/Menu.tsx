"use client";

/**
 * The Navigate/Close trigger and the fullscreen menu overlay.
 *
 * Reference evidence:
 *  - Trigger + icon: `3dca2icpnmf5w.js` (`sc-cf9722b1-3`, `sc-cf9722b1-4`).
 *    The icon is NOT an SVG: it is `<i>` with three `<span>` bars.
 *    `rotate: ${270 * !!isOpen}deg` on the container, bars at `-45deg`/`+45deg`,
 *    middle bar `scale: 0 1`. See `app/menu.css` for the transcription.
 *  - Label swap is pure CSS (`bezzy3`, 1s): the outgoing label slides to
 *    `translateY(-100%) skewY(3deg)` while the incoming returns to
 *    `translateY(0%) skewY(0deg)`.
 *  - Overlay: recovered chunk `1o6f75j2bh32_.js` — burgundy `--brand-bc3`
 *    backdrop with a 0.2 black wash, container opacity/scale/blur entrance with
 *    a 0.15s delay, per-letter `0.02 x index` delays, sibling dimming to
 *    `opacity: 0.2` (that is the overlay's real value; 0.4 is used for the
 *    social links and the trigger label), `--movement: 1.5em` letter roll.
 *
 * Deliberate additions beyond the reference, required by this project's brief
 * and declared as such in the deliverable report:
 *  - `Escape` closes the menu. CONFIRMED NEGATIVE in the reference: its only
 *    `keydown` listener is a debug grid toggle.
 *  - Explicit focus management. The reference relies on `inert` alone.
 *  - Every link is a real `<Link>` firing a normal navigation, so the menu works
 *    with or without View Transition support.
 */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useMenu } from "@/lib/motion/menu-context";
import { isModifiedClick } from "@/lib/motion/dom";

export type MenuLink = { label: string; href: string; match: string };

type NavigationToggleProps = {
  /** `false` while the loader is still on screen. */
  revealed?: boolean;
};

export function NavigationToggle({ revealed = true }: NavigationToggleProps) {
  const { menuOpen, toggleMenu } = useMenu();

  return (
    <button
      type="button"
      className={"menu-toggle" + (revealed ? " is-revealed" : "")}
      onClick={toggleMenu}
      aria-expanded={menuOpen}
      aria-controls="site-menu"
      aria-label="Alternar menú"
      data-open={menuOpen ? "" : undefined}
    >
      <em className="menu-toggle__label" data-open={menuOpen ? "" : undefined}>
        <span data-slot="a">Navegar</span>
        <span data-slot="b">Cerrar</span>
      </em>
      <i className="menu-toggle__icon" aria-hidden="true" data-open={menuOpen ? "" : undefined}>
        <span />
        <span />
        <span />
      </i>
    </button>
  );
}

type MenuOverlayProps = {
  links: readonly MenuLink[];
  legal: readonly MenuLink[];
};

export function MenuOverlay({ links, legal }: MenuOverlayProps) {
  const { menuOpen, closeMenu } = useMenu();
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // The overlay must be inert while closed so its links are unreachable by
  // keyboard and screen readers. The reference does the same with `inert`.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (menuOpen) {
      overlay.removeAttribute("inert");
    } else {
      overlay.setAttribute("inert", "");
    }
  }, [menuOpen]);

  // Focus management (project addition — see the file header).
  useEffect(() => {
    if (!menuOpen) return;
    const frame = window.requestAnimationFrame(() => firstLinkRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen]);

  return (
    <div
      id="site-menu"
      ref={overlayRef}
      className={"site-menu" + (menuOpen ? " is-open" : "")}
      aria-hidden={menuOpen ? undefined : true}
      inert={!menuOpen}
    >
      <div className="site-menu__inner">
        <nav aria-label="Navegación principal">
          <ul className={"site-menu__list" + (menuOpen ? " is-open" : "")}>
            {links.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  ref={index === 0 ? firstLinkRef : undefined}
                  className="menu-link"
                  onClick={(event) => {
                    if (isModifiedClick(event)) return;
                    // Close the overlay as the navigation commits, so the
                    // shrink reverses over the incoming page.
                    closeMenu();
                  }}
                >
                  <span className="menu-link__letters" aria-hidden="true">
                    {splitLetters(link.label).map((letter, letterIndex) => (
                      <span className="menu-link__letter" key={link.href + "-" + letterIndex}>
                        {letter}
                      </span>
                    ))}
                  </span>
                  <span className="sr-only">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-menu__meta">
        <nav aria-label="Información legal">
          {legal.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(event) => {
                if (isModifiedClick(event)) return;
                closeMenu();
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function splitLetters(label: string): string[] {
  return Array.from(label).map((letter) => (letter === " " ? "\u00a0" : letter));
}