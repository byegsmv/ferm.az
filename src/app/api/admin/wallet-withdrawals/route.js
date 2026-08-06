import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/wallet-withdrawals — list withdrawal requests (default: pending)
export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "PENDING";

  const transactions = await prisma.walletTransaction.findMany({
    where: { type: "WITHDRAWAL", status },
    orderBy: { createdAt: "asc" },
    include: { wallet: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } } },
  });

  return Response.json({ transactions });
}
