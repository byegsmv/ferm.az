import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/calculator-logs
export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const logs = await prisma.calculatorSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return Response.json({ logs });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
