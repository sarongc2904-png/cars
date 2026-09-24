"use client";

/**
 * Contact form.
 *
 * Decoupled from any backend: values are validated locally and handed to a
 * `ContactSubmitAdapter` (`lib/services/contact.ts`). Today the active adapter
 * is a local preview that sends and stores nothing; switching to `/api/contact`
 * — the route the reference posts to — is a one-line change in that module.
 *
 * Structural details mirrored from the reference's contact form
 * (`2mq-pbgqwbslp.js`, confirmed from the chunk because the page is
 * client-rendered only):
 *  - `<form novalidate>` with no `action`/`method`;
 *  - a `companyName` honeypot input, `tabIndex={-1}`, `autoComplete="off"`,
 *    visually hidden and `aria-hidden`;
 *  - a `fillTimeMs` measurement from mount to submit;
 *  - `email` required only when the preferred contact method is email, and the
 *    phone number required only when it is phone;
 *  - email / phone / postcode validated with the reference's own regexes.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PremiumButton } from "@/components/AnimatedLink";
import { services } from "@/lib/demo-data";
import { activeContactAdapter, type ContactResult } from "@/lib/services/contact";
import { isValidLead, validateLead, type ContactErrors } from "@/lib/validation/contact";
import type { Lead, PreferredContact } from "@/lib/types";

const emptyLead: Lead = {
  name: "",
  phone: "",
  email: "",
  vehicle: "",
  year: "",
  service: "",
  message: "",
  preferredContact: "email",
  postcode: "",
};

/** Visual order, used to focus the first invalid control on submit. */
const FIELD_ORDER: readonly (keyof Lead)[] = [
  "name",
  "preferredContact",
  "email",
  "phone",
  "postcode",
  "vehicle",
  "year",
  "service",
  "message",
];

export function ContactForm() {
  const [lead, setLead] = useState<Lead>(emptyLead);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ContactResult | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const errorsNow = useMemo(() => validateLead(lead), [lead]);
  const complete = isValidLead(lead);

  const update = <K extends keyof Lead>(field: K, value: Lead[K]) => {
    setLead((current) => ({ ...current, [field]: value }));
    if (submitted) setErrors((current) => ({ ...current, [field]: undefined }));
    setResult(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const found = validateLead(lead);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      const firstInvalid = FIELD_ORDER.find((field) => found[field]);
      if (firstInvalid) {
        document.getElementById("contact-" + firstInvalid)?.focus();
      }
      return;
    }

    setPending(true);
    const outcome = await activeContactAdapter({
      values: lead,
      honeypot: honeypotRef.current?.value ?? "",
      fillTimeMs: Date.now() - mountedAt.current,
    });
    setResult(outcome);
    setPending(false);

    if (outcome.status === "success") {
      setLead(emptyLead);
      setSubmitted(false);
      setErrors({});
      mountedAt.current = Date.now();
    }
  };

  const errorFor = (field: keyof Lead) => (submitted ? errors[field] ?? errorsNow[field] : undefined);

  return (
    <form id="form" className="contact-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot - hidden from users and from assistive technology. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-companyName">Empresa</label>
        <input
          ref={honeypotRef}
          id="contact-companyName"
          name="companyName"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="contact-form__grid">
        <label className="contact-field">
          <span>Nombre</span>
          <input
            id="contact-name"
            name="fullName"
            value={lead.name}
            onChange={(event) => update("name", event.target.value)}
            autoComplete="name"
            aria-invalid={errorFor("name") ? true : undefined}
            aria-describedby={errorFor("name") ? "contact-name-error" : undefined}
            required
          />
          {errorFor("name") ? (
            <em id="contact-name-error" className="contact-field__error">
              {errorFor("name")}
            </em>
          ) : null}
        </label>

        <label className="contact-field">
          <span>Vía de contacto preferida</span>
          <select
            id="contact-preferredContact"
            name="preferredContact"
            value={lead.preferredContact}
            onChange={(event) => update("preferredContact", event.target.value as PreferredContact)}
            required
          >
            <option value="email">Email</option>
            <option value="phone">Teléfono</option>
          </select>
        </label>

        <label className="contact-field">
          <span>Email</span>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={lead.email}
            onChange={(event) => update("email", event.target.value)}
            autoComplete="email"
            aria-invalid={errorFor("email") ? true : undefined}
            aria-describedby={errorFor("email") ? "contact-email-error" : undefined}
            required={lead.preferredContact === "email"}
          />
          {errorFor("email") ? (
            <em id="contact-email-error" className="contact-field__error">
              {errorFor("email")}
            </em>
          ) : null}
        </label>

        <label className="contact-field">
          <span>Teléfono</span>
          <input
            id="contact-phone"
            name="number"
            type="tel"
            inputMode="tel"
            maxLength={13}
            value={lead.phone}
            onChange={(event) => update("phone", event.target.value)}
            autoComplete="tel"
            aria-invalid={errorFor("phone") ? true : undefined}
            aria-describedby={errorFor("phone") ? "contact-phone-error" : undefined}
            required={lead.preferredContact === "phone"}
          />
          {errorFor("phone") ? (
            <em id="contact-phone-error" className="contact-field__error">
              {errorFor("phone")}
            </em>
          ) : null}
        </label>

        <label className="contact-field">
          <span>Código postal</span>
          <input
            id="contact-postcode"
            name="postcode"
            maxLength={8}
            value={lead.postcode}
            onChange={(event) => update("postcode", event.target.value)}
            autoComplete="postal-code"
            aria-invalid={errorFor("postcode") ? true : undefined}
            aria-describedby={errorFor("postcode") ? "contact-postcode-error" : undefined}
          />
          {errorFor("postcode") ? (
            <em id="contact-postcode-error" className="contact-field__error">
              {errorFor("postcode")}
            </em>
          ) : null}
        </label>

        <label className="contact-field">
          <span>Vehículo</span>
          <input
            id="contact-vehicle"
            name="carMakeModel"
            value={lead.vehicle}
            onChange={(event) => update("vehicle", event.target.value)}
            autoComplete="off"
            placeholder="Land Rover Defender 110"
          />
        </label>

        <label className="contact-field">
          <span>Año</span>
          <input
            id="contact-year"
            name="year"
            inputMode="numeric"
            maxLength={4}
            value={lead.year}
            onChange={(event) => update("year", event.target.value)}
            aria-invalid={errorFor("year") ? true : undefined}
            aria-describedby={errorFor("year") ? "contact-year-error" : undefined}
          />
          {errorFor("year") ? (
            <em id="contact-year-error" className="contact-field__error">
              {errorFor("year")}
            </em>
          ) : null}
        </label>

        <label className="contact-field">
          <span>Servicio</span>
          <select
            id="contact-service"
            name="service"
            value={lead.service}
            onChange={(event) => update("service", event.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {services.map((service) => (
              <option value={service.id} key={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label className="contact-field contact-field--full">
          <span>Mensaje</span>
          <textarea
            id="contact-message"
            name="message"
            value={lead.message}
            onChange={(event) => update("message", event.target.value)}
            rows={5}
            placeholder="Cuéntanos si buscas algo concreto"
          />
        </label>
      </div>

      <div className="contact-form__submit contact-field">
        <PremiumButton type="submit" disabled={pending} ariaLabel="Enviar solicitud">
          {pending ? "Enviando" : "Iniciar proyecto"}
        </PremiumButton>
        <p aria-live="polite" role="status">
          {result
            ? result.message
            : complete
              ? "Experiencia local. Sin envío ni almacenamiento de datos."
              : "Completa los campos obligatorios para continuar."}
        </p>
      </div>
    </form>
  );
}