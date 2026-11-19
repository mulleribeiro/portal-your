"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { GitHubPublish } from "./GitHubPublish";

type Manifest = { filename: string; files: number; bytes: number; generatedAt: string; sha256: string };
type Phase = "idle" | "preparing" | "ready" | "error";
const FILE_NAME = "your-magazine-cloudflare.zip";

export function ProjectDownload() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"github" | "zip">("github");
  const [phase, setPhase] = useState<Phase>("idle");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [blobUrl, setBlobUrl] = useState("");
  const [error, setError] = useState("");
  const [saveClicked, setSaveClicked] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const show = () => { setMode("github"); setOpen(true); };
    window.addEventListener("your:download-project", show);
    return () => {
      window.removeEventListener("your:download-project", show);
      abortRef.current?.abort();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || manifest || mode !== "zip") return;
    const controller = new AbortController();
    fetch("/api/project-download?info=1", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.filename) setManifest(data as Manifest); })
      .catch(() => {});
    return () => controller.abort();
  }, [open, manifest, mode]);

  const prepare = async () => {
    if (phase === "preparing") return;
    setPhase("preparing"); setError(""); setSaveClicked(false);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/project-download", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("A plataforma não liberou o arquivo. Use a opção Enviar ao GitHub, que não depende de download.");
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) throw new Error("A plataforma devolveu uma página em vez do ZIP. Use o envio direto ao GitHub.");
      if (manifest?.sha256 && window.crypto?.subtle) {
        const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
        const checksum = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
        if (checksum !== manifest.sha256) { setManifest(null); throw new Error("O pacote foi atualizado. Prepare o arquivo novamente."); }
      }
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/zip" }));
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url; setBlobUrl(url); setPhase("ready");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Falha ao preparar o arquivo."); setPhase("error");
    }
  };

  return (
    <>
      <button type="button" className="fixed bottom-4 left-4 z-[80] inline-flex items-center gap-2 rounded-full border border-gold/60 bg-surface px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[.1em] text-paper shadow-xl transition hover:border-blush hover:text-blush" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-controls="project-download-dialog">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5" /></svg>
        Publicar / Exportar
      </button>
      <Modal open={open} onClose={close} labelledBy="project-download-heading">
        <section id="project-download-dialog" className="modal-card !max-w-[650px] !p-6 sm:!p-8" onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><p className="eyebrow mb-2">Leve o portal para sua conta</p><h2 id="project-download-heading" className="font-display text-3xl font-extrabold uppercase">Publicar sem depender do ZIP</h2></div>
            <button type="button" className="chip" onClick={close} aria-label="Fechar exportação">✕</button>
          </div>
          <div className="mb-5 flex flex-wrap gap-2">
            <button type="button" className="chip" data-on={mode === "github"} onClick={() => setMode("github")}>Enviar ao GitHub — sem download</button>
            <button type="button" className="chip" data-on={mode === "zip"} onClick={() => setMode("zip")}>Arquivo ZIP</button>
          </div>
          {mode === "github" ? <GitHubPublish /> : (
            <div className="grid gap-4">
              <p className="text-sm text-mute">Se os downloads estiverem bloqueados pela plataforma, não adianta clicar várias vezes: escolha Enviar ao GitHub para transferir o código sem salvar arquivos.</p>
              <div className="rounded-xl border border-line bg-ink/40 p-4"><b className="break-all text-sm">{FILE_NAME}</b><p className="mt-1 text-xs text-mute">{manifest ? `${(manifest.bytes / 1024 / 1024).toFixed(2)} MB · ${manifest.files} arquivos` : "Código-fonte completo"} · sem senhas e dados privados.</p></div>
              {phase !== "ready" ? (
                <button type="button" className="btn btn-gold !w-full !py-3" onClick={prepare} disabled={phase === "preparing"}>{phase === "preparing" ? "Preparando…" : "Preparar arquivo ZIP"}</button>
              ) : (
                <div className="grid gap-3">
                  <p className="text-sm text-blush">Arquivo preparado e verificado.</p>
                  <a className="btn btn-pri inline-flex justify-center !py-3" href={blobUrl} download={FILE_NAME} onClick={() => setSaveClicked(true)}>↓ Salvar ZIP no computador</a>
                  {saveClicked && <p className="text-xs text-mute">Se nada aconteceu, o salvamento está bloqueado pelo navegador da plataforma. Use a opção de envio ao GitHub.</p>}
                </div>
              )}
              {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
            <a href="/publicar.html" className="btn" onClick={close}>Guia Cloudflare</a>
            <button type="button" className="btn" onClick={close}>Fechar</button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-mute">Não existe link público permanente enquanto o portal não for publicado na sua conta. O envio ao GitHub exige sua autorização; o deploy e o banco do Cloudflare são configurados depois.</p>
        </section>
      </Modal>
    </>
  );
}
