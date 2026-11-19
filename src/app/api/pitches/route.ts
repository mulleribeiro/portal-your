import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { pitches } from "@/db/schema";
import { log } from "@/lib/admin-store";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

/** Public: submit a story pitch from the Press Room. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string; client?: string; journalist?: string; role?: string;
      email?: string; phone?: string; message?: string;
      photos?: string[]; docs?: string[]; lang?: string;
    };

    const name = String(body.name || "").trim();
    const message = String(body.message || "").trim();
    const journalist = String(body.journalist || "").trim();

    if (!name) return NextResponse.json({ error: "Informe o nome da pauta." }, { status: 400 });
    if (!journalist) return NextResponse.json({ error: "Informe o nome do jornalista ou assessor." }, { status: 400 });
    if (message.length < 20) return NextResponse.json({ error: "Descreva a pauta com pelo menos 20 caracteres." }, { status: 400 });
    if (body.email && !/.+@.+\..+/.test(body.email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    await ensureReady();
    const [row] = await db
      .insert(pitches)
      .values({
        name: name.slice(0, 220),
        client: String(body.client || "").trim().slice(0, 180) || null,
        journalist: journalist.slice(0, 180),
        role: String(body.role || "").trim().slice(0, 120) || null,
        email: String(body.email || "").trim().slice(0, 180) || null,
        phone: String(body.phone || "").trim().slice(0, 60) || null,
        message: message.slice(0, 8000),
        status: "novo",
        photos: asArray(body.photos),
        docs: asArray(body.docs),
        lang: String(body.lang || "pt").slice(0, 8),
        source: "press",
      })
      .returning({ id: pitches.id });

    await log("pitch", String(row.id), "create", name.slice(0, 120));

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Não foi possível registrar a pauta." }, { status: 500 });
  }
}

/** Received pitches contain private contact details and are only visible to the administrator. */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureReady();
  const rows = await db.select().from(pitches).orderBy(desc(pitches.createdAt)).limit(20);
  return NextResponse.json({ pitches: rows });
}
