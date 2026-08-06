import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import slugify from "slugify";

/**
 * POST /api/products/bulk-import — farmers/stores upload a CSV to create
 * many product listings in one shot instead of one-by-one.
 *
 * Body: { csv: string }
 * Expected CSV columns (header row required, comma-separated):
 *   titleAz,descriptionAz,price,stock,categorySlug,region,city
 *
 * All rows are created as PENDING_REVIEW (same as manual single-product
 * creation) — admin approval flow is unchanged, this just saves typing.
 * Returns per-row success/error so a bad row doesn't block the rest.
 */
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "BUYER"]); // All authenticated users can bulk import
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const csv = body?.csv;
  if (!csv || typeof csv !== "string") {
    return Response.json({ error: "csv (mətn) tələb olunur" }, { status: 422 });
  }

  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return Response.json({ error: "CSV boşdur və ya başlıq sətri yoxdur" }, { status: 422 });
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const required = ["titleAz", "price", "stock", "categorySlug"];
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length) {
    return Response.json({ error: `CSV-də bu sütunlar çatışmır: ${missing.join(", ")}` }, { status: 422 });
  }

  const categories = await prisma.category.findMany();
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const row = Object.fromEntries(header.map((h, idx) => [h, cols[idx]]));

    try {
      const category = categoryBySlug[row.categorySlug];
      if (!category) throw new Error(`Kateqoriya tapılmadı: ${row.categorySlug}`);

      const price = Number(row.price);
      const stock = parseInt(row.stock, 10);
      if (!row.titleAz || row.titleAz.length < 3) throw new Error("titleAz ən azı 3 simvol olmalıdır");
      if (!(price > 0)) throw new Error("price müsbət ədəd olmalıdır");
      if (!(stock >= 0)) throw new Error("stock mənfi olmaya bilməz");

      const baseSlug = slugify(row.titleAz, { lower: true, strict: true });
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 10)}`;

      const product = await prisma.product.create({
        data: {
          titleAz: row.titleAz,
          descriptionAz: row.descriptionAz || null,
          price,
          stock,
          categoryId: category.id,
          region: row.region || null,
          city: row.city || null,
          slug,
          sellerId: authUser.sub,
          status: "PENDING_REVIEW",
        },
      });
      results.push({ row: i + 1, success: true, productId: product.id, title: product.titleAz });
    } catch (err) {
      results.push({ row: i + 1, success: false, error: err.message });
    }
  }

  const createdCount = results.filter((r) => r.success).length;
  return Response.json({ createdCount, total: results.length, results }, { status: 201 });
}
