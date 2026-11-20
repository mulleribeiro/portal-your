import Link from "next/link";
import type { ItemRow } from "@/db/schema";
import { Editable } from "@/components/EditProvider";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Kin, MediaTile, SectionHead } from "@/components/ui";
import { ensureItemsTranslated, hrefForItem, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

type Lk = { label: Record<string, string>; href: string };

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const s = site.settings;
  const links = (s.links || {}) as Record<string, Lk>;
  const images = (s.images || {}) as Record<string, { label?: string; url?: string }>;

  const hrefOf = (h?: string) => (!h || h === "/" ? `/${lang}` : h.startsWith("http") ? h : `/${lang}${h}`);
  const itemHref = (item: ItemRow) => `/${lang}${hrefForItem(item)}`;
  const linkText = (key: string, fallback: string) => tr(links[key]?.label) || fallback;

  const editions = itemsOfType(site, "edition").slice(0, 5);
  const covers = itemsOfType(site, "cover").slice(0, 6);
  const news = itemsOfType(site, "article").slice(0, 4);
  const videos = itemsOfType(site, "video").slice(0, 6);
  const hotels = itemsOfType(site, "hotel").slice(0, 2);
  const dining = itemsOfType(site, "dining").slice(0, 2);
  const columnists = itemsOfType(site, "columnist");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated([...editions, ...covers, ...news, ...hotels, ...dining], lang, site.defaultLang);
  }

  const editionsPage = pageBySlug(site, "editions");
  const coversPage = pageBySlug(site, "covers");
  const newsPage = pageBySlug(site, "news");
  const playPage = pageBySlug(site, "play");
  const hotelsPage = pageBySlug(site, "hotels");
  const diningPage = pageBySlug(site, "fine-dining");
  const columnistsPage = pageBySlug(site, "columnists");
  const relationsPage = pageBySlug(site, "relations");
  const mediaPage = pageBySlug(site, "media-kit");

  const latestEdition = editions[0];
  const latestCover = covers[0];
  const latestCoverHref = latestCover ? (latestCover.url || itemHref(latestCover)) : "";
  const heroImage = images.heroBackground?.url || latestEdition?.image || "";
  const ticker = (s.ticker || []) as { text: Record<string, string>; href?: string }[];

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-big">
          {heroImage ? <img src={heroImage} alt="" loading="eager" /> : null}
          <p className="eyebrow mb-3">
            <Editable
              target={{ entity: "settings", id: "portal", field: "heroKicker", label: "Kicker do hero" }}
              value={tr(s.heroKicker as Record<string, string>)}
              translations={s.heroKicker as Record<string, string>}
            />
          </p>
          <h1>
            <Editable
              target={{ entity: "settings", id: "portal", field: "heroTitle", label: "Título do hero" }}
              value={tr(s.heroTitle as Record<string, string>)}
              translations={s.heroTitle as Record<string, string>}
            >
              <Kin text={tr(s.heroTitle as Record<string, string>)} />
            </Editable>
          </h1>
          <p>
            <Editable
              target={{ entity: "settings", id: "portal", field: "heroText", label: "Texto do hero" }}
              value={tr(s.heroText as Record<string, string>)}
              translations={s.heroText as Record<string, string>}
              multiline
            />
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={hrefOf(links.heroPrimary?.href)} className="btn btn-pri">{linkText("heroPrimary", "Ver a edição")}</Link>
            <Link href={hrefOf(links.heroCovers?.href)} className="btn">{linkText("heroCovers", "Capas")}</Link>
            <Link href={hrefOf(links.heroNews?.href)} className="btn">{linkText("heroNews", "News")}</Link>
          </div>
        </div>

        {latestCover && (
          <div className="card">
            <Link href={latestCoverHref} target={latestCover.url?.startsWith("http") ? "_blank" : undefined} rel={latestCover.url?.startsWith("http") ? "noreferrer" : undefined} className="block">
              <MediaTile
                id={latestCover.id}
                src={latestCover.image}
                word={tr(latestCover.title).split(" ")[0]}
                ratio="r34"
                edit={{ entity: "item", id: latestCover.id, field: "image", label: "Capa em destaque" }}
                linkUrl={latestCover.url}
              />
            </Link>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="tag">{tr(latestCover.dek)}</p>
              {latestCover.url && (
                <a href={latestCover.url} target="_blank" rel="noreferrer" className="more text-[11px]">
                  Abrir ↗
                </a>
              )}
            </div>
            <Link href={latestCoverHref} target={latestCover.url?.startsWith("http") ? "_blank" : undefined} rel={latestCover.url?.startsWith("http") ? "noreferrer" : undefined}>
              <h3 className="font-display text-2xl font-bold uppercase">{tr(latestCover.title)}</h3>
            </Link>
          </div>
        )}
      </section>

      {/* TICKER */}
      {ticker.length > 0 && (
        <div className="ticker mt-10">
          <div className="ticker-track">
            {[0, 1].map((dup) => (
              <span key={dup} className="contents">
                {ticker.map((item, i) => (
                  <Link key={`${dup}-${i}`} href={hrefOf(item.href)}><b>◆</b>{tr(item.text)}</Link>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* EDIÇÕES (5 últimas — desliza para o lado no mobile, grade de 5 no desktop) */}
      <section className="section">
        <SectionHead
          title={tr(editionsPage?.title)}
          kicker={tr(editionsPage?.kicker)}
          href={hrefOf(links.seeAllEditions?.href || "/editions")}
          hrefLabel={linkText("seeAllEditions", tr(site.ui["action.seeAll"]))}
          target={{ entity: "page", id: "editions", field: "title", label: "Título Edições" }}
          translations={editionsPage?.title as Record<string, string>}
        />
        <div className="home-editions-strip">
          {editions.map((e) => (
            <div key={e.id} className="card">
              <Link href={itemHref(e)} className="block">
                <MediaTile
                  id={e.id}
                  src={e.image}
                  ratio="r34"
                  edit={{ entity: "item", id: e.id, field: "image", label: "Capa da edição" }}
                  linkUrl={e.url}
                />
              </Link>
              <div className="mt-1 flex items-center justify-between gap-2">
                <Link href={itemHref(e)} className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold uppercase">
                    <Editable target={{ entity: "item", id: e.id, field: "title", label: "Título da edição" }} value={tr(e.title)} translations={e.title} />
                  </h3>
                </Link>
                {e.url && (
                  <a href={e.url} target="_blank" rel="noreferrer" className="more shrink-0 text-[11px]" title="Abrir edição">
                    ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPAS + ENTREVISTAS (6 últimas — desliza para o lado no mobile, grade de 6 no desktop) */}
      <section className="section">
        <SectionHead
          title={tr(coversPage?.title)}
          kicker={tr(coversPage?.subtitle)}
          href={hrefOf(links.seeAllCovers?.href || "/covers")}
          hrefLabel={linkText("seeAllCovers", tr(site.ui["label.fullGallery"]))}
          target={{ entity: "page", id: "covers", field: "title", label: "Título Capas" }}
          translations={coversPage?.title as Record<string, string>}
        />
        <div className="home-covers-strip">
          {covers.map((c) => (
            <div key={c.id} className="card">
              <Link href={c.url || itemHref(c)} target={c.url?.startsWith("http") ? "_blank" : undefined} rel={c.url?.startsWith("http") ? "noreferrer" : undefined} className="block">
                <MediaTile
                  id={c.id}
                  src={c.image}
                  word={tr(c.title).split(" ")[0]}
                  ratio="r34"
                  edit={{ entity: "item", id: c.id, field: "image", label: "Capa" }}
                  linkUrl={c.url}
                />
              </Link>
              <div className="mt-1 flex items-center justify-between gap-2">
                <Link href={c.url || itemHref(c)} target={c.url?.startsWith("http") ? "_blank" : undefined} rel={c.url?.startsWith("http") ? "noreferrer" : undefined} className="min-w-0">
                  <h3 className="truncate font-display text-xl font-bold uppercase">
                    <Editable target={{ entity: "item", id: c.id, field: "title", label: "Nome na capa" }} value={tr(c.title)} translations={c.title} />
                  </h3>
                </Link>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" className="more shrink-0 text-[11px]" title="Abrir capa">
                    ↗
                  </a>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-mute">
                <Editable target={{ entity: "item", id: c.id, field: "dek", label: "Linha fina da capa" }} value={tr(c.dek)} translations={c.dek ?? undefined} />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* NEWS (3 no celular, 4 a partir de 640px) */}
      <section className="section">
        <SectionHead
          title={tr(newsPage?.title)}
          kicker={tr(site.ui["label.latest"])}
          href={hrefOf(links.seeAllNews?.href || "/news")}
          hrefLabel={linkText("seeAllNews", tr(site.ui["action.seeAll"]))}
          target={{ entity: "page", id: "news", field: "title", label: "Título News" }}
          translations={newsPage?.title as Record<string, string>}
        />
        <div className="grid-cards">
          {news.map((a, idx) => (
            <Link key={a.id} href={itemHref(a)} className={`card ${idx >= 3 ? "news-extra" : ""}`}>
              <MediaTile id={a.id} src={a.image} word={a.category || ""} ratio="r34" edit={{ entity: "item", id: a.id, field: "image", label: "Imagem da matéria" }} />
              <p className="tag mt-1">{a.category}</p>
              <h3>
                <Editable target={{ entity: "item", id: a.id, field: "title", label: "Título da matéria" }} value={tr(a.title)} translations={a.title} />
              </h3>
              <p className="line-clamp-3">
                <Editable target={{ entity: "item", id: a.id, field: "dek", label: "Linha fina" }} value={tr(a.dek)} translations={a.dek ?? undefined} multiline />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* YOUR PLAY (4 no mobile, 6 no desktop) */}
      <section className="section">
        <SectionHead
          title={tr(playPage?.title)}
          kicker={tr(site.ui["label.inTheaters"])}
          href={hrefOf(links.seeAllPlay?.href || "/play")}
          hrefLabel={linkText("seeAllPlay", tr(site.ui["action.seeAll"]))}
          target={{ entity: "page", id: "play", field: "title", label: "Título Play" }}
          translations={playPage?.title as Record<string, string>}
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {videos.map((v, idx) => (
            <Link key={v.id} href={hrefOf("/play")} className={`group ${idx >= 4 ? "hidden sm:block" : ""}`}>
              <MediaTile id={v.id} src={v.image} ratio="r169" edit={{ entity: "item", id: v.id, field: "image", label: "Thumbnail do vídeo" }} />
              <p className="tag mt-2 line-clamp-1">{(v.meta as { serie?: string })?.serie}</p>
              <h3 className="font-display text-base font-bold uppercase leading-tight">{tr(v.title)}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* COLEÇÕES: 2 HOTÉIS E 2 RESTAURANTES */}
      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">A curadoria YOUR</p>
            <h2>{tr(site.ui["label.hotels"])} & {tr(site.ui["label.dining"])}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={hrefOf("/hotels")} className="more">{tr(hotelsPage?.title) || "Luxury Hotels"} →</Link>
            <Link href={hrefOf("/fine-dining")} className="more">{tr(diningPage?.title) || "Fine Dining"} →</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...hotels, ...dining].map((place) => (
            <Link key={place.id} href={itemHref(place)} className="card">
              <MediaTile id={place.id} src={place.image} ratio="r43" edit={{ entity: "item", id: place.id, field: "image", label: "Foto" }} linkUrl={place.url} />
              <p className="tag mt-1">{place.type === "hotel" ? tr(site.ui["label.hotels"]) : tr(site.ui["label.dining"])}</p>
              <h3>
                <Editable target={{ entity: "item", id: place.id, field: "title", label: "Nome" }} value={tr(place.title)} translations={place.title} />
              </h3>
              <p className="line-clamp-2">{tr(place.dek)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* NOSSO TIME */}
      <section className="section">
        <SectionHead
          title={tr(columnistsPage?.title)}
          kicker={tr(columnistsPage?.subtitle)}
          href={hrefOf(links.seeAllColumnists?.href || "/columnists")}
          hrefLabel={linkText("seeAllColumnists", tr(site.ui["action.seeAll"]))}
          target={{ entity: "page", id: "columnists", field: "title", label: "Título Nosso Time" }}
          translations={columnistsPage?.title as Record<string, string>}
        />
        <div className="row">
          {columnists.map((c) => (
            <Link key={c.id} href={itemHref(c)} className="w-[165px] sm:w-[190px]">
              <MediaTile id={c.id} src={c.image} ratio="r34" edit={{ entity: "item", id: c.id, field: "image", label: "Foto" }} />
              <h3 className="mt-2 font-display text-lg font-bold uppercase leading-tight">{tr(c.title)}</h3>
              <p className="text-sm text-mute">{tr(c.dek)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section mx-auto w-full max-w-4xl">
        <NewsletterSignup lang={lang} source="home" variant="card" />
      </section>

      {/* MEDIA RELATIONS + MÍDIA KIT */}
      <section className="section grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-wine p-7">
          <p className="eyebrow mb-2">{tr(relationsPage?.kicker)}</p>
          <h2 className="mb-3 font-display text-3xl font-extrabold uppercase">{tr(relationsPage?.title)}</h2>
          <p className="text-mute">{tr(relationsPage?.subtitle)}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={hrefOf(links.relations?.href || "/relations")} className="btn btn-pri">{linkText("relations", "Media Relations")}</Link>
            <Link href={hrefOf(links.pressRoom?.href || "/press")} className="btn">{linkText("pressRoom", tr(site.ui["label.pressReleases"]))}</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-7">
          <p className="eyebrow mb-2">{tr(mediaPage?.kicker)}</p>
          <h2 className="mb-3 font-display text-3xl font-extrabold uppercase">{tr(mediaPage?.title)}</h2>
          <p className="text-mute">{tr(mediaPage?.subtitle)}</p>
          <Link href={hrefOf(links.mediaKit?.href || "/media-kit")} className="btn btn-gold mt-5 inline-flex">{linkText("mediaKit", tr(site.ui["action.seeAll"]))}</Link>
        </div>
      </section>
    </>
  );
}
