import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { storeUpdateSchema } from "@/lib/validators";

async function findStore(id, authUser = null) {
  const targetId = id === "me" && authUser ? authUser.sub : id;
  return prisma.store.findFirst({
    where: { OR: [{ id: targetId }, { slug: targetId }, { ownerId: targetId }] },
  });
}

export async function GET(request, { params }) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  const store = await findStore(id, authUser);

  const isStaffOrOwner =
    authUser &&
    store &&
    (store.ownerId === authUser.sub || ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role));

  if (!store || (!store.isActive && !isStaffOrOwner)) {
    return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: { storeId: store.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      titleAz: true,
      price: true,
      currency: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });

  const ratingAgg = await prisma.review.aggregate({
    where: { product: { storeId: store.id } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return Response.json({
    store,
    products,
    rating: {
      average: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(2)) : null,
      count: ratingAgg._count.rating,
    },
  });
}

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await findStore(id, authUser);
  if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });

  const isOwner = store.ownerId === authUser.sub;
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
  if (!isOwner && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  // Only admin/moderator may toggle verification / active state directly via extra fields
  const extra = {};
  if (isAdmin) {
    if (typeof body.isVerified === "boolean") extra.isVerified = body.isVerified;
    if (typeof body.isActive === "boolean") extra.isActive = body.isActive;
  }

  const parsed = storeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: { ...parsed.data, ...extra },
  });

  return Response.json({ store: updated });
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const store = await findStore(id, authUser);
    if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });

    const isOwner = store.ownerId === authUser.sub;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
    if (!isOwner && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    // Transactional cleanup: explicitly delete dependent records that might
    // block deletion, even though schema relations mostly use Cascade/SetNull.
    // This is a safety net in case of schema drift or missed relations.
    await prisma.$transaction([
      prisma.storeSubscription.deleteMany({ where: { storeId: store.id } }),
      prisma.storeFollow.deleteMany({ where: { storeId: store.id } }),
      prisma.salesPoint.deleteMany({ where: { storeId: store.id } }),
      prisma.campaign.deleteMany({ where: { storeId: store.id } }),
      // Products: set storeId to null instead of deleting them
      prisma.product.updateMany({ where: { storeId: store.id }, data: { storeId: null } }),
      // Users with storeId pointing to this store: set to null
      prisma.user.updateMany({ where: { storeId: store.id }, data: { storeId: null } }),
      // Now safe to delete the store
      prisma.store.delete({ where: { id: store.id } }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/stores/[id] error:", error);
    if (error.code === "P2003") {
      return Response.json({
        error: "Bu mağaza sifariş/məhsul məlumatları ilə əlaqəlidir. Əlaqəli məlumatlar təmizlənərək yenidən cəhd edin."
      }, { status: 409 });
    }
    return Response.json({ error: `Server xətası: ${error.message || "naməlum"}` }, { status: 500 });
  }
}
