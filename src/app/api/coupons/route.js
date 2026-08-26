import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { couponCreateSchema, couponUpdateSchema } from "@/lib/validators";

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ coupons });
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = couponCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) return Response.json({ error: "Bu kupon kodu artıq mövcuddur" }, { status: 409 });

  // Normalize datetime-local strings (e.g. "2026-08-20T15:30") to full ISO dates
  const normalizeDate = (val) => {
    if (!val) return undefined;
    // datetime-local produces "YYYY-MM-DDTHH:mm" without timezone — treat as local UTC
    return val.includes("T") && val.length <= 16 ? new Date(val + ":00Z") : new Date(val);
  };

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue ?? null,
      maxUses: data.maxUses ?? null,
      usedCount: 0,
      isActive: data.isActive ?? true,
      startsAt: normalizeDate(data.startsAt),
      expiresAt: normalizeDate(data.expiresAt),
    },
  });

  return Response.json({ coupon }, { status: 201 });
}
