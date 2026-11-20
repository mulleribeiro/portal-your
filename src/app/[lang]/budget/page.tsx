import Link from "next/link";
import { BudgetBuilder, type Catalog } from "@/components/BudgetBuilder";
import { Kin } from "@/components/ui";
import { loadSite, mlPick, pageBySlug } from "@/lib/data";
import { CONTACT_EMAIL } from "@/lib/contact";

export async function generateMetadata() {
  return {
    title: "Monte o seu orçamento · YOUR",
    description: "Escolha os serviços da YOUR, monte o carrinho e receba uma proposta com valores, prazos e condições no mesmo instante.",
  };
}

export default async function BudgetPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const s = site.settings;
  const page = pageBySlug(site, "relations");

  const catalog = (s.catalog || { grupos: [], itens: [], prazos: [], condicoes: [], validadeDias: 15 }) as unknown as Catalog;
  const groups = catalog.grupos || [];
  const itens = catalog.itens || [];

  return (
    <>
      <section className="pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">YOUR Press · Orçamento online</p>
            <h1 className="font-display text-[clamp(40px,7vw,88px)] font-extrabold uppercase">
              <Kin text={lang === "en" ? "Build your quote" : lang === "es" ? "Arma tu presupuesto" : "Monte o seu orçamento"} />
            </h1>
            <p className="mt-3 max-w-[68ch] text-lg text-mute">
              {lang === "en"
                ? "Choose from our full catalogue of services, products and categories. You get a proposal with values, descriptions, deadlines and terms instantly — with its own shareable link."
                : lang === "es"
                ? "Elige de nuestro catálogo completo de servicios, productos y categorías. Recibe una propuesta con valores, descripciones, plazos y condiciones al instante."
                : "Escolha em nosso catálogo completo de serviços, produtos e categorias. Ao final, você recebe uma proposta com valores, descrição de cada item, prazos e condições, no mesmo instante."}
            </p>
          </div>
          <Link href={`/${lang}/relations`} className="btn shrink-0">← Media Relations</Link>
        </div>
      </section>

      {/* Catalog summary strip */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {groups.map((g) => (
          <div key={g.id} className="rounded-xl border border-line bg-surface p-3">
            <b className="block font-display text-2xl leading-none text-blush">
              {itens.filter((i) => i.grupo === g.id).length}
            </b>
            <span className="mt-1 block text-xs text-mute">{g.nome}</span>
          </div>
        ))}
      </section>

      <section className="section">
        <BudgetBuilder catalog={catalog} lang={lang} email={CONTACT_EMAIL} />
      </section>

      {/* Catalog by group — all services, products and categories */}
      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Catálogo completo</p>
            <h2>{lang === "en" ? "Services, products and categories" : lang === "es" ? "Servicios, productos y categorías" : "Serviços, produtos e categorias"}</h2>
          </div>
          <span className="more">{itens.length} {lang === "en" ? "items" : lang === "es" ? "ítems" : "itens"}</span>
        </div>

        <div className="grid gap-5">
          {groups.map((g) => {
            const list = itens.filter((i) => i.grupo === g.id && i.ativo !== false);
            if (!list.length) return null;
            return (
              <div key={g.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="mb-3">
                  <h3 className="font-display text-2xl font-bold uppercase">{g.nome}</h3>
                  <p className="text-sm text-mute">{g.desc}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((item) => (
                    <div key={item.id} className="rounded-xl border border-line bg-ink/40 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-base font-bold uppercase leading-tight">{item.nome}</p>
                        <b className="shrink-0 font-display text-lg text-blush">
                          {new Intl.NumberFormat(lang === "en" ? "en-US" : "pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(item.preco)}
                          {item.unidade === "mensal" ? "/mês" : ""}
                        </b>
                      </div>
                      <p className="mt-1 text-xs text-mute">{item.desc}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="chip !px-2 !py-0.5 text-[10px]">{item.prazo || "—"}</span>
                        <span className="chip !px-2 !py-0.5 text-[10px]">{item.natureza === "publicidade" ? "publicidade" : "serviço"}</span>
                      </div>
                      {item.entrega?.length > 0 && (
                        <ul className="mt-2 grid gap-0.5">
                          {item.entrega.slice(0, 3).map((e, i) => (
                            <li key={i} className="text-[11px] text-mute">✓ {e}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Conditions */}
      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Transparência</p>
            <h2>{lang === "en" ? "Commercial terms" : lang === "es" ? "Condiciones comerciales" : "Condições comerciais"}</h2>
          </div>
        </div>
        <ul className="grid gap-2">
          {(catalog.condicoes || []).map((cond, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
              <span className="font-display text-base font-bold text-gold">0{i + 1}</span>
              <span className="text-sm text-mute">{cond}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-mute">
          {tr(page?.subtitle)}
        </p>
      </section>
    </>
  );
}
