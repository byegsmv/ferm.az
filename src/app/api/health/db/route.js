import { prisma, isDbConnectionError } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Database health probe.
 *
 * Reports only whether the database answers, how it is being reached and how
 * long it took. It never returns connection strings, credentials or any row
 * data, so it is safe to call unauthenticated while diagnosing an outage.
 */
/**
 * Host and database name from a connection string, with the credentials left
 * behind. Knowing which server the deployment is actually pointed at is the
 * first question during an outage, and a hostname is not a secret.
 */
function describeTarget(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return {
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const url = process.env.DATABASE_URL || "";
  const configured = /^(postgres|postgresql|prisma):\/\//i.test(url);
  const target = describeTarget(url);
  const migrationTarget = describeTarget(process.env.DIRECT_URL || "");
  const driver = configured
    ? /\.neon\.tech/i.test(url) && (process.env.PRISMA_NEON_ADAPTER || "").toLowerCase() !== "off"
      ? "serverless (https/websocket:443)"
      : "prisma-tcp (5432)"
    : "none";

  if (!configured) {
    return Response.json(
      {
        ok: false,
        configured: false,
        driver,
        target,
        migrationTarget,
        error: "DATABASE_URL is not configured",
      },
      { status: 503 }
    );
  }

  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      ok: true,
      configured: true,
      driver,
      target,
      migrationTarget,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        configured: true,
        driver,
        target,
        migrationTarget,
        latencyMs: Date.now() - startedAt,
        connectionError: isDbConnectionError(error),
        code: error?.code || error?.name || "UNKNOWN",
      },
      { status: 503 }
    );
  }
}
