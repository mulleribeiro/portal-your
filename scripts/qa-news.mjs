/** Counts how many NEWS cards are visible on the home page at phone and desktop widths. */
import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
let failed = 0;

for (const width of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.goto(`${BASE}/pt`, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(700);
  const result = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href^="/pt/article/"]'));
    return {
      total: links.length,
      visible: links.filter((link) => getComputedStyle(link).display !== "none").length,
    };
  });
  const expected = width < 640 ? 3 : 4;
  const ok = result.visible === expected && result.total === 4;
  if (!ok) failed++;
  console.log(`[${width}px] no DOM: ${result.total} · visíveis: ${result.visible} · esperado ${expected} ${ok ? "OK" : "ERRO"}`);
  await page.close();
}

await browser.close();
console.log(failed ? `${failed} verificação(ões) falharam.` : "NEWS: 3 no celular, 4 no computador.");
process.exitCode = failed ? 1 : 0;
