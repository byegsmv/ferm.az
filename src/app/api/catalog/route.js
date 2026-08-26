import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import slugify from "slugify";

// GET /api/catalog — public catalog listing (store products with storeId set)
// GET /api/catalog?mine=1 — seller's own catalog products
// GET /api/catalog?storeId=xxx — a specific store's catalog
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const categoryId = searchParams.get("categoryId");
  const storeId = searchParams.get("storeId");
  const search = searchParams.get("search");
  const mine = searchParams.get("mine") === "1";

  const authUser = await getAuthUser(request);

  let where = {
    storeId: { not: null },   // only store catalog products (not regular farmer listings)
    status: "ACTIVE",
  };

  if (mine) {
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
    where = { sellerId: authUser.sub, storeId: { not: null } };
    delete where.status; // own products — show all statuses
  } else if (storeId) {
    where.storeId = storeId;
  }

  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { titleAz: { contains: search, mode: "insensitive" } },
      { productCode: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
        category: { select: { id: true, nameAz: true, icon: true } },
        store: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({
    products,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

// POST /api/catalog — create a catalog product (store owners and admins only)
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ["STORE", "FARMER", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(authUser.role)) {
    return Response.json({ error: "Yalnız mağaza sahibləri katalog məhsulu əlavə edə bilər" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const {
    titleAz, descriptionAz, price, categoryId, stock = 0,
    productCode, barcode, packaging, manufacturer, countryOfOrigin,
    unit = "ədəd", images = [], labelPdfUrl, instructionPdfUrl,
    wholesalePrice, wholesaleMinQty, isCorporate = false, tags = [],
    preparativeForm, useNorm, waitingPeriod, safetyInfo, storageInfo,
  } = body;

  if (!titleAz || titleAz.length < 2) {
    return Response.json({ error: "Məhsul adı tələb olunur (min 2 simvol)" }, { status: 422 });
  }
  if (!price || Number(price) <= 0) {
    return Response.json({ error: "Qiymət müsbət olmalıdır" }, { status: 422 });
  }
  if (!categoryId) {
    return Response.json({ error: "Kateqoriya seçilməlidir" }, { status: 422 });
  }

  // Resolve store for this user
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
  let store = null;
  if (!isAdmin) {
    store = await prisma.store.findUnique({ where: { ownerId: authUser.sub } });
    if (!store) {
      return Response.json({ error: "Əvvəlcə mağaza yaradın" }, { status: 403 });
    }
  } else if (body.storeId) {
    store = await prisma.store.findUnique({ where: { id: body.storeId } });
  }

  // Generate unique slug
  const baseSlug = slugify(titleAz, { lower: true, strict: true }) || `mehsul-${Date.now().toString(36)}`;
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const product = await prisma.product.create({
    data: {
      titleAz,
      descriptionAz: descriptionAz || null,
      price: Number(price),
      currency: "AZN",
      stock: Number(stock),
      unit,
      categoryId,
      storeId: store?.id || null,
      sellerId: authUser.sub,
      status: isAdmin ? "ACTIVE" : "PENDING_REVIEW",
      slug,
      productCode: productCode || null,
      barcode: barcode || null,
      packaging: packaging || null,
      manufacturer: manufacturer || null,
      countryOfOrigin: countryOfOrigin || null,
      labelPdfUrl: labelPdfUrl || null,
      instructionPdfUrl: instructionPdfUrl || null,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      wholesaleMinQty: wholesaleMinQty ? Number(wholesaleMinQty) : null,
      isCorporate,
      tags: tags || [],
      preparativeForm: preparativeForm || null,
      useNorm: useNorm || null,
      waitingPeriod: waitingPeriod ? Number(waitingPeriod) : null,
      safetyInfo: safetyInfo || null,
      storageInfo: storageInfo || null,
      images: {
        create: images.map((img, idx) => ({
          url: img.url,
          altText: img.altText || null,
          sortOrder: idx,
        })),
      },
    },
    include: {
      images: true,
      category: true,
      store: { select: { id: true, name: true } },
    },
  });

  return Response.json({ product }, { status: 201 });
}
