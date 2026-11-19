import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { items } from "@/db/schema";
import { ensureItemFullTranslated, loadSite, mlPick } from "@/lib/data";
import { buildPdf, logoBytes } from "@/lib/pdf";

export const dynamic = "force-dynamic";

function ensureApprox600Words(title: string, dek: string, category: string, body: string): string {
  const clean = body.trim();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 420) return clean;
  return [
    `SÃO PAULO / NOVA YORK — A YOUR Magazine (edição comemorativa de 10 anos) apresenta em sua Sala de Imprensa o release oficial "${title}", integrante da curadoria ${category || "Editorial"}. ${dek || ""}`,
    clean,
    "A pauta integra a programação editorial da YOUR Magazine, publicação 100% digital fundada e dirigida pelo comunicólogo e editor-chefe Müller Ribeiro, com atuação consolidada no Brasil e nos Estados Unidos. Com direção de arte autoral, entrevistas exclusivas e reportagens de profundidade, a revista conecta os protagonistas da cultura, da moda, da saúde, da gastronomia e da hotelaria de alto padrão a uma audiência qualificada das classes A e B.",
    "## Contexto Editorial e Repercussão",
    "Com mais de 13,2 milhões de visualizações mensais em todo o seu ecossistema digital, 88 edições publicadas e mais de 300 capas digitais ao longo de uma década de história, a YOUR Magazine disponibiliza este material completo para jornalistas, produtores, colunistas, veículos parceiros e assessores de imprensa.",
    "## Sobre a YOUR Magazine — 10 Anos",
    "Feita no Brasil para o mundo há 10 anos, a YOUR Magazine reúne portal de notícias diário, edições interativas, galeria de capas + entrevistas, o streaming audiovisual YOUR Play e as coleções Luxury Hotels e Fine Dining. Sua rede de distribuição alcança mais de 120 jornalistas e colunistas, 80 revistas parceiras, 40 rádios e podcasts e 50 portais de notícias.",
    "## Atendimento à Imprensa",
    "Este release oficial e os créditos editoriais estão liberados para reprodução mediante citação à YOUR Magazine. Para solicitar fotos em alta resolução, entrevistas com porta-vozes ou credenciamento, entre em contato pelo e-mail muller@yourmagazine.com.br.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") || "pt";

  await ensureReady();
  const site = await loadSite();
  const decoded = decodeURIComponent(id);
  const [found] = await db.select().from(items).where(eq(items.id, decoded)).limit(1);
  if (!found) return new Response("Release not found", { status: 404 });

  const item = await ensureItemFullTranslated(found, lang, site.defaultLang);
  const title = mlPick(site, item.title, lang);
  const dek = mlPick(site, item.dek, lang);
  const rawBody = mlPick(site, item.body, lang);
  const meta = (item.meta || {}) as { group?: string };
  const kicker = `${meta.group || "Sala de Imprensa"}${item.category ? ` · ${item.category}` : ""}`;
  const fullBody = ensureApprox600Words(title, dek, kicker, rawBody || dek);

  const pdf = buildPdf({ kicker, title, dek, body: fullBody, logoBytes: logoBytes(), footer: "YOUR Magazine — Sala de Imprensa" });
  const safeSlug = decoded.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="release-your-${safeSlug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
