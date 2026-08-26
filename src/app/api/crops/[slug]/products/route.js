import { prisma } from "@/lib/prisma";

// GET /api/crops/[slug]/products?problemType=disease|pest&problemId=...&locale=...
export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const problemType = searchParams.get("problemType"); // "disease" | "pest"
  const problemId = searchParams.get("problemId"); // CUID or slug
  const locale = (searchParams.get("locale") || "az").toLowerCase();

  try {
    const crop = await prisma.crop.findUnique({
      where: { slug }
    });

    if (!crop) {
      return Response.json({ error: "Bitki tapılmadı" }, { status: 404 });
    }

    // Base query: products registered for this crop
    const where = {
      status: "ACTIVE",
      crops: {
        some: {
          cropId: crop.id
        }
      }
    };

    // Filter by specific disease
    if (problemType === "disease" && problemId) {
      where.diseases = {
        some: {
          OR: [
            { diseaseId: problemId },
            { disease: { slug: problemId } }
          ]
        }
      };
    }

    // Filter by specific pest
    if (problemType === "pest" && problemId) {
      where.pests = {
        some: {
          OR: [
            { pestId: problemId },
            { pest: { slug: problemId } }
          ]
        }
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        store: { select: { name: true, slug: true } },
        activeIngredients: { include: { ingredient: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const mapped = products.map(p => ({
      id: p.id,
      slug: p.slug,
      title: locale === "en" ? p.titleEn || p.titleAz : locale === "ru" ? p.titleRu || p.product.titleAz : p.titleAz,
      price: Number(p.price),
      currency: p.currency,
      coverImage: p.images?.[0]?.url || null,
      store: p.store ? { name: p.store.name, slug: p.store.slug } : null,
      activeIngredients: p.activeIngredients.map(ai => ({
        name: ai.ingredient.nameAz,
        concentration: ai.concentration
      }))
    }));

    return Response.json({
      crop: {
        id: crop.id,
        slug: crop.slug,
        name: locale === "en" ? crop.name : crop.nameAz,
        nameAz: crop.nameAz
      },
      products: mapped
    });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
