import { prisma } from "@/lib/prisma";

// GET /api/search/autocomplete?q={term}
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q || q.trim().length < 2) {
    return Response.json({
      products: [],
      ingredients: [],
      diseases: [],
      pests: [],
      companies: []
    });
  }

  const term = q.trim();

  try {
    // Parallel queries to fetch matches
    const [products, ingredients, diseases, pests, stores] = await Promise.all([
      // Products
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { titleAz: { contains: term, mode: "insensitive" } },
            { titleEn: { contains: term, mode: "insensitive" } },
            { titleRu: { contains: term, mode: "insensitive" } }
          ]
        },
        take: 5,
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: { select: { slug: true } }
        }
      }),
      // Active Ingredients
      prisma.activeIngredient.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { nameAz: { contains: term, mode: "insensitive" } }
          ]
        },
        take: 5,
        include: {
          _count: {
            select: { products: true }
          }
        }
      }),
      // Diseases
      prisma.disease.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { nameAz: { contains: term, mode: "insensitive" } }
          ]
        },
        take: 5
      }),
      // Pests
      prisma.pest.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { nameAz: { contains: term, mode: "insensitive" } }
          ]
        },
        take: 5
      }),
      // Companies (Stores)
      prisma.store.findMany({
        where: {
          isActive: true,
          name: { contains: term, mode: "insensitive" }
        },
        take: 5
      })
    ]);

    return Response.json({
      products: products.map(p => ({
        id: p.id,
        titleAz: p.titleAz,
        slug: p.slug,
        coverImage: p.images?.[0]?.url || null,
        price: Number(p.price),
        category: p.category?.slug
      })),
      ingredients: ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        nameAz: ing.nameAz,
        productCount: ing._count.products
      })),
      diseases: diseases.map(d => ({
        id: d.id,
        nameAz: d.nameAz,
        slug: d.slug
      })),
      pests: pests.map(p => ({
        id: p.id,
        nameAz: p.nameAz,
        slug: p.slug
      })),
      companies: stores.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message || "Axtarış xətası" }, { status: 500 });
  }
}
