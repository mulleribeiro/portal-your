import Link from "next/link";
import { Editable } from "@/components/EditProvider";
import { EditableImage } from "@/components/EditableImage";
import { Kin, MediaTile } from "@/components/ui";
import { ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  return { title: mlPick(site, pageBySlug(site, "news")?.title, lang) };
}

export default async function NewsPage({
  params, searchParams,
}: { params: Promise<{ lang: string }>; searchParams: Promise<{ cat?: string }> }) {
  const { lang } = await params;
  const { cat } = await searchParams;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "news");
  const all = itemsOfType(site, "article");
  const categories = [...new Set(all.map((a) => a.category).filter(Boolean))] as string[];
  const list = cat ? all.filter((a) => a.category === cat) : all;

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated(list.slice(0, 24), lang, site.defaultLang);
  }

  const lead = list.find((a) => a.featured) || list[0];
  const rest = list.filter((a) => a.id !== lead?.id);

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase">
          <Kin text={tr(page?.title)} />
        </h1>
        <p className="mt-3 max-w-[60ch] text-lg text-mute">
          <Editable target={{ entity: "page", id: "news", field: "subtitle", label: "Subtítulo News" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/${lang}/news`} className="chip" data-on={!cat}>{tr(site.ui["label.allCategories"])}</Link>
        {categories.map((c) => (
          <Link key={c} href={`/${lang}/news?cat=${encodeURIComponent(c)}`} className="chip" data-on={cat === c}>{c}</Link>
        ))}
      </div>

      {lead && (
        <Link href={`/${lang}/article/${lead.id.replace(/^article-/, "")}`} className="hero mt-8 block">
          <div className="hero-big" style={{ minHeight: "460px" }}>
            <EditableImage target={{ entity: "item", id: lead.id, field: "image", label: "Imagem de destaque" }} src={lead.image} />
            <p className="eyebrow mb-2">{lead.category} · {(lead.meta as { min?: number })?.min || 3} {tr(site.ui["label.minRead"])}</p>
            <h2 className="font-display text-[clamp(30px,5vw,58px)] font-extrabold uppercase">
              <Editable target={{ entity: "item", id: lead.id, field: "title", label: "Título" }} value={tr(lead.title)} translations={lead.title} />
            </h2>
            <p>
              <Editable target={{ entity: "item", id: lead.id, field: "dek", label: "Linha fina" }} value={tr(lead.dek)} translations={lead.dek ?? undefined} multiline />
            </p>
            <span className="btn btn-pri w-fit">{tr(site.ui["action.readNow"])}</span>
          </div>
        </Link>
      )}

      <section className="section">
        <div className="grid-cards">
          {rest.map((a) => (
            <Link key={a.id} href={`/${lang}/article/${a.id.replace(/^article-/, "")}`} className="card">
              <MediaTile id={a.id} src={a.image} word={a.category || ""} ratio="r34" edit={{ entity: "item", id: a.id, field: "image", label: "Imagem da matéria" }} />
              <p className="tag mt-1">{a.category} · {(a.meta as { min?: number })?.min || 3} {tr(site.ui["label.minRead"])}</p>
              <h3>
                <Editable target={{ entity: "item", id: a.id, field: "title", label: "Título" }} value={tr(a.title)} translations={a.title} />
              </h3>
              <p className="line-clamp-3">
                <Editable target={{ entity: "item", id: a.id, field: "dek", label: "Linha fina" }} value={tr(a.dek)} translations={a.dek ?? undefined} multiline />
              </p>
            </Link>
          ))}
        </div>
        {rest.length === 0 && <p className="text-mute">{tr(site.ui["label.noResults"])}</p>}
      </section>
    </>
  );
}
