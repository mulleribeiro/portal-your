import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { createHash } from "node:crypto";
import { GitHubPublishError, parseGitHubRepository, publishSourceToGitHub, sourceFilesFromZip } from "../src/lib/github-publish";

const archive = zipSync({
  "your-magazine/package.json": strToU8('{"name":"test-project"}'),
  "your-magazine/wrangler.toml": strToU8('name="test-worker"'),
  "your-magazine/public/brand/logo.png": new Uint8Array([137, 80, 78, 71]),
  "your-magazine/.env": strToU8("PRIVATE_TEST_CREDENTIAL=not-for-export"),
});
assert.deepEqual(parseGitHubRepository("https://github.com/example/your-magazine.git"), { owner: "example", repo: "your-magazine" });
assert.throws(() => parseGitHubRepository("https://not-github.invalid/project"), GitHubPublishError);
assert.equal(sourceFilesFromZip(archive).length, 3);
let initialized = false;
let advanced = false;
const paths: string[] = [];
const github = async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  assert.ok(url.startsWith("https://api.github.com/repos/example/your-magazine"));
  paths.push(url);
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  let result: unknown;
  let status = 200;
  if (url.endsWith("/repos/example/your-magazine")) result = { default_branch: "main", permissions: { push: true } };
  else if (url.includes("/git/ref/heads/main")) {
    if (!initialized) return Response.json({ message: "Not Found" }, { status: 404 });
    result = { object: { sha: "current-head" } };
  } else if (url.includes("/contents/YOUR-PROJETO.md")) { initialized = true; result = {}; }
  else if (url.endsWith("/git/commits/current-head")) result = { tree: { sha: "base-tree" } };
  else if (url.includes("/git/trees/base-tree")) result = { tree: [] };
  else if (url.endsWith("/git/blobs")) {
    const bytes = Buffer.from(body.content, "base64");
    assert.equal(body.encoding, "base64");
    const sha = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
    result = { sha }; status = 201;
  } else if (url.endsWith("/git/trees")) {
    assert.equal(body.base_tree, "base-tree");
    assert.equal(body.tree.length, 3);
    assert.ok(!JSON.stringify(body.tree).includes(".env"));
    result = { sha: "new-tree" }; status = 201;
  } else if (url.endsWith("/git/commits")) {
    assert.equal(body.tree, "new-tree"); assert.deepEqual(body.parents, ["current-head"]);
    result = { sha: "new-commit" }; status = 201;
  } else if (url.endsWith("/git/refs/heads/main")) {
    assert.equal(body.force, false); assert.equal(body.sha, "new-commit");
    advanced = true; result = {};
  } else throw new Error(`Unexpected test path: ${url}`);
  return Response.json(result, { status });
};

async function main() {
  const result = await publishSourceToGitHub({ repository: "example/your-magazine", token: "temporary-test-token-not-a-real-secret", confirmed: true, archive }, github as typeof fetch);
  assert.equal(result.ok, true); assert.equal(result.files, 3); assert.equal(result.repositoryUrl, "https://github.com/example/your-magazine"); assert.ok(advanced);
  await assert.rejects(() => publishSourceToGitHub({ repository: "example/your-magazine", token: "temporary-test-token-not-a-real-secret", confirmed: false, archive }, github as typeof fetch));
  console.log(`PASS: GitHub API contract tested with ${paths.length} mocked calls; no external repository was accessed; credentials excluded; non-forced commit update verified.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
