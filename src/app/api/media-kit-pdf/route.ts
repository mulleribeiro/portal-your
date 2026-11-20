import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { settings } from "@/db/schema";
import { buildPdf, logoBytes } from "@/lib/pdf";
import { CONTACT_EMAIL } from "@/lib/contact";
import type { PortalSettings } from "@/db/schema";

export const dynamic = "force-dynamic";

type CatItem = { grupo: string; nome: string; desc: string; preco: number; unidade: string; prazo: string; entrega: string[]; ativo?: boolean };

/** Downloads the branded YOUR Magazine media kit as a PDF. */
export async function GET() {
  await ensureReady();
  const [row] = await db.select().from(settings).where(eq(settings.id, "portal")).limit(1);
  const s = (row?.data || {}) as PortalSettings & { catalog?: { grupos: { id: string; nome: string; desc: string }[]; itens: CatItem[]; condicoes: string[] } };

  const stats = (s.stats || []).map((x) => `${x.value} ${x.label?.pt || ""}`).join("; ");
  const audience = (s.audience || []).map((x) => `${x.value} ${x.label?.pt || ""}`).join("; ");
  const network = (s.network || []).map((x) => `${x.value} ${x.label?.pt || ""}`).join("; ");
  const catalog = s.catalog || { grupos: [], itens: [], condicoes: [] };

  const groupSections = catalog.grupos.map((g) => {
    const items = catalog.itens.filter((i) => i.grupo === g.id && i.ativo !== false);
    const lines = items.map((i) => {
      const entrega = (i.entrega || []).join("; ");
      return `• ${i.nome} — R$ ${i.preco.toLocaleString("pt-BR")}${i.unidade === "mensal" ? "/mês" : ""} (${i.prazo || "sob consulta"}). ${i.desc}${entrega ? ` Entregas: ${entrega}.` : ""}`;
    });
    return `## ${g.nome}\n${g.desc}\n\n${lines.join("\n")}`;
  }).join("\n\n");

  const body = [
    "A YOUR Magazine é uma publicação 100% digital de luxo e lifestyle, feita no Brasil para o mundo há 10 anos. Este mídia kit reúne audiência, canais, formatos comerciais e a tabela completa de serviços e produtos do ecossistema YOUR.",
    "## Audiência em Números",
    stats,
    "## Perfil do Público",
    audience,
    "## Rede de Distribuição",
    network,
    "## Ecossistema YOUR",
    "01 / Editorial — YOUR Magazine: revista própria com marca premium, venda de capas e publieditoriais.\n02 / Assessoria — YOUR Press: assessoria de imprensa completa, relacionamento com jornalistas, produção de pautas e clipping.\n03 / Distribuição — YOUR Newswire: disparo de releases para base segmentada em conformidade com LGPD e GDPR.\n04 / Conteúdo — YOUR Content Studio: produção de textos, fotos, vídeos e branded content.\n05 / Rede — YOUR Media Network: rede de veículos parceiros no Brasil, Europa e Estados Unidos.",
    "## Tabela de Serviços, Produtos e Categorias",
    groupSections,
    "## Condições Comerciais",
    (catalog.condicoes || []).map((c) => `• ${c}`).join("\n"),
    "## Contato Comercial",
    `Fale com o time da YOUR Magazine: ${CONTACT_EMAIL} · ${s.phone || ""}. Endereço Brasil: R. João da Silva Araújo, 8 — Sala 306, Centro, Caratinga, MG, 35300-238. Escritório Nova York: 1740 Broadway, 15th Floor, New York, 10019, EUA.`,
  ].join("\n\n");

  const pdf = buildPdf({
    kicker: "Mídia kit · YOUR Magazine 10 Anos",
    title: "Mídia Kit 2025 PT BR",
    dek: "Audiência, canais, formatos e tabela completa de serviços, produtos e categorias.",
    body,
    logoBytes: logoBytes(),
    footer: "YOUR Magazine — Mídia Kit",
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Midia-Kit-2025-PT-BR.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
