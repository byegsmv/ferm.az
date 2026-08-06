import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { bundleCreateSchema } from "@/lib/validators";

// GET /api/bundles — public: active bundles with their products.
// If the caller is authenticated as the requested seller (or an admin), also
// include their own inactive bundles so sellers can manage everything they created.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  const authUser = await getAuthUser(request);

  const isAdmin = authUser && (authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN");
  const isOwnerRequest = authUser && sellerId && authUser.sub === sellerId;
  const includeInactive = isAdmin || isOwnerRequest;

  const bundles = await prisma.bundle.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(sellerId ? { sellerId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      seller: { select: { fullName: true } },
    },
  });

  const withPricing = bundles.map((b) => {
    const subtotal = b.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
    const discount =
      b.discountType === "PERCENTAGE" ? (subtotal * Number(b.discountValue)) / 100 : Number(b.discountValue);
    return { ...b, subtotal, finalPrice: Math.max(subtotal - discount, 0) };
  });

  return Response.json({ bundles: withPricing });
}

// POST /api/bundles — farmer/store/admin creates a product bundle deal
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "BUYER"]); // All authenticated users can create bundles
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = bundleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { productIds, ...rest } = parsed.data;

  // All products in the bundle must belong to this seller (unless admin)
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    return Response.json({ error: "Bəzi məhsullar tapılmadı" }, { status: 404 });
  }
  if (!isAdmin && products.some((p) => p.sellerId !== authUser.sub)) {
    return Response.json({ error: "Yalnız öz məhsullarınızla bağlama yarada bilərsiniz" }, { status: 403 });
  }

  const bundle = await prisma.bundle.create({
    data: {
      title: rest.title,
      description: rest.description,
      storeId: rest.storeId,
      discountType: rest.discountType,
      discountValue: rest.discountValue,
      sellerId: isAdmin ? products[0].sellerId : authUser.sub,
      items: { create: productIds.map((productId) => ({ productId, quantity: 1 })) },
    },
    include: { items: { include: { product: true } } },
  });

  return Response.json({ bundle }, { status: 201 });
}
