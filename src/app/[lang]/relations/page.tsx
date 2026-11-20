import Link from "next/link";
import { Editable } from "@/components/EditProvider";
import { PlanSimulator } from "@/components/PlanSimulator";
import {
  AudienceInfographic, Ecosystem, NetworkInfographic, PlansStrip, ProcessTimeline,
  RelationsHero, type Step, type Vertical,
} from "@/components/RelationsVisual";
import { loadSite, mlPick, pageBySlug } from "@/lib/data";

type RelOpt = { id: string; name: Record<string, string>; desc?: Record<string, string>; price: number; reach: number; formats: number };
type RelStep = { step: string; title: Record<string, string>; desc: Record<string, string>; deliverable: Record<string, string> };
type CatGroup = { id: string; nome: string; desc: string };
type CatItem = { id: string; grupo: string; nome: string; preco: number; ativo?: boolean };

const money = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(n);

const VERTICALS: Record<string, Vertical[]> = {
  pt: [
    { n: "01", tag: "Editorial", name: "YOUR Magazine", desc: "Revista própria com marca premium, venda de capas e publieditoriais.", img: 32507198 },
    { n: "02", tag: "Assessoria", name: "YOUR Press", desc: "Assessoria de imprensa completa, relacionamento com jornalistas, pautas e clipping.", img: 6950231 },
    { n: "03", tag: "Distribuição", name: "YOUR Newswire", desc: "Disparo de releases para base segmentada, em conformidade com LGPD e GDPR.", img: 15920138 },
    { n: "04", tag: "Conteúdo", name: "YOUR Content Studio", desc: "Produção de textos, fotos, vídeos e branded content.", img: 12328334 },
    { n: "05", tag: "Rede", name: "YOUR Media Network", desc: "Rede de veículos parceiros no Brasil, Europa e Estados Unidos.", img: 10464466 },
  ],
  en: [
    { n: "01", tag: "Editorial", name: "YOUR Magazine", desc: "Own premium magazine with covers and advertorial formats.", img: 32507198 },
    { n: "02", tag: "PR", name: "YOUR Press", desc: "Full press office, journalist relations, pitch building and clipping.", img: 6950231 },
    { n: "03", tag: "Distribution", name: "YOUR Newswire", desc: "Releases distributed to a segmented database, LGPD and GDPR compliant.", img: 15920138 },
    { n: "04", tag: "Content", name: "YOUR Content Studio", desc: "Text, photo, video and branded content production.", img: 12328334 },
    { n: "05", tag: "Network", name: "YOUR Media Network", desc: "Partner outlets across Brazil, Europe and the United States.", img: 10464466 },
  ],
  es: [
    { n: "01", tag: "Editorial", name: "YOUR Magazine", desc: "Revista propia con marca premium, venta de portadas y publirreportajes.", img: 32507198 },
    { n: "02", tag: "Asesoría", name: "YOUR Press", desc: "Relaciones públicas completas, relación con periodistas, pautas y clipping.", img: 6950231 },
    { n: "03", tag: "Distribución", name: "YOUR Newswire", desc: "Distribución de comunicados a base segmentada conforme LGPD y GDPR.", img: 15920138 },
    { n: "04", tag: "Contenido", name: "YOUR Content Studio", desc: "Producción de textos, fotos, vídeos y branded content.", img: 12328334 },
    { n: "05", tag: "Red", name: "YOUR Media Network", desc: "Red de medios socios en Brasil, Europa y Estados Unidos.", img: 10464466 },
  ],
};

const AUDIENCES: Record<string, { tag: string; name: string; desc: string; icon: string }[]> = {
  pt: [
    { tag: "Marcas", name: "Marcas & Empresas", desc: "Visibilidade estratégica para consolidar presença de mercado e autoridade de marca.", icon: "◆" },
    { tag: "Saúde", name: "Médicos & Profissionais", desc: "Reputação médica com ética profissional e relacionamento com a imprensa especializada.", icon: "✚" },
    { tag: "Liderança", name: "Empresários & Founders", desc: "Posicionamento de liderança para quem quer ser referência em seu setor.", icon: "▲" },
    { tag: "Autoridade", name: "Especialistas & Consultores", desc: "Autoridade editorial para quem vive de reputação: advogados, consultores, autores.", icon: "★" },
  ],
  en: [
    { tag: "Brands", name: "Brands & Companies", desc: "Strategic visibility for companies consolidating market presence and brand authority.", icon: "◆" },
    { tag: "Health", name: "Doctors & Health Pros", desc: "Medical reputation with professional ethics and specialized press relations.", icon: "✚" },
    { tag: "Leadership", name: "Founders & Executives", desc: "Leadership positioning for entrepreneurs who want to become sector benchmarks.", icon: "▲" },
    { tag: "Authority", name: "Experts & Consultants", desc: "Editorial authority for consultants, lawyers and authors who live off reputation.", icon: "★" },
  ],
  es: [
    { tag: "Marcas", name: "Marcas & Empresas", desc: "Visibilidad estratégica para consolidar presencia de mercado y autoridad de marca.", icon: "◆" },
    { tag: "Salud", name: "Médicos & Profesionales", desc: "Reputación médica con ética profesional y relación con la prensa especializada.", icon: "✚" },
    { tag: "Liderazgo", name: "Empresarios & Founders", desc: "Posicionamiento de liderazgo para quien quiere ser referente en su sector.", icon: "▲" },
    { tag: "Autoridad", name: "Especialistas & Consultores", desc: "Autoridad editorial para quien vive de su reputación: abogados, consultores, autores.", icon: "★" },
  ],
};

export default async function RelationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "relations");
  const s = site.settings;
  const relationImages = (s.images || {}) as Record<string, { url?: string }>;

  const rawOptions = (s.relationsOptions as RelOpt[] | undefined) || [];
  const options = rawOptions.map((o) => ({
    id: o.id,
    label: tr(o.name),
    desc: tr(o.desc),
    price: Number(o.price) || 0,
    reach: Number(o.reach) || 0,
    formats: Number(o.formats) || 1,
  }));

  const rawSteps = (s.relationsSteps as RelStep[] | undefined) || [];
  const steps: Step[] = rawSteps.map((st) => ({
    step: st.step,
    title: tr(st.title),
    desc: tr(st.desc),
    deliverable: tr(st.deliverable),
  }));

  const network = ((s.network as { value: string; label: Record<string, string> }[]) || [])
    .map((x) => ({ value: x.value, label: tr(x.label) }));

  const catalog = s.catalog as { grupos?: CatGroup[]; itens?: CatItem[] } | undefined;
  const grupos = catalog?.grupos || [];
  const itens = (catalog?.itens || []).filter((i) => i.ativo !== false);

  return (
    <>
      <div className="pt-8">
        <RelationsHero
          lang={lang}
          kicker={tr(page?.kicker) || "Media Relations"}
          title={tr(page?.title)}
          subtitle={tr(page?.subtitle) || ""}
          ctas={[
            { href: `/${lang}/budget`, label: lang === "en" ? "＋ Build your quote" : lang === "es" ? "＋ Armar presupuesto" : "＋ Montar meu orçamento", tone: "gold" },
            { href: `/${lang}/press`, label: lang === "en" ? "Press room" : lang === "es" ? "Sala de prensa" : "Sala de imprensa" },
            { href: `/${lang}/media-kit`, label: lang === "en" ? "Media kit" : lang === "es" ? "Media kit" : "Mídia kit" },
          ]}
          image={relationImages.relationsHero?.url}
          imageTarget={{ entity: "settings", id: "portal", field: "images.relationsHero.url", label: "Banner principal Media Relations" }}
        />
      </div>

      <NetworkInfographic
        network={network}
        lang={lang}
        copy={{
          sub: lang === "en" ? "Authority multiplied" : lang === "es" ? "Autoridad multiplicada" : "Autoridade multiplicada",
          title: lang === "en" ? "Reach, in numbers" : lang === "es" ? "Alcance, en cifras" : "Alcance, em números",
        }}
      />

      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">O ecossistema</p>
            <h2>{lang === "en" ? "Five verticals. One ecosystem." : lang === "es" ? "Cinco verticales. Un ecosistema." : "Cinco verticais. Um ecossistema."}</h2>
          </div>
          <Link href={`/${lang}/budget`} className="more">
            {lang === "en" ? "See the full catalogue →" : lang === "es" ? "Ver catálogo completo →" : "Ver catálogo completo →"}
          </Link>
        </div>
        <Ecosystem verticals={(VERTICALS[lang] || VERTICALS.pt).map((vertical, index) => {
          const key = `relationsVertical${index + 1}`;
          return {
            ...vertical,
            image: relationImages[key]?.url,
            editTarget: { entity: "settings" as const, id: "portal", field: `images.${key}.url`, label: `Foto ${vertical.name}` },
          };
        })} />
      </section>

      <ProcessTimeline
        steps={steps.length ? steps : []}
        img={relationImages.relationsProcess?.url || 35755252}
        imageTarget={{ entity: "settings", id: "portal", field: "images.relationsProcess.url", label: "Foto do processo Media Relations" }}
      />

      <AudienceInfographic
        audiences={AUDIENCES[lang] || AUDIENCES.pt}
        img={relationImages.relationsAudience?.url || 33317197}
        imageTarget={{ entity: "settings", id: "portal", field: "images.relationsAudience.url", label: "Foto da audiência Media Relations" }}
      />

      <PlansStrip lang={lang} budgetHref={`/${lang}/budget`} pressHref={`/${lang}/press`} />

      {/* Editable strategy notes — kept short */}
      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Sob medida</p>
            <h2>Simulador de plano</h2>
          </div>
          <span className="more">{itens.length} {lang === "en" ? "catalog items" : "itens no catálogo"}</span>
        </div>
        <PlanSimulator
          lang={lang}
          options={options}
          labels={{
            title: tr(site.ui["label.simulator"]),
            subtitle:
              lang === "pt"
                ? "Selecione as frentes para calcular investimento e alcance estimado. Para a tabela completa de serviços, produtos e categorias, use o construtor de orçamento."
                : lang === "es"
                ? "Selecciona los formatos para calcular la inversión y el alcance estimado."
                : "Select the deliverables to calculate estimated investment and reach.",
            total: lang === "pt" ? "investimento estimado" : lang === "es" ? "inversión estimada" : "estimated investment",
            reach: lang === "pt" ? "alcance estimado" : lang === "es" ? "alcance estimado" : "estimated reach",
            formats: lang === "pt" ? "formatos entregues" : lang === "es" ? "formatos entregados" : "delivered formats",
            send: lang === "pt" ? "Solicitar proposta personalizada" : lang === "es" ? "Solicitar propuesta" : "Request custom proposal",
            sent: lang === "pt" ? "Recebido! Nossa equipe responde em até 1 dia útil." : lang === "es" ? "¡Recibido! Respondemos en 1 día hábil." : "Got it! We reply within one business day.",
            name: lang === "pt" ? "Seu nome" : lang === "es" ? "Tu nombre" : "Your name",
            email: "E-mail",
            brand: lang === "pt" ? "Marca / empresa" : lang === "es" ? "Marca / empresa" : "Brand / company",
          }}
        />
        <div className="mt-4">
          <Link href={`/${lang}/budget`} className="btn btn-gold">
            {lang === "en" ? "Open the full quote builder →" : lang === "es" ? "Abrir constructor de presupuesto →" : "Abrir construtor de orçamento completo →"}
          </Link>
        </div>
      </section>

      {/* Catalogue preview — compact chips */}
      {grupos.length > 0 && (
        <section className="section">
          <div className="sh">
            <div>
              <p className="eyebrow mb-2">Serviços, produtos e categorias</p>
              <h2>{lang === "en" ? "Full catalogue" : lang === "es" ? "Catálogo completo" : "Catálogo completo"}</h2>
            </div>
            <Link href={`/${lang}/budget`} className="more">{itens.length} {lang === "en" ? "items" : "itens"} →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {grupos.map((g) => {
              const list = itens.filter((i) => i.grupo === g.id);
              if (!list.length) return null;
              const min = Math.min(...list.map((i) => Number(i.preco) || 0));
              return (
                <Link key={g.id} href={`/${lang}/budget`} className="rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-1 hover:border-blush">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold uppercase leading-tight">{g.nome}</h3>
                    <b className="shrink-0 font-display text-base text-blush">{money(min, lang)}+</b>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="chip !px-2 !py-0.5 text-[10px]">{list.length} {lang === "en" ? "items" : "itens"}</span>
                    <span className="chip !px-2 !py-0.5 text-[10px]">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-mute">
            <Editable target={{ entity: "page", id: "relations", field: "subtitle", label: "Nota final" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
          </p>
        </section>
      )}
    </>
  );
}
