import { NextResponse } from "next/server";
import { activeEngine, ENGINE_LABEL, translateBatch } from "@/lib/translate";

/** Public + Admin neural translation endpoint (used by both admin fields and on-demand page translation). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    text?: string; texts?: string[]; source?: string; target?: string;
  };
  const source = body.source || "pt";
  const target = body.target || "en";
  const input = body.texts?.length ? body.texts : [body.text || ""];
  const { results, engine } = await translateBatch(input.slice(0, 60), source, target);
  return NextResponse.json({
    text: results[0],
    results,
    engine,
    engineLabel: ENGINE_LABEL[engine],
    availableEngine: ENGINE_LABEL[activeEngine()],
  });
}
