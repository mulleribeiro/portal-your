"use client";

import { useState } from "react";
import type { Api } from "./api";
import { ImageField, Label, MLField, Panel, TextField, Toggle } from "./fields";
import type { AdminMenu, AdminPage, ML } from "./types";

const TEMPLATES = [
  "home", "news", "covers", "editions", "play", "hotels", "fine-dining", "collections",
  "columnists", "founder", "relations", "press", "media-kit", "relacionamento", "custom",
];
const AREAS = ["rail", "top", "footer"];

const BLOCK_SNIPPETS: Record<string, unknown> = {
  heading: { type: "heading", text: { pt: "Novo título" } },
  paragraph: { type: "paragraph", text: { pt: "Novo parágrafo." } },
  quote: { type: "quote", text: { pt: "Nova citação em destaque." } },
  stats: { type: "stats", items: [{ value: "10", label: { pt: "anos" } }] },
  columns: { type: "columns", columns: [{ title: { pt: "Coluna" }, text: { pt: "Texto" } }] },
  list: { type: "list", items: [{ pt: "Item" }] },
  cta: { type: "cta", label: { pt: "Clique aqui" }, href: "/relacionamento" },
  image: { type: "image", src: "", caption: { pt: "Legenda" } },
};

export function StructureTab({ api }: { api: Api }) {
  const { data } = api;
  const langs = data.languages.filter((l) => l.enabled).map((l) => l.code);
  const source = data.languages.find((l) => l.isDefault)?.code || "pt";
  const [pageDraft, setPageDraft] = useState<AdminPage | null>(null);
  const [menuDraft, setMenuDraft] = useState<Partial<AdminMenu> | null>(null);

  const savePage = async () => {
    if (!pageDraft) return;
    let blocks = pageDraft.blocks;
    if (typeof blocks === "string") {
      try { blocks = JSON.parse(blocks as unknown as string); } catch { api.toast("JSON de blocos inválido"); return; }
    }
    const result = await api.save("page", { ...pageDraft, blocks });
    if (!result.error) setPageDraft(null);
  };

  const saveMenu = async () => {
    if (!menuDraft) return;
    const result = await api.save("menu", menuDraft);
    if (!result.error) setMenuDraft(null);
  };

  const toggleMenuHidden = async (m: AdminMenu) => {
    await api.save("menu", { ...m, hidden: !m.hidden });
  };

  return (
    <div className="grid gap-5">
      <Panel
        title="Menus (Mostrar, Ocultar, Reordenar e Editar)"
        subtitle="Trilho lateral (rail), barra superior (top) e rodapé (footer). Clique em Mostrar/Ocultar em qualquer item para controlar sua exibição."
        actions={<button className="btn btn-pri" onClick={() => setMenuDraft({ area: "rail", label: {}, href: "/", kind: "route", group: "Portal", icon: "", badge: "", hidden: false, position: data.menu.length })}>+ novo item de menu</button>}
      >
        {AREAS.map((area) => {
          const list = data.menu.filter((m) => m.area === area).sort((a, b) => a.position - b.position);
          return (
            <div key={area} className="mb-6">
              <p className="eyebrow mb-2">
                {area === "rail" ? "Menu Lateral (Rail)" : area === "top" ? "Barra Superior (Top)" : "Rodapé (Footer)"}
              </p>
              <div className="grid gap-2">
                {list.map((m) => (
                  <div className="table-row" key={m.id}>
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold uppercase">
                        {(m.label as ML)[source] || m.href}
                        {m.badge ? <span className="tag ml-2">{m.badge}</span> : null}
                        {m.hidden ? <span className="ml-2 rounded bg-red-500/20 px-2 py-0.5 text-[11px] text-red-300">OCULTO</span> : null}
                      </p>
                      <p className="truncate text-xs text-mute">{m.href} · {m.group || "sem grupo"} · ícone {m.icon || "—"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button
                        className="chip"
                        data-on={!m.hidden}
                        onClick={() => toggleMenuHidden(m)}
                        title={m.hidden ? "Mostrar no menu" : "Ocultar do menu"}
                      >
                        {m.hidden ? "🚫 Oculto (Mostrar)" : "👁 Visível (Ocultar)"}
                      </button>
                      <button className="chip" onClick={() => api.action("move", { entity: "menu", id: m.id, direction: -1 })}>↑</button>
                      <button className="chip" onClick={() => api.action("move", { entity: "menu", id: m.id, direction: 1 })}>↓</button>
                      <button className="chip" onClick={() => setMenuDraft({ ...m })}>Editar</button>
                      <button className="chip" onClick={() => { if (confirm("Excluir item de menu?")) api.action("delete", { entity: "menu", id: m.id }); }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Panel>

      {menuDraft && (
        <Panel title={menuDraft.id ? `Menu #${menuDraft.id}` : "Novo item de menu"} actions={<><button className="btn" onClick={() => setMenuDraft(null)}>Cancelar</button><button className="btn btn-gold" onClick={saveMenu}>Salvar</button></>}>
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label>Área</Label>
                <select className="field" value={menuDraft.area} onChange={(e) => setMenuDraft({ ...menuDraft, area: e.target.value })}>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <TextField label="Grupo" value={menuDraft.group || ""} onChange={(v) => setMenuDraft({ ...menuDraft, group: v })} />
              <TextField label="Destino (href)" value={menuDraft.href || ""} onChange={(v) => setMenuDraft({ ...menuDraft, href: v })} mono />
              <TextField label="Ícone / letra / URL" value={menuDraft.icon || ""} onChange={(v) => setMenuDraft({ ...menuDraft, icon: v })} />
              <TextField label="Selo (badge)" value={menuDraft.badge || ""} onChange={(v) => setMenuDraft({ ...menuDraft, badge: v })} />
              <TextField label="Posição" type="number" value={menuDraft.position ?? 0} onChange={(v) => setMenuDraft({ ...menuDraft, position: Number(v) })} />
              <div className="flex items-end pb-1"><Toggle label="Oculto" value={Boolean(menuDraft.hidden)} onChange={(v) => setMenuDraft({ ...menuDraft, hidden: v })} /></div>
            </div>
            <MLField label="Rótulo em cada idioma" value={menuDraft.label} langs={langs} source={source} translate={api.translate} onChange={(v) => setMenuDraft({ ...menuDraft, label: v })} />
          </div>
        </Panel>
      )}

      <Panel
        title="Páginas"
        subtitle="Títulos, subtítulos, imagens de capa e blocos de cada página."
        actions={<button className="btn btn-pri" onClick={() => setPageDraft({ slug: "", template: "custom", title: {}, subtitle: {}, kicker: {}, image: "", blocks: [], published: true, showInMenu: true, position: 50 })}>+ nova página</button>}
      >
        <div className="grid gap-2">
          {data.pages.map((page) => (
            <div className="table-row" key={page.slug}>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold uppercase">{(page.title as ML)[source] || page.slug}</p>
                <p className="truncate text-xs text-mute">/{page.slug} · template {page.template} · {(page.blocks || []).length} blocos {!page.published && "· rascunho"}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <button className="chip" data-on={page.published} onClick={() => api.save("page", { ...page, published: !page.published })}>
                  {page.published ? "👁 Publicada" : "🚫 Oculta"}
                </button>
                <button className="chip" onClick={() => setPageDraft({ ...page, blocks: page.blocks ?? [] })}>Editar</button>
                {page.template === "custom" && (
                  <button className="chip" onClick={() => { if (confirm(`Excluir /${page.slug}?`)) api.action("delete", { entity: "page", id: page.slug }); }}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {pageDraft && (
        <Panel title={pageDraft.slug ? `Página /${pageDraft.slug}` : "Nova página"} actions={<><button className="btn" onClick={() => setPageDraft(null)}>Cancelar</button><button className="btn btn-gold" onClick={savePage}>Salvar</button></>}>
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label="Slug" value={pageDraft.slug} onChange={(v) => setPageDraft({ ...pageDraft, slug: v })} mono />
              <div>
                <Label>Template</Label>
                <select className="field" value={pageDraft.template} onChange={(e) => setPageDraft({ ...pageDraft, template: e.target.value })}>
                  {TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <TextField label="Posição" type="number" value={pageDraft.position} onChange={(v) => setPageDraft({ ...pageDraft, position: Number(v) })} />
              <div className="sm:col-span-2">
                <ImageField label="Imagem de capa da página" value={pageDraft.image || ""} onChange={(v) => setPageDraft({ ...pageDraft, image: v })} />
              </div>
              <div className="flex flex-wrap items-end gap-2 pb-1">
                <Toggle label="Publicada" value={pageDraft.published} onChange={(v) => setPageDraft({ ...pageDraft, published: v })} />
                <Toggle label="No menu" value={pageDraft.showInMenu} onChange={(v) => setPageDraft({ ...pageDraft, showInMenu: v })} />
              </div>
            </div>

            <MLField label="Título" value={pageDraft.title} langs={langs} source={source} translate={api.translate} onChange={(v) => setPageDraft({ ...pageDraft, title: v })} />
            <MLField label="Kicker (sobretítulo)" value={pageDraft.kicker} langs={langs} source={source} translate={api.translate} onChange={(v) => setPageDraft({ ...pageDraft, kicker: v })} />
            <MLField label="Subtítulo" value={pageDraft.subtitle} langs={langs} source={source} translate={api.translate} onChange={(v) => setPageDraft({ ...pageDraft, subtitle: v })} multiline rows={2} />

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Label>Blocos (JSON)</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(BLOCK_SNIPPETS).map((kind) => (
                    <button key={kind} className="chip" onClick={() => {
                      const current = typeof pageDraft.blocks === "string" ? JSON.parse(pageDraft.blocks as unknown as string) : (pageDraft.blocks || []);
                      setPageDraft({ ...pageDraft, blocks: [...current, BLOCK_SNIPPETS[kind]] });
                    }}>+ {kind}</button>
                  ))}
                </div>
              </div>
              <textarea
                className="field min-h-[180px] font-mono text-xs"
                value={typeof pageDraft.blocks === "string" ? (pageDraft.blocks as unknown as string) : JSON.stringify(pageDraft.blocks ?? [], null, 2)}
                onChange={(e) => setPageDraft({ ...pageDraft, blocks: e.target.value as unknown as unknown[] })}
              />
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
