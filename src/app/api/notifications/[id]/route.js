import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// PATCH /api/notifications/:id — mark single as read
export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notif = await prisma.notification.findUnique({ where: { id: resolvedParams.id } });
  if (!notif || notif.userId !== authUser.sub) {
    return Response.json({ error: "Tapılmadı" }, { status: 404 });
  }

  await prisma.notification.update({ where: { id: resolvedParams.id }, data: { isRead: true } });
  return Response.json({ success: true });
}

// DELETE /api/notifications/:id
export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notif = await prisma.notification.findUnique({ where: { id: resolvedParams.id } });
  if (!notif || notif.userId !== authUser.sub) {
    return Response.json({ error: "Tapılmadı" }, { status: 404 });
  }

  await prisma.notification.delete({ where: { id: resolvedParams.id } });
  return Response.json({ success: true });
}
