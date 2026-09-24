import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import { ColorRevealText, PageMotion, RevealHeading } from "@/components/PageMotion";
import { PageFooter } from "@/components/PageFooter";

export const metadata: Metadata = {
  title: "Contacto | AWAR Motorworks",
  description: "Inicia un proyecto local de performance, tuning, suspensión, estética o detailing con AWAR.",
};

export default function ContactPage() {
  return (
    <main id="top" className="internal-page contact-page">
      <PageMotion className="internal-page__motion">
        <section className="contact-hero">
          <div className="contact-hero__copy">
            <p data-hero-copy>AWAR / Nuevo proyecto</p>
            <h1 aria-label="Hablemos de tu auto">
              <span className="title-mask"><span data-hero-line>Hablemos</span></span>
              <span className="title-mask"><span data-hero-line>de tu auto</span></span>
            </h1>
            <p data-hero-copy>Cuéntanos qué quieres sentir, corregir o transformar. Empezamos por entender el auto y su uso.</p>
          </div>
          <div className="contact-hero__media" data-reveal-image>
            <Image
              src="/media/fcdbdf14cba64b77f457e40c415f08366cd05043-2880x3600__66e6fc0f.jpg"
              alt="Trabajo de precisión en un interior automotriz"
              fill
              loading="eager"
              sizes="(max-width: 900px) 100vw, 48vw"
            />
          </div>
        </section>

        <section className="contact-intro">
          <span data-secondary-reveal>Formulario local / Sin envío</span>
          <ColorRevealText accents={["proyecto", "precisión"]}>
            Comparte los datos esenciales de tu proyecto. La conversación comienza con claridad y continúa con precisión.
          </ColorRevealText>
        </section>

        <section id="form" className="contact-form-section">
          <div className="contact-form-section__heading" data-secondary-reveal>
            <span>01 / Información inicial</span>
            <RevealHeading>Inicia tu proyecto</RevealHeading>
            <p data-copy-reveal>Esta versión es únicamente UX local. No existe conexión con backend y ningún dato sale del navegador.</p>
          </div>
          <ContactForm />
        </section>

        <PageFooter />
      </PageMotion>
    </main>
  );
}
