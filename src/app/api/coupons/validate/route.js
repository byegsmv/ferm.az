import { prisma } from "@/lib/prisma";
import { couponValidateSchema } from "@/lib/validators";

// POST /api/coupons/validate — pre-checkout preview (does not consume the coupon)
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = couponValidateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "code və orderSubtotal tələb olunur" }, { status: 422 });
  }

  const { code, orderSubtotal } = parsed.data;
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive) {
    return Response.json({ valid: false, reason: "Kupon tapılmadı" });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return Response.json({ valid: false, reason: "Kuponun müddəti bitib" });
  }
  if (coupon.startsAt && coupon.startsAt > new Date()) {
    return Response.json({ valid: false, reason: "Kupon hələ aktiv deyil" });
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return Response.json({ valid: false, reason: "Kupon limiti dolub" });
  }
  if (coupon.minOrderValue && orderSubtotal < Number(coupon.minOrderValue)) {
    return Response.json({
      valid: false,
      reason: `Minimum sifariş məbləği ${coupon.minOrderValue} AZN olmalıdır`,
    });
  }

  const discount =
    coupon.discountType === "PERCENTAGE"
      ? (orderSubtotal * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);

  return Response.json({
    valid: true,
    discount: Math.min(discount, orderSubtotal),
    discountType: coupon.discountType,
  });
}
