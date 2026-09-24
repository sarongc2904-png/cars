import { PageMotion } from "@/components/PageMotion";
import { PageFooter } from "@/components/PageFooter";

export function LegalPage({ title }: { title: string }) {
  return (
    <main id="top" className="internal-page legal-page">
      <PageMotion>
        <section className="legal-page__hero">
          <p data-hero-copy>AWAR / Información</p>
          <h1><span className="title-mask"><span data-hero-line>{title}</span></span></h1>
          <p data-hero-copy>Contenido provisional para desarrollo local. El documento definitivo deberá ser revisado antes de publicar.</p>
        </section>
        <PageFooter />
      </PageMotion>
    </main>
  );
}
