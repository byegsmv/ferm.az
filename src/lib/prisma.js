import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

/**
 * Prisma connection layer.
 *
 * Production runs on Vercel serverless functions talking to Neon Postgres.
 * The default Prisma engine opens a raw TCP socket to port 5432, which the
 * serverless runtime could not reach ("Can't reach database server at
 * <endpoint>-pooler...:5432") — every DB-backed page and /api/auth/login
 * failed with PrismaClientInitializationError.
 *
 * For Neon URLs we therefore go through the Neon serverless driver, which
 * carries the Postgres protocol over HTTPS/WebSocket on port 443 instead of
 * raw TCP 5432. Any non-Neon URL (local Postgres, Docker compose) keeps the
 * normal TCP client, and if the adapter cannot be built for any reason we
 * fall back to the normal client rather than taking the site down.
 */

const DATABASE_URL = process.env.DATABASE_URL || "";

const isPostgresUrl = () =>
  /^(postgres|postgresql):\/\//i.test(DATABASE_URL) || /^prisma:\/\//i.test(DATABASE_URL);

const isNeonUrl = () => /\.neon\.tech(?::\d+)?\//i.test(DATABASE_URL) || /\.neon\.tech(?::\d+)?$/i.test(DATABASE_URL);

// Opt-out escape hatch: set PRISMA_NEON_ADAPTER=off to force the plain TCP client.
const adapterEnabled = () => (process.env.PRISMA_NEON_ADAPTER || "").toLowerCase() !== "off";

const logLevels = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

/**
 * Offline stub used ONLY when no DATABASE_URL is configured at all (local
 * checkouts, CI without a database). Reads resolve empty so pages can render
 * their mock/fallback content. It is never used to paper over a real database
 * outage — that must surface as an error so login reports "DB unreachable"
 * instead of "wrong password".
 */
const createPrismaFallback = () => {
  const createModelProxy = () =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "findMany" || prop === "count") {
            return async () => [];
          }
          if (prop === "findFirst" || prop === "findUnique") {
            return async () => null;
          }
          return async () => null;
        },
      }
    );

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (
          prop === "$disconnect" ||
          prop === "$connect" ||
          prop === "$on" ||
          prop === "$transaction" ||
          prop === "$use" ||
          prop === "$extends" ||
          prop === "$queryRaw" ||
          prop === "$queryRawUnsafe" ||
          prop === "$executeRaw" ||
          prop === "$executeRawUnsafe"
        ) {
          return async () => null;
        }
        return createModelProxy();
      },
    }
  );
};

const createNeonClient = () => {
  // Node has no built-in WebSocket the Neon driver can use across all runtimes.
  neonConfig.webSocketConstructor = ws;
  // Single (non-transactional) queries travel over plain HTTPS fetch, which is
  // the cheapest and most reliable path on serverless.
  neonConfig.poolQueryViaFetch = true;

  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter, log: logLevels });
};

const createClient = () => {
  if (!isPostgresUrl()) {
    console.warn("DATABASE_URL is missing or invalid; using offline Prisma stub (no database).");
    return createPrismaFallback();
  }

  if (isNeonUrl() && adapterEnabled()) {
    try {
      const client = createNeonClient();
      console.log("Prisma: Neon serverless driver active (HTTPS/WebSocket, port 443).");
      return client;
    } catch (error) {
      console.error("Prisma: Neon adapter unavailable, falling back to TCP client:", error?.message);
    }
  }

  return new PrismaClient({ log: logLevels });
};

// Singleton — prevents multiple PrismaClient instances during Next.js
// hot-reload in development and across warm serverless invocations.
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createClient();
}

export const prisma = globalForPrisma.prisma;

/**
 * True when the error is a connection-level failure (database unreachable),
 * as opposed to a query/validation error. Used by routes that need to tell
 * the user "the database is down" instead of a misleading business error.
 */
export function isDbConnectionError(error) {
  if (!error) return false;
  const name = error.name || "";
  const code = error.code || "";
  const message = error.message || "";
  return (
    name === "PrismaClientInitializationError" ||
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    /Can't reach database server/i.test(message) ||
    /Connection terminated/i.test(message) ||
    /Server has closed the connection/i.test(message)
  );
}

/**
 * Runs a database operation, retrying once after a short pause when the
 * failure is a connection error. Neon computes auto-suspend when idle and the
 * first request after a cold start can be dropped while the compute wakes.
 */
export async function withDbRetry(operation, { retries = 1, delayMs = 600 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isDbConnectionError(error) || attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}
