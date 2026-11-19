import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { updateInline, type InlinePayload } from "@/lib/inline";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as InlinePayload;
  if (!body.entity || !body.id || !body.field || !body.values) {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }
  try {
    return NextResponse.json(await updateInline(body));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
