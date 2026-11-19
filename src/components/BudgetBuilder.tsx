"use client";

import { useMemo, useState } from "react";

export type CatGroup = { id: string; nome: string; desc: string };
export type CatItem = {
  id: string; grupo: string; nome: string; desc: string; preco: number;
  unidade: "unico" | "mensal"; natureza: string; qtdMax: number;
  prazo: string; entrega: string[]; ativo?: boolean;
};
export type Prazo = { meses: number; desconto: number; nome: string };

export type Catalog = {
  grupos: CatGroup[];
  itens: CatItem[];
  prazos: Prazo[];
  condicoes: string[];
  validadeDias: number;
};

type Copy = Record<string, string>;

const COPY: Record<string, Copy> = {
  pt: {
    title: "Monte o seu orçamento",
    intro: "Escolha os serviços que fazem sentido para a sua marca. Ao final, você recebe uma proposta com valores, descrição de cada item, prazos e condições, no mesmo instante.",
    step1: "1. Escolher serviços",
    step2: "2. Seus dados",
    step3: "3. Receber a proposta",
    search: "Buscar serviço…",
    all: "Todos",
    qty: "Qtd",
    add: "Adicionar",
    remove: "Remover",
    cart: "Seu orçamento",
    cartEmpty: "Nenhum item selecionado. Escolha serviços na lista ao lado.",
    oneTime: "Valores únicos",
    monthly: "Mensalidades",
    subtotalOnce: "Subtotal único",
    subtotalMonthly: "Subtotal mensal",
    duration: "Duração do contrato",
    discount: "Desconto aplicado",
    totalMonthly: "Total mensal",
    totalContract: "Valor total do contrato",
    entry: "Entrada (50% dos itens únicos)",
    name: "Nome",
    email: "E-mail",
    phone: "Telefone",
    company: "Marca / Empresa",
    role: "Cargo (opcional)",
    notes: "Objetivo da campanha (opcional)",
    generate: "Gerar proposta agora",
    regenerating: "Gerando…",
    proposal: "Proposta preliminar",
    preparedFor: "Preparada para",
    validity: "Validade da proposta",
    days: "dias",
    print: "Baixar / Imprimir proposta",
    edit: "Voltar e editar",
    conditions: "Condições comerciais",
    deadline: "Prazo",
    deliveries: "Entregas",
    unitOnce: "valor único",
    unitMonthly: "mensal",
    service: "serviço",
    product: "produto",
    reference: "Valores são referências de mercado para uma proposta preliminar e são confirmados na reunião de briefing.",
  },
  en: {
    title: "Build your quote",
    intro: "Choose the services that make sense for your brand. You will get a proposal with prices, item descriptions, deadlines and terms, instantly.",
    step1: "1. Choose services",
    step2: "2. Your details",
    step3: "3. Get the proposal",
    search: "Search services…",
    all: "All",
    qty: "Qty",
    add: "Add",
    remove: "Remove",
    cart: "Your quote",
    cartEmpty: "No items selected. Pick services from the list.",
    oneTime: "One-time",
    monthly: "Monthly",
    subtotalOnce: "One-time subtotal",
    subtotalMonthly: "Monthly subtotal",
    duration: "Contract length",
    discount: "Discount applied",
    totalMonthly: "Monthly total",
    totalContract: "Total contract value",
    entry: "Down payment (50% of one-time items)",
    name: "Name",
    email: "Email",
    phone: "Phone",
    company: "Brand / Company",
    role: "Role (optional)",
    notes: "Campaign goal (optional)",
    generate: "Generate proposal",
    regenerating: "Generating…",
    proposal: "Preliminary proposal",
    preparedFor: "Prepared for",
    validity: "Proposal validity",
    days: "days",
    print: "Download / Print proposal",
    edit: "Back and edit",
    conditions: "Commercial terms",
    deadline: "Deadline",
    deliveries: "Deliverables",
    unitOnce: "one-time",
    unitMonthly: "monthly",
    service: "service",
    product: "product",
    reference: "Values are market references for a preliminary proposal and are confirmed at the briefing meeting.",
  },
  es: {
    title: "Arma tu presupuesto",
    intro: "Elige los servicios que tienen sentido para tu marca. Al final recibirás una propuesta con valores, descripción de cada ítem, plazos y condiciones, al instante.",
    step1: "1. Elegir servicios",
    step2: "2. Tus datos",
    step3: "3. Recibir la propuesta",
    search: "Buscar servicio…",
    all: "Todos",
    qty: "Cant",
    add: "Añadir",
    remove: "Quitar",
    cart: "Tu presupuesto",
    cartEmpty: "Ningún ítem seleccionado. Elige servicios de la lista.",
    oneTime: "Valores únicos",
    monthly: "Mensualidades",
    subtotalOnce: "Subtotal único",
    subtotalMonthly: "Subtotal mensual",
    duration: "Duración del contrato",
    discount: "Descuento aplicado",
    totalMonthly: "Total mensual",
    totalContract: "Valor total del contrato",
    entry: "Entrada (50% de los ítems únicos)",
    name: "Nombre",
    email: "Correo",
    phone: "Teléfono",
    company: "Marca / Empresa",
    role: "Cargo (opcional)",
    notes: "Objetivo de la campaña (opcional)",
    generate: "Generar propuesta ahora",
    regenerating: "Generando…",
    proposal: "Propuesta preliminar",
    preparedFor: "Preparada para",
    validity: "Validez de la propuesta",
    days: "días",
    print: "Descargar / Imprimir propuesta",
    edit: "Volver y editar",
    conditions: "Condiciones comerciales",
    deadline: "Plazo",
    deliveries: "Entregas",
    unitOnce: "valor único",
    unitMonthly: "mensual",
    service: "servicio",
    product: "producto",
    reference: "Los valores son referencias de mercado para una propuesta preliminar y se confirman en la reunión de briefing.",
  },
};

const money = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(n);

export function BudgetBuilder({ catalog, lang, email }: { catalog: Catalog; lang: string; email: string }) {
  const c = COPY[lang] || COPY.pt;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<string | null>(catalog.itens[0]?.id || null);
  const [months, setMonths] = useState(3);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", role: "", notes: "" });

  const groups = catalog.grupos.filter((g) => catalog.itens.some((i) => i.grupo === g.id && i.ativo !== false));
  const itens = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog.itens.filter((i) => {
      if (i.ativo === false) return false;
      if (group !== "all" && i.grupo !== group) return false;
      if (term && !`${i.nome} ${i.desc} ${i.grupo}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [catalog.itens, group, q]);

  const selected = Object.entries(qty).filter(([, n]) => n > 0);
  const onceItems = selected.map(([id, n]) => ({ item: catalog.itens.find((i) => i.id === id)!, n })).filter((x) => x.item && x.item.unidade === "unico");
  const monthlyItems = selected.map(([id, n]) => ({ item: catalog.itens.find((i) => i.id === id)!, n })).filter((x) => x.item && x.item.unidade === "mensal");

  const onceTotal = onceItems.reduce((s, x) => s + x.item.preco * x.n, 0);
  const monthlyBase = monthlyItems.reduce((s, x) => s + x.item.preco * x.n, 0);
  const prazo = catalog.prazos.find((p) => p.meses === months) || catalog.prazos[0];
  const discount = prazo?.desconto || 0;
  const monthlyTotal = Math.round(monthlyBase * (1 - discount / 100));
  const contractTotal = onceTotal + monthlyTotal * months;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const bump = (id: string, d: number, max: number) =>
    setQty((s) => ({ ...s, [id]: Math.max(0, Math.min(max, (s[id] || 0) + d)) }));

  const canGenerate = form.name.trim() && /.+@.+\..+/.test(form.email);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      {/* STEPS NAV */}
      <div className="lg:col-span-2">
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              type="button"
              className="chip"
              data-on={step === n}
              onClick={() => { if (n < 3 || canGenerate) setStep(n); }}
            >
              {n === 1 ? c.step1 : n === 2 ? c.step2 : c.step3}
            </button>
          ))}
        </div>
      </div>

      {/* CATALOG / CART */}
      <div>
        {step === 1 && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input className="field !w-56" placeholder={c.search} value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="chip" data-on={group === "all"} onClick={() => setGroup("all")}>{c.all} ({catalog.itens.filter((i) => i.ativo !== false).length})</button>
              {groups.map((g) => (
                <button key={g.id} className="chip" data-on={group === g.id} onClick={() => setGroup(g.id)}>
                  {g.nome}
                </button>
              ))}
            </div>

            <div className="grid gap-2">
              {itens.map((item) => {
                const isOpen = open === item.id;
                const n = qty[item.id] || 0;
                return (
                  <div key={item.id} className="rounded-xl border border-line bg-surface">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      className="flex w-full flex-wrap items-center gap-3 p-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-bold uppercase">{item.nome}</p>
                        <p className="text-xs text-mute">
                          {catalog.grupos.find((g) => g.id === item.grupo)?.nome} · {item.prazo || "—"} ·{" "}
                          <b className="text-blush">{money(item.preco, lang)}</b>{" "}
                          {item.unidade === "mensal" ? c.unitMonthly : c.unitOnce}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {n > 0 && <span className="chip !px-2.5 !py-1 text-[11px]">× {n}</span>}
                        <span className="text-mute">{isOpen ? "▴" : "▾"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-line/60 p-3">
                        <p className="text-sm text-mute">{item.desc}</p>
                        {item.entrega?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.entrega.map((e, i) => <span key={i} className="chip !px-2 !py-1 text-[10px]">✓ {e}</span>)}
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button type="button" className="chip" onClick={() => bump(item.id, -1, item.qtdMax || 1)}>−</button>
                          <span className="grid h-8 w-10 place-items-center rounded-lg border border-line font-display text-lg">{n}</span>
                          <button type="button" className="chip" onClick={() => bump(item.id, 1, item.qtdMax || 1)}>+</button>
                          <button type="button" className="btn btn-pri" onClick={() => bump(item.id, n > 0 ? 0 : 1, item.qtdMax || 1)}>
                            {n > 0 ? c.remove : c.add}
                          </button>
                          <span className="ml-auto text-xs text-mute">máx. {item.qtdMax || 1}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!itens.length && <p className="text-sm text-mute">—</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">{c.name} *</span>
                <input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label className="block">
                <span className="label">{c.email} *</span>
                <input type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label className="block">
                <span className="label">{c.phone}</span>
                <input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
              <label className="block">
                <span className="label">{c.company}</span>
                <input className="field" value={form.company} onChange={(e) => set("company", e.target.value)} />
              </label>
              <label className="block">
                <span className="label">{c.role}</span>
                <input className="field" value={form.role} onChange={(e) => set("role", e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">{c.notes}</span>
                <textarea className="field min-h-[110px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => setStep(1)}>← {c.step1}</button>
              <button type="button" className="btn btn-gold" disabled={!canGenerate} onClick={() => setStep(3)}>
                {c.generate} →
              </button>
            </div>
            <p className="mt-3 text-xs text-mute">{c.reference}</p>
            <p className="mt-1 text-xs text-mute">
              {c.email === "E-mail" ? "Prefere falar direto?" : "Prefer to talk directly?"}{" "}
              <a className="text-blush underline" href={`mailto:${email}`}>{email}</a>
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-line bg-surface p-6" id="proposta">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src="/brand/logo.png" alt="YOUR 10 Anos" className="h-8 w-auto" />
                <div>
                  <p className="eyebrow">{c.proposal}</p>
                  <p className="font-display text-xl font-bold uppercase">
                    {form.company || form.name} · {new Date().toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn" onClick={() => window.print()}>{c.print}</button>
                <button type="button" className="chip" onClick={() => setStep(1)}>{c.edit}</button>
              </div>
            </div>

            <div className="grid gap-2">
              {[...onceItems, ...monthlyItems].map(({ item, n }) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 py-2">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold uppercase">{item.nome} × {n}</p>
                    <p className="text-xs text-mute">{item.prazo} · {item.unidade === "mensal" ? c.unitMonthly : c.unitOnce}</p>
                  </div>
                  <b className="font-display text-lg">
                    {money(item.preco * n, lang)}{item.unidade === "mensal" ? " /mês" : ""}
                  </b>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 rounded-xl border border-line bg-ink/40 p-4 sm:grid-cols-2">
              <div className="stat"><b>{money(onceTotal, lang)}</b><span>{c.subtotalOnce}</span></div>
              <div className="stat"><b>{money(monthlyTotal, lang)}</b><span>{c.subtotalMonthly} · {prazo?.nome}</span></div>
              <div className="stat"><b>{money(monthlyTotal * months, lang)}</b><span>{c.totalContract} ({months} {c.days === "dias" ? "meses" : "months"})</span></div>
              <div className="stat"><b>{money(onceTotal + monthlyTotal * months, lang)}</b><span>{c.totalContract}</span></div>
              <div className="stat"><b>{money(Math.round(onceTotal * 0.5), lang)}</b><span>{c.entry}</span></div>
              {discount > 0 && <div className="stat"><b>−{discount}%</b><span>{c.discount}</span></div>}
            </div>

            <div className="mt-5">
              <p className="label">{c.conditions}</p>
              <ul className="grid gap-1.5 text-xs text-mute">
                {(catalog.condicoes || []).map((cond, i) => <li key={i}>• {cond}</li>)}
              </ul>
            </div>

            <div className="mt-5 rounded-xl border border-line bg-wine p-4">
              <p className="text-sm">
                {c.preparedFor}: <b className="text-paper">{form.name}{form.company ? ` — ${form.company}` : ""}</b> · {form.email}
                {form.phone ? ` · ${form.phone}` : ""}
              </p>
              <p className="mt-1 text-xs text-mute">{c.validity}: {catalog.validadeDias || 15} {c.days}</p>
              <a href={`mailto:${email}?subject=${encodeURIComponent(`Proposta — ${form.company || form.name}`)}`} className="btn btn-gold mt-3 inline-flex">
                {email}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* CART SUMMARY */}
      <aside className="grid content-start gap-4 rounded-2xl border border-line bg-wine p-5">
        <h3 className="font-display text-2xl font-bold uppercase">{c.cart}</h3>
        {selected.length === 0 ? (
          <p className="text-sm text-mute">{c.cartEmpty}</p>
        ) : (
          <>
            {onceItems.length > 0 && (
              <div>
                <p className="label">{c.oneTime}</p>
                {onceItems.map(({ item, n }) => (
                  <div key={item.id} className="flex justify-between gap-2 text-sm">
                    <span className="truncate text-mute">{item.nome} × {n}</span>
                    <b className="shrink-0">{money(item.preco * n, lang)}</b>
                  </div>
                ))}
              </div>
            )}
            {monthlyItems.length > 0 && (
              <div>
                <p className="label">{c.monthly}</p>
                {monthlyItems.map(({ item, n }) => (
                  <div key={item.id} className="flex justify-between gap-2 text-sm">
                    <span className="truncate text-mute">{item.nome} × {n}</span>
                    <b className="shrink-0">{money(item.preco * n, lang)}</b>
                  </div>
                ))}
                <div className="mt-3">
                  <p className="label">{c.duration}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(catalog.prazos || []).map((p) => (
                      <button key={p.meses} type="button" className="chip" data-on={months === p.meses} onClick={() => setMonths(p.meses)}>
                        {p.nome}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2 border-t border-line/60 pt-3">
              {onceItems.length > 0 && (
                <div className="flex justify-between text-sm"><span className="text-mute">{c.subtotalOnce}</span><b>{money(onceTotal, lang)}</b></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-mute">{c.subtotalMonthly}</span><b>{money(monthlyTotal, lang)}</b></div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-blush"><span>{c.discount}</span><b>−{discount}%</b></div>
              )}
              <div className="flex justify-between border-t border-line/60 pt-2">
                <span className="font-display text-lg uppercase">{c.totalContract}</span>
                <b className="font-display text-2xl">{money(contractTotal, lang)}</b>
              </div>
            </div>
          </>
        )}

        <button type="button" className="btn btn-gold w-full" disabled={selected.length === 0} onClick={() => setStep(2)}>
          {c.generate} →
        </button>
        <p className="text-[11px] leading-relaxed text-mute">{c.reference}</p>
        <a href={`mailto:${email}`} className="text-center text-xs text-blush underline">{email}</a>
      </aside>
    </div>
  );
}
