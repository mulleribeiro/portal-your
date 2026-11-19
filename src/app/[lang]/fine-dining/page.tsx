import Link from "next/link";
import { Suspense } from "react";
import { Editable } from "@/components/EditProvider";
import { EditableImage } from "@/components/EditableImage";
import { Gallery, type CrossRec, type GalleryCard } from "@/components/Gallery";
import { Kin } from "@/components/ui";
import { ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export default async function FineDiningPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "fine-dining");
  const dining = itemsOfType(site, "dining");
  const hotels = itemsOfType(site, "hotel");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated(dining.slice(0, 28), lang, site.defaultLang);
  }

  const recLabel =
    lang === "en"
      ? "Where to stay in the city · Luxury Hotels"
      : lang === "es"
      ? "Dónde hospedarse en la ciudad · Luxury Hotels"
      : "Onde se hospedar na cidade · Luxury Hotels";

  const cards: GalleryCard[] = dining.map((r) => {
    const meta = (r.meta || {}) as {
      dest?: string;
      destKey?: string;
      addr?: string;
      phone?: string;
      hours?: string;
      hours_en?: string;
      hours_es?: string;
      ig?: string;
      hotel?: string;
      photos?: string[];
    };

    const cityHotels: CrossRec[] = hotels
      .filter((h) => {
        const hm = (h.meta || {}) as { near?: string; city?: string };
        return (
          (meta.destKey && hm.near === meta.destKey) ||
          (meta.hotel && tr(h.title).toLowerCase() === meta.hotel.toLowerCase()) ||
          (meta.dest && hm.city && meta.dest.toLowerCase().includes(hm.city.toLowerCase()))
        );
      })
      .map((h) => ({
        id: h.id,
        name: tr(h.title),
        sub: tr(h.dek),
        image: h.image,
        href: `/${lang}/hotels?place=${encodeURIComponent(h.id)}`,
      }));

    const hours =
      lang === "en" && meta.hours_en
        ? meta.hours_en
        : lang === "es" && meta.hours_es
        ? meta.hours_es
        : meta.hours;

    return {
      id: r.id,
      title: tr(r.title),
      dek: tr(r.dek),
      body: tr(r.body),
      image: r.image,
      photos: meta.photos || (r.image ? [r.image] : []),
      url: r.url,
      word: tr(r.title).split(" ")[0],
      category: `${meta.dest || ""}${meta.hotel ? ` · ${meta.hotel}` : ""}`,
      group: meta.dest || null,
      meta: {
        destino: meta.dest,
        hotel: meta.hotel,
        endereço: meta.addr,
        telefone: meta.phone,
        horário: hours,
        instagram: meta.ig ? `@${String(meta.ig).replace(/^@/, "")}` : "",
      },
      recTitle: recLabel,
      recs: cityHotels,
    };
  });

  const heroImg =
    (site.settings.images as Record<string, { url?: string }> | undefined)?.diningHero?.url ||
    dining[0]?.image ||
    "";

  return (
    <>
      <section className="pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">{tr(page?.kicker) || "A curadoria YOUR"}</p>
          <Link href={`/${lang}/hotels`} className="chip">
            {lang === "en" ? "Explore Luxury Hotels Collection →" : lang === "es" ? "Explorar Luxury Hotels Collection →" : "Explorar Luxury Hotels Collection →"}
          </Link>
        </div>
        <h1 className="mt-2 font-display text-[clamp(40px,7.5vw,92px)] font-extrabold uppercase">
          <Editable target={{ entity: "page", id: "fine-dining", field: "title", label: "Título Fine Dining" }} value={tr(page?.title) || "Fine Dining Collection"} translations={page?.title}>
            <Kin text={tr(page?.title) || "Fine Dining Collection"} />
          </Editable>
        </h1>
        <p className="mt-3 max-w-[64ch] text-lg text-mute">
          <Editable
            target={{ entity: "page", id: "fine-dining", field: "subtitle", label: "Subtítulo Fine Dining" }}
            value={tr(page?.subtitle)}
            translations={page?.subtitle ?? undefined}
            multiline
          />
        </p>
      </section>

      {heroImg && (
        <div className="md r169 mt-8 max-h-[380px]">
          <EditableImage
            target={{ entity: "settings", id: "portal", field: "images.diningHero.url", label: "Banner Fine Dining" }}
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
              visit: lang === "en" ? "Visit restaurant" : lang === "es" ? "Conocer el restaurante" : "Conhecer o restaurante",
            }}
          />
        </Suspense>
      </section>

      {/* Complementary Banner to Luxury Hotels */}
      <section className="section">
        <div className="rounded-3xl border border-line bg-wine p-7 sm:p-10">
          <p className="eyebrow mb-2">Coleção complementar</p>
          <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">YOUR Luxury Hotels Collection</h2>
          <p className="mt-2 max-w-[60ch] text-mute">
            {lang === "en"
              ? "Explore our curated selection of luxury hotels across Brazil — with dining recommendations in every destination."
              : lang === "es"
              ? "Explora nuestra curaduría de hoteles de lujo en Brasil — con sugerencias gastronómicas en cada destino."
              : "Explore nossa curadoria de hotéis de luxo pelo Brasil — com sugestões gastronômicas em cada destino."}
          </p>
          <Link href={`/${lang}/hotels`} className="btn btn-gold mt-5 inline-flex">
            {lang === "en" ? "Enter Luxury Hotels Collection →" : lang === "es" ? "Entrar en Luxury Hotels Collection →" : "Entrar em Luxury Hotels Collection →"}
          </Link>
        </div>
      </section>
    </>
  );
}
