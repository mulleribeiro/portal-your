"use client";

import { useState } from "react";
import { getAdminToken } from "@/lib/admin-session";
import { adminFetch } from "@/lib/admin-fetch";

type Result = { repositoryUrl: string; branch: string; files: number; unchanged?: boolean };

/** Explicit user-authorized transfer: a practical alternative to browser-blocked ZIP downloads. */
export function GitHubPublish() {
  const [repository, setRepository] = useState("");
  const [token, setToken] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !confirmed) return;
    setBusy(true);
    setError("");
    setResult(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 170000);
    try {
      const session = getAdminToken();
      const response = await adminFetch("/api/admin/publish/github", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", ...(session ? { "x-admin-token": session } : {}) },
        body: JSON.stringify({ repository: repository.trim(), token: token.trim(), confirmed }),
        signal: controller.signal,
      });
      const data = await response.json() as Result & { error?: string };
      if (!response.ok || data.error) throw new Error(data.error || "O GitHub não confirmou o envio.");
      setResult(data);
    } catch (cause) {
      setError(controller.signal.aborted ? "O envio demorou além do esperado. Confira o repositório antes de tentar de novo." : cause instanceof Error ? cause.message : "Falha ao enviar o projeto.");
    } finally {
      window.clearTimeout(timer);
      setToken("");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm leading-relaxed text-mute">
        <b className="text-paper">Sem baixar arquivos:</b> o portal envia os fontes diretamente ao seu repositório. Depois, você conecta esse repositório ao Cloudflare.
      </div>
      <ol className="grid list-decimal gap-2 pl-5 text-sm text-mute">
        <li>Entre primeiro no <a href="/admin" className="font-semibold text-blush underline">Admin</a>.</li>
        <li>Crie um repositório privado e dedicado em <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-blush underline">GitHub → New repository</a>.</li>
        <li>Crie uma autorização temporária em <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="text-blush underline">Fine-grained personal access token</a>: selecione apenas esse repositório e permita <b className="text-paper">Contents → Read and write</b>.</li>
      </ol>
      <label className="block">
        <span className="label">URL do seu repositório</span>
        <input className="field" autoComplete="off" value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="https://github.com/SEU-USUARIO/your-magazine" required disabled={busy} />
      </label>
      <label className="block">
        <span className="label">Token temporário do GitHub</span>
        <input className="field font-mono text-xs" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Cole a autorização somente neste campo" required disabled={busy} />
        <small className="mt-1 block text-xs leading-relaxed text-mute">Não envie tokens nesta conversa. O portal usa essa autorização só para a transferência, não a grava no banco e limpa o campo ao terminar. Você pode revogá-la depois no GitHub.</small>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-line bg-ink/30 p-3 text-xs leading-relaxed text-mute">
        <input type="checkbox" className="mt-1 shrink-0 accent-[#e9a7b8]" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={busy} />
        <span>Autorizo enviar o código para este repositório. Arquivos de mesmo nome serão atualizados. Usarei um repositório novo ou dedicado. Senhas, banco privado e pautas recebidas não serão enviados.</span>
      </label>
      <button type="submit" className="btn btn-gold !w-full !py-3" disabled={busy || !confirmed || !repository.trim() || !token.trim()}>
        {busy ? "Enviando arquivos ao GitHub… não feche esta janela" : "Enviar projeto ao meu GitHub — sem ZIP"}
      </button>
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
      {result && (
        <div role="status" className="rounded-xl border border-blush/50 bg-blush/10 p-4">
          <p className="font-semibold text-blush">✓ {result.unchanged ? "Seu repositório já está atualizado." : `${result.files} arquivos enviados ao repositório.`}</p>
          <a href={result.repositoryUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-paper underline">{result.repositoryUrl}</a>
          <p className="mt-3 text-xs text-mute">Próximo passo: no Cloudflare, conecte esse repositório como Worker. O site só estará publicado depois do deploy e da configuração de DATABASE_URL e da senha administrativa. Este envio não publica sozinho.</p>
          <a href="/publicar.html#passos" className="btn mt-3 inline-flex">Ver passos do Cloudflare</a>
        </div>
      )}
    </form>
  );
}
