"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Panel } from "./fields";

type Pitch = {
  id: number;
  name: string;
  client?: string | null;
  journalist?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  message: string;
  status: string;
  photos?: string[] | null;
  docs?: string[] | null;
  lang?: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_META: Record<string, { label: string; tone: string }> = {
  novo: { label: "Novo", tone: "#E9A7B8" },
  em_analise: { label: "Em análise", tone: "#D9B26A" },
  aprovado: { label: "Aprovado", tone: "#7ED4A6" },
  em_producao: { label: "Em produção", tone: "#7FB2E5" },
  publicado: { label: "Publicado", tone: "#B98CE5" },
  recusado: { label: "Recusado", tone: "#E58C8C" },
};

const STATUS_FLOW = ["novo", "em_analise", "aprovado", "em_producao", "publicado", "recusado"];


export function PitchesTab({ toast }: { toast: (m: string) => void }) {
  const [rows, setRows] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/pitches");
      if (!res.ok) throw new Error("Sessão ou conexão indisponível");
      const data = (await res.json()) as { pitches?: Pitch[] };
      setRows(data.pitches || []);
    } catch {
      toast("Falha ao carregar pautas");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => {
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      novo: count("novo"),
      em_analise: count("em_analise"),
      aprovado: count("aprovado") + count("em_producao"),
      publicado: count("publicado"),
    };
  }, [rows]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (term && !`${r.name} ${r.client} ${r.journalist} ${r.message}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, filter, q]);

  const setStatus = async (id: number, status: string) => {
    const res = await adminFetch("/api/admin/pitches", {
      method: "PATCH", body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      toast(`Status: ${STATUS_META[status]?.label || status}`);
    } else {
      toast("Falha ao atualizar status");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir esta pauta permanentemente?")) return;
    const res = await adminFetch("/api/admin/pitches", {
      method: "DELETE", body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRows((rs) => rs.filter((r) => r.id !== id));
      if (open === id) setOpen(null);
      toast("Pauta excluída");
    } else {
      toast("Falha ao excluir");
    }
  };

  const exportCsv = () => {
    const header = ["ID", "Pauta", "Cliente", "Jornalista", "Veiculo", "Email", "Telefone", "Status", "Criado em", "Mensagem"];
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = rows.map((r) =>
      [r.id, r.name, r.client, r.journalist, r.role, r.email, r.phone, r.status, r.createdAt, r.message]
        .map((v) => esc(String(v ?? ""))).join(";"),
    );
    const blob = new Blob(["\uFEFF" + [header.map(esc).join(";"), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pautas-your-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("CSV exportado");
  };

  return (
    <div className="grid gap-5">
      <Panel
        title="Central de Pautas"
        subtitle="Todas as sugestões enviadas pela Sala de Imprensa — de jornalistas, assessores e leitores."
        actions={
          <>
            <input className="field !w-56" placeholder="buscar pauta, cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-gold" onClick={exportCsv}>Exportar CSV</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total recebido", value: stats.total, tone: "#F7EEF0" },
            { label: "Novas", value: stats.novo, tone: "#E9A7B8" },
            { label: "Em análise", value: stats.em_analise, tone: "#D9B26A" },
            { label: "Aprovadas / produção", value: stats.aprovado, tone: "#7ED4A6" },
            { label: "Publicadas", value: stats.publicado, tone: "#B98CE5" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-ink/40 p-3">
              <b className="block font-display text-3xl leading-none" style={{ color: s.tone }}>{s.value}</b>
              <span className="mt-1 block text-xs text-mute">{s.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <button className="chip" data-on={filter === "all"} onClick={() => setFilter("all")}>Todas ({rows.length})</button>
        {STATUS_FLOW.map((s) => {
          const n = rows.filter((r) => r.status === s).length;
          return (
            <button key={s} className="chip" data-on={filter === s} onClick={() => setFilter(s)}>
              {STATUS_META[s]?.label || s} ({n})
            </button>
          );
        })}
      </div>

      <Panel title="Pautas recebidas" subtitle={`${visible.length} registro(s) · clique para ver detalhes e anexos`}>
        {loading ? (
          <p className="text-sm text-mute">Carregando…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-2xl font-bold uppercase text-mute">Nenhuma pauta ainda</p>
            <p className="mt-2 text-sm text-mute">
              As sugestões enviadas na <b className="text-blush">Sala de Imprensa</b> aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {visible.map((p) => {
              const tone = STATUS_META[p.status]?.tone || "#E9A7B8";
              const photos = p.photos || [];
              const docs = p.docs || [];
              const isOpen = open === p.id;
              return (
                <div key={p.id} className="rounded-xl border border-line bg-ink/30">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    className="flex w-full flex-wrap items-center gap-3 p-3 text-left"
                  >
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider"
                      style={{ background: `${tone}22`, color: tone, border: `1px solid ${tone}55` }}
                    >
                      {STATUS_META[p.status]?.label || p.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-bold uppercase">{p.name}</p>
                      <p className="truncate text-xs text-mute">
                        {p.journalist || "—"}{p.role ? ` · ${p.role}` : ""}{p.client ? ` · ${p.client}` : ""} · {new Date(p.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {photos.length > 0 && <span className="chip !px-2 !py-0.5 text-[10px]">📷 {photos.length}</span>}
                      {docs.length > 0 && <span className="chip !px-2 !py-0.5 text-[10px]">📄 {docs.length}</span>}
                      <span className="text-mute">{isOpen ? "▴" : "▾"}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-line/60 p-4">
                      <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
                        <div>
                          <p className="label">Texto da pauta</p>
                          <div className="rounded-xl border border-line bg-ink/40 p-4 text-sm leading-relaxed">
                            {p.message.split("\n").filter(Boolean).map((line, i) => (
                              <p key={i} className="mb-2 last:mb-0">{line}</p>
                            ))}
                          </div>

                          {photos.length > 0 && (
                            <div className="mt-4">
                              <p className="label">Fotos anexadas ({photos.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {photos.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                                    <img src={url} alt={`foto ${i + 1}`} className="h-24 w-32 rounded-lg border border-line object-cover transition hover:border-blush" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {docs.length > 0 && (
                            <div className="mt-4">
                              <p className="label">Documentos PDF ({docs.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {docs.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className="btn">
                                    ⬇ PDF {i + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <aside className="grid content-start gap-3">
                          <div className="rounded-xl border border-line bg-ink/40 p-3">
                            <p className="label">Contato</p>
                            <p className="text-sm"><b>{p.journalist}</b>{p.role ? ` · ${p.role}` : ""}</p>
                            {p.email && <a href={`mailto:${p.email}`} className="block break-all text-sm text-blush hover:underline">{p.email}</a>}
                            {p.phone && <p className="text-sm text-mute">{p.phone}</p>}
                            {p.client && <p className="mt-2 text-xs text-mute">Cliente: <b className="text-paper">{p.client}</b></p>}
                          </div>

                          <div className="rounded-xl border border-line bg-ink/40 p-3">
                            <p className="label">Alterar status</p>
                            <div className="flex flex-wrap gap-1.5">
                              {STATUS_FLOW.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className="chip !px-2.5 !py-1 text-[10px]"
                                  data-on={p.status === s}
                                  onClick={() => setStatus(p.id, s)}
                                >
                                  {STATUS_META[s]?.label || s}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-line bg-ink/40 p-3">
                            <p className="label">Ações</p>
                            <div className="flex flex-wrap gap-2">
                              {p.email && (
                                <a
                                  href={`mailto:${p.email}?subject=${encodeURIComponent(`Re: pauta ${p.name}`)}`}
                                  className="btn btn-gold"
                                >
                                  Responder
                                </a>
                              )}
                              <button type="button" className="btn" onClick={() => remove(p.id)}>Excluir</button>
                            </div>
                          </div>
                        </aside>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
