#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const mode = process.argv[2] || "build";
const root = process.cwd();
const isWin = process.platform === "win32";
const npx = isWin ? "npx.cmd" : "npx";
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit", shell: isWin });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
function copyTree(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(source, target);
    else if (entry.isFile()) copyFileSync(source, target);
  }
}

if (mode === "build") {
  // Recreate the source ZIP from the checked-out project, without secrets or recursive ZIPs.
  run(process.execPath, ["scripts/package-cloudflare.mjs"]);
  // --webpack is supported by OpenNext; a regular local build may still use Turbopack.
  run(npx, ["next", "build", "--webpack"], { ...process.env, CF_BUILD: "1" });
  run(npx, ["opennextjs-cloudflare", "build", "--skipNextBuild"]);
  copyTree(path.join(root, "public"), path.join(root, ".open-next/assets"));
  console.log("\nWorker Cloudflare gerado em .open-next/worker.js");
} else if (mode === "deploy") {
  if (!existsSync(".open-next/worker.js")) {
    console.error("Antes de publicar, execute: node scripts/cloudflare.mjs build");
    process.exit(1);
  }
  run(npx, ["opennextjs-cloudflare", "deploy"]);
} else if (mode === "preview") {
  run(npx, ["opennextjs-cloudflare", "preview"]);
} else {
  console.error("Uso: node scripts/cloudflare.mjs build|deploy|preview");
  process.exit(1);
}
