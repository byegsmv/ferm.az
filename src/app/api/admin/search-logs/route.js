import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/search-logs
export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const notFoundOnly = searchParams.get("notFoundOnly") === "true";

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: "Search",
        action: notFoundOnly ? "SEARCH_NOT_FOUND" : { in: ["SEARCH_LOG", "SEARCH_NOT_FOUND"] }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return Response.json({ logs });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
