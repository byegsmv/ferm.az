import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/diseases/[slug]?locale=...
export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") || "az").toLowerCase();

  try {
    const disease = await prisma.disease.findUnique({
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

    if (!disease) {
      return Response.json({ error: "Xəstəlik tapılmadı" }, { status: 404 });
    }

    const mappedProducts = disease.products
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
      disease: {
        id: disease.id,
        slug: disease.slug,
        name: locale === "en" ? disease.name : disease.nameAz,
        nameAz: disease.nameAz,
        nameEn: disease.name,
        images: disease.images,
        affectedCrops: disease.affectedCrops,
        symptoms: disease.symptoms,
        causes: disease.causes,
        prevention: disease.prevention,
        treatment: disease.treatment
      },
      products: mappedProducts
    });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// PATCH /api/diseases/[slug] — Admin/Super Admin only
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
    const existing = await prisma.disease.findUnique({ where: { slug } });
    if (!existing) {
      return Response.json({ error: "Xəstəlik tapılmadı" }, { status: 404 });
    }

    const updated = await prisma.disease.update({
      where: { slug },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        nameAz: body.nameAz !== undefined ? body.nameAz : undefined,
        images: body.images !== undefined ? body.images : undefined,
        affectedCrops: body.affectedCrops !== undefined ? body.affectedCrops : undefined,
        symptoms: body.symptoms !== undefined ? body.symptoms : undefined,
        causes: body.causes !== undefined ? body.causes : undefined,
        prevention: body.prevention !== undefined ? body.prevention : undefined,
        treatment: body.treatment !== undefined ? body.treatment : undefined
      }
    });

    return Response.json({ disease: updated });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// DELETE /api/diseases/[slug] — Admin/Super Admin only
export async function DELETE(request, { params }) {
  const { slug } = await params;
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const existing = await prisma.disease.findUnique({ where: { slug } });
    if (!existing) {
      return Response.json({ error: "Xəstəlik tapılmadı" }, { status: 404 });
    }

    await prisma.disease.delete({ where: { slug } });

    return Response.json({ success: true, message: "Xəstəlik silindi" });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
