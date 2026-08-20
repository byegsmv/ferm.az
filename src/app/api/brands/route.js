import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { brandCreateSchema } from "@/lib/validators";
import slugify from "slugify";

// GET /api/brands — public list of active brands (or all with ?all=true)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const withProducts = searchParams.get("withProducts") === "true";

  const brands = await prisma.brand.findMany({
    where: all ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: withProducts ? { _count: { select: { products: { where: { status: "ACTIVE" } } } } } : false,
  });

  return Response.json({ brands });
}

// POST /api/brands — admin only
export async function POST(request) {
  const user = await requireRole(request, ["ADMIN", "SUPER_ADMIN"]);
  if (user.error) return Response.json({ error: user.error }, { status: user.status || 403 });

  try {
    const body = await request.json();
    const parsed = brandCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, country, website, description, logoUrl, isActive, sortOrder } = parsed.data;
    const slug = slugify(name, { lower: true, strict: true });

    const brand = await prisma.brand.create({
      data: { name, slug, country, website, description, logoUrl, isActive, sortOrder },
    });

    return Response.json({ brand }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return Response.json({ error: "Bu brend artıq mövcuddur" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
