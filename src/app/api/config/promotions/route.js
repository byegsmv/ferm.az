import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export const DEFAULT_PROMOTION_CONFIG = {
  // Elan Paketləri
  tier_1_day: { id: "tier_1_day", name: "1 Günlük Elan", price: 0, days: 1, active: true, type: "LISTING_DURATION", description: "Ödənişsiz sınaq müddəti" },
  tier_15_days: { id: "tier_15_days", name: "15 Günlük Elan", price: 7, days: 15, active: true, type: "LISTING_DURATION", description: "Standart yayımlanma paketi" },
  tier_30_days: { id: "tier_30_days", name: "30 Günlük Elan", price: 15, days: 30, active: true, type: "LISTING_DURATION", description: "Maksimum 30 günlük yayımlanma" },

  // Elan Önə Çıxarma (Product Boost)
  product_featured: { id: "product_featured", name: "Önə Çıxan Elan (FEATURED)", price: 5, days: 7, active: true, type: "PRODUCT_BOOST", description: "Axtarış nəticələrində üst sıralarda görünmə" },
  product_premium: { id: "product_premium", name: "Premium Elan (PREMIUM)", price: 10, days: 14, active: true, type: "PRODUCT_BOOST", description: "Qızılı haşiyə və xüsusi diqqət cəlbedici nişan" },
  product_vip: { id: "product_vip", name: "VIP Vitrin & Baş Səhifə", price: 20, days: 30, active: true, type: "PRODUCT_BOOST", description: "Ana səhifə VIP blokunda və bütün kateqoriyalarda ən üstdə" },
  product_banner: { id: "product_banner", name: "Baş Səhifə Reklam Banneri", price: 30, days: 14, active: true, type: "PRODUCT_BANNER", description: "Ana səhifənin ən yuxarı banner karuselində böyük reklam" },

  // Mağaza Önə Çıxarma (Store Boost)
  store_verified_vip: { id: "store_verified_vip", name: "VIP Təsdiqlənmiş Mağaza", price: 25, days: 30, active: true, type: "STORE_BOOST", description: "Təsdiqlənmiş Göy/Qızıl nişan və mağazalar siyahısında 1-ci sıra" },
  store_banner_ad: { id: "store_banner_ad", name: "Mağaza Vitrin Banner Reklamı", price: 40, days: 30, active: true, type: "STORE_BANNER", description: "Bütün platformada eksklüziv mağaza tərəfdaş banneri" },
};

// GET /api/config/promotions — public list of all active promotion pricing
export async function GET() {
  try {
    const block = await prisma.dynamicBlock.findFirst({
      where: { key: "promotion_pricing_config" },
    });

    const pricing = block?.props ? { ...DEFAULT_PROMOTION_CONFIG, ...block.props } : DEFAULT_PROMOTION_CONFIG;
    return Response.json({ success: true, promotions: pricing });
  } catch (error) {
    console.error("GET /api/config/promotions error:", error);
    return Response.json({ success: true, promotions: DEFAULT_PROMOTION_CONFIG });
  }
}

// PATCH /api/config/promotions — Admin / Super Admin to customize any price and toggle active status
export async function PATCH(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const currentBlock = await prisma.dynamicBlock.findFirst({
      where: { key: "promotion_pricing_config" },
    });

    const merged = {
      ...(currentBlock?.props || DEFAULT_PROMOTION_CONFIG),
      ...body,
    };

    const saved = await prisma.dynamicBlock.upsert({
      where: { key: "promotion_pricing_config" },
      update: { props: merged, updatedAt: new Date() },
      create: {
        key: "promotion_pricing_config",
        type: "pricing_config",
        props: merged,
      },
    });

    // Also sync with listing_pricing_config for backward compatibility
    await prisma.dynamicBlock.upsert({
      where: { key: "listing_pricing_config" },
      update: {
        props: {
          tier_1_day: merged.tier_1_day,
          tier_15_days: merged.tier_15_days,
          tier_30_days: merged.tier_30_days,
        },
        updatedAt: new Date(),
      },
      create: {
        key: "listing_pricing_config",
        type: "pricing_config",
        props: {
          tier_1_day: merged.tier_1_day,
          tier_15_days: merged.tier_15_days,
          tier_30_days: merged.tier_30_days,
        },
      },
    });

    return Response.json({ success: true, promotions: saved.props });
  } catch (error) {
    console.error("PATCH /api/config/promotions error:", error);
    return Response.json({ error: "Qiymətlər yadda saxlanılmadı" }, { status: 500 });
  }
}
