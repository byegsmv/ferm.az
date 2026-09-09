/**
 * Work out which database URLs this deployment should use.
 *
 * Hosting integrations do not agree on names. Vercel's Neon integration writes
 * DATABASE_URL and DATABASE_URL_UNPOOLED. Other setups write POSTGRES_URL and
 * POSTGRES_URL_NON_POOLING. A hand-configured project writes DIRECT_URL.
 * Prisma's schema reads exactly DATABASE_URL and DIRECT_URL, so map whatever
 * happens to exist onto those two names.
 *
 * An integration-managed unpooled URL deliberately outranks a hand-set
 * DIRECT_URL. A stale DIRECT_URL left pointing at a database that no longer
 * exists is precisely how migrations kept running against a dead server while
 * the connected store sat unused.
 */

const isUrl = (value) => /^(postgres|postgresql|prisma):\/\//i.test(value || "");

function firstUrl(...names) {
  for (const name of names) {
    const value = (process.env[name] || "").trim();
    if (isUrl(value)) return value;
  }
  return "";
}

export function resolveDbEnv() {
  const pooled = firstUrl("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
  const direct =
    firstUrl("DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DIRECT_URL") || pooled;
  return { DATABASE_URL: pooled, DIRECT_URL: direct };
}

/** Applies the resolved values to process.env and reports what was found. */
export function applyDbEnv() {
  const resolved = resolveDbEnv();
  if (resolved.DATABASE_URL) process.env.DATABASE_URL = resolved.DATABASE_URL;
  if (resolved.DIRECT_URL) process.env.DIRECT_URL = resolved.DIRECT_URL;
  return resolved;
}

/** Host and database name only, safe to print in a build log. */
export function describe(url) {
  if (!url) return "not set";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "unparseable";
  }
}
