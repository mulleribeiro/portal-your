"use client";

import { useMemo, useState } from "react";
import type { Api } from "./api";
import { ARTICLE_CATEGORIES } from "@/lib/categories";
import { slugify } from "@/lib/i18n";
import { ArticleBodyEditor, type ArticleBodySection } from "./ArticleBodyEditor";
import { ImageField, Label, MLField, Panel, TextField, Toggle } from "./fields";
import { CONTENT_TYPES, type AdminItem, type ML } from "./types";

const blank = (type: string): AdminItem => ({
  id: "", type, title: {}, dek: {}, body: {}, category: "", image: "", url: "",
  meta: {}, tags: [], featured: false, published: true, position: 0,
});

function parseMeta(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sectionsFor(item: AdminItem, source: string): ArticleBodySection[] {
  const stored = parseMeta(item.meta).articleSections;
  if (Array.isArray(stored)) return stored as ArticleBodySection[];
  const body = (item.body || {}) as ML;
  const text = body[source] || Object.values(body).find(Boolean) || "";
  return text.trim() ? [{ type: "text", text: { ...body } }] : [{ type: "text", text: { [source]: "" } }];
}

export function ContentTab({ api }: { api: Api }) {
  const { data } = api;
  const langs = data.languages.filter((l) => l.enabled).map((l) => l.code);
  const source = data.languages.find((l) => l.isDefault)?.code || langs[0] || "pt";
  const [type, setType] = useState("article");
  const [draft, setDraft] = useState<AdminItem | null>(null);
  const [filter, setFilter] = useState("");
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);

  const list = useMemo(
    () => data.items.filter((i) => i.type === type).sort((a, b) => a.position - b.position),
    [data.items, type],
  );
  const visible = filter ? list.filter((i) => JSON.stringify(i).toLowerCase().includes(filter.toLowerCase())) : list;

  const editing = draft;
  const categoryOptions = useMemo(() => [...new Set([
    ...ARTICLE_CATEGORIES,
    ...data.items.map((item) => item.category).filter((category): category is string => Boolean(category?.trim())),
  ])].sort((a, b) => a.localeCompare(b, "pt-BR")), [data.items]);
  const partnerBrands = useMemo(() => data.items.filter((item) => item.type === "brand"), [data.items]);
  const editingMeta = editing ? parseMeta(editing.meta) : {};
  const pastRows = Array.isArray(editingMeta.past) ? editingMeta.past.filter((entry): entry is { t: string; u: string } => Boolean(entry && typeof entry === "object" && typeof (entry as { t?: unknown }).t === "string" && typeof (entry as { u?: unknown }).u === "string")) : [];
  const updateMeta = (patch: Record<string, unknown>) => {
    if (editing) setDraft({ ...editing, meta: { ...parseMeta(editing.meta), ...patch } });
  };

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

  const editItem = async (item: AdminItem) => {
    setLoadingEdit(item.id);
    try {
      const full = await api.getItem(item.id);
      const base = (full || item) as AdminItem;
      setDraft({ ...base, meta: parseMeta(base.meta) });
    } catch {
      api.toast("Não foi possível carregar o registro completo; os campos disponíveis foram abertos.");
      setDraft({ ...item, meta: parseMeta(item.meta) });
    } finally {
      setLoadingEdit(null);
    }
  };

  const duplicateColumnist = async (item: AdminItem) => {
    setLoadingEdit(item.id);
    try {
      const full = await api.getItem(item.id);
      const base = (full || item) as AdminItem;
      const oldTitle = (base.title as ML)?.[source] || item.id;
      const newTitle = `${oldTitle} — cópia`;
      const id = `col-${slugify(`${newTitle}-${Date.now().toString(36)}`)}`;
      const nextPosition = Math.max(-1, ...list.map((entry) => entry.position)) + 1;
      const result = await api.save("item", {
        ...base,
        id,
        type: "columnist",
        title: { ...(base.title || {}), [source]: newTitle },
        meta: JSON.parse(JSON.stringify(parseMeta(base.meta))) as Record<string, unknown>,
        published: false,
        featured: false,
        position: nextPosition,
      });
      if (!result.error) api.toast("Colunista duplicado como rascunho. Revise o nome e publique quando estiver pronto.");
    } catch {
      api.toast("Não foi possível duplicar este colunista.");
    } finally {
      setLoadingEdit(null);
    }
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
                <label className="block min-w-0">
                  <Label>Categoria / editoria</Label>
                  <input className="field" list="content-category-options" value={editing.category || ""} onChange={(event) => setDraft({ ...editing, category: event.target.value })} placeholder="Escolha ou digite uma categoria" />
                  <datalist id="content-category-options">{categoryOptions.map((category) => <option key={category} value={category} />)}</datalist>
                  <span className="mt-1 block text-[11px] text-mute">Você também pode digitar uma categoria nova.</span>
                </label>
                {editing.type === "article" ? (
                  <label className="block min-w-0">
                    <Label>Marca parceira (opcional)</Label>
                    <select className="field" value={String(editingMeta.brandId || "")} onChange={(event) => updateMeta({ brandId: event.target.value || null })}>
                      <option value="">Sem marca vinculada</option>
                      {partnerBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.title?.[source] || brand.id}</option>)}
                    </select>
                    <span className="mt-1 block text-[11px] text-mute">A matéria será exibida junto à marca em Nosso Time.</span>
                  </label>
                ) : null}
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
              {editing.type === "article" ? (
                <ArticleBodyEditor
                  sections={sectionsFor(editing, source)}
                  langs={langs}
                  source={source}
                  translate={api.translate}
                  onChange={(sections) => updateMeta({ articleSections: sections })}
                />
              ) : (
                <MLField label="Corpo completo / texto / release (~600 palavras em Sala de Imprensa)" value={editing.body} langs={langs} source={source} translate={api.translate} onChange={(v) => setDraft({ ...editing, body: v })} multiline rows={10} />
              )}

              {(editing.type === "hotel" || editing.type === "dining") && (() => {
                const currentPhotos = Array.isArray(editingMeta.photos)
                  ? editingMeta.photos.filter((photo): photo is string => typeof photo === "string")
                  : editing.image ? [editing.image] : [];
                return (
                  <div className="grid min-w-0 gap-3 rounded-xl border border-line bg-ink/40 p-4">
                    <div>
                      <Label>Fotos da galeria</Label>
                      <p className="text-xs text-mute">Adicione várias imagens. Elas aparecem na galeria do estabelecimento, além da capa principal.</p>
                    </div>
                    {currentPhotos.map((photo, photoIndex) => (
                      <div className="grid min-w-0 gap-2 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,1fr)_auto]" key={`${photoIndex}-${photo}`}>
                        <ImageField label={`Foto ${photoIndex + 1}`} value={photo} onChange={(url) => updateMeta({ photos: currentPhotos.map((entry, index) => index === photoIndex ? url : entry) })} />
                        <button className="chip self-start" type="button" onClick={() => updateMeta({ photos: currentPhotos.filter((_, index) => index !== photoIndex) })}>Remover foto</button>
                      </div>
                    ))}
                    <button className="btn w-fit" type="button" disabled={currentPhotos.length >= 20} onClick={() => updateMeta({ photos: [...currentPhotos, ""] })}>+ adicionar foto</button>
                  </div>
                );
              })()}

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
                      onClick={() => updateMeta({ past: [...pastRows, { t: "", u: "" }] })}
                    >
                      + adicionar matéria
                    </button>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    {pastRows.map((item, i) => {
                      const update = (patch: Partial<{ t: string; u: string }>) => updateMeta({ past: pastRows.map((row, index) => index === i ? { ...row, ...patch } : row) });
                      const move = (direction: -1 | 1) => {
                        const next = [...pastRows];
                        const other = i + direction;
                        if (other < 0 || other >= next.length) return;
                        [next[i], next[other]] = [next[other], next[i]];
                        updateMeta({ past: next });
                      };
                      return (
                        <div key={i} className="grid min-w-0 gap-2 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                          <input className="field min-w-0" placeholder="Título da matéria" value={item.t} onChange={(e) => update({ t: e.target.value })} />
                          <input className="field min-w-0 font-mono text-xs" placeholder="Link (https://…)" value={item.u} onChange={(e) => update({ u: e.target.value })} />
                          <div className="flex flex-wrap gap-1">
                            <button type="button" className="chip" disabled={i === 0} onClick={() => move(-1)} aria-label="Matéria mais recente">↑</button>
                            <button type="button" className="chip" disabled={i === pastRows.length - 1} onClick={() => move(1)} aria-label="Matéria mais antiga">↓</button>
                            <button type="button" className="chip" onClick={() => updateMeta({ past: pastRows.filter((_, index) => index !== i) })}>Remover</button>
                          </div>
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
                    <button className="chip" type="button" disabled={loadingEdit === item.id} onClick={() => void editItem(item)}>
                      {loadingEdit === item.id ? "Carregando…" : "Editar"}
                    </button>
                    {type === "columnist" ? <button className="chip" type="button" disabled={loadingEdit === item.id} onClick={() => void duplicateColumnist(item)}>Duplicar</button> : null}
                    <button className="chip" type="button" onClick={() => { if (confirm(`Excluir ${item.id}?`)) void api.action("delete", { entity: "item", id: item.id }); }}>Excluir</button>
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
