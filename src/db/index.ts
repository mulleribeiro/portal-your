import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Workers may not reuse a TCP socket created by a different request. */
const requestClients = new WeakMap<object, NodePgDatabase>();
let localDb: NodePgDatabase | undefined;

export function cloudflareRequest(): { key: object; connectionString?: string } | null {
  try {
    const { env, ctx } = getCloudflareContext();
    const bindings = env as unknown as {
      HYPERDRIVE?: { connectionString?: string };
      DATABASE_URL?: string;
    };
    return { key: ctx, connectionString: bindings.HYPERDRIVE?.connectionString || bindings.DATABASE_URL };
  } catch {
    return null;
  }
}

function connectionError(): never {
  throw new Error(
    "Configure DATABASE_URL (PostgreSQL público) ou o binding HYPERDRIVE nas variáveis do Worker.",
  );
}

/** Resolve lazily, so the Cloudflare build never needs production database credentials. */
export function getDb(): NodePgDatabase {
  const request = cloudflareRequest();
  if (request) {
    const found = requestClients.get(request.key);
    if (found) return found;
    const connectionString = request.connectionString || process.env.DATABASE_URL;
    if (!connectionString) connectionError();
    const pool = new Pool({
      connectionString,
      max: 3,
      maxUses: 1,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 15000,
    });
    const client = drizzle(pool);
    requestClients.set(request.key, client);
    return client;
  }

  if (!localDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) connectionError();
    localDb = drizzle(new Pool({ connectionString, connectionTimeoutMillis: 15000 }));
  }
  return localDb;
}

/** Preserve the existing `import { db } from '@/db'` API throughout the portal. */
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, property) {
    const client = getDb();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
