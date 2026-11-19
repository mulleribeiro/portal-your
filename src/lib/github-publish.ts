import { createHash } from "node:crypto";
import { unzipSync } from "fflate";

type SourceFile = { path: string; bytes: Uint8Array };
type Fetcher = typeof fetch;

export class GitHubPublishError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "GitHubPublishError"; }
}

export function parseGitHubRepository(input: string): { owner: string; repo: string } {
  const value = input.trim().replace(/^https:\/\/github\.com\//i, "").replace(/\/$/, "").replace(/\.git$/i, "");
  const match = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}))\/([a-zA-Z0-9_.-]{1,100})$/.exec(value);
  if (!match || match[2] === "." || match[2] === "..") throw new GitHubPublishError(400, "Use a URL de um repositório GitHub: https://github.com/USUARIO/your-magazine.");
  return { owner: match[1], repo: match[2] };
}

export function sourceFilesFromZip(archive: Uint8Array): SourceFile[] {
  if (archive.byteLength > 12 * 1024 * 1024) throw new GitHubPublishError(400, "Pacote de código maior que o limite de exportação.");
  const extracted = unzipSync(archive, { filter: (file) => file.originalSize <= 4 * 1024 * 1024 });
  const result: SourceFile[] = [];
  let total = 0;
  for (const [name, bytes] of Object.entries(extracted)) {
    if (!name.startsWith("your-magazine/") || name.endsWith("/")) continue;
    const file = name.slice("your-magazine/".length);
    const pieces = file.split("/");
    if (!file || pieces.some((piece) => !piece || piece === "." || piece === ".." || piece === "node_modules" || piece === ".next" || piece === ".open-next" || piece === "downloads" || piece === ".git")) continue;
    if (pieces.some((piece) => (piece.startsWith(".env") && piece !== ".env.example") || piece.startsWith(".dev.vars"))) continue;
    if (file.endsWith(".zip") || file.startsWith(".github/workflows/")) continue;
    total += bytes.byteLength;
    if (total > 16 * 1024 * 1024 || result.length >= 1000) throw new GitHubPublishError(400, "O pacote excede o limite de arquivos para envio.");
    result.push({ path: file, bytes });
  }
  if (!result.some((file) => file.path === "package.json") || !result.some((file) => file.path === "wrangler.toml")) throw new GitHubPublishError(400, "Pacote incompleto: faltam configurações de publicação.");
  return result;
}

function apiMessage(status: number): string {
  if (status === 401) return "O GitHub não aceitou esse token. Gere uma autorização válida para o repositório escolhido.";
  if (status === 403) return "Sem permissão no GitHub. O token precisa de Contents: Read and write neste repositório (e autorização da organização, se houver).";
  if (status === 404) return "Repositório ou branch não encontrado. Crie o repositório primeiro e confira se o token tem acesso a ele.";
  if (status === 409 || status === 422) return "O GitHub recusou a atualização. Confira a branch e eventuais regras de proteção. Nenhuma atualização forçada é realizada.";
  if (status === 429) return "O GitHub limitou as requisições temporariamente. Aguarde alguns minutos antes de tentar novamente.";
  return "Não foi possível concluir o envio ao GitHub. Tente novamente mais tarde.";
}

/** Uses the documented GitHub Git Database API. No token is persisted, logged or included in the commit. */
export async function publishSourceToGitHub(options: {
  repository: string; token: string; archive: Uint8Array; confirmed: boolean;
}, fetcher: Fetcher = fetch) {
  if (!options.confirmed) throw new GitHubPublishError(400, "Confirme que deseja enviar o código para este repositório.");
  const { owner, repo } = parseGitHubRepository(options.repository);
  const token = options.token.trim();
  if (token.length < 20 || token.length > 600 || /\s/.test(token)) throw new GitHubPublishError(400, "Informe um token GitHub válido, sem espaços.");
  const files = sourceFilesFromZip(options.archive);
  const prefix = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  async function api<T>(resource: string, method = "GET", body?: unknown, allowMissing = false): Promise<T | null> {
    const response = await fetcher(`https://api.github.com${resource}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "YOUR-Magazine-Project-Publisher", "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (allowMissing && (response.status === 404 || response.status === 409)) return null;
    if (!response.ok) throw new GitHubPublishError(response.status, apiMessage(response.status));
    return response.json() as Promise<T>;
  }

  const repository = await api<{ default_branch: string; permissions?: { push?: boolean } }>(prefix);
  if (repository?.permissions?.push === false) throw new GitHubPublishError(403, apiMessage(403));
  const branch = repository?.default_branch || "main";
  const refResource = `${prefix}/git/ref/heads/${encodeURIComponent(branch)}`;
  let head = await api<{ object: { sha: string } }>(refResource, "GET", undefined, true);
  if (!head) {
    // GitHub cannot create Git references in an empty repo. Initialize it with the Contents API first.
    await api(`${prefix}/contents/YOUR-PROJETO.md`, "PUT", {
      message: "Inicializar portal YOUR Magazine",
      content: Buffer.from("# YOUR Magazine\nProjeto enviado pelo proprietário a partir da central de publicação.\n").toString("base64"),
    });
    head = await api<{ object: { sha: string } }>(refResource);
  }
  if (!head) throw new GitHubPublishError(409, "Não foi possível identificar a branch de destino.");
  const commit = await api<{ tree: { sha: string } }>(`${prefix}/git/commits/${head.object.sha}`);
  if (!commit) throw new GitHubPublishError(409, "Não foi possível identificar o commit atual.");
  const previousTree = await api<{ tree: { path: string; type: string; sha: string }[] }>(`${prefix}/git/trees/${commit.tree.sha}?recursive=1`);
  const existing = new Map((previousTree?.tree || []).filter((entry) => entry.type === "blob").map((entry) => [entry.path, entry.sha]));
  const entries: { path: string; mode: string; type: string; sha: string }[] = [];
  let index = 0;
  let changed = 0;

  async function upload() {
    while (index < files.length) {
      const file = files[index++];
      const bytes = Buffer.from(file.bytes);
      const gitSha = createHash("sha1").update(`blob ${bytes.byteLength}\0`).update(bytes).digest("hex");
      let sha = existing.get(file.path) === gitSha ? gitSha : "";
      if (!sha) {
        const blob = await api<{ sha: string }>(`${prefix}/git/blobs`, "POST", { content: bytes.toString("base64"), encoding: "base64" });
        if (!blob?.sha) throw new GitHubPublishError(502, "O GitHub não confirmou o envio de um arquivo.");
        sha = blob.sha;
        changed++;
      }
      entries.push({ path: file.path, mode: file.path.endsWith(".sh") ? "100755" : "100644", type: "blob", sha });
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, files.length) }, () => upload()));
  if (!changed) return { ok: true, repositoryUrl: `https://github.com/${owner}/${repo}`, branch, files: files.length, unchanged: true };
  const tree = await api<{ sha: string }>(`${prefix}/git/trees`, "POST", { base_tree: commit.tree.sha, tree: entries });
  if (!tree) throw new GitHubPublishError(502, "Falha ao criar a árvore de arquivos no GitHub.");
  const created = await api<{ sha: string }>(`${prefix}/git/commits`, "POST", { message: "Atualizar portal YOUR Magazine para Cloudflare Workers", tree: tree.sha, parents: [head.object.sha] });
  if (!created) throw new GitHubPublishError(502, "Falha ao confirmar a revisão no GitHub.");
  await api(`${prefix}/git/refs/heads/${encodeURIComponent(branch)}`, "PATCH", { sha: created.sha, force: false });
  return { ok: true, repositoryUrl: `https://github.com/${owner}/${repo}`, branch, files: files.length, commit: created.sha, unchanged: false };
}
