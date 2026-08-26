import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "BUYER"]); // All authenticated users can view analytics
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const range = parseInt(searchParams.get("range") || "30", 10);
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const sellerId = authUser.sub;

  const [totalOrders, totalSold, walletData, activeProducts] = await Promise.all([
    prisma.order.count({ where: { items: { some: { sellerId } }, createdAt: { gte: since }, status: { not: "CANCELLED" } } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { sellerId, order: { status: { not: "CANCELLED" }, createdAt: { gte: since } } } }),
    prisma.wallet.findUnique({ where: { userId: sellerId } }),
    prisma.product.findMany({ where: { sellerId, status: "ACTIVE" }, select: { id: true, titleAz: true, stock: true, price: true }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const revenueByProduct = await prisma.$queryRaw`
    SELECT p.title_az AS title,
      SUM(oi.quantity * oi.unit_price)::float AS revenue,
      SUM(oi.quantity)::int AS sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.seller_id = ${sellerId} AND o.status = 'DELIVERED' AND o.created_at >= ${since}
    GROUP BY p.title_az ORDER BY revenue DESC LIMIT 5`;

  const dailySales = await prisma.$queryRaw`
    SELECT DATE(o.created_at AT TIME ZONE 'Asia/Baku') AS day,
      SUM(oi.quantity * oi.unit_price)::float AS revenue,
      COUNT(DISTINCT o.id)::int AS orders
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.seller_id = ${sellerId}
      AND o.status NOT IN ('CANCELLED','REFUNDED')
      AND o.created_at >= ${since}
    GROUP BY day ORDER BY day ASC`;

  return Response.json({
    range,
    summary: { totalOrders, totalSold: totalSold._sum.quantity || 0, walletBalance: walletData ? Number(walletData.balance) : 0 },
    revenueByProduct: revenueByProduct.map(r => ({ title: r.title, revenue: r.revenue, sold: r.sold })),
    dailySales: dailySales.map(r => ({ day: String(r.day).slice(0,10), revenue: r.revenue, orders: r.orders })),
    activeProducts,
  });
}
