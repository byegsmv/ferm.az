import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// PATCH /api/sales-points/[id]
export async function PATCH(request, { params }) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return Response.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  try {
    const existing = await prisma.salesPoint.findUnique({
      where: { id },
      include: { store: true }
    });

    if (!existing) {
      return Response.json({ error: "Satış nöqtəsi tapılmadı" }, { status: 404 });
    }

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
    if (existing.store.ownerId !== authUser.sub && !isAdmin) {
      return Response.json({ error: "Bu satış nöqtəsini yeniləmək icazəniz yoxdur" }, { status: 403 });
    }

    const updated = await prisma.salesPoint.update({
      where: { id },
      data: {
        region: body.region !== undefined ? body.region : undefined,
        city: body.city !== undefined ? body.city : undefined,
        address: body.address !== undefined ? body.address : undefined,
        lat: body.lat !== undefined ? (body.lat ? Number(body.lat) : null) : undefined,
        lng: body.lng !== undefined ? (body.lng ? Number(body.lng) : null) : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        workHours: body.workHours !== undefined ? body.workHours : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined
      }
    });

    return Response.json({ salesPoint: updated });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// DELETE /api/sales-points/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return Response.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  try {
    const existing = await prisma.salesPoint.findUnique({
      where: { id },
      include: { store: true }
    });

    if (!existing) {
      return Response.json({ error: "Satış nöqtəsi tapılmadı" }, { status: 404 });
    }

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
    if (existing.store.ownerId !== authUser.sub && !isAdmin) {
      return Response.json({ error: "Bu satış nöqtəsini silmək icazəniz yoxdur" }, { status: 403 });
    }

    await prisma.salesPoint.delete({ where: { id } });

    return Response.json({ success: true, message: "Satış nöqtəsi silindi" });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
