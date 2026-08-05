import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
    if (denied) return denied;

    const { id } = await params;

    const email = await prisma.incomingEmail.findUnique({
      where: { id },
    });

    if (!email) {
      return Response.json({ error: "E-poçt tapılmadı" }, { status: 404 });
    }

    let updatedEmail = email;
    if (!email.isRead) {
      updatedEmail = await prisma.incomingEmail.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return Response.json({ email: updatedEmail, ...updatedEmail });
  } catch (error) {
    console.error("GET /api/admin/emails/[id] error:", error);
    return Response.json(
      { error: "E-poçt məlumatı alınarkən xəta baş verdi: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.incomingEmail.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json({ error: "E-poçt tapılmadı" }, { status: 404 });
    }

    const updateData = {};
    if (typeof body.isRead === "boolean") updateData.isRead = body.isRead;
    if (typeof body.isStarred === "boolean") updateData.isStarred = body.isStarred;
    if (typeof body.isDeleted === "boolean") updateData.isDeleted = body.isDeleted;

    const updated = await prisma.incomingEmail.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ success: true, email: updated });
  } catch (error) {
    console.error("PATCH /api/admin/emails/[id] error:", error);
    return Response.json(
      { error: "E-poçt yenilənərkən xəta baş verdi: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
    if (denied) return denied;

    const { id } = await params;

    const existing = await prisma.incomingEmail.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json({ error: "E-poçt tapılmadı" }, { status: 404 });
    }

    const updated = await prisma.incomingEmail.update({
      where: { id },
      data: { isDeleted: true },
    });

    return Response.json({ success: true, message: "E-poçt silindi", email: updated });
  } catch (error) {
    console.error("DELETE /api/admin/emails/[id] error:", error);
    return Response.json(
      { error: "E-poçt silinərkən xəta baş verdi: " + error.message },
      { status: 500 }
    );
  }
}
