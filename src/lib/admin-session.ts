"use client";

/** In-memory first: sandboxed iframes may block both cookies and Web Storage. */
let currentToken = "";
const KEY = "your_admin_token";

export function getAdminToken(): string {
  if (currentToken) return currentToken;
  if (typeof window === "undefined") return "";
  try { currentToken = sessionStorage.getItem(KEY) || ""; } catch { /* blocked */ }
  if (!currentToken) {
    try { currentToken = localStorage.getItem(KEY) || ""; } catch { /* blocked */ }
  }
  return currentToken;
}

export function setAdminToken(token: string): void {
  currentToken = token;
  if (typeof window === "undefined") return;
  for (const area of ["sessionStorage", "localStorage"] as const) {
    try {
      if (token) window[area].setItem(KEY, token);
      else window[area].removeItem(KEY);
    } catch { /* memory token still works */ }
  }
  window.dispatchEvent(new Event("your:admin-session"));
}

export function clearAdminToken(): void { setAdminToken(""); }
