import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { saveItem, saveLanguage, saveMenu, savePage, saveSettings, saveUi, type ItemPayload } from "@/lib/admin-store";
import { ensureReady } from "@/db/ensure";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { entity: string; data: Record<string, never> & Record<string, unknown> };
  const { entity, data } = body;
  await ensureReady();

  try {
    if (entity === "item") return NextResponse.json(await saveItem(data as unknown as ItemPayload, "pt"));
    if (entity === "page") return NextResponse.json(await savePage(data as never));
    if (entity === "menu") return NextResponse.json(await saveMenu(data as never));
    if (entity === "ui") return NextResponse.json(await saveUi(String(data.key), data.values as Record<string, string>, String(data.group || "custom")));
    if (entity === "language") return NextResponse.json(await saveLanguage(data as never));
    if (entity === "settings") {
      const [row] = await db.select().from(settingsTable).where(eq(settingsTable.id, "portal")).limit(1);
      return NextResponse.json(await saveSettings({ ...(row?.data || {}), ...data }));
    }
    return NextResponse.json({ error: "entidade desconhecida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
