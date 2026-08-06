import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { campaignCreateSchema } from "@/lib/validators";

// GET /api/campaigns?type=&status=&region=  — public: active banners for placement
// GET /api/campaigns?all=1                  — admin/store-owner only: every
//   campaign regardless of status/date range, so the admin panel can find
//   and activate a just-created DRAFT campaign (the public filter below
//   would otherwise hide it from view entirely).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const region = searchParams.get("region");
  const wantsAll = searchParams.get("all") === "1";

  if (wantsAll) {
    const authUser = await getAuthUser(request);
    const isAdmin = authUser && ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
    const isStoreRole = authUser && ["STORE", "FARMER"].includes(authUser.role);
    if (!authUser || (!isAdmin && !isStoreRole)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: isAdmin
        ? {}
        : { store: { ownerId: authUser.sub } }, // non-admin store/farmer sees only their own
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { name: true, slug: true, ownerId: true } },
        category: { select: { slug: true, nameAz: true } },
      },
    });
    return Response.json({ campaigns });
  }

  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      ...(type ? { type } : {}),
      ...(region ? { region } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      store: { select: { name: true, slug: true } },
      category: { select: { slug: true, nameAz: true } },
    },
  });

  return Response.json({ campaigns });
}

// POST /api/campaigns — Store owners create campaigns for their own store; Admin any
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "BUYER"]); // All authenticated users can create campaigns
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  if (data.storeId) {
    const store = await prisma.store.findUnique({ where: { id: data.storeId } });
    if (!store) return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });
    const isOwner = store.ownerId === authUser.sub;
    const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const campaign = await prisma.campaign.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: "DRAFT", // Admin/scheduler flips to SCHEDULED/ACTIVE
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authUser.sub,
      action: "CAMPAIGN_CREATED",
      entity: "Campaign",
      entityId: campaign.id,
    },
  });

  return Response.json({ campaign }, { status: 201 });
}
