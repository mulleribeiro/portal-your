import Link from "next/link";
import { Kin, MediaTile } from "@/components/ui";
import { loadSite, searchIndex } from "@/lib/data";

export default async function SearchPage({
  params, searchParams,
}: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> }) {
  const { lang } = await params;
  const { q } = await searchParams;
  const site = await loadSite();
  const term = (q || "").trim().toLowerCase();
  const index = searchIndex(site, lang);
  const results = term.length < 2 ? [] : index.filter((r) =>
    `${r.title} ${r.dek} ${r.category || ""} ${r.type}`.toLowerCase().includes(term));

  return (
    <>
      <section className="pt-10">
        <p className="eyebrow mb-2">{site.ui["nav.search"] ? "" : ""}Busca</p>
        <h1 className="font-display text-[clamp(40px,7vw,80px)] font-extrabold uppercase"><Kin text={term ? `“${term}”` : "Buscar"} /></h1>
        <form className="mt-6 flex max-w-xl gap-2" action={`/${lang}/search`}>
          <input className="field" name="q" defaultValue={q || ""} placeholder="Buscar em tudo" aria-label="Buscar" />
          <button className="btn btn-pri">Buscar</button>
        </form>
        <p className="mt-4 text-sm text-mute">{results.length} resultados</p>
      </section>

      <section className="section">
        <div className="grid-cards">
          {results.slice(0, 40).map((r) => (
            <Link key={r.id} href={`/${lang}${r.href}`} className="card">
              <MediaTile id={r.id} src={r.image} word={r.type} ratio="r43" />
              <p className="tag mt-1">{r.type}{r.category ? ` · ${r.category}` : ""}</p>
              <h3>{r.title}</h3>
              <p>{r.dek}</p>
            </Link>
          ))}
        </div>
        {term && results.length === 0 && <p className="text-mute">Nada encontrado. Tente outra busca.</p>}
      </section>
    </>
  );
}
