"use client";

import { useState } from "react";
import type { Api } from "./api";
import { Panel } from "./fields";
import { CONTENT_TYPES } from "./types";

export function OverviewTab({ api }: { api: Api }) {
  const { data } = api;
  const [busy, setBusy] = useState<string | null>(null);
  const leads = data.items.filter((i) => i.type === "lead");

  const run = async (action: string, message: string) => {
    setBusy(action);
    try {
      const result = await api.action(action);
      if (!result.error) {
        api.toast(action === "translate-all" ? `${result.updated || 0} campos traduzidos (${result.engine})` : message);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-5">
      <Panel title="Visão geral" subtitle="Estado atual do portal no banco de dados.">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { value: data.items.length, label: "registros de conteúdo" },
            { value: data.pages.length, label: "páginas" },
            { value: data.menu.length, label: "itens de menu" },
            { value: data.ui.length, label: "textos de interface" },
            { value: data.languages.length, label: "idiomas" },
          ].map((s) => (
            <div className="stat" key={s.label}><b>{s.value}</b><span>{s.label}</span></div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {CONTENT_TYPES.map((t) => (
            <span className="chip" key={t.id}>{t.label}: {data.items.filter((i) => i.type === t.id).length}</span>
          ))}
        </div>
      </Panel>

      <Panel
        title="Traduções instantâneas"
        subtitle={`Mecanismo ativo: ${data.engineLabel}. Preenche automaticamente todos os campos vazios em cada idioma habilitado.`}
        actions={<button className="btn btn-pri" disabled={busy === "translate-all"} onClick={() => run("translate-all", "")}>{busy === "translate-all" ? "Traduzindo…" : "Traduzir tudo agora"}</button>}
      >
        {data.engine === "dictionary" ? (
          <div className="rounded-xl border border-line bg-ink/40 p-4 text-sm text-mute">
            <p className="mb-2 font-display text-base uppercase tracking-wide text-gold">Sem provedor externo configurado</p>
            <p>
              O portal está usando o dicionário local (offline). Para tradução neural instantânea, defina uma destas variáveis de ambiente:
              <code className="ml-1 rounded bg-black/30 px-1">DEEPL_API_KEY</code>,
              <code className="ml-1 rounded bg-black/30 px-1">OPENAI_API_KEY</code>,
              <code className="ml-1 rounded bg-black/30 px-1">GOOGLE_TRANSLATE_API_KEY</code> ou
              <code className="ml-1 rounded bg-black/30 px-1">LIBRETRANSLATE_URL</code>.
              Nenhum segredo é exposto ao navegador: a tradução roda em <code className="rounded bg-black/30 px-1">/api/translate</code>.
            </p>
          </div>
        ) : (
          <p className="text-sm text-mute">Provedor externo conectado — as traduções usam a API configurada no servidor.</p>
        )}
      </Panel>

      {leads.length > 0 && (
        <Panel title="Leads do simulador" subtitle="Pedidos de proposta enviados pelo Media Relations.">
          <div className="grid gap-2">
            {leads.map((lead) => {
              const meta = (lead.meta || {}) as { email?: string; brand?: string; plan?: string[]; total?: number; reach?: number };
              return (
                <div className="table-row" key={lead.id}>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold uppercase">{meta.brand || lead.id}</p>
                    <p className="truncate text-xs text-mute">{meta.email} · plano {(meta.plan || []).join(", ")} · R$ {meta.total} · alcance {meta.reach}</p>
                  </div>
                  <button className="chip" onClick={() => { if (confirm("Excluir lead?")) api.action("delete", { entity: "item", id: lead.id }); }}>✕</button>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="Atividade" subtitle="Últimas alterações gravadas no banco.">
        <div className="grid gap-1">
          {(data.log || []).map((entry) => (
            <div className="flex flex-wrap items-center gap-2 border-b border-line/60 py-1.5 text-xs" key={entry.id}>
              <span className="font-mono text-mute">{new Date(entry.at).toLocaleString()}</span>
              <span className="chip !py-0.5">{entry.entity}</span>
              <span className="font-display uppercase tracking-wider text-blush">{entry.action}</span>
              <span className="text-mute">{entry.entityId}</span>
              {entry.detail && <span className="truncate text-mute/70">— {entry.detail}</span>}
            </div>
          ))}
          {!(data.log || []).length && <p className="text-sm text-mute">Sem alterações registradas ainda.</p>}
        </div>
      </Panel>

      <Panel title="Zona de risco" subtitle="Restaura todo o conteúdo de demonstração (substitui o que estiver no banco).">
        <button className="btn" disabled={busy === "reset"} onClick={() => { if (confirm("Restaurar conteúdo de demonstração? Isso apaga as alterações atuais.")) run("reset", "Demonstração restaurada"); }}>
          {busy === "reset" ? "Restaurando…" : "Restaurar demonstração"}
        </button>
      </Panel>
    </div>
  );
}
