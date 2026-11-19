"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, revokeSessionToken } from "@/lib/auth";

export async function logoutAction() {
  const store = await cookies();
  await revokeSessionToken(store.get(ADMIN_COOKIE)?.value);
  store.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/admin");
}
