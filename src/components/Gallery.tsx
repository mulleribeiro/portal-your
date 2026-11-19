"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditableImage } from "./EditableImage";
import { Modal } from "./Modal";
import { ratioSize, sizedImage } from "@/lib/images";
import { useEdit } from "./EditProvider";

export type CrossRec = {
  id: string;
  name: string;
  sub: string;
  image?: string | null;
  href: string;
};

export type GalleryCard = {
  id: string;
  title: string;
  dek: string;
  body?: string;
  image?: string | null;
  photos?: string[];
  url?: string | null;
  category?: string | null;
  group?: string | null;
  word?: string;
  meta?: Record<string, string | number | null | undefined>;
  recTitle?: string;
  recs?: CrossRec[];
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

export function Gallery({
  items, param, ratio = "r34", modalRatio, layout = "grid", labels,
}: {
  items: GalleryCard[];
  param: string;
  ratio?: string;
  modalRatio?: string;
  layout?: "grid" | "row" | "postcards" | "portrait";
  labels: { close: string; visit: string; open?: string; read?: string };
}) {
  const ctx = useEdit();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get(param);
  const [tab, setTab] = useState<string>("all");
  const [photoIdx, setPhotoIdx] = useState(0);
  const [customLink, setCustomLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const groups = useMemo(() => {
    const set = new Set(items.map((i) => i.group).filter(Boolean) as string[]);
    return ["all", ...set];
  }, [items]);

  const visible = tab === "all" ? items : items.filter((i) => i.group === tab);
  const active = items.find((i) => i.id === activeId) || null;
  const portraitModal = (modalRatio || ratio) === "r34";

  useEffect(() => {
    setPhotoIdx(0);
    setCustomLink(active?.url || "");
  }, [active?.id, active?.url]);

  const close = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete(param);
    router.replace(sp.toString() ? `${pathname}?${sp.toString()}` : pathname, { scroll: false });
  }, [pathname, param, router, searchParams]);

  const open = (id: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set(param, id);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const saveModalLink = async () => {
    if (!ctx || !active) return;
    setSavingLink(true);
    await ctx.save({ entity: "item", id: active.id, field: "url", label: "Link" }, { value: customLink.trim() });
    setSavingLink(false);
  };

  const isPortrait = layout === "portrait" || ratio === "r34";
  const container =
    layout === "row"
      ? "flex gap-4 overflow-x-auto pb-4"
      : layout === "postcards"
      ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      : isPortrait
      ? "grid-portrait"
      : "grid-cards";
  const cardW = layout === "row" ? "w-[210px] shrink-0 sm:w-[240px]" : "";

  const activePhotos = useMemo(() => {
    if (!active) return [];
    const arr = active.photos?.length ? active.photos : active.image ? [active.image] : [];
    return arr.filter(Boolean);
  }, [active]);

  return (
    <>
      {groups.length > 2 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {groups.map((g) => (
            <button key={g} type="button" className="chip" data-on={tab === g} onClick={() => setTab(g)}>
              {g === "all" ? "Todos" : g}
            </button>
          ))}
        </div>
      )}

      <div className={container}>
        {visible.map((item) => (
          <div key={item.id} className={`card text-left ${cardW}`}>
            <div
              onClick={() => open(item.id)}
              className={`md ${ratio} cursor-pointer`}
              style={{ background: gradientFor(item.id) }}
            >
              <span className="mdw">{item.word || item.title.split(" ")[0]}</span>
              <EditableImage
                target={{ entity: "item", id: item.id, field: "image", label: item.title }}
                src={sizedImage(item.image, ratioSize(ratio).w, ratioSize(ratio).h)}
                linkTarget={{ entity: "item", id: item.id, field: "url", label: "Link" }}
                linkUrl={item.url}
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              {item.category ? <p className="tag truncate">{item.category}</p> : <span />}
              {item.url && (
                <a
                  href={item.url}
                  target={item.url.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="more shrink-0 text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  ↗
                </a>
              )}
            </div>
            <button type="button" onClick={() => open(item.id)} className="text-left">
              <h3>{item.title}</h3>
            </button>
            {item.dek ? <p className="line-clamp-2">{item.dek}</p> : null}
            {item.recs && item.recs.length > 0 && (
              <div className="mt-2 rounded-xl border border-line bg-ink/40 p-2.5">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[.18em] text-gold">
                  {item.recTitle}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.recs.slice(0, 3).map((rc) => (
                    <Link key={rc.id} href={rc.href} className="chip !px-2.5 !py-1 !text-[11px]">
                      {rc.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={Boolean(active)} onClose={close}>
        {active && (
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                {active.category ? <p className="eyebrow mb-2">{active.category}</p> : null}
                <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">{active.title}</h2>
                {active.dek ? <p className="mt-2 max-w-[60ch] text-mute">{active.dek}</p> : null}
              </div>
              <button type="button" className="chip" onClick={close} aria-label={labels.close}>✕</button>
            </div>

            <div
              className={`md ${modalRatio || ratio} mb-3 mx-auto w-full ${portraitModal ? "max-w-[340px]" : ""}`}
              style={{ background: gradientFor(active.id) }}
            >
              {activePhotos[photoIdx] ? <img src={sizedImage(activePhotos[photoIdx], 1000, ratio.includes("r34") ? 1334 : 570)} alt={active.title} /> : null}
            </div>

            {activePhotos.length > 1 && (
              <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                {activePhotos.map((ph, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoIdx(idx)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${idx === photoIdx ? "border-blush" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={ph} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {active.meta && Object.entries(active.meta).some(([, v]) => v !== null && v !== undefined && v !== "") && (
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(active.meta).map(([k, v]) =>
                  v === null || v === undefined || v === "" ? null : (
                    <span key={k} className="chip">{k}: {String(v)}</span>
                  ))}
              </div>
            )}

            {active.body && (
              <div className="text-[15.5px] leading-relaxed">
                {active.body.split("\n").filter(Boolean).map((p, i) =>
                  p.startsWith("## ") ? (
                    <h3 key={i} className="mt-5 mb-2 font-display text-2xl font-bold uppercase text-blush">{p.slice(3)}</h3>
                  ) : p.startsWith("> ") ? (
                    <blockquote key={i} className="my-4 border-l-2 border-gold pl-4 italic text-mute">{p.slice(2)}</blockquote>
                  ) : (
                    <p key={i} className="mb-3">{p}</p>
                  ),
                )}
              </div>
            )}

            {active.recs && active.recs.length > 0 && (
              <div className="mt-6 rounded-2xl border border-line bg-ink/50 p-4">
                <p className="eyebrow mb-3">{active.recTitle}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {active.recs.slice(0, 6).map((rc) => (
                    <Link
                      key={rc.id}
                      href={rc.href}
                      onClick={close}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition hover:border-blush"
                    >
                      {rc.image ? (
                        <img src={rc.image} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-12 w-14 shrink-0 place-items-center rounded-lg bg-wine font-display text-blush">
                          {rc.name.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <b className="block truncate font-display text-base uppercase">{rc.name}</b>
                        <small className="block truncate text-xs text-mute">{rc.sub}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {ctx?.canEdit && (
              <div className="mt-5 rounded-xl border border-line bg-ink/40 p-3">
                <span className="label">🔗 Link desta capa / item (URL)</span>
                <div className="flex gap-2">
                  <input
                    className="field font-mono text-xs"
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    placeholder="https://edicoesyour.online/e/… ou rota interna"
                  />
                  <button type="button" className="btn btn-gold" disabled={savingLink} onClick={saveModalLink}>
                    {savingLink ? "…" : "Salvar link"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {active.url && (
                <a
                  href={active.url}
                  target={active.url.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="btn btn-pri"
                >
                  {labels.visit} ↗
                </a>
              )}
              <button type="button" className="btn" onClick={close}>{labels.close}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
