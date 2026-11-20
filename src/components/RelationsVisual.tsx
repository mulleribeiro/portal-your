"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EditableImage } from "./EditableImage";
import type { EditTarget } from "./EditProvider";

const px = (id: number, w = 1200, h = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

/* ------------------------------------------------------------------ */
/* Animated counter                                                    */
/* ------------------------------------------------------------------ */
function Counter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1300);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value]);

  return (
    <span ref={ref}>
      {n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Hero                                                             */
/* ------------------------------------------------------------------ */
export function RelationsHero({ lang, title, kicker, subtitle, ctas, image, imageTarget }: {
  lang: string;
  title: string;
  kicker: string;
  subtitle: string;
  ctas: { href: string; label: string; tone?: string }[];
  image?: string;
  imageTarget?: EditTarget;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line">
      {imageTarget ? (
        <EditableImage target={imageTarget} src={image || px(15920138, 1800, 1000)} alt="" imgClass="absolute inset-0 h-full w-full object-cover" />
      ) : <img src={image || px(15920138, 1800, 1000)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-[linear-gradient(105deg,#12060af7_18%,#12060ad9_52%,#12060a66_100%)]" />
      <div className="relative flex min-h-[440px] flex-col justify-end p-7 sm:p-12">
        <p className="eyebrow">{kicker}</p>
        <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(42px,7vw,88px)] font-extrabold uppercase leading-[.94]">
          {title}
        </h1>
        <p className="mt-4 max-w-[58ch] text-base text-white/80 sm:text-lg">{subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {ctas.map((c) => (
            <Link key={c.href} href={c.href} className={c.tone === "gold" ? "btn btn-gold" : "btn btn-pri"}>
              {c.label}
            </Link>
          ))}
        </div>
      </div>
      {/* decorative ticker strip */}
      <div className="relative flex flex-wrap gap-x-6 gap-y-1 border-t border-white/10 bg-black/30 px-7 py-3 text-[11px] uppercase tracking-[.22em] text-white/60 sm:px-12">
        <span>◆ Briefing</span><span>◆ Pauta</span><span>◆ Release</span><span>◆ Distribuição</span>
        <span>◆ Clipping</span><span>◆ Relatório</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Animated stats + network bar infographic                         */
/* ------------------------------------------------------------------ */
export function NetworkInfographic({ network, lang, copy }: {
  network: { value: string; label: string }[];
  lang: string;
  copy: { title: string; sub: string };
}) {
  const parsed = network.map((n) => {
    const num = parseFloat(String(n.value).replace(/[^\d,.-]/g, "").replace(",", "."));
    const suffix = /[+%]|mil|mi/.exec(String(n.value))?.[0] || "";
    return { num: isNaN(num) ? 0 : num, suffix, label: n.label, raw: n.value };
  });
  const max = Math.max(...parsed.map((p) => p.num), 1);

  return (
    <section className="section">
      <div className="sh">
        <div>
          <p className="eyebrow mb-2">{copy.sub}</p>
          <h2>{copy.title}</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        {/* big animated numbers */}
        <div className="grid grid-cols-2 gap-5 rounded-3xl border border-line bg-wine p-7">
          {parsed.map((p, i) => (
            <div key={i} className="min-w-0">
              <b className="block font-display text-[clamp(34px,5vw,58px)] font-extrabold leading-none text-blush">
                <Counter value={p.num} suffix={p.suffix} decimals={p.raw.includes(",") ? 1 : 0} />
              </b>
              <span className="mt-1.5 block text-sm text-mute">{p.label}</span>
            </div>
          ))}
        </div>

        {/* bar chart infographic */}
        <div className="rounded-3xl border border-line bg-surface p-7">
          <p className="eyebrow mb-5">Alcance por canal</p>
          <div className="grid gap-4">
            {parsed.map((p, i) => (
              <div key={i}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-mute">{p.label}</span>
                  <b className="font-display text-lg">{p.raw}</b>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink">
                  <div
                    className="h-full rounded-full transition-all duration-[1400ms] ease-out"
                    style={{
                      width: `${Math.max(8, (p.num / max) * 100)}%`,
                      background: ["linear-gradient(90deg,#C2486A,#E9A7B8)", "linear-gradient(90deg,#9a7425,#D9B26A)", "linear-gradient(90deg,#5C1830,#C2486A)", "linear-gradient(90deg,#7c5812,#D9B26A)"][i % 4],
                      transitionDelay: `${i * 140}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-ink/40 p-4">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--color-gold)" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
            </svg>
            <p className="text-xs text-mute">
              Presença no Brasil, Europa e Estados Unidos — base curada e segmentada em conformidade com LGPD e GDPR.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Ecosystem verticals with imagery                                 */
/* ------------------------------------------------------------------ */
export type Vertical = { n: string; tag: string; name: string; desc: string; img: number; image?: string; editTarget?: EditTarget };

export function Ecosystem({ verticals }: { verticals: Vertical[] }) {
  return (
    <section className="section">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {verticals.map((v) => (
          <article key={v.n} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-1 hover:border-blush">
            <div className="relative aspect-[4/3] overflow-hidden">
              {v.editTarget ? (
                <EditableImage target={v.editTarget} src={v.image || px(v.img, 700, 525)} alt={v.name} imgClass="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              ) : <img src={v.image || px(v.img, 700, 525)} alt={v.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#12060a] via-[#12060a33] to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-blush px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[.18em] text-[#12060a]">
                {v.tag}
              </span>
              <span className="absolute bottom-2 right-3 font-display text-4xl font-extrabold text-white/25">{v.n}</span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-xl font-bold uppercase leading-tight">{v.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{v.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Interactive process timeline                                     */
/* ------------------------------------------------------------------ */
export type Step = { step: string; title: string; desc: string; deliverable: string };

export function ProcessTimeline({ steps, img, imageTarget }: { steps: Step[]; img: number | string; imageTarget?: EditTarget }) {
  const [active, setActive] = useState(0);
  const cur = steps[active];
  if (!steps.length || !cur) return null;

  return (
    <section className="section">
      <div className="sh">
        <div>
          <p className="eyebrow mb-2">Do brief ao clipping</p>
          <h2>Como Atuamos</h2>
        </div>
        <span className="more">Entregas em 24 a 48 horas</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        {/* vertical step rail */}
        <div className="grid gap-2">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className="flex items-center gap-4 rounded-2xl border p-4 text-left transition"
                style={{
                  borderColor: on ? "var(--color-blush)" : "var(--color-line)",
                  background: on ? "var(--color-wine)" : "transparent",
                }}
                aria-pressed={on}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-extrabold"
                  style={{ background: on ? "var(--color-blush)" : "var(--color-wine)", color: on ? "#12060a" : "var(--color-blush)" }}
                >
                  {s.step}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block font-display text-lg font-bold uppercase leading-tight">{s.title}</b>
                  <small className="line-clamp-1 text-mute">{s.deliverable}</small>
                </span>
                <span className="text-mute">{on ? "◀" : "›"}</span>
              </button>
            );
          })}
        </div>

        {/* detail panel with image */}
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="relative aspect-[16/9]">
            {imageTarget ? (
              <EditableImage target={imageTarget} src={typeof img === "number" ? px(img, 1100, 620) : img} alt="" imgClass="h-full w-full object-cover" />
            ) : <img src={typeof img === "number" ? px(img, 1100, 620) : img} alt="" className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#12060a] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <span className="font-display text-6xl font-extrabold text-white/30">{cur.step}</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-display text-3xl font-extrabold uppercase">{cur.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-mute">{cur.desc}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-blush/40 bg-blush/10 p-4">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-blush)" strokeWidth="2" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <div>
                <span className="block font-display text-[10px] uppercase tracking-[.22em] text-gold">Entregável</span>
                <b className="text-sm text-paper">{cur.deliverable}</b>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Etapa ${i + 1}`}
                  onClick={() => setActive(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === active ? 32 : 12, background: i === active ? "var(--color-blush)" : "var(--color-line)" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Audience infographic (donut + icons)                             */
/* ------------------------------------------------------------------ */
export function AudienceInfographic({ audiences, img, imageTarget }: { audiences: { tag: string; name: string; desc: string; icon: string }[]; img: number | string; imageTarget?: EditTarget }) {
  return (
    <section className="section">
      <div className="sh">
        <div>
          <p className="eyebrow mb-2">Para quem é a YOUR</p>
          <h2>Marcas. E as pessoas por trás delas.</h2>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-line">
          {imageTarget ? (
            <EditableImage target={imageTarget} src={typeof img === "number" ? px(img, 1100, 800) : img} alt="" imgClass="absolute inset-0 h-full w-full object-cover" />
          ) : <img src={typeof img === "number" ? px(img, 1100, 800) : img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-[linear-gradient(0deg,#12060af5_20%,#12060a55_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <p className="eyebrow">Audience</p>
            <p className="mt-2 font-display text-3xl font-extrabold uppercase leading-tight text-white">
              Acesso B2B segmentado a uma base curada, no Brasil, Europa e Estados Unidos.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {audiences.map((a) => (
            <div key={a.name} className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-1 hover:border-blush">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wine text-xl" aria-hidden>
                {a.icon}
              </div>
              <p className="tag">{a.tag}</p>
              <h3 className="mt-1.5 font-display text-xl font-bold uppercase leading-tight">{a.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Plans strip CTA                                                  */
/* ------------------------------------------------------------------ */
export function PlansStrip({ lang, budgetHref, pressHref }: { lang: string; budgetHref: string; pressHref: string }) {
  const cards = [
    {
      name: "Plano Start",
      price: "R$ 3.500",
      per: "/mês",
      tag: "Começando",
      desc: "Para marcas que estão começando a construir presença na mídia.",
      items: ["1 release por mês", "Texto profissional", "Disparo na rede", "Clipping básico"],
      tone: "wine",
    },
    {
      name: "Plano Business",
      price: "R$ 6.500",
      per: "/mês",
      tag: "Mais contratado",
      desc: "Visibilidade consistente e recorrente.",
      items: ["2 releases por mês", "Matéria mensal na edição YOUR", "Disparo estratégico", "Clipping completo"],
      tone: "gold",
    },
    {
      name: "Plano Premium",
      price: "R$ 12.000",
      per: "/mês",
      tag: "Ecossistema completo",
      desc: "Assessoria, produção e distribuição.",
      items: ["4 releases por mês", "Conteúdo multimídia", "Entrevistas exclusivas", "Relatório executivo"],
      tone: "wine",
    },
  ];

  return (
    <section className="section">
      <div className="sh">
        <div>
          <p className="eyebrow mb-2">Planos mensais</p>
          <h2>Do primeiro release à presença contínua</h2>
        </div>
        <Link href={budgetHref} className="more">Catálogo completo →</Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map((c, i) => (
          <div
            key={c.name}
            className={`relative overflow-hidden rounded-3xl border p-6 ${c.tone === "gold" ? "border-gold bg-[linear-gradient(160deg,#3A0B1C,#12060A)]" : "border-line bg-surface"}`}
          >
            {c.tone === "gold" && (
              <span className="absolute right-5 top-5 rounded-full bg-gold px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[.18em] text-[#12060a]">
                {c.tag}
              </span>
            )}
            <p className="tag">{c.tone === "gold" ? "" : c.tag}</p>
            <h3 className="mt-1 font-display text-3xl font-extrabold uppercase">{c.name}</h3>
            <p className="mt-2 text-sm text-mute">{c.desc}</p>
            <div className="mt-5 flex items-end gap-1">
              <b className="font-display text-[42px] font-extrabold leading-none text-blush">{c.price}</b>
              <span className="pb-1 text-sm text-mute">{c.per}</span>
            </div>
            <ul className="mt-5 grid gap-2">
              {c.items.map((it) => (
                <li key={it} className="flex items-start gap-2 text-sm">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-gold)" strokeWidth="2.6" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-mute">{it}</span>
                </li>
              ))}
            </ul>
            <Link href={budgetHref} className={`btn mt-6 w-full ${c.tone === "gold" ? "btn-gold" : "btn-pri"}`}>
              Montar orçamento
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-wine p-7">
        <div>
          <p className="eyebrow mb-2">Assessoria avulsa ou sob medida</p>
          <h3 className="font-display text-2xl font-extrabold uppercase">
            38 serviços em 7 categorias, com proposta na hora
          </h3>
          <p className="mt-2 max-w-[62ch] text-sm text-mute">
            Entrada de 50% dos itens de valor único · faturamento NET 14 · assessoria não garante publicação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={budgetHref} className="btn btn-gold">＋ Montar meu orçamento</Link>
          <Link href={pressHref} className="btn">Sala de imprensa</Link>
        </div>
      </div>
    </section>
  );
}
