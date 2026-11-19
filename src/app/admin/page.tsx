import type { Metadata } from "next";
import { ensureReady } from "@/db/ensure";
import { isAdminRequest, requestSessionToken } from "@/lib/auth";
import { getAdminData } from "@/lib/admin-data";
import { AdminAccess } from "./AdminAccess";
import type { AdminData } from "./types";

export const metadata: Metadata = { title: "Admin · YOUR" };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  let initialData: AdminData | null = null;
  let initialToken = "";
  let initialError = erro === "senha" ? "Confira a senha digitada, incluindo o ponto final." : erro === "configuracao" ? "O administrador ainda não foi configurado neste banco." : erro === "conexao" ? "Não foi possível conectar ao banco do portal." : "";
  try {
    await ensureReady();
    if (await isAdminRequest()) {
      initialData = await getAdminData(true) as unknown as AdminData;
      initialToken = await requestSessionToken();
    }
  } catch {
    initialError = "Não foi possível carregar o banco do portal. Confira DATABASE_URL na configuração do servidor.";
  }
  return <AdminAccess initialData={initialData} initialToken={initialToken} initialError={initialError} />;
}
