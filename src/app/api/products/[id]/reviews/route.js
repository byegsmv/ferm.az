import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { reviewCreateSchema } from "@/lib/validators";

// GET /api/products/:id/reviews — public: only APPROVED reviews shown
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const authUser = await getAuthUser(request);
    const isAdmin = authUser && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);

    // Admin all reviews; public only approved
    const where = { productId: id, ...(isAdmin ? {} : { isApproved: true }) };

    const [reviews, total, agg] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { id: true, fullName: true } } },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where: { productId: id, isApproved: true }, _avg: { rating: true } }),
    ]);

    return Response.json({
      reviews,
      averageRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : null,
      reviewCount: total,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/products/[id]/reviews error:", error);
    return Response.json({ error: "Server xətası" }, { status: 500 });
  }
}

// POST /api/products/:id/reviews — any logged-in user can write; goes to admin moderation
export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return Response.json({ error: "Rəy yazmaq üçün daxil olmalısınız" }, { status: 401 });

    const { id: productId } = await params;
    if (!productId) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });

    // Duplicate check
    const existing = await prisma.review.findUnique({
      where: { productId_authorId: { productId, authorId: authUser.sub } },
    });
    if (existing) {
      return Response.json({ error: "Bu məhsula artıq rəy yazmısınız" }, { status: 409 });
    }

    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 }); }

    const parsed = reviewCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        authorId: authUser.sub,
        isApproved: false, // admin must approve
        ...parsed.data,
      },
      include: { author: { select: { id: true, fullName: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser.sub,
        action: "REVIEW_CREATED",
        entity: "Review",
        entityId: review.id,
        metadata: { productId, rating: review.rating },
      },
    }).catch(() => {});

    return Response.json(
      { review, message: "Rəyiniz admin təsdiqindən sonra yayımlanacaq" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products/[id]/reviews error:", error);
    return Response.json({ error: "Server xətası" }, { status: 500 });
  }
}
