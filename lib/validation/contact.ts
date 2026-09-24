/**
 * Client-side validation for the contact form.
 *
 * Field shapes, `required` rules and the hand-written regexes come from the
 * Forge Automotive reference (`2mq-pbgqwbslp.js`, the contact route chunk):
 *
 *   email     /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 *   phone     /^0\d{10}$/                         (UK national, 11 digits)
 *   postcode  /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/  (UK postcode)
 *
 * The reference requires `email` only when the preferred contact method is
 * email, and `number` only when it is phone. Its messages are
 * "Field is required", "Invalid" and "Please fix the highlighted fields.";
 * this project keeps the rules with Spanish copy.
 *
 * No schema library is used — the reference uses none either (no zod,
 * react-hook-form, resolver or server action appears anywhere in its bundle).
 */

import type { Lead } from "@/lib/types";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^0\d{10}$/;
export const POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;

export type ContactErrors = Partial<Record<keyof Lead, string>>;

export const REQUIRED_MESSAGE = "Campo obligatorio";
export const INVALID_MESSAGE = "Valor no válido";

/**
 * Validates a lead. `preferredContact` mirrors the reference's `<select>`:
 * the email/phone requirement flips with it.
 */
export function validateLead(lead: Lead): ContactErrors {
  const errors: ContactErrors = {};

  if (!lead.name.trim()) errors.name = REQUIRED_MESSAGE;

  if (lead.email.trim()) {
    if (!EMAIL_PATTERN.test(lead.email.trim())) errors.email = INVALID_MESSAGE;
  } else if (lead.preferredContact !== "phone") {
    errors.email = REQUIRED_MESSAGE;
  }

  if (lead.phone.trim()) {
    if (!PHONE_PATTERN.test(lead.phone.replace(/\s+/g, ""))) errors.phone = INVALID_MESSAGE;
  } else if (lead.preferredContact === "phone") {
    errors.phone = REQUIRED_MESSAGE;
  }

  if (lead.postcode.trim() && !POSTCODE_PATTERN.test(lead.postcode.trim().toUpperCase())) {
    errors.postcode = INVALID_MESSAGE;
  }

  if (lead.year.trim() && !/^(19|20)\d{2}$/.test(lead.year.trim())) {
    errors.year = INVALID_MESSAGE;
  }

  return errors;
}

export function isValidLead(lead: Lead): boolean {
  return Object.keys(validateLead(lead)).length === 0;
}