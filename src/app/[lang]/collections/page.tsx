import Link from "next/link";
import { redirect } from "next/navigation";
import { Editable } from "@/components/EditProvider";
import { Kin, MediaTile } from "@/components/ui";
import { itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export default async function CollectionsPage({
  params, searchParams,
}: { params: Promise<{ lang: string }>; searchParams: Promise<{ c?: string; place?: string }> }) {
  const { lang } = await params;
  const { c, place } = await searchParams;

  if (c === "dining") {
    redirect(`/${lang}/fine-dining${place ? `?place=${encodeURIComponent(place)}` : ""}`);
  }
  if (c === "hotels") {
    redirect(`/${lang}/hotels${place ? `?place=${encodeURIComponent(place)}` : ""}`);
  }

  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "collections");
  const hotels = itemsOfType(site, "hotel");
  const dining = itemsOfType(site, "dining");

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase"><Kin text={tr(page?.title)} /></h1>
        <p className="mt-3 max-w-[62ch] text-lg text-mute">
          <Editable target={{ entity: "page", id: "collections", field: "subtitle", label: "Subtítulo Collections" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
        </p>
      </section>

      <section className="section grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <MediaTile id="col-hotels" src={hotels[0]?.image} word="HOTELS" ratio="r169" />
          <p className="eyebrow mt-5">Coleção · {hotels.length} hotéis</p>
          <h2 className="mt-1 font-display text-4xl font-extrabold uppercase">Luxury Hotels Collection</h2>
          <p className="mt-2 text-mute">
            Hospedagens em que o luxo encontra a autenticidade da hospitalidade brasileira — com sugestões de onde comer na mesma região.
          </p>
          <Link href={`/${lang}/hotels`} className="btn btn-pri mt-5 inline-flex">
            Entrar em Luxury Hotels →
          </Link>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <MediaTile id="col-dining" src={dining[0]?.image} word="DINING" ratio="r169" />
          <p className="eyebrow mt-5">Coleção · {dining.length} restaurantes</p>
          <h2 className="mt-1 font-display text-4xl font-extrabold uppercase">Fine Dining Collection</h2>
          <p className="mt-2 text-mute">
            Uma seleção de endereços em 8 destinos onde a excelência encontra a autenticidade de cada mesa — com sugestão de onde se hospedar na cidade.
          </p>
          <Link href={`/${lang}/fine-dining`} className="btn btn-gold mt-5 inline-flex">
            Entrar em Fine Dining →
          </Link>
        </div>
      </section>
    </>
  );
}
