import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { listingUpsertSchema } from "@/lib/validators";

// GET /api/listings?tier=VIP — public: active premium/VIP/featured listings
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier");

  const now = new Date();
  const listings = await prisma.listing.findMany({
    where: {
      ...(tier ? { tier } : { tier: { not: "STANDARD" } }),
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    orderBy: [{ tier: "desc" }, { createdAt: "desc" }],
    include: {
      product: {
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          category: { select: { slug: true } },
        },
      },
    },
  });

  return Response.json({
    listings: listings
      .filter((l) => l.product.status === "ACTIVE")
      .map((l) => ({
        tier: l.tier,
        product: {
          id: l.product.id,
          slug: l.product.slug,
          title: l.product.titleAz,
          price: l.product.price,
          coverImage: l.product.images[0]?.url || null,
          category: l.product.category.slug,
        },
      })),
  });
}

// POST /api/listings — Store/Farmer promotes their own product; Admin can promote any
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = listingUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { productId, tier, endDate, autoRenew } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });

  const isOwner = product.sellerId === authUser.sub;
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Note: payment capture for paid tiers happens in Phase 5 (Commerce).
  // This creates/updates the listing record; billing hook attaches there.
  const listing = await prisma.listing.upsert({
    where: { productId },
    update: { tier, endDate: endDate ? new Date(endDate) : null, autoRenew: !!autoRenew },
    create: {
      productId,
      tier,
      endDate: endDate ? new Date(endDate) : null,
      autoRenew: !!autoRenew,
    },
  });

  return Response.json({ listing }, { status: 201 });
}
