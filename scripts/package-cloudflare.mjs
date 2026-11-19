#!/usr/bin/env node
/** Creates the downloadable SOURCE archive; no .env, private submissions or build binaries. */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";

const root = process.cwd();
const entries = [];
const allowedDirectories = ["src", "public", "scripts"];
const rootFiles = [
  "package.json", "package-lock.json", "next.config.ts", "open-next.config.ts", "wrangler.toml",
  "tsconfig.json", "next-env.d.ts", "postcss.config.mjs", "eslint.config.mjs",
  "drizzle.config.ts", "deploy-cloudflare.sh", ".gitignore", ".env.example", "LEIA-ME-CLOUDFLARE.md",
];

function walk(relative) {
  const location = path.join(root, relative);
  if (!existsSync(location)) return;
  for (const item of readdirSync(location, { withFileTypes: true })) {
    const name = `${relative}/${item.name}`;
    if (item.name === "downloads" || item.name.startsWith(".env") || item.name === ".DS_Store") continue;
    if (item.isDirectory()) walk(name);
    else if (item.isFile() && !name.endsWith(".zip") && !name.endsWith(".tsbuildinfo")) {
      entries.push({ name, data: readFileSync(path.join(root, name)) });
    }
  }
}
for (const directory of allowedDirectories) walk(directory);
for (const name of rootFiles) if (existsSync(path.join(root, name))) entries.push({ name, data: readFileSync(path.join(root, name)) });

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  return crc >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const chunks = [];
const centralDirectory = [];
let offset = 0;
const date = new Date();
const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
for (const entry of entries) {
  const filename = Buffer.from(`your-magazine/${entry.name}`, "utf8");
  const compressed = deflateRawSync(entry.data, { level: 9 });
  const crc = crc32(entry.data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(day, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(entry.data.length, 22);
  local.writeUInt16LE(filename.length, 26);
  chunks.push(local, filename, compressed);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(day, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(entry.data.length, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE(offset, 42);
  centralDirectory.push(central, filename);
  offset += local.length + filename.length + compressed.length;
}
const directory = Buffer.concat(centralDirectory);
const footer = Buffer.alloc(22);
footer.writeUInt32LE(0x06054b50, 0);
footer.writeUInt16LE(entries.length, 8);
footer.writeUInt16LE(entries.length, 10);
footer.writeUInt32LE(directory.length, 12);
footer.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...chunks, directory, footer]);
const out = path.join(root, "public/downloads");
mkdirSync(out, { recursive: true });
const filename = "your-magazine-cloudflare.zip";
writeFileSync(path.join(out, filename), archive);
const manifest = {
  filename,
  files: entries.length,
  bytes: statSync(path.join(out, filename)).size,
  sha256: createHash("sha256").update(archive).digest("hex"),
  generatedAt: date.toISOString(),
  type: "source-project-opennext-workers",
};
writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
console.log(`Download: /downloads/${filename}`);
