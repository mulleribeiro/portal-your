"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NavItem } from "./Shell";

type Result = { id: string; type: string; title: string; dek: string; href: string; image: string | null; category: string | null };

export function SearchOverlay({ lang, quick, onClose }: { lang: string; quick: NavItem[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: ctrl.signal });
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results || []);
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 180);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [q, lang]);

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const r of results) (map.get(r.type) || map.set(r.type, []).get(r.type)!).push(r);
    return [...map.entries()];
  }, [results]);

  return (
    <div className="qpanel" role="dialog" aria-modal="true" aria-label="Buscar">
      <div className="qwrap">
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Buscar em tudo — matérias, capas, edições, hotéis…" aria-label="Buscar" />
        <button className="chip" onClick={onClose} aria-label="Fechar busca">✕</button>
      </div>

      <div className="mx-auto max-w-[900px]">
        <p className="eyebrow mb-2">Ir direto a</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {quick.map((item) => (
            <Link key={item.href} href={`/${lang}${item.href === "/home" ? "" : item.href}`} className="chip" onClick={onClose}>{item.label}</Link>
          ))}
        </div>

        {loading && <p className="text-sm text-mute">Buscando…</p>}
        {!loading && q.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm text-mute">Nada encontrado para “{q}”.</p>
        )}

        <div className="qres">
          {grouped.map(([type, list]) => (
            <div key={type}>
              <p className="eyebrow mb-2">{type}</p>
              <div className="grid gap-2">
                {list.slice(0, 6).map((r) => (
                  <Link key={r.id} href={`/${lang}${r.href}`} onClick={onClose} className="table-row hover:border-blush">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold uppercase">{r.title}</p>
                      <p className="truncate text-sm text-mute">{r.dek}</p>
                    </div>
                    {r.image ? <img src={r.image} alt="" className="h-12 w-16 rounded-lg object-cover" loading="lazy" /> : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
