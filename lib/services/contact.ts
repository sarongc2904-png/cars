/**
 * Contact submission adapters.
 *
 * The frontend is deliberately decoupled from any backend: the form talks to a
 * `ContactSubmitAdapter`, and swapping the adapter is the only change needed to
 * connect Supabase, Firebase, a CMS, REST or GraphQL later.
 *
 * Reference behaviour (Forge Automotive, `2mq-pbgqwbslp.js`) posts a `FormData`
 * body to the same-origin route `/api/contact`, with no `Content-Type` header
 * and no third party:
 *
 *   fetch("/api/contact", { method: "POST", body: formData })
 *
 * and includes two anti-abuse fields alongside the values: a honeypot input
 * named `companyName` (hidden from users, `tabIndex={-1}`, `autoComplete="off"`)
 * and a `fillTimeMs` measurement of how long the form took to complete. The
 * reference's server implementation is not present in the mirror, so this
 * project does not guess at it.
 *
 * Until a backend exists, `localPreviewAdapter` is used: it resolves
 * successfully and sends nothing and stores nothing.
 */

import type { Lead } from "@/lib/types";

export type ContactSubmission = {
  values: Lead;
  /** Honeypot value; any non-empty value marks the submission as automated. */
  honeypot: string;
  /** Milliseconds between mount and submit, as in the reference. */
  fillTimeMs: number;
};

export type ContactResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export type ContactSubmitAdapter = (submission: ContactSubmission) => Promise<ContactResult>;

export const CONTACT_SUCCESS_MESSAGE = "Gracias. Te escribiremos en breve.";
export const CONTACT_ERROR_MESSAGE = "No se pudo enviar. Inténtalo de nuevo.";

/**
 * Local, non-destructive adapter. No network request, no persistence — the form
 * stays fully local and testable.
 */
export const localPreviewAdapter: ContactSubmitAdapter = async ({ honeypot }) => {
  // Simulated latency only, so the pending state is observable in QA.
  await new Promise((resolve) => setTimeout(resolve, 350));

  if (honeypot.trim()) {
    // Behave like the reference: silently accept bot submissions.
    return { status: "success", message: CONTACT_SUCCESS_MESSAGE };
  }

  return {
    status: "success",
    message: CONTACT_SUCCESS_MESSAGE + " (demo local: no se ha enviado nada)",
  };
};

/**
 * Reference-shaped adapter, ready to enable once a route handler exists. Kept
 * un-wired on purpose — the brief forbids connecting a backend now.
 */
export function httpAdapter(endpoint: string): ContactSubmitAdapter {
  return async (submission) => {
    const body = new FormData();
    Object.entries(submission.values).forEach(([key, value]) => body.append(key, value));
    body.append("companyName", submission.honeypot);
    body.append("fillTimeMs", String(submission.fillTimeMs));

    try {
      const response = await fetch(endpoint, { method: "POST", body });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const message =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error: unknown }).error)
            : CONTACT_ERROR_MESSAGE;
        return { status: "error", message };
      }
      return { status: "success", message: CONTACT_SUCCESS_MESSAGE };
    } catch {
      return { status: "error", message: CONTACT_ERROR_MESSAGE };
    }
  };
}

/** The adapter currently in use. Swap this one line to connect a backend. */
export const activeContactAdapter: ContactSubmitAdapter = localPreviewAdapter;