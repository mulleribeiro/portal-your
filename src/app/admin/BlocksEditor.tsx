"use client";

import { useEffect, useState } from "react";
import { ImageField, MLField, TextField } from "./fields";
import type { ML } from "./types";

type Block = Record<string, unknown>;
const TYPES = ["heading", "paragraph", "quote", "image", "cta", "stats", "columns", "list"] as const;
const TYPE_LABEL: Record<string, string> = {
  heading: "Título",
  paragraph: "Parágrafo",
  quote: "Citação",
  image: "Imagem",
  cta: "Botão / link",
  stats: "Estatísticas",
  columns: "Colunas",
  list: "Lista",
};

function asBlock(value: unknown): Block {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Block : {};
}

function asML(value: unknown, source: string): ML {
  if (typeof value === "string") return { [source]: value };
  return value && typeof value === "object" && !Array.isArray(value) ? value as ML : {};
}

function makeBlock(type: typeof TYPES[number], source: string): Block {
  const empty: ML = { [source]: "" };
  switch (type) {
    case "heading":
    case "paragraph":
    case "quote": return { type, text: { ...empty } };
    case "image": return { type, src: "", caption: { ...empty } };
    case "cta": return { type, label: { ...empty }, href: "/" };
    case "stats": return { type, items: [{ value: "", label: { ...empty } }] };
    case "columns": return { type, columns: [{ title: { ...empty }, text: { ...empty } }] };
    case "list": return { type, items: [{ ...empty }] };
  }
}

function RawBlockEditor({ value, onChange }: { value: Block; onChange: (next: Block) => void }) {
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState("");

  useEffect(() => {
    setRaw(JSON.stringify(value, null, 2));
    setError("");
  }, [value]);

  return (
    <div>
      <label className="label">JSON avançado deste bloco</label>
      <textarea
        className="field min-h-36 max-w-full font-mono text-xs"
        value={raw}
        spellCheck={false}
        onChange={(event) => {
          const text = event.target.value;
          setRaw(text);
          try {
            const parsed: unknown = JSON.parse(text);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("O bloco precisa ser um objeto JSON.");
            setError("");
            onChange(parsed as Block);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "JSON inválido");
          }
        }}
      />
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : <p className="mt-1 text-xs text-mute">Bloco personalizado — o conteúdo é preservado como JSON.</p>}
    </div>
  );
}

export function BlocksEditor({
  blocks,
  onChange,
  langs,
  source,
  translate,
}: {
  blocks: unknown[];
  onChange: (blocks: unknown[]) => void;
  langs: string[];
  source: string;
  translate: (text: string, target: string, source?: string) => Promise<string>;
}) {
  const setBlock = (index: number, patch: Block) => {
    onChange(blocks.map((entry, i) => i === index ? { ...asBlock(entry), ...patch } : entry));
  };

  const setArrayItem = (index: number, key: string, itemIndex: number, value: unknown) => {
    const block = asBlock(blocks[index]);
    const entries = Array.isArray(block[key]) ? block[key] as unknown[] : [];
    setBlock(index, { [key]: entries.map((entry, i) => i === itemIndex ? value : entry) });
  };

  const addArrayItem = (index: number, key: string, value: unknown) => {
    const block = asBlock(blocks[index]);
    const entries = Array.isArray(block[key]) ? block[key] as unknown[] : [];
    setBlock(index, { [key]: [...entries, value] });
  };

  const removeArrayItem = (index: number, key: string, itemIndex: number) => {
    const block = asBlock(blocks[index]);
    const entries = Array.isArray(block[key]) ? block[key] as unknown[] : [];
    setBlock(index, { [key]: entries.filter((_, i) => i !== itemIndex) });
  };

  const translateFromSource = (text: string, target: string) => translate(text, target, source);

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label">Conteúdo da página</p>
          <p className="text-xs text-mute">Adicione blocos e edite os campos sem precisar alterar JSON.</p>
        </div>
        <span className="chip !cursor-default">{blocks.length} {blocks.length === 1 ? "bloco" : "blocos"}</span>
      </div>

      <div className="flex min-w-0 flex-wrap gap-2">
        {TYPES.map((type) => (
          <button key={type} className="chip" type="button" onClick={() => onChange([...blocks, makeBlock(type, source)])}>
            + {TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-mute">Esta página ainda não tem blocos. Escolha um tipo acima para começar.</p>
      ) : null}

      {blocks.map((value, index) => {
        const block = asBlock(value);
        const type = typeof block.type === "string" ? block.type : "custom";
        const label = TYPE_LABEL[type] || "Bloco personalizado";
        const text = asML(block.text, source);

        return (
          <section className="grid min-w-0 gap-3 rounded-xl border border-line bg-ink/40 p-3 sm:p-4" key={`${index}-${type}`}>
            <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-line pb-3">
              <span className="mr-auto font-display text-sm font-bold uppercase tracking-widest text-blush">{index + 1}. {label}</span>
              <button className="chip" type="button" disabled={index === 0} aria-label={`Mover bloco ${index + 1} para cima`} onClick={() => {
                const next = [...blocks];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}>↑</button>
              <button className="chip" type="button" disabled={index === blocks.length - 1} aria-label={`Mover bloco ${index + 1} para baixo`} onClick={() => {
                const next = [...blocks];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                onChange(next);
              }}>↓</button>
              <button className="chip" type="button" aria-label={`Excluir bloco ${index + 1}`} onClick={() => onChange(blocks.filter((_, i) => i !== index))}>Excluir</button>
            </div>

            {type === "heading" || type === "paragraph" || type === "quote" ? (
              <MLField
                label={type === "heading" ? "Texto do título" : type === "quote" ? "Texto da citação" : "Texto do parágrafo"}
                value={text}
                langs={langs}
                source={source}
                translate={translateFromSource}
                multiline={type !== "heading"}
                rows={type === "quote" ? 3 : 4}
                onChange={(next) => setBlock(index, { text: next })}
              />
            ) : null}

            {type === "image" ? (
              <div className="grid min-w-0 gap-3">
                <ImageField label="Imagem do bloco" value={String(block.src || "")} onChange={(src) => setBlock(index, { src })} />
                <MLField label="Legenda" value={asML(block.caption, source)} langs={langs} source={source} translate={translateFromSource} onChange={(caption) => setBlock(index, { caption })} />
              </div>
            ) : null}

            {type === "cta" ? (
              <div className="grid min-w-0 gap-3">
                <MLField label="Texto do botão" value={asML(block.label, source)} langs={langs} source={source} translate={translateFromSource} onChange={(label) => setBlock(index, { label })} />
                <TextField label="Destino do link" value={String(block.href || "")} onChange={(href) => setBlock(index, { href })} mono placeholder="/relacionamento" />
              </div>
            ) : null}

            {type === "stats" ? (
              <div className="grid min-w-0 gap-3">
                {(Array.isArray(block.items) ? block.items : []).map((entry, itemIndex) => {
                  const stat = asBlock(entry);
                  return (
                    <div className="grid min-w-0 gap-3 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,1fr)_auto]" key={itemIndex}>
                      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                        <TextField label="Valor" value={String(stat.value || "")} onChange={(value) => setArrayItem(index, "items", itemIndex, { ...stat, value })} />
                        <MLField label="Rótulo" value={asML(stat.label, source)} langs={langs} source={source} translate={translateFromSource} onChange={(label) => setArrayItem(index, "items", itemIndex, { ...stat, label })} />
                      </div>
                      <button className="chip self-start" type="button" onClick={() => removeArrayItem(index, "items", itemIndex)} aria-label="Remover estatística">Excluir</button>
                    </div>
                  );
                })}
                <button className="btn w-fit" type="button" onClick={() => addArrayItem(index, "items", { value: "", label: { [source]: "" } })}>+ adicionar estatística</button>
              </div>
            ) : null}

            {type === "columns" ? (
              <div className="grid min-w-0 gap-3">
                {(Array.isArray(block.columns) ? block.columns : []).map((entry, itemIndex) => {
                  const column = asBlock(entry);
                  return (
                    <div className="grid min-w-0 gap-3 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,1fr)_auto]" key={itemIndex}>
                      <div className="grid min-w-0 gap-3">
                        <MLField label={`Título da coluna ${itemIndex + 1}`} value={asML(column.title, source)} langs={langs} source={source} translate={translateFromSource} onChange={(title) => setArrayItem(index, "columns", itemIndex, { ...column, title })} />
                        <MLField label="Texto" value={asML(column.text, source)} langs={langs} source={source} translate={translateFromSource} multiline onChange={(textValue) => setArrayItem(index, "columns", itemIndex, { ...column, text: textValue })} />
                      </div>
                      <button className="chip self-start" type="button" onClick={() => removeArrayItem(index, "columns", itemIndex)} aria-label="Remover coluna">Excluir</button>
                    </div>
                  );
                })}
                <button className="btn w-fit" type="button" onClick={() => addArrayItem(index, "columns", { title: { [source]: "" }, text: { [source]: "" } })}>+ adicionar coluna</button>
              </div>
            ) : null}

            {type === "list" ? (
              <div className="grid min-w-0 gap-3">
                {(Array.isArray(block.items) ? block.items : []).map((entry, itemIndex) => (
                  <div className="grid min-w-0 gap-2 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,1fr)_auto]" key={itemIndex}>
                    <MLField label={`Item ${itemIndex + 1}`} value={asML(entry, source)} langs={langs} source={source} translate={translateFromSource} onChange={(next) => setArrayItem(index, "items", itemIndex, next)} />
                    <button className="chip self-start" type="button" onClick={() => removeArrayItem(index, "items", itemIndex)} aria-label="Remover item da lista">Excluir</button>
                  </div>
                ))}
                <button className="btn w-fit" type="button" onClick={() => addArrayItem(index, "items", { [source]: "" })}>+ adicionar item</button>
              </div>
            ) : null}

            {!TYPES.some((known) => known === type) ? (
              <RawBlockEditor value={block} onChange={(next) => onChange(blocks.map((entry, i) => i === index ? next : entry))} />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
