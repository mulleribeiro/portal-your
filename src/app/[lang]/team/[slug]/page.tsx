import Link from "next/link";
import { notFound } from "next/navigation";
import { Editable } from "@/components/EditProvider";
import { CONTACT_EMAIL } from "@/lib/contact";
import { MediaTile, RichBody } from "@/components/ui";
import { ensureItemFullTranslated, ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const site = await loadSite();
  const person = itemsOfType(site, "columnist").find((c) => c.id === `col-${slug}` || c.id === slug);
  return { title: person ? mlPick(site, person.title, lang) : "Nosso Time" };
}

export default async function ColumnistPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);

  const decoded = decodeURIComponent(slug);
  const all = itemsOfType(site, "columnist");
  const raw = all.find((c) => c.id === `col-${decoded}` || c.id === decoded);
  if (!raw) notFound();

  const person = await ensureItemFullTranslated(raw, lang, site.defaultLang);
  const meta = (person.meta || {}) as {
    area?: string; role?: string; reg?: string; instagram?: string;
    past?: { t: string; u: string }[];
  };

  const page = pageBySlug(site, "columnists");
  const others = all.filter((c) => c.id !== person.id).slice(0, 8);
  const articles = itemsOfType(site, "article").slice(0, 4);
  const columns = (meta.past || []).slice(0, 3);
  const personSlug = person.id.replace(/^col-/, "");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated(articles, lang, site.defaultLang);
  }

  return (
    <>
      <section className="pt-8">
        <Link href={`/${lang}/columnists`} className="more">← {tr(page?.title) || "Nosso Time"}</Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="mx-auto w-full max-w-[380px]">
            <MediaTile
              id={person.id}
              src={person.image}
              ratio="r34"
              edit={{ entity: "item", id: person.id, field: "image", label: "Foto do colunista" }}
            />
          </div>

          <div>
            <p className="eyebrow">{meta.area || person.category}</p>
            <h1 className="mt-2 font-display text-[clamp(38px,6.5vw,80px)] font-extrabold uppercase leading-[.95]">
              <Editable target={{ entity: "item", id: person.id, field: "title", label: "Nome" }} value={tr(person.title)} translations={person.title} />
            </h1>
            <p className="mt-2 text-lg font-semibold text-blush">
              <Editable target={{ entity: "item", id: person.id, field: "dek", label: "Especialidade" }} value={tr(person.dek)} translations={person.dek ?? undefined} />
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {meta.role ? <span className="chip">{meta.role}</span> : null}
              {meta.reg ? <span className="chip">{meta.reg}</span> : null}
              {meta.instagram ? (
                <a href={meta.instagram} target="_blank" rel="noreferrer" className="chip">Instagram ↗</a>
              ) : null}
            </div>

            <div className="mt-6 max-w-[62ch] text-[16.5px] leading-relaxed">
              <RichBody text={tr(person.body) || tr(person.dek)} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`mailto:${CONTACT_EMAIL}?subject=Contato%20para%20${encodeURIComponent(tr(person.title))}`} className="btn btn-gold">
                Falar com a redação
              </a>
              <Link href={`/${lang}/press`} className="btn">Releases & imprensa</Link>
            </div>
          </div>
        </div>
      </section>

      {columns.length > 0 && (
        <section className="section">
          <div className="sh">
            <div>
              <p className="eyebrow mb-2">Colunas publicadas</p>
              <h2>Últimas matérias de {tr(person.title)}</h2>
            </div>
          </div>
          <div className="grid gap-3">
            {columns.map((col, i) => (
              <a
                key={i}
                href={col.u || "#"}
                target={col.u?.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="table-row transition hover:border-blush"
              >
                <div className="min-w-0">
                  <p className="tag">{meta.area}</p>
                  <p className="truncate font-display text-xl font-bold uppercase">{col.t}</p>
                </div>
                <span className="more shrink-0">Ler matéria →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Editorial YOUR</p>
            <h2>Últimas do portal</h2>
          </div>
          <Link href={`/${lang}/news`} className="more">Ver todas →</Link>
        </div>
        <div className="grid-cards">
          {articles.map((a) => (
            <Link key={a.id} href={`/${lang}/article/${a.id.replace(/^article-/, "")}`} className="card">
              <MediaTile id={a.id} src={a.image} word={a.category || ""} ratio="r34" edit={{ entity: "item", id: a.id, field: "image", label: "Imagem" }} />
              <p className="tag mt-1">{a.category}</p>
              <h3>{tr(a.title)}</h3>
              <p className="line-clamp-3">{tr(a.dek)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Nosso Time</p>
            <h2>Outros colunistas</h2>
          </div>
          <Link href={`/${lang}/columnists`} className="more">Ver todos →</Link>
        </div>
        <div className="row">
          {others.map((c) => (
            <Link key={c.id} href={`/${lang}/team/${c.id.replace(/^col-/, "")}`} className="w-[150px] shrink-0">
              <MediaTile id={c.id} src={c.image} ratio="r34" edit={{ entity: "item", id: c.id, field: "image", label: "Foto" }} />
              <h3 className="mt-2 font-display text-base font-bold uppercase leading-tight">{tr(c.title)}</h3>
              <p className="text-xs text-mute">{tr(c.dek)}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] text-mute/60">#{personSlug}</p>
      </section>
    </>
  );
}
