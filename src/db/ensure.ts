import { sql } from "drizzle-orm";
import { db, cloudflareRequest } from "@/db";
import { activityLog, items, languages, menuItems, pages, settings, uiStrings } from "@/db/schema";
import { seedItems, seedLanguages, seedMenu, seedPages, seedSettings, seedUi } from "./seed-data";

const DDL = `
CREATE TABLE IF NOT EXISTS settings (
  id varchar(64) PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS languages (
  code varchar(8) PRIMARY KEY,
  name text NOT NULL,
  native_name text NOT NULL,
  flag text,
  is_default boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS menu_items (
  id serial PRIMARY KEY,
  parent_id integer,
  area text NOT NULL DEFAULT 'rail',
  "group" text,
  label jsonb NOT NULL,
  kind text NOT NULL DEFAULT 'route',
  href text NOT NULL DEFAULT '/',
  badge text,
  icon text,
  position integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS pages (
  slug varchar(190) PRIMARY KEY,
  template text NOT NULL DEFAULT 'custom',
  title jsonb NOT NULL,
  subtitle jsonb,
  kicker jsonb,
  image text,
  blocks jsonb,
  seo jsonb,
  show_in_menu boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS items (
  id varchar(190) PRIMARY KEY,
  type text NOT NULL,
  title jsonb NOT NULL,
  dek jsonb,
  body jsonb,
  category text,
  tags jsonb,
  image text,
  url text,
  meta jsonb,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ui_strings (
  key varchar(140) PRIMARY KEY,
  "group" text,
  values jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS activity_log (
  id serial PRIMARY KEY,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  detail text,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS media (
  id serial PRIMARY KEY,
  name text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL DEFAULT 0,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pitches (
  id serial PRIMARY KEY,
  name text NOT NULL,
  client text,
  journalist text,
  role text,
  email text,
  phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'novo',
  photos jsonb DEFAULT '[]',
  docs jsonb DEFAULT '[]',
  lang text DEFAULT 'pt',
  source text DEFAULT 'press',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_credentials (
  id varchar(64) PRIMARY KEY,
  password_hash text NOT NULL,
  session_secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash varchar(64) PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS items_type_idx ON items (type);
CREATE INDEX IF NOT EXISTS menu_area_idx ON menu_items (area);
CREATE INDEX IF NOT EXISTS pitches_status_idx ON pitches (status);
CREATE INDEX IF NOT EXISTS pitches_created_idx ON pitches (created_at);
`;

let ready: Promise<void> | null = null;
let initialized = false;
const workerInitializations = new WeakMap<object, Promise<void>>();

/** Never share pending request I/O between Cloudflare Worker requests. */
export function ensureReady(): Promise<void> {
  if (initialized) return Promise.resolve();
  const request = cloudflareRequest();
  const prepare = async () => {
    for (const stmt of DDL.split(";\n")) {
      const s = stmt.trim();
      if (s) await db.execute(sql.raw(s));
    }
    await seedIfEmpty();
    initialized = true;
  };
  if (request) {
    let task = workerInitializations.get(request.key);
    if (!task) {
      task = prepare().catch((error) => {
        workerInitializations.delete(request.key);
        throw error;
      });
      workerInitializations.set(request.key, task);
    }
    return task;
  }
  if (!ready) ready = prepare().catch((error) => { ready = null; throw error; });
  return ready;
}

export async function seedIfEmpty(force = false) {
  const existing = await db.select({ id: settings.id, data: settings.data }).from(settings).limit(1);
  // Deployments must preserve the content edited in the production Admin.
  // Only the explicit authenticated reset action is destructive.
  if (existing.length && !force) return { seeded: false as const };

  if (force) {
    await db.delete(activityLog);
    await db.delete(items);
    await db.delete(pages);
    await db.delete(menuItems);
    await db.delete(uiStrings);
    await db.delete(languages);
    await db.delete(settings);
  }

  await db.insert(settings).values({ id: "portal", data: seedSettings as unknown as Record<string, unknown> })
    .onConflictDoUpdate({ target: settings.id, set: { data: seedSettings as unknown as Record<string, unknown>, updatedAt: new Date() } });

  await db.insert(languages).values(
    seedLanguages.map((l) => ({
      code: l.code, name: l.name, nativeName: l.nativeName, flag: l.flag,
      isDefault: l.isDefault, enabled: true, position: l.position,
    })),
  ).onConflictDoNothing();

  await db.insert(menuItems).values(
    seedMenu.map((m, i) => ({
      area: m.area, group: m.group, label: m.label, kind: m.kind, href: m.href,
      badge: m.badge || null, icon: m.icon || null, position: i, hidden: false,
    })),
  );

  await db.insert(pages).values(
    seedPages.map((p) => ({
      slug: p.slug, template: p.template,
      title: p.title, subtitle: p.subtitle ?? null, kicker: p.kicker ?? null,
      image: (p as { image?: string }).image || null, blocks: p.blocks ?? [], seo: null,
      showInMenu: p.showInMenu, published: p.published, position: p.position,
    })),
  ).onConflictDoNothing();

  await db.insert(uiStrings).values(
    seedUi.map((u) => ({ key: u.key, group: u.group, values: u.values })),
  ).onConflictDoNothing();

  await db.insert(items).values(
    seedItems.map((it, i) => ({
      id: it.id, type: it.type, title: it.title, dek: it.dek ?? null, body: it.body ?? null,
      category: it.category ?? null, tags: it.tags ?? [], image: it.image ?? null,
      url: it.url ?? null, meta: it.meta ?? {}, featured: it.featured ?? false,
      published: true, position: it.position ?? i,
    })),
  ).onConflictDoNothing();

  return { seeded: true as const, items: seedItems.length };
}
