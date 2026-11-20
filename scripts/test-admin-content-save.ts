import "dotenv/config";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { activityLog, menuItems, pages } from "@/db/schema";
import { saveMenu, savePage } from "@/lib/admin-store";

const slug = `verify-admin-save-${Date.now().toString(36)}`;
const renamedSlug = `${slug}-updated`;
let externalMenuId: number | undefined;

async function run() {
  await ensureReady();

  const createdPage = await savePage({
    slug,
    template: "custom",
    title: { pt: "Teste de salvamento" },
    subtitle: { pt: "Página criada pelo teste" },
    blocks: [{ type: "paragraph", text: { pt: "Conteúdo persistido" } }],
    published: true,
    showInMenu: true,
    position: 9000,
  });
  assert.equal(createdPage.slug, slug);

  let [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  assert.equal(page?.title.pt, "Teste de salvamento");
  assert.equal((page?.blocks as { type: string }[])[0]?.type, "paragraph");

  let [automaticMenu] = await db.select().from(menuItems).where(and(
    eq(menuItems.area, "rail"), eq(menuItems.group, "Páginas"), eq(menuItems.href, `/${slug}`),
  )).limit(1);
  assert.ok(automaticMenu, "salvar uma página publicada deve criar seu link no menu lateral");

  await savePage({
    slug,
    previousSlug: slug,
    template: "custom",
    title: { pt: "Teste atualizado" },
    blocks: [{ type: "heading", text: { pt: "Novo conteúdo" } }],
    published: true,
    showInMenu: true,
    position: 9000,
  });
  [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  assert.equal(page?.title.pt, "Teste atualizado", "salvar de novo deve atualizar a mesma página");

  await savePage({
    slug: renamedSlug,
    previousSlug: slug,
    template: "custom",
    title: { pt: "Página renomeada" },
    blocks: [],
    published: true,
    showInMenu: true,
    position: 9000,
  });
  const [oldPage] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  [page] = await db.select().from(pages).where(eq(pages.slug, renamedSlug)).limit(1);
  assert.equal(oldPage, undefined, "renomear não deve deixar a página antiga duplicada");
  assert.equal(page?.title.pt, "Página renomeada");
  [automaticMenu] = await db.select().from(menuItems).where(and(
    eq(menuItems.area, "rail"), eq(menuItems.group, "Páginas"), eq(menuItems.href, `/${renamedSlug}`),
  )).limit(1);
  assert.ok(automaticMenu, "o link do menu deve acompanhar o novo slug");

  await savePage({
    slug: renamedSlug,
    previousSlug: renamedSlug,
    template: "custom",
    title: { pt: "Página renomeada" },
    blocks: [],
    published: true,
    showInMenu: false,
    position: 9000,
  });
  const [hiddenMenu] = await db.select().from(menuItems).where(and(
    eq(menuItems.area, "rail"), eq(menuItems.group, "Páginas"), eq(menuItems.href, `/${renamedSlug}`),
  )).limit(1);
  assert.equal(hiddenMenu, undefined, "desativar No menu deve remover apenas o atalho automático");

  const createdMenu = await saveMenu({
    area: "footer",
    group: "Teste",
    label: { pt: "Link de teste" },
    kind: "external",
    href: "https://example.com/verify",
    position: 9000,
  });
  externalMenuId = createdMenu.id;
  assert.ok(externalMenuId);
  await saveMenu({
    id: externalMenuId,
    area: "footer",
    group: "Teste",
    label: { pt: "Link atualizado" },
    kind: "external",
    href: "https://example.com/updated",
    position: 9001,
  });
  const [savedMenu] = await db.select().from(menuItems).where(eq(menuItems.id, externalMenuId)).limit(1);
  assert.equal(savedMenu?.href, "https://example.com/updated", "editar menu deve atualizar o registro existente");
  assert.equal(savedMenu?.label.pt, "Link atualizado");

  console.log("OK: páginas e menus foram criados, relidos e atualizados no PostgreSQL.");
}

async function cleanup() {
  if (externalMenuId) await db.delete(menuItems).where(eq(menuItems.id, externalMenuId));
  for (const testSlug of [slug, renamedSlug]) {
    await db.delete(menuItems).where(and(eq(menuItems.area, "rail"), eq(menuItems.group, "Páginas"), eq(menuItems.href, `/${testSlug}`)));
    await db.delete(pages).where(eq(pages.slug, testSlug));
    await db.delete(activityLog).where(and(eq(activityLog.entity, "page"), eq(activityLog.entityId, testSlug)));
  }
}

run()
  .catch((error: unknown) => {
    console.error("ERRO: falha ao verificar a persistência de páginas e menus.", error);
    process.exitCode = 1;
  })
  .finally(cleanup);
