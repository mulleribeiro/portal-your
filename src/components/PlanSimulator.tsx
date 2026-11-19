"use client";

import { useState } from "react";

type Option = { id: string; label: string; desc?: string; price: number; reach: number; formats: number };

export function PlanSimulator({
  options, labels, lang,
}: {
  options: Option[];
  labels: { title: string; subtitle: string; total: string; reach: string; formats: string; send: string; sent: string; name: string; email: string; brand: string };
  lang: string;
}) {
  const [selected, setSelected] = useState<string[]>(options[0]?.id ? [options[0].id] : []);
  const [form, setForm] = useState({ name: "", email: "", brand: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const chosen = options.filter((o) => selected.includes(o.id));
  const total = chosen.reduce((sum, o) => sum + o.price, 0);
  const reach = chosen.reduce((sum, o) => sum + o.reach, 0);
  const formats = chosen.reduce((sum, o) => sum + o.formats, 0);
  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";
  const money = new Intl.NumberFormat(locale, {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  });

  const send = async () => {
    setStatus("sending");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lang, plan: chosen.map((c) => c.label), total, reach }),
    });
    setStatus(res.ok ? "sent" : "error");
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h3 className="font-display text-3xl font-extrabold uppercase">{labels.title}</h3>
      <p className="mb-5 mt-1 text-sm text-mute">{labels.subtitle}</p>

      <div className="grid gap-2.5">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                on ? "border-blush bg-wine" : "border-line bg-ink/40 hover:border-blush/60"
              }`}
              aria-pressed={on}
            >
              <span className="flex min-w-0 items-start gap-3">
                <span
                  className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded border text-xs font-bold ${
                    on ? "border-blush bg-blush text-[#12060a]" : "border-line"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                <span className="min-w-0">
                  <b className="block font-display text-lg uppercase">{o.label}</b>
                  {o.desc && <small className="block text-xs text-mute">{o.desc}</small>}
                  <small className="mt-1 block font-semibold text-blush">
                    {money.format(o.price)} · {o.reach.toLocaleString(locale)} views
                  </small>
                </span>
              </span>
              <span className="tag shrink-0">{o.formats} entregas</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 rounded-2xl border border-line bg-ink/50 p-5 sm:grid-cols-3">
        <div className="stat"><b>{money.format(total)}</b><span>{labels.total}</span></div>
        <div className="stat"><b>{reach.toLocaleString(locale)}</b><span>{labels.reach}</span></div>
        <div className="stat"><b>{formats}</b><span>{labels.formats}</span></div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <input className="field" placeholder={labels.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field" placeholder={labels.email} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" placeholder={labels.brand} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-gold" disabled={status === "sending" || !form.email} onClick={send}>
          {status === "sending" ? "…" : labels.send}
        </button>
        {status === "sent" && <span className="text-sm text-blush">{labels.sent}</span>}
        {status === "error" && <span className="text-sm text-red-400">Erro — tente novamente.</span>}
      </div>
    </div>
  );
}
