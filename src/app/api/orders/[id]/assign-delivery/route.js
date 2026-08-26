import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const assignSchema = z.object({ deliveryPartnerId: z.string().min(1) });

// PATCH /api/orders/:id/assign-delivery — seller-of-item or admin assigns a DELIVERY_PARTNER
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return Response.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const isSeller = order.items.some((i) => i.sellerId === authUser.sub);
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  if (!isSeller && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!["PAID", "PROCESSING"].includes(order.status)) {
    return Response.json(
      { error: "Yalnız ödənilmiş və ya hazırlanan sifarişlərə çatdırıcı təyin edilə bilər" },
      { status: 409 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "deliveryPartnerId tələb olunur" }, { status: 422 });
  }

  const partner = await prisma.user.findUnique({ where: { id: parsed.data.deliveryPartnerId } });
  if (!partner || partner.role !== "DELIVERY_PARTNER") {
    return Response.json({ error: "Etibarlı çatdırıcı tapılmadı" }, { status: 422 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { deliveryPartnerId: partner.id },
  });

  return Response.json({ order: updated });
}
