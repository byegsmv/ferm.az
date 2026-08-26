import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import slugify from "slugify";

// GET /api/crops?locale=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") || "az").toLowerCase();

  try {
    const crops = await prisma.crop.findMany({
      orderBy: { nameAz: "asc" }
    });

    const mapped = crops.map(c => ({
      id: c.id,
      slug: c.slug,
      name: locale === "en" ? c.name : c.nameAz,
      nameAz: c.nameAz,
      nameEn: c.name,
      image: c.image
    }));

    return Response.json({ crops: mapped });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// POST /api/crops — Admin/Super Admin only
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

  const { name, nameAz, image } = body;
  if (!name || !nameAz) {
    return Response.json({ error: "Ad (name və nameAz) tələb olunur" }, { status: 422 });
  }

  try {
    const slug = slugify(nameAz, { lower: true, strict: true });
    const existing = await prisma.crop.findUnique({ where: { slug } });
    if (existing) {
      return Response.json({ error: "Bu bitki növü artıq mövcuddur" }, { status: 409 });
    }

    const crop = await prisma.crop.create({
      data: { name, nameAz, slug, image }
    });

    return Response.json({ crop }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
