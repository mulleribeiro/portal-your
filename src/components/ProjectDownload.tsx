"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { GitHubPublish } from "./GitHubPublish";

type Manifest = { filename: string; files: number; bytes: number; generatedAt: string; sha256: string };

const FILE_NAME = "your-magazine-cloudflare.zip";
const FILE_PATH = `/downloads/${FILE_NAME}`;

export function ProjectDownload() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"github" | "zip">("github");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const close = useCallback(() => setOpen(false), []);

  /**
   * Fetches the archive and saves it through a blob URL. Opening the URL in a new tab does not
   * work: the platform serves previews only inside its own interface ("Preview Unavailable").
   */
  const download = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/project-download", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(`o servidor respondeu ${response.status}`);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("a resposta não é um ZIP válido");
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setStatus(`Arquivo salvo: ${FILE_NAME} · ${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      setStatus(`Falha ao baixar (${(error as Error).message}). Use a aba Enviar ao GitHub, que não depende de download.`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("your:download-project", show);
    return () => window.removeEventListener("your:download-project", show);
  }, []);

  useEffect(() => {
    if (!open || manifest) return;
    const controller = new AbortController();
    fetch("/api/project-download?info=1", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.filename) setManifest(data as Manifest); })
      .catch(() => {});
    return () => controller.abort();
  }, [open, manifest]);

  const copyPath = async () => {
    try {
      await navigator.clipboard?.writeText(FILE_PATH);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 left-4 z-[80] inline-flex items-center gap-2 rounded-full border border-gold/60 bg-surface px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[.1em] text-paper shadow-xl transition hover:border-blush hover:text-blush"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-controls="project-download-dialog"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5" /></svg>
        Publicar / Exportar
      </button>

      <Modal open={open} onClose={close} labelledBy="project-download-heading">
        <section id="project-download-dialog" className="modal-card !max-w-[650px] !p-6 sm:!p-8" onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Leve o portal para sua conta</p>
              <h2 id="project-download-heading" className="font-display text-3xl font-extrabold uppercase">Exportar o projeto</h2>
            </div>
            <button type="button" className="chip" onClick={close} aria-label="Fechar exportação">✕</button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <button type="button" className="chip" data-on={mode === "zip"} onClick={() => setMode("zip")}>Arquivo ZIP</button>
            <button type="button" className="chip" data-on={mode === "github"} onClick={() => setMode("github")}>Enviar ao GitHub</button>
          </div>

          {mode === "zip" ? (
            <div className="grid gap-4">
              <div className="rounded-xl border border-line bg-ink/40 p-4">
                <b className="break-all text-sm">{FILE_NAME}</b>
                <p className="mt-1 text-xs text-mute">
                  {manifest ? `${(manifest.bytes / 1024 / 1024).toFixed(2)} MB · ${manifest.files} arquivos · gerado em ${new Date(manifest.generatedAt).toLocaleString("pt-BR")}` : "Código-fonte completo"}
                  {" "}· sem senhas, banco de dados ou formulários recebidos.
                </p>
              </div>

              <button type="button" className="btn btn-gold !w-full !py-3" onClick={download} disabled={busy}>
                {busy ? "Preparando o arquivo…" : "↓ Baixar ZIP do projeto"}
              </button>
              {status && (
                <p role="status" className={`text-sm ${status.startsWith("Falha") ? "text-red-300" : "text-blush"}`}>{status}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <a className="btn" href="/api/project-download" download={FILE_NAME}>Baixar pelo navegador</a>
                <button type="button" className="btn" onClick={copyPath}>{copied ? "Link copiado" : "Copiar link do arquivo"}</button>
              </div>

              <div className="rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed text-mute">
                <p className="mb-2 text-paper"><b>O que vem no pacote:</b></p>
                <p>Fontes em <code className="font-mono">src/</code>, imagens em <code className="font-mono">public/</code>, scripts, configurações do Next.js e do Cloudflare, além das instruções de publicação.</p>
                <p className="mt-2">Se a prévia bloquear downloads, use <b className="text-paper">Enviar ao GitHub</b>, que transfere os mesmos fontes direto para um repositório seu. O arquivo também fica disponível no caminho <code className="break-all font-mono">{FILE_PATH}</code>.</p>
              </div>
            </div>
          ) : <GitHubPublish />}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
            <a href="/publicar.html" className="btn" onClick={close}>Guia Cloudflare</a>
            <button type="button" className="btn" onClick={close}>Fechar</button>
          </div>
        </section>
      </Modal>
    </>
  );
}
