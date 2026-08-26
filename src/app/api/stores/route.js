import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { storeCreateSchema } from "@/lib/validators";
import slugify from "slugify";

// GET /api/stores — public: active stores only.
// GET /api/stores?all=1 — admin/super_admin only: every store (incl. inactive/
// unverified) with owner contact info, so the admin panel can moderate them.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const search = searchParams.get("search");
  const wantsAll = searchParams.get("all") === "1";

  let isAdminView = false;
  if (wantsAll) {
    const authUser = await getAuthUser(request);
    if (authUser && ["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) isAdminView = true;
  }

  const where = {
    ...(isAdminView ? {} : { isActive: true }),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        address: true,
        isVerified: true,
        isActive: true,
        _count: { select: { products: true } },
        ...(isAdminView
          ? {
              createdAt: true,
              owner: { select: { fullName: true, email: true, phone: true } },
            }
          : {}),
      },
    }),
    prisma.store.count({ where }),
  ]);

  return Response.json({
    stores,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

// POST /api/stores — create a store for the current user
// First store: isActive = true (auto-active)
// Additional stores: isActive = false (needs admin approval)
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Count how many ACTIVE stores the user already has
  const activeStoresCount = await prisma.store.count({
    where: { ownerId: authUser.sub, isActive: true },
  });

  // Count total stores (active + inactive)
  const totalStoresCount = await prisma.store.count({
    where: { ownerId: authUser.sub },
  });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = storeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const baseSlug = slugify(data.name, { lower: true, strict: true }) || `magaza-${Date.now().toString(36)}`;
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.store.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // First store gets isActive = true, subsequent stores get isActive = false
  const isFirstStore = activeStoresCount === 0;
  const store = await prisma.store.create({
    data: {
      ...data,
      slug,
      ownerId: authUser.sub,
      isActive: isFirstStore,
    },
  });

  return Response.json({
    store,
    isFirstStore,
    message: isFirstStore
      ? "Mağaza uğurla yaradıldı və aktivləşdirildi!"
      : "Mağaza yaradıldı, lakin deaktivdir. Aktivləşdirmək üçün adminlə əlaqə saxlayın.",
  }, { status: 201 });
}
