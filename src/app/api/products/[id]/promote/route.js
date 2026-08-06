import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { listing: true }
  });

  if (!product || product.sellerId !== authUser.sub) {
    return Response.json({ error: "Not found or not yours" }, { status: 404 });
  }

  let body = {};
  try {
     body = await request.json();
  } catch(e) {}

  const PACKAGES = {
    "1": { days: 1, costAzn: 1, costCoins: 100 },
    "2": { days: 15, costAzn: 5, costCoins: 500 },
    "3": { days: 10, costAzn: 10, costCoins: 1000 }
  };

  const packageId = body.packageId || "1";
  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return Response.json({ error: "Yanlış paket seçimi" }, { status: 400 });
  }

  const tier = "PREMIUM";
  const days = pkg.days;
  const costInCoins = pkg.costCoins;
  const costInAzn = pkg.costAzn;
  let wallet = await prisma.wallet.findUnique({ where: { userId: authUser.sub } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: authUser.sub, coins: 0, balance: 0 } });
  }

  if (Number(wallet.coins) >= costInCoins) {
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { coins: { decrement: costInCoins } }
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "COIN_SPEND",
        amount: costInCoins,
        description: `Premium elan (${days} gün)`,
        status: "COMPLETED"
      }
    });
  } else if (Number(wallet.balance) >= costInAzn) {
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: costInAzn } }
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "COMMISSION_DEDUCTION",
        amount: costInAzn,
        description: `Premium elan (${days} gün)`,
        status: "COMPLETED"
      }
    });
  } else {
    return Response.json({ error: "Balansınızda kifayət qədər Coin və ya AZN yoxdur." }, { status: 400 });
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  await prisma.listing.upsert({
    where: { productId: id },
    update: { tier, endDate },
    create: {
      productId: id,
      tier,
      endDate
    }
  });

  return Response.json({ success: true, message: "Elan Premium edildi" });
}
