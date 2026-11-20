import { Editable } from "@/components/EditProvider";
import { EditableImage } from "@/components/EditableImage";
import { MediaKit, type MKCopy } from "@/components/MediaKit";
import { Kin } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/contact";
import { itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

const COPY: Record<string, MKCopy> = {
  pt: {
    kicker: "Mídia kit 2026", heroTitle: "Audiência que lê até o fim", heroText: "Revista digital de luxo com leitura profunda, público A/B e presença no Brasil e nos EUA.",
    ctaBuy: "Montar proposta", ctaMail: "Falar com o comercial", audience: "Quem lê a YOUR", women: "do público é feminino",
    ages: "Faixa etária", channels: "Onde a YOUR alcança você", channelsUnit: "Visualizações por mês, em mil",
    formats: "Monte seu plano", formatsSub: "Escolha os formatos e a duração — o total atualiza na hora.", duration: "Duração",
    months: "mês(es)", total: "Investimento", reach: "Alcance estimado", request: "Solicitar proposta",
    name: "Seu nome", email: "E-mail", brand: "Marca / cliente", sent: "Recebido! Respondemos em 1 dia útil.",
    error: "Erro — tente novamente.", brands: "Marcas que fazem parte da história",
    contact: "Vamos construir a sua pauta?", contactSub: "Fale com o comercial e receba uma proposta em um dia útil.",
  },
  en: {
    kicker: "Media kit 2026", heroTitle: "An audience that reads to the end", heroText: "A luxury digital magazine with deep reading, an A/B audience and presence in Brazil and the US.",
    ctaBuy: "Build a proposal", ctaMail: "Talk to sales", audience: "Who reads YOUR", women: "of the audience is female",
    ages: "Age range", channels: "Where YOUR reaches you", channelsUnit: "Monthly views, in thousands",
    formats: "Build your plan", formatsSub: "Pick formats and duration — the total updates instantly.", duration: "Duration",
    months: "month(s)", total: "Investment", reach: "Estimated reach", request: "Request proposal",
    name: "Your name", email: "Email", brand: "Brand / client", sent: "Got it! We reply within one business day.",
    error: "Error — please try again.", brands: "Brands that are part of the story",
    contact: "Shall we build your story?", contactSub: "Talk to sales and get a proposal within one business day.",
  },
  es: {
    kicker: "Media kit 2026", heroTitle: "Una audiencia que lee hasta el final", heroText: "Revista digital de lujo con lectura profunda, público A/B y presencia en Brasil y EE. UU.",
    ctaBuy: "Armar propuesta", ctaMail: "Hablar con comercial", audience: "Quién lee YOUR", women: "del público es femenino",
    ages: "Rango de edad", channels: "Dónde YOUR te alcanza", channelsUnit: "Visualizaciones mensuales, en miles",
    formats: "Arma tu plan", formatsSub: "Elige formatos y duración — el total se actualiza al instante.", duration: "Duración",
    months: "mes(es)", total: "Inversión", reach: "Alcance estimado", request: "Solicitar propuesta",
    name: "Tu nombre", email: "Correo", brand: "Marca / cliente", sent: "¡Recibido! Respondemos en 1 día hábil.",
    error: "Error — intenta de nuevo.", brands: "Marcas que forman parte de la historia",
    contact: "¿Construimos tu tema?", contactSub: "Habla con comercial y recibe una propuesta en un día hábil.",
  },
};

export default async function MediaKitPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "media-kit");
  const s = site.settings;
  const copy = COPY[lang] || COPY.pt;

  const stats = ((s.stats as { value: string; label: Record<string, string> }[]) || []).map((x) => ({ value: x.value, label: tr(x.label) }));
  const audience = ((s.audience as { value: string; label: Record<string, string> }[]) || []).map((x) => ({ value: x.value, label: tr(x.label) }));
  const ages = ((s.audienceBreakdown as { label: Record<string, string>; value: number }[]) || []).map((x) => ({ label: tr(x.label), value: Number(x.value) }));
  const channels = ((s.channels as { label: Record<string, string>; value: number }[]) || []).map((x) => ({ label: tr(x.label), value: Number(x.value) }));
  const formats = ((s.formats as { id: string; name: Record<string, string>; desc: Record<string, string>; price: number; reach: number }[]) || [])
    .map((f) => ({ id: f.id, name: tr(f.name), desc: tr(f.desc), price: Number(f.price), reach: Number(f.reach) }));
  const brands = itemsOfType(site, "brand").map((b) => ({ id: b.id, title: tr(b.title), image: b.image }));
  const heroImage = (s.images as Record<string, { url?: string }> | undefined)?.mediaKitHero?.url || "";

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase"><Kin text={tr(page?.title)} /></h1>
        <p className="mt-3 max-w-[62ch] text-lg text-mute">
          <Editable target={{ entity: "page", id: "media-kit", field: "subtitle", label: "Subtítulo Mídia kit" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
        </p>
      </section>

      <div className="md r169 mt-8 max-h-[320px] bg-wine">
        <EditableImage target={{ entity: "settings", id: "portal", field: "images.mediaKitHero.url", label: "Banner do mídia kit" }} src={heroImage || null} alt="" imgClass="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/api/media-kit-pdf" download className="btn btn-gold">
          {lang === "en" ? "↓ Download media kit PDF" : lang === "es" ? "↓ Descargar media kit PDF" : "↓ Baixar mídia kit PDF"}
        </a>
        <a href={`/${lang}/budget`} className="btn btn-pri">
          {lang === "en" ? "＋ Build your quote" : lang === "es" ? "＋ Armar presupuesto" : "＋ Montar meu orçamento"}
        </a>
      </div>

      <div className="mt-10">
        <MediaKit
          lang={lang}
          email={CONTACT_EMAIL}
          stats={stats}
          audience={audience}
          ages={ages}
          women={Number(s.genderWomen || 0)}
          channels={channels}
          formats={formats}
          brands={brands}
          copy={copy}
        />
      </div>
    </>
  );
}
