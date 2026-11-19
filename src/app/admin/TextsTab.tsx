"use client";

import { useState } from "react";
import type { Api } from "./api";
import { Label, MLField, Panel, TextField, Toggle } from "./fields";
import type { AdminLanguage, ML } from "./types";

export function TextsTab({ api }: { api: Api }) {
  const { data } = api;
  const langs = data.languages.filter((l) => l.enabled).map((l) => l.code);
  const source = data.languages.find((l) => l.isDefault)?.code || "pt";
  const [filter, setFilter] = useState("");
  const [newKey, setNewKey] = useState("");
  const [draftLang, setDraftLang] = useState<Partial<AdminLanguage>>({ code: "", name: "", nativeName: "", flag: "🌐", enabled: true, position: data.languages.length });

  const ui = data.ui.filter((u) => !filter || `${u.key} ${JSON.stringify(u.values)}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="grid gap-5">
      <Panel title="Idiomas" subtitle="Cada idioma habilitado ganha uma rota /{idioma}/… e entra no seletor instantâneo.">
        <div className="grid gap-2">
          {data.languages.map((l) => (
            <div className="table-row" key={l.code}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{l.flag}</span>
                <div>
                  <p className="font-display text-lg font-bold uppercase">/{l.code} — {l.nativeName}</p>
                  <p className="text-xs text-mute">{l.name} {l.isDefault && "· padrão"} {!l.enabled && "· desabilitado"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <button className="chip" onClick={() => api.save("language", { ...l, isDefault: true })}>Tornar padrão</button>
                <button className="chip" onClick={() => api.save("language", { ...l, enabled: !l.enabled })}>{l.enabled ? "Desabilitar" : "Habilitar"}</button>
                {l.code !== "pt" && <button className="chip" onClick={() => { if (confirm(`Remover ${l.code}?`)) api.action("delete", { entity: "language", id: l.code }); }}>✕</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-6">
          <TextField label="Código" value={draftLang.code} onChange={(v) => setDraftLang({ ...draftLang, code: v.slice(0, 5) })} placeholder="fr" />
          <TextField label="Nome" value={draftLang.name} onChange={(v) => setDraftLang({ ...draftLang, name: v })} placeholder="French" />
          <TextField label="Nome nativo" value={draftLang.nativeName} onChange={(v) => setDraftLang({ ...draftLang, nativeName: v })} placeholder="Français" />
          <TextField label="Bandeira" value={draftLang.flag} onChange={(v) => setDraftLang({ ...draftLang, flag: v })} />
          <TextField label="Posição" type="number" value={draftLang.position ?? 0} onChange={(v) => setDraftLang({ ...draftLang, position: Number(v) })} />
          <div className="flex items-end gap-2 pb-1">
            <button className="btn btn-pri" onClick={() => { if (!draftLang.code) return api.toast("Informe o código"); api.save("language", draftLang); setDraftLang({ code: "", name: "", nativeName: "", flag: "🌐", enabled: true, position: data.languages.length }); }}>+ idioma</button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Textos da interface"
        subtitle="Chaves usadas pelos componentes (nav.*, action.*, label.*, admin.*). Traduza com um clique."
        actions={<input className="field !w-56" placeholder="filtrar chave…" value={filter} onChange={(e) => setFilter(e.target.value)} />}
      >
        <div className="grid gap-3">
          {ui.map((row) => (
            <div key={row.key} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-gold">{row.key} <span className="text-mute">· {row.group}</span></p>
                <div className="flex gap-1">
                  <button className="chip" onClick={() => api.save("ui", { key: row.key, group: row.group, values: row.values })}>Salvar</button>
                  <button className="chip" onClick={() => { if (confirm(`Excluir ${row.key}?`)) api.action("delete", { entity: "ui", id: row.key }); }}>✕</button>
                </div>
              </div>
              <MLField
                label=""
                value={row.values as ML}
                langs={langs}
                source={source}
                translate={api.translate}
                onChange={(values) => api.setData({ ...data, ui: data.ui.map((u) => (u.key === row.key ? { ...u, values } : u)) })}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-line p-3">
          <div className="min-w-[220px] flex-1">
            <Label>Nova chave</Label>
            <input className="field font-mono text-xs" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="custom.meuTexto" />
          </div>
          <button
            className="btn btn-pri"
            onClick={() => {
              if (!newKey.trim()) return api.toast("Informe a chave");
              api.save("ui", { key: newKey.trim(), group: "custom", values: { [source]: "" } });
              setNewKey("");
            }}
          >+ criar texto</button>
        </div>
      </Panel>
    </div>
  );
}
