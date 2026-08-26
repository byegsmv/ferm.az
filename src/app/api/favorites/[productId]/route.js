import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// DELETE /api/favorites/:productId — remove a product from the current user's favorites
export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: authUser.sub, productId } },
  });
  if (!existing) return Response.json({ error: "Seçilmişlərdə tapılmadı" }, { status: 404 });

  await prisma.favorite.delete({ where: { id: existing.id } });
  return Response.json({ success: true });
}
