import Link from "next/link";
import { Editable } from "@/components/EditProvider";
import { MediaTile, Kin } from "@/components/ui";
import { ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  return { title: mlPick(site, pageBySlug(site, "columnists")?.title, lang) };
}

export default async function ColumnistsPage({
  params, searchParams,
}: { params: Promise<{ lang: string }>; searchParams: Promise<{ area?: string }> }) {
  const { lang } = await params;
  const { area } = await searchParams;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "columnists");
  const columnists = itemsOfType(site, "columnist");
  const partnerBrands = itemsOfType(site, "brand");
  const partnerStories = itemsOfType(site, "article");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated([...columnists, ...partnerBrands, ...partnerStories.slice(0, 40)], lang, site.defaultLang);
  }

  const areas = [...new Set(columnists.map((c) => String((c.meta as { area?: string })?.area || c.category || "")).filter(Boolean))];
  const list = area ? columnists.filter((c) => String((c.meta as { area?: string })?.area || c.category) === area) : columnists;

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase"><Kin text={tr(page?.title)} /></h1>
        <p className="mt-3 max-w-[62ch] text-lg text-mute">
          <Editable target={{ entity: "page", id: "columnists", field: "subtitle", label: "Subtítulo Nosso Time" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/${lang}/columnists`} className="chip" data-on={!area}>Todos ({columnists.length})</Link>
        {areas.map((a) => (
          <Link key={a} href={`/${lang}/columnists?area=${encodeURIComponent(a)}`} className="chip" data-on={area === a}>
            {a} ({columnists.filter((c) => String((c.meta as { area?: string })?.area || c.category) === a).length})
          </Link>
        ))}
      </div>

      <section className="section">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const meta = (c.meta || {}) as { area?: string; role?: string; reg?: string; instagram?: string; past?: { t: string; u: string }[] };
            const slug = c.id.replace(/^col-/, "");
            const columns = meta.past || [];
            return (
              <article key={c.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
                <Link href={`/${lang}/team/${slug}`} className="grid grid-cols-[104px_1fr] items-start gap-4">
                  <MediaTile id={c.id} src={c.image} ratio="r34" edit={{ entity: "item", id: c.id, field: "image", label: "Foto do colunista" }} />
                  <div className="min-w-0">
                    <p className="tag">{meta.area || c.category}</p>
                    <h3 className="mt-1 font-display text-2xl font-bold uppercase leading-tight hover:text-blush">
                      <Editable target={{ entity: "item", id: c.id, field: "title", label: "Nome do colunista" }} value={tr(c.title)} translations={c.title} />
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-mute">{tr(c.dek)}</p>
                    {meta.reg ? <p className="mt-1 font-mono text-[11px] text-gold">{meta.reg}</p> : null}
                  </div>
                </Link>

                {columns.length > 0 && (
                  <div className="rounded-xl border border-line bg-ink/40 p-3">
                    <p className="font-display text-[10px] font-semibold uppercase tracking-[.18em] text-gold">
                      Últimas matérias
                    </p>
                    <ul className="mt-1.5 grid gap-1">
                      {columns.slice(0, 3).map((col, i) => (
                        <li key={i} className="truncate text-sm">
                          <a href={col.u} target="_blank" rel="noreferrer" className="hover:text-blush">→ {col.t}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <Link href={`/${lang}/team/${slug}`} className="btn btn-pri">Ver perfil completo</Link>
                  {meta.instagram ? (
                    <a href={meta.instagram} target="_blank" rel="noreferrer" className="chip">Instagram ↗</a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {partnerBrands.length > 0 ? (
        <section className="section">
          <div className="sh">
            <div>
              <p className="eyebrow mb-2">Conteúdo em parceria</p>
              <h2>{lang === "en" ? "Partner brands & collaborative stories" : lang === "es" ? "Marcas socias y contenido colaborativo" : "Marcas parceiras e conteúdo colaborativo"}</h2>
              <p className="mt-2 max-w-[62ch] text-sm text-mute">{lang === "en" ? "Brands that work with YOUR to create and publish stories." : lang === "es" ? "Marcas que crean y publican historias junto a YOUR." : "Marcas que produzem conteúdo e publicam matérias em parceria com a YOUR."}</p>
            </div>
          </div>
          <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partnerBrands.map((brand) => {
              const href = brand.url || `/${lang}/media-kit?brand=${encodeURIComponent(brand.id)}`;
              const external = /^https?:\/\//i.test(href);
              const stories = partnerStories.filter((story) => String((story.meta as { brandId?: unknown } | null)?.brandId || "") === brand.id).slice(0, 2);
              return (
                <article key={brand.id} className="min-w-0 rounded-2xl border border-line bg-surface p-4">
                  <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="block">
                    <MediaTile id={brand.id} src={brand.image} ratio="r43" edit={{ entity: "item", id: brand.id, field: "image", label: `Imagem de ${tr(brand.title)}` }} />
                    <h3 className="mt-3 font-display text-xl font-bold uppercase">{tr(brand.title)}</h3>
                    <p className="mt-1 text-sm text-mute">{tr(brand.dek)}</p>
                  </a>
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="tag">{lang === "en" ? "Stories with this partner" : lang === "es" ? "Contenido de la marca" : "Matérias da marca"}</p>
                    {stories.length ? (
                      <ul className="mt-2 grid gap-2">
                        {stories.map((story) => (
                          <li key={story.id}>
                            <Link href={`/${lang}/article/${story.id.replace(/^article-/, "")}`} className="break-words text-sm hover:text-blush">→ {tr(story.title)}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="mt-1 text-xs text-mute">{lang === "en" ? "Partner content will appear here." : lang === "es" ? "El contenido asociado aparecerá aquí." : "As matérias associadas aparecerão aqui."}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
