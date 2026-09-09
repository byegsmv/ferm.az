import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { mapProductImages } from "@/lib/imageUrl";
import slugify from "slugify";

const MAX_PER_REQUEST = 12;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

function titleFromFilename(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "Yeni məhsul";
}

// POST — toplu şəkil yüklə: hər şəkil üçün QARALAMA məhsul yaradır (PENDING_REVIEW)
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role)) {
    return Response.json({ error: "Yalnız admin" }, { status: 403 });
  }

  let formData;
  try { formData = await request.formData(); } catch {
    return Response.json({ error: "Yanlış form-data" }, { status: 400 });
  }

  const categoryId = formData.get("categoryId");
  if (!categoryId) return Response.json({ error: "Kateqoriya seçilməlidir" }, { status: 422 });
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return Response.json({ error: "Kateqoriya tapılmadı" }, { status: 404 });

  let storeId = formData.get("storeId");
  if (storeId) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });
  } else {
    const store = await prisma.store.findFirst({ where: { ownerId: authUser.sub, isActive: true } });
    storeId = store?.id || null;
  }

  const files = formData.getAll("files").filter((f) => typeof f === "object" && f.size !== undefined);
  if (!files.length) return Response.json({ error: "Heç bir fayl yoxdur" }, { status: 422 });
  if (files.length > MAX_PER_REQUEST) {
    return Response.json({ error: `Bir dəfədə maksimum ${MAX_PER_REQUEST} şəkil` }, { status: 422 });
  }

  const created = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      created.push({ ok: false, name: file.name, error: "çox böyük (maks 4MB)" });
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const dataUri = `data:${mime};base64,${buf.toString("base64")}`;
    const title = titleFromFilename(file.name);
    const slug = slugify(`${title}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, { lower: true, strict: true });

    const product = await prisma.product.create({
      data: {
        slug,
        titleAz: title,
        descriptionAz: "",
        price: 0,
        stock: 1,
        unit: "ədəd",
        status: "PENDING_REVIEW",
        categoryId,
        sellerId: authUser.sub,
        storeId,
        images: { create: [{ url: dataUri, altText: title, sortOrder: 0 }] },
      },
      include: { images: true, category: { select: { id: true, nameAz: true } } },
    });
    created.push({ ok: true, product: mapProductImages(product) });
  }

  return Response.json({ created, count: created.filter(c => c.ok).length });
}

// GET — cari mağazanın/yönləndirilmiş qaralamaları (status PENDING_REVIEW)
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role)) {
    return Response.json({ error: "Yalnız admin" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const where = { status: "PENDING_REVIEW", ...(storeId ? { storeId } : {}) };
  const products = await prisma.product.findMany({
    where,
    include: { images: true, category: { select: { id: true, nameAz: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return Response.json({ products: products.map(mapProductImages) });
}
