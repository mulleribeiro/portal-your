import { NextResponse } from "next/server";
import { ADMIN_COOKIE, AdminConfigurationError, checkPassword, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** No-JavaScript fallback. The main Admin login uses a signed token without redirects or cookie dependence. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const password = String(form?.get("password") || "").trim();
  let destination = "/admin";
  let token = "";
  try {
    if (await checkPassword(password)) token = await createSessionToken();
    else destination += "?erro=senha";
  } catch (error) {
    destination += error instanceof AdminConfigurationError ? "?erro=configuracao" : "?erro=conexao";
  }
  const response = new NextResponse(null, { status: 303, headers: { Location: destination, "Cache-Control": "no-store" } });
  if (token) {
    const secure = request.url.startsWith("https://") || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(ADMIN_COOKIE, token, { path: "/", httpOnly: false, sameSite: secure ? "none" : "lax", secure, maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}
