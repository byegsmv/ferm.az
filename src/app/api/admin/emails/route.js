import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "inbox";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  let where = {};
  if (filter === "unread") {
    where = { isDeleted: false, isRead: false };
  } else if (filter === "starred") {
    where = { isDeleted: false, isStarred: true };
  } else if (filter === "deleted") {
    where = { isDeleted: true };
  } else {
    where = { isDeleted: false };
  }

  const [emails, total] = await Promise.all([
    prisma.incomingEmail.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.incomingEmail.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return Response.json({ emails, total, page, limit, totalPages });
}
