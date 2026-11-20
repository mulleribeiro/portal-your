import { NextResponse } from "next/server";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { emailSubscribers } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie, x-admin-token, Authorization" };

type SubscriberQuery = { page: number; pageSize: number; search: string; csv: boolean };

function queryFrom(request: Request): SubscriberQuery {
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get("pageSize") || "25", 10) || 25));
  return { page, pageSize, search: (params.get("q") || "").trim().slice(0, 120), csv: params.get("format") === "csv" };
}

function csvCell(value: string | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

async function list(request: Request) {
  const { page, pageSize, search, csv } = queryFrom(request);
  const filter = search
    ? or(ilike(emailSubscribers.email, `%${search}%`), ilike(emailSubscribers.name, `%${search}%`))
    : undefined;

  await ensureReady();

  if (csv) {
    const rows = await db.select({
      email: emailSubscribers.email,
      name: emailSubscribers.name,
      source: emailSubscribers.source,
      lang: emailSubscribers.lang,
      consentAt: emailSubscribers.consentAt,
      createdAt: emailSubscribers.createdAt,
    }).from(emailSubscribers).where(filter).orderBy(desc(emailSubscribers.createdAt));
    const records = [
      ["email", "nome", "origem", "idioma", "consentimento_em", "cadastrado_em"],
      ...rows.map((row) => [
        row.email,
        row.name || "",
        row.source,
        row.lang,
        new Date(row.consentAt).toISOString(),
        new Date(row.createdAt).toISOString(),
      ]),
    ];
    const csvText = `\uFEFF${records.map((record) => record.map(csvCell).join(",")).join("\r\n")}`;
    return new NextResponse(csvText, {
      headers: {
        ...NO_STORE,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="your-email-subscribers.csv"',
      },
    });
  }

  const [rows, totalRows] = await Promise.all([
    db.select({
      id: emailSubscribers.id,
      email: emailSubscribers.email,
      name: emailSubscribers.name,
      source: emailSubscribers.source,
      lang: emailSubscribers.lang,
      consentAt: emailSubscribers.consentAt,
      createdAt: emailSubscribers.createdAt,
    }).from(emailSubscribers).where(filter)
      .orderBy(desc(emailSubscribers.createdAt), desc(emailSubscribers.id))
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(emailSubscribers).where(filter),
  ]);

  return NextResponse.json({ subscribers: rows, total: Number(totalRows[0]?.total || 0), page, pageSize }, { headers: NO_STORE });
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Sessão encerrada. Entre novamente no Admin." }, { status: 401, headers: NO_STORE });
  }
  try {
    return await list(request);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os e-mails cadastrados." }, { status: 503, headers: NO_STORE });
  }
}

/** adminFetch tunnels reads and deletes through POST, carrying the session in its JSON body. */
export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Sessão encerrada. Entre novamente no Admin." }, { status: 401, headers: NO_STORE });
  }

  const body = (await request.json().catch(() => ({}))) as { __method?: string; email?: string };
  if (body.__method === "DELETE") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || email.length > 320) return NextResponse.json({ error: "E-mail inválido." }, { status: 400, headers: NO_STORE });
    try {
      await ensureReady();
      await db.delete(emailSubscribers).where(eq(emailSubscribers.email, email));
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    } catch {
      return NextResponse.json({ error: "Não foi possível excluir este cadastro." }, { status: 503, headers: NO_STORE });
    }
  }

  try {
    return await list(request);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os e-mails cadastrados." }, { status: 503, headers: NO_STORE });
  }
}
