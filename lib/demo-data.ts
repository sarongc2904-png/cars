import type { Project, Service, Vehicle } from "@/lib/types";

export const projects: Project[] = [
  {
    id: "aw001",
    code: "#AW001",
    slug: "porsche-911",
    name: "Porsche 911",
    category: "Performance & Styling",
    description: "Respuesta, presencia y balance afinados como una sola preparación.",
    image: "/media/50184497f0c1b4f3ce1cdcdcfbd576ee4336f720-1520x2688__66e6fc0f.png",
    alt: "Proyecto demo AWAR Porsche 911",
  },
  {
    id: "aw002",
    code: "#AW002",
    slug: "mercedes-amg-g63",
    name: "Mercedes-AMG G63",
    category: "Tuning & Exterior",
    description: "Una configuración de alto par con una presencia exterior contenida y precisa.",
    image: "/media/2dda49076a88dd6a1282c3858f405d756ff734f6-708x1402__66e6fc0f.png",
    alt: "Proyecto demo AWAR Mercedes-AMG G63",
  },
  {
    id: "aw003",
    code: "#AW003",
    slug: "defender-110",
    name: "Defender 110",
    category: "Styling & Protection",
    description: "Protección integral, geometría visual y detalle para uso real dentro y fuera del asfalto.",
    image: "/media/22884fd5c804bb7a4a5545e22f9dd51b353c0b27-707x1402__66e6fc0f.png",
    alt: "Proyecto demo AWAR Defender 110",
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "aw101",
    code: "#AW101",
    slug: "porsche-911-available",
    model: "Porsche 911",
    status: "available",
    description: "Unidad demo preparada para una configuración personalizada de performance y acabado.",
    image: "/media/135b8a261d63c2eacb7a981b7479b94c4a74998c-708x1402__66e6fc0f.png",
    alt: "Porsche 911 demo disponible en AWAR",
  },
  {
    id: "aw102",
    code: "#AW102",
    slug: "mercedes-amg-coming-soon",
    model: "Mercedes-AMG",
    status: "coming-soon",
    description: "Configuración demo en preparación. Próximamente se publicarán especificaciones verificadas.",
    image: "/media/355c0715f1090f3eac38518ae07dd22b6c0c9c2e-1320x2388__66e6fc0f.jpg",
    alt: "Mercedes-AMG demo próximamente en AWAR",
  },
];

export const services: Service[] = [
  { id: "performance", name: "Performance" },
  { id: "tuning", name: "Tuning" },
  { id: "suspension", name: "Suspensión" },
  { id: "exhaust", name: "Escape" },
  { id: "styling", name: "Estética" },
  { id: "wheels", name: "Rines" },
  { id: "interior", name: "Interior" },
  { id: "detailing", name: "Detailing" },
  { id: "protection", name: "Protección" },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
