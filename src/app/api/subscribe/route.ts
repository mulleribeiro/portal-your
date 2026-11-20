import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { emailSubscribers } from "@/db/schema";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANG_PATTERN = /^[a-z]{2}(?:-[a-z]{2})?$/i;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    consent?: unknown;
    lang?: unknown;
    source?: unknown;
    website?: unknown;
  } | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  // Silent success for automated form submissions caught by the honeypot.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, error: "Informe um e-mail válido." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ ok: false, error: "É necessário aceitar o recebimento de novidades." }, { status: 400 });
  }

  const langValue = typeof body.lang === "string" ? body.lang.trim().toLowerCase() : "pt";
  const lang = LANG_PATTERN.test(langValue) ? langValue.slice(0, 8) : "pt";
  const source = body.source === "subscribe-page" || body.source === "home" ? body.source : "footer";
  const now = new Date();

  try {
    await ensureReady();
    await db.insert(emailSubscribers).values({
      email,
      source,
      lang,
      consentAt: now,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: emailSubscribers.email,
      set: { source, lang, consentAt: now, updatedAt: now },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Não foi possível concluir o cadastro agora." }, { status: 503 });
  }
}
