import { Editable } from "@/components/EditProvider";
import { AppleTV, type TvCopy, type TvVideo } from "@/components/AppleTV";
import { Kin } from "@/components/ui";
import { ensureItemsTranslated, itemsOfType, loadSite, mlPick, pageBySlug } from "@/lib/data";

const COPY: Record<string, TvCopy> = {
  pt: {
    home: "Início", series: "Séries", interviews: "Entrevistas", health: "Saúde", specials: "Especiais",
    watch: "Assistir agora", next: "Próximo", close: "Fechar",
    continueWatching: "Em destaque no YOUR Play", empty: "Nenhum título nesta seção.",
  },
  en: {
    home: "Home", series: "Series", interviews: "Interviews", health: "Health", specials: "Specials",
    watch: "Watch now", next: "Next", close: "Close",
    continueWatching: "Featured on YOUR Play", empty: "No titles in this section.",
  },
  es: {
    home: "Inicio", series: "Series", interviews: "Entrevistas", health: "Salud", specials: "Especiales",
    watch: "Ver ahora", next: "Siguiente", close: "Cerrar",
    continueWatching: "Destacados en YOUR Play", empty: "No hay títulos en esta sección.",
  },
};

export default async function PlayPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const tr = (v: Record<string, string> | null | undefined) => mlPick(site, v, lang);
  const page = pageBySlug(site, "play");
  const rawVideos = itemsOfType(site, "video");

  if (lang !== site.defaultLang) {
    await ensureItemsTranslated(rawVideos.slice(0, 24), lang, site.defaultLang);
  }

  const videos: TvVideo[] = rawVideos.map((v) => ({
    id: v.id.replace(/^video-/, ""),
    title: tr(v.title),
    dek: tr(v.dek),
    series: String((v.meta as { serie?: string })?.serie || ""),
    thumb: v.image || "",
    url: v.url || "",
  }));

  return (
    <>
      <section className="pt-10 pb-6">
        <p className="eyebrow mb-2">{tr(page?.kicker)}</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase"><Kin text={tr(page?.title)} /></h1>
        <p className="mt-3 max-w-[60ch] text-lg text-mute">
          <Editable target={{ entity: "page", id: "play", field: "subtitle", label: "Subtítulo Play" }} value={tr(page?.subtitle)} translations={page?.subtitle ?? undefined} multiline />
        </p>
      </section>

      <AppleTV videos={videos} copy={COPY[lang] || COPY.pt} />
    </>
  );
}
