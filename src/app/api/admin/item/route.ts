import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { items } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Returns one item with its FULL body (the admin list payload truncates bodies to stay light). */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureReady();
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });
  const [row] = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  return NextResponse.json({ item: row });
}

/** Authenticated read via POST keeps the session in the body. */
export const POST = GET;
