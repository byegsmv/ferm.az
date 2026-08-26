import { prisma } from "@/lib/prisma";

// POST /api/listings/:productId/click — increments click counter (CTR analytics)
export async function POST(request, { params }) {
  const { productId } = await params;

  const listing = await prisma.listing.findUnique({ where: { productId } });
  if (!listing) return Response.json({ error: "Listing tapılmadı" }, { status: 404 });

  await prisma.listing.update({
    where: { productId },
    data: { clicks: { increment: 1 } },
  });

  return Response.json({ success: true });
}

import { getAuthUser } from "@/lib/auth";

// DELETE /api/listings/:productId — downgrade back to STANDARD (seller or admin only)
export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });

  const isOwner = product.sellerId === authUser.sub || product.store?.ownerId === authUser.sub;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.listing.findUnique({ where: { productId } });
  if (!existing) return Response.json({ error: "Listing tapılmadı" }, { status: 404 });

  await prisma.listing.update({
    where: { productId },
    data: { tier: "STANDARD", endDate: null, autoRenew: false },
  });

  return Response.json({ success: true });
}
