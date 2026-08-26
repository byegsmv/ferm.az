import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { DEFAULT_PROMOTION_CONFIG } from "@/app/api/config/promotions/route";

// POST /api/promotions/boost — user promotes their product or store
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Giriş tələb olunur" }, { status: 401 });

  try {
    const body = await request.json();
    const { targetType, targetId, promotionKey, customBannerUrl } = body;

    if (!targetType || !targetId || !promotionKey) {
      return Response.json({ error: "Məlumatlar tam deyil" }, { status: 400 });
    }

    // Get current promotion config from DB
    const block = await prisma.dynamicBlock.findFirst({
      where: { key: "promotion_pricing_config" },
    });
    const config = block?.props ? { ...DEFAULT_PROMOTION_CONFIG, ...block.props } : DEFAULT_PROMOTION_CONFIG;

    const promo = config[promotionKey];
    if (!promo || promo.active === false) {
      return Response.json({ error: "Bu xidmət hazırda aktiv deyil" }, { status: 400 });
    }

    const price = Number(promo.price) || 0;
    const durationDays = Number(promo.days) || 30;

    // Check ownership & target existence
    let product = null;
    let store = null;
    const isStaff = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);

    if (targetType === "PRODUCT") {
      product = await prisma.product.findUnique({
        where: { id: targetId },
        include: { images: true, category: true },
      });
      if (!product) return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
      if (!isStaff && product.sellerId !== authUser.sub) {
        return Response.json({ error: "Yalnız öz elanınızı önə çıxara bilərsiniz" }, { status: 403 });
      }
    } else if (targetType === "STORE") {
      store = await prisma.store.findUnique({ where: { id: targetId } });
      if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });
      if (!isStaff && store.ownerId !== authUser.sub) {
        return Response.json({ error: "Yalnız öz mağazanızı önə çıxara bilərsiniz" }, { status: 403 });
      }
    } else {
      return Response.json({ error: "Yanlış hədəf tipi" }, { status: 400 });
    }

    // Verify wallet balance if price > 0 and not staff
    if (price > 0 && !isStaff) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: authUser.sub } });
      const currentBalance = Number(wallet?.balance || 0);

      if (!wallet || currentBalance < price) {
        return Response.json(
          {
            error: `Balansınızda kifayət qədər vəsait yoxdur. Tələb olunan: ${price} ₼ (Balansınız: ${currentBalance.toFixed(2)} ₼). Zəhmət olmasa balansınızı artırın.`,
            needTopup: true,
            requiredAmount: price,
            currentBalance,
          },
          { status: 400 }
        );
      }

      // Deduct balance from wallet
      await prisma.wallet.update({
        where: { userId: authUser.sub },
        data: { balance: { decrement: price } },
      });
    }

    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Apply Boost to Product
    if (targetType === "PRODUCT" && product) {
      let tier = "FEATURED";
      if (promotionKey === "product_vip" || promotionKey === "product_banner") tier = "VIP";
      else if (promotionKey === "product_premium") tier = "PREMIUM";

      await prisma.listing.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          tier,
          startDate,
          endDate,
        },
        update: {
          tier,
          startDate,
          endDate,
        },
      });

      // If Banner promotion, create or activate a homepage campaign
      if (promotionKey === "product_banner") {
        await prisma.campaign.create({
          data: {
            title: `Banner Reklamı: ${product.titleAz}`,
            type: "HOMEPAGE_BANNER",
            status: "ACTIVE",
            bannerUrl: customBannerUrl || product.images?.[0]?.url || "/images/default-banner.jpg",
            targetUrl: `/products/${product.slug || product.id}`,
            categoryId: product.categoryId,
            startDate,
            endDate,
            budget: price,
          },
        });
      }
    }

    // Apply Boost to Store
    if (targetType === "STORE" && store) {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          isVerified: true,
          isActive: true,
        },
      });

      if (promotionKey === "store_banner_ad") {
        await prisma.campaign.create({
          data: {
            title: `Mağaza Banner Reklamı: ${store.name}`,
            type: "STORE_PROMOTION",
            status: "ACTIVE",
            bannerUrl: customBannerUrl || store.coverUrl || store.logoUrl || "/images/default-store.jpg",
            targetUrl: `/stores/${store.slug || store.id}`,
            storeId: store.id,
            startDate,
            endDate,
            budget: price,
          },
        });
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.sub,
        action: "PROMOTION_BOOST_ACTIVATED",
        entity: targetType === "PRODUCT" ? "Product" : "Store",
        entityId: targetId,
        metadata: {
          promotionKey,
          price,
          durationDays,
          endDate,
        },
      },
    });

    return Response.json({
      success: true,
      message: `${promo.name} xidməti uğurla aktivləşdirildi! (${durationDays} günlük)`,
      endDate,
    });
  } catch (error) {
    console.error("POST /api/promotions/boost error:", error);
    return Response.json({ error: error.message || "Xidmət aktivləşdirilərkən xəta baş verdi" }, { status: 500 });
  }
}
