import { NextResponse } from "next/server";
import { ensureReady } from "@/db/ensure";
import { items } from "@/db/schema";
import { db } from "@/db";
import { log } from "@/lib/admin-store";
import { slugify } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string; email?: string; brand?: string; lang?: string; plan?: string[]; total?: number; reach?: number;
  };
  if (!body.email || !/.+@.+\..+/.test(body.email)) {
    return NextResponse.json({ ok: false, error: "E-mail inválido" }, { status: 400 });
  }
  await ensureReady();
  const id = `lead-${slugify(body.email)}-${Date.now().toString(36)}`;
  await db.insert(items).values({
    id,
    type: "lead",
    title: { pt: `${body.brand || "Lead"} — ${body.name || body.email}` },
    dek: { pt: `Plano: ${(body.plan || []).join(", ")} · total R$ ${body.total || 0}` },
    category: "Media Relations",
    meta: { email: body.email, name: body.name, brand: body.brand, plan: body.plan, total: body.total, reach: body.reach, lang: body.lang },
    published: false,
    position: 0,
  }).onConflictDoNothing();
  await log("lead", id, "create", body.email);
  return NextResponse.json({ ok: true, id });
}
