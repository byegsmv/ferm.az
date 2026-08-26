import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/admin/users/[id]/modules — modul əlavə et
export async function POST(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN","SUPER_ADMIN"].includes(authUser.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: userId } = await params;
  const body = await request.json();
  const { module } = body;
  if (!module) return Response.json({ error: "module tələb olunur" }, { status: 400 });
  
  try {
    await prisma.userModule.upsert({
      where: { userId_module: { userId, module } },
      create: { userId, module },
      update: {},
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]/modules — modul sil
export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN","SUPER_ADMIN"].includes(authUser.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: userId } = await params;
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { module } = body;
  if (!module) return Response.json({ error: "module tələb olunur" }, { status: 400 });
  
  try {
    await prisma.userModule.delete({
      where: { userId_module: { userId, module } },
    });
    return Response.json({ ok: true });
  } catch (e) {
    // P2025 = not found — ok
    return Response.json({ ok: true });
  }
}
