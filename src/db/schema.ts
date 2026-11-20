import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Single-row style key/value store for global site configuration. */
export const settings = pgTable("settings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  data: jsonb("data").notNull().$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Languages available on the portal. `code` is the URL prefix (pt, en, es, ...). */
export const languages = pgTable("languages", {
  code: varchar("code", { length: 8 }).primaryKey(),
  name: text("name").notNull(),
  nativeName: text("native_name").notNull(),
  flag: text("flag"),
  isDefault: boolean("is_default").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  position: integer("position").notNull().default(0),
});

/** Every menu entry (side rail, top bar, footer) is a row here. */
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  area: text("area").notNull().default("rail"),
  group: text("group"),
  label: jsonb("label").notNull().$type<Record<string, string>>(),
  kind: text("kind").notNull().default("route"),
  href: text("href").notNull().default("/"),
  badge: text("badge"),
  icon: text("icon"),
  position: integer("position").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false),
});

/** Editable pages: templates (news, covers...) plus free-form pages built from blocks. */
export const pages = pgTable("pages", {
  slug: varchar("slug", { length: 190 }).primaryKey(),
  template: text("template").notNull().default("custom"),
  title: jsonb("title").notNull().$type<Record<string, string>>(),
  subtitle: jsonb("subtitle").$type<Record<string, string>>(),
  kicker: jsonb("kicker").$type<Record<string, string>>(),
  image: text("image"),
  blocks: jsonb("blocks").$type<unknown[]>(),
  seo: jsonb("seo").$type<Record<string, string>>(),
  showInMenu: boolean("show_in_menu").notNull().default(true),
  published: boolean("published").notNull().default(true),
  position: integer("position").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** All editorial content: articles, covers, issues, videos, columnists, brands, hotels, dining... */
export const items = pgTable("items", {
  id: varchar("id", { length: 190 }).primaryKey(),
  type: text("type").notNull(),
  title: jsonb("title").notNull().$type<Record<string, string>>(),
  dek: jsonb("dek").$type<Record<string, string>>(),
  body: jsonb("body").$type<Record<string, string>>(),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  image: text("image"),
  url: text("url"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Interface copy that can be translated per language. */
export const uiStrings = pgTable("ui_strings", {
  key: varchar("key", { length: 140 }).primaryKey(),
  group: text("group"),
  values: jsonb("values").notNull().$type<Record<string, string>>(),
});

/** Activity log of every change made through the admin panel. */
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  action: text("action").notNull(),
  detail: text("detail"),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
});

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/** Uploaded images (logos, covers, banners, icons). Served by /api/media/[id]. */
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull().default(0),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SettingsRow = typeof settings.$inferSelect;
export type LanguageRow = typeof languages.$inferSelect;
export type MenuItemRow = typeof menuItems.$inferSelect;
export type PageRow = typeof pages.$inferSelect;
export type ItemRow = typeof items.$inferSelect;
export type UiStringRow = typeof uiStrings.$inferSelect;
export type ActivityRow = typeof activityLog.$inferSelect;
export type MediaRow = typeof media.$inferSelect;

/** Persistent administrator credentials. Never included in content exports or the source ZIP. */
export const adminCredentials = pgTable("admin_credentials", {
  id: varchar("id", { length: 64 }).primaryKey(),
  passwordHash: text("password_hash").notNull(),
  sessionSecret: text("session_secret").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Revocable admin sessions: only the SHA-256 digest is persisted, never the bearer token. */
export const adminSessions = pgTable("admin_sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** Story pitches submitted by journalists, PR staff and readers from the Press Room. */
export const pitches = pgTable("pitches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  client: text("client"),
  journalist: text("journalist"),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  message: text("message").notNull(),
  status: text("status").notNull().default("novo"),
  photos: jsonb("photos").$type<string[]>(),
  docs: jsonb("docs").$type<string[]>(),
  lang: text("lang").default("pt"),
  source: text("source").default("press"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PitchRow = typeof pitches.$inferSelect;

/** Newsletter subscriptions with explicit consent and a normalized unique email. */
export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  source: varchar("source", { length: 80 }).notNull().default("footer"),
  lang: varchar("lang", { length: 8 }).notNull().default("pt"),
  consentAt: timestamp("consent_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EmailSubscriberRow = typeof emailSubscribers.$inferSelect;

/** Shape of the portal settings document. */
export type PortalSettings = {
  version?: number;
  brand?: string;
  brandSub?: string;
  slogan?: Record<string, string>;
  logo?: string;
  heroKicker?: Record<string, string>;
  heroTitle?: Record<string, string>;
  heroText?: Record<string, string>;
  stats?: { value: string; label: Record<string, string> }[];
  audience?: { value: string; label: Record<string, string> }[];
  audienceBreakdown?: { label: Record<string, string>; value: number }[];
  genderWomen?: number;
  network?: { value: string; label: Record<string, string> }[];
  channels?: { label: Record<string, string>; value: number }[];
  formats?: { id: string; name: Record<string, string>; desc: Record<string, string>; price: number; reach: number }[];
  relationsOptions?: { id: string; name: Record<string, string>; desc?: Record<string, string>; price: number; reach: number; formats: number }[];
  catalog?: Record<string, unknown>;
  relationsSteps?: { step: string; title: Record<string, string>; desc: Record<string, string>; deliverable: Record<string, string> }[];
  links?: Record<string, { label: Record<string, string>; href: string }>;
  images?: Record<string, { label: string; url: string }>;
  email?: string;
  phone?: string;
  address?: Record<string, string>;
  social?: { label: string; url: string }[];
  ticker?: { text: Record<string, string>; href?: string }[];
  theme?: Record<string, string>;
  footerText?: Record<string, string>;
  [key: string]: unknown;
};
