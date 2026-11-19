import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { activityLog, items, languages, media, menuItems, pages, settings, uiStrings } from "@/db/schema";
import { activeEngine, ENGINE_LABEL } from "@/lib/translate";

export type AdminMedia = { id: number; name: string; mime: string; size: number; createdAt: Date | string };

/** Single source of truth for the admin payload (used by both the API route and the server-rendered admin page). */
export async function getAdminData(admin: boolean) {
  await ensureReady();

  const [settingsRows, langs, menu, pageRows, itemRows, uiRows, mediaRows] = await Promise.all([
    db.select().from(settings).where(eq(settings.id, "portal")).limit(1),
    db.select().from(languages).orderBy(asc(languages.position)),
    db.select().from(menuItems).orderBy(asc(menuItems.area), asc(menuItems.position), asc(menuItems.id)),
    db.select().from(pages).orderBy(asc(pages.position)),
    db.select().from(items).orderBy(asc(items.type), asc(items.position)),
    db.select().from(uiStrings),
    admin
      ? db
          .select({ id: media.id, name: media.name, mime: media.mime, size: media.size, createdAt: media.createdAt })
          .from(media)
          .orderBy(desc(media.id))
      : Promise.resolve([] as AdminMedia[]),
  ]);

  const payload: Record<string, unknown> = {
    admin,
    engine: activeEngine(),
    engineLabel: ENGINE_LABEL[activeEngine()],
    settings: settingsRows[0]?.data || {},
    languages: langs,
    menu,
    pages: pageRows,
    // The list payload is intentionally light (only what the table renders).
    // Bodies and metadata are fetched on demand via /api/admin/item — otherwise
    // the payload reaches ~900 KB and breaks the preview iframe.
    items: (admin ? itemRows : itemRows.filter((i) => i.published && i.type !== "lead")).map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      dek: i.dek,
      category: i.category,
      image: i.image,
      url: i.url,
      featured: i.featured,
      published: i.published,
      position: i.position,
      meta: i.meta,
    })),
    ui: uiRows,
    media: mediaRows,
  };

  if (admin) {
    const log = await db.select().from(activityLog).orderBy(desc(activityLog.id)).limit(60);
    payload.log = log.map((entry) => ({ ...entry, at: entry.at instanceof Date ? entry.at.toISOString() : entry.at }));
  }

  return payload;
}
