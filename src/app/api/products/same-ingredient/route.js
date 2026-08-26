import { prisma } from "@/lib/prisma";

// GET /api/products/same-ingredient?productId=xxx
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return Response.json({ error: "productId tələb olunur" }, { status: 400 });
  }

  try {
    // 1. Get active ingredients of this product
    const productIngredients = await prisma.productActiveIngredient.findMany({
      where: { productId },
      select: { activeIngredientId: true }
    });

    const ingredientIds = productIngredients.map(pi => pi.activeIngredientId);
    if (ingredientIds.length === 0) {
      return Response.json({ products: [] });
    }

    // 2. Find other products sharing the same active ingredients
    const sameIngredientProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        id: { not: productId },
        activeIngredients: {
          some: {
            activeIngredientId: { in: ingredientIds }
          }
        }
      },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        store: { select: { name: true, slug: true } },
        activeIngredients: { include: { ingredient: true } }
      },
      orderBy: {
        price: "asc" // cheapest first
      }
    });

    // Helper to calculate cost per hectare
    const getAvgNorm = (normStr) => {
      if (!normStr) return 0;
      const matches = normStr.match(/(\d+(\.\d+)?)/g);
      if (!matches) return 0;
      const nums = matches.map(Number);
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    };

    const mapped = sameIngredientProducts.map(p => {
      const avgNorm = getAvgNorm(p.useNorm);
      const costPerHa = avgNorm > 0 ? Number(p.price) * avgNorm : null;

      return {
        id: p.id,
        slug: p.slug,
        title: p.titleAz,
        price: Number(p.price),
        currency: p.currency,
        packaging: p.packaging,
        coverImage: p.images?.[0]?.url || null,
        store: p.store ? { name: p.store.name, slug: p.store.slug } : null,
        activeIngredients: p.activeIngredients.map(ai => ({
          name: ai.ingredient.nameAz,
          concentration: ai.concentration
        })),
        costPerHectare: costPerHa,
        preparativeForm: p.preparativeForm,
        useNorm: p.useNorm
      };
    });

    return Response.json({ products: mapped });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
