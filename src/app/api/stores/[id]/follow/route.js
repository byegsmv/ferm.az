import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/stores/[id]/follow — toggle follow/unfollow for the logged-in user.
// Returns { following: boolean, followerCount: number }.
export async function POST(request, { params }) {
  const p = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findUnique({ where: { id: p.id }, select: { id: true, ownerId: true } });
  if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });

  if (store.ownerId === authUser.sub) {
    return Response.json({ error: "Öz mağazanızı izləyə bilməzsiniz" }, { status: 400 });
  }

  const existing = await prisma.storeFollow.findUnique({
    where: { storeId_userId: { storeId: store.id, userId: authUser.sub } },
  });

  let following;
  let updatedStore;

  if (existing) {
    await prisma.storeFollow.delete({ where: { id: existing.id } });
    updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { followerCount: { decrement: 1 } },
      select: { followerCount: true },
    });
    following = false;
  } else {
    await prisma.storeFollow.create({ data: { storeId: store.id, userId: authUser.sub } });
    updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { followerCount: { increment: 1 } },
      select: { followerCount: true },
    });
    following = true;
  }

  return Response.json({ following, followerCount: Math.max(0, updatedStore.followerCount) });
}

// GET /api/stores/[id]/follow — is the current user following this store?
export async function GET(request, { params }) {
  const p = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ following: false });

  const existing = await prisma.storeFollow.findUnique({
    where: { storeId_userId: { storeId: p.id, userId: authUser.sub } },
  });
  return Response.json({ following: !!existing });
}
