"use client";

import { useMemo, useState } from "react";
import type { Api } from "./api";
import { ImageField, Label, MLField, Panel, TextField, Toggle } from "./fields";
import { CONTENT_TYPES, type AdminItem, type ML } from "./types";

const blank = (type: string): AdminItem => ({
  id: "", type, title: {}, dek: {}, body: {}, category: "", image: "", url: "",
  meta: {}, tags: [], featured: false, published: true, position: 0,
});

export function ContentTab({ api }: { api: Api }) {
  const { data } = api;
  const langs = data.languages.filter((l) => l.enabled).map((l) => l.code);
  const source = data.languages.find((l) => l.isDefault)?.code || langs[0] || "pt";
  const [type, setType] = useState("article");
  const [draft, setDraft] = useState<AdminItem | null>(null);
  const [filter, setFilter] = useState("");

  const list = useMemo(
    () => data.items.filter((i) => i.type === type).sort((a, b) => a.position - b.position),
    [data.items, type],
  );
  const visible = filter ? list.filter((i) => JSON.stringify(i).toLowerCase().includes(filter.toLowerCase())) : list;

  const editing = draft;

  const persist = async () => {
    if (!editing) return;
    let meta = editing.meta;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta as unknown as string);
      } catch {
        api.toast("JSON de meta inválido");
        return;
      }
    }
    const result = await api.save("item", { ...editing, id: editing.id || undefined, meta, position: Number(editing.position) || 0 });
    if (!result.error) setDraft(null);
  };

  const quickSaveUrl = async (item: AdminItem, nextUrl: string) => {
    if ((item.url || "") === nextUrl.trim()) return;
    await api.save("item", { ...item, url: nextUrl.trim() });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <div className="grid gap-2 self-start">
        {CONTENT_TYPES.map((t) => {
          const count = data.items.filter((i) => i.type === t.id).length;
          return (
            <button
              key={t.id}
              className="chip flex items-center justify-between"
              data-on={type === t.id}
              onClick={() => { setType(t.id); setDraft(null); }}
            >
              <span>{t.label}</span>
              <span className="ml-2 opacity-75">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5">
        {editing && (
          <Panel
            title={editing.id ? `Editar ${editing.id}` : `Novo registro (${CONTENT_TYPES.find((t) => t.id === type)?.label || type})`}
            actions={
              <>
                <button className="btn" onClick={() => setDraft(null)}>Cancelar</button>
                <button className="btn btn-gold" onClick={persist}>Salvar no banco</button>
              </>
            }
          >
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="ID (slug)" value={editing.id} onChange={(v) => setDraft({ ...editing, id: v })} placeholder="gerado automaticamente" mono />
                <TextField label="Categoria / editoria" value={editing.category || ""} onChange={(v) => setDraft({ ...editing, category: v })} />
                <div className="sm:col-span-2">
                  <ImageField label="Imagem (capa / foto principal — envie arquivo ou cole URL)" value={editing.image || ""} onChange={(v) => setDraft({ ...editing, image: v })} />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    label="Link ao clicar (URL externa ou rota interna)"
                    value={editing.url || ""}
                    onChange={(v) => setDraft({ ...editing, url: v })}
                    placeholder="https://edicoesyour.online/e/edicao-88 ou /pt/article/…"
                    mono
                  />
                </div>
                <TextField label="Posição" type="number" value={editing.position} onChange={(v) => setDraft({ ...editing, position: Number(v) })} />
                <TextField label="Tags (separadas por vírgula)" value={(editing.tags || []).join(", ")} onChange={(v) => setDraft({ ...editing, tags: v.split(",").map((x) => x.trim()).filter(Boolean) })} />
              </div>

              <MLField label="Título (multilíngue — clique em Traduzir para preencher outros idiomas)" value={editing.title} langs={langs} source={source} translate={api.translate} onChange={(v) => setDraft({ ...editing, title: v })} />
              <MLField label="Linha fina / subtítulo (multilíngue)" value={editing.dek} langs={langs} source={source} translate={api.translate} onChange={(v) => setDraft({ ...editing, dek: v })} multiline rows={2} />
              <MLField label="Corpo completo / texto / release (~600 palavras em Sala de Imprensa)" value={editing.body} langs={langs} source={source} translate={api.translate} onChange={(v) => setDraft({ ...editing, body: v })} multiline rows={10} />

              <div>
                <Label>Meta (JSON — fotos adicionais, cidade, horários, créditos…)</Label>
                <textarea
                  className="field min-h-[110px] font-mono text-xs"
                  value={typeof editing.meta === "string" ? (editing.meta as unknown as string) : JSON.stringify(editing.meta ?? {}, null, 2)}
                  onChange={(e) => setDraft({ ...editing, meta: e.target.value as unknown as Record<string, unknown> })}
                />
              </div>

              {editing.type === "columnist" && (
                <div className="rounded-xl border border-line bg-ink/40 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label>Matérias / colunas deste colunista</Label>
                      <p className="text-xs text-mute">Aparecem na página individual do colunista (“Últimas matérias”).</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-pri"
                      onClick={() => {
                        const meta = typeof editing.meta === "string" ? JSON.parse(editing.meta as unknown as string) : (editing.meta || {});
                        const past = Array.isArray(meta.past) ? meta.past : [];
                        setDraft({ ...editing, meta: { ...meta, past: [...past, { t: "", u: "" }] } });
                      }}
                    >
                      + adicionar matéria
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {(((typeof editing.meta === "string" ? (() => { try { return JSON.parse(editing.meta as unknown as string); } catch { return {}; } })() : editing.meta) as { past?: { t: string; u: string }[] })?.past || []).map((item, i) => {
                      const meta = typeof editing.meta === "string" ? JSON.parse(editing.meta as unknown as string) : (editing.meta || {});
                      const past = Array.isArray(meta.past) ? [...meta.past] : [];
                      const update = (patch: Partial<{ t: string; u: string }>) => {
                        past[i] = { ...past[i], ...patch };
                        setDraft({ ...editing, meta: { ...meta, past } });
                      };
                      return (
                        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input className="field" placeholder="Título da matéria" value={item.t} onChange={(e) => update({ t: e.target.value })} />
                          <input className="field font-mono text-xs" placeholder="Link (https://…)" value={item.u} onChange={(e) => update({ u: e.target.value })} />
                          <button type="button" className="chip" onClick={() => {
                            const next = past.filter((_, j) => j !== i);
                            setDraft({ ...editing, meta: { ...meta, past: next } });
                          }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Toggle label="Publicado" value={editing.published} onChange={(v) => setDraft({ ...editing, published: v })} />
                <Toggle label="Destaque" value={editing.featured} onChange={(v) => setDraft({ ...editing, featured: v })} />
              </div>
            </div>
          </Panel>
        )}

        <Panel
          title={CONTENT_TYPES.find((t) => t.id === type)?.label || type}
          subtitle={`${list.length} registros · mecanismo de tradução: ${data.engineLabel}`}
          actions={
            <>
              <input className="field !w-52" placeholder="filtrar…" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <button className="btn btn-pri" onClick={() => setDraft(blank(type))}>+ adicionar novo</button>
            </>
          }
        >
          <div className="grid gap-2">
            {visible.map((item) => (
              <div className="rounded-xl border border-line bg-surface p-3" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-14 w-11 shrink-0 place-items-center rounded-lg border border-line font-display text-xs text-mute">—</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-bold uppercase">{(item.title as ML)[source] || item.id}</p>
                      <p className="truncate text-xs text-mute">
                        {item.id} {item.category ? `· ${item.category}` : ""} {!item.published && "· oculto"} {item.featured && "· destaque"}
                      </p>
                      {(type === "edition" || type === "cover" || type === "hotel" || type === "dining") && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="font-mono text-[11px] text-gold">🔗 Link:</span>
                          <input
                            className="field !py-1 font-mono text-xs"
                            defaultValue={item.url || ""}
                            placeholder="Cole o link desta capa / item e clique fora para salvar…"
                            onBlur={(e) => quickSaveUrl(item, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {type === "release" && (
                      <a href={`/api/release-pdf/${encodeURIComponent(item.id)}?lang=${source}`} target="_blank" rel="noreferrer" className="chip">
                        ⬇ PDF
                      </a>
                    )}
                    <button className="chip" onClick={() => api.save("item", { ...item, published: !item.published })}>
                      {item.published ? "👁 Visível" : "🚫 Oculto"}
                    </button>
                    <button className="chip" title="subir" onClick={() => api.action("move", { entity: "item", id: item.id, direction: -1 })}>↑</button>
                    <button className="chip" title="descer" onClick={() => api.action("move", { entity: "item", id: item.id, direction: 1 })}>↓</button>
                    <button
                      className="chip"
                      onClick={async () => {
                        // the list payload truncates bodies — fetch the full item before editing
                        const full = await api.getItem(item.id);
                        const base = full || item;
                        setDraft({ ...base, meta: (base.meta ?? {}) as Record<string, unknown> } as AdminItem);
                      }}
                    >Editar</button>
                    <button className="chip" onClick={() => { if (confirm(`Excluir ${item.id}?`)) api.action("delete", { entity: "item", id: item.id }); }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
            {!visible.length && <p className="text-sm text-mute">Nenhum registro neste tipo.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
