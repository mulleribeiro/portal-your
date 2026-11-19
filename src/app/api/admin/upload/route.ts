import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { media } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";
import { log } from "@/lib/admin-store";

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureReady();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "arquivo ausente" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "envie uma imagem" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "imagem maior que 15 MB" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db.insert(media)
    .values({ name: file.name, mime: file.type, size: buffer.length, data: buffer })
    .returning({ id: media.id });
  await log("media", String(row.id), "upload", file.name);
  return NextResponse.json({ id: row.id, url: `/api/media/${row.id}` });
}
