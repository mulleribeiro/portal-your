"use client";

import { useState } from "react";
import { useEdit, type EditTarget } from "./EditProvider";
import { uploadImage } from "@/lib/upload-client";

/** Image + optional Link that an authenticated editor can replace in place (URL or uploaded file). */
export function EditableImage({
  target, src, alt = "", linkTarget, linkUrl, imgClass = "",
}: {
  target: EditTarget;
  src?: string | null;
  alt?: string;
  linkTarget?: EditTarget;
  linkUrl?: string | null;
  imgClass?: string;
}) {
  const ctx = useEdit();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [href, setHref] = useState("");
  const [busy, setBusy] = useState(false);
  const editable = Boolean(ctx?.live && ctx.canEdit);

  const apply = async () => {
    if (!ctx) return;
    setBusy(true);
    let ok = true;
    if (url.trim() !== (src || "")) {
      ok = await ctx.save(target, { value: url.trim() });
    }
    if (ok && linkTarget && href.trim() !== (linkUrl || "")) {
      ok = await ctx.save(linkTarget, { value: href.trim() });
    }
    setBusy(false);
    if (ok) setOpen(false);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      setUrl(await uploadImage(file));
    } catch {
      ctx?.toast("Falha no upload");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {src ? <img src={src} alt={alt} loading="lazy" className={imgClass} /> : null}
      {editable && (
        <button
          type="button"
          aria-label="Trocar imagem ou link"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setUrl(src || "");
            setHref(linkUrl || "");
            setOpen(true);
          }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 transition hover:opacity-100 focus:opacity-100"
        >
          <span className="chip !border-transparent !bg-paper !text-ink">
            {linkTarget ? "✎ Imagem & Link" : "✎ Trocar imagem"}
          </span>
        </button>
      )}
      {open && (
        <div
          className="pop"
          style={{ left: "50%", top: "16%", transform: "translateX(-50%)" }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          role="dialog"
          aria-label="Editar imagem e link"
        >
          <p className="eyebrow mb-3">{target.label || "Imagem & Link"}</p>
          {url && <img src={url} alt="" className="mb-3 h-40 w-full rounded-lg object-cover" />}
          <span className="label">URL da imagem</span>
          <input className="field mb-2 font-mono text-xs" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… ou /api/media/…" />
          <label className="btn mb-3 inline-flex cursor-pointer">
            {busy ? "Enviando…" : "Enviar arquivo de imagem"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {linkTarget && (
            <div className="mb-3">
              <span className="label">Link ao clicar na capa / card (URL)</span>
              <input
                className="field font-mono text-xs"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="https://edicoesyour.online/e/… ou /pt/article/…"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="button" className="btn btn-pri" disabled={busy} onClick={apply}>Salvar</button>
          </div>
        </div>
      )}
    </>
  );
}
