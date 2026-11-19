import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PROJECT_ARCHIVE_NAME = "your-magazine-cloudflare.zip";

/** Fixed public export assets only; never accepts an arbitrary filesystem path. */
export async function readProjectAsset(request: Request, name: "manifest.json" | typeof PROJECT_ARCHIVE_NAME): Promise<Uint8Array | null> {
  let assets: { fetch: (request: Request) => Promise<Response> } | undefined;
  try { assets = getCloudflareContext().env.ASSETS; } catch { /* local Next.js runtime */ }
  if (assets) {
    const response = await assets.fetch(new Request(new URL(`/downloads/${name}`, request.url), { method: "GET" }));
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
  }
  try {
    return new Uint8Array(await readFile(path.join(process.cwd(), "public", "downloads", name)));
  } catch { return null; }
}
