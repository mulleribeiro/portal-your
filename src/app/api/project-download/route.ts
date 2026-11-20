import { PROJECT_ARCHIVE_NAME, readProjectAsset } from "@/lib/project-archive";
import { buildProjectArchive } from "@/lib/project-pack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const HEADERS = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

/**
 * Serves the project export. Prefers the packaged file in public/downloads and,
 * when it is absent, builds the archive from the live sources on the fly.
 */
export async function GET(request: Request) {
  const infoOnly = new URL(request.url).searchParams.get("info") === "1";
  let stored = await readProjectAsset(request, infoOnly ? "manifest.json" : PROJECT_ARCHIVE_NAME);

  if (!infoOnly && stored && ZIP_MAGIC.some((byte, i) => stored![i] !== byte)) stored = null;

  if (infoOnly) {
    if (stored) {
      try {
        return Response.json(JSON.parse(new TextDecoder().decode(stored)), { headers: HEADERS });
      } catch { /* rebuild below */ }
    }
    try {
      const { manifest } = await buildProjectArchive();
      return Response.json(manifest, { headers: HEADERS });
    } catch (error) {
      return Response.json({ error: (error as Error).message || "Não foi possível gerar o pacote." }, { status: 500, headers: HEADERS });
    }
  }

  if (!stored) {
    try {
      const archive = await buildProjectArchive();
      stored = archive.bytes;
    } catch (error) {
      return Response.json(
        { error: `Não foi possível montar o ZIP nesta execução: ${(error as Error).message}. Use a exportação para GitHub.`, code: "ARCHIVE_FAILED" },
        { status: 500, headers: HEADERS },
      );
    }
  }

  return new Response(stored.slice().buffer, {
    headers: {
      ...HEADERS,
      "Content-Type": "application/zip",
      "Content-Length": String(stored.byteLength),
      "Content-Disposition": `attachment; filename="${PROJECT_ARCHIVE_NAME}"`,
    },
  });
}
