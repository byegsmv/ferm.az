import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// POST /api/brands/seed — default brendləri əlavə edir (admin only)
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const DEFAULT_BRANDS = [
    { name: "BioOrganic", country: "Azərbaycan" },
    { name: "Sector Tarım", country: "Türkiyə" },
    { name: "Syngenta", country: "İsveçre" },
    { name: "Bayer", country: "Almaniya" },
    { name: "BASF", country: "Almaniya" },
    { name: "Yara", country: "Norveç" },
    { name: "EuroChem", country: "Rusiya" },
    { name: "ICL", country: "İsrail" },
    { name: "Valagro", country: "İtaliya" },
    { name: "Compo Expert", country: "Almaniya" },
  ];

  let created = 0, skipped = 0;
  for (const b of DEFAULT_BRANDS) {
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      await prisma.brand.upsert({
        where: { slug },
        update: { country: b.country },
        create: { name: b.name, slug, country: b.country, isActive: true, sortOrder: created },
      });
      created++;
    } catch (e) {
      skipped++;
    }
  }

  return Response.json({ created, skipped, total: DEFAULT_BRANDS.length });
}
