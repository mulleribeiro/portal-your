import { NextResponse } from "next/server";
import { ADMIN_COOKIE, requestSessionToken, revokeSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  await revokeSessionToken(await requestSessionToken(request));
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
