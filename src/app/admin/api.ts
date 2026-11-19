import { adminFetch } from "@/lib/admin-fetch";
import type { AdminData } from "./types";

export type Api = {
  data: AdminData;
  setData: (d: AdminData) => void;
  refresh: () => Promise<void>;
  getItem: (id: string) => Promise<AdminData["items"][number] | null>;
  save: (entity: string, data: unknown) => Promise<{ error?: string }>;
  action: (action: string, extra?: Record<string, unknown>) => Promise<{ error?: string; updated?: number; engine?: string }>;
  translate: (text: string, target: string, source?: string) => Promise<string>;
  toast: (message: string) => void;
};

export async function fetchData(token?: string): Promise<AdminData> {
  const response = await adminFetch("/api/admin/data", {}, token);
  const result = await response.json() as AdminData & { error?: string };
  if (!response.ok || result.admin !== true) throw new Error(result.error || "Sua sessão terminou. Entre novamente no Admin.");
  return result;
}

export function createApi(setData: (d: AdminData) => void, toast: (m: string) => void, data: AdminData): Api {
  const refresh = async () => setData(await fetchData());
  const getItem = async (id: string) => {
    const response = await adminFetch(`/api/admin/item?id=${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    return ((await response.json()) as { item: AdminData["items"][number] }).item || null;
  };
  const save = async (entity: string, payload: unknown) => {
    const response = await adminFetch("/api/admin/save", { method: "POST", body: JSON.stringify({ entity, data: payload }) });
    const result = await response.json() as { error?: string };
    if (!response.ok || result.error) { toast(`Erro: ${result.error || response.status}`); return { error: result.error || "Não foi possível salvar." }; }
    await refresh(); toast("Salvo no banco"); return result;
  };
  const action = async (name: string, extra: Record<string, unknown> = {}) => {
    const response = await adminFetch("/api/admin/actions", { method: "POST", body: JSON.stringify({ action: name, ...extra }) });
    const result = await response.json() as { error?: string; updated?: number; engine?: string };
    if (!response.ok || result.error) { toast(`Erro: ${result.error || response.status}`); return { error: result.error || "Falha ao executar ação." }; }
    await refresh(); return result;
  };
  const translate = async (text: string, target: string, source = "pt") => {
    const response = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, source, target }) });
    if (!response.ok) throw new Error("Não foi possível traduzir.");
    return ((await response.json()) as { text: string }).text;
  };
  return { data, setData, refresh, getItem, save, action, translate, toast };
}
