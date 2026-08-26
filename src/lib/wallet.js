import { prisma } from "@/lib/prisma";

/**
 * Credits a seller's wallet with their net earnings from an order once it
 * reaches DELIVERED. Idempotent per order+seller via the description marker
 * check — call this only on the PENDING/other -> DELIVERED transition.
 */
export async function creditSellerEarningsForOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  // Group items by seller, net of commission
  const bySeller = {};
  for (const item of order.items) {
    const net = Number(item.unitPrice) * item.quantity * (1 - Number(item.commissionRate));
    bySeller[item.sellerId] = (bySeller[item.sellerId] || 0) + net;
  }

  for (const [sellerId, amount] of Object.entries(bySeller)) {
    if (amount <= 0) continue;

    // Skip if already credited for this order+seller (idempotency guard)
    const existing = await prisma.walletTransaction.findFirst({
      where: {
        orderId,
        wallet: { userId: sellerId },
        type: "EARNING",
      },
    });
    if (existing) continue;

    const wallet = await prisma.wallet.upsert({
      where: { userId: sellerId },
      create: { userId: sellerId, balance: 0 },
      update: {},
    });

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "EARNING",
          status: "COMPLETED",
          amount,
          orderId,
          description: `Sifariş #${orderId.slice(-8).toUpperCase()} üzrə qazanc`,
        },
      }),
    ]);
  }
}
