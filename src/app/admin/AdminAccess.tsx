"use client";

import { useEffect, useRef, useState } from "react";
import { AdminApp } from "./AdminApp";
import { fetchData } from "./api";
import { clearAdminToken, getAdminToken, setAdminToken } from "@/lib/admin-session";
import { adminFetch } from "@/lib/admin-fetch";
import type { AdminData } from "./types";

type Phase = "idle" | "verifying" | "opening";

/** Open the actual editor after a JSON login: no page redirect or third-party cookie is required. */
export function AdminAccess({ initialData, initialToken = "", initialError = "" }: { initialData: AdminData | null; initialToken?: string; initialError?: string }) {
  const [data, setData] = useState<AdminData | null>(initialData);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState(initialError);
  const authGeneration = useRef(0);

  useEffect(() => {
    if (initialToken) setAdminToken(initialToken);
    if (initialData) return;
    const stored = getAdminToken();
    if (!stored) return;
    let mounted = true;
    const generation = authGeneration.current;
    fetchData(stored).then((result) => {
      if (mounted && generation === authGeneration.current && getAdminToken() === stored) setData(result);
    }).catch(() => {
      if (mounted && generation === authGeneration.current && getAdminToken() === stored) clearAdminToken();
    });
    return () => { mounted = false; };
  }, [initialData, initialToken]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase !== "idle") return;
    authGeneration.current++;
    setError("");
    setPhase("verifying");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
        signal: controller.signal,
      });
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("A prévia devolveu uma página de erro em vez do login. Reabra a prévia atual pela plataforma.");
      }
      const result = await response.json() as { ok?: boolean; token?: string; panel?: AdminData; error?: string };
      if (!response.ok || !result.ok || !result.token) throw new Error(result.error || "Não foi possível entrar no painel.");
      setAdminToken(result.token);
      setPhase("opening");
      // New server returns the verified editor data in the login response itself.
      // The POST-body fallback is only for a rolling deployment with an older login endpoint.
      const panel = result.panel?.admin === true ? result.panel : await fetchData(result.token);
      setPassword("");
      setData(panel);
    } catch (cause) {
      setError(controller.signal.aborted ? "A conexão demorou mais do que o esperado. Tente novamente." : cause instanceof Error ? cause.message : "Não foi possível conectar ao portal.");
    } finally {
      window.clearTimeout(timer);
      setPhase("idle");
    }
  };

  const logout = () => {
    authGeneration.current++;
    const token = getAdminToken();
    clearAdminToken();
    setData(null);
    setError("");
    void adminFetch("/api/auth/logout", { method: "POST" }, token);
  };

  if (data) return <AdminApp initialData={data} onLogout={logout} />;

  return (
    <div className="grid min-h-screen place-items-center px-5 py-12">
      <form action="/api/auth/login-form" method="POST" onSubmit={submit} className="w-full max-w-[520px] rounded-3xl border border-line bg-surface p-6 shadow-2xl sm:p-9">
        <img src="/brand/logo.png" alt="YOUR 10 Anos" className="mb-6 h-auto w-[170px]" />
        <p className="eyebrow mb-2">Edição e gestão do portal</p>
        <h1 className="font-display text-4xl font-extrabold uppercase">Painel Admin</h1>
        <p className="mb-7 mt-3 text-sm text-mute">Acesse textos, imagens, menus, serviços, matérias e a Central de Pautas.</p>
        <label htmlFor="admin-password" className="label">Senha de administrador</label>
        <div className="relative">
          <input
            id="admin-password" name="password" type={visible ? "text" : "password"}
            autoComplete="current-password" autoFocus required minLength={1}
            className="field !pr-24" value={password}
            onChange={(event) => { setPassword(event.target.value); if (error) setError(""); }}
            placeholder="Sua senha, com o ponto final"
            aria-invalid={Boolean(error)} aria-describedby={error ? "admin-login-error" : undefined}
          />
          <button type="button" className="absolute inset-y-0 right-3 text-xs font-semibold text-blush" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {error && <p id="admin-login-error" role="alert" className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
        <button type="submit" className="btn btn-pri mt-5 !w-full !py-3" disabled={phase !== "idle" || !password.trim()}>
          {phase === "verifying" ? "Verificando senha…" : phase === "opening" ? "Abrindo painel…" : "Entrar no painel"}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-mute">A senha é validada e o painel abre na mesma resposta, sem depender de cookies ou de cabeçalhos especiais da prévia.</p>
      </form>
    </div>
  );
}
