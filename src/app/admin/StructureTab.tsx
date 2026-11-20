"use client";

import { useState } from "react";
import type { Api } from "./api";
import { BlocksEditor } from "./BlocksEditor";
import { ImageField, Label, MLField, Panel, TextField, Toggle } from "./fields";
import type { AdminMenu, AdminPage, ML } from "./types";

const TEMPLATES = [
  "home", "news", "covers", "editions", "play", "hotels", "fine-dining", "collections",
  "columnists", "founder", "relations", "press", "media-kit", "relacionamento", "custom",
];
const AREAS = ["rail", "top", "footer"];

function parseBlocks(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function hrefForMenu(value: string, kind: string): string | null {
  const href = value.trim();
  if (!href) return null;
  if (kind === "external") {
    try {
      const parsed = new URL(href);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? href : null;
    } catch {
      return null;
    }
  }
  if (kind === "email") {
    const email = href.replace(/^mailto:/i, "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
  }
  if (/^(https?:|mailto:|tel:|javascript:|\/\/)/i.test(href)) return null;
  return `/${href.replace(/^\/+/, "")}`;
}

export function StructureTab({ api }: { api: Api }) {
  const { data } = api;
  const langs = data.languages.filter((language) => language.enabled).map((language) => language.code);
  const source = data.languages.find((language) => language.isDefault)?.code || "pt";
  const [pageDraft, setPageDraft] = useState<AdminPage | null>(null);
  const [menuDraft, setMenuDraft] = useState<Partial<AdminMenu> | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);

  const savePage = async () => {
    if (!pageDraft) return;
    if (!pageDraft.slug.trim()) {
      api.toast("Informe um endereço (slug) para a página.");
      return;
    }
    if (!String(pageDraft.title?.[source] || "").trim()) {
      api.toast(`Informe o título da página em ${source.toUpperCase()}.`);
      return;
    }
    const blocks = parseBlocks(pageDraft.blocks);
    if (!blocks) {
      api.toast("Não foi possível ler os blocos da página. Revise o conteúdo antes de salvar.");
      return;
    }

    setSavingPage(true);
    try {
      const result = await api.save("page", { ...pageDraft, blocks, previousSlug: pageDraft.previousSlug || "" });
      if (!result.error) setPageDraft(null);
    } finally {
      setSavingPage(false);
    }
  };

  const saveMenu = async () => {
    if (!menuDraft) return;
    const kind = menuDraft.kind || "route";
    const href = hrefForMenu(String(menuDraft.href || ""), kind);
    const label = (menuDraft.label || {}) as ML;
    if (!AREAS.includes(String(menuDraft.area || ""))) {
      api.toast("Escolha uma área válida para o menu.");
      return;
    }
    if (!href) {
      api.toast(kind === "external" ? "Use uma URL externa válida iniciada por https://." : kind === "email" ? "Informe um endereço de e-mail válido." : "Informe um destino interno, como /news.");
      return;
    }
    if (!String(label[source] || "").trim()) {
      api.toast(`Informe o rótulo do menu em ${source.toUpperCase()}.`);
      return;
    }

    setSavingMenu(true);
    try {
      const result = await api.save("menu", { ...menuDraft, kind, href, label });
      if (!result.error) setMenuDraft(null);
    } finally {
      setSavingMenu(false);
    }
  };

  const toggleMenuHidden = async (menu: AdminMenu) => {
    await api.save("menu", { ...menu, hidden: !menu.hidden });
  };

  const savePageVisibility = async (page: AdminPage) => {
    await api.save("page", { ...page, previousSlug: page.slug, published: !page.published });
  };

  return (
    <div className="grid min-w-0 gap-5">
      <Panel
        title="Menus"
        subtitle="Edite rótulos, destinos e ordem do menu lateral, da barra superior e do rodapé. Links externos e de e-mail são tratados separadamente das páginas do portal."
        actions={<button className="btn btn-pri" type="button" onClick={() => setMenuDraft({ area: "rail", label: {}, href: "/", kind: "route", group: "Portal", icon: "", badge: "", hidden: false, position: data.menu.length })}>+ novo item</button>}
      >
        {AREAS.map((area) => {
          const list = data.menu.filter((menu) => menu.area === area).sort((a, b) => a.position - b.position);
          return (
            <div key={area} className="mb-6 min-w-0 last:mb-0">
              <p className="eyebrow mb-2">
                {area === "rail" ? "Menu lateral" : area === "top" ? "Barra superior" : "Rodapé"}
              </p>
              {list.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-sm text-mute">Nenhum item nesta área.</p> : null}
              <div className="grid min-w-0 gap-2">
                {list.map((menu) => (
                  <div className="table-row min-w-0" key={menu.id}>
                    <div className="min-w-0">
                      <p className="break-words font-display text-lg font-bold uppercase">
                        {(menu.label as ML)?.[source] || menu.href}
                        {menu.badge ? <span className="tag ml-2">{menu.badge}</span> : null}
                        {menu.hidden ? <span className="ml-2 rounded bg-red-500/20 px-2 py-0.5 text-[11px] text-red-300">OCULTO</span> : null}
                      </p>
                      <p className="break-all text-xs text-mute">{menu.href} · {menu.group || "sem grupo"} · {menu.kind || "route"}</p>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-1">
                      <button className="chip" type="button" data-on={!menu.hidden} onClick={() => void toggleMenuHidden(menu)} title={menu.hidden ? "Mostrar no menu" : "Ocultar do menu"}>
                        {menu.hidden ? "Mostrar" : "Ocultar"}
                      </button>
                      <button className="chip" type="button" aria-label="Mover para cima" onClick={() => void api.action("move", { entity: "menu", id: menu.id, direction: -1 })}>↑</button>
                      <button className="chip" type="button" aria-label="Mover para baixo" onClick={() => void api.action("move", { entity: "menu", id: menu.id, direction: 1 })}>↓</button>
                      <button className="chip" type="button" onClick={() => setMenuDraft({ ...menu })}>Editar</button>
                      <button className="chip" type="button" onClick={() => { if (window.confirm("Excluir este item de menu?")) void api.action("delete", { entity: "menu", id: String(menu.id) }); }}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Panel>

      {menuDraft ? (
        <Panel
          title={menuDraft.id ? `Editar item #${menuDraft.id}` : "Novo item de menu"}
          actions={
            <>
              <button className="btn" type="button" disabled={savingMenu} onClick={() => setMenuDraft(null)}>Cancelar</button>
              <button className="btn btn-gold" type="button" disabled={savingMenu} onClick={() => void saveMenu()}>{savingMenu ? "Salvando…" : "Salvar menu"}</button>
            </>
          }
        >
          <div className="grid min-w-0 gap-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block min-w-0">
                <Label>Área</Label>
                <select className="field" value={menuDraft.area || "rail"} onChange={(event) => setMenuDraft({ ...menuDraft, area: event.target.value })}>
                  {AREAS.map((area) => <option key={area} value={area}>{area === "rail" ? "Menu lateral" : area === "top" ? "Barra superior" : "Rodapé"}</option>)}
                </select>
              </label>
              <label className="block min-w-0">
                <Label>Tipo de destino</Label>
                <select className="field" value={menuDraft.kind || "route"} onChange={(event) => setMenuDraft({ ...menuDraft, kind: event.target.value })}>
                  <option value="route">Página interna</option>
                  <option value="external">Link externo</option>
                  <option value="email">E-mail</option>
                </select>
              </label>
              <TextField label="Grupo" value={menuDraft.group || ""} onChange={(value) => setMenuDraft({ ...menuDraft, group: value })} />
              <TextField label="Destino" value={menuDraft.href || ""} onChange={(value) => setMenuDraft({ ...menuDraft, href: value })} mono placeholder={menuDraft.kind === "external" ? "https://exemplo.com" : menuDraft.kind === "email" ? "contato@exemplo.com" : "/news"} />
              <TextField label="Ícone / letra / URL de ícone" value={menuDraft.icon || ""} onChange={(value) => setMenuDraft({ ...menuDraft, icon: value })} />
              <TextField label="Selo" value={menuDraft.badge || ""} onChange={(value) => setMenuDraft({ ...menuDraft, badge: value })} />
              <TextField label="Posição" type="number" value={menuDraft.position ?? 0} onChange={(value) => setMenuDraft({ ...menuDraft, position: Number(value) })} />
              <div className="flex min-w-0 items-end pb-1"><Toggle label="Oculto" value={Boolean(menuDraft.hidden)} onChange={(value) => setMenuDraft({ ...menuDraft, hidden: value })} /></div>
            </div>
            <p className="-mt-2 text-xs text-mute">
              {menuDraft.kind === "external" ? "O link externo precisa começar com https:// e será aberto em uma nova aba." : menuDraft.kind === "email" ? "Informe o endereço de e-mail; o link mailto: será criado automaticamente." : "Use o caminho relativo do portal, por exemplo /news ou /relacionamento."}
            </p>
            <MLField label="Rótulo em cada idioma" value={menuDraft.label} langs={langs} source={source} translate={api.translate} onChange={(value) => setMenuDraft({ ...menuDraft, label: value })} />
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Páginas"
        subtitle="Edite títulos, imagens e conteúdo por blocos. Páginas personalizadas podem gerar automaticamente um atalho no grupo ‘Páginas’ do menu lateral."
        actions={<button className="btn btn-pri" type="button" onClick={() => setPageDraft({ slug: "", template: "custom", title: {}, subtitle: {}, kicker: {}, image: "", blocks: [], published: true, showInMenu: true, position: 50, previousSlug: "" })}>+ nova página</button>}
      >
        <div className="grid min-w-0 gap-2">
          {data.pages.map((page) => (
            <div className="table-row min-w-0" key={page.slug}>
              <div className="min-w-0">
                <p className="break-words font-display text-lg font-bold uppercase">{(page.title as ML)?.[source] || page.slug}</p>
                <p className="break-all text-xs text-mute">/{page.slug} · template {page.template} · {(page.blocks || []).length} blocos {!page.published ? "· rascunho" : ""}</p>
              </div>
              <div className="flex min-w-0 flex-wrap gap-1">
                <button className="chip" type="button" data-on={page.published} onClick={() => void savePageVisibility(page)}>{page.published ? "Publicada" : "Rascunho"}</button>
                <button className="chip" type="button" onClick={() => setPageDraft({ ...page, previousSlug: page.slug, blocks: parseBlocks(page.blocks) || [] })}>Editar</button>
                {page.template === "custom" ? (
                  <button className="chip" type="button" onClick={() => { if (window.confirm(`Excluir /${page.slug}?`)) void api.action("delete", { entity: "page", id: page.slug }); }}>Excluir</button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {pageDraft ? (
        <Panel
          title={pageDraft.slug ? `Editar página /${pageDraft.slug}` : "Nova página"}
          actions={
            <>
              <button className="btn" type="button" disabled={savingPage} onClick={() => setPageDraft(null)}>Cancelar</button>
              <button className="btn btn-gold" type="button" disabled={savingPage} onClick={() => void savePage()}>{savingPage ? "Salvando…" : "Salvar página"}</button>
            </>
          }
        >
          <div className="grid min-w-0 gap-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <TextField label="Endereço (slug)" value={pageDraft.slug} onChange={(value) => setPageDraft({ ...pageDraft, slug: value })} mono placeholder="minha-pagina" />
                <p className="mt-1 break-all text-[11px] text-mute">URL: /{source}/{pageDraft.slug || "…"}</p>
              </div>
              <label className="block min-w-0">
                <Label>Modelo de página</Label>
                <select className="field" value={pageDraft.template} onChange={(event) => setPageDraft({ ...pageDraft, template: event.target.value })}>
                  {TEMPLATES.map((template) => <option key={template} value={template}>{template}</option>)}
                </select>
              </label>
              <TextField label="Posição" type="number" value={pageDraft.position} onChange={(value) => setPageDraft({ ...pageDraft, position: Number(value) })} />
              <div className="flex min-w-0 flex-wrap items-end gap-2 pb-1">
                <Toggle label="Publicada" value={pageDraft.published} onChange={(value) => setPageDraft({ ...pageDraft, published: value })} />
                {pageDraft.template === "custom" ? (
                  <Toggle label="No menu lateral" value={pageDraft.showInMenu} onChange={(value) => setPageDraft({ ...pageDraft, showInMenu: value })} />
                ) : <span className="text-xs text-mute">O menu deste modelo é gerenciado acima.</span>}
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <ImageField label="Imagem de capa da página" value={pageDraft.image || ""} onChange={(value) => setPageDraft({ ...pageDraft, image: value })} />
              </div>
            </div>

            <MLField label="Título" value={pageDraft.title} langs={langs} source={source} translate={api.translate} onChange={(value) => setPageDraft({ ...pageDraft, title: value })} />
            <MLField label="Sobretítulo (kicker)" value={pageDraft.kicker} langs={langs} source={source} translate={api.translate} onChange={(value) => setPageDraft({ ...pageDraft, kicker: value })} />
            <MLField label="Subtítulo" value={pageDraft.subtitle} langs={langs} source={source} translate={api.translate} multiline rows={2} onChange={(value) => setPageDraft({ ...pageDraft, subtitle: value })} />

            <BlocksEditor
              blocks={parseBlocks(pageDraft.blocks) || []}
              onChange={(blocks) => setPageDraft({ ...pageDraft, blocks })}
              langs={langs}
              source={source}
              translate={api.translate}
            />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
