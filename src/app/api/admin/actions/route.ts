import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady, seedIfEmpty } from "@/db/ensure";
import { languages } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";
import { moveEntity, removeEntity, translateEverything, type Entity } from "@/lib/admin-store";
import { ENGINE_LABEL, activeEngine } from "@/lib/translate";

async function requireAdmin(request: Request) {
  return (await isAdminRequest(request)) ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as {
    action: "delete" | "move" | "translate-all" | "reset";
    entity?: Entity; id?: string; direction?: -1 | 1;
  };
  await ensureReady();

  try {
    if (body.action === "delete" && body.entity && body.id) {
      return NextResponse.json(await removeEntity(body.entity, body.id));
    }
    if (body.action === "move" && body.entity && body.id) {
      return NextResponse.json(await moveEntity(body.entity, body.id, body.direction === -1 ? -1 : 1));
    }
    if (body.action === "translate-all") {
      const langs = await db.select().from(languages).where(eq(languages.enabled, true));
      const defaultLang = langs.find((l) => l.isDefault)?.code || "pt";
      const result = await translateEverything(defaultLang, langs.map((l) => l.code));
      return NextResponse.json({ ...result, engine: ENGINE_LABEL[activeEngine()] });
    }
    if (body.action === "reset") {
      const result = await seedIfEmpty(true);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "ação inválida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
