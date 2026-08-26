import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { categoryCreateSchema } from "@/lib/validators";

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const p = await params;
  const { id } = p;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = categoryCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Kateqoriya tapılmadı" }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json({ category });
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const p = await params;
  const { id } = p;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { children: true, products: { take: 1 } },
  });
  if (!existing) {
    return Response.json({ error: "Kateqoriya tapılmadı" }, { status: 404 });
  }
  if (existing.children.length > 0) {
    return Response.json(
      { error: "Alt-kateqoriyaları olan kateqoriya silinə bilməz. Əvvəlcə onları silin və ya köçürün." },
      { status: 409 }
    );
  }
  if (existing.products.length > 0) {
    // Soft-deactivate instead of hard delete when products reference it
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return Response.json({
      category,
      note: "Kateqoriyada məhsullar olduğu üçün deaktiv edildi, silinmədi.",
    });
  }

  await prisma.category.delete({ where: { id } });
  return Response.json({ success: true });
}
