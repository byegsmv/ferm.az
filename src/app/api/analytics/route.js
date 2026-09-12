import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/analytics?range=30|90|365
export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const range = parseInt(searchParams.get("range") || "30", 10);
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const dailyOrders = await prisma.$queryRaw`
    SELECT
      DATE("createdAt" AT TIME ZONE 'Asia/Baku') AS day,
      COUNT(*)::int AS orders,
      COALESCE(SUM("total"), 0)::float AS revenue
    FROM "Order"
    WHERE "createdAt" >= ${since}
      AND "status" NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY day ORDER BY day ASC`;

  const topProducts = await prisma.$queryRaw`
    SELECT p.id, p."titleAz" AS title,
      SUM(oi."quantity")::int AS sold,
      SUM(oi."quantity" * oi."unitPrice")::float AS revenue
    FROM "OrderItem" oi
    JOIN "Product" p ON p.id = oi."productId"
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."createdAt" >= ${since} AND o."status" NOT IN ('CANCELLED','REFUNDED')
    GROUP BY p.id, p."titleAz"
    ORDER BY sold DESC LIMIT 10`;

  const topCategories = await prisma.$queryRaw`
    SELECT c."nameAz" AS category,
      COUNT(DISTINCT p.id)::int AS products,
      COALESCE(SUM(oi."quantity"),0)::int AS sold
    FROM "OrderItem" oi
    JOIN "Product" p ON p.id = oi."productId"
    JOIN "Category" c ON c.id = p."categoryId"
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."createdAt" >= ${since} AND o."status" NOT IN ('CANCELLED','REFUNDED')
    GROUP BY c."nameAz" ORDER BY sold DESC LIMIT 8`;

  const dailySignups = await prisma.$queryRaw`
    SELECT DATE("createdAt" AT TIME ZONE 'Asia/Baku') AS day, COUNT(*)::int AS signups
    FROM "User" WHERE "createdAt" >= ${since}
    GROUP BY day ORDER BY day ASC`;

  const [roleBreakdown, orderStatusBreakdown] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true }, where: { createdAt: { gte: since } } }),
  ]);

  return Response.json({
    range,
    dailyOrders: dailyOrders.map(r => ({ day: String(r.day).slice(0,10), orders: r.orders, revenue: r.revenue })),
    dailySignups: dailySignups.map(r => ({ day: String(r.day).slice(0,10), signups: r.signups })),
    topProducts: topProducts.map(r => ({ id: r.id, title: r.title, sold: r.sold, revenue: r.revenue })),
    topCategories: topCategories.map(r => ({ category: r.category, products: r.products, sold: r.sold })),
    roleBreakdown: roleBreakdown.map(r => ({ role: r.role, count: r._count.id })),
    orderStatusBreakdown: orderStatusBreakdown.map(r => ({ status: r.status, count: r._count.id })),
  });
}
