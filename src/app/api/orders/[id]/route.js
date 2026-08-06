import { createNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import { notifyOrderStatusChange } from "@/lib/email";
import { creditSellerEarningsForOrder } from "@/lib/wallet";
import { sendPushToUser } from "@/lib/push";

const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { titleAz: true, slug: true } } } },
      payment: true,
      coupon: { select: { code: true } },
    },
  });

  if (!order) return Response.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const isBuyer = order.buyerId === authUser.sub;
  const isSeller = order.items.some((i) => i.sellerId === authUser.sub);
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  const isDeliveryPartner = order.deliveryPartnerId === authUser.sub;
  if (!isBuyer && !isSeller && !isAdmin && !isDeliveryPartner) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ order });
}

// PATCH — sellers/admin move fulfillment status forward (PROCESSING → SHIPPED → DELIVERED)
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return Response.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const isSeller = order.items.some((i) => i.sellerId === authUser.sub);
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  const isDeliveryPartner = order.deliveryPartnerId === authUser.sub;
  if (!isSeller && !isAdmin && !isDeliveryPartner) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Yanlış status dəyəri" }, { status: 422 });
  }

  // Payment-gated transitions must go through /pay or the payment webhook, not here
  if (["PAID", "REFUNDED"].includes(parsed.data.status) && !isAdmin) {
    return Response.json(
      { error: "Bu status yalnız ödəniş sistemi tərəfindən dəyişdirilə bilər" },
      { status: 403 }
    );
  }

  // Delivery partners (non-admin/seller) may only move fulfillment forward
  // between SHIPPED and DELIVERED for orders assigned to them.
  if (isDeliveryPartner && !isSeller && !isAdmin) {
    if (!["SHIPPED", "DELIVERED"].includes(parsed.data.status)) {
      return Response.json(
        { error: "Çatdırıcı yalnız 'Göndərilib' və 'Çatdırılıb' statuslarını təyin edə bilər" },
        { status: 403 }
      );
    }
  }

  const wasDelivered = order.status === "DELIVERED";

  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
    include: { buyer: { select: { email: true } } },
  });

  notifyOrderStatusChange({
    to: updated.buyer.email,
    orderId: updated.id,
    orderNumber: updated.id.slice(-8).toUpperCase(),
    status: updated.status,
  }).catch(() => {});

  sendPushToUser(updated.buyerId, {
    title: "Sifariş statusu yeniləndi",
    body: `#${updated.id.slice(-8).toUpperCase()} — ${updated.status}`,
    url: `/dashboard`,
  }).catch(() => {});

  // Credit seller wallets exactly once, on the transition INTO DELIVERED
  if (parsed.data.status === "DELIVERED" && !wasDelivered) {
    creditSellerEarningsForOrder(updated.id).catch((err) =>
      console.error("[wallet] Failed to credit earnings for order", updated.id, err.message)
    );
  }

  // Fire in-app notification to buyer when status changes
  if (body.status && updated.buyerId) {
    const statusLabels = {
      PAID: "Ödənilib", PROCESSING: "Hazırlanır", SHIPPED: "Göndərilib",
      DELIVERED: "Çatdırılıb ✅", CANCELLED: "Ləğv edilib ❌", REFUNDED: "Geri qaytarılıb",
    };
    const label = statusLabels[body.status];
    if (label) {
      createNotification({
        userId: updated.buyerId,
        type: "order_update",
        title: `Sifariş ${label}`,
        body: `#${updated.id.slice(-8)} sifarişinizin statusu yeniləndi: ${label}`,
        link: "/dashboard",
      }).catch(() => {});
    }
  }
  return Response.json({ order: updated });
}
