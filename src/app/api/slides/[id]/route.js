import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function isAdmin(u) { return u && ["SUPER_ADMIN","ADMIN"].includes(u.role); }

export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!isAdmin(authUser)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const slide = await prisma.homepageSlide.update({ where: { id: resolvedParams.id }, data: body });
  return Response.json({ slide });
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!isAdmin(authUser)) return Response.json({ error: "Forbidden" }, { status: 403 });
  await prisma.homepageSlide.delete({ where: { id: resolvedParams.id } });
  return Response.json({ ok: true });
}
