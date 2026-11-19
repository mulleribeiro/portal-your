"use client";

import { useState } from "react";
import type { ML } from "./types";
import { uploadImage } from "@/lib/upload-client";

/** Image picker: paste a URL or upload a file (stored in the database). */
export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch {
      alert("Falha no upload da imagem");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-2">
      <span className="label">{label}</span>
      <div className="flex gap-3">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-ink">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="grid flex-1 gap-2">
          <input className="field font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder="URL da imagem ou envie um arquivo" />
          <label className="btn w-fit cursor-pointer">
            {busy ? "Enviando…" : "Enviar arquivo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
      </div>
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="label">{children}</span>;
}

export function TextField({
  label, value, onChange, placeholder, type = "text", mono,
}: {
  label?: string; value?: string | number | null; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <input
        className={`field ${mono ? "font-mono text-xs" : ""}`}
        type={type} value={value ?? ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="chip" data-on={value} onClick={() => onChange(!value)} aria-pressed={value}>
      {label}: {value ? "on" : "off"}
    </button>
  );
}

/** Multi-language input with instant per-language translation. */
export function MLField({
  label, value, langs, source, onChange, translate, multiline, rows = 3,
}: {
  label: string; value: ML | null | undefined; langs: string[]; source: string;
  onChange: (v: ML) => void; multiline?: boolean; rows?: number;
  translate: (text: string, target: string) => Promise<string>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const current = (value || {}) as ML;

  const set = (lang: string, text: string) => onChange({ ...current, [lang]: text });

  const doTranslate = async (lang: string) => {
    const from = current[source] || Object.values(current).find(Boolean) || "";
    if (!from) return;
    setBusy(lang);
    try {
      const text = await translate(from, lang);
      set(lang, text);
    } finally {
      setBusy(null);
    }
  };

  const doTranslateAll = async () => {
    for (const lang of langs) {
      if (lang === source) continue;
      await doTranslate(lang);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-ink/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <button type="button" className="chip" onClick={doTranslateAll}>Traduzir todos</button>
      </div>
      <div className="grid gap-2">
        {langs.map((lang) => (
          <div key={lang} className="grid gap-1 sm:grid-cols-[54px_1fr_auto] sm:items-start">
            <span className="pt-2 font-display text-xs font-bold uppercase tracking-widest text-blush">{lang}</span>
            {multiline ? (
              <textarea className="field min-h-[70px] font-mono text-[13px]" rows={rows} value={current[lang] || ""} onChange={(e) => set(lang, e.target.value)} />
            ) : (
              <input className="field" value={current[lang] || ""} onChange={(e) => set(lang, e.target.value)} />
            )}
            {lang !== source && (
              <button type="button" className="chip" disabled={busy === lang} onClick={() => doTranslate(lang)}>
                {busy === lang ? "…" : "Traduzir"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Panel({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold uppercase">{title}</h2>
          {subtitle && <p className="text-sm text-mute">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function KeyValueList({
  label, items, onChange, langs, source, translate,
}: {
  label: string;
  items: { value: string; label: ML }[];
  onChange: (next: { value: string; label: ML }[]) => void;
  langs: string[]; source: string; translate: (text: string, target: string) => Promise<string>;
}) {
  return (
    <div className="grid gap-3">
      <Label>{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[140px_1fr_auto]">
          <input className="field" value={item.value} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="valor" />
          <MLField label="rótulo" value={item.label} langs={langs} source={source} translate={translate} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
          <button type="button" className="chip" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn w-fit" onClick={() => onChange([...items, { value: "", label: {} }])}>+ adicionar</button>
    </div>
  );
}
