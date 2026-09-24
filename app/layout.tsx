import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./editorial.css";
import "./scroll.css";
import "./menu.css";
import "./controls.css";
import { Header } from "@/components/Header";
import { MotionSystem } from "@/components/MotionSystem";
import { PageShell } from "@/components/motion/PageShell";
import { MenuProvider } from "@/lib/motion/menu-context";
import { ScrollProvider, ScrollRoot } from "@/lib/motion/scroll/scroll-context";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "AWAR Motorworks | Performance, Tuning y Detailing",
  description: "Taller mecánico premium especializado en performance, tuning, diagnóstico y detailing.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "96x96", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "AWAR Motorworks",
    description: "Mecánica premium, performance, tuning y detailing.",
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "AWAR Motorworks" }],
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0c0c0c",
  width: "device-width",
  initialScale: 1
};

/*
 * DOM order mirrors the reference exactly:
 *
 *   <body>
 *     <div id="page">              the element that shrinks (clip-path + scale)
 *       <div class="lenis">        the ONLY scroll container
 *         <div class="page-content">...routes...</div>
 *       </div>
 *     </div>
 *     <header>                     fixed, own view-transition group
 *
 * `ScrollProvider` owns the single Lenis instance and renders no markup, so it
 * can wrap the header and the loader too — both read scroll state. `ScrollRoot`
 * renders the scroller element itself, which must stay INSIDE `#page`, because
 * the reference's `#page { height: 100%; overflow: hidden }` wraps
 * `.lenis { height: 100dvh; overflow: auto }`.
 *
 * Route transitions are the browser's View Transitions API, driven natively by
 * Next's `transitionTypes` and the `::view-transition-*` rules in
 * `app/scroll.css`.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        <MenuProvider>
          <ScrollProvider>
            <PageShell>
              <ScrollRoot>{children}</ScrollRoot>
            </PageShell>
            <Header />
            <MotionSystem />
          </ScrollProvider>
        </MenuProvider>
      </body>
    </html>
  );
}