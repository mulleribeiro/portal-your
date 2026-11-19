import { Suspense } from "react";
import { Gallery, type GalleryCard } from "@/components/Gallery";
import { Kin } from "@/components/ui";
import { Editable } from "@/components/EditProvider";
import { ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export default async function CoversPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "covers");
  const covers = itemsOfType(site, "cover");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated(covers, lang, site.defaultLang);
  }

  const cards: GalleryCard[] = covers.map((c) => {
    const meta = c.meta as { role?: string; credit?: string };
    return {
      id: c.id,
      title: tr(c.title),
      dek: tr(c.dek),
      body: tr(c.body),
      image: c.image,
      url: c.url,
      word: tr(c.title).split(" ")[0],
      category: meta.role || c.category || null,
      meta: meta.credit ? { créditos: meta.credit } : undefined,
    };
  });

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase"><Kin text={tr(page?.title)} /></h1>
        <p className="mt-3 max-w-[60ch] text-lg text-mute">
          <Editable target={{ entity: "page", id: "covers", field: "subtitle", label: "Subtítulo Capas" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
        </p>
      </section>

      <section className="section">
        <Suspense fallback={<p className="text-mute">…</p>}>
          <Gallery
            items={cards}
            param="cover"
            ratio="r34"
            modalRatio="r34"
            layout="portrait"
            labels={{ close: tr(site.ui["action.cancel"]), visit: tr(site.ui["action.visit"]) }}
          />
        </Suspense>
      </section>
    </>
  );
}
