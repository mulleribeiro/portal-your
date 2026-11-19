"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdminToken } from "@/lib/admin-session";
import { adminFetch } from "@/lib/admin-fetch";

export type EditTarget = {
  entity: "item" | "page" | "settings" | "menu" | "ui";
  id: string;
  field: string;
  label?: string;
};

type Ctx = {
  canEdit: boolean;
  live: boolean;
  setLive: (v: boolean) => void;
  lang: string;
  langs: string[];
  token: string;
  values: Record<string, string>;
  save: (target: EditTarget, values: Record<string, string>) => Promise<boolean>;
  translate: (text: string, target: string) => Promise<string>;
  toast: (msg: string) => void;
};

const EditContext = createContext<Ctx | null>(null);

export function useEdit() {
  return useContext(EditContext);
}

export function getStoredAdminToken(): string {
  return getAdminToken();
}

export function EditProvider({
  canEdit: initialCanEdit, lang, langs, children,
}: { canEdit: boolean; lang: string; langs: string[]; children: React.ReactNode }) {
  const [canEdit, setCanEdit] = useState(initialCanEdit);
  const [token, setToken] = useState("");
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const sync = () => {
      const stored = getStoredAdminToken();
      setToken(stored);
      setCanEdit(Boolean(stored) || initialCanEdit);
    };
    sync();
    window.addEventListener("your:admin-session", sync);
    return () => window.removeEventListener("your:admin-session", sync);
  }, [initialCanEdit]);

  useEffect(() => {
    document.documentElement.dataset.editing = live ? "true" : "false";
  }, [live]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(t);
  }, [message]);

  const toast = useCallback((msg: string) => setMessage(msg), []);

  const authHeaders = useCallback((): Record<string, string> => {
    const tk = token || getStoredAdminToken();
    return tk
      ? { "Content-Type": "application/json", "x-admin-token": tk }
      : { "Content-Type": "application/json" };
  }, [token]);

  const save = useCallback(async (target: EditTarget, values: Record<string, string>) => {
    const res = await adminFetch("/api/admin/inline", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...target, values }),
    });
    if (!res.ok) {
      toast("Erro ao salvar");
      return false;
    }
    toast("Salvo no banco");
    router.refresh();
    return true;
  }, [authHeaders, router, toast]);

  const translate = useCallback(async (text: string, target: string) => {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ text, source: lang, target }),
    });
    if (!res.ok) throw new Error("translate failed");
    const data = (await res.json()) as { text: string };
    return data.text;
  }, [authHeaders, lang]);

  const value = useMemo<Ctx>(
    () => ({ canEdit, live, setLive, lang, langs, token, values: {}, save, translate, toast }),
    [canEdit, live, lang, langs, token, save, translate, toast],
  );

  return (
    <EditContext.Provider value={value}>
      {children}
      {message && <div className="toast" role="status">{message}</div>}
      {canEdit && (
        <div className="adminbar">
          <span className="font-display text-[11px] font-bold uppercase tracking-[.16em] text-mute">
            {live ? "Edição ao vivo" : "Modo leitura"}
          </span>
          <button className="chip" data-on={live} onClick={() => setLive(!live)}>{live ? "On" : "Off"}</button>
          <Link href="/admin" className="btn btn-gold">Admin</Link>
        </div>
      )}
    </EditContext.Provider>
  );
}

type EditableProps = {
  target: EditTarget;
  value: string;
  translations?: Record<string, string>;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  multiline?: boolean;
  children?: React.ReactNode;
};

/** Renders text that an authenticated editor can click and rewrite in every language. */
export function Editable({ target, value, translations = {}, as, className, multiline, children }: EditableProps) {
  const ctx = useEdit();
  const Tag = (as || "span") as React.ElementType;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (!ctx) return <Tag className={className}>{children ?? value}</Tag>;

  const startEdit = (event: React.MouseEvent) => {
    if (!ctx.live || !ctx.canEdit) return;
    event.preventDefault();
    event.stopPropagation();
    setDraft({ [ctx.lang]: value, ...translations });
    const x = Math.min(Math.max(12, event.clientX - 220), window.innerWidth - 460);
    const y = Math.min(Math.max(12, event.clientY + 14), window.innerHeight - 360);
    setPos({ x, y });
    setOpen(true);
  };

  const commit = async () => {
    setBusy("save");
    const ok = await ctx.save(target, draft);
    setBusy(null);
    if (ok) setOpen(false);
  };

  const autoTranslate = async (code: string) => {
    const source = draft[ctx.lang] || value;
    if (!source) return;
    setBusy(code);
    try {
      const text = await ctx.translate(source, code);
      setDraft((d) => ({ ...d, [code]: text }));
      ctx.toast(`Traduzido para ${code.toUpperCase()}`);
    } catch {
      ctx.toast("Falha na tradução");
    } finally {
      setBusy(null);
    }
  };

  const autoTranslateAll = async () => {
    for (const code of ctx.langs) {
      if (code !== ctx.lang) {
        await autoTranslate(code);
      }
    }
  };

  return (
    <>
      <Tag className={`editable ${className || ""}`} onClick={startEdit}>{children ?? value}</Tag>
      {open && (
        <div
          className="pop"
          style={{ left: pos.x, top: pos.y }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          role="dialog"
          aria-label="Editar texto"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="eyebrow">{target.label || `${target.entity}.${target.field}`}</p>
            <div className="flex gap-1">
              <button type="button" className="chip" onClick={autoTranslateAll}>Traduzir todos</button>
              <button type="button" className="chip" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>
          <div className="grid gap-3">
            {ctx.langs.map((code) => (
              <div key={code}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="label !mb-0">{code.toUpperCase()}</span>
                  {code !== ctx.lang && (
                    <button type="button" className="chip" disabled={busy === code} onClick={() => autoTranslate(code)}>
                      {busy === code ? "…" : "Traduzir"}
                    </button>
                  )}
                </div>
                {multiline ? (
                  <textarea className="field min-h-[96px]" value={draft[code] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [code]: e.target.value }))} />
                ) : (
                  <input className="field" value={draft[code] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [code]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="button" className="btn btn-pri" disabled={busy === "save"} onClick={commit}>{busy === "save" ? "Salvando…" : "Salvar"}</button>
          </div>
        </div>
      )}
    </>
  );
}
