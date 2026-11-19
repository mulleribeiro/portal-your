import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getAdminData } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
const HEADERS = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie, x-admin-token, Authorization" };

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Sessão encerrada. Entre novamente no Admin.", code: "SESSION_REQUIRED" }, { status: 401, headers: HEADERS });
  return NextResponse.json(await getAdminData(true), { headers: HEADERS });
}

/** Preferred browser transport, with the session inside JSON rather than a proxy-stripped header. */
export const POST = GET;
