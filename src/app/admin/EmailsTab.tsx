"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Panel, TextField } from "./fields";

type Subscriber = {
  id: number;
  email: string;
  name: string | null;
  source: string;
  lang: string;
  consentAt: string;
  createdAt: string;
};

type ListResult = { subscribers: Subscriber[]; total: number; page: number; pageSize: number; error?: string };
const PAGE_SIZE = 25;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function EmailsTab({ toast }: { toast: (message: string) => void }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(term.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), q: search });
    try {
      const response = await adminFetch(`/api/admin/subscribers?${params.toString()}`);
      const result = await response.json() as ListResult;
      if (!response.ok) throw new Error(result.error || "Falha ao carregar a lista.");
      setSubscribers(result.subscribers || []);
      setTotal(result.total || 0);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível carregar os cadastros.";
      setError(message);
      toast(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => { void load(); }, [load]);

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams({ format: "csv", q: search });
      const response = await adminFetch(`/api/admin/subscribers?${params.toString()}`);
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || "Falha ao exportar a lista.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "your-email-subscribers.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      toast("Arquivo CSV exportado");
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Não foi possível exportar os e-mails.");
    }
  };

  const remove = async (subscriber: Subscriber) => {
    if (!window.confirm(`Excluir o cadastro de ${subscriber.email}?`)) return;
    setBusyEmail(subscriber.email);
    try {
      const response = await adminFetch("/api/admin/subscribers", {
        method: "DELETE",
        body: JSON.stringify({ email: subscriber.email }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir o cadastro.");
      toast("Cadastro removido");
      if (subscribers.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Não foi possível excluir o cadastro.");
    } finally {
      setBusyEmail(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Panel
      title="Cadastro de e-mails"
      subtitle="Inscrições confirmadas no rodapé e na página Assine a YOUR. O consentimento e a origem são registrados no banco."
      actions={<button className="btn btn-pri" type="button" onClick={exportCsv} disabled={loading || total === 0}>Exportar CSV</button>}
    >
      <div className="mb-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <TextField label="Buscar por e-mail ou nome" value={term} onChange={setTerm} placeholder="nome@exemplo.com" />
        <p className="pb-2 text-sm text-mute" aria-live="polite">{total} {total === 1 ? "cadastro" : "cadastros"}</p>
      </div>

      <div className="grid min-w-0 gap-2" aria-busy={loading}>
        {loading && subscribers.length === 0 ? <p className="py-6 text-center text-sm text-mute">Carregando cadastros…</p> : null}
        {!loading && error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
        {!loading && !error && subscribers.length === 0 ? <p className="py-6 text-center text-sm text-mute">{search ? "Nenhum cadastro encontrado para esta busca." : "Ainda não há e-mails cadastrados."}</p> : null}

        {subscribers.map((subscriber) => (
          <div className="table-row min-w-0" key={subscriber.id}>
            <div className="min-w-0">
              <a className="block break-all font-semibold text-blush hover:underline" href={`mailto:${subscriber.email}`}>{subscriber.email}</a>
              <p className="mt-1 break-words text-xs text-mute">
                {subscriber.name ? `${subscriber.name} · ` : ""}
                {formatDate(subscriber.createdAt)} · origem: {subscriber.source} · idioma: {subscriber.lang.toUpperCase()}
              </p>
            </div>
            <button className="chip" type="button" disabled={busyEmail === subscriber.email} onClick={() => void remove(subscriber)}>
              {busyEmail === subscriber.email ? "Removendo…" : "Excluir"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-xs text-mute">Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <button className="chip" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</button>
          <button className="chip" type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Próxima</button>
        </div>
      </div>
    </Panel>
  );
}
