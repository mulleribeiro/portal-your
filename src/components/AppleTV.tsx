"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";
import { VideoThumb } from "./VideoThumb";

/** A streaming title. `id` is the YouTube video id. */
export type TvVideo = { id: string; title: string; dek: string; series: string; thumb: string; url: string };

export type TvCopy = {
  home: string; series: string; interviews: string; health: string; specials: string;
  watch: string; more?: string; next: string; close: string; continueWatching: string; empty: string;
};

type TabKey = "home" | "series" | "interviews" | "health" | "specials";

const TABS: { key: TabKey; series: "all" | string[] }[] = [
  { key: "home", series: "all" },
  { key: "series", series: ["Uma Autista dos Anos 90", "Hipnoterapia com Lu Duarte", "Art Basel Miami"] },
  { key: "interviews", series: ["Entrevistas YOUR", "Entretenimento", "Vinhos & Gastronomia", "Victoria's Secret"] },
  { key: "health", series: ["Saúde & Bem-estar"] },
  { key: "specials", series: ["Especiais SPFW", "Quiz YOUR"] },
];

/** Apple TV-style streaming interface: theme-aware, edge-to-edge 16:9 artwork and a centered full-screen player. */
export function AppleTV({ videos, copy }: { videos: TvVideo[]; copy: TvCopy }) {
  const [tab, setTab] = useState<TabKey>("home");
  const [playing, setPlaying] = useState<TvVideo | null>(null);
  const [slide, setSlide] = useState(0);

  const labels: Record<TabKey, string> = {
    home: copy.home, series: copy.series, interviews: copy.interviews, health: copy.health, specials: copy.specials,
  };

  const pool = useMemo(() => {
    const t = TABS.find((x) => x.key === tab) || TABS[0];
    return t.series === "all" ? videos : videos.filter((v) => (t.series as string[]).includes(v.series));
  }, [tab, videos]);

  const featured = useMemo(() => pool.slice(0, 6), [pool]);

  useEffect(() => setSlide(0), [tab]);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setSlide((i) => (i + 1) % featured.length), 8500);
    return () => clearInterval(t);
  }, [featured.length]);

  const hero = featured[slide] ?? featured[0];

  const groups = useMemo(() => {
    const m = new Map<string, TvVideo[]>();
    for (const v of pool) {
      const list = m.get(v.series);
      if (list) list.push(v); else m.set(v.series, [v]);
    }
    return [...m.entries()];
  }, [pool]);

  const idx = playing ? pool.findIndex((v) => v.id === playing.id) : -1;
  const next = () => { if (idx >= 0 && idx < pool.length - 1) setPlaying(pool[idx + 1]); };

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-surface p-4 text-paper md:p-7">
      <nav className="mb-6 flex flex-wrap items-center gap-2" aria-label="Categorias do streaming">
        {TABS.map((t) => (
          <button key={t.key} type="button" data-on={tab === t.key} onClick={() => setTab(t.key)} className="atv-tab">
            {labels[t.key]}
          </button>
        ))}
      </nav>

      {hero && (
        <section className="mb-9 grid gap-5 rounded-3xl border border-line bg-wine p-4 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
          <button
            type="button"
            onClick={() => setPlaying(hero)}
            className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-wine"
          >
            {featured.map((v, i) => (
              <span
                key={v.id}
                className={`absolute inset-0 block transition-opacity duration-700 ${i === slide ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <VideoThumb id={v.id} fallback={v.thumb} alt={v.title} priority={i === 0} />
              </span>
            ))}
            <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" aria-hidden />
            <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition group-hover:opacity-100">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-blush text-xl font-bold text-[#12060a] shadow-xl">
                ▶
              </span>
            </span>
          </button>

          <div className="flex flex-col justify-between gap-4">
            <div>
              <p className="eyebrow">{hero.series}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-paper sm:text-4xl">{hero.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-mute">{hero.dek}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="atv-btn-solid" onClick={() => setPlaying(hero)}>▶ {copy.watch}</button>
            </div>
            {featured.length > 1 && (
              <div className="flex items-center gap-2">
                {featured.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-label={v.title}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-blush" : "w-3 bg-mute/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "home" && pool.length > 0 && <Row title={copy.continueWatching} items={pool.slice(0, 12)} onPlay={setPlaying} />}
      {groups.length === 0 && <p className="text-mute">{copy.empty}</p>}
      {groups.map(([serie, list]) => <Row key={serie} title={serie} items={list} onPlay={setPlaying} />)}

      <Modal open={Boolean(playing)} onClose={() => setPlaying(null)} labelledBy="atv-playing">
        {playing && (
          <div className="modal-card !max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">{playing.series}</p>
                <p id="atv-playing" className="truncate font-display text-xl font-bold uppercase">{playing.title}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {idx >= 0 && idx < pool.length - 1 && (
                  <button type="button" className="btn" onClick={next}>{copy.next} ›</button>
                )}
                <button type="button" className="btn btn-pri" onClick={() => setPlaying(null)}>{copy.close} ✕</button>
              </div>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-line bg-wine">
              <iframe
                key={playing.id}
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0`}
                title={playing.title}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ title, items, onPlay }: { title: string; items: TvVideo[]; onPlay: (v: TvVideo) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const slideBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.75), behavior: "smooth" });
  };

  return (
    <section className="mb-8 min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-xl font-bold uppercase text-paper sm:text-2xl">{title}</h3>
          <span className="hidden text-xs text-mute sm:inline">{items.length} vídeos · deslize →</span>
        </div>
        {items.length > 2 && (
          <div className="flex gap-1.5">
            <button type="button" onClick={() => slideBy(-1)} className="chip !px-3" aria-label="Anterior">‹</button>
            <button type="button" onClick={() => slideBy(1)} className="chip !px-3" aria-label="Próximo">›</button>
          </div>
        )}
      </div>
      <div ref={scrollerRef} className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-0.5 pb-3 pt-1">
        {items.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onPlay(v)}
            className="group w-[72vw] max-w-[300px] shrink-0 snap-start text-left outline-none sm:w-[260px] md:w-[300px]"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-wine ring-1 ring-inset ring-white/10 transition duration-300 group-hover:ring-2 group-hover:ring-blush">
              <VideoThumb id={v.id} fallback={v.thumb} alt={v.title} />
              <span className="absolute inset-0 grid place-items-center bg-black/10 opacity-0 transition group-hover:opacity-100">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-blush text-sm font-bold text-[#12060a]">▶</span>
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[14px] font-semibold text-paper" style={{ textTransform: "none" }}>{v.title}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-mute" style={{ textTransform: "none" }}>{v.dek}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
