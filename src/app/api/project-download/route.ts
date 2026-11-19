import { PROJECT_ARCHIVE_NAME, readProjectAsset } from "@/lib/project-archive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const HEADERS = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  const infoOnly = new URL(request.url).searchParams.get("info") === "1";
  const bytes = await readProjectAsset(request, infoOnly ? "manifest.json" : PROJECT_ARCHIVE_NAME);
  if (!bytes) return Response.json({ error: "O pacote ainda não está disponível nesta versão. Use a exportação para GitHub ou reabra a prévia atual." }, { status: 404, headers: HEADERS });
  if (infoOnly) {
    try { return Response.json(JSON.parse(new TextDecoder().decode(bytes)), { headers: HEADERS }); }
    catch { return Response.json({ error: "Não foi possível ler os dados do pacote." }, { status: 500, headers: HEADERS }); }
  }
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) return Response.json({ error: "O pacote não é um ZIP válido." }, { status: 500, headers: HEADERS });
  return new Response(new Uint8Array(bytes).buffer, { headers: { ...HEADERS, "Content-Type": "application/zip", "Content-Length": String(bytes.byteLength), "Content-Disposition": `attachment; filename="${PROJECT_ARCHIVE_NAME}"` } });
}
