import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  let email = await prisma.incomingEmail.findUnique({ where: { id } });
  if (!email) {
    return Response.json({ error: "E-poçt tapılmadı" }, { status: 404 });
  }

  if (!email.isRead) {
    email = await prisma.incomingEmail.update({
      where: { id },
      data: { isRead: true },
    });
  }

  return Response.json({ email });
}

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const body = await request.json();

  const updateData = {};
  if (typeof body.isRead === "boolean") updateData.isRead = body.isRead;
  if (typeof body.isStarred === "boolean") updateData.isStarred = body.isStarred;
  if (typeof body.isDeleted === "boolean") updateData.isDeleted = body.isDeleted;

  const email = await prisma.incomingEmail.update({
    where: { id },
    data: updateData,
  });

  return Response.json({ email });
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const email = await prisma.incomingEmail.update({
    where: { id },
    data: { isDeleted: true },
  });

  return Response.json({ success: true, message: "E-poçt silindi", email });
}
