import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { DEFAULT_PROMOTION_CONFIG } from "@/app/api/config/promotions/route";

export async function POST(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { listing: true },
  });

  const isStaff = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
  if (!product || (!isStaff && product.sellerId !== authUser.sub)) {
    return Response.json({ error: "Məhsul tapılmadı və ya sizə aid deyil" }, { status: 404 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {}

  // Fetch dynamic promotion configuration
  const setting = await prisma.setting.findUnique({
    where: { key: "promotion_pricing_config" },
  });
  let config = DEFAULT_PROMOTION_CONFIG;
  if (setting?.value) {
    try {
      config = { ...DEFAULT_PROMOTION_CONFIG, ...JSON.parse(setting.value) };
    } catch {}
  }

  const packageId = body.packageId || body.promotionKey || "product_premium";
  const promo = config[packageId] || config.product_premium;

  if (!promo || promo.active === false) {
    return Response.json({ error: "Bu paket hazırda aktiv deyil" }, { status: 400 });
  }

  const costInAzn = Number(promo.price) || 0;
  const days = Number(promo.days) || 14;
  let tier = "PREMIUM";
  if (packageId.includes("vip") || packageId.includes("banner")) tier = "VIP";
  else if (packageId.includes("featured")) tier = "FEATURED";

  let wallet = await prisma.wallet.findUnique({ where: { userId: authUser.sub } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: authUser.sub, coins: 0, balance: 0 } });
  }

  const costInCoins = costInAzn * 100;

  if (costInAzn > 0 && !isStaff) {
    if (Number(wallet.coins) >= costInCoins) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { coins: { decrement: costInCoins } },
      });
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "COIN_SPEND",
          amount: costInCoins,
          description: `${promo.name} (${days} gün)`,
          status: "COMPLETED",
        },
      });
    } else if (Number(wallet.balance) >= costInAzn) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: costInAzn } },
      });
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "COMMISSION_DEDUCTION",
          amount: costInAzn,
          description: `${promo.name} (${days} gün)`,
          status: "COMPLETED",
        },
      });
    } else {
      return Response.json(
        {
          error: `Balansınızda kifayət qədər vəsait yoxdur. Tələb olunan: ${costInAzn} ₼ (Balansınız: ${Number(wallet.balance).toFixed(2)} ₼).`,
          needTopup: true,
          requiredAmount: costInAzn,
          currentBalance: Number(wallet.balance),
        },
        { status: 400 }
      );
    }
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  await prisma.listing.upsert({
    where: { productId: id },
    update: { tier, endDate },
    create: {
      productId: id,
      tier,
      endDate,
    },
  });

  return Response.json({
    success: true,
    message: `Elan uğurla ${tier} statusuna yüksəldildi! (${days} gün)`,
    endDate,
    tier,
  });
}
