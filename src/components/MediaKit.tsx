"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MKFormat = { id: string; name: string; desc: string; price: number; reach: number };
export type MKCopy = Record<string, string>;
export type MKProps = {
  lang: string;
  email: string;
  stats: { value: string; label: string }[];
  audience: { value: string; label: string }[];
  ages: { label: string; value: number }[];
  women: number;
  channels: { label: string; value: number }[];
  formats: MKFormat[];
  brands: { id: string; title: string; image: string | null }[];
  copy: MKCopy;
};

const localeOf = (lang: string) => (lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR");
const MULT: Record<number, number> = { 1: 1, 3: 0.92, 6: 0.85, 12: 0.78 };
const CHANNEL_COLORS = ["#E9A7B8", "#D9B26A", "#C2486A", "#F0C9A0"];

function parseNum(v: string) {
  const m = v.match(/^\s*(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return null;
  return { n: parseFloat(m[1].replace(",", ".")), dec: (m[1].split(/[.,]/)[1] || "").length, suffix: m[2] };
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

function CountUp({ value, lang }: { value: string; lang: string }) {
  const parsed = parseNum(value);
  const target = parsed?.n ?? 0;
  const { ref, seen } = useInView<HTMLSpanElement>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!seen) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400);
      setCurrent(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, target]);

  if (!parsed) return <span>{value}</span>;
  return (
    <span ref={ref}>
      {current.toLocaleString(localeOf(lang), { minimumFractionDigits: parsed.dec, maximumFractionDigits: parsed.dec })}
      {parsed.suffix}
    </span>
  );
}

export function MediaKit({ lang, email, stats, audience, ages, women, channels, formats, brands, copy }: MKProps) {
  const money = useMemo(() => new Intl.NumberFormat(localeOf(lang), { style: "currency", currency: "BRL", maximumFractionDigits: 0 }), [lang]);
  const [picked, setPicked] = useState<string[]>(formats.slice(0, 2).map((f) => f.id));
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [form, setForm] = useState({ name: "", email: "", brand: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const chosen = formats.filter((f) => picked.includes(f.id));
  const subtotal = chosen.reduce((sum, f) => sum + f.price, 0);
  const total = Math.round(subtotal * months * MULT[months]);
  const reach = chosen.reduce((sum, f) => sum + f.reach, 0) * months;

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const send = async () => {
    setStatus("sending");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lang, plan: chosen.map((c) => c.name), total, reach, months }),
    });
    setStatus(res.ok ? "sent" : "error");
  };

  const { ref: donutRef, seen: donutSeen } = useInView<HTMLDivElement>();
  const circumference = 2 * Math.PI * 62;
  const womenPct = Math.min(100, Math.max(0, women)) / 100;
  const maxAge = Math.max(...ages.map((a) => a.value), 1);
  const channelTotal = channels.reduce((sum, c) => sum + c.value, 0) || 1;
  const [hoverAge, setHoverAge] = useState<number | null>(null);
  const [hoverChannel, setHoverChannel] = useState<number | null>(null);

  return (
    <div className="grid min-w-0 max-w-full gap-10 overflow-x-hidden">
      {/* HERO + counters (explicit high-contrast light text on dark wine stage) */}
      <section className="relative min-w-0 overflow-hidden rounded-3xl border border-line bg-[radial-gradient(90%_120%_at_0%_0%,#5C1830_0%,#12060A_65%)] p-6 text-[#F7EEF0] sm:p-10">
        <p className="font-display text-xs font-semibold uppercase tracking-[.24em] text-[#E9A7B8]">{copy.kicker}</p>
        <h2 className="mt-2 max-w-[18ch] font-display text-[clamp(34px,6vw,76px)] font-extrabold uppercase leading-[.96] text-[#F7EEF0]">
          {copy.heroTitle}
        </h2>
        <p className="mt-4 max-w-[56ch] text-base text-[#E5D3D8] sm:text-lg">{copy.heroText}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn btn-gold" href="#configurador">{copy.ctaBuy}</a>
          <a className="rounded-full border border-[#ffffff45] bg-[#ffffff14] px-4 py-2 font-display text-xs font-semibold uppercase tracking-[.12em] text-[#F7EEF0] hover:border-[#E9A7B8]" href={`mailto:${email}`}>
            {copy.ctaMail}
          </a>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s, i) => (
            <div key={i} className="min-w-0 border-l-2 border-[#E9A7B8] pl-3.5">
              <b className="block font-display text-[clamp(26px,3.6vw,44px)] font-extrabold leading-none text-[#F7EEF0]">
                <CountUp value={s.value} lang={lang} />
              </b>
              <span className="mt-1 block text-xs text-[#D5BDC4] sm:text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="grid min-w-0 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div ref={donutRef} className="min-w-0 rounded-2xl border border-line bg-surface p-6">
          <p className="eyebrow mb-4">{copy.audience}</p>
          <div className="flex flex-wrap items-center gap-6">
            <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0 -rotate-90 sm:h-40 sm:w-40">
              <circle cx="80" cy="80" r="62" fill="none" stroke="var(--color-line)" strokeWidth="18" />
              <circle
                cx="80" cy="80" r="62" fill="none" stroke="var(--color-blush)" strokeWidth="18" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={donutSeen ? circumference * (1 - womenPct) : circumference}
                style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1)" }}
              />
            </svg>
            <div>
              <p className="font-display text-5xl font-extrabold text-paper">
                <CountUp value={`${women.toString().replace(".", ",")}%`} lang={lang} />
              </p>
              <p className="text-mute">{copy.women}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-2">
            {audience.map((a, i) => (
              <div key={i} className="flex items-center justify-between border-b border-line/60 py-1.5 text-sm">
                <span className="text-mute">{a.label}</span>
                <b className="font-display text-lg text-paper">{a.value}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-line bg-surface p-6">
          <p className="eyebrow mb-4">{copy.ages}</p>
          <div className="grid gap-4">
            {ages.map((a, i) => (
              <div key={i} onMouseEnter={() => setHoverAge(i)} onMouseLeave={() => setHoverAge(null)}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className={hoverAge === i ? "font-semibold text-blush" : "text-mute"}>{a.label}</span>
                  <b className="font-display text-lg text-paper">{a.value.toLocaleString(localeOf(lang), { maximumFractionDigits: 1 })}%</b>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink">
                  <div
                    className="h-full rounded-full transition-all duration-[1300ms] ease-out"
                    style={{
                      width: donutSeen ? `${(a.value / maxAge) * 100}%` : "0%",
                      background: hoverAge === i ? "var(--color-gold)" : "linear-gradient(90deg,#C2486A,#E9A7B8)",
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHANNELS */}
      <section className="min-w-0 rounded-2xl border border-line bg-wine p-6 sm:p-8">
        <p className="eyebrow mb-2">{copy.channels}</p>
        <p className="mb-5 text-sm text-mute">{copy.channelsUnit}</p>
        <div className="flex h-12 overflow-hidden rounded-2xl sm:h-14">
          {channels.map((c, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoverChannel(i)}
              onMouseLeave={() => setHoverChannel(null)}
              className="flex items-center justify-center overflow-hidden px-1 font-display text-xs font-bold uppercase text-[#12060A] transition-all duration-500 sm:text-sm"
              style={{
                width: `${(c.value / channelTotal) * 100}%`,
                background: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                filter: hoverChannel !== null && hoverChannel !== i ? "saturate(.35) brightness(.8)" : "none",
              }}
              title={`${c.label}: ${c.value.toLocaleString(localeOf(lang))}`}
            >
              {(c.value / channelTotal) > 0.14 ? c.label : ""}
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3" style={{ borderColor: hoverChannel === i ? CHANNEL_COLORS[i % CHANNEL_COLORS.length] : undefined }}>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
              <span className="truncate text-sm text-mute">{c.label}</span>
              <b className="ml-auto shrink-0 font-display text-lg text-paper">{(c.value / 1000).toLocaleString(localeOf(lang), { maximumFractionDigits: 1 })} mi</b>
            </div>
          ))}
        </div>
      </section>

      {/* CONFIGURATOR */}
      <section id="configurador" className="grid min-w-0 scroll-mt-24 gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-8">
          <h2 className="font-display text-3xl font-extrabold uppercase text-paper">{copy.formats}</h2>
          <p className="mb-5 mt-1 text-sm text-mute">{copy.formatsSub}</p>
          <div className="grid gap-2.5">
            {formats.map((f) => {
              const on = picked.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`flex min-w-0 items-center gap-3.5 rounded-xl border p-4 text-left transition ${on ? "border-blush bg-wine" : "border-line bg-ink/40 hover:border-blush/60"}`}
                  aria-pressed={on}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs font-bold ${on ? "border-blush bg-blush text-[#12060a]" : "border-line bg-transparent"}`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-display text-lg uppercase text-paper">{f.name}</b>
                    <small className="block text-mute">{f.desc}</small>
                  </span>
                  <span className="shrink-0 font-display text-lg font-bold text-paper">{money.format(f.price)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6">
            <p className="label">{copy.duration}</p>
            <div className="flex flex-wrap gap-2">
              {([1, 3, 6, 12] as const).map((m) => (
                <button key={m} type="button" className="chip" data-on={months === m} onClick={() => setMonths(m)}>
                  {m} {copy.months}{m > 1 ? ` · −${Math.round((1 - MULT[m]) * 100)}%` : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid min-w-0 content-start gap-4 rounded-2xl border border-line bg-wine p-6 sm:p-8">
          <div className="stat"><b className="text-[36px] sm:text-[40px]">{money.format(total)}</b><span>{copy.total}</span></div>
          <div className="stat"><b className="text-[36px] sm:text-[40px]">{reach.toLocaleString(localeOf(lang))}</b><span>{copy.reach}</span></div>
          <div className="mt-2 grid gap-2.5">
            <input className="field" placeholder={copy.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" placeholder={copy.email} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" placeholder={copy.brand} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-pri" disabled={status === "sending" || !form.email || chosen.length === 0} onClick={send}>
              {status === "sending" ? "…" : copy.request}
            </button>
            {status === "sent" && <span className="text-sm text-blush">{copy.sent}</span>}
            {status === "error" && <span className="text-sm text-red-400">{copy.error}</span>}
          </div>
        </aside>
      </section>

      {/* BRANDS marquee — constrained inside min-w-0 overflow-hidden so it never widens the page */}
      <section className="min-w-0 max-w-full overflow-hidden">
        <p className="eyebrow mb-4">{copy.brands}</p>
        <div className="max-w-full overflow-hidden rounded-2xl border border-line bg-surface py-6">
          <div className="marquee flex w-max items-center gap-12 px-6">
            {[...brands, ...brands].map((b, i) => (
              <div key={`${b.id}-${i}`} className="flex items-center gap-3 whitespace-nowrap">
                {b.image ? (
                  <img src={b.image} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-line font-display text-blush">
                    {b.title.charAt(0)}
                  </span>
                )}
                <span className="font-display text-2xl font-bold uppercase text-mute">{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-line bg-wine p-8 text-center sm:p-12">
        <h2 className="font-display text-3xl font-extrabold uppercase text-paper sm:text-5xl">{copy.contact}</h2>
        <p className="mx-auto mt-2 max-w-[52ch] text-mute">{copy.contactSub}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a className="btn btn-gold" href={`mailto:${email}`}>{email}</a>
          <a className="btn" href="#configurador">{copy.ctaBuy}</a>
        </div>
      </section>
    </div>
  );
}
