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

/**
 * Hosting integrations do not agree on what to call the connection string.
 * Vercel's Neon integration writes DATABASE_URL, other setups write
 * POSTGRES_URL or POSTGRES_PRISMA_URL. Accept any of them rather than reporting
 * "no database configured" while a perfectly good URL sits under another name.
 */
const readDatabaseUrl = () => {
  for (const name of ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"]) {
    const value = (process.env[name] || "").trim();
    if (/^(postgres|postgresql|prisma):\/\//i.test(value)) return value;
  }
  return "";
};

const DATABASE_URL = readDatabaseUrl();

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
 * Whether a usable database URL is configured at all.
 *
 * When it is not, `prisma` is the offline stub: reads resolve empty and writes
 * resolve null. That is right for a local checkout without a database, but on a
 * deployment it is a trap. A missing DATABASE_URL made the user lookup return
 * nothing, which login reported as "wrong username or password" while the real
 * problem was that the site had no database at all. Callers that would otherwise
 * mistake absence for a business answer must check this first.
 */
export function isDatabaseConfigured() {
  return isPostgresUrl();
}

/**
 * True when the database provider is refusing service because the plan's quota
 * is exhausted. Neon answers its HTTPS SQL endpoint with HTTP 402 and a
 * "exceeded the ... quota" message, and disables the compute so raw TCP
 * connections simply time out. No retry or code change clears this — the plan
 * has to be upgraded or the quota window has to reset.
 */
export function isDbQuotaError(error) {
  const message = error?.message || "";
  return /HTTP status 402/i.test(message) || /exceeded the .*quota/i.test(message);
}

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
    isDbQuotaError(error) ||
    name === "PrismaClientInitializationError" ||
    name === "NeonDbError" ||
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
      // A quota rejection is deterministic — retrying only burns more quota.
      if (isDbQuotaError(error) || !isDbConnectionError(error) || attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}
