import type { Metadata } from "next";
import Image from "next/image";
import { AnimatedLink } from "@/components/AnimatedLink";
import { ColorRevealText, PageMotion, RevealHeading } from "@/components/PageMotion";
import { PageFooter } from "@/components/PageFooter";
import { projects } from "@/lib/demo-data";
import { NEXT_BUILD_TRANSITION } from "@/lib/motion/view-transitions";

export const metadata: Metadata = {
  title: "Proyectos | AWAR Motorworks",
  description: "Proyectos demo de performance, tuning, styling y protección desarrollados por AWAR.",
};

export default function BuildsPage() {
  return (
    <main id="top" className="internal-page">
      <PageMotion className="internal-page__motion">
        <section className="internal-hero internal-hero--builds">
          <Image
            src="/media/50184497f0c1b4f3ce1cdcdcfbd576ee4336f720-1520x2688__66e6fc0f.png"
            alt="Selección de proyectos AWAR"
            fill
            loading="eager"
            sizes="100vw"
          />
          <div className="internal-hero__shade" />
          <div className="internal-hero__content">
            <p data-hero-copy>AWAR / Archivo de trabajo</p>
            <h1 aria-label="Proyectos">
              <span className="title-mask"><span data-hero-line>Proyectos</span></span>
            </h1>
            <p data-hero-copy>Proyectos creados con intención, carácter y precisión.</p>
          </div>
        </section>

        <section className="editorial-intro">
          <span data-secondary-reveal>Proyectos demo / 001—003</span>
          <ColorRevealText accents={["intención", "precisión"]}>
            Cada preparación parte de una intención clara y termina cuando rendimiento, presencia y precisión hablan el mismo idioma.
          </ColorRevealText>
        </section>

        <section className="project-list" aria-label="Proyectos demo AWAR">
          {projects.map((project, index) => (
            <article className={`project-card project-card--${index % 2 ? "offset" : "wide"}`} data-reveal-card key={project.id}>
              <div className="project-card__media" data-reveal-image>
                <Image src={project.image} alt={project.alt} fill sizes="(max-width: 900px) 100vw, 72vw" />
                <span className="demo-badge">Demo</span>
              </div>
              <div className="project-card__copy" data-reveal-copy>
                <div><span>{project.code}</span><span>{project.category}</span></div>
                <RevealHeading>{project.name}</RevealHeading>
                <p data-copy-reveal>{project.description}</p>
                <AnimatedLink href={`/builds/${project.slug}`} transitionTypes={[NEXT_BUILD_TRANSITION]}>Ver proyecto</AnimatedLink>
              </div>
            </article>
          ))}
        </section>

        <PageFooter />
      </PageMotion>
    </main>
  );
}
