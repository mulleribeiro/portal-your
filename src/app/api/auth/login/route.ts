import { NextResponse } from "next/server";
import { ADMIN_COOKIE, AdminConfigurationError, checkPassword, createSessionToken } from "@/lib/auth";
import { getAdminData } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
const HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

/** Validate the password AND load the editor in the same request: no second authentication hop. */
export async function POST(request: Request) {
  let accepted = false;
  try {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    if (!(await checkPassword(String(body.password || "")))) return NextResponse.json({ ok: false, error: "Senha incorreta. Confira as letras e o ponto final." }, { status: 401, headers: HEADERS });
    accepted = true;
    const token = await createSessionToken();
    const panel = await getAdminData(true);
    const response = NextResponse.json({ ok: true, token, panel }, { headers: HEADERS });
    const secure = request.url.startsWith("https://") || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(ADMIN_COOKIE, token, { path: "/", httpOnly: false, sameSite: secure ? "none" : "lax", secure, maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    if (error instanceof AdminConfigurationError) return NextResponse.json({ ok: false, error: error.message, code: "ADMIN_NOT_CONFIGURED" }, { status: 503, headers: HEADERS });
    return NextResponse.json({ ok: false, error: accepted ? "A senha foi aceita, mas o banco não conseguiu carregar o painel. Tente novamente em instantes." : "Não foi possível verificar o acesso ao banco do portal." }, { status: 503, headers: HEADERS });
  }
}
