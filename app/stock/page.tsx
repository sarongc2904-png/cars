import type { Metadata } from "next";
import Image from "next/image";
import { AnimatedLink, PremiumButton } from "@/components/AnimatedLink";
import { ColorRevealText, PageMotion, RevealHeading } from "@/components/PageMotion";
import { PageFooter } from "@/components/PageFooter";
import { StockWebGLPlane } from "@/components/StockWebGLPlane";
import { STOCK_BASE_PATH } from "@/lib/data";
import { vehicles } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Disponibles | AWAR Motorworks",
  description: "Inventario demo de vehículos disponibles y próximas configuraciones AWAR.",
};

const statusLabels = {
  available: "Disponible",
  "coming-soon": "Próximamente",
  reserved: "Reservado",
} as const;

export default function StockPage() {
  return (
    <main id="top" className="internal-page">
      <PageMotion className="internal-page__motion">
        <section className="internal-hero internal-hero--stock" data-stock-hero>
          <Image
            src="/media/355c0715f1090f3eac38518ae07dd22b6c0c9c2e-1320x2388__66e6fc0f.jpg"
            alt="Vehículos preparados por AWAR"
            fill
            loading="eager"
            sizes="100vw"
            data-stock-hero-image
          />
          <div className="internal-hero__shade" />
          <div className="internal-hero__content" data-stock-hero-copy>
            <p data-hero-copy>Inventario demo</p>
            <h1 aria-label="Disponibles">
              <span className="title-mask"><span data-hero-line>Disponibles</span></span>
            </h1>
            <p data-hero-copy>Unidades y configuraciones preparadas para continuar su evolución.</p>
          </div>
        </section>

        <section className="editorial-intro">
          <span data-secondary-reveal>Estado actualizado / Demo local</span>
          <ColorRevealText accents={["medir", "decidir"]}>
            Antes de intervenir hay que medir, decidir y construir una ruta coherente para cada vehículo.
          </ColorRevealText>
        </section>

        <section className="stock-list" aria-label="Inventario demo AWAR" data-stock-list>
          <StockWebGLPlane images={vehicles.map((vehicle) => vehicle.image)} />
          {vehicles.map((vehicle, index) => (
            <article className={`stock-card stock-card--${index % 2 ? "reverse" : "default"}`} data-stock-panel key={vehicle.id}>
              <div className="stock-card__media">
                <Image src={vehicle.image} alt={vehicle.alt} fill sizes="100vw" data-stock-image />
                <span className="demo-badge">Demo</span>
              </div>
              <div className="stock-card__copy" data-stock-copy>
                <div className="stock-card__meta"><span>{vehicle.code}</span><span>{statusLabels[vehicle.status]}</span></div>
                <RevealHeading>{vehicle.model}</RevealHeading>
                <p data-copy-reveal>{vehicle.description}</p>
                <div className="stock-card__actions">
                  {vehicle.status === "available" ? (
                    <AnimatedLink href={`/contact?vehicle=${vehicle.slug}`} ariaLabel="Solicitar información sobre este vehículo">Solicitar información</AnimatedLink>
                  ) : (
                    <PremiumButton disabled>Información en preparación</PremiumButton>
                  )}
                  <AnimatedLink href={`${STOCK_BASE_PATH}${vehicle.slug}/`} ariaLabel={`Ver la ficha de ${vehicle.model}`}>
                    Ver ficha
                  </AnimatedLink>
                </div>
              </div>
            </article>
          ))}
        </section>

        <PageFooter />
      </PageMotion>
    </main>
  );
}
