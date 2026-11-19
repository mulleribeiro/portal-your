import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { media } from "@/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return new Response("not found", { status: 404 });
  await ensureReady();
  const [row] = await db.select().from(media).where(eq(media.id, numeric)).limit(1);
  if (!row) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
