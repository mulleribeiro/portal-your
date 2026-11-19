import assert from "node:assert/strict";
import http from "node:http";
import { chromium, expect } from "@playwright/test";

const upstream = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.TEST_ADMIN_PASSWORD;
if (!password) throw new Error("Provide TEST_ADMIN_PASSWORD in the test environment only.");
let session = "";
let privateBodyRequests = 0;
let panelReads = 0;
let loginPanelVerified = false;
let testItem = "";
let removedHeaders = 0;

/** Actual HTTP proxy, not a browser header override: cookies cannot sneak back through the cookie jar. */
const proxy = http.createServer(async (request, response) => {
  try {
    if (request.url === "/__session_proxy_test") {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end('<html><body style="margin:0"><iframe id="preview" src="/admin" sandbox="allow-scripts allow-forms allow-same-origin" style="width:100%;height:100vh;border:0"></iframe></body></html>');
      return;
    }
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    const headers = { ...request.headers };
    for (const key of ["cookie", "authorization", "x-admin-token", "host", "connection", "content-length"]) {
      if (["cookie", "authorization", "x-admin-token"].includes(key) && headers[key]) removedHeaders++;
      delete headers[key];
    }
    headers["accept-encoding"] = "identity";
    const pathname = new URL(request.url, upstream).pathname;
    if (pathname === "/api/admin/data") panelReads++;
    if (pathname.startsWith("/api/admin/") && String(headers["content-type"] || "").includes("application/json")) {
      const body = JSON.parse(bytes.toString() || "{}");
      if (typeof body.__admin_session === "string") { privateBodyRequests++; session = body.__admin_session; }
    }
    const result = await fetch(new URL(request.url, upstream), {
      method: request.method, headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : bytes,
      redirect: "manual",
    });
    const payload = Buffer.from(await result.arrayBuffer());
    if (pathname === "/api/auth/login" && result.ok) {
      const body = JSON.parse(payload.toString());
      loginPanelVerified = body.ok === true && body.panel?.admin === true;
      if (typeof body.token === "string") session = body.token;
    }
    const forwarded = {};
    result.headers.forEach((value, key) => {
      if (!["set-cookie", "content-length", "content-encoding", "transfer-encoding", "connection"].includes(key)) forwarded[key] = value;
    });
    response.writeHead(result.status, forwarded);
    response.end(payload);
  } catch {
    response.writeHead(502, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Regression proxy failed" }));
  }
});
await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${proxy.address().port}`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1365, height: 1000 } });
await context.addInitScript(() => {
  for (const key of ["localStorage", "sessionStorage"]) Object.defineProperty(window, key, { configurable: true, get() { throw new DOMException("Blocked in regression test", "SecurityError"); } });
});
const page = await context.newPage();
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));

const bodyRequest = (url, body) => fetch(`${base}${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, __admin_session: session }) });

try {
  await page.goto(`${base}/__session_proxy_test`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const app = page.frameLocator("#preview");
  const passwordInput = app.getByLabel("Senha de administrador", { exact: true });
  // Verify an actual React interaction first; filling SSR markup before hydration
  // can lose its value when the controlled input is initialized.
  await expect(async () => {
    if (await passwordInput.getAttribute("type") !== "text") {
      await app.getByRole("button", { name: "Mostrar senha", exact: true }).click({ timeout: 1500 });
    }
    await expect(passwordInput).toHaveAttribute("type", "text", { timeout: 1500 });
  }).toPass({ timeout: 20000 });
  await passwordInput.fill(password);
  await expect(app.getByRole("button", { name: "Entrar no painel", exact: true })).toBeEnabled();
  await app.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  await expect(app.getByRole("button", { name: "Central de Pautas", exact: true })).toBeVisible({ timeout: 60000 });
  assert.equal(loginPanelVerified, true, "Login must include the authenticated editor payload");
  assert.equal(panelReads, 0, "Opening the Admin must not need a second session-authentication request");
  assert.equal(await app.locator("#admin-login-error").count(), 0);
  console.log("PASS: exact screenshot failure fixed — login opens editor in ONE response with cookies, Web Storage and authentication headers unavailable.");

  await app.getByRole("button", { name: "Conteúdo", exact: true }).click();
  await app.getByRole("button", { name: "Editar", exact: true }).first().click();
  await expect(app.getByText("Corpo completo / texto / release (~600 palavras em Sala de Imprensa)", { exact: true })).toBeVisible();
  assert.ok(privateBodyRequests > 0, "Item details must authenticate through the JSON body");
  await app.getByRole("button", { name: "Cancelar", exact: true }).click();

  testItem = `session-regression-${Date.now()}`;
  await app.getByRole("button", { name: "+ adicionar novo", exact: true }).click();
  await app.getByLabel("ID (slug)", { exact: true }).fill(testItem);
  const title = app.getByText("Título (multilíngue — clique em Traduzir para preencher outros idiomas)", { exact: true });
  await title.locator("xpath=../..").locator("input").first().fill("Teste privado de sessão");
  await app.getByRole("button", { name: "Publicado: on", exact: true }).click();
  await app.getByRole("button", { name: "Salvar no banco", exact: true }).click();
  await expect(app.getByText(testItem, { exact: false }).first()).toBeVisible({ timeout: 30000 });
  const detail = await bodyRequest(`/api/admin/item?id=${encodeURIComponent(testItem)}`, { __method: "GET" });
  assert.equal(detail.status, 200);
  const item = (await detail.json()).item;
  assert.equal(item.title.pt, "Teste privado de sessão");
  assert.equal(item.published, false);
  console.log("PASS: real content editor reads FULL items, saves a private test record and refreshes the list through body-authenticated POST requests.");

  const removed = await bodyRequest("/api/admin/actions", { action: "delete", entity: "item", id: testItem });
  assert.equal(removed.status, 200); testItem = "";
  const pitchesResponse = page.waitForResponse((response) => response.url().includes("/api/admin/pitches") && response.request().method() === "POST");
  await app.getByRole("button", { name: "Central de Pautas", exact: true }).click();
  assert.equal((await pitchesResponse).status(), 200);
  await expect(app.getByRole("heading", { name: "Central de Pautas", exact: true })).toBeVisible();

  const noConfirmation = await bodyRequest("/api/admin/publish/github", { confirmed: false });
  assert.equal(noConfirmation.status, 400, "Valid session must reach the confirmation guard, not fail authentication");
  console.log("PASS: Central de Pautas and publication authorization remain authenticated despite proxy header stripping.");

  const logoutResponse = page.waitForResponse((response) => response.url().endsWith("/api/auth/logout") && response.request().method() === "POST");
  await app.getByRole("button", { name: "Sair", exact: true }).click();
  assert.equal((await logoutResponse).status(), 200);
  await expect(app.getByRole("button", { name: "Entrar no painel", exact: true })).toBeVisible();
  assert.equal((await bodyRequest("/api/admin/data", { __method: "GET" })).status, 401, "Logout must revoke the old database session");
  assert.ok(removedHeaders > 0);
  assert.deepEqual(browserErrors, []);
  console.log("PASS: logout revokes the actual database session; previous token is rejected; no browser runtime errors.");
} catch (error) {
  if (browserErrors.length) console.error("Browser runtime errors:", browserErrors);
  throw error;
} finally {
  if (testItem && session) await bodyRequest("/api/admin/actions", { action: "delete", entity: "item", id: testItem }).catch(() => {});
  await context.close(); await browser.close();
  proxy.closeAllConnections(); await new Promise((resolve) => proxy.close(resolve));
}
