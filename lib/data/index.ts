/**
 * Data access layer.
 *
 * The UI goes through these accessors rather than importing `lib/demo-data.ts`
 * directly. They are `async` on purpose, so replacing the body with a
 * Supabase / Firebase / CMS / REST / GraphQL call later does not change a single
 * component signature.
 *
 * Reference evidence for this split (`365v898uwp-3x.js`, module 22584):
 *
 *   ARCHIVE_BASE_PATH = "/builds/"
 *   STOCK_BASE_PATH   = "/stock/"
 *   buildHref = (base, slug) => `${base}${slug}/`
 *
 * Builds and Stock share one card component in the reference but are fed
 * different documents, so they keep different types and different accessors here
 * rather than being flattened into one "item".
 */

import { projects, services, vehicles } from "@/lib/demo-data";
import type { Project, Service, Vehicle } from "@/lib/types";

/** Reference: `ARCHIVE_BASE_PATH`. */
export const ARCHIVE_BASE_PATH = "/builds/";
/** Reference: `STOCK_BASE_PATH`. */
export const STOCK_BASE_PATH = "/stock/";

/** Reference: `buildHref = (base, slug) => `${base}${slug}/``. */
export function buildHref(slug: string, basePath: string = ARCHIVE_BASE_PATH): string {
  return basePath + slug + "/";
}

export async function getBuilds(): Promise<readonly Project[]> {
  return projects;
}

export async function getBuild(slug: string): Promise<Project | undefined> {
  return projects.find((project) => project.slug === slug);
}

/**
 * The next build in archive order, cycling back to the first.
 * Reference: the "Next Build" block on a build detail page cycles
 * fa001 -> fa002 -> ... -> fa009 -> fa001 and is absent on stock detail pages.
 */
export async function getNextBuild(slug: string): Promise<Project | undefined> {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1 || projects.length < 2) return undefined;
  return projects[(index + 1) % projects.length];
}

export async function getStock(): Promise<readonly Vehicle[]> {
  return vehicles;
}

export async function getStockItem(slug: string): Promise<Vehicle | undefined> {
  return vehicles.find((vehicle) => vehicle.slug === slug);
}

export async function getServices(): Promise<readonly Service[]> {
  return services;
}