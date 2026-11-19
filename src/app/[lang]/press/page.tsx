import { Editable } from "@/components/EditProvider";
import { PitchPanel } from "@/components/PitchPanel";
import { PressRoomClient, type PressItem } from "@/components/PressRoomClient";
import { Kin, Stats } from "@/components/ui";
import { ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

export default async function PressPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "press");
  const releases = itemsOfType(site, "release");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated(releases.slice(0, 28), lang, site.defaultLang);
  }

  const pressItems: PressItem[] = releases.map((r) => {
    const meta = (r.meta || {}) as { group?: string; client?: string; words?: number };
    const bodyText = tr(r.body) || tr(r.dek);
    return {
      id: r.id,
      title: tr(r.title),
      titleRaw: (r.title || {}) as Record<string, string>,
      dek: tr(r.dek),
      dekRaw: (r.dek || {}) as Record<string, string>,
      body: bodyText,
      bodyRaw: (r.body || {}) as Record<string, string>,
      category: r.category || "Editorial",
      group: meta.group || "Edição 88",
      image: r.image || "",
      url: r.url || "",
      client: meta.client || "YOUR Magazine",
      words: meta.words || bodyText.split(/\s+/).length,
    };
  });

  const countCovers = pressItems.filter((i) => i.group === "Capas + Entrevistas").length;
  const countEd88 = pressItems.filter((i) => i.group === "Edição 88").length;
  const countChile = pressItems.filter((i) => i.group === "Especial Chile").length;

  return (
    <>
      <section className="pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
            <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase"><Kin text={tr(page?.title)} /></h1>
            <p className="mt-3 max-w-[66ch] text-lg text-mute">
              <Editable target={{ entity: "page", id: "press", field: "subtitle", label: "Subtítulo Sala de imprensa" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
            </p>
          </div>
          <a href="#enviar-pauta" className="btn btn-pri shrink-0">
            {lang === "en" ? "＋ Send a story pitch" : lang === "es" ? "＋ Enviar sugerencia de tema" : "＋ Enviar sugestão de pauta"}
          </a>
        </div>
      </section>

      <section className="section">
        <Stats
          items={[
            { value: String(pressItems.length), label: lang === "en" ? "official releases" : lang === "es" ? "comunicados oficiales" : "releases oficiais" },
            { value: String(countCovers), label: lang === "en" ? "covers + interviews" : lang === "es" ? "portadas + entrevistas" : "capas + entrevistas" },
            { value: String(countEd88), label: "Edição 88 Interativa" },
            { value: String(countChile), label: "Especial Chile" },
            { value: "~600", label: lang === "en" ? "words per PDF release" : lang === "es" ? "palabras por PDF" : "palavras por release PDF" },
          ]}
        />
      </section>

      <PitchPanel lang={lang} email={String(site.settings.email || "muller@yourmagazine.com.br")} />

      <PressRoomClient items={pressItems} lang={lang} />
    </>
  );
}
