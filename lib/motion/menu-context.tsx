"use client";

/**
 * Menu state shared between the header (which owns the toggle) and the page
 * shell (which shrinks).
 *
 * The reference splits "the menu is open" into three distinct states — see the
 * `PageWrapper` evidence in `components/motion/PageShell.tsx`:
 *
 *   menuOpen    user intent: the menu has been requested
 *   menuReady   the menu UI exists and is warm (the reference lazy-mounts it at
 *               idle so nothing has to load on click)
 *   menuVisible the shrink transition has actually completed
 *
 * `isShrunk` (=== `menuOpen && menuReady`) is what drives the clip-path/scale;
 * `menuVisible` drives no CSS in the reference — it is a consumer "hold" flag.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export type MenuContextValue = {
  /** User intent: the menu has been opened. */
  menuOpen: boolean;
  /** The menu UI is mounted and ready to animate. */
  menuReady: boolean;
  /** The open transition finished; sibling animations may start. */
  menuVisible: boolean;
  /** `menuOpen && menuReady` — drives the `#page` shrink. */
  isShrunk: boolean;
  /** `prefers-reduced-motion: reduce`. */
  reducedMotion: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  /** Called by the page shell once the shrink transition has settled. */
  setMenuVisible: (visible: boolean) => void;
};

export const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  const openMenu = useCallback(() => {
    setMenuReady(true);
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => {
      if (!open) setMenuReady(true);
      return !open;
    });
  }, []);

  /*
   * Escape closes the menu.
   *
   * CONFIRMED NEGATIVE in the reference: its only `keydown` listener is a debug
   * grid toggle, and the closed overlay relies on `inert` instead. This is a
   * deliberate accessibility addition for this project, declared as such in the
   * deliverable report.
   */
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  const value = useMemo<MenuContextValue>(
    () => ({
      menuOpen,
      menuReady,
      menuVisible,
      isShrunk: menuOpen && menuReady,
      reducedMotion,
      openMenu,
      closeMenu,
      toggleMenu,
      setMenuVisible,
    }),
    [menuOpen, menuReady, menuVisible, reducedMotion, openMenu, closeMenu, toggleMenu],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used inside <MenuProvider>");
  }
  return context;
}