import { Pool } from "pg";

// Reaproveita a conexão entre hot-reloads em dev e entre invocações em prod
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
