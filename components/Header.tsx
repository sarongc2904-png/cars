"use client";

/**
 * Site header: brand, Navigate/Close trigger and the fullscreen menu overlay.
 *
 * Reference evidence:
 *  - The header is `position: fixed; z-index: 1000; inset: 0 0 auto` with
 *    `view-transition-name: site-header` (declared in `app/scroll.css`), so it
 *    has its own view-transition group and never slides with the page.
 *  - It sits OUTSIDE `#page`, which is what lets the page shrink underneath it.
 *  - The trigger is released from `visibility: hidden` once the loader finishes;
 *    that is `LOADER_COMPLETE_EVENT` from `lib/motion/dom`, emitted once by
 *    `MotionSystem`.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuOverlay, NavigationToggle, type MenuLink } from "@/components/motion/Menu";
import { isLoaderComplete, onLoaderComplete } from "@/lib/motion/dom";

const LINKS: readonly MenuLink[] = [
  { label: "Inicio", href: "/", match: "/" },
  { label: "Enfoque", href: "/#approach", match: "/#approach" },
  { label: "Servicios", href: "/#services", match: "/#services" },
  { label: "Proyectos", href: "/builds", match: "/builds" },
  { label: "Disponibles", href: "/stock", match: "/stock" },
  { label: "Contacto", href: "/contact", match: "/contact" },
];

const LEGAL: readonly MenuLink[] = [
  { label: "Privacidad", href: "/privacy", match: "/privacy" },
  { label: "Términos", href: "/terms", match: "/terms" },
  { label: "Cookies", href: "/cookies", match: "/cookies" },
];

export function Header() {
  const pathname = usePathname();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isLoaderComplete()) {
      setRevealed(true);
      return;
    }
    return onLoaderComplete(() => setRevealed(true));
  }, []);

  return (
    <header className="site-header">
      <Link className="brand site-brand" href="/" aria-label="AWAR Motorworks, inicio">
        <span className="brand-mark" aria-hidden="true" />
        <span>AWAR</span>
      </Link>

      <NavigationToggle revealed={revealed} />

      <MenuOverlay links={LINKS} legal={LEGAL} />

      {/*
        Screen-reader landmark for the same destinations, mirroring the
        reference's `.site-nav` (a visually-hidden accessibility utility there,
        not a visual bar — this project already uses `.site-nav` for the visible
        menu, hence the utility class).
      */}
      <nav className="sr-only" aria-label="Navegación del sitio">
        <ul>
          {LINKS.map((link) => (
            <li key={"sr-" + link.href}>
              <Link href={link.href} aria-current={isCurrent(pathname, link.match) ? "page" : undefined}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function isCurrent(pathname: string, match: string): boolean {
  if (match === "/") return pathname === "/";
  if (match.startsWith("/#")) return false;
  return pathname === match || pathname.startsWith(match + "/");
}