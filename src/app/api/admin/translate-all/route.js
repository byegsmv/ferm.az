import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { autoTranslateProduct, autoTranslateSiteText, autoTranslateCategory, autoTranslateBlogPost } from "@/lib/autoTranslate";

/**
 * POST /api/admin/translate-all — mövcud bütün məzmunu AI ilə en/ru-ya çevirir.
 * Body: { force?: boolean }
 * Geri döndərir: { products: n, siteTexts: n, categories: n, blogs: n, errors: [...] }
 */
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const force = !!body.force;
  const results = { products: 0, siteTexts: 0, categories: 0, blogs: 0, errors: [] };
  const mark = (r, bucket) => { if (r && r.ok) results[bucket]++; else if (r && r.error) results.errors.push(r.error.slice(0, 120)); };

  // Məhsullar
  const products = await prisma.product.findMany({
    where: force ? {} : { OR: [{ titleEn: null }, { titleRu: null }] },
    select: { id: true }, take: force ? 200 : 100,
  });
  for (const p of products) mark(await autoTranslateProduct(p.id, { force }), "products");

  // Site textlər (menyu, başlıq, etiketlər)
  const texts = await prisma.siteText.findMany({
    where: force ? { valueAz: { not: "" } } : { OR: [{ valueEn: null }, { valueRu: null }] },
    select: { key: true }, take: force ? 500 : 300,
  });
  for (const t of texts) mark(await autoTranslateSiteText(t.key, { force }), "siteTexts");

  // Kateqoriyalar
  const cats = await prisma.category.findMany({
    where: force ? {} : { OR: [{ nameEn: null }, { nameRu: null }] },
    select: { id: true }, take: 200,
  });
  for (const c of cats) mark(await autoTranslateCategory(c.id, { force }), "categories");

  // Bloqlar
  const blogs = await prisma.blogPost.findMany({
    where: force ? {} : { OR: [{ titleEn: null }, { titleRu: null }] },
    select: { id: true }, take: 50,
  });
  for (const b of blogs) mark(await autoTranslateBlogPost(b.id, { force }), "blogs");

  return Response.json({ success: true, ...results });
}
