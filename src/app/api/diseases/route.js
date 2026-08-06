import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import slugify from "slugify";

// GET /api/diseases?q=...&locale=...
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

    const diseases = await prisma.disease.findMany({
      where,
      orderBy: { nameAz: "asc" }
    });

    const mapped = diseases.map(d => ({
      id: d.id,
      slug: d.slug,
      name: locale === "en" ? d.name : d.nameAz,
      nameAz: d.nameAz,
      nameEn: d.name,
      images: d.images,
      affectedCrops: d.affectedCrops,
      symptoms: d.symptoms,
      causes: d.causes,
      prevention: d.prevention,
      treatment: d.treatment
    }));

    return Response.json({ diseases: mapped });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// POST /api/diseases — Admin/Super Admin only
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

  const { name, nameAz, images, affectedCrops, symptoms, causes, prevention, treatment } = body;
  if (!name || !nameAz) {
    return Response.json({ error: "Ad (name və nameAz) tələb olunur" }, { status: 422 });
  }

  try {
    const slug = slugify(nameAz, { lower: true, strict: true });
    const existing = await prisma.disease.findUnique({ where: { slug } });
    if (existing) {
      return Response.json({ error: "Bu xəstəlik artıq mövcuddur" }, { status: 409 });
    }

    const disease = await prisma.disease.create({
      data: {
        name,
        nameAz,
        slug,
        images: images || [],
        affectedCrops: affectedCrops || [],
        symptoms,
        causes,
        prevention,
        treatment
      }
    });

    return Response.json({ disease }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
