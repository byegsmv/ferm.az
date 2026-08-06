import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/active-ingredients/[id]?locale=...
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") || "az").toLowerCase();

  try {
    const ingredient = await prisma.activeIngredient.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
                store: { select: { name: true, slug: true } }
              }
            }
          }
        }
      }
    });

    if (!ingredient) {
      return Response.json({ error: "Aktiv maddə tapılmadı" }, { status: 404 });
    }

    const mappedProducts = ingredient.products
      .filter(p => p.product.status === "ACTIVE")
      .map(p => ({
        id: p.product.id,
        slug: p.product.slug,
        title: locale === "en" ? p.product.titleEn || p.product.titleAz : locale === "ru" ? p.product.titleRu || p.product.titleAz : p.product.titleAz,
        price: Number(p.product.price),
        currency: p.product.currency,
        coverImage: p.product.images?.[0]?.url || null,
        store: p.product.store ? { name: p.product.store.name, slug: p.product.store.slug } : null,
        concentration: p.concentration
      }));

    return Response.json({
      activeIngredient: {
        id: ingredient.id,
        name: locale === "en" ? ingredient.name : ingredient.nameAz,
        nameAz: ingredient.nameAz,
        nameEn: ingredient.name,
        cas: ingredient.cas,
        group: ingredient.group,
        description: ingredient.description
      },
      products: mappedProducts
    });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// PATCH /api/active-ingredients/[id] — Admin/Super Admin only
export async function PATCH(request, { params }) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  try {
    const existing = await prisma.activeIngredient.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Aktiv maddə tapılmadı" }, { status: 404 });
    }

    const updated = await prisma.activeIngredient.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        nameAz: body.nameAz !== undefined ? body.nameAz : undefined,
        cas: body.cas !== undefined ? body.cas : undefined,
        group: body.group !== undefined ? body.group : undefined,
        description: body.description !== undefined ? body.description : undefined
      }
    });

    return Response.json({ ingredient: updated });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// DELETE /api/active-ingredients/[id] — Admin/Super Admin only
export async function DELETE(request, { params }) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const existing = await prisma.activeIngredient.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Aktiv maddə tapılmadı" }, { status: 404 });
    }

    await prisma.activeIngredient.delete({ where: { id } });

    return Response.json({ success: true, message: "Aktiv maddə silindi" });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
