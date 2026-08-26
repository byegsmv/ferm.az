import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { walletWithdrawSchema } from "@/lib/validators";

// POST /api/wallet/withdraw — request a withdrawal (goes to PENDING, admin approves)
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = walletWithdrawSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: authUser.sub } });
  if (!wallet || Number(wallet.balance) < parsed.data.amount) {
    return Response.json({ error: "Balans yetərli deyil" }, { status: 422 });
  }

  const [, tx] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: parsed.data.amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "WITHDRAWAL",
        status: "PENDING",
        amount: parsed.data.amount,
        description: parsed.data.note || "Çıxarış tələbi",
      },
    }),
  ]);

  return Response.json({ transaction: tx }, { status: 201 });
}
