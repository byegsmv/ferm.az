import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { brandUpdateSchema } from "@/lib/validators";

// GET /api/brands/[id] — public brand detail with products
export async function GET(request, { params }) {
  const resolvedParams = await params;
  const brand = await prisma.brand.findUnique({
    where: { id: resolvedParams.id },
    include: {
      products: {
        where: { status: "ACTIVE" },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!brand) return Response.json({ error: "Brend tapılmadı" }, { status: 404 });
  return Response.json({ brand });
}

// PATCH /api/brands/[id] — admin only
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const resolvedParams = await params;
  const { id } = resolvedParams;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = brandUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Brend tapılmadı" }, { status: 404 });
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json({ brand });
}

// DELETE /api/brands/[id] — admin only
export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const resolvedParams = await params;
  const { id } = resolvedParams;

  const existing = await prisma.brand.findUnique({
    where: { id },
    include: { products: { take: 1 } },
  });
  if (!existing) {
    return Response.json({ error: "Brend tapılmadı" }, { status: 404 });
  }
  if (existing.products.length > 0) {
    return Response.json(
      { error: "Məhsulları olan brend silinə bilməz. Əvvəlcə məhsulları silin və ya başqa brendə köçürün." },
      { status: 409 }
    );
  }

  await prisma.brand.delete({ where: { id } });
  return Response.json({ success: true });
}
