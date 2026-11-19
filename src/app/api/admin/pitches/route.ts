import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { pitches } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";
import { log } from "@/lib/admin-store";

export const dynamic = "force-dynamic";
const CACHE = { "Cache-Control": "private, no-store" };
const STATUSES = ["novo", "em_analise", "aprovado", "em_producao", "publicado", "recusado"];

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Sessão necessária." }, { status: 401, headers: CACHE });
  await ensureReady();
  return NextResponse.json({ pitches: await db.select().from(pitches).orderBy(desc(pitches.createdAt)) }, { headers: CACHE });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Sessão necessária." }, { status: 401, headers: CACHE });
  const body = await request.json().catch(() => ({})) as { id?: number; status?: string };
  const id = Number(body.id); const status = String(body.status || "");
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  await ensureReady();
  await db.update(pitches).set({ status, updatedAt: new Date() }).where(eq(pitches.id, id));
  await log("pitch", String(id), "status", status);
  return NextResponse.json({ ok: true }, { headers: CACHE });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Sessão necessária." }, { status: 401, headers: CACHE });
  const body = await request.json().catch(() => ({})) as { id?: number };
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  await ensureReady();
  await db.delete(pitches).where(eq(pitches.id, id));
  await log("pitch", String(id), "delete");
  return NextResponse.json({ ok: true }, { headers: CACHE });
}

/** Proxy-compatible transport for reads and mutations. */
export async function POST(request: Request) {
  const body = await request.clone().json().catch(() => ({})) as { __method?: string };
  const method = String(body.__method || "GET").toUpperCase();
  if (method === "GET") return GET(request);
  if (method === "PATCH") return PATCH(request);
  if (method === "DELETE") return DELETE(request);
  return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
}
