import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const addSchema = z.object({ productId: z.string().min(1) });

// GET /api/favorites — current user's favorited products
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: authUser.sub },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          titleAz: true,
          price: true,
          currency: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      },
    },
  });

  return Response.json({ favorites });
}

// POST /api/favorites — toggle product in favorites (if exists, delete; otherwise, add)
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "productId tələb olunur" }, { status: 422 });

  const { productId } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });

  // Toggle logic: əgər varsa sil, yoxdursa əlavə et
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: authUser.sub, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return Response.json({ success: true, action: "removed" });
  } else {
    try {
      const favorite = await prisma.favorite.create({
        data: { userId: authUser.sub, productId },
      });
      return Response.json({ favorite, success: true, action: "added" }, { status: 201 });
    } catch (err) {
      if (err.code === "P2002") {
        return Response.json({ error: "Bu məhsul artıq seçilmişlərdədir", success: true, action: "added" }, { status: 200 });
      }
      throw err;
    }
  }
}
