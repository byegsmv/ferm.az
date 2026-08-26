import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/conversations/unread — returns total unread message count for badge
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return Response.json({ count: 0 });

    const count = await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: authUser.sub },
        conversation: {
          OR: [{ buyerId: authUser.sub }, { sellerId: authUser.sub }],
        },
      },
    });

    return Response.json({ count });
  } catch (error) {
    console.error("GET /api/conversations/unread error:", error);
    return Response.json({ count: 0 });
  }
}
