import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { media } from "@/db/schema";

export const dynamic = "force-dynamic";

const MAX_FILES = 10;
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

/**
 * Public upload endpoint used by the Press Room pitch form.
 * Accepts photos and PDFs, stores them in the media table and returns public URLs.
 */
export async function POST(request: Request) {
  try {
    await ensureReady();
    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (!files.length) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ error: `Máximo de ${MAX_FILES} arquivos por envio.` }, { status: 400 });

    const photos: string[] = [];
    const docs: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        skipped.push(`${file.name} (tipo não permitido)`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        skipped.push(`${file.name} (maior que 15 MB)`);
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const [row] = await db
        .insert(media)
        .values({ name: file.name, mime: file.type, size: buffer.length, data: buffer })
        .returning({ id: media.id });

      const url = `/api/media/${row.id}`;
      if (file.type === "application/pdf") docs.push(url);
      else photos.push(url);
    }

    return NextResponse.json({ ok: true, photos, docs, skipped });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Falha no upload." }, { status: 500 });
  }
}
