import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/slides — public: active only; admin with ?all=1: all slides
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "1";
  const authUser = await getAuthUser(request);
  const isAdmin = authUser && ["SUPER_ADMIN","ADMIN"].includes(authUser.role);

  const slides = await prisma.homepageSlide.findMany({
    where: showAll && isAdmin ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return Response.json({ slides });
}

// POST /api/slides — admin only, create new slide
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["SUPER_ADMIN","ADMIN"].includes(authUser.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const { tag, title, subtitle, cta, href, bg, emoji, imageUrl } = body;
  if (!title || !href) return Response.json({ error: "title və href tələb olunur" }, { status: 422 });

  const maxOrder = await prisma.homepageSlide.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const slide = await prisma.homepageSlide.create({
    data: { tag: tag || "", title, subtitle: subtitle || "", cta: cta || "Bax", href, bg: bg || "from-brand-700 to-brand-500", emoji: emoji || "🌾", imageUrl: imageUrl || null, sortOrder: (maxOrder?.sortOrder ?? -1) + 1 },
  });
  return Response.json({ slide }, { status: 201 });
}

// PUT /api/slides — admin only, bulk reorder (array of { id, sortOrder })
export async function PUT(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["SUPER_ADMIN","ADMIN"].includes(authUser.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { order } = await request.json().catch(() => null); // [{ id, sortOrder }]
  if (!Array.isArray(order)) return Response.json({ error: "order array tələb olunur" }, { status: 422 });

  await Promise.all(order.map(({ id, sortOrder }) =>
    prisma.homepageSlide.update({ where: { id }, data: { sortOrder } })
  ));
  return Response.json({ ok: true });
}
