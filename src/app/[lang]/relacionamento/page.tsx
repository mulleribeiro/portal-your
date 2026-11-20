import Link from "next/link";
import { Editable } from "@/components/EditProvider";
import { RelacionamentoClient } from "@/components/RelacionamentoClient";
import { FaqSection } from "@/components/FaqSection";
import { Kin, MediaTile } from "@/components/ui";
import { itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";
import { CONTACT_EMAIL } from "@/lib/contact";

export async function generateMetadata() {
  return {
    title: "Relacionamento & Contatos · YOUR",
    description: "Dúvidas, sugestões, elogios, pautas e parcerias. Entre em contato com a YOUR Magazine.",
  };
}

export default async function RelacionamentoPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "relacionamento");
  const s = site.settings;
  const videos = itemsOfType(site, "video").slice(0, 3);

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page?.kicker) || "Relacionamento"}</p>
        <h1 className="font-display text-[clamp(38px,7vw,84px)] font-extrabold uppercase">
          <Editable
            target={{ entity: "page", id: "relacionamento", field: "title", label: "Título Relacionamento" }}
            value={tr(page?.title) || "Dúvidas, sugestões, elogios. Vamos conversar?"}
            translations={page?.title}
          >
            <Kin text={tr(page?.title) || "Relacionamento & Contatos"} />
          </Editable>
        </h1>
        <p className="mt-3 max-w-[64ch] text-lg text-mute">
          <Editable
            target={{ entity: "page", id: "relacionamento", field: "subtitle", label: "Subtítulo Relacionamento" }}
            value={tr(page?.subtitle)}
            translations={page?.subtitle ?? undefined}
            multiline
          />
        </p>
      </section>

      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Canais oficiais</p>
            <h2>Escritórios & Envio de produtos</h2>
          </div>
          <a className="more" href="/api/media-kit-pdf">
            {lang === "en" ? "↓ Download media kit PDF" : lang === "es" ? "↓ Descargar media kit PDF" : "↓ Baixar mídia kit PDF"}
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="tag">Nova York City</p>
            <h3 className="mt-2 font-display text-2xl font-bold uppercase">Escritório EUA</h3>
            <p className="mt-3 text-mute">1740 Broadway, 15th Floor,<br />New York, 10019, EUA</p>
            <a className="btn mt-4 inline-flex" href="https://www.google.com/maps/search/?api=1&query=1740+Broadway+15th+Floor+New+York+10019" target="_blank" rel="noreferrer">
              Ver no mapa ↗
            </a>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="tag">Brasil</p>
            <h3 className="mt-2 font-display text-2xl font-bold uppercase">Escritório & Recebimento</h3>
            <p className="mt-3 text-mute">
              R. João da Silva Araújo, 8 — Sala 306<br />Centro, Caratinga, MG, 35300-238
            </p>
            <a className="btn mt-4 inline-flex" href="https://www.google.com/maps/search/?api=1&query=Rua+Joao+da+Silva+Araujo+8+Caratinga+MG" target="_blank" rel="noreferrer">
              Ver no mapa ↗
            </a>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-wine p-6">
          <p className="eyebrow mb-2">Envio de produtos</p>
          <h3 className="font-display text-2xl font-bold uppercase">
            {lang === "en" ? "Where to send products of the brand I represent" : lang === "es" ? "Dónde enviar productos de la marca que represento" : "Para qual endereço posso enviar produtos da marca que represento?"}
          </h3>
          <p className="mt-3 max-w-[70ch] text-mute">
            {lang === "en"
              ? "You can send products to our office in Brazil: R. João da Silva Araújo, 8 — Sala 306, Centro, Caratinga, MG, 35300-238."
              : lang === "es"
              ? "Puedes enviar productos a nuestra oficina en Brasil: R. João da Silva Araújo, 8 — Sala 306, Centro, Caratinga, MG, 35300-238."
              : "Você pode enviar produtos para o nosso escritório no Brasil: R. João da Silva Araújo, 8 — Sala 306, Centro, Caratinga, MG, 35300-238."}
          </p>
          <p className="mt-3 max-w-[70ch] text-sm italic text-mute">
            <b className="not-italic text-paper">
              {lang === "en" ? "Note:" : lang === "es" ? "Observación:" : "Observação:"}
            </b>{" "}
            {lang === "en"
              ? "if you ship via the postal service, please notify us by e-mail and include the tracking code."
              : lang === "es"
              ? "si envías por correo postal, por favor avísanos por correo e incluye el código de rastreo."
              : "se for enviar via Correios, por favor, nos notifique por e-mail e inclua o código de rastreio."}
            {" "}
            <a className="not-italic underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      </section>

      <FaqSection lang={lang} email={CONTACT_EMAIL} />

      <section className="section" id="formulario-contato">
        <RelacionamentoClient lang={lang} email={CONTACT_EMAIL} />
      </section>

      {videos.length > 0 && (
        <section className="section">
          <div className="sh">
            <div>
              <p className="eyebrow mb-2">YOUR Play</p>
              <h2>YOUR Insights & Entrevistas</h2>
            </div>
            <Link href={`/${lang}/play`} className="more">Ver todos no YOUR Play →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {videos.map((v) => (
              <Link key={v.id} href={`/${lang}/play`} className="card">
                <MediaTile id={v.id} src={v.image} ratio="r169" />
                <p className="tag mt-1">{(v.meta as { serie?: string })?.serie}</p>
                <h3>{tr(v.title)}</h3>
                <p className="line-clamp-2">{tr(v.dek)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
