import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { couponUpdateSchema } from "@/lib/validators";

// PATCH /api/coupons/:id — admin: toggle isActive, edit discount/limits
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Kupon tapılmadı" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = couponUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = { ...parsed.data };

  // Normalize datetime-local strings to full ISO dates
  const normalizeDate = (val) => {
    if (val === null) return null;
    if (val === undefined) return undefined;
    return val.includes("T") && val.length <= 16 ? new Date(val + ":00Z") : new Date(val);
  };

  // If code is being changed, check uniqueness
  if (data.code && data.code !== existing.code) {
    const dup = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (dup) return Response.json({ error: "Bu kupon kodu artıq mövcuddur" }, { status: 409 });
  }

  if (data.startsAt !== undefined) data.startsAt = normalizeDate(data.startsAt);
  if (data.expiresAt !== undefined) data.expiresAt = normalizeDate(data.expiresAt);

  const coupon = await prisma.coupon.update({ where: { id }, data });
  return Response.json({ coupon });
}

// DELETE /api/coupons/:id — admin only
export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Kupon tapılmadı" }, { status: 404 });

  await prisma.coupon.delete({ where: { id } });
  return Response.json({ success: true });
}
