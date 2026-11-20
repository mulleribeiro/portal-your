import { readdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { zipSync, type Zippable } from "fflate";

/**
 * Fallback that builds the project export in memory.
 * Used when public/downloads/*.zip is not present (fresh deployment or platform that
 * syncs the project without ignored files), so the download never dead-ends.
 */

export type ArchiveManifest = {
  filename: string; files: number; bytes: number; generatedAt: string; sha256: string;
};

const ROOT_FILES = [
  ".env.example", ".gitignore", "LEIA-ME-CLOUDFLARE.md", "YOUR-PROJETO.md", "deploy-cloudflare.sh",
  "drizzle.config.json", "drizzle.config.ts", "eslint.config.mjs", "next-env.d.ts", "next.config.ts",
  "open-next.config.ts", "package.json", "package-lock.json", "postcss.config.mjs", "tsconfig.json", "wrangler.toml",
];
const ROOT_DIRS = ["src", "scripts", "public"];
const EXCLUDED_DIRS = new Set(["node_modules", ".next", ".git", "downloads", ".open-next", "artifacts", "cloudflare-dist"]);
const EXCLUDED_FILES = new Set([".env", ".dev.vars", "your-magazine-cloudflare.zip", "manifest.json"]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

async function walk(absolute: string, relative: string, out: Zippable) {
  const info = await stat(absolute);
  if (info.isDirectory()) {
    for (const entry of await readdir(absolute)) {
      if (EXCLUDED_DIRS.has(entry)) continue;
      await walk(path.join(absolute, entry), `${relative}/${entry}`, out);
    }
    return;
  }
  const base = path.basename(absolute);
  if (EXCLUDED_FILES.has(base) || base.endsWith(".log") || info.size > MAX_FILE_BYTES) return;
  out[relative] = new Uint8Array(await readFile(absolute));
}

let cached: { bytes: Uint8Array; manifest: ArchiveManifest } | null = null;

/** Builds (once per process) the ZIP from the live project directory. */
export async function buildProjectArchive(force = false): Promise<{ bytes: Uint8Array; manifest: ArchiveManifest }> {
  if (cached && !force) return cached;
  const root = process.cwd();
  const files: Zippable = {};

  for (const name of ROOT_FILES) {
    try {
      const info = await stat(path.join(root, name));
      if (info.isFile()) files[name] = new Uint8Array(await readFile(path.join(root, name)));
    } catch { /* optional file */ }
  }
  for (const dir of ROOT_DIRS) {
    try { await walk(path.join(root, dir), dir, files); } catch { /* optional directory */ }
  }

  // Same layout as scripts/package-cloudflare.mjs: every entry lives under your-magazine/,
  // which is what the GitHub exporter (sourceFilesFromZip) requires to recognise the package.
  const prefixed: Zippable = {};
  for (const [name, data] of Object.entries(files)) prefixed[`your-magazine/${name}`] = data;

  const bytes = zipSync(prefixed, { level: 6 });
  const manifest: ArchiveManifest = {
    filename: "your-magazine-cloudflare.zip",
    files: Object.keys(files).length,
    bytes: bytes.byteLength,
    generatedAt: new Date().toISOString(),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  cached = { bytes, manifest };
  return cached;
}
