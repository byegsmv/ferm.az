import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/pests/[slug]?locale=...
export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") || "az").toLowerCase();

  try {
    const pest = await prisma.pest.findUnique({
      where: { slug },
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

    if (!pest) {
      return Response.json({ error: "Zərərverici tapılmadı" }, { status: 404 });
    }

    const mappedProducts = pest.products
      .filter(p => p.product.status === "ACTIVE")
      .map(p => ({
        id: p.product.id,
        slug: p.product.slug,
        title: locale === "en" ? p.product.titleEn || p.product.titleAz : locale === "ru" ? p.product.titleRu || p.product.titleAz : p.product.titleAz,
        price: Number(p.product.price),
        currency: p.product.currency,
        coverImage: p.product.images?.[0]?.url || null,
        store: p.product.store ? { name: p.product.store.name, slug: p.product.store.slug } : null
      }));

    return Response.json({
      pest: {
        id: pest.id,
        slug: pest.slug,
        name: locale === "en" ? pest.name : pest.nameAz,
        nameAz: pest.nameAz,
        nameEn: pest.name,
        images: pest.images,
        affectedCrops: pest.affectedCrops,
        symptoms: pest.symptoms,
        lifecycle: pest.lifecycle,
        prevention: pest.prevention
      },
      products: mappedProducts
    });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// PATCH /api/pests/[slug] — Admin/Super Admin only
export async function PATCH(request, { params }) {
  const { slug } = await params;
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
    const existing = await prisma.pest.findUnique({ where: { slug } });
    if (!existing) {
      return Response.json({ error: "Zərərverici tapılmadı" }, { status: 404 });
    }

    const updated = await prisma.pest.update({
      where: { slug },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        nameAz: body.nameAz !== undefined ? body.nameAz : undefined,
        images: body.images !== undefined ? body.images : undefined,
        affectedCrops: body.affectedCrops !== undefined ? body.affectedCrops : undefined,
        symptoms: body.symptoms !== undefined ? body.symptoms : undefined,
        lifecycle: body.lifecycle !== undefined ? body.lifecycle : undefined,
        prevention: body.prevention !== undefined ? body.prevention : undefined
      }
    });

    return Response.json({ pest: updated });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// DELETE /api/pests/[slug] — Admin/Super Admin only
export async function DELETE(request, { params }) {
  const { slug } = await params;
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const existing = await prisma.pest.findUnique({ where: { slug } });
    if (!existing) {
      return Response.json({ error: "Zərərverici tapılmadı" }, { status: 404 });
    }

    await prisma.pest.delete({ where: { slug } });

    return Response.json({ success: true, message: "Zərərverici silindi" });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
