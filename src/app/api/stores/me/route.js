import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/stores/me — current user's store
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({
    where: { ownerId: authUser.sub },
    include: {
      _count: { select: { products: true, followers: true } },
    },
  });

  if (!store) return Response.json({ error: "Mağaza tapılmadı", store: null }, { status: 404 });

  return Response.json({ store });
}

// PATCH /api/stores/me — update current user's store
export async function PATCH(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({
    where: { ownerId: authUser.sub },
  });

  if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  // Allowed fields to update
  const allowedFields = [
    "name", "description", "logoUrl", "coverUrl", "address", "lat", "lng",
    "whatsapp", "phone", "website", "email",
    "facebook", "instagram", "tiktok", "linkedin", "youtube", "telegram",
    "workingHours", "deliveryRegions", "taxInfo", "bankName", "bankAccount",
    "iban", "supportEmail", "supportPhone", "primaryColor", "secondaryColor",
    "themeMode", "installmentEnabled", "installmentWhatsapp",
  ];

  const updateData = {};
  for (const key of allowedFields) {
    if (key in body) {
      updateData[key] = body[key];
    }
  }

  // Update slug if name changed
  if (body.name && body.name !== store.name) {
    const slugify = (await import("slugify")).default;
    const baseSlug = slugify(body.name, { lower: true, strict: true }) || `magaza-${Date.now().toString(36)}`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.store.findFirst({ where: { slug, NOT: { id: store.id } } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    updateData.slug = slug;
  }

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: updateData,
    include: { _count: { select: { products: true, followers: true } } },
  });

  return Response.json({ store: updated });
}
