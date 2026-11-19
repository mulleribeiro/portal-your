import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { items, menuItems, pages, settings, uiStrings } from "@/db/schema";
import { getPath, log, setPath } from "./admin-store";

export type InlineEntity = "item" | "page" | "settings" | "menu" | "ui";
export type InlinePayload = { entity: InlineEntity; id: string; field: string; values: Record<string, string> };

const ITEM_ML = ["title", "dek", "body"];
const ITEM_PLAIN = ["image", "url", "category"];
const ITEM_FLAGS = ["featured", "published"];
const PAGE_ML = ["title", "subtitle", "kicker"];

function mergeLangs(existing: unknown, patch: Record<string, string>): Record<string, string> {
  const base = existing && typeof existing === "object" && !Array.isArray(existing) ? { ...(existing as Record<string, string>) } : {};
  for (const [k, v] of Object.entries(patch || {})) if (typeof v === "string") base[k] = v;
  return base;
}

/** `{ value }` = plain text/URL field; any other shape = multilingual merge. */
function plainOf(values: Record<string, string>): string | undefined {
  return Object.prototype.hasOwnProperty.call(values, "value") ? values.value : undefined;
}

/** Writes a single field edited directly on the public site (text, image, link...). */
export async function updateInline(payload: InlinePayload) {
  await ensureReady();
  const { entity, id, field, values } = payload;
  const plain = plainOf(values);

  if (entity === "item") {
    const [row] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!row) throw new Error("item not found");
    if (ITEM_ML.includes(field)) {
      const value = mergeLangs((row as unknown as Record<string, unknown>)[field], values);
      await db.update(items).set({ [field]: value, updatedAt: new Date() } as Record<string, unknown>).where(eq(items.id, id));
    } else if (ITEM_PLAIN.includes(field)) {
      await db.update(items).set({ [field]: plain ?? Object.values(values)[0] ?? "", updatedAt: new Date() } as Record<string, unknown>).where(eq(items.id, id));
    } else if (ITEM_FLAGS.includes(field)) {
      const flag = (plain ?? "") === "true";
      await db.update(items).set({ [field]: flag, updatedAt: new Date() } as Record<string, unknown>).where(eq(items.id, id));
    } else if (field.startsWith("meta.")) {
      const meta = setPath((row.meta || {}) as Record<string, unknown>, field.slice(5), plain ?? values);
      await db.update(items).set({ meta, updatedAt: new Date() }).where(eq(items.id, id));
    } else {
      throw new Error(`campo não suportado: ${field}`);
    }
    await log("item", id, "inline", field);
    return { ok: true };
  }

  if (entity === "page") {
    const [row] = await db.select().from(pages).where(eq(pages.slug, id)).limit(1);
    if (!row) throw new Error("page not found");
    if (PAGE_ML.includes(field)) {
      const value = mergeLangs((row as unknown as Record<string, unknown>)[field], values);
      await db.update(pages).set({ [field]: value, updatedAt: new Date() } as Record<string, unknown>).where(eq(pages.slug, id));
    } else if (field === "image") {
      await db.update(pages).set({ image: plain ?? "", updatedAt: new Date() }).where(eq(pages.slug, id));
    } else {
      const blocks = setPath({ blocks: row.blocks || [] }, field, plain ?? values).blocks;
      await db.update(pages).set({ blocks: blocks as unknown[], updatedAt: new Date() }).where(eq(pages.slug, id));
    }
    await log("page", id, "inline", field);
    return { ok: true };
  }

  if (entity === "settings") {
    const [row] = await db.select().from(settings).where(eq(settings.id, id)).limit(1);
    const data = (row?.data || {}) as Record<string, unknown>;
    let next: unknown;
    if (plain !== undefined) {
      next = plain;
    } else {
      const current = getPath(data, field);
      next = current && typeof current === "object" && !Array.isArray(current) ? mergeLangs(current, values) : values;
    }
    const updated = setPath(data, field, next);
    await db.insert(settings).values({ id, data: updated })
      .onConflictDoUpdate({ target: settings.id, set: { data: updated, updatedAt: new Date() } });
    await log("settings", id, "inline", field);
    return { ok: true };
  }

  if (entity === "menu") {
    const numericId = Number(id);
    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, numericId)).limit(1);
    if (!row) throw new Error("menu item not found");
    if (field === "label") {
      await db.update(menuItems).set({ label: mergeLangs(row.label, values) }).where(eq(menuItems.id, numericId));
    } else {
      await db.update(menuItems).set({ [field]: plain ?? Object.values(values)[0] ?? "" } as Record<string, unknown>).where(eq(menuItems.id, numericId));
    }
    await log("menu", id, "inline", field);
    return { ok: true };
  }

  if (entity === "ui") {
    const [row] = await db.select().from(uiStrings).where(eq(uiStrings.key, id)).limit(1);
    const value = mergeLangs(row?.values, values);
    await db.insert(uiStrings).values({ key: id, group: row?.group || "custom", values: value })
      .onConflictDoUpdate({ target: uiStrings.key, set: { values: value } });
    await log("ui", id, "inline", "values");
    return { ok: true };
  }

  throw new Error("unknown entity");
}
