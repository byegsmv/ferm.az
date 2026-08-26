import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/active-ingredients?q=...&locale=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const locale = (searchParams.get("locale") || "az").toLowerCase();

  try {
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nameAz: { contains: q, mode: "insensitive" } },
            { cas: { contains: q, mode: "insensitive" } }
          ]
        }
      : {};

    const ingredients = await prisma.activeIngredient.findMany({
      where,
      orderBy: { nameAz: "asc" },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    const mapped = ingredients.map(ing => ({
      id: ing.id,
      name: locale === "en" ? ing.name : ing.nameAz,
      nameAz: ing.nameAz,
      nameEn: ing.name,
      cas: ing.cas,
      group: ing.group,
      description: ing.description,
      productCount: ing._count.products
    }));

    return Response.json({ activeIngredients: mapped });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// POST /api/active-ingredients — Admin/Super Admin only
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { name, nameAz, cas, group, description } = body;
  if (!name || !nameAz) {
    return Response.json({ error: "Ad (name və nameAz) tələb olunur" }, { status: 422 });
  }

  try {
    const existing = await prisma.activeIngredient.findFirst({
      where: {
        OR: [
          { name },
          { nameAz }
        ]
      }
    });

    if (existing) {
      return Response.json({ error: "Bu aktiv maddə artıq mövcuddur" }, { status: 409 });
    }

    const ingredient = await prisma.activeIngredient.create({
      data: { name, nameAz, cas, group, description }
    });

    return Response.json({ ingredient }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
