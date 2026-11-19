import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import {
  items as itemsTable,
  languages as languagesTable,
  menuItems,
  pages as pagesTable,
  settings as settingsTable,
  uiStrings,
} from "@/db/schema";
import type { ItemRow, LanguageRow, MenuItemRow, PageRow, PortalSettings } from "@/db/schema";
import { DEFAULT_LANG, pick } from "./i18n";
import { translateBatch } from "./translate";

export type Lang = LanguageRow;
export type ContentItem = ItemRow;
export type Page = PageRow;
export type Menu = MenuItemRow;

export type SiteData = {
  settings: PortalSettings;
  languages: Lang[];
  defaultLang: string;
  langs: string[];
  menu: Menu[];
  pages: Page[];
  items: ContentItem[];
  ui: Record<string, Record<string, string>>;
};

/** Loads everything the portal needs in one go (memoised per request). */
export const loadSite = cache(async (): Promise<SiteData> => {
  await ensureReady();
  const [settingsRows, langs, menu, pageRows, itemRows, uiRows] = await Promise.all([
    db.select().from(settingsTable).where(eq(settingsTable.id, "portal")).limit(1),
    db.select().from(languagesTable).orderBy(asc(languagesTable.position)),
    db.select().from(menuItems).orderBy(asc(menuItems.area), asc(menuItems.position), asc(menuItems.id)),
    db.select().from(pagesTable).orderBy(asc(pagesTable.position)),
    db.select().from(itemsTable).orderBy(asc(itemsTable.type), asc(itemsTable.position)),
    db.select().from(uiStrings),
  ]);

  const enabledLangs = langs.filter((l) => l.enabled);
  const fallback = enabledLangs.length ? enabledLangs : langs;
  const defaultLang = fallback.find((l) => l.isDefault)?.code || fallback[0]?.code || DEFAULT_LANG;

  return {
    settings: (settingsRows[0]?.data || {}) as PortalSettings,
    languages: fallback,
    defaultLang,
    langs: fallback.map((l) => l.code),
    menu,
    pages: pageRows.filter((p) => p.published),
    items: itemRows.filter((i) => i.published),
    ui: Object.fromEntries(uiRows.map((r) => [r.key, r.values as Record<string, string>])),
  };
});

export function t(site: SiteData, key: string, lang: string): string {
  const entry = site.ui[key];
  if (!entry) return key;
  return pick(entry, lang, [site.defaultLang, DEFAULT_LANG]) || key;
}

export function mlPick(site: SiteData, value: Record<string, string> | null | undefined, lang: string): string {
  return pick(value, lang, [site.defaultLang, DEFAULT_LANG]);
}

/**
 * Automatically translates any missing `title` / `dek` for a list of items when viewing in a non-default language,
 * and caches the result in PostgreSQL.
 */
export async function ensureItemsTranslated(list: ContentItem[], lang: string, defaultLang = DEFAULT_LANG): Promise<ContentItem[]> {
  if (!lang || lang === defaultLang || !list.length) return list;
  const missing: { item: ContentItem; field: "title" | "dek"; source: string }[] = [];
  for (const item of list.slice(0, 32)) {
    for (const field of ["title", "dek"] as const) {
      const obj = (item[field] || {}) as Record<string, string>;
      const src = obj[defaultLang] || Object.values(obj).find(Boolean) || "";
      if (src && !obj[lang]?.trim()) {
        missing.push({ item, field, source: src });
      }
    }
  }
  if (!missing.length) return list;
  try {
    const { results } = await translateBatch(missing.map((m) => m.source), defaultLang, lang);
    const updates = new Map<string, { title?: Record<string, string>; dek?: Record<string, string> }>();
    missing.forEach((m, idx) => {
      const trText = results[idx] || m.source;
      const curObj = { ...((m.item[m.field] || {}) as Record<string, string>), [lang]: trText };
      (m.item as Record<string, unknown>)[m.field] = curObj;
      const patch = updates.get(m.item.id) || {};
      patch[m.field] = curObj;
      updates.set(m.item.id, patch);
    });
    await Promise.all(
      [...updates.entries()].map(([id, patch]) =>
        db.update(itemsTable).set({ ...patch, updatedAt: new Date() }).where(eq(itemsTable.id, id)).catch(() => null),
      ),
    );
  } catch {
    /* keep fallback */
  }
  return list;
}

/** Automatically translates an item's full `title`, `dek`, and `body` when viewed in a non-default language. */
export async function ensureItemFullTranslated(item: ContentItem, lang: string, defaultLang = DEFAULT_LANG): Promise<ContentItem> {
  if (!lang || lang === defaultLang) return item;
  const patch: Record<string, Record<string, string>> = {};
  for (const field of ["title", "dek", "body"] as const) {
    const obj = (item[field] || {}) as Record<string, string>;
    const src = obj[defaultLang] || Object.values(obj).find(Boolean) || "";
    if (src && !obj[lang]?.trim()) {
      try {
        const paragraphs = src.split("\n\n");
        const { results } = await translateBatch(paragraphs, defaultLang, lang);
        const translated = results.join("\n\n");
        const nextObj = { ...obj, [lang]: translated };
        (item as Record<string, unknown>)[field] = nextObj;
        patch[field] = nextObj;
      } catch {
        /* ignore */
      }
    }
  }
  if (Object.keys(patch).length > 0) {
    await db.update(itemsTable).set({ ...patch, updatedAt: new Date() }).where(eq(itemsTable.id, item.id)).catch(() => null);
  }
  return item;
}

export function itemsOfType(site: SiteData, type: string): ContentItem[] {
  return site.items.filter((i) => i.type === type);
}

export function menuFor(site: SiteData, area: string): Menu[] {
  return site.menu.filter((m) => m.area === area && !m.hidden);
}

export function pageBySlug(site: SiteData, slug: string): Page | undefined {
  return site.pages.find((p) => p.slug === slug);
}

/** Every searchable piece of content, used by the global search overlay. */
export function searchIndex(site: SiteData, lang: string) {
  const out: { id: string; type: string; title: string; dek: string; href: string; image: string | null; category: string | null }[] = [];
  for (const item of site.items) {
    const title = mlPick(site, item.title, lang);
    const dek = mlPick(site, item.dek, lang);
    out.push({
      id: item.id,
      type: item.type,
      title,
      dek,
      image: item.image,
      category: item.category,
      href: hrefForItem(item),
    });
  }
  for (const page of site.pages) {
    out.push({
      id: `page-${page.slug}`,
      type: "page",
      title: mlPick(site, page.title, lang),
      dek: mlPick(site, page.subtitle, lang),
      image: page.image,
      category: null,
      href: `/${page.slug === "home" ? "" : page.slug}`,
    });
  }
  return out;
}

export function hrefForItem(item: ContentItem): string {
  switch (item.type) {
    case "article":
      return `/article/${item.id.replace(/^article-/, "")}`;
    case "cover":
      return `/covers?cover=${item.id}`;
    case "edition":
      return `/editions?issue=${item.id}`;
    case "video":
      return `/play?video=${item.id}`;
    case "columnist":
      return `/team/${item.id.replace(/^col-/, "")}`;
    case "hotel":
      return `/hotels?place=${item.id}`;
    case "dining":
      return `/fine-dining?place=${item.id}`;
    case "release":
      return `/press?release=${item.id}`;
    case "brand":
      return `/media-kit?brand=${item.id}`;
    default:
      return "/";
  }
}

export const TYPE_LABEL: Record<string, Record<string, string>> = {
  article: { pt: "Matéria", en: "Article", es: "Artículo" },
  cover: { pt: "Capa", en: "Cover", es: "Portada" },
  edition: { pt: "Edição", en: "Issue", es: "Edición" },
  video: { pt: "Vídeo", en: "Video", es: "Vídeo" },
  columnist: { pt: "Nosso Time", en: "Our Team", es: "Nuestro Equipo" },
  brand: { pt: "Marca", en: "Brand", es: "Marca" },
  hotel: { pt: "Hotel", en: "Hotel", es: "Hotel" },
  dining: { pt: "Restaurante", en: "Restaurant", es: "Restaurante" },
  release: { pt: "Release", en: "Release", es: "Comunicado" },
  page: { pt: "Página", en: "Page", es: "Página" },
};
