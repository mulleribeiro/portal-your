/** Multi-language helpers shared by the server and the client. */

export type ML = Record<string, string> | null | undefined;

export const DEFAULT_LANG = "pt";

/** Resolve a multi-language value for `lang`, falling back to any filled language. */
export function pick(value: ML, lang: string, fallbacks: string[] = [DEFAULT_LANG]): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value[lang]) return value[lang];
  for (const f of fallbacks) if (value[f]) return value[f];
  const anyKey = Object.keys(value).find((k) => value[k]);
  return anyKey ? value[anyKey] : "";
}

/** Which languages already have a value in this multi-language field? */
export function filledLangs(value: ML, langs: string[]): string[] {
  if (!value) return [];
  return langs.filter((l) => Boolean((value as Record<string, string>)[l]?.trim()));
}

export function missingLangs(value: ML, langs: string[]): string[] {
  const done = new Set(filledLangs(value, langs));
  return langs.filter((l) => !done.has(l));
}

/** Merge translated values into an existing multi-language field. */
export function withTranslations(value: ML, patch: Record<string, string>): Record<string, string> {
  const base = value && typeof value === "object" ? { ...value } : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v && String(v).trim()) base[k] = String(v);
  }
  return base;
}

export function slugify(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "item";
}

export function escapeHtml(input: string): string {
  return String(input ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
