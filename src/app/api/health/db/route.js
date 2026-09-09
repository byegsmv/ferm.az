import { prisma, isDbConnectionError } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Database health probe.
 *
 * Reports only whether the database answers, how it is being reached and how
 * long it took. It never returns connection strings, credentials or any row
 * data, so it is safe to call unauthenticated while diagnosing an outage.
 */
export async function GET() {
  const url = process.env.DATABASE_URL || "";
  const configured = /^(postgres|postgresql|prisma):\/\//i.test(url);
  const driver = configured
    ? /\.neon\.tech/i.test(url) && (process.env.PRISMA_NEON_ADAPTER || "").toLowerCase() !== "off"
      ? "neon-serverless (https/websocket:443)"
      : "prisma-tcp (5432)"
    : "none";

  if (!configured) {
    return Response.json(
      { ok: false, configured: false, driver, error: "DATABASE_URL is not configured" },
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
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        configured: true,
        driver,
        latencyMs: Date.now() - startedAt,
        connectionError: isDbConnectionError(error),
        code: error?.code || error?.name || "UNKNOWN",
      },
      { status: 503 }
    );
  }
}
