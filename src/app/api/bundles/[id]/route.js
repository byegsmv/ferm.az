import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { bundleUpdateSchema } from "@/lib/validators";

export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const bundle = await prisma.bundle.findUnique({
    where: { id: resolvedParams.id },
    include: { items: { include: { product: { include: { images: { take: 1 } } } } }, seller: { select: { fullName: true } } },
  });
  if (!bundle) return Response.json({ error: "Bağlama tapılmadı" }, { status: 404 });
  return Response.json({ bundle });
}

export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const bundle = await prisma.bundle.findUnique({ where: { id: resolvedParams.id } });
  if (!bundle) return Response.json({ error: "Bağlama tapılmadı" }, { status: 404 });

  const isOwner = bundle.sellerId === authUser.sub;
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = bundleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { productIds, ...rest } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (productIds) {
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) throw new Error("PRODUCTS_NOT_FOUND");
      if (!isAdmin && products.some((p) => p.sellerId !== authUser.sub)) throw new Error("FORBIDDEN_PRODUCT");
      await tx.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
      await tx.bundleItem.createMany({ data: productIds.map((productId) => ({ bundleId: bundle.id, productId })) });
    }
    return tx.bundle.update({
      where: { id: bundle.id },
      data: rest,
      include: { items: { include: { product: true } } },
    });
  }).catch((err) => {
    if (err.message === "PRODUCTS_NOT_FOUND") return { error: "Bəzi məhsullar tapılmadı", status: 404 };
    if (err.message === "FORBIDDEN_PRODUCT") return { error: "Yalnız öz məhsullarınızla", status: 403 };
    throw err;
  });

  if (updated?.error) return Response.json({ error: updated.error }, { status: updated.status });

  return Response.json({ bundle: updated });
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const bundle = await prisma.bundle.findUnique({ where: { id: resolvedParams.id } });
  if (!bundle) return Response.json({ error: "Bağlama tapılmadı" }, { status: 404 });

  const isOwner = bundle.sellerId === authUser.sub;
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.bundle.delete({ where: { id: bundle.id } });
  return Response.json({ success: true });
}
