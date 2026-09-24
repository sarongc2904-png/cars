import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AnimatedLink } from "@/components/AnimatedLink";
import { ColorRevealText, PageMotion } from "@/components/PageMotion";
import { PageFooter } from "@/components/PageFooter";
import { STOCK_BASE_PATH, getStock, getStockItem } from "@/lib/data";

const STATUS_LABELS = {
  available: "Disponible",
  "coming-soon": "Próximamente",
  reserved: "Reservado",
} as const;

export async function generateStaticParams() {
  const stock = await getStock();
  return stock.map((vehicle) => ({ slug: vehicle.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getStockItem(slug);
  return { title: vehicle ? vehicle.model + " | Disponibles AWAR" : "Vehículo | AWAR" };
}

/*
 * Stock detail route.
 *
 * The reference serves this as `/stock/fa003/` (note the trailing slash, from
 * `buildHref(base, slug)`), keeps the SAME card component and data shape as the
 * build cards, and carries an extra "Next" block on BUILD pages only — there is
 * no next-build navigation on stock detail, which is why none is rendered here.
 */
export default async function StockDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = await getStockItem(slug);
  if (!vehicle) notFound();

  const stock = await getStock();
  const others = stock.filter((item) => item.slug !== vehicle.slug);
  const index = stock.findIndex((item) => item.slug === vehicle.slug) + 1;

  return (
    <main id="top" className="internal-page stock-detail">
      <PageMotion>
        {/* Reuses the listing's own hero classes so the detail route inherits
            the established geometry instead of a parallel style block. */}
        <section className="internal-hero internal-hero--stock-detail" data-stock-hero>
          <Image
            src={vehicle.image}
            alt={vehicle.alt}
            fill
            loading="eager"
            sizes="100vw"
            data-stock-hero-image
          />
          <div className="internal-hero__shade" />
          <div className="internal-hero__content" data-stock-hero-copy>
            <p data-hero-copy>
              {vehicle.code} / {String(index).padStart(2, "0")} — {String(stock.length).padStart(2, "0")}
            </p>
            <h1 aria-label={vehicle.model}>
              <span className="title-mask">
                <span data-hero-line>{vehicle.model}</span>
              </span>
            </h1>
            <p data-hero-copy>{STATUS_LABELS[vehicle.status]}</p>
          </div>
        </section>

        <section className="editorial-intro" data-secondary-reveal>
          <span>
            Código {vehicle.code}
            {vehicle.price ? " / " + vehicle.price : ""}
          </span>
          <ColorRevealText accents={[vehicle.model]}>{vehicle.description}</ColorRevealText>
          <div className="stock-detail__actions">
            {vehicle.status === "available" ? (
              <AnimatedLink
                href={"/contact?vehicle=" + vehicle.slug}
                ariaLabel="Solicitar información sobre este vehículo"
              >
                Solicitar información
              </AnimatedLink>
            ) : (
              <AnimatedLink href="/contact" ariaLabel="Avisadme cuando esté disponible">
                Avisadme
              </AnimatedLink>
            )}
            <AnimatedLink href="/stock" ariaLabel="Volver al listado de disponibles">
              Volver a disponibles
            </AnimatedLink>
          </div>
        </section>

        {others.length ? (
          <section className="project-detail__intro" aria-label="Otros vehículos disponibles">
            <span>Otros disponibles</span>
            <ul className="stock-detail__list">
              {others.map((item) => (
                <li key={item.id}>
                  <AnimatedLink
                    href={STOCK_BASE_PATH + item.slug + "/"}
                    ariaLabel={"Ver la ficha de " + item.model}
                  >
                    {item.model}
                  </AnimatedLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <PageFooter />
      </PageMotion>
    </main>
  );
}