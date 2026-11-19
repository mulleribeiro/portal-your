import { DEFAULT_LANG } from "./i18n";

export type Engine = "deepl" | "openai" | "google" | "libretranslate" | "gtx" | "dictionary";

const TARGET: Record<string, { deepl: string; google: string; libre: string }> = {
  pt: { deepl: "PT-BR", google: "pt", libre: "pt" },
  en: { deepl: "EN", google: "en", libre: "en" },
  es: { deepl: "ES", google: "es", libre: "es" },
  fr: { deepl: "FR", google: "fr", libre: "fr" },
  it: { deepl: "IT", google: "it", libre: "it" },
  de: { deepl: "DE", google: "de", libre: "de" },
};

export function activeEngine(): Engine {
  if (process.env.DEEPL_API_KEY) return "deepl";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GOOGLE_TRANSLATE_API_KEY) return "google";
  if (process.env.LIBRETRANSLATE_URL) return "libretranslate";
  return "gtx";
}

export const ENGINE_LABEL: Record<Engine, string> = {
  deepl: "DeepL API",
  openai: "OpenAI / LLM",
  google: "Google Translate Cloud",
  libretranslate: "LibreTranslate",
  gtx: "Google Translate Neural (automático)",
  dictionary: "Dicionário local (offline)",
};

/** Translate a batch of strings using the active neural provider, with dictionary fallback. */
export async function translateBatch(
  texts: string[], source: string, target: string,
): Promise<{ results: string[]; engine: Engine }> {
  const clean = texts.map((t) => String(t ?? ""));
  if (source === target) return { results: clean, engine: activeEngine() };
  const engine = activeEngine();
  try {
    if (engine === "deepl") return { results: await deepl(clean, source, target), engine };
    if (engine === "google") return { results: await google(clean, source, target), engine };
    if (engine === "libretranslate") return { results: await libre(clean, source, target), engine };
    if (engine === "openai") return { results: await llm(clean, source, target), engine };
    if (engine === "gtx") return { results: await gtxBatch(clean, source, target), engine: "gtx" };
  } catch (err) {
    console.warn("[translate] provider failed, trying gtx/dictionary:", (err as Error).message);
    try {
      return { results: await gtxBatch(clean, source, target), engine: "gtx" };
    } catch {
      /* fallback to dictionary */
    }
  }
  return { results: clean.map((t) => dictionaryTranslate(t, source, target)), engine: "dictionary" };
}

export async function translateText(text: string, source: string, target: string) {
  const { results, engine } = await translateBatch([text], source, target);
  return { text: results[0], engine };
}

async function gtxSingle(text: string, source: string, target: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const params = new URLSearchParams({
    client: "gtx",
    sl: TARGET[source]?.google || source,
    tl: TARGET[target]?.google || target,
    dt: "t",
    q: trimmed,
  });
  const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`GTX ${res.status}`);
  const data = (await res.json()) as [[string, string][]];
  return (data?.[0] || []).map((seg) => seg?.[0] || "").join("");
}

async function gtxBatch(texts: string[], source: string, target: string): Promise<string[]> {
  return Promise.all(texts.map((t) => gtxSingle(t, source, target)));
}

async function deepl(texts: string[], source: string, target: string) {
  const key = process.env.DEEPL_API_KEY!;
  const base = process.env.DEEPL_API_URL || (key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com");
  const res = await fetch(`${base}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      text: texts.join("\n|||\n"),
      source_lang: source.toUpperCase().slice(0, 2),
      target_lang: TARGET[target]?.deepl || target.toUpperCase(),
      tag_handling: "html",
    }),
  });
  if (!res.ok) throw new Error(`DeepL ${res.status}`);
  const data = (await res.json()) as { translations: { text: string }[] };
  return split(data.translations.map((t) => t.text), texts.length);
}

async function google(texts: string[], source: string, target: string) {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY!;
  const res = await fetch("https://translation.googleapis.com/language/translate/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ q: texts, source, target: TARGET[target]?.google || target, format: "text" }),
  });
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const data = (await res.json()) as { data: { translations: { translatedText: string }[] } };
  return data.data.translations.map((t) => t.translatedText);
}

async function libre(texts: string[], source: string, target: string) {
  const out: string[] = [];
  for (const text of texts) {
    const res = await fetch(process.env.LIBRETRANSLATE_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target: TARGET[target]?.libre || target, api_key: process.env.LIBRETRANSLATE_API_KEY || "" }),
    });
    if (!res.ok) throw new Error(`LibreTranslate ${res.status}`);
    const data = (await res.json()) as { translatedText: string };
    out.push(data.translatedText);
  }
  return out;
}

async function llm(texts: string[], source: string, target: string) {
  const key = process.env.OPENAI_API_KEY!;
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You are a professional luxury-magazine translator. Translate the JSON array of strings from "${source}" to "${target}". Keep proper nouns, brand names, markdown syntax, numbers and "[stats]"/"[img]" tags untouched. Reply with JSON: {"items":[...]} with exactly the same length and order.` },
        { role: "user", content: JSON.stringify({ items: texts }) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0].message.content) as { items: string[] };
  return split(parsed.items, texts.length);
}

function split(out: string[], expected: number): string[] {
  const flat = out.join("\n|||\n").split("\n|||\n");
  if (flat.length === expected) return flat;
  if (out.length === expected) return out;
  return out.length > expected ? out.slice(0, expected) : [...out, ...Array(expected - out.length).fill("")];
}

const PHRASES: Record<string, Record<string, string>> = {
  "min de leitura": { en: "min read", es: "min de lectura" },
  "Ver tudo": { en: "See all", es: "Ver todo" },
  "Ler agora": { en: "Read now", es: "Leer ahora" },
  "Abrir a edição": { en: "Open issue", es: "Abrir la edición" },
  "páginas": { en: "pages", es: "páginas" },
  "edições publicadas": { en: "published issues", es: "ediciones publicadas" },
  "anos de revista": { en: "years of magazine", es: "años de revista" },
  "capas digitais": { en: "digital covers", es: "portadas digitales" },
  "entrevistas exclusivas": { en: "exclusive interviews", es: "entrevistas exclusivas" },
  "visualizações por mês": { en: "views per month", es: "visualizaciones por mes" },
  "Parceria de longa data": { en: "Long-standing partnership", es: "Alianza de largo plazo" },
  "Fale conosco": { en: "Contact us", es: "Contáctenos" },
  "Sala de imprensa": { en: "Press room", es: "Sala de prensa" },
  "Mídia kit": { en: "Media kit", es: "Media kit" },
  "Nosso Time": { en: "Our Team", es: "Nuestro Equipo" },
  "Edições": { en: "Issues", es: "Ediciones" },
  "Capas + Entrevistas": { en: "Covers + Interviews", es: "Portadas + Entrevistas" },
  "Assine a YOUR": { en: "Subscribe to YOUR", es: "Suscríbete a YOUR" },
  "Sobre a YOUR": { en: "About YOUR", es: "Sobre YOUR" },
};

function patternRules(text: string, target: string): string | null {
  const t = text.trim();
  let m = t.match(/^Edição\s+(\d+)$/i);
  if (m) return target === "en" ? `Issue ${m[1]}` : target === "es" ? `Edición ${m[1]}` : null;
  m = t.match(/^(\d+)\s+páginas(.*)$/i);
  if (m) return target === "en" ? `${m[1]} pages${m[2]}` : `${m[1]} páginas${m[2]}`;
  m = t.match(/^Capa da Edição (\d+)(.*)$/i);
  if (m) return target === "en" ? `Cover of Issue ${m[1]}${m[2]}` : target === "es" ? `Portada de la Edición ${m[1]}${m[2]}` : null;
  return null;
}

export function dictionaryTranslate(text: string, source: string, target: string): string {
  if (!text || source === target) return text;
  const pattern = patternRules(text, target);
  if (pattern) return pattern;
  let out = text;
  for (const [pt, map] of Object.entries(PHRASES)) {
    if (map[target]) out = out.replace(new RegExp(pt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), map[target]);
  }
  return out;
}

export function sourceLangOf(value: Record<string, string>): string {
  return value[DEFAULT_LANG] ? DEFAULT_LANG : Object.keys(value)[0] || DEFAULT_LANG;
}
