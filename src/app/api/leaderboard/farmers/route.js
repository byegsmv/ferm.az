import { prisma } from "@/lib/prisma";

// GET /api/leaderboard/farmers?period=month — "Ayın fermeri": top farmers
// ranked by delivered-order revenue in the period, with their avg rating.
// Computed live (no cached table) — fine at current data volume; revisit
// with a materialized snapshot only if this ever gets slow at scale.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";

  const since = new Date();
  if (period === "week") since.setDate(since.getDate() - 7);
  else since.setMonth(since.getMonth() - 1);

  const items = await prisma.orderItem.findMany({
    where: { order: { status: "DELIVERED", updatedAt: { gte: since } } },
    select: { sellerId: true, unitPrice: true, quantity: true },
  });

  const bySeller = {};
  for (const item of items) {
    const revenue = Number(item.unitPrice) * item.quantity;
    bySeller[item.sellerId] = (bySeller[item.sellerId] || 0) + revenue;
  }

  const sellerIds = Object.keys(bySeller);
  if (!sellerIds.length) return Response.json({ period, leaderboard: [] });

  const [sellers, reviewAggs] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, fullName: true, role: true, store: { select: { name: true, slug: true, logoUrl: true } } },
    }),
    prisma.review.groupBy({
      by: ["productId"],
      where: { product: { sellerId: { in: sellerIds } } },
      _avg: { rating: true },
    }),
  ]);

  // Map productId -> sellerId to fold review averages up to seller level
  const products = await prisma.product.findMany({
    where: { sellerId: { in: sellerIds } },
    select: { id: true, sellerId: true },
  });
  const sellerOfProduct = Object.fromEntries(products.map((p) => [p.id, p.sellerId]));
  const ratingSum = {};
  const ratingCount = {};
  for (const agg of reviewAggs) {
    const sellerId = sellerOfProduct[agg.productId];
    if (!sellerId || agg._avg.rating == null) continue;
    ratingSum[sellerId] = (ratingSum[sellerId] || 0) + agg._avg.rating;
    ratingCount[sellerId] = (ratingCount[sellerId] || 0) + 1;
  }

  const leaderboard = sellers
    .map((s) => ({
      sellerId: s.id,
      fullName: s.fullName,
      storeName: s.store?.name || null,
      storeSlug: s.store?.slug || null,
      revenue: Number(bySeller[s.id].toFixed(2)),
      avgRating: ratingCount[s.id] ? Number((ratingSum[s.id] / ratingCount[s.id]).toFixed(1)) : null,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return Response.json({ period, leaderboard });
}
