import Link from "next/link";
import { notFound } from "next/navigation";
import { Editable } from "@/components/EditProvider";
import { Kin, MediaTile, Stats } from "@/components/ui";
import { loadSite, mlPick, pageBySlug } from "@/lib/data";

type Block =
  | { type: "heading"; text: Record<string, string> }
  | { type: "paragraph"; text: Record<string, string> }
  | { type: "image"; src?: string; caption?: Record<string, string> }
  | { type: "cta"; label: Record<string, string>; href?: string }
  | { type: "stats"; items: { value: string; label: Record<string, string> }[] }
  | { type: "columns"; columns: { title: Record<string, string>; text: Record<string, string> }[] }
  | { type: "list"; items: Record<string, string>[] }
  | { type: "quote"; text: Record<string, string> };

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const site = await loadSite();
  const page = pageBySlug(site, slug);
  return { title: page ? mlPick(site, page.title, lang) : "YOUR" };
}

export default async function CustomPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const site = await loadSite();
  const page = pageBySlug(site, slug);
  if (!page) notFound();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const blocks = (page.blocks || []) as Block[];

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{tr(page.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase">
          <Kin text={tr(page.title)} />
        </h1>
        {page.subtitle ? (
          <p className="mt-3 max-w-60ch text-lg text-mute">
            <Editable target={{ entity: "page", id: page.slug, field: "subtitle", label: "Subtítulo" }} value={tr(page.subtitle)} translations={page.subtitle} multiline />
          </p>
        ) : null}
      </section>

      {page.image ? (
        <MediaTile id={page.slug} src={page.image} word={tr(page.title).split(" ")[0]} ratio="r169" className="mt-8" />
      ) : null}

      <section className="section grid gap-8">
        {blocks.map((block, i) => {
          switch (block.type) {
            case "heading":
              return (
                <h2 key={i} className="font-display text-3xl font-extrabold uppercase sm:text-4xl">
                  <Editable target={{ entity: "page", id: page.slug, field: `blocks.${i}.text`, label: "Título do bloco" }} value={tr(block.text)} translations={block.text} />
                </h2>
              );
            case "paragraph":
              return (
                <p key={i} className="max-w-72ch text-lg leading-relaxed text-mute">
                  <Editable target={{ entity: "page", id: page.slug, field: `blocks.${i}.text`, label: "Parágrafo" }} value={tr(block.text)} translations={block.text} multiline />
                </p>
              );
            case "image":
              return (
                <figure key={i}>
                  <MediaTile id={`${page.slug}-${i}`} src={block.src} ratio="r169" />
                  {block.caption ? <figcaption className="mt-2 text-sm text-mute">{tr(block.caption)}</figcaption> : null}
                </figure>
              );
            case "stats":
              return <Stats key={i} items={(block.items || []).map((x) => ({ value: x.value, label: tr(x.label) }))} />;
            case "columns":
              return (
                <div key={i} className="grid gap-5 md:grid-cols-3">
                  {(block.columns || []).map((col, j) => (
                    <div key={j} className="rounded-2xl border border-line bg-surface p-6">
                      <h3 className="mb-2 font-display text-2xl font-bold uppercase">
                        <Editable target={{ entity: "page", id: page.slug, field: `blocks.${i}.columns.${j}.title`, label: "Coluna" }} value={tr(col.title)} translations={col.title} />
                      </h3>
                      <p className="text-mute">
                        <Editable target={{ entity: "page", id: page.slug, field: `blocks.${i}.columns.${j}.text`, label: "Texto da coluna" }} value={tr(col.text)} translations={col.text} multiline />
                      </p>
                    </div>
                  ))}
                </div>
              );
            case "list":
              return (
                <ul key={i} className="grid gap-2">
                  {(block.items || []).map((item, j) => (
                    <li key={j} className="flex gap-3 text-mute">
                      <span className="text-blush">◆</span>
                      <Editable target={{ entity: "page", id: page.slug, field: `blocks.${i}.items.${j}`, label: "Item da lista" }} value={tr(item)} translations={item} />
                    </li>
                  ))}
                </ul>
              );
            case "quote":
              return (
                <blockquote key={i} className="border-l-4 border-blush pl-6 font-serif text-3xl italic leading-snug">
                  <Editable target={{ entity: "page", id: page.slug, field: `blocks.${i}.text`, label: "Citação" }} value={tr(block.text)} translations={block.text} multiline />
                </blockquote>
              );
            case "cta":
              return (
                <div key={i}>
                  <Link href={block.href?.startsWith("http") ? block.href : `/${lang}${block.href}`} className="btn btn-gold">
                    {tr(block.label)}
                  </Link>
                </div>
              );
            default:
              return null;
          }
        })}
      </section>
    </>
  );
}
