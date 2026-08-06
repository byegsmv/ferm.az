import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/farmer/stats — farmer/store dashboard overview
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !['FARMER', 'STORE', 'AGRONOMIST', 'SUPER_ADMIN', 'ADMIN'].includes(authUser.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sellerId = authUser.sub;

  const [activeListings, totalListings, wallet, allOrders, reviews] = await Promise.all([
    prisma.product.count({ where: { sellerId, status: 'ACTIVE' } }),
    prisma.product.count({ where: { sellerId } }),
    prisma.wallet.findUnique({
      where: { userId: sellerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    }),
    prisma.order.findMany({
      where: { items: { some: { product: { sellerId } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        buyer: { select: { fullName: true } },
        items: {
          where: { product: { sellerId } },
          select: {
            quantity: true,
            unitPrice: true,
            product: { select: { titleAz: true, slug: true } },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: { product: { sellerId }, isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { fullName: true } },
        product: { select: { titleAz: true, slug: true } },
      },
    }),
  ]);

  // Monthly orders (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthlyOrders = allOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);

  // Monthly revenue chart (last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const nextMonth = new Date(d);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const month = d.toLocaleString('az-AZ', { month: 'short', year: '2-digit' });
    const monthDelivered = allOrders.filter(o => {
      const oc = new Date(o.createdAt);
      return oc >= d && oc < nextMonth && o.status === 'DELIVERED';
    });
    const revenue = monthDelivered.reduce((s, o) => s + Number(o.totalAmount), 0);
    monthlyRevenue.push({ month, revenue, count: monthDelivered.length });
  }

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const totalRevenue = wallet ? Number(wallet.balance) : 0;

  // Product performance
  const productMap = {};
  allOrders.forEach(order => {
    order.items.forEach(item => {
      const title = item.product?.titleAz || 'Silinmiş məhsul';
      if (!productMap[title]) productMap[title] = { title, sold: 0, revenue: 0 };
      productMap[title].sold += item.quantity;
      productMap[title].revenue += Number(item.unitPrice) * item.quantity;
    });
  });
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return Response.json({
    totalRevenue,
    activeListings,
    totalListings,
    monthlyOrderCount: monthlyOrders.length,
    avgRating,
    recentOrders: allOrders.slice(0, 10),
    recentReviews: reviews,
    wallet: wallet ? { balance: wallet.balance, transactions: wallet.transactions } : { balance: 0, transactions: [] },
    monthlyRevenue,
    topProducts,
  });
}
// Build: 20260720_102112
