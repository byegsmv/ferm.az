import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/reviews?filter=pending|approved|all
export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "pending";

  const where =
    filter === "pending"
      ? { isApproved: false }
      : filter === "approved"
      ? { isApproved: true }
      : {};

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      author: { select: { id: true, fullName: true, email: true } },
      product: { select: { id: true, titleAz: true, slug: true } },
    },
  });

  return Response.json({ reviews });
}
