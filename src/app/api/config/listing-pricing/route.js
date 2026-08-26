import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export const DEFAULT_LISTING_PRICING = {
  tier_1_day: { days: 1, price: 0, label: "1 Günlük", description: "Ödənişsiz / Sınaq müddəti", isFree: true },
  tier_15_days: { days: 15, price: 7, label: "15 Günlük", description: "Standart elan paketi (7 ₼)" },
  tier_30_days: { days: 30, price: 15, label: "30 Günlük", description: "Maksimum görünürlük paketi (15 ₼)" },
};

// GET /api/config/listing-pricing — public endpoint to get current listing duration pricing
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "listing_pricing_config" },
    });

    if (setting?.value) {
      try {
        return Response.json({ success: true, pricing: JSON.parse(setting.value) });
      } catch {}
    }

    return Response.json({ success: true, pricing: DEFAULT_LISTING_PRICING });
  } catch (error) {
    console.error("GET /api/config/listing-pricing error:", error);
    return Response.json({ success: true, pricing: DEFAULT_LISTING_PRICING });
  }
}

// PATCH /api/config/listing-pricing — Admin / Super Admin only to customize prices
export async function PATCH(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const currentSetting = await prisma.setting.findUnique({
      where: { key: "listing_pricing_config" },
    });

    let currentVal = DEFAULT_LISTING_PRICING;
    if (currentSetting?.value) {
      try {
        currentVal = JSON.parse(currentSetting.value);
      } catch {}
    }

    const merged = {
      ...currentVal,
      ...body,
    };

    const saved = await prisma.setting.upsert({
      where: { key: "listing_pricing_config" },
      update: { value: JSON.stringify(merged), updatedAt: new Date() },
      create: {
        key: "listing_pricing_config",
        value: JSON.stringify(merged),
        category: "pricing",
      },
    });

    return Response.json({ success: true, pricing: JSON.parse(saved.value) });
  } catch (error) {
    console.error("PATCH /api/config/listing-pricing error:", error);
    return Response.json({ error: "Qiymətlər yadda saxlanılmadı" }, { status: 500 });
  }
}
