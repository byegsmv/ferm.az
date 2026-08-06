import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

async function findStore(id, authUser) {
  return prisma.store.findFirst({
    where: { OR: [{ id }, { slug: id }, { ownerId: id }] },
  });
}

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await findStore(id, authUser);
  if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });

  const isOwner = store.ownerId === authUser.sub;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalProducts, activeProducts, draftProducts, expiredProducts,
    soldProducts, outOfStockProducts, totalViewsAgg, totalFavorites,
    totalMessages, totalOrderItems, revenueAgg, ratingAgg
  ] = await Promise.all([
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.product.count({ where: { storeId: store.id, status: "ACTIVE" } }),
    prisma.product.count({ where: { storeId: store.id, status: "DRAFT" } }),
    prisma.product.count({ where: { storeId: store.id, status: "EXPIRED" } }),
    prisma.product.count({ where: { storeId: store.id, status: "SOLD" } }),
    prisma.product.count({ where: { storeId: store.id, stock: { lte: 0 } } }),
    prisma.product.aggregate({ where: { storeId: store.id }, _sum: { viewCount: true } }),
    prisma.favorite.count({ where: { product: { storeId: store.id } } }),
    prisma.conversation.count({ where: { sellerId: store.ownerId } }),
    prisma.orderItem.count({ where: { product: { storeId: store.id } } }),
    prisma.orderItem.aggregate({
      where: { product: { storeId: store.id }, order: { status: "DELIVERED" } },
      _sum: { price: true },
    }),
    prisma.review.aggregate({
      where: { product: { storeId: store.id } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return Response.json({
    totalProducts,
    activeProducts,
    draftProducts,
    expiredProducts,
    soldProducts,
    outOfStockProducts,
    totalViews: totalViewsAgg._sum.viewCount || 0,
    totalFavorites,
    totalMessages,
    totalOrders: totalOrderItems,
    totalRevenue: Number(revenueAgg._sum.price || 0),
    averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(2)) : 0,
    reviewCount: ratingAgg._count.rating,
    followerCount: store.followerCount,
    storeViewCount: store.storeViewCount,
    totalSales: store.totalSales,
  });
}
