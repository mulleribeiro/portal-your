"use client";

import { useState } from "react";
import type { Api } from "./api";
import { ImageField, KeyValueList, Label, MLField, Panel, TextField } from "./fields";
import type { ML } from "./types";

type Stat = { value: string; label: ML };
type Ticker = { text: ML; href?: string };
type Social = { label: string; url: string };
type RelOption = { id: string; name: ML; desc?: ML; price: number; reach: number; formats: number };
type RelStep = { step: string; title: ML; desc: ML; deliverable: ML };
type MkFormat = { id: string; name: ML; desc: ML; price: number; reach: number };

const ADVANCED = ["channels", "audienceBreakdown", "genderWomen"] as const;

export function SettingsTab({ api }: { api: Api }) {
  const { data } = api;
  const langs = data.languages.filter((l) => l.enabled).map((l) => l.code);
  const source = data.languages.find((l) => l.isDefault)?.code || "pt";
  const s = data.settings as Record<string, unknown>;
  const [draft, setDraft] = useState<Record<string, unknown>>(s);
  const [advanced, setAdvanced] = useState(() => JSON.stringify(Object.fromEntries(ADVANCED.map((k) => [k, s[k]])), null, 2));

  const set = (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value }));
  const ml = (key: string) => (draft[key] as ML) || {};
  const list = <T,>(key: string): T[] => (draft[key] as T[]) || [];
  const theme = (draft.theme as Record<string, string>) || {};

  const save = async () => {
    let extra: Record<string, unknown> = {};
    try {
      extra = JSON.parse(advanced);
    } catch {
      api.toast("JSON avançado inválido");
      return;
    }
    const result = await api.save("settings", { ...draft, ...extra });
    if (!result.error) api.toast("Configurações salvas");
  };

  const relOptions = list<RelOption>("relationsOptions");
  const relSteps = list<RelStep>("relationsSteps");
  const mkFormats = list<MkFormat>("formats");

  return (
    <div className="grid gap-5">
      <Panel
        title="Media Relations & Simulador de Plano (Valores e Entregas)"
        subtitle="Altere todos os preços (R$), alcances estimados, número de formatos e opções do simulador de plano em /relations."
        actions={<button className="btn btn-gold" onClick={save}>Salvar tudo</button>}
      >
        <div className="grid gap-4">
          {relOptions.map((opt, i) => (
            <div key={opt.id || i} className="rounded-xl border border-line bg-ink/40 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-gold">Opção #{i + 1} ({opt.id})</span>
                <button
                  type="button"
                  className="chip"
                  onClick={() => set("relationsOptions", relOptions.filter((_, j) => j !== i))}
                >✕ Remover opção</button>
              </div>
              <div className="mb-3 grid gap-3 sm:grid-cols-4">
                <TextField
                  label="ID"
                  value={opt.id}
                  mono
                  onChange={(v) => set("relationsOptions", relOptions.map((x, j) => (j === i ? { ...x, id: v } : x)))}
                />
                <TextField
                  label="Valor (R$)"
                  type="number"
                  value={opt.price}
                  onChange={(v) => set("relationsOptions", relOptions.map((x, j) => (j === i ? { ...x, price: Number(v) || 0 } : x)))}
                />
                <TextField
                  label="Alcance estimado (views)"
                  type="number"
                  value={opt.reach}
                  onChange={(v) => set("relationsOptions", relOptions.map((x, j) => (j === i ? { ...x, reach: Number(v) || 0 } : x)))}
                />
                <TextField
                  label="Qtd. formatos entregues"
                  type="number"
                  value={opt.formats}
                  onChange={(v) => set("relationsOptions", relOptions.map((x, j) => (j === i ? { ...x, formats: Number(v) || 1 } : x)))}
                />
              </div>
              <div className="grid gap-3">
                <MLField
                  label="Nome do plano / entrega"
                  value={opt.name}
                  langs={langs}
                  source={source}
                  translate={api.translate}
                  onChange={(name) => set("relationsOptions", relOptions.map((x, j) => (j === i ? { ...x, name } : x)))}
                />
                <MLField
                  label="Descrição detalhada"
                  value={opt.desc || {}}
                  langs={langs}
                  source={source}
                  translate={api.translate}
                  onChange={(desc) => set("relationsOptions", relOptions.map((x, j) => (j === i ? { ...x, desc } : x)))}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn w-fit"
            onClick={() =>
              set("relationsOptions", [
                ...relOptions,
                { id: `plano-${relOptions.length + 1}`, name: { [source]: "Novo formato" }, desc: { [source]: "" }, price: 5000, reach: 250000, formats: 3 },
              ])
            }
          >+ adicionar opção ao simulador</button>
        </div>
      </Panel>

      <Panel
        title="Media Relations — Apresentação 'Como Atuamos'"
        subtitle="Etapas interativas exibidas em Media Relations."
        actions={<button className="btn btn-gold" onClick={save}>Salvar tudo</button>}
      >
        <div className="grid gap-4">
          {relSteps.map((st, i) => (
            <div key={i} className="rounded-xl border border-line bg-ink/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <TextField
                  label="Número da etapa"
                  value={st.step}
                  onChange={(v) => set("relationsSteps", relSteps.map((x, j) => (j === i ? { ...x, step: v } : x)))}
                />
                <button type="button" className="chip" onClick={() => set("relationsSteps", relSteps.filter((_, j) => j !== i))}>✕</button>
              </div>
              <div className="grid gap-3">
                <MLField label="Título da etapa" value={st.title} langs={langs} source={source} translate={api.translate} onChange={(title) => set("relationsSteps", relSteps.map((x, j) => (j === i ? { ...x, title } : x)))} />
                <MLField label="Descrição" value={st.desc} langs={langs} source={source} translate={api.translate} multiline onChange={(desc) => set("relationsSteps", relSteps.map((x, j) => (j === i ? { ...x, desc } : x)))} />
                <MLField label="Entregável em destaque" value={st.deliverable} langs={langs} source={source} translate={api.translate} onChange={(deliverable) => set("relationsSteps", relSteps.map((x, j) => (j === i ? { ...x, deliverable } : x)))} />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn w-fit"
            onClick={() =>
              set("relationsSteps", [
                ...relSteps,
                { step: String(relSteps.length + 1).padStart(2, "0"), title: { [source]: "Nova etapa" }, desc: { [source]: "" }, deliverable: { [source]: "" } },
              ])
            }
          >+ adicionar etapa</button>
        </div>
      </Panel>

      <Panel
        title="Mídia Kit — Formatos Comerciais e Valores"
        subtitle="Altere os preços e alcances da calculadora da página Mídia Kit."
        actions={<button className="btn btn-gold" onClick={save}>Salvar tudo</button>}
      >
        <div className="grid gap-4">
          {mkFormats.map((f, i) => (
            <div key={f.id || i} className="rounded-xl border border-line bg-ink/40 p-4">
              <div className="mb-3 grid gap-3 sm:grid-cols-3">
                <TextField label="ID" value={f.id} mono onChange={(v) => set("formats", mkFormats.map((x, j) => (j === i ? { ...x, id: v } : x)))} />
                <TextField label="Valor (R$)" type="number" value={f.price} onChange={(v) => set("formats", mkFormats.map((x, j) => (j === i ? { ...x, price: Number(v) || 0 } : x)))} />
                <TextField label="Alcance estimado" type="number" value={f.reach} onChange={(v) => set("formats", mkFormats.map((x, j) => (j === i ? { ...x, reach: Number(v) || 0 } : x)))} />
              </div>
              <div className="grid gap-3">
                <MLField label="Formato" value={f.name} langs={langs} source={source} translate={api.translate} onChange={(name) => set("formats", mkFormats.map((x, j) => (j === i ? { ...x, name } : x)))} />
                <MLField label="Especificação" value={f.desc} langs={langs} source={source} translate={api.translate} onChange={(desc) => set("formats", mkFormats.map((x, j) => (j === i ? { ...x, desc } : x)))} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Identidade e textos globais"
        subtitle="Logo, slogan, hero, rodapé, redes e números. Tudo multilíngue."
        actions={<><button className="btn" onClick={() => setDraft(s)}>Descartar</button><button className="btn btn-gold" onClick={save}>Salvar tudo</button></>}
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Marca (texto alternativo)" value={String(draft.brand || "")} onChange={(v) => set("brand", v)} />
            <TextField label="E-mail" value={String(draft.email || "")} onChange={(v) => set("email", v)} />
            <TextField label="Telefone / WhatsApp" value={String(draft.phone || "")} onChange={(v) => set("phone", v)} />
            <MLField label="Endereço" value={draft.address as ML} langs={langs} source={source} translate={api.translate} onChange={(v) => set("address", v)} />
          </div>
          <ImageField label="Logo oficial" value={String(draft.logo || "")} onChange={(v) => set("logo", v)} />

          <MLField label="Slogan" value={ml("slogan")} langs={langs} source={source} translate={api.translate} onChange={(v) => set("slogan", v)} />
          <MLField label="Kicker do hero" value={ml("heroKicker")} langs={langs} source={source} translate={api.translate} onChange={(v) => set("heroKicker", v)} />
          <MLField label="Título do hero" value={ml("heroTitle")} langs={langs} source={source} translate={api.translate} onChange={(v) => set("heroTitle", v)} />
          <MLField label="Texto do hero" value={ml("heroText")} langs={langs} source={source} translate={api.translate} onChange={(v) => set("heroText", v)} multiline />
          <MLField label="Texto do rodapé" value={ml("footerText")} langs={langs} source={source} translate={api.translate} onChange={(v) => set("footerText", v)} multiline />

          <KeyValueList label="Números do grupo (mídia kit)" items={list<Stat>("stats")} onChange={(v) => set("stats", v)} langs={langs} source={source} translate={api.translate} />
          <KeyValueList label="Audiência (mídia kit)" items={list<Stat>("audience")} onChange={(v) => set("audience", v)} langs={langs} source={source} translate={api.translate} />
          <KeyValueList label="Rede de distribuição (Media Relations)" items={list<Stat>("network")} onChange={(v) => set("network", v)} langs={langs} source={source} translate={api.translate} />

          <div>
            <Label>Ticker (chamadas rotativas)</Label>
            <div className="grid gap-2">
              {list<Ticker>("ticker").map((item, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-line p-3">
                  <MLField label={`chamada ${i + 1}`} value={item.text} langs={langs} source={source} translate={api.translate} onChange={(text) => set("ticker", list<Ticker>("ticker").map((x, j) => (j === i ? { ...x, text } : x)))} />
                  <div className="flex gap-2">
                    <input className="field font-mono text-xs" value={item.href || ""} placeholder="/news" onChange={(e) => set("ticker", list<Ticker>("ticker").map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
                    <button className="chip" onClick={() => set("ticker", list<Ticker>("ticker").filter((_, j) => j !== i))}>✕</button>
                  </div>
                </div>
              ))}
              <button className="btn w-fit" onClick={() => set("ticker", [...list<Ticker>("ticker"), { text: { [source]: "" }, href: "/" }])}>+ chamada</button>
            </div>
          </div>

          <div>
            <Label>Redes sociais</Label>
            <div className="grid gap-2">
              {list<Social>("social").map((item, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                  <input className="field" value={item.label} onChange={(e) => set("social", list<Social>("social").map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input className="field font-mono text-xs" value={item.url} onChange={(e) => set("social", list<Social>("social").map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  <button className="chip" onClick={() => set("social", list<Social>("social").filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              <button className="btn w-fit" onClick={() => set("social", [...list<Social>("social"), { label: "", url: "" }])}>+ rede</button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Mídia kit: canais e faixas etárias (JSON)" subtitle="Dados numéricos de canais e faixa etária do Mídia Kit.">
        <textarea className="field min-h-[220px] font-mono text-xs" value={advanced} onChange={(e) => setAdvanced(e.target.value)} />
      </Panel>

      <Panel title="Tema" subtitle="Tokens de cor aplicados em todo o portal (CSS variables).">
        <div className="grid gap-3 sm:grid-cols-4">
          {Object.keys(theme).map((key) => (
            <label key={key} className="block">
              <Label>{key}</Label>
              <span className="flex items-center gap-2">
                <input type="color" className="h-9 w-10 cursor-pointer rounded border border-line bg-transparent" value={theme[key]} onChange={(e) => set("theme", { ...theme, [key]: e.target.value })} />
                <input className="field font-mono text-xs" value={theme[key]} onChange={(e) => set("theme", { ...theme, [key]: e.target.value })} />
              </span>
            </label>
          ))}
        </div>
      </Panel>
    </div>
  );
}
