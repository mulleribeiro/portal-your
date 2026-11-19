import { isAdminRequest } from "@/lib/auth";
import { GitHubPublishError, publishSourceToGitHub } from "@/lib/github-publish";
import { PROJECT_ARCHIVE_NAME, readProjectAsset } from "@/lib/project-archive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 180;
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "Entre no Admin antes de autorizar o envio ao GitHub." }, { status: 401, headers });
  try {
    const body = await request.json() as { repository?: string; token?: string; confirmed?: boolean };
    const archive = await readProjectAsset(request, PROJECT_ARCHIVE_NAME);
    if (!archive) return Response.json({ error: "O pacote ainda está sendo preparado. Recarregue a prévia atual." }, { status: 503, headers });
    const result = await publishSourceToGitHub({ repository: String(body.repository || ""), token: String(body.token || ""), confirmed: body.confirmed === true, archive });
    return Response.json(result, { headers });
  } catch (error) {
    if (error instanceof GitHubPublishError) return Response.json({ error: error.message }, { status: error.status >= 500 ? 502 : 400, headers });
    return Response.json({ error: "Não foi possível conectar ao GitHub. Nenhum token foi armazenado. Tente novamente." }, { status: 502, headers });
  }
}
