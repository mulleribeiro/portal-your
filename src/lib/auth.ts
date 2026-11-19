import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "@/db/ensure";
import { adminCredentials, adminSessions } from "@/db/schema";

export const ADMIN_COOKIE = "your_admin_session";
export const ADMIN_BODY_FIELD = "__admin_session";
const OWNER = "owner";
const ITERATIONS = 210000;
const SESSION_PATTERN = /^your_[a-f0-9]{64}$/;
type Credentials = typeof adminCredentials.$inferSelect;

export class AdminConfigurationError extends Error {
  constructor() {
    super("O acesso administrativo ainda não foi configurado neste banco. Defina ADMIN_PASSWORD no servidor ou execute a configuração administrativa do projeto.");
    this.name = "AdminConfigurationError";
  }
}

async function deriveHash(password: string, salt: Uint8Array, iterations = ITERATIONS): Promise<Buffer> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const value = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new Uint8Array(salt), iterations, hash: "SHA-256" }, key, 256);
  return Buffer.from(value);
}

async function passwordHash(password: string): Promise<string> {
  const salt = randomBytes(24);
  const hash = await deriveHash(password, salt);
  return `pbkdf2_sha256$${ITERATIONS}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, rounds, salt, expected] = encoded.split("$");
  const count = Number(rounds);
  if (algorithm !== "pbkdf2_sha256" || count < 100000 || count > 1000000 || !/^[a-f0-9]{48}$/.test(salt || "") || !/^[a-f0-9]{64}$/.test(expected || "")) return false;
  return timingSafeEqual(await deriveHash(password, Buffer.from(salt, "hex"), count), Buffer.from(expected, "hex"));
}

export async function configureAdministrator(password: string): Promise<void> {
  if (password.length < 8) throw new Error("A senha administrativa deve ter pelo menos 8 caracteres.");
  await ensureReady();
  const row = { id: OWNER, passwordHash: await passwordHash(password), sessionSecret: randomBytes(48).toString("hex"), updatedAt: new Date() };
  await db.insert(adminCredentials).values(row).onConflictDoUpdate({ target: adminCredentials.id, set: row });
  await db.delete(adminSessions);
}

async function credentials(): Promise<Credentials> {
  await ensureReady();
  let [row] = await db.select().from(adminCredentials).where(eq(adminCredentials.id, OWNER)).limit(1);
  if (!row) {
    const initial = process.env.ADMIN_PASSWORD?.trim();
    if (!initial) throw new AdminConfigurationError();
    await db.insert(adminCredentials).values({ id: OWNER, passwordHash: await passwordHash(initial), sessionSecret: randomBytes(48).toString("hex") }).onConflictDoNothing();
    [row] = await db.select().from(adminCredentials).where(eq(adminCredentials.id, OWNER)).limit(1);
  }
  if (!row) throw new AdminConfigurationError();
  return row;
}

function tokenDigest(token: string): string { return createHash("sha256").update(token).digest("hex"); }

/** Database-backed sessions survive restarts and do not depend on per-route environment secrets or clocks. */
export async function createSessionToken(): Promise<string> {
  await credentials();
  const token = `your_${randomBytes(32).toString("hex")}`;
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, sql`CURRENT_TIMESTAMP`));
  await db.insert(adminSessions).values({ tokenHash: tokenDigest(token), expiresAt: sql`CURRENT_TIMESTAMP + INTERVAL '30 days'` });
  return token;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !SESSION_PATTERN.test(token)) return false;
  try {
    await ensureReady();
    const [session] = await db.select({ tokenHash: adminSessions.tokenHash }).from(adminSessions)
      .where(and(eq(adminSessions.tokenHash, tokenDigest(token)), gt(adminSessions.expiresAt, sql`CURRENT_TIMESTAMP`))).limit(1);
    return Boolean(session);
  } catch { return false; }
}

/** The POST body is the primary transport: preview proxies may remove custom headers and cookies. */
export async function requestSessionToken(request?: Request): Promise<string> {
  if (request) {
    if (!["GET", "HEAD"].includes(request.method)) {
      const type = request.headers.get("content-type") || "";
      try {
        if (type.includes("application/json")) {
          const body = await request.clone().json() as Record<string, unknown>;
          if (typeof body[ADMIN_BODY_FIELD] === "string") return String(body[ADMIN_BODY_FIELD]).slice(0, 240);
        } else if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
          const body = await request.clone().formData();
          const token = body.get(ADMIN_BODY_FIELD);
          if (typeof token === "string") return token.slice(0, 240);
        }
      } catch { /* invalid payload is handled by the endpoint */ }
    }
    const direct = request.headers.get("x-admin-token") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (direct) return direct;
    const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)your_admin_session=([^;]+)/)?.[1];
    if (cookie) return decodeURIComponent(cookie);
  }
  try {
    const hdrs = await headers();
    const direct = hdrs.get("x-admin-token");
    if (direct) return direct;
    return (await cookies()).get(ADMIN_COOKIE)?.value || "";
  } catch { return ""; }
}

export async function isAdminRequest(request?: Request): Promise<boolean> {
  try { return verifySessionToken(await requestSessionToken(request)); }
  catch { return false; }
}

export async function revokeSessionToken(token: string | null | undefined): Promise<void> {
  if (!token || !SESSION_PATTERN.test(token)) return;
  await ensureReady();
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenDigest(token)));
}

export async function checkPassword(password: string): Promise<boolean> {
  const candidate = String(password || "").trim();
  if (!candidate) return false;
  const stored = await credentials();
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) {
    const a = Buffer.from(candidate); const b = Buffer.from(configured);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    if (valid && !(await verifyPassword(configured, stored.passwordHash))) await configureAdministrator(configured);
    return valid;
  }
  return verifyPassword(candidate, stored.passwordHash);
}
