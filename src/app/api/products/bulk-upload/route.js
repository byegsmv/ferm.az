import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import slugify from "slugify";

// Bulk product upload module.
// Permission model:
//   - ADMIN / SUPER_ADMIN: always allowed; can target ANY store or upload "personal" listings.
//   - Other users: allowed only if granted the BULK_CSV module (Admin Panel → Modullar).
//     Their uploads are always bound to their own account (and their store, if any)
//     and go through PENDING_REVIEW as usual.

const MAX_ROWS = 500;

async function hasBulkPermission(authUser) {
  if (["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) return true;
  const mod = await prisma.userModule.findFirst({
    where: { userId: authUser.sub, module: "BULK_CSV" },
  });
  return !!mod;
}

// GET /api/products/bulk-upload — permission probe for UI gating
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await hasBulkPermission(authUser);
  if (!allowed) return Response.json({ allowed: false }, { status: 403 });
  return Response.json({
    allowed: true,
    isAdmin: ["ADMIN", "SUPER_ADMIN"].includes(authUser.role),
  });
}

// POST /api/products/bulk-upload
// Body: { target: { type: "store"|"personal", storeId? }, products: [ {...}, ... ] }
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
  const allowed = isAdmin || (await hasBulkPermission(authUser));
  if (!allowed) {
    return Response.json(
      { error: "Toplu yükləmə icazəniz yoxdur. Admin icazə bölməsindən əldə edə bilərsiniz." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const products = body?.products;
  if (!Array.isArray(products) || products.length === 0) {
    return Response.json({ error: "products massivi boşdur" }, { status: 422 });
  }
  if (products.length > MAX_ROWS) {
    return Response.json({ error: `Bir dəfəyə maksimum ${MAX_ROWS} məhsul yüklənə bilər` }, { status: 422 });
  }

  // Resolve upload target
  const target = body.target || { type: "personal" };
  let targetStoreId = null;
  let targetSellerId = authUser.sub;
  let status = "PENDING_REVIEW";

  if (isAdmin) {
    status = "ACTIVE"; // admins bypass review
    if (target.type === "store") {
      if (!target.storeId) {
        return Response.json({ error: "Mağaza seçilməyib (target.storeId)" }, { status: 422 });
      }
      const store = await prisma.store.findUnique({
        where: { id: target.storeId },
        select: { id: true, ownerId: true },
      });
      if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });
      targetStoreId = store.id;
      targetSellerId = store.ownerId || null;
    }
  } else {
    // Non-admin module holders: always own account, attach their own store if any
    const me = await prisma.user.findUnique({
      where: { id: authUser.sub },
      select: { storeId: true },
    });
    targetStoreId = me?.storeId || null;
  }

  // Preload categories once (resolve by slug, id or name — case-insensitive)
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, nameAz: true, nameRu: true, nameEn: true },
  });
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug.toLowerCase(), c]));
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const catByName = {};
  for (const c of categories) {
    for (const name of [c.nameAz, c.nameRu, c.nameEn]) {
      if (name) catByName[String(name).toLowerCase()] = c;
    }
  }
  const resolveCategory = (row) =>
    (row.categorySlug && (catBySlug[String(row.categorySlug).toLowerCase()] || catById[row.categorySlug] || catByName[String(row.categorySlug).toLowerCase()])) ||
    (row.categoryId && (catById[row.categoryId] || catBySlug[String(row.categoryId).toLowerCase()])) ||
    null;

  // ── Phase 1: validate all rows in memory (fast, no DB writes) ──
  const validRows = [];
  const results = [];
  for (let i = 0; i < products.length; i++) {
    const row = products[i] || {};
    const rowNum = i + 1;
    try {
      const title = (row.titleAz || "").trim();
      if (title.length < 3) throw new Error("titleAz ən azı 3 simvol olmalıdır");

      const price = Number(String(row.price).replace(",", "."));
      if (!(price > 0)) throw new Error("price müsbət ədəd olmalıdır");

      const stock = row.stock === undefined || row.stock === "" ? 1 : parseInt(row.stock, 10);
      if (!(stock >= 0)) throw new Error("stock mənfi ola bilməz");

      const category = resolveCategory(row);
      if (!category) throw new Error(`Kateqoriya tapılmadı: ${row.categorySlug || row.categoryId || "(boş)"} — slug, ID və ya ad yazıla bilər`);

      let discountedPrice = null;
      if (row.discountedPrice !== undefined && row.discountedPrice !== "" && row.discountedPrice !== null) {
        discountedPrice = Number(String(row.discountedPrice).replace(",", "."));
        if (!(discountedPrice > 0)) throw new Error("discountedPrice müsbət olmalıdır");
        if (discountedPrice >= price) throw new Error("discountedPrice normal qiymətdən aşağı olmalıdır");
      }

      let wholesalePrice = null;
      let wholesaleMinQty = null;
      if (row.wholesalePrice !== undefined && row.wholesalePrice !== "" && row.wholesalePrice !== null) {
        wholesalePrice = Number(String(row.wholesalePrice).replace(",", "."));
        if (!(wholesalePrice > 0)) throw new Error("wholesalePrice müsbət olmalıdır");
        wholesaleMinQty = parseInt(row.wholesaleMinQty || "1", 10);
      }

      // Images: imageUrls array (preferred) or single imageUrl fallback
      const urls = Array.isArray(row.imageUrls) && row.imageUrls.length
        ? row.imageUrls.filter((u) => typeof u === "string" && u.trim())
        : row.imageUrl ? [row.imageUrl] : [];

      const baseSlug = slugify(title, { lower: true, strict: true }) || "mehsul";

      validRows.push({
        rowNum, title,
        data: {
          titleAz: title,
          descriptionAz: row.descriptionAz || null,
          price,
          ...(discountedPrice ? { discountedPrice } : {}),
          stock,
          unit: row.unit || "ədəd",
          categoryId: category.id,
          sellerId: targetSellerId,
          ...(targetStoreId ? { storeId: targetStoreId } : {}),
          region: row.region || null,
          city: row.city || null,
          ...(wholesalePrice ? { wholesalePrice, wholesaleMinQty } : {}),
          slug: `${baseSlug}-${Math.random().toString(36).slice(2, 10)}`,
          status,
        },
        images: urls.slice(0, 8).map((u, j) => ({ url: u.trim(), sortOrder: j })),
      });
    } catch (err) {
      results.push({ row: rowNum, success: false, title: row.titleAz || "", error: err.message });
    }
  }

  // ── Phase 2: batched bulk inserts (createMany, chunks of 100) ──
  let createdCount = 0;
  for (let c = 0; c < validRows.length; c += 100) {
    const chunk = validRows.slice(c, c + 100);
    try {
      await prisma.product.createMany({ data: chunk.map((r) => r.data), skipDuplicates: false });
      createdCount += chunk.length;
      for (const r of chunk) results.push({ row: r.rowNum, success: true, title: r.title });
    } catch (err) {
      // Chunk-level failure (DB/connection): mark the whole chunk as failed
      for (const r of chunk) {
        results.push({ row: r.rowNum, success: false, title: r.title, error: "Yükləmə xətası: " + err.message });
      }
    }
  }

  // ── Phase 3: attach images (single createMany for all rows) ──
  if (createdCount > 0) {
    try {
      const createdProducts = await prisma.product.findMany({
        where: { slug: { in: validRows.map((r) => r.data.slug) } },
        select: { id: true, slug: true, titleAz: true },
      });
      const bySlug = Object.fromEntries(createdProducts.map((p) => [p.slug, p]));
      const imageRows = [];
      for (const r of validRows) {
        const p = bySlug[r.data.slug];
        if (!p) continue;
        for (const img of r.images) {
          imageRows.push({ productId: p.id, url: img.url, altText: p.titleAz, sortOrder: img.sortOrder });
        }
        const res = results.find((x) => x.row === r.rowNum && x.success);
        if (res) res.productId = p.id;
      }
      if (imageRows.length) await prisma.productImage.createMany({ data: imageRows });
    } catch (err) {
      // Şəkillər uğursuz olsa da məhsullar yaradılıb — nəticəyə xəta qeyd et
      results.push({ row: 0, success: true, title: "(şəkillər)", error: "Şəkil yükləmə xətası: " + err.message });
    }
  }

  results.sort((a, b) => (a.row || 0) - (b.row || 0));
  return Response.json(
    { createdCount, failed: results.length - createdCount, total: results.length, status, results },
    { status: 201 }
  );
}
