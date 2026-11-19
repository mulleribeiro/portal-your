import { adminFetch } from "./admin-fetch";

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await adminFetch("/api/admin/upload", { method: "POST", body: form });
  if (!response.ok) throw new Error(`Não foi possível enviar a imagem (${response.status}).`);
  return ((await response.json()) as { url: string }).url;
}
