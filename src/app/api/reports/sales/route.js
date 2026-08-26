import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

// GET /api/reports/sales?sellerId=&from=&to=&groupBy=day|month
//
// FARMER/STORE: see only their own sales (sellerId forced to self).
// ADMIN/SUPER_ADMIN: platform-wide by default, or ?sellerId=X for a specific seller.
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  const canSell = ["FARMER", "STORE", "ADMIN", "SUPER_ADMIN"].includes(authUser.role);
  if (!canSell) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const groupBy = searchParams.get("groupBy") === "day" ? "day" : "month";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const requestedSellerId = searchParams.get("sellerId");

  let sellerId = authUser.sub;
  if (isAdmin) {
    // Admin can view a specific seller's report, or platform-wide (sellerId = null → no filter)
    sellerId = requestedSellerId || null;
  }

  const orderDateFilter = {};
  if (fromParam) orderDateFilter.gte = new Date(fromParam);
  if (toParam) orderDateFilter.lte = new Date(toParam);

  const where = {
    order: {
      status: { in: PAID_STATUSES },
      ...(Object.keys(orderDateFilter).length ? { createdAt: orderDateFilter } : {}),
    },
    ...(sellerId ? { sellerId } : {}),
  };

  const items = await prisma.orderItem.findMany({
    where,
    select: {
      quantity: true,
      unitPrice: true,
      commissionRate: true,
      productId: true,
      orderId: true,
      order: { select: { createdAt: true, status: true } },
      product: { select: { titleAz: true, slug: true } },
    },
    take: 10000,
  });

  let totalRevenue = 0;
  let totalCommission = 0;
  let totalUnits = 0;
  const orderIds = new Set();
  const byStatus = {};
  const byProduct = new Map();
  const byPeriod = new Map();

  for (const it of items) {
    const lineTotal = Number(it.unitPrice) * it.quantity;
    const commission = lineTotal * Number(it.commissionRate);
    totalRevenue += lineTotal;
    totalCommission += commission;
    totalUnits += it.quantity;
    orderIds.add(it.orderId);

    byStatus[it.order.status] = (byStatus[it.order.status] || 0) + 1;

    const prodKey = it.productId;
    if (!byProduct.has(prodKey)) {
      byProduct.set(prodKey, { productId: prodKey, title: it.product?.titleAz || "—", slug: it.product?.slug, unitsSold: 0, revenue: 0 });
    }
    const p = byProduct.get(prodKey);
    p.unitsSold += it.quantity;
    p.revenue += lineTotal;

    const d = new Date(it.order.createdAt);
    const period = groupBy === "day"
      ? d.toISOString().slice(0, 10)
      : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    byPeriod.set(period, (byPeriod.get(period) || 0) + lineTotal);
  }

  const topProducts = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const timeseries = [...byPeriod.entries()]
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, revenue]) => ({ period, revenue: Number(revenue.toFixed(2)) }));

  return Response.json({
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCommission: Number(totalCommission.toFixed(2)),
      netEarnings: Number((totalRevenue - totalCommission).toFixed(2)),
      totalOrders: orderIds.size,
      totalUnitsSold: totalUnits,
      avgOrderValue: orderIds.size ? Number((totalRevenue / orderIds.size).toFixed(2)) : 0,
    },
    byStatus,
    topProducts,
    timeseries,
    scope: sellerId ? "seller" : "platform",
  });
}
