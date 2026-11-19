"use client";

import { useState } from "react";
import type { Api } from "./api";
import { ImageField, Label, MLField, Panel, TextField } from "./fields";
import type { AdminMenu, ML } from "./types";
import { uploadImage } from "@/lib/upload-client";

type Img = { label: string; url: string };
type Lk = { label: ML; href: string };

export function MediaTab({ api }: { api: Api }) {
  const { data } = api;
  const s = data.settings as Record<string, unknown>;
  const langs = data.languages.filter((l) => l.enabled).map((l) => l.code);
  const source = data.languages.find((l) => l.isDefault)?.code || "pt";

  const [logo, setLogo] = useState(String(s.logo || ""));
  const [images, setImages] = useState<Record<string, Img>>((s.images as Record<string, Img>) || {});
  const [links, setLinks] = useState<Record<string, Lk>>((s.links as Record<string, Lk>) || {});
  const [newKey, setNewKey] = useState("");
  const [busy, setBusy] = useState(false);

  const saveAll = async () => {
    const result = await api.save("settings", { ...s, logo, images, links });
    if (!result.error) api.toast("Imagens e botões salvos");
  };

  const uploadMany = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) await uploadImage(f);
      await api.refresh();
      api.toast(`${files.length} arquivo(s) enviado(s)`);
    } catch {
      api.toast("Falha no upload");
    } finally {
      setBusy(false);
    }
  };

  const saveIcon = (m: AdminMenu, icon: string) => api.save("menu", { ...m, icon });

  const iconUpload = async (m: AdminMenu, files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    try {
      await saveIcon(m, await uploadImage(f));
    } catch {
      api.toast("Falha no upload");
    }
  };

  return (
    <div className="grid gap-5">
      <Panel
        title="Logo e imagens do site"
        subtitle="Logo oficial, banners e imagens de destaque. Envie um arquivo ou cole uma URL."
        actions={<button className="btn btn-gold" onClick={saveAll}>Salvar imagens e botões</button>}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <ImageField label="Logo oficial (rail, cabeçalho e rodapé)" value={logo} onChange={setLogo} />
          {Object.entries(images).map(([key, img]) => (
            <ImageField
              key={key}
              label={img.label || key}
              value={img.url || ""}
              onChange={(url) => setImages({ ...images, [key]: { ...img, url } })}
            />
          ))}
        </div>
      </Panel>

      <Panel
        title="Botões e links"
        subtitle="Textos e destinos de todos os botões principais do site."
        actions={<button className="btn btn-gold" onClick={saveAll}>Salvar imagens e botões</button>}
      >
        <div className="grid gap-3">
          {Object.entries(links).map(([key, lk]) => (
            <div key={key} className="grid gap-3 rounded-xl border border-line p-3 lg:grid-cols-[160px_1fr_220px]">
              <p className="self-center font-mono text-xs text-gold">{key}</p>
              <MLField
                label="texto do botão"
                value={lk.label}
                langs={langs}
                source={source}
                translate={api.translate}
                onChange={(label) => setLinks({ ...links, [key]: { ...lk, label } })}
              />
              <TextField label="destino" value={lk.href} mono onChange={(href) => setLinks({ ...links, [key]: { ...lk, href } })} />
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-line p-3">
            <div className="min-w-[200px] flex-1">
              <Label>Novo botão (chave)</Label>
              <input className="field font-mono text-xs" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="meuBotao" />
            </div>
            <button
              className="btn"
              onClick={() => {
                const key = newKey.trim();
                if (!key) return api.toast("Informe a chave");
                setLinks({ ...links, [key]: { label: { [source]: "Novo botão" }, href: "/" } });
                setNewKey("");
              }}
            >+ botão</button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Biblioteca de imagens"
        subtitle={`${data.media.length} arquivo(s) armazenados no banco. Use a URL /api/media/… em qualquer campo de imagem.`}
        actions={
          <label className="btn btn-pri cursor-pointer">
            {busy ? "Enviando…" : "Enviar imagens"}
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadMany(e.target.files)} />
          </label>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {data.media.map((m) => (
            <div key={m.id} className="rounded-xl border border-line bg-ink/40 p-2">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-ink">
                <img src={`/api/media/${m.id}`} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <p className="mt-2 truncate text-xs text-mute">{m.name}</p>
              <button
                className="chip mt-2 w-full"
                onClick={() => navigator.clipboard?.writeText(`/api/media/${m.id}`).then(() => api.toast("URL copiada"))}
              >Copiar URL</button>
            </div>
          ))}
          {!data.media.length && <p className="col-span-full text-sm text-mute">Nenhuma imagem enviada ainda.</p>}
        </div>
      </Panel>

      <Panel title="Ícones do menu" subtitle="Letra, emoji, URL ou imagem enviada. Alterações são gravadas ao sair do campo.">
        <div className="grid gap-2">
          {data.menu.map((m) => (
            <div key={m.id} className="grid items-center gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_200px_auto]">
              <p className="truncate font-display text-base font-bold uppercase">{(m.label as ML)[source] || m.href}</p>
              <input
                className="field font-mono text-xs"
                defaultValue={m.icon || ""}
                placeholder="letra, emoji ou URL"
                onBlur={(e) => { if (e.target.value !== (m.icon || "")) saveIcon(m, e.target.value); }}
              />
              <label className="chip cursor-pointer">
                Enviar ícone
                <input type="file" accept="image/*" className="hidden" onChange={(e) => iconUpload(m, e.target.files)} />
              </label>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
