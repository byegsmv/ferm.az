import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/wallet — own wallet balance + recent transactions
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let wallet = await prisma.wallet.findUnique({
    where: { userId: authUser.sub },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  // Auto-create wallet if it doesn't exist yet
  if (!wallet) {
    try {
      wallet = await prisma.wallet.create({
        data: {
          userId: authUser.sub,
          coins: 0,
          balance: 0,
          currency: "AZN",
        },
        include: {
          transactions: true,
        },
      });
    } catch {
      // Race condition — another request may have created it
      wallet = await prisma.wallet.findUnique({
        where: { userId: authUser.sub },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
      });
    }
  }

  if (!wallet) {
    return Response.json({ wallet: { coins: 0, balance: 0, currency: "AZN", transactions: [] } });
  }

  return Response.json({ wallet });
}

