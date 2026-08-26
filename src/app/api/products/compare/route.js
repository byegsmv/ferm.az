import { prisma } from "@/lib/prisma";

// GET /api/products/compare?ids=id1,id2,id3,id4,id5
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam.split(",").filter(id => id.trim().length > 0);

  if (ids.length === 0) {
    return Response.json({ products: [] });
  }

  if (ids.length > 5) {
    return Response.json({ error: "Maksimum 5 məhsul müqayisə edilə bilər" }, { status: 400 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        status: "ACTIVE"
      },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { nameAz: true, slug: true } },
        store: { select: { name: true, slug: true } },
        activeIngredients: { include: { ingredient: true } }
      }
    });

    // Helper to calculate cost per hectare
    const getAvgNorm = (normStr) => {
      if (!normStr) return 0;
      // Match numbers in useNorm like "0.5-1 L/ha" or "2 kg/ha"
      const matches = normStr.match(/(\d+(\.\d+)?)/g);
      if (!matches) return 0;
      const nums = matches.map(Number);
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      return avg;
    };

    const mapped = products.map(p => {
      const avgNorm = getAvgNorm(p.useNorm);
      const costPerHa = avgNorm > 0 ? Number(p.price) * avgNorm : null;

      return {
        id: p.id,
        slug: p.slug,
        title: p.titleAz,
        price: Number(p.price),
        currency: p.currency,
        coverImage: p.images?.[0]?.url || null,
        store: p.store ? { name: p.store.name, slug: p.store.slug } : null,
        activeIngredients: p.activeIngredients.map(ai => ({
          name: ai.ingredient.nameAz,
          concentration: ai.concentration
        })),
        preparativeForm: p.preparativeForm,
        useNorm: p.useNorm,
        costPerHectare: costPerHa,
        waitingPeriod: p.waitingPeriod,
        maxApplications: p.maxApplications,
        countryOfOrigin: p.countryOfOrigin,
        manufacturer: p.manufacturer,
        stock: p.stock,
        wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
        wholesaleMinQty: p.wholesaleMinQty,
        isOrganic: p.isOrganic
      };
    });

    // Increment compareCount for these products asynchronously
    prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { compareCount: { increment: 1 } }
    }).catch(() => {});

    return Response.json({ products: mapped });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
