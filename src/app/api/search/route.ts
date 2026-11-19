import { NextResponse } from "next/server";
import { loadSite, searchIndex } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const lang = url.searchParams.get("lang") || "pt";
  const site = await loadSite();
  const index = searchIndex(site, lang);

  const results = q.length < 2 ? [] : index
    .filter((row) => `${row.title} ${row.dek} ${row.category || ""} ${row.type}`.toLowerCase().includes(q))
    .slice(0, 40);

  return NextResponse.json({ results, total: results.length });
}
