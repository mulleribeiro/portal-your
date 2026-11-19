"use client";

import { getAdminToken } from "./admin-session";

/**
 * Carry authentication in the POST body, not just a custom header.
 * GET/PATCH/DELETE are tunneled through authenticated POST handlers so the preview
 * proxy cannot strip the session or cache a guest response. Tokens never enter URLs.
 */
export async function adminFetch(url: string, init: RequestInit = {}, tokenOverride?: string): Promise<Response> {
  const token = tokenOverride === undefined ? getAdminToken() : tokenOverride;
  const headers = new Headers(init.headers);
  if (token) headers.set("x-admin-token", token); // optional legacy transport, not required
  const originalMethod = (init.method || "GET").toUpperCase();
  const method = ["GET", "HEAD", "PATCH", "DELETE"].includes(originalMethod) ? "POST" : originalMethod;
  let body: BodyInit;
  if (init.body instanceof FormData) {
    const form = new FormData();
    init.body.forEach((value, key) => form.append(key, value));
    if (token) form.set("__admin_session", token);
    if (originalMethod !== "POST") form.set("__method", originalMethod);
    headers.delete("content-type");
    body = form;
  } else {
    let payload: Record<string, unknown> = {};
    if (typeof init.body === "string" && init.body) {
      const parsed = JSON.parse(init.body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) payload = parsed;
    }
    if (token) payload.__admin_session = token;
    if (originalMethod !== "POST") payload.__method = originalMethod;
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(payload);
  }
  return fetch(url, { ...init, method, headers, body, credentials: "same-origin", cache: "no-store" });
}
