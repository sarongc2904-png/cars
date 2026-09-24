import Image from "next/image";
import { AnimatedLink } from "@/components/AnimatedLink";
import { RevealHeading } from "@/components/PageMotion";

export function PageFooter() {
  return (
    <footer className="page-footer">
      <div className="page-footer__stage">
        <Image
          src="/media/c6f15b9448f9090f3c7d9f0b5fab4e3cbc8e7284-2880x1800__8635803c.jpg"
          alt="Vehículos de alto rendimiento en un entorno oscuro"
          fill
          sizes="100vw"
        />
        <div className="page-footer__shade" />
        <div className="page-footer__copy" data-secondary-reveal>
          <p>¿Listo para</p>
          <RevealHeading>Llevarlo más lejos?</RevealHeading>
          <AnimatedLink href="/contact" variant="button">Iniciar proyecto</AnimatedLink>
        </div>
      </div>
      <div className="page-footer__bottom">
        <a className="brand footer-brand" href="/" aria-label="AWAR, inicio">
          <span className="brand-mark" aria-hidden="true" /><span>AWAR</span>
        </a>
        <nav aria-label="Navegación del pie">
          <AnimatedLink href="/">Inicio</AnimatedLink>
          <AnimatedLink href="/builds">Proyectos</AnimatedLink>
          <AnimatedLink href="/stock">Disponibles</AnimatedLink>
          <AnimatedLink href="/contact">Contacto</AnimatedLink>
        </nav>
        <nav aria-label="Información legal">
          <AnimatedLink href="/privacy">Privacidad</AnimatedLink>
          <AnimatedLink href="/terms">Términos</AnimatedLink>
          <AnimatedLink href="/cookies">Cookies</AnimatedLink>
        </nav>
      </div>
    </footer>
  );
}
