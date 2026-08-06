import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/stores/me/stats — dashboard stats for the current user's store
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({
    where: { ownerId: authUser.sub },
    select: { id: true },
  });

  if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });

  const storeId = store.id;

  // Get product counts by status
  const [products, activeProducts, pendingProducts, soldProducts, orders, followers, views] = await Promise.all([
    prisma.product.count({ where: { storeId } }),
    prisma.product.count({ where: { storeId, status: "ACTIVE" } }),
    prisma.product.count({ where: { storeId, status: "PENDING_REVIEW" } }),
    prisma.product.count({ where: { storeId, status: "SOLD" } }),
    prisma.order.findMany({
      where: { items: { some: { product: { storeId } } } },
      select: { id: true, status: true, totalAmount: true, createdAt: true },
    }),
    prisma.storeFollow.count({ where: { storeId } }),
    prisma.store.findUnique({ where: { id: storeId }, select: { storeViewCount: true, totalSales: true } }),
  ]);

  // Calculate revenue from DELIVERED orders
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const ordersCount = orders.length;

  // Recent orders (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentOrders = orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo);

  // Daily revenue for last 7 days
  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const dayOrders = deliveredOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= dayStart && d <= dayEnd;
    });
    dailyRevenue.push({
      date: dayStart.toISOString().split("T")[0],
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      orders: dayOrders.length,
    });
  }

  return Response.json({
    storeId,
    products,
    activeProducts,
    pendingProducts,
    soldProducts,
    ordersCount,
    totalRevenue,
    recentOrdersCount: recentOrders.length,
    followers,
    views: views?.storeViewCount || 0,
    totalSales: views?.totalSales || 0,
    dailyRevenue,
  });
}
