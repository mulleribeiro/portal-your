"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createApi } from "./api";
import { clearAdminToken } from "@/lib/admin-session";
import { CatalogTab } from "./CatalogTab";
import { ContentTab } from "./ContentTab";
import { EmailsTab } from "./EmailsTab";
import { MediaTab } from "./MediaTab";
import { OverviewTab } from "./OverviewTab";
import { PitchesTab } from "./PitchesTab";
import { SettingsTab } from "./SettingsTab";
import { StructureTab } from "./StructureTab";
import { TextsTab } from "./TextsTab";
import type { AdminData } from "./types";

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "pitches", label: "Central de Pautas" },
  { id: "emails", label: "E-mails" },
  { id: "catalog", label: "Catálogo & Orçamento" },
  { id: "content", label: "Conteúdo" },
  { id: "structure", label: "Páginas & Menus" },
  { id: "media", label: "Mídia & Botões" },
  { id: "texts", label: "Textos & Idiomas" },
  { id: "settings", label: "Configurações & Planos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminApp({ initialData, onLogout }: { initialData: AdminData; onLogout?: () => void }) {
  const [data, setData] = useState<AdminData | null>(initialData);
  const [tab, setTab] = useState<TabId>("overview");
  const [message, setMessage] = useState<string | null>(null);
  const [lang, setLang] = useState("pt");

  const toast = useCallback((msg: string) => setMessage(msg), []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toast("Use o botão Salvar de cada painel");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast]);

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="font-display text-2xl uppercase tracking-widest text-mute">Carregando painel…</p>
      </div>
    );
  }

  const api = createApi(setData, toast, data);
  const logo = String(data.settings.logo || "/brand/logo.png");

  return (
    <div className="min-h-screen">
      <header className="hud">
        <Link href={`/${lang}`} className="hud-logo">
          <img src={logo} alt="YOUR" className="h-7 w-auto" />
        </Link>
        <span className="eyebrow hidden sm:inline">Painel Admin</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select className="chip !py-1.5" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Ver o site em">
            {data.languages.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.code.toUpperCase()}</option>)}
          </select>
          <button type="button" className="btn" onClick={() => window.dispatchEvent(new Event("your:download-project"))}>Publicar sem ZIP</button>
          <Link href={`/${lang}`} className="btn">Ver o site</Link>
          <span className="chip !border-transparent text-mute">{data.engineLabel}</span>
          <button type="button" className="btn btn-gold" onClick={() => {
            if (onLogout) onLogout();
            else { clearAdminToken(); void fetch("/api/auth/logout", { method: "POST" }).then(() => window.location.assign("/admin")); }
          }}>Sair</button>
        </div>
      </header>

      <div className="view pt-8">
        <section className="mb-6">
          <h1 className="font-display text-[clamp(38px,6vw,72px)] font-extrabold uppercase">Admin</h1>
          <p className="mt-2 max-w-[70ch] text-mute">
            Tudo aqui é editável: menus, textos, páginas, itens, links, imagens, valores de planos e traduções. As alterações são gravadas no PostgreSQL e
            aparecem no portal imediatamente — ative a <b className="text-blush">edição ao vivo</b> no canto inferior direito do site
            para clicar e editar qualquer texto, imagem ou link na própria página.
          </p>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} className="chip" data-on={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab api={api} />}
        {tab === "pitches" && <PitchesTab toast={toast} />}
        {tab === "emails" && <EmailsTab toast={toast} />}
        {tab === "catalog" && <CatalogTab api={api} />}
        {tab === "content" && <ContentTab api={api} />}
        {tab === "structure" && <StructureTab api={api} />}
        {tab === "media" && <MediaTab api={api} />}
        {tab === "texts" && <TextsTab api={api} />}
        {tab === "settings" && <SettingsTab api={api} />}
      </div>

      {message && <div className="toast" role="status">{message}</div>}
    </div>
  );
}
