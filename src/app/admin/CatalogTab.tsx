"use client";

import { useState } from "react";
import type { Api } from "./api";
import { Panel } from "./fields";

type CatGroup = { id: string; nome: string; desc: string };
type CatItem = {
  id: string; grupo: string; nome: string; desc: string; preco: number;
  unidade: string; natureza: string; qtdMax: number; prazo: string; entrega: string[]; ativo?: boolean;
};
type Catalog = { grupos: CatGroup[]; itens: CatItem[]; prazos: { meses: number; desconto: number; nome: string }[]; condicoes: string[]; validadeDias: number };

export function CatalogTab({ api }: { api: Api }) {
  const s = api.data.settings as Record<string, unknown>;
  const [draft, setDraft] = useState<Catalog>(
    (s.catalog as Catalog) || { grupos: [], itens: [], prazos: [], condicoes: [], validadeDias: 15 },
  );
  const [group, setGroup] = useState<string>("all");
  const [raw, setRaw] = useState<string | null>(null);

  const save = async () => {
    let payload = draft;
    if (raw !== null) {
      try {
        payload = JSON.parse(raw) as Catalog;
        setDraft(payload);
      } catch {
        api.toast("JSON inválido");
        return;
      }
    }
    const r = await api.save("settings", { ...s, catalog: payload });
    if (!r.error) api.toast("Catálogo salvo");
  };

  const grupos = draft.grupos || [];
  const itens = (draft.itens || []).filter((i) => (group === "all" ? true : i.grupo === group));

  const patch = (i: CatItem, p: Partial<CatItem>) =>
    setDraft((d) => ({ ...d, itens: d.itens.map((x) => (x.id === i.id ? { ...x, ...p } : x)) }));

  const addItem = (grupo: string) => {
    const id = `item-${Date.now().toString(36)}`;
    setDraft((d) => ({
      ...d,
      itens: [
        ...d.itens,
        { id, grupo, nome: "Novo item", desc: "", preco: 1000, unidade: "unico", natureza: "servico", qtdMax: 1, prazo: "10 dias úteis", entrega: [], ativo: true },
      ],
    }));
  };

  const addGroup = () => {
    const id = `grupo-${Date.now().toString(36)}`;
    setDraft((d) => ({ ...d, grupos: [...d.grupos, { id, nome: "Nova categoria", desc: "" }] }));
    setGroup(id);
  };

  return (
    <div className="grid gap-5">
      <Panel
        title="Catálogo — Serviços, Produtos e Categorias"
        subtitle={`${grupos.length} categorias · ${draft.itens.length} itens · valores exibidos no construtor de orçamento e no Media Relations.`}
        actions={
          <>
            <button className="btn" onClick={() => setRaw(raw === null ? JSON.stringify(draft, null, 2) : null)}>
              {raw === null ? "Editar em JSON" : "Fechar JSON"}
            </button>
            <button className="btn btn-gold" onClick={save}>Salvar catálogo</button>
          </>
        }
      >
        {raw !== null ? (
          <>
            <textarea className="field min-h-[420px] font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} />
            <p className="mt-2 text-xs text-mute">
              Estrutura: {"{ grupos:[{id,nome,desc}], itens:[{id,grupo,nome,desc,preco,unidade,natureza,qtdMax,prazo,entrega[],ativo}], prazos:[{meses,desconto,nome}], condicoes:[], validadeDias }"}
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <button className="chip" data-on={group === "all"} onClick={() => setGroup("all")}>Todos ({draft.itens.length})</button>
              {grupos.map((g) => (
                <button key={g.id} className="chip" data-on={group === g.id} onClick={() => setGroup(g.id)}>
                  {g.nome} ({draft.itens.filter((i) => i.grupo === g.id).length})
                </button>
              ))}
              <button className="btn ml-auto" onClick={addGroup}>+ categoria</button>
              <button className="btn btn-pri" onClick={() => addItem(group === "all" ? grupos[0]?.id || "geral" : group)}>+ item</button>
            </div>

            {group !== "all" && (
              <div className="mb-4 grid gap-3 rounded-xl border border-line bg-ink/40 p-4 sm:grid-cols-2">
                <input
                  className="field"
                  value={grupos.find((g) => g.id === group)?.nome || ""}
                  placeholder="Nome da categoria"
                  onChange={(e) => setDraft((d) => ({ ...d, grupos: d.grupos.map((g) => (g.id === group ? { ...g, nome: e.target.value } : g)) }))}
                />
                <input
                  className="field"
                  value={grupos.find((g) => g.id === group)?.desc || ""}
                  placeholder="Descrição da categoria"
                  onChange={(e) => setDraft((d) => ({ ...d, grupos: d.grupos.map((g) => (g.id === group ? { ...g, desc: e.target.value } : g)) }))}
                />
              </div>
            )}

            <div className="grid gap-2">
              {itens.map((i) => (
                <div key={i.id} className="grid gap-2 rounded-xl border border-line bg-ink/30 p-3 lg:grid-cols-[1.4fr_.5fr_.6fr_.6fr_auto]">
                  <input className="field" value={i.nome} onChange={(e) => patch(i, { nome: e.target.value })} placeholder="Nome do item" />
                  <input className="field" type="number" value={i.preco} onChange={(e) => patch(i, { preco: Number(e.target.value) || 0 })} placeholder="Preço" />
                  <select className="field" value={i.unidade} onChange={(e) => patch(i, { unidade: e.target.value })}>
                    <option value="unico">valor único</option>
                    <option value="mensal">mensal</option>
                  </select>
                  <input className="field" value={i.prazo} onChange={(e) => patch(i, { prazo: e.target.value })} placeholder="Prazo" />
                  <div className="flex items-center gap-1">
                    <button
                      className="chip"
                      data-on={i.ativo !== false}
                      onClick={() => patch(i, { ativo: i.ativo === false })}
                    >
                      {i.ativo === false ? "oculto" : "ativo"}
                    </button>
                    <button
                      className="chip"
                      onClick={() => setDraft((d) => ({ ...d, itens: d.itens.filter((x) => x.id !== i.id) }))}
                    >✕</button>
                  </div>
                  <textarea
                    className="field min-h-[52px] lg:col-span-2"
                    value={i.desc}
                    onChange={(e) => patch(i, { desc: e.target.value })}
                    placeholder="Descrição do item"
                  />
                  <textarea
                    className="field min-h-[52px] lg:col-span-3"
                    value={(i.entrega || []).join("; ")}
                    onChange={(e) => patch(i, { entrega: e.target.value.split(";").map((x) => x.trim()).filter(Boolean) })}
                    placeholder="Entregas separadas por ponto e vírgula"
                  />
                </div>
              ))}
              {!itens.length && <p className="text-sm text-mute">Nenhum item nesta categoria.</p>}
            </div>
          </>
        )}
      </Panel>

      <Panel title="Prazos e descontos" subtitle="Durações do contrato oferecidas no construtor de orçamento.">
        <div className="grid gap-2">
          {(draft.prazos || []).map((p, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[120px_120px_1fr_auto]">
              <input className="field" type="number" value={p.meses} onChange={(e) => setDraft((d) => ({ ...d, prazos: d.prazos.map((x, j) => (j === i ? { ...x, meses: Number(e.target.value) || 1 } : x)) }))} />
              <input className="field" type="number" value={p.desconto} onChange={(e) => setDraft((d) => ({ ...d, prazos: d.prazos.map((x, j) => (j === i ? { ...x, desconto: Number(e.target.value) || 0 } : x)) }))} />
              <input className="field" value={p.nome} onChange={(e) => setDraft((d) => ({ ...d, prazos: d.prazos.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) }))} />
              <button className="chip" onClick={() => setDraft((d) => ({ ...d, prazos: d.prazos.filter((_, j) => j !== i) }))}>✕</button>
            </div>
          ))}
          <button className="btn w-fit" onClick={() => setDraft((d) => ({ ...d, prazos: [...(d.prazos || []), { meses: 12, desconto: 10, nome: "12 meses, 10%" }] }))}>+ prazo</button>
        </div>
      </Panel>

      <Panel title="Condições comerciais" subtitle="Texto exibido na proposta e na página de orçamento.">
        <div className="grid gap-2">
          {(draft.condicoes || []).map((c, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                className="field min-h-[52px]"
                value={c}
                onChange={(e) => setDraft((d) => ({ ...d, condicoes: d.condicoes.map((x, j) => (j === i ? e.target.value : x)) }))}
              />
              <button className="chip" onClick={() => setDraft((d) => ({ ...d, condicoes: d.condicoes.filter((_, j) => j !== i) }))}>✕</button>
            </div>
          ))}
          <button className="btn w-fit" onClick={() => setDraft((d) => ({ ...d, condicoes: [...(d.condicoes || []), ""] }) as Catalog)}>+ condição</button>
          <div className="mt-2 grid gap-2 sm:grid-cols-[180px]">
            <input
              className="field"
              type="number"
              value={draft.validadeDias || 15}
              onChange={(e) => setDraft((d) => ({ ...d, validadeDias: Number(e.target.value) || 15 }))}
              placeholder="Validade (dias)"
            />
            <span className="text-xs text-mute">Validade da proposta (dias)</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
