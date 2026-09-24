import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AnimatedLink } from "@/components/AnimatedLink";
import { PageMotion } from "@/components/PageMotion";
import { PageFooter } from "@/components/PageFooter";
import { ARCHIVE_BASE_PATH, getBuild, getBuilds, getNextBuild } from "@/lib/data";
import { NEXT_BUILD_TRANSITION } from "@/lib/motion/view-transitions";

export async function generateStaticParams() {
  const projects = await getBuilds();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getBuild(slug);
  return { title: project ? project.name + " | Proyectos AWAR" : "Proyecto | AWAR" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getBuild(slug);
  if (!project) notFound();

  /*
   * "Next build" navigation.
   *
   * The reference marks this link with the `next-build` View Transition type so
   * the outgoing page dims and lifts while the incoming one rises
   * (`html:active-view-transition-type(next-build)` in `app/scroll.css`). It
   * cycles back to the first build and is absent on stock detail pages.
   */
  const nextProject = await getNextBuild(slug);

  return (
    <main id="top" className="internal-page project-detail">
      <PageMotion>
        <section className="project-detail__hero">
          <Image src={project.image} alt={project.alt} fill loading="eager" sizes="100vw" />
          <div className="internal-hero__shade" />
          <div className="project-detail__copy">
            <p data-hero-copy>{project.code} / Demo</p>
            <h1 aria-label={project.name}>
              <span className="title-mask">
                <span data-hero-line>{project.name}</span>
              </span>
            </h1>
            <p data-hero-copy>{project.category}</p>
          </div>
        </section>

        <section className="project-detail__intro" data-secondary-reveal>
          <span>Proyecto conceptual AWAR</span>
          <p data-copy-reveal>
            {project.description} La ficha técnica y el alcance real podrán conectarse después mediante una
            fuente de datos.
          </p>
          <AnimatedLink href="/contact" ariaLabel="Iniciar un proyecto">
            Iniciar un proyecto
          </AnimatedLink>
        </section>

        {nextProject ? (
          <section className="project-detail__intro" aria-label={"Siguiente proyecto: " + nextProject.name}>
            <span>Siguiente proyecto</span>
            <h2 aria-label={nextProject.name}>
              <span className="title-mask">
                <span>{nextProject.name}</span>
              </span>
            </h2>
            <AnimatedLink
              href={ARCHIVE_BASE_PATH + nextProject.slug + "/"}
              ariaLabel={"Ver el siguiente proyecto: " + nextProject.name}
              transitionTypes={[NEXT_BUILD_TRANSITION]}
            >
              Ver proyecto
            </AnimatedLink>
          </section>
        ) : null}

        <PageFooter />
      </PageMotion>
    </main>
  );
}
