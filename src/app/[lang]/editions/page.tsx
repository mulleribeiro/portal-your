import { Suspense } from "react";
import { Editable } from "@/components/EditProvider";
import { Gallery, type GalleryCard } from "@/components/Gallery";
import { Kin } from "@/components/ui";
import { itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export default async function EditionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "editions");
  const editions = itemsOfType(site, "edition");

  const cards: GalleryCard[] = editions.map((e) => {
    const meta = e.meta as { number?: number; interactive?: boolean };
    return {
      id: e.id,
      title: tr(e.title),
      dek: tr(e.dek),
      image: e.image,
      url: e.url,
      word: String(meta.number || ""),
      category: meta.interactive ? tr(site.ui["label.interactive"]) : null,
    };
  });

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase"><Kin text={tr(page?.title)} /></h1>
        <p className="mt-3 max-w-[60ch] text-lg text-mute">
          <Editable target={{ entity: "page", id: "editions", field: "subtitle", label: "Subtítulo Edições" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
        </p>
      </section>

      <section className="section">
        <Suspense fallback={<p className="text-mute">…</p>}>
          <Gallery
            items={cards}
            param="issue"
            ratio="r34"
            modalRatio="r34"
            layout="portrait"
            labels={{ close: tr(site.ui["action.cancel"]), visit: tr(site.ui["action.openIssue"]) }}
          />
        </Suspense>
      </section>
    </>
  );
}
