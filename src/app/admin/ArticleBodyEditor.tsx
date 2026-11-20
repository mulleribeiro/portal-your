"use client";

import { ImageField, MLField } from "./fields";
import type { ML } from "./types";

export type ArticleBodySection =
  | { type: "text"; text: ML }
  | { type: "image"; src: string; alt?: ML; caption?: ML };

export function ArticleBodyEditor({
  sections,
  langs,
  source,
  translate,
  onChange,
}: {
  sections: ArticleBodySection[];
  langs: string[];
  source: string;
  translate: (text: string, target: string, source?: string) => Promise<string>;
  onChange: (sections: ArticleBodySection[]) => void;
}) {
  const update = (index: number, section: ArticleBodySection) => onChange(sections.map((entry, i) => i === index ? section : entry));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const other = index + direction;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other], next[index]];
    onChange(next);
  };

  return (
    <div className="grid min-w-0 gap-3">
      <div>
        <span className="label">Texto e fotos da matéria</span>
        <p className="text-xs text-mute">Adicione blocos na ordem em que devem aparecer. Fotos podem ficar entre quaisquer blocos de texto.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="chip" type="button" onClick={() => onChange([...sections, { type: "text", text: { [source]: "" } }])}>+ bloco de texto</button>
        <button className="chip" type="button" onClick={() => onChange([...sections, { type: "image", src: "", alt: { [source]: "" }, caption: { [source]: "" } }])}>+ foto entre textos</button>
      </div>

      {sections.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-sm text-mute">Adicione um bloco de texto ou uma foto para começar.</p> : null}

      {sections.map((section, index) => (
        <section key={`${index}-${section.type}`} className="grid min-w-0 gap-3 rounded-xl border border-line bg-ink/40 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
            <b className="mr-auto font-display text-sm uppercase tracking-widest text-blush">{index + 1}. {section.type === "text" ? "Texto" : "Foto"}</b>
            <button className="chip" type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Mover bloco para cima">↑</button>
            <button className="chip" type="button" disabled={index === sections.length - 1} onClick={() => move(index, 1)} aria-label="Mover bloco para baixo">↓</button>
            <button className="chip" type="button" onClick={() => onChange(sections.filter((_, i) => i !== index))}>Remover</button>
          </div>

          {section.type === "text" ? (
            <MLField
              label="Texto"
              value={section.text}
              langs={langs}
              source={source}
              translate={(text, target) => translate(text, target, source)}
              onChange={(text) => update(index, { ...section, text })}
              multiline
              rows={8}
            />
          ) : (
            <div className="grid min-w-0 gap-3">
              <ImageField label="Foto" value={section.src} onChange={(src) => update(index, { ...section, src })} />
              <MLField
                label="Legenda da foto (opcional)"
                value={section.caption || {}}
                langs={langs}
                source={source}
                translate={(text, target) => translate(text, target, source)}
                onChange={(caption) => update(index, { ...section, caption })}
              />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
