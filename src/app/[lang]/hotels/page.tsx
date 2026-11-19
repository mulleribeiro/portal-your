import Link from "next/link";
import { Suspense } from "react";
import { Editable } from "@/components/EditProvider";
import { EditableImage } from "@/components/EditableImage";
import { Gallery, type CrossRec, type GalleryCard } from "@/components/Gallery";
import { Kin } from "@/components/ui";
import { ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export default async function HotelsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "hotels");
  const hotels = itemsOfType(site, "hotel");
  const dining = itemsOfType(site, "dining");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated(hotels, lang, site.defaultLang);
  }

  const recLabel =
    lang === "en"
      ? "Where to eat in the region · Fine Dining"
      : lang === "es"
      ? "Dónde comer en la región · Fine Dining"
      : "Onde comer na região · Fine Dining";

  const cards: GalleryCard[] = hotels.map((h) => {
    const meta = (h.meta || {}) as { city?: string; uf?: string; near?: string; photos?: string[] };
    const hTitle = tr(h.title);
    const nearbyDining: CrossRec[] = dining
      .filter((r) => {
        const rm = (r.meta || {}) as { destKey?: string; hotel?: string };
        return (meta.near && rm.destKey === meta.near) || (rm.hotel && rm.hotel.toLowerCase() === hTitle.toLowerCase());
      })
      .map((r) => ({
        id: r.id,
        name: tr(r.title),
        sub: tr(r.dek),
        image: r.image,
        href: `/${lang}/fine-dining?place=${encodeURIComponent(r.id)}`,
      }));

    return {
      id: h.id,
      title: hTitle,
      dek: tr(h.dek),
      body: tr(h.body),
      image: h.image,
      photos: meta.photos || (h.image ? [h.image] : []),
      url: h.url,
      word: hTitle.split(" ")[0],
      category: `${meta.city || ""}${meta.uf ? ` · ${meta.uf}` : ""}`,
      group: meta.uf || meta.city || null,
      meta: {
        cidade: meta.city,
        estado: meta.uf,
      },
      recTitle: recLabel,
      recs: nearbyDining,
    };
  });

  const heroImg =
    (site.settings.images as Record<string, { url?: string }> | undefined)?.hotelsHero?.url ||
    hotels[0]?.image ||
    "";

  return (
    <>
      <section className="pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">{tr(page?.kicker) || "A curadoria YOUR"}</p>
          <Link href={`/${lang}/fine-dining`} className="chip">
            {lang === "en" ? "Explore Fine Dining Collection →" : lang === "es" ? "Explorar Fine Dining Collection →" : "Explorar Fine Dining Collection →"}
          </Link>
        </div>
        <h1 className="mt-2 font-display text-[clamp(40px,7.5vw,92px)] font-extrabold uppercase">
          <Editable target={{ entity: "page", id: "hotels", field: "title", label: "Título Luxury Hotels" }} value={tr(page?.title) || "Luxury Hotels Collection"} translations={page?.title}>
            <Kin text={tr(page?.title) || "Luxury Hotels Collection"} />
          </Editable>
        </h1>
        <p className="mt-3 max-w-[64ch] text-lg text-mute">
          <Editable
            target={{ entity: "page", id: "hotels", field: "subtitle", label: "Subtítulo Luxury Hotels" }}
            value={tr(page?.subtitle)}
            translations={page?.subtitle ?? undefined}
            multiline
          />
        </p>
      </section>

      {heroImg && (
        <div className="md r169 mt-8 max-h-[380px]">
          <EditableImage
            target={{ entity: "settings", id: "portal", field: "images.hotelsHero.url", label: "Banner Luxury Hotels" }}
            src={heroImg}
          />
        </div>
      )}

      <section className="section">
        <Suspense fallback={<p className="text-mute">…</p>}>
          <Gallery
            items={cards}
            param="place"
            ratio="r43"
            modalRatio="r169"
            layout="postcards"
            labels={{
              close: tr(site.ui["action.cancel"]),
              visit: lang === "en" ? "Visit hotel website" : lang === "es" ? "Visitar sitio del hotel" : "Conhecer o hotel",
            }}
          />
        </Suspense>
      </section>

      {/* Complementary Banner to Fine Dining */}
      <section className="section">
        <div className="rounded-3xl border border-line bg-wine p-7 sm:p-10">
          <p className="eyebrow mb-2">Coleção complementar</p>
          <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">YOUR Fine Dining Collection</h2>
          <p className="mt-2 max-w-[60ch] text-mute">
            {lang === "en"
              ? "Discover our curated selection of 55 restaurants across 8 destinations — with hotel recommendations in every city."
              : lang === "es"
              ? "Descubre nuestra curaduría de 55 restaurantes en 8 destinos — con sugerencias de hospedaje en cada ciudad."
              : "Descubra nossa seleção de 55 restaurantes em 8 destinos — com sugestão de onde se hospedar em cada cidade."}
          </p>
          <Link href={`/${lang}/fine-dining`} className="btn btn-gold mt-5 inline-flex">
            {lang === "en" ? "Enter Fine Dining Collection →" : lang === "es" ? "Entrar en Fine Dining Collection →" : "Entrar em Fine Dining Collection →"}
          </Link>
        </div>
      </section>
    </>
  );
}
