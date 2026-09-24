export type AvailabilityStatus = "available" | "coming-soon" | "reserved";

/**
 * Builds and Stock are deliberately separate shapes.
 *
 * The reference confirms they are not the same model: they share one card
 * component and one archive component, but are fed different CMS documents — a
 * build has `available`/specs, a stock vehicle has price/comingSoon/mileage/
 * registration — and are served from different base paths
 * (`ARCHIVE_BASE_PATH = "/builds/"`, `STOCK_BASE_PATH = "/stock/"`).
 */
export interface Project {
  id: string;
  code: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image: string;
  alt: string;
}

export interface Vehicle {
  id: string;
  code: string;
  slug: string;
  model: string;
  status: AvailabilityStatus;
  description: string;
  image: string;
  alt: string;
  /** The reference renders the price for available vehicles instead of status. */
  price?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
}

/** How the applicant prefers to be contacted — mirrors the reference `<select>`. */
export type PreferredContact = "email" | "phone";

/**
 * Contact form values.
 *
 * `preferredContact` and `postcode` mirror the reference's form shape; the
 * reference additionally collects `preferredSite`, `carRegistration` and a
 * `currentCar` file, plus a `companyName` honeypot handled by the adapter.
 */
export interface Lead {
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  year: string;
  service: string;
  message: string;
  preferredContact: PreferredContact;
  postcode: string;
}