"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedLink } from "@/components/AnimatedLink";
import { useScroll, useScrollScroller } from "@/lib/motion/scroll/scroll-context";
import { revealFillHeading } from "@/lib/motion/reveal";

const approachItems = [
  {
    number: "01",
    title: "Punto de partida",
    copy: "Escuchamos lo que buscas, revisamos la base del vehículo y definimos prioridades. Cada proyecto empieza con una dirección clara, no con una lista de piezas.",
    image: "/media/96abbebcdb69e4b13c6ff0e23da7784139ad7da3-2880x2234__66e6fc0f.jpg",
  },
  {
    number: "02",
    title: "Desarrollo",
    copy: "Construimos el conjunto paso a paso. Motor, chasis, electrónica y estética se combinan para conseguir una respuesta coherente en calle y bajo exigencia.",
    image: "/media/235781052416262c147da92950dc76d4d07b86ff-2880x2174__66e6fc0f.jpg",
  },
  {
    number: "03",
    title: "Validación",
    copy: "Probamos, corregimos y afinamos antes de cerrar el proyecto. La entrega final debe sentirse sólida, predecible y lista para disfrutarse desde el primer recorrido.",
    image: "/media/5831f81c6ffab5f5c73abf162d4b92c1a5a8c271-2880x2218__66e6fc0f.jpg",
  },
] as const;

const services = [
  {
    title: "Performance",
    copy: "Desarrollamos mejoras de flujo, refrigeración y gestión para obtener una respuesta más contundente sin sacrificar consistencia ni confiabilidad.",
    image: "/media/dc00a94ef171fe44f6a793a72a3fa9216dd48f15-1254x1254__375bb3c4.png",
  },
  {
    title: "Tuning",
    copy: "La calibración se adapta al vehículo y a la forma en que quieres conducirlo. Respuesta, entrega y carácter se trabajan como una sola experiencia.",
    image: "/media/b98d6f2372e56bacbab8c532906ab79dd6a70581-1440x1800__375bb3c4.jpg",
  },
  {
    title: "Detailing",
    copy: "Acabados de alto nivel para que la presentación esté a la altura del trabajo técnico: corrección, protección y detalle con criterio automotriz.",
    image: "/media/eba4e5fd9c980edaf3a36249253d9db5bdd4755c-1440x1800__375bb3c4.jpg",
  },
  {
    title: "Frenos",
    copy: "Mejoramos frenada, modulación y resistencia térmica con componentes seleccionados para ofrecer confianza vuelta tras vuelta y también en uso diario.",
    image: "/media/1afaca4dbc32c6ef8e332bb05c144f56bef61599-1440x1800__375bb3c4.jpg",
  },
  {
    title: "Suspensión",
    copy: "Trabajamos altura, geometría y amortiguación para lograr más precisión y control manteniendo un comportamiento usable fuera del circuito.",
    image: "/media/e7030382683e44699afff394af92ae564c998004-1440x1800__375bb3c4.jpg",
  },
  {
    title: "Protección",
    copy: "Protegemos pintura, ópticas y superficies expuestas para conservar el acabado y facilitar el mantenimiento después de cada uso.",
    image: "/media/e2d7ada78adba232d267d00994ba320200322289-1440x1800__375bb3c4.jpg",
  },
] as const;

export function ForgeOriginalSections() {
  const rootRef = useRef<HTMLDivElement>(null);

  const scroller = useScrollScroller();
  const { getScroll } = useScroll();
  const getScrollRef = useRef(getScroll);
  useEffect(() => {
    getScrollRef.current = getScroll;
  }, [getScroll]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
    if (!scroller) return;

      const approachReveal = root.querySelector<HTMLElement>(".original-approach-reveal");
      const approachPanel = root.querySelector<HTMLElement>(".original-approach-panel");

      if (approachReveal && approachPanel) {
        gsap.set(approachPanel, {
          clipPath: desktop ? "inset(50% 50%)" : "inset(26% 18%)",
          y: desktop ? -window.innerHeight : -window.innerHeight * 0.3,
          scale: desktop ? 1.2 : 1.08,
        });

        gsap.to(approachPanel, {
          clipPath: "inset(0% 0%)",
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            scroller: scroller ?? undefined,
            trigger: approachReveal,
            start: "top bottom",
            end: "60% top",
            scrub: 0.65,
          },
        });
      }

      const approachBg = root.querySelector<HTMLElement>(".original-approach-bg img");
      if (approachBg) {
        gsap.fromTo(
          approachBg,
          { yPercent: 0 },
          {
            yPercent: 25,
            ease: "none",
            scrollTrigger: {
            scroller: scroller ?? undefined,
              trigger: ".original-approach-panel",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      const storySection = root.querySelector<HTMLElement>(".original-approach-stories");
      const storyTexts = gsap.utils.toArray<HTMLElement>(".original-approach-story", root);
      const squareImages = gsap.utils.toArray<HTMLElement>(".original-approach-square-image", root);
      const backdropImages = gsap.utils.toArray<HTMLElement>(".original-approach-backdrop-image", root);

      if (desktop && storySection && storyTexts.length) {
        gsap.set(squareImages, { clipPath: "inset(50%)" });
        gsap.set(squareImages[0], { clipPath: "inset(0%)" });
        gsap.set(backdropImages, { autoAlpha: 0 });
        gsap.set(backdropImages[0], { autoAlpha: 0.32 });

        storyTexts.forEach((story, index) => {
          if (index > 0 && squareImages[index]) {
            gsap.fromTo(
              squareImages[index],
              { clipPath: "inset(50%)" },
              {
                clipPath: "inset(0%)",
                ease: "none",
                scrollTrigger: {
            scroller: scroller ?? undefined,
                  trigger: story,
                  start: "top bottom",
                  end: "top top",
                  scrub: true,
                },
              },
            );
          }

          if (backdropImages[index]) {
            gsap.to(backdropImages[index], {
              autoAlpha: 0.32,
              ease: "none",
              scrollTrigger: {
            scroller: scroller ?? undefined,
                trigger: story,
                start: "top 70%",
                end: "top 20%",
                scrub: true,
              },
            });

            if (index < backdropImages.length - 1) {
              gsap.to(backdropImages[index], {
                autoAlpha: 0,
                ease: "none",
                scrollTrigger: {
            scroller: scroller ?? undefined,
                  trigger: story,
                  start: "bottom bottom",
                  end: "bottom top",
                  scrub: true,
                },
              });
            }
          }

          if (index < storyTexts.length - 1) {
            gsap.to(story, {
              autoAlpha: 0,
              ease: "none",
              scrollTrigger: {
            scroller: scroller ?? undefined,
                trigger: story,
                start: "center 30%",
                end: "bottom top",
                scrub: true,
              },
            });
          }
        });

        const squareStack = root.querySelector<HTMLElement>(".original-approach-square-stack");
        if (squareStack) {
          gsap.set(squareStack, { y: "-25dvh" });
          gsap.to(squareStack, {
            y: "25dvh",
            ease: "none",
            scrollTrigger: {
            scroller: scroller ?? undefined,
              trigger: storySection,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      } else {
        gsap.utils.toArray<HTMLElement>(".original-approach-story-mobile-image img", root).forEach((image) => {
          gsap.fromTo(
            image,
            { scale: 1.5 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
            scroller: scroller ?? undefined,
                trigger: image.parentElement,
                start: "top bottom",
                end: "center center",
                scrub: true,
              },
            },
          );
        });
      }

      /*
       * Concept headings ("Diagnóstico", "Calibración", "Entrega").
       *
       * The reference does NOT mask-rise these (nor "Identity / Insight /
       * Cohesion", the service names, "Previous Builds", "Available Stock"): it
       * paints the text with `background-clip: text` and scrubs a diagonal
       * gradient, so each word wipes from white-at-0.18 to full white as the
       * scroll advances. Measured on the live site (`--fill-pos: -16`,
       * `--fill-from: rgba(255,255,255,0.18)`), reproduced here per word.
       */
      gsap.utils.toArray<HTMLElement>(".original-approach-story h3", root).forEach((heading) => {
        revealFillHeading(heading, { trigger: heading, scroller });
      });
      gsap.utils.toArray<HTMLElement>(".original-service-row h3", root).forEach((heading) => {
        revealFillHeading(heading, { trigger: heading, scroller });
      });
      /*
       * Every remaining section heading uses the SAME letter sweep, so the whole
       * site reads consistently. These are the CTA bands, the builds intro and
       * the footer heading.
       */
      // Large editorial headings use a measured visual-line sweep.
      // The services statement is intentionally more separated so each line
      // completes visibly before the next one starts, matching the reference.
      const servicesStatement = root.querySelector<HTMLElement>(".original-services-heading");
      if (servicesStatement) {
        revealFillHeading(servicesStatement, {
          trigger: servicesStatement,
          scroller,
          start: "top 88%",
          end: "bottom 34%",
          stagger: 0.42,
        });
      }

      const fillSelectors = [
        ".original-cta-copy h2",
        ".original-builds-top em",
        ".original-builds-bottom h2",
        ".original-footer-copy h2",
        ".original-approach-top h2",
      ];
      fillSelectors.forEach((selector) => {
        gsap.utils.toArray<HTMLElement>(selector, root).forEach((heading) => {
          revealFillHeading(heading, {
            trigger: heading,
            scroller,
            start: "top 90%",
            end: "bottom 38%",
          });
        });
      });
      const servicesHero = root.querySelector<HTMLElement>(".original-services-hero");
      const servicesPortraitWrap = root.querySelector<HTMLElement>(".original-services-portrait-wrap");
      const servicesPortrait = root.querySelector<HTMLElement>(".original-services-portrait img");

      if (desktop && servicesHero && servicesPortraitWrap && servicesPortrait) {
        gsap.fromTo(
          servicesPortraitWrap,
          { yPercent: 50 },
          {
            yPercent: -50,
            ease: "none",
            scrollTrigger: {
            scroller: scroller ?? undefined,
              trigger: servicesHero,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
        gsap.fromTo(
          servicesPortrait,
          { yPercent: -25 },
          {
            yPercent: 25,
            ease: "none",
            scrollTrigger: {
            scroller: scroller ?? undefined,
              trigger: servicesHero,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      const listing = root.querySelector<HTMLElement>(".original-service-listing");
      const serviceRows = gsap.utils.toArray<HTMLElement>(".original-service-row", root);
      const serviceImages = gsap.utils.toArray<HTMLElement>(".original-service-image", root);
      const mobileServiceImages = gsap.utils.toArray<HTMLElement>(
        ".original-service-mobile-image",
        root,
      );

      if (listing && serviceRows.length) {
        if (desktop && serviceImages.length) {
          gsap.set(serviceImages, { clipPath: "inset(100% 0 0 0)" });
          gsap.set(serviceImages[0], { clipPath: "inset(0% 0 0 0)" });

          serviceRows.forEach((row, index) => {
            const image = serviceImages[index];
            if (index > 0 && image) {
              gsap.fromTo(
                image,
                { clipPath: "inset(100% 0 0 0)" },
                {
                  clipPath: "inset(0% 0 0 0)",
                  ease: "none",
                  scrollTrigger: {
            scroller: scroller ?? undefined,
                    trigger: row,
                    start: "top bottom",
                    end: "top top",
                    scrub: true,
                  },
                },
              );
            }

            const inner = image?.querySelector("img");
            if (inner) {
              gsap.fromTo(
                inner,
                { scale: 1.2 },
                {
                  scale: 1,
                  ease: "none",
                  scrollTrigger: {
            scroller: scroller ?? undefined,
                    trigger: row,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                  },
                },
              );
            }

            gsap.to(row, {
              autoAlpha: 0,
              ease: "none",
              scrollTrigger: {
            scroller: scroller ?? undefined,
                trigger: row,
                start: "center 30%",
                end: "bottom top",
                scrub: true,
              },
            });
          });

          gsap.fromTo(
            listing,
            { y: "-50dvh" },
            {
              y: 0,
              ease: "none",
              scrollTrigger: {
            scroller: scroller ?? undefined,
                trigger: listing,
                start: "top 150%",
                end: "top top",
                scrub: true,
              },
            },
          );
        } else if (!desktop) {
          mobileServiceImages.forEach((image) => {
            const inner = image.querySelector("img");
            if (!inner) return;
            gsap.fromTo(
              inner,
              { scale: 1.2, yPercent: -25 },
              {
                scale: 1.2,
                yPercent: 25,
                ease: "none",
                scrollTrigger: {
            scroller: scroller ?? undefined,
                  trigger: image,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          });
        }
      }

      const builds = root.querySelector<HTMLElement>(".original-builds-intro");
      const buildsTop = root.querySelector<HTMLElement>(".original-builds-top");
      const buildsCars = root.querySelector<HTMLElement>(".original-builds-cars");
      const leftCar = root.querySelector<HTMLElement>(".original-builds-car-left");
      const mainCar = root.querySelector<HTMLElement>(".original-builds-car-main");
      const rightCar = root.querySelector<HTMLElement>(".original-builds-car-right");
      const buildsBottom = root.querySelector<HTMLElement>(".original-builds-bottom");

      if (builds && buildsTop) {
        gsap.to(buildsTop, {
          scale: 0.75,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: {
            scroller: scroller ?? undefined,
            trigger: builds,
            start: "top top",
            end: "center top",
            scrub: true,
          },
        });
      }

      if (builds && buildsCars && leftCar && mainCar && rightCar) {
        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            scroller: scroller ?? undefined,
            trigger: builds,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.35,
          },
        })
          .fromTo(leftCar, {
            xPercent: -34,
            yPercent: 32,
            scale: 0.82,
          }, {
            xPercent: 6,
            yPercent: -58,
            scale: 1,
          }, 0)
          .fromTo(mainCar, {
            yPercent: 24,
            scale: 0.84,
          }, {
            yPercent: -14,
            scale: 1.04,
          }, 0.06)
          .fromTo(rightCar, {
            xPercent: 34,
            yPercent: 42,
            scale: 0.78,
          }, {
            xPercent: -4,
            yPercent: -48,
            scale: 0.98,
          }, 0.12);
      }

      if (desktop && buildsBottom) {
        gsap.from(buildsBottom, {
          y: "-50dvh",
          scale: 0.75,
          ease: "none",
          scrollTrigger: {
            scroller: scroller ?? undefined,
            trigger: buildsBottom,
            start: "top-=50% bottom",
            end: "center 60%",
            scrub: 0.2,
          },
        });
      }

      gsap.utils.toArray<HTMLElement>(".original-cta-band", root).forEach((band) => {
        const image = band.querySelector<HTMLElement>(".original-cta-media");
        const content = band.querySelector<HTMLElement>(".original-cta-copy");
        if (image) {
          gsap.fromTo(
            image,
            { yPercent: desktop ? -50 : -25 },
            {
              yPercent: desktop ? 50 : 25,
              ease: "none",
              scrollTrigger: {
            scroller: scroller ?? undefined,
                trigger: band,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }
        if (content) {
          gsap.to(content, {
            yPercent: -50,
            ease: "none",
            scrollTrigger: {
            scroller: scroller ?? undefined,
              trigger: band,
              start: "bottom bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      });

      const footerStage = root.querySelector<HTMLElement>(".original-footer-stage");
      const footerImage = footerStage?.querySelector<HTMLElement>("img");
      const footerShade = footerStage?.querySelector<HTMLElement>(".original-footer-shade");
      const footerCopy = footerStage?.querySelector<HTMLElement>(".original-footer-copy");

      if (footerStage && footerImage && footerShade && footerCopy) {
        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            scroller: scroller ?? undefined,
            trigger: footerStage,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.55,
          },
        })
          .fromTo(footerStage, {
            clipPath: desktop ? "inset(12% 7%)" : "inset(7% 0%)",
          }, {
            clipPath: "inset(0% 0%)",
          }, 0)
          .fromTo(footerImage, {
            scale: desktop ? 1.18 : 1.1,
            yPercent: desktop ? -9 : -4,
          }, {
            scale: 1,
            yPercent: desktop ? 9 : 4,
          }, 0)
          .fromTo(footerShade, { opacity: 0.82 }, { opacity: 0.56 }, 0.12)
          .fromTo(footerCopy, {
            yPercent: 28,
            autoAlpha: 0.25,
          }, {
            yPercent: -16,
            autoAlpha: 1,
          }, 0.1);
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [scroller]);

  return (
    <div ref={rootRef} className="original-home-sections">
      <section className="original-approach-stories">
        <div className="original-approach-backdrops" aria-hidden="true">
          {approachItems.map((item) => (
            <div className="original-approach-backdrop-image" key={item.title}>
              <Image src={item.image} alt="" fill sizes="100vw" />
            </div>
          ))}
        </div>

        <div className="original-approach-stories-grid">
          <aside className="original-approach-media-column">
            <div className="original-approach-square-stack">
              {approachItems.map((item) => (
                <div className="original-approach-square-image" key={item.title}>
                  <Image src={item.image} alt={item.title} fill sizes="33vw" />
                </div>
              ))}
            </div>
          </aside>

          <div className="original-approach-story-column">
            {approachItems.map((item) => (
              <section className="original-approach-story" key={item.title}>
                <em>{item.number} <span>/ 03</span></em>
                <div className="original-approach-story-mobile-image">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
                <AnimatedLink className="original-text-link" href="/contact">Habla con el taller</AnimatedLink>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="original-services-hero">
        <div className="original-services-portrait-wrap">
          <div className="original-services-portrait">
            <Image
              src="/media/b871664eefaff2cd66ec941b2c22d0097d3415e9-540x960__66e6fc0f.jpg"
              alt="Detalle técnico automotriz"
              fill
              sizes="25vw"
            />
          </div>
        </div>

        <div className="original-services-hero-grid">
          <h2 className="original-services-heading">
            No buscamos que el auto solo se vea distinto. Queremos que se sienta distinto.
          </h2>
          <div className="original-services-intro-copy">
            <p>Diseñamos cada preparación como un conjunto. Potencia, control, tacto y presencia se desarrollan alrededor del vehículo y de quien lo conduce.</p>
            <AnimatedLink className="original-text-link" href="/contact">Agenda tu diagnóstico</AnimatedLink>
          </div>
        </div>
      </section>

      <section className="original-service-listing">
        <div className="original-service-texture" aria-hidden="true" />

        <div className="original-service-grid">
          <div className="original-service-copy-column">
            {services.map((service) => (
              <section className="original-service-row" key={service.title}>
                <hgroup>
                  <p>Servicio</p>
                  <h3>{service.title}</h3>
                </hgroup>
                <p>{service.copy}</p>
                <AnimatedLink className="original-text-link" href="/contact">Explora esta mejora</AnimatedLink>
                <div className="original-service-mobile-image">
                  <Image src={service.image} alt={`Servicio de ${service.title}`} fill sizes="100vw" />
                </div>
              </section>
            ))}
          </div>

          <aside className="original-service-image-column">
            <div className="original-service-image-stack">
              {services.map((service) => (
                <div className="original-service-image" key={service.title}>
                  <Image src={service.image} alt={`Servicio de ${service.title}`} fill sizes="60vw" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="original-builds-intro">
        <div className="original-builds-pattern" aria-hidden="true" />
        <div className="original-builds-top">
          <em>Todo empieza</em>
        </div>

        <div className="original-builds-cars">
          <picture className="original-builds-car original-builds-car-left">
            <Image
              src="/media/2dda49076a88dd6a1282c3858f405d756ff734f6-708x1402__66e6fc0f.png"
              alt="Vehículo preparado, vista lateral izquierda"
              fill
              sizes="35vw"
            />
          </picture>
          <picture className="original-builds-car original-builds-car-main">
            <Image
              src="/media/135b8a261d63c2eacb7a981b7479b94c4a74998c-708x1402__66e6fc0f.png"
              alt="Vehículo de alto rendimiento, composición central"
              fill
              sizes="50vw"
            />
          </picture>
          <picture className="original-builds-car original-builds-car-right">
            <Image
              src="/media/22884fd5c804bb7a4a5545e22f9dd51b353c0b27-707x1402__66e6fc0f.png"
              alt="Vehículo preparado, vista lateral derecha"
              fill
              sizes="35vw"
            />
          </picture>
        </div>

        <div className="original-builds-bottom">
          <h2>Con una idea clara</h2>
          <p>El mejor proyecto no es el que acumula más piezas, sino el que consigue que cada modificación trabaje a favor del conjunto.</p>
        </div>
      </section>

      <section id="builds" className="original-cta-band original-previous-builds">
        <div className="original-cta-media">
          <Image
            src="/media/50184497f0c1b4f3ce1cdcdcfbd576ee4336f720-1520x2688__66e6fc0f.png"
            alt="Selección de proyectos automotrices terminados"
            fill
            sizes="100vw"
          />
        </div>
        <div className="original-cta-gradient" />
        <div className="original-cta-copy">
          <h2>Proyectos que hablan por sí solos</h2>
          <p>Vehículos desarrollados con una intención definida: mejorar sensaciones, presencia y desempeño sin perder coherencia.</p>
          <AnimatedLink className="original-text-link" href="/builds">Ver proyectos</AnimatedLink>
        </div>
      </section>

      <section id="stock" className="original-cta-band original-stock-band">
        <div className="original-cta-media">
          <Image
            src="/media/355c0715f1090f3eac38518ae07dd22b6c0c9c2e-1320x2388__66e6fc0f.jpg"
            alt="Vehículos listos para una nueva preparación"
            fill
            sizes="100vw"
          />
        </div>
        <div className="original-cta-gradient strong" />
        <div className="original-cta-copy">
          <h2>Tu siguiente proyecto puede empezar aquí</h2>
          <p>Cuéntanos qué vehículo tienes y qué quieres sentir al conducirlo. A partir de ahí construimos una propuesta por etapas.</p>
          <AnimatedLink className="original-text-link" href="/stock">Conocer opciones</AnimatedLink>
        </div>
      </section>

      <footer id="contact" className="original-footer">
        <div className="original-footer-stage">
          <Image
            src="/media/c6f15b9448f9090f3c7d9f0b5fab4e3cbc8e7284-2880x1800__8635803c.jpg"
            alt="Taller automotriz de alto rendimiento"
            fill
            sizes="100vw"
          />
          <div className="original-footer-shade" />
          <div className="original-footer-copy">
            <p>¿Tienes un proyecto en mente?</p>
            <h2>Hazlo tuyo</h2>
            <AnimatedLink className="original-text-link" href="/contact">Empezar conversación</AnimatedLink>
          </div>
        </div>
        <div className="original-footer-bottom">
          <a className="brand footer-brand" href="#top"><span className="brand-mark" /><span>AWAR</span></a>
          <span>© AWAR Motorworks · Preparación automotriz</span>
          <AnimatedLink href="/contact">Contacto</AnimatedLink>
        </div>
      </footer>
    </div>
  );
}
