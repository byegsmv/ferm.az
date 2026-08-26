import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import ProductCard from "@/components/ProductCard";
import StoreProfilePublic from "@/components/StoreProfilePublic";
import PublicStoreFilters from "@/components/PublicStoreFilters";
import { getServerAuthUser } from "@/lib/auth-server";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const p = await params;
  const store = await prisma.store.findUnique({ where: { slug: p.slug }, select: { name: true, description: true } });
  if (!store) return { title: "Mağaza tapılmadı" };
  return {
    title: `${store.name} | FermerMarket`,
    description: store.description || `${store.name} mağazasının məhsulları`,
  };
}

export default async function StorePage({ params }) {
  const p = await params;

  // Check if visitor is the store owner
  const authUser = await getServerAuthUser();

  const store = await prisma.store.findUnique({
    where: { slug: p.slug },
    include: {
      owner: { select: { id: true, fullName: true, createdAt: true } },
      subscription: { select: { status: true, plan: true } },
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 48,
        include: {
          category: { select: { nameAz: true, slug: true } },
          images: { take: 1, select: { url: true } },
          _count: { select: { reviews: { where: { isApproved: true } } } },
        },
      },
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });

  if (!store) notFound();

  // Check if current user is the owner
  const isOwner = authUser?.sub === store.ownerId;

  // Check if current user follows this store
  let isFollowing = false;
  if (authUser && !isOwner) {
    const follow = await prisma.storeFollow.findUnique({
      where: { storeId_userId: { storeId: store.id, userId: authUser.sub } },
    }).catch(() => null);
    isFollowing = !!follow;
  }

  // Compute store stats — IMPORTANT: scope everything by storeId (store.id), NOT sellerId
  // (store.ownerId). A user can own multiple stores (ownedStores[]), so filtering by the
  // owner's user id would leak product/sales/review counts from their OTHER stores into
  // this store's profile. Products are linked to a specific store via product.storeId.
  const [deliveredOrders, avgRating, totalProducts, activeProducts, passiveProducts, archivedProducts, draftProducts, outOfStock] = await Promise.all([
    prisma.orderItem.count({ where: { product: { storeId: store.id }, order: { status: "DELIVERED" } } }),
    prisma.review.aggregate({ where: { product: { storeId: store.id }, isApproved: true }, _avg: { rating: true } }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.product.count({ where: { storeId: store.id, status: "ACTIVE" } }),
    prisma.product.count({ where: { storeId: store.id, status: "EXPIRED" } }),
    prisma.product.count({ where: { storeId: store.id, status: "REJECTED" } }),
    prisma.product.count({ where: { storeId: store.id, status: "DRAFT" } }),
    prisma.product.count({ where: { storeId: store.id, stock: { lte: 0 } } }),
  ]);

  const rating = avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : null;
  const memberSince = new Date(store.owner.createdAt).getFullYear();
  const isPremium = store.subscription?.status === "ACTIVE" && store.subscription?.plan !== "FREE";

  const stats = {
    rating,
    activeProducts,
    totalProducts,
    passiveProducts,
    archivedProducts,
    draftProducts,
    outOfStock,
    totalSales: deliveredOrders,
    viewCount: store.storeViewCount || 0,
    followerCount: store.followerCount || 0,
    memberSince,
    isPremium,
  };

  const storeUrl = `https://fermermarket.vercel.app/az/stores/${store.slug}`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
      <StoreProfilePublic
        store={store}
        stats={stats}
        isOwner={isOwner}
        isFollowing={isFollowing}
        storeUrl={storeUrl}
      />

      {/* Products section */}
      <h2 className="font-bold text-gray-900 mb-4 text-lg">
        Aktiv Elanlar ({store._count.products})
      </h2>
      {store.products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">Bu mağazada aktiv elan yoxdur</p>
          {isOwner && (
            <Link href="/dashboard" className="btn-primary !py-2 !px-4 text-sm mt-4 inline-block">
              Elan əlavə et
            </Link>
          )}
        </div>
      ) : (
        <PublicStoreFilters products={store.products} storeSlug={store.slug} />
      )}
    </main>
  );
}
