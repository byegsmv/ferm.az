import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  let wallet = await prisma.wallet.findUnique({ where: { userId: id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: id, coins: 0, balance: 0 } });
  }

  const newBalance = body.balance !== undefined ? Number(body.balance) : Number(wallet.balance);
  const newCoins = body.coins !== undefined ? Number(body.coins) : Number(wallet.coins);

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance, coins: newCoins }
  });

  if (newBalance !== Number(wallet.balance) || newCoins !== Number(wallet.coins)) {
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "ADJUSTMENT",
        amount: Math.abs(newBalance - Number(wallet.balance)) + Math.abs(newCoins - Number(wallet.coins)),
        description: "Admin tərəfindən balans/coin dəyişikliyi",
        status: "COMPLETED"
      }
    });
  }

  return Response.json({ success: true, wallet: { ...wallet, balance: newBalance, coins: newCoins } });
}

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let wallet = await prisma.wallet.findUnique({ where: { userId: id } });
  if (!wallet) {
    wallet = { balance: 0, coins: 0 };
  }
  return Response.json({ wallet });
}
