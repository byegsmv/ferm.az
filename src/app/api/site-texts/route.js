import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const texts = await prisma.siteText.findMany({
      where: { isActive: true },
      select: { key: true, valueAz: true, valueEn: true, valueRu: true },
    });

    // Build key-value map for frontend consumption
    const map = {};
    for (const t of texts) {
      map[t.key] = {
        az: t.valueAz,
        en: t.valueEn || t.valueAz,
        ru: t.valueRu || t.valueAz,
      };
    }

    return Response.json(map, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    return Response.json({}, { status: 200 }); // Return empty map on error — frontend uses fallbacks
  }
}
