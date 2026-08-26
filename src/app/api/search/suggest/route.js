import { prisma } from "@/lib/prisma";

// GET /api/search/suggest?q={term}
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q || q.trim().length < 2) {
    return Response.json({ suggestions: [] });
  }

  const term = q.trim();

  try {
    const [products, ingredients, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          titleAz: { contains: term, mode: "insensitive" }
        },
        select: { titleAz: true },
        take: 3
      }),
      prisma.activeIngredient.findMany({
        where: {
          nameAz: { contains: term, mode: "insensitive" }
        },
        select: { nameAz: true },
        take: 3
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          nameAz: { contains: term, mode: "insensitive" }
        },
        select: { nameAz: true },
        take: 2
      })
    ]);

    const suggestions = [
      ...products.map(p => p.titleAz),
      ...ingredients.map(i => i.nameAz),
      ...categories.map(c => c.nameAz)
    ];

    // Remove duplicates and limit to 5
    const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 5);

    return Response.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    return Response.json({ suggestions: [] });
  }
}
