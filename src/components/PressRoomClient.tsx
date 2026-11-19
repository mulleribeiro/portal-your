"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { getStoredAdminToken, useEdit } from "./EditProvider";
import { uploadImage } from "@/lib/upload-client";
import { setAdminToken } from "@/lib/admin-session";
import { adminFetch } from "@/lib/admin-fetch";
import { Modal } from "./Modal";

export type PressItem = {
  id: string;
  title: string;
  titleRaw: Record<string, string>;
  dek: string;
  dekRaw: Record<string, string>;
  body: string;
  bodyRaw: Record<string, string>;
  category: string;
  group: string;
  image: string;
  url: string;
  client: string;
  words: number;
};

const PAL = [
  ["#3A0B1C", "#C2486A"], ["#1B2A41", "#C98B5E"], ["#2B1337", "#E9A7B8"],
  ["#0F2E2B", "#D9B26A"], ["#43121F", "#F0C9A0"], ["#1A1A2E", "#B4536F"],
];
function gradientFor(id: string) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = PAL[h % PAL.length];
  return `radial-gradient(120% 90% at ${15 + (h % 70)}% ${h % 40}%, ${b}66, transparent 62%), linear-gradient(160deg, ${a}, #12060A)`;
}

function buildAuto600Words(title: string, dek: string, group: string, category: string, draftBody: string) {
  const base = draftBody.trim();
  return [
    `SÃO PAULO / NOVA YORK — A YOUR Magazine (edição especial de 10 anos) apresenta em sua Sala de Imprensa a pauta "${title || "Destaque Editorial"}", publicada originalmente em ${group || "Edição Interativa"} (${category || "Editorial"}). ${dek || ""}`,
    base || `A reportagem aprofunda os bastidores, as referências estéticas e a trajetória dos protagonistas que movimentam o cenário contemporâneo de luxo, cultura, saúde, moda, gastronomia e comportamento.`,
    `Produzida pela equipe editorial da YOUR Magazine sob direção de Müller Ribeiro (CEO e Editor-Chefe), a matéria combina narrativa jornalística autoral, fotografia de estúdio e curadoria multiplataforma voltada a leitores e formadores de opinião no Brasil e nos Estados Unidos.`,
    `## Destaques da Pauta\nAo longo da publicação, o conteúdo explora novas perspectivas sobre autenticidade, excelência técnica e transformação cultural, conectando marcas de prestígio e personalidades a uma audiência altamente engajada das classes A e B, que soma mais de 13,2 milhões de visualizações mensais em todo o ecossistema da revista.`,
    `## Sobre a YOUR Magazine — 10 Anos\nFeita no Brasil para o mundo há uma década, a YOUR Magazine reúne 88 edições publicadas, mais de 300 capas digitais, 218 entrevistas exclusivas, o streaming de vídeo YOUR Play e as coleções Luxury Hotels e Fine Dining. Sua rede de imprensa parceira alcança mais de 120 jornalistas e colunistas, 80 revistas, 40 rádios e podcasts e 50 portais de notícias.`,
    `## Atendimento à Imprensa e Credenciamento\nEste release oficial (~600 palavras) e as imagens que o acompanham estão disponíveis para download e reprodução editorial mediante crédito obrigatório à YOUR Magazine. Para entrevistas, fotos em alta resolução ou pautas especiais, contate: muller@yourmagazine.com.br.`,
  ].join("\n\n");
}

export function PressRoomClient({ items, lang }: { items: PressItem[]; lang: string }) {
  const ctx = useEdit();
  const router = useRouter();
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<PressItem | null>(null);
  const [editing, setEditing] = useState<{
    id: string;
    title: string;
    dek: string;
    body: string;
    category: string;
    group: string;
    image: string;
    url: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const closeReader = useCallback(() => setActive(null), []);
  const closeEditor = useCallback(() => setEditing(null), []);

  const groups = useMemo(() => {
    const s = new Set(items.map((i) => i.group).filter(Boolean));
    return ["all", ...s];
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (group !== "all" && i.group !== group) return false;
      if (term && !`${i.title} ${i.dek} ${i.category} ${i.group}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, group, q]);

  const authHeaders = (): Record<string, string> => {
    const tk = getStoredAdminToken();
    return tk
      ? { "Content-Type": "application/json", "x-admin-token": tk }
      : { "Content-Type": "application/json" };
  };

  const ensureAuth = async (): Promise<boolean> => {
    if (ctx?.canEdit || getStoredAdminToken()) return true;
    const pw = window.prompt("Digite sua senha de administrador para editar:");
    if (!pw) return false;
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string };
    if (!res.ok || !data.ok) {
      alert("Senha incorreta");
      return false;
    }
    if (data.token) setAdminToken(data.token);
    return true;
  };

  const startNew = async () => {
    if (!(await ensureAuth())) return;
    setEditing({
      id: "",
      title: "",
      dek: "",
      body: "",
      category: "Edição 88",
      group: "Edição 88",
      image: "",
      url: "",
    });
  };

  const startEdit = async (item: PressItem) => {
    if (!(await ensureAuth())) return;
    setEditing({
      id: item.id,
      title: item.title,
      dek: item.dek,
      body: item.body,
      category: item.category,
      group: item.group,
      image: item.image,
      url: item.url,
    });
  };

  const removeItem = async (item: PressItem) => {
    if (!(await ensureAuth())) return;
    if (!confirm(`Excluir "${item.title}" da Sala de Imprensa?`)) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/actions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ action: "delete", entity: "item", id: item.id }),
    });
    setBusy(false);
    if (res.ok) {
      if (active?.id === item.id) setActive(null);
      router.refresh();
    } else {
      alert("Falha ao excluir");
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.title.trim()) return;
    setBusy(true);
    const fullBody = editing.body.trim().split(/\s+/).length >= 350
      ? editing.body
      : buildAuto600Words(editing.title, editing.dek, editing.group, editing.category, editing.body);

    const existing = items.find((i) => i.id === editing.id);
    const payload = {
      id: editing.id || undefined,
      type: "release",
      title: { ...(existing?.titleRaw || {}), [lang]: editing.title, pt: existing?.titleRaw?.pt || editing.title },
      dek: { ...(existing?.dekRaw || {}), [lang]: editing.dek, pt: existing?.dekRaw?.pt || editing.dek },
      body: { ...(existing?.bodyRaw || {}), [lang]: fullBody, pt: existing?.bodyRaw?.pt || fullBody },
      category: editing.category,
      image: editing.image,
      url: editing.url,
      meta: {
        group: editing.group || "Edição 88",
        client: editing.group || "YOUR Magazine",
        words: fullBody.split(/\s+/).length,
      },
      published: true,
    };
    const res = await adminFetch("/api/admin/save", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ entity: "item", data: payload }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else {
      alert("Falha ao salvar");
    }
  };

  const onUploadFile = async (file?: File) => {
    if (!file || !editing) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      setEditing({ ...editing, image: url });
    } catch {
      alert("Erro no upload");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button key={g} type="button" className="chip" data-on={group === g} onClick={() => setGroup(g)}>
              {g === "all" ? `Todos (${items.length})` : `${g} (${items.filter((i) => i.group === g).length})`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="field !w-56"
            placeholder="Buscar release ou capa…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="btn btn-pri" onClick={startNew}>
            + Nova matéria / release
          </button>
        </div>
      </div>

      <section className="section">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4">
              <div>
                <div
                  onClick={() => setActive(item)}
                  className={`md ${item.group === "Capas + Entrevistas" ? "r34" : "r169"} cursor-pointer`}
                  style={{ background: gradientFor(item.id) }}
                >
                  <span className="mdw">{item.title.split(" ")[0]}</span>
                  {item.image ? <img src={item.image} alt={item.title} loading="lazy" /> : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="tag">{item.group} · {item.category}</span>
                  <span className="text-xs text-mute">~{Math.max(520, item.words)} palavras</span>
                </div>
                <h3
                  onClick={() => setActive(item)}
                  className="mt-1.5 cursor-pointer font-display text-xl font-bold uppercase hover:text-blush"
                >
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-mute">{item.dek}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
                <a
                  href={`/api/release-pdf/${encodeURIComponent(item.id)}?lang=${lang}`}
                  className="btn btn-gold"
                  download
                >
                  ⬇ Release PDF
                </a>
                <button type="button" className="btn" onClick={() => setActive(item)}>
                  Ler release
                </button>
                <button type="button" className="chip ml-auto" onClick={() => startEdit(item)} title="Editar matéria">
                  ✎
                </button>
                <button type="button" className="chip" onClick={() => removeItem(item)} title="Excluir matéria">
                  🗑
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Full Release Reader Modal */}
      <Modal open={Boolean(active)} onClose={closeReader}>
        {active && (
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <img src="/brand/logo.png" alt="YOUR 10 Anos" className="h-7 w-auto" />
                <span className="tag">{active.group} · Release Oficial de Imprensa</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/release-pdf/${encodeURIComponent(active.id)}?lang=${lang}`}
                  className="btn btn-gold"
                  download
                >
                  ⬇ Baixar Release em PDF
                </a>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${active.title}\n\n${active.dek}\n\n${active.body}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? "✓ Copiado" : "Copiar texto"}
                </button>
                <button type="button" className="chip" onClick={() => startEdit(active)}>✎ Editar</button>
                <button type="button" className="chip" onClick={() => setActive(null)}>✕</button>
              </div>
            </div>

            <div className="paper">
              <p className="tag mb-2">{active.group} · {active.category}</p>
              <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">{active.title}</h2>
              {active.dek && <p className="mt-2 font-semibold text-[#5c3040]">{active.dek}</p>}
              {active.image && (
                <img src={active.image} alt={active.title} className="my-5 max-h-[380px] w-full rounded-xl object-cover" />
              )}
              <div className="mt-4">
                {active.body.split("\n\n").filter(Boolean).map((p, i) =>
                  p.startsWith("## ") ? (
                    <h3 key={i} className="mt-6 mb-2 font-display text-2xl font-bold uppercase text-[#3A0B1C]">{p.slice(3)}</h3>
                  ) : (
                    <p key={i} className="mb-3">{p}</p>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Release Modal */}
      <Modal open={Boolean(editing)} onClose={closeEditor}>
        {editing && (
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-3xl font-extrabold uppercase">
                {editing.id ? "Editar Matéria / Release" : "Nova Matéria na Sala de Imprensa"}
              </h2>
              <button type="button" className="chip" onClick={() => setEditing(null)}>✕</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">Título da matéria / capa</span>
                <input className="field" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Origem (Edição Interativa ou Capas)</span>
                <select className="field" value={editing.group} onChange={(e) => setEditing({ ...editing, group: e.target.value })}>
                  <option value="Edição 88">Edição 88</option>
                  <option value="Especial Chile">Especial Chile</option>
                  <option value="Capas + Entrevistas">Capas + Entrevistas</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </label>
              <label className="block">
                <span className="label">Editoria / Categoria</span>
                <input className="field" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Linha fina / subtítulo</span>
                <input className="field" value={editing.dek} onChange={(e) => setEditing({ ...editing, dek: e.target.value })} />
              </label>
              <div className="sm:col-span-2">
                <span className="label">Imagem (URL ou enviar arquivo)</span>
                <div className="flex flex-wrap gap-2">
                  <input className="field flex-1 font-mono text-xs" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://… ou /api/media/…" />
                  <label className="btn cursor-pointer">
                    Enviar imagem
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadFile(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
              <label className="block sm:col-span-2">
                <span className="label">Link da matéria / edição (URL)</span>
                <input className="field font-mono text-xs" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://edicoesyour.online/e/…" />
              </label>
              <div className="sm:col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="label !mb-0">Release de imprensa (~600 palavras — usado no PDF oficial)</span>
                  <button
                    type="button"
                    className="chip"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        body: buildAuto600Words(editing.title, editing.dek, editing.group, editing.category, editing.body),
                      })
                    }
                  >
                    ✨ Gerar release de ~600 palavras
                  </button>
                </div>
                <textarea
                  className="field min-h-[220px]"
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder="Escreva o texto ou deixe em branco para gerar automaticamente o release completo de ~600 palavras…"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="button" className="btn btn-gold" disabled={busy || !editing.title.trim()} onClick={saveEdit}>
                {busy ? "Salvando…" : "Salvar na Sala de Imprensa"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
