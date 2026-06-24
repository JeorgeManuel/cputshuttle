import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

// In Vercel/Next.js, using a singleton Pool avoids exhausting connections.
const globalForPool = globalThis as unknown as { __pool?: Pool };

export const pool: Pool =
  globalForPool.__pool ??
  new Pool({
    connectionString,
    ssl: connectionString ? { rejectUnauthorized: true } : undefined,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
  });


if (!globalForPool.__pool) {
  globalForPool.__pool = pool;
}

export async function query<T>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!connectionString) {
    throw new Error(
      "Missing Postgres connection string. Set POSTGRES_URL (recommended) or DATABASE_URL in Vercel environment variables."
    );
  }
  const res = await pool.query(text, params);
  return res.rows as T[];
}

