import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import slugify from "slugify";

// GET /api/pests?q=...&locale=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const locale = (searchParams.get("locale") || "az").toLowerCase();

  try {
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nameAz: { contains: q, mode: "insensitive" } }
          ]
        }
      : {};

    const pests = await prisma.pest.findMany({
      where,
      orderBy: { nameAz: "asc" }
    });

    const mapped = pests.map(p => ({
      id: p.id,
      slug: p.slug,
      name: locale === "en" ? p.name : p.nameAz,
      nameAz: p.nameAz,
      nameEn: p.name,
      images: p.images,
      affectedCrops: p.affectedCrops,
      symptoms: p.symptoms,
      lifecycle: p.lifecycle,
      prevention: p.prevention
    }));

    return Response.json({ pests: mapped });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// POST /api/pests — Admin/Super Admin only
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

  const { name, nameAz, images, affectedCrops, symptoms, lifecycle, prevention } = body;
  if (!name || !nameAz) {
    return Response.json({ error: "Ad (name və nameAz) tələb olunur" }, { status: 422 });
  }

  try {
    const slug = slugify(nameAz, { lower: true, strict: true });
    const existing = await prisma.pest.findUnique({ where: { slug } });
    if (existing) {
      return Response.json({ error: "Bu zərərverici artıq mövcuddur" }, { status: 409 });
    }

    const pest = await prisma.pest.create({
      data: {
        name,
        nameAz,
        slug,
        images: images || [],
        affectedCrops: affectedCrops || [],
        symptoms,
        lifecycle,
        prevention
      }
    });

    return Response.json({ pest }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
