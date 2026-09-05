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

  // Preload categories once
  const categories = await prisma.category.findMany();
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const results = [];
  let createdCount = 0;

  for (let i = 0; i < products.length; i++) {
    const row = products[i] || {};
    const rowNum = i + 1;
    try {
      const title = (row.titleAz || "").trim();
      if (title.length < 3) throw new Error("titleAz ən azı 3 simvol olmalıdır");

      const price = Number(row.price);
      if (!(price > 0)) throw new Error("price müsbət ədəd olmalıdır");

      const stock = row.stock === undefined || row.stock === "" ? 1 : parseInt(row.stock, 10);
      if (!(stock >= 0)) throw new Error("stock mənfi ola bilməz");

      const category = catBySlug[row.categorySlug] || catById[row.categoryId];
      if (!category) throw new Error(`Kateqoriya tapılmadı: ${row.categorySlug || row.categoryId || "(boş)"}`);

      let discountedPrice = null;
      if (row.discountedPrice !== undefined && row.discountedPrice !== "" && row.discountedPrice !== null) {
        discountedPrice = Number(row.discountedPrice);
        if (!(discountedPrice > 0)) throw new Error("discountedPrice müsbət olmalıdır");
        if (discountedPrice >= price) throw new Error("discountedPrice normal qiymətdən aşağı olmalıdır");
      }

      let wholesalePrice = null;
      let wholesaleMinQty = null;
      if (row.wholesalePrice !== undefined && row.wholesalePrice !== "" && row.wholesalePrice !== null) {
        wholesalePrice = Number(row.wholesalePrice);
        if (!(wholesalePrice > 0)) throw new Error("wholesalePrice müsbət olmalıdır");
        wholesaleMinQty = parseInt(row.wholesaleMinQty || "1", 10);
      }

      const baseSlug = slugify(title, { lower: true, strict: true }) || "mehsul";
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 10)}`;

      const created = await prisma.product.create({
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
          slug,
          status,
        },
      });

      // Images: imageUrls array (preferred) or single imageUrl fallback
      const urls = Array.isArray(row.imageUrls) && row.imageUrls.length
        ? row.imageUrls.filter((u) => typeof u === "string" && u.trim())
        : row.imageUrl ? [row.imageUrl] : [];
      for (let j = 0; j < Math.min(urls.length, 8); j++) {
        await prisma.productImage.create({
          data: {
            productId: created.id,
            url: urls[j].trim(),
            altText: title,
            sortOrder: j,
          },
        });
      }

      createdCount++;
      results.push({ row: rowNum, success: true, title, productId: created.id });
    } catch (err) {
      results.push({ row: rowNum, success: false, title: row.titleAz || "", error: err.message });
    }
  }

  return Response.json(
    { createdCount, failed: results.length - createdCount, total: results.length, status, results },
    { status: 201 }
  );
}
