import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
    if (denied) return denied;

    const [unread, total, starred] = await Promise.all([
      prisma.incomingEmail.count({ where: { isRead: false, isDeleted: false } }),
      prisma.incomingEmail.count({ where: { isDeleted: false } }),
      prisma.incomingEmail.count({ where: { isStarred: true, isDeleted: false } }),
    ]);

    return Response.json({ unread, total, starred });
  } catch (error) {
    console.error("GET /api/admin/emails/stats error:", error);
    return Response.json(
      { error: "Statistika alınarkən xəta baş verdi: " + error.message },
      { status: 500 }
    );
  }
}
