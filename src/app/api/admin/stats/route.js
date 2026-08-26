import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers, activeUsers, newUsersToday, newUsersMonth,
    totalProducts, activeProducts, pendingProducts, rejectedProducts,
    totalOrders, pendingOrders, paidOrders, deliveredOrders,
    totalRevenue, monthRevenue, lastMonthRevenue,
    totalStores, verifiedStores,
    totalReviews, pendingReviews,
    totalWalletBalance,
    recentLogs, activeCampaigns,
    suspendedUsers, bannedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.product.count({ where: { status: "REJECTED" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: thisMonth }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: lastMonth, lt: lastMonthEnd }, status: { not: "CANCELLED" } } }),
    prisma.store.count(),
    prisma.store.count({ where: { isVerified: true } }),
    prisma.review.count(),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { user: { select: { fullName: true, email: true } } },
    }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
  ]);

  const revenueCurrent = Number(monthRevenue._sum.total || 0);
  const revenueLast = Number(lastMonthRevenue._sum.total || 0);
  const revenueGrowth = revenueLast > 0 ? ((revenueCurrent - revenueLast) / revenueLast) * 100 : 0;

  return Response.json({
    stats: {
      users: { total: totalUsers, active: activeUsers, newToday: newUsersToday, newMonth: newUsersMonth, suspended: suspendedUsers, banned: bannedUsers },
      products: { total: totalProducts, active: activeProducts, pending: pendingProducts, rejected: rejectedProducts },
      orders: { total: totalOrders, pending: pendingOrders, paid: paidOrders, delivered: deliveredOrders },
      revenue: {
        total: Number(totalRevenue._sum.total || 0),
        thisMonth: revenueCurrent,
        lastMonth: revenueLast,
        growth: revenueGrowth.toFixed(1),
      },
      stores: { total: totalStores, verified: verifiedStores },
      reviews: { total: totalReviews, pending: pendingReviews },
      wallet: { totalBalance: Number(totalWalletBalance._sum.balance || 0) },
      campaigns: { active: activeCampaigns },
    },
    recentActivity: recentLogs,
  });
}
