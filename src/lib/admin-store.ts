import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { activityLog, items, languages, menuItems, pages, settings, uiStrings } from "@/db/schema";
import { slugify } from "./i18n";
import { translateBatch } from "./translate";

export type Entity = "item" | "page" | "settings" | "menu" | "ui" | "language";

export async function log(entity: string, entityId: string | null, action: string, detail?: string) {
  await ensureReady();
  await db.insert(activityLog).values({ entity, entityId, action, detail: detail?.slice(0, 400) || null });
}

/** Deep get/set that understands dotted paths with numeric array indexes. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split(".");
  const clone = structuredClone(obj);
  let cursor: Record<string, unknown> = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    if (cursor[key] == null) cursor[key] = /^\d+$/.test(nextKey) ? [] : {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
}

function mergeLangs(existing: unknown, patch: Record<string, string>): Record<string, string> {
  const base = existing && typeof existing === "object" ? { ...(existing as Record<string, string>) } : {};
  for (const [k, v] of Object.entries(patch || {})) {
    if (typeof v === "string") base[k] = v;
  }
  return base;
}

export async function updateInline(payload: {
  entity: Entity; id: string; field: string; values: Record<string, string>;
}) {
  await ensureReady();
  const { entity, id, field, values } = payload;

  if (entity === "item") {
    const [row] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!row) throw new Error("item not found");
    if (["title", "dek", "body"].includes(field)) {
      const patch = { [field]: mergeLangs((row as unknown as Record<string, unknown>)[field], values) } as Record<string, unknown>;
      await db.update(items).set({ ...patch, updatedAt: new Date() }).where(eq(items.id, id));
    } else {
      const meta = setPath((row.meta || {}) as Record<string, unknown>, field.replace(/^meta\./, ""), values);
      await db.update(items).set({ meta, updatedAt: new Date() }).where(eq(items.id, id));
    }
    await log("item", id, "inline", `${field}: ${JSON.stringify(values).slice(0, 200)}`);
    return { ok: true };
  }

  if (entity === "page") {
    const [row] = await db.select().from(pages).where(eq(pages.slug, id)).limit(1);
    if (!row) throw new Error("page not found");
    if (["title", "subtitle", "kicker"].includes(field)) {
      const patch = { [field]: mergeLangs((row as unknown as Record<string, unknown>)[field], values) } as Record<string, unknown>;
      await db.update(pages).set({ ...patch, updatedAt: new Date() }).where(eq(pages.slug, id));
    } else {
      const blocks = setPath({ blocks: row.blocks || [] }, field, values).blocks;
      await db.update(pages).set({ blocks: blocks as unknown[], updatedAt: new Date() }).where(eq(pages.slug, id));
    }
    await log("page", id, "inline", field);
    return { ok: true };
  }

  if (entity === "settings") {
    const [row] = await db.select().from(settings).where(eq(settings.id, id)).limit(1);
    const data = ((row?.data || {}) as Record<string, unknown>);
    const current = getPath(data, field);
    const next = current && typeof current === "object" && !Array.isArray(current)
      ? mergeLangs(current, values)
      : values[Object.keys(values)[0]];
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
      const value = values[Object.keys(values)[0]] ?? "";
      await db.update(menuItems).set({ [field]: value } as Record<string, unknown>).where(eq(menuItems.id, numericId));
    }
    await log("menu", id, "inline", field);
    return { ok: true };
  }

  if (entity === "ui") {
    const [row] = await db.select().from(uiStrings).where(eq(uiStrings.key, id)).limit(1);
    await db.insert(uiStrings).values({ key: id, group: row?.group || "custom", values: mergeLangs(row?.values, values) })
      .onConflictDoUpdate({ target: uiStrings.key, set: { values: mergeLangs(row?.values, values) } });
    await log("ui", id, "inline", "values");
    return { ok: true };
  }

  throw new Error("unknown entity");
}

export type ItemPayload = {
  id?: string; type: string; title: Record<string, string>; dek?: Record<string, string>;
  body?: Record<string, string>; category?: string; image?: string; url?: string;
  meta?: Record<string, unknown>; featured?: boolean; published?: boolean; position?: number; tags?: string[];
};

export async function saveItem(payload: ItemPayload, defaultLang: string) {
  await ensureReady();
  const prefix = payload.type === "columnist" ? "col" : payload.type;
  const id = payload.id?.trim() || `${prefix}-${slugify(payload.title?.[defaultLang] || "novo")}`;
  const row = {
    id, type: payload.type, title: payload.title, dek: payload.dek || null, body: payload.body || null,
    category: payload.category || null, tags: payload.tags || [], image: payload.image || null,
    url: payload.url || null, meta: payload.meta || {}, featured: Boolean(payload.featured),
    published: payload.published !== false, position: payload.position ?? 0, updatedAt: new Date(),
  };
  await db.insert(items).values(row).onConflictDoUpdate({ target: items.id, set: row });
  await log("item", id, "save", payload.type);
  return { id };
}

export async function savePage(payload: {
  slug: string; previousSlug?: string; template?: string; title: Record<string, string>; subtitle?: Record<string, string>;
  kicker?: Record<string, string>; image?: string; blocks?: unknown[]; published?: boolean;
  showInMenu?: boolean; position?: number; seo?: Record<string, string>;
}) {
  await ensureReady();
  if (typeof payload.slug !== "string" || !payload.slug.trim()) throw new Error("Informe um slug para a página.");
  const title = payload.title && typeof payload.title === "object" ? payload.title : {};
  if (!Object.values(title).some((value) => typeof value === "string" && value.trim())) throw new Error("Informe um título para a página.");
  const blocks = payload.blocks ?? [];
  if (!Array.isArray(blocks)) throw new Error("Os blocos da página precisam ser uma lista JSON.");

  const slug = slugify(payload.slug);
  const previousSlug = payload.previousSlug?.trim() ? slugify(payload.previousSlug) : "";
  const template = payload.template?.trim() || "custom";
  const row = {
    slug, template, title, subtitle: payload.subtitle || null,
    kicker: payload.kicker || null, image: payload.image || null, blocks,
    seo: payload.seo || null, published: payload.published !== false, showInMenu: payload.showInMenu !== false,
    position: payload.position ?? 0, updatedAt: new Date(),
  };

  if (previousSlug && previousSlug !== slug) {
    const [collision] = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.slug, slug)).limit(1);
    if (collision) throw new Error("Já existe uma página com esse endereço.");
    const [renamed] = await db.update(pages).set(row).where(eq(pages.slug, previousSlug)).returning({ slug: pages.slug });
    if (!renamed) throw new Error("A página original não foi encontrada. Atualize a lista e tente novamente.");
    await db.update(menuItems).set({ href: `/${slug}` }).where(and(
      eq(menuItems.area, "rail"), eq(menuItems.group, "Páginas"), eq(menuItems.href, `/${previousSlug}`),
    ));
  } else {
    await db.insert(pages).values(row).onConflictDoUpdate({ target: pages.slug, set: row });
  }

  const autoMenuFilter = and(
    eq(menuItems.area, "rail"), eq(menuItems.group, "Páginas"), eq(menuItems.href, `/${slug}`), eq(menuItems.kind, "route"),
  );
  if (template === "custom" && row.published && row.showInMenu) {
    const [autoMenu] = await db.select({ id: menuItems.id }).from(menuItems).where(autoMenuFilter).limit(1);
    if (!autoMenu) {
      const [anyRoute] = await db.select({ id: menuItems.id }).from(menuItems).where(and(
        eq(menuItems.area, "rail"), eq(menuItems.href, `/${slug}`), eq(menuItems.kind, "route"),
      )).limit(1);
      if (!anyRoute) {
        const positions = await db.select({ position: menuItems.position }).from(menuItems).where(eq(menuItems.area, "rail"));
        const position = Math.max(-1, ...positions.map((entry) => entry.position)) + 1;
        await db.insert(menuItems).values({
          area: "rail", group: "Páginas", label: title, kind: "route", href: `/${slug}`,
          badge: null, icon: "P", position, hidden: false,
        });
      }
    }
  } else {
    await db.delete(menuItems).where(autoMenuFilter);
  }

  await log("page", slug, "save");
  return { slug };
}

export async function saveMenu(payload: {
  id?: number; area: string; group?: string | null; label: Record<string, string>; kind?: string;
  href: string; badge?: string | null; icon?: string | null; position?: number; hidden?: boolean;
}) {
  await ensureReady();
  if (!["rail", "top", "footer"].includes(payload.area)) throw new Error("Área de menu inválida.");
  const kind = payload.kind || "route";
  if (!["route", "external", "email"].includes(kind)) throw new Error("Tipo de destino inválido.");
  const label = payload.label && typeof payload.label === "object" ? payload.label : {};
  if (!Object.values(label).some((value) => typeof value === "string" && value.trim())) throw new Error("Informe um rótulo para o item de menu.");

  const rawHref = String(payload.href || "").trim();
  let href = rawHref;
  if (kind === "external") {
    try {
      const parsed = new URL(rawHref);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("scheme");
    } catch {
      throw new Error("O link externo precisa usar uma URL HTTP ou HTTPS válida.");
    }
  } else if (kind === "email") {
    const email = rawHref.replace(/^mailto:/i, "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um endereço de e-mail válido para o menu.");
    href = `mailto:${email}`;
  } else {
    if (!rawHref || /^(https?:|mailto:|tel:|javascript:|\/\/)/i.test(rawHref)) throw new Error("Use um caminho interno, como /news.");
    href = `/${rawHref.replace(/^\/+/, "")}`;
  }

  const row = {
    area: payload.area, group: payload.group?.trim() || null, label, kind,
    href, badge: payload.badge?.trim() || null, icon: payload.icon?.trim() || null,
    position: Number.isFinite(payload.position) ? payload.position! : 0, hidden: Boolean(payload.hidden),
  };
  if (payload.id !== undefined) {
    if (!Number.isInteger(payload.id) || payload.id < 1) throw new Error("Identificador de menu inválido.");
    const [updated] = await db.update(menuItems).set(row).where(eq(menuItems.id, payload.id)).returning({ id: menuItems.id });
    if (!updated) throw new Error("O item de menu não foi encontrado.");
    await log("menu", String(payload.id), "save");
    return { id: payload.id };
  }
  const [created] = await db.insert(menuItems).values(row).returning({ id: menuItems.id });
  await log("menu", String(created?.id), "create", href);
  return created;
}

export async function saveSettings(data: Record<string, unknown>) {
  await ensureReady();
  await db.insert(settings).values({ id: "portal", data })
    .onConflictDoUpdate({ target: settings.id, set: { data, updatedAt: new Date() } });
  await log("settings", "portal", "save");
  return { ok: true };
}

export async function saveUi(key: string, values: Record<string, string>, group = "custom") {
  await ensureReady();
  await db.insert(uiStrings).values({ key, group, values })
    .onConflictDoUpdate({ target: uiStrings.key, set: { values, group } });
  await log("ui", key, "save");
  return { key };
}

export async function saveLanguage(payload: { code: string; name: string; nativeName: string; flag?: string; isDefault?: boolean; position?: number; enabled?: boolean }) {
  await ensureReady();
  const code = payload.code.trim().toLowerCase();
  const row = {
    code, name: payload.name, nativeName: payload.nativeName, flag: payload.flag || null,
    isDefault: Boolean(payload.isDefault), enabled: payload.enabled !== false, position: payload.position ?? 0,
  };
  await db.insert(languages).values(row).onConflictDoUpdate({ target: languages.code, set: row });
  if (row.isDefault) {
    await db.update(languages).set({ isDefault: false }).where(eq(languages.code, code));
    await db.update(languages).set({ isDefault: true }).where(eq(languages.code, code));
  }
  await log("language", code, "save");
  return { code };
}

export async function removeEntity(entity: Entity, id: string) {
  await ensureReady();
  if (entity === "item") await db.delete(items).where(eq(items.id, id));
  else if (entity === "page") await db.delete(pages).where(eq(pages.slug, id));
  else if (entity === "menu") await db.delete(menuItems).where(eq(menuItems.id, Number(id)));
  else if (entity === "ui") await db.delete(uiStrings).where(eq(uiStrings.key, id));
  else if (entity === "language") await db.delete(languages).where(eq(languages.code, id));
  else throw new Error("settings cannot be deleted");
  await log(entity, id, "delete");
  return { ok: true };
}

export async function moveEntity(entity: Entity, id: string, direction: -1 | 1) {
  await ensureReady();
  if (entity === "item") {
    const [row] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!row) return { ok: false };
    const siblings = await db.select().from(items).where(eq(items.type, row.type));
    const sorted = siblings.sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return { ok: false };
    const a = sorted[idx]; const b = sorted[swapIdx];
    await db.update(items).set({ position: b.position }).where(eq(items.id, a.id));
    await db.update(items).set({ position: a.position }).where(eq(items.id, b.id));
    return { ok: true };
  }
  if (entity === "menu") {
    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, Number(id))).limit(1);
    if (!row) return { ok: false };
    const siblings = await db.select().from(menuItems).where(eq(menuItems.area, row.area));
    const sorted = siblings.sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((s) => s.id === Number(id));
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return { ok: false };
    const a = sorted[idx]; const b = sorted[swapIdx];
    await db.update(menuItems).set({ position: b.position }).where(eq(menuItems.id, a.id));
    await db.update(menuItems).set({ position: a.position }).where(eq(menuItems.id, b.id));
    return { ok: true };
  }
  return { ok: false };
}

type TranslatableRef = {
  apply: (patch: Record<string, string>) => Promise<void>;
  current: Record<string, string>;
  label: string;
};

/** Fills every missing translation across the portal. Returns per-language counters. */
export async function translateEverything(defaultLang: string, langs: string[]) {
  await ensureReady();
  const targets = langs.filter((l) => l !== defaultLang);
  if (!targets.length) return { updated: 0, fields: 0 };

  const [itemRows, pageRows, menuRows, uiRows, settingsRows] = await Promise.all([
    db.select().from(items), db.select().from(pages), db.select().from(menuItems),
    db.select().from(uiStrings), db.select().from(settings).where(eq(settings.id, "portal")).limit(1),
  ]);

  const jobs: { source: string; target: string; ref: TranslatableRef }[] = [];
  const push = (value: unknown, target: string, ref: Omit<TranslatableRef, "apply"> & { apply: TranslatableRef["apply"] }) => {
    const ml = value as Record<string, string> | null;
    if (!ml || typeof ml !== "object") return;
    const source = ml[defaultLang];
    if (!source) return;
    if (ml[target]?.trim()) return;
    jobs.push({ source, target, ref });
  };

  for (const row of itemRows) {
    for (const field of ["title", "dek", "body"] as const) {
      for (const target of targets) {
        push(row[field], target, {
          current: (row[field] || {}) as Record<string, string>,
          label: `${row.id}.${field}`,
          apply: async (patch) => {
            await db.update(items).set({ [field]: patch, updatedAt: new Date() } as Record<string, unknown>).where(eq(items.id, row.id));
          },
        });
      }
    }
  }
  for (const row of pageRows) {
    for (const field of ["title", "subtitle", "kicker"] as const) {
      for (const target of targets) {
        push(row[field], target, {
          current: (row[field] || {}) as Record<string, string>,
          label: `${row.slug}.${field}`,
          apply: async (patch) => {
            await db.update(pages).set({ [field]: patch, updatedAt: new Date() } as Record<string, unknown>).where(eq(pages.slug, row.slug));
          },
        });
      }
    }
    await translateBlocks(row.slug, row.blocks || [], defaultLang, targets);
  }
  for (const row of menuRows) {
    for (const target of targets) {
      push(row.label, target, {
        current: (row.label || {}) as Record<string, string>,
        label: `menu.${row.id}`,
        apply: async (patch) => { await db.update(menuItems).set({ label: patch }).where(eq(menuItems.id, row.id)); },
      });
    }
  }
  for (const row of uiRows) {
    for (const target of targets) {
      push(row.values, target, {
        current: (row.values || {}) as Record<string, string>,
        label: `ui.${row.key}`,
        apply: async (patch) => { await db.update(uiStrings).set({ values: patch }).where(eq(uiStrings.key, row.key)); },
      });
    }
  }
  const settingsData = (settingsRows[0]?.data || {}) as Record<string, unknown>;
  for (const field of ["slogan", "heroKicker", "heroTitle", "heroText", "footerText"]) {
    for (const target of targets) {
      push(settingsData[field], target, {
        current: (settingsData[field] || {}) as Record<string, string>,
        label: `settings.${field}`,
        apply: async (patch) => {
          const next = setPath(settingsData, field, patch);
          await db.update(settings).set({ data: next, updatedAt: new Date() }).where(eq(settings.id, "portal"));
        },
      });
    }
  }

  // group by target language so providers are called in batches
  let fields = 0;
  for (const target of targets) {
    const batch = jobs.filter((j) => j.target === target);
    if (!batch.length) continue;
    const CHUNK = 40;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const slice = batch.slice(i, i + CHUNK);
      const { results } = await translateBatch(slice.map((j) => j.source), defaultLang, target);
      const grouped = new Map<TranslatableRef, Record<string, string>>();
      slice.forEach((job, index) => {
        const patch = grouped.get(job.ref) || { ...job.ref.current };
        patch[target] = results[index] || job.source;
        grouped.set(job.ref, patch);
      });
      for (const [ref, patch] of grouped) { await ref.apply(patch); fields++; }
    }
  }

  await log("translation", null, "translate-all", `${fields} campos`);
  return { updated: fields, fields, jobs: jobs.length };
}

async function translateBlocks(slug: string, blocks: unknown[], defaultLang: string, targets: string[]) {
  const walk = async (node: unknown, path: string) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) await walk(node[i], `${path}.${i}`);
      return;
    }
    const obj = node as Record<string, unknown>;
    const looksML = typeof obj.pt === "string" || typeof obj[defaultLang] === "string";
    if (looksML && Object.values(obj).every((v) => typeof v === "string")) {
      const source = obj[defaultLang] as string;
      if (!source) return;
      const missing = targets.filter((t) => !(obj[t] as string)?.trim());
      if (!missing.length) return;
      const { results } = await translateBatch(missing.map(() => source), defaultLang, missing[0]);
      const patch = { ...obj } as Record<string, string>;
      for (const target of missing) {
        const index = missing.indexOf(target);
        patch[target] = results[index] || source;
      }
      const [row] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
      const next = setPath({ blocks: row?.blocks || [] }, `blocks${path}`, patch).blocks;
      await db.update(pages).set({ blocks: next as unknown[], updatedAt: new Date() }).where(eq(pages.slug, slug));
      return;
    }
    for (const [key, value] of Object.entries(obj)) await walk(value, path ? `${path}.${key}` : key);
  };
  await walk(blocks, "");
}
