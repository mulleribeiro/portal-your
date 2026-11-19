import { NextResponse } from "next/server";

const ALLOWED = ["your_lang", "your_theme"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, string>;
  const response = NextResponse.json({ ok: true });
  for (const key of ALLOWED) {
    const value = body[key];
    if (typeof value === "string" && value.length <= 24) {
      response.cookies.set(key, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
  }
  return response;
}
