import Link from "next/link";
import { notFound } from "next/navigation";
import { Editable } from "@/components/EditProvider";
import { Kin, MediaTile, RichBody } from "@/components/ui";
import { ensureItemFullTranslated, itemsOfType, loadSite, mlPick } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const site = await loadSite();
  const decoded = decodeURIComponent(slug);
  const item = itemsOfType(site, "article").find((a) => a.id === `article-${decoded}` || a.id === decoded);
  if (!item) return { title: "Matéria" };
  return {
    title: mlPick(site, item.title, lang),
    description: mlPick(site, item.dek, lang),
    openGraph: { title: mlPick(site, item.title, lang), images: item.image ? [item.image] : [] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const decoded = decodeURIComponent(slug);
  const all = itemsOfType(site, "article");
  const found = all.find((a) => a.id === `article-${decoded}` || a.id === decoded);
  if (!found) notFound();

  const item = await ensureItemFullTranslated(found, lang, site.defaultLang);

  const columnists = itemsOfType(site, "columnist");
  const author = columnists.find((c) => c.id === "col-muller-ribeiro") || columnists[0];
  const related = all.filter((a) => a.id !== item.id && (a.category === item.category || a.featured)).slice(0, 3);
  const body = tr(item.body) || `${tr(item.dek)}\n\n## ${tr(site.ui["label.latest"])}\n${tr(item.dek)}`;
  const shareText = encodeURIComponent(tr(item.title));

  return (
    <article className="pt-8">
      <Link href={`/${lang}/news`} className="more">← {tr(pageTitle(site, "news", lang))}</Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="eyebrow mb-3">{item.category} · {(item.meta as { min?: number })?.min || 3} {tr(site.ui["label.minRead"])}</p>
          <h1 className="font-display text-[clamp(34px,5.6vw,74px)] font-extrabold uppercase">
            <Editable target={{ entity: "item", id: item.id, field: "title", label: "Título da matéria" }} value={tr(item.title)} translations={item.title}>
              <Kin text={tr(item.title)} />
            </Editable>
          </h1>
          <p className="mt-4 max-w-[62ch] text-lg text-mute">
            <Editable target={{ entity: "item", id: item.id, field: "dek", label: "Linha fina" }} value={tr(item.dek)} translations={item.dek ?? undefined} multiline />
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {site.langs.map((code) => (
              <Link key={code} href={`/${code}/article/${slug}`} className="chip" data-on={code === lang}>{code.toUpperCase()}</Link>
            ))}
            <a className="chip" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">{tr(site.ui["action.share"])}</a>
          </div>
        </div>
        <MediaTile
          id={item.id}
          src={item.image}
          word={item.category || ""}
          ratio="r34"
          className="min-h-[320px]"
          edit={{ entity: "item", id: item.id, field: "image", label: "Imagem da matéria" }}
        />
      </div>

      <div className="paper mt-10">
        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-[#00000018] pb-5">
          {author?.image && <img src={author.image} alt="" className="h-12 w-12 rounded-full object-cover" />}
          <div>
            <p className="label !mb-0 !text-[#7c5a66]">{tr(site.ui["label.editedBy"])}</p>
            <b className="font-display text-lg uppercase">{tr(author?.title)}</b>
            <span className="ml-2 text-sm text-[#7c5a66]">{tr(author?.dek)}</span>
          </div>
        </div>
        <Editable
          as="div"
          target={{ entity: "item", id: item.id, field: "body", label: "Corpo da matéria" }}
          value={body}
          translations={item.body ?? undefined}
          multiline
        >
          <RichBody text={body} light />
        </Editable>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="sh"><h2>{tr(site.ui["label.latest"])}</h2><Link href={`/${lang}/news`} className="more">{tr(site.ui["action.seeAll"])} →</Link></div>
          <div className="grid-cards">
            {related.map((a) => (
              <Link key={a.id} href={`/${lang}/article/${a.id.replace(/^article-/, "")}`} className="card">
                <MediaTile id={a.id} src={a.image} word={a.category || ""} ratio="r43" edit={{ entity: "item", id: a.id, field: "image", label: "Imagem" }} />
                <p className="tag mt-1">{a.category}</p>
                <h3>{tr(a.title)}</h3>
                <p className="line-clamp-3">{tr(a.dek)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function pageTitle(site: Awaited<ReturnType<typeof loadSite>>, slug: string, lang: string) {
  return site.pages.find((p) => p.slug === slug)?.title as Record<string, string> | undefined ?? { [lang]: slug };
}
