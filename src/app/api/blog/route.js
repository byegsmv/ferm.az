import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { blogCreateSchema } from "@/lib/validators";
import { sanitizeHtml } from "@/lib/security/sanitizer";
import slugify from "slugify";

// GET /api/blog — public: published posts (or all, for admin/agronomist with ?all=1)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const all = searchParams.get("all") === "1";

  let includeUnpublished = false;
  if (all) {
    const authUser = await getAuthUser(request);
    if (authUser && ["ADMIN", "SUPER_ADMIN", "AGRONOMIST"].includes(authUser.role)) {
      includeUnpublished = true;
    }
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      ...(includeUnpublished ? {} : { isPublished: true }),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { fullName: true } } },
  });

  return Response.json({ posts });
}

// POST /api/blog — admin/agronomist writes a new tips/news post
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "BUYER"]); // All authenticated users can write blog posts
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = blogCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const baseSlug = slugify(parsed.data.titleAz, { lower: true, strict: true });
  let slug = baseSlug;
  let n = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const sanitizedData = {
    ...parsed.data,
    ...(parsed.data.contentAz ? { contentAz: sanitizeHtml(parsed.data.contentAz) } : {}),
    ...(parsed.data.contentEn ? { contentEn: sanitizeHtml(parsed.data.contentEn) } : {}),
    ...(parsed.data.contentRu ? { contentRu: sanitizeHtml(parsed.data.contentRu) } : {}),
    ...(parsed.data.content ? { content: sanitizeHtml(parsed.data.content) } : {}),
  };

  const post = await prisma.blogPost.create({
    data: {
      ...sanitizedData,
      slug,
      authorId: authUser.sub,
      publishedAt: parsed.data.isPublished ? new Date() : null,
    },
  });

  // Auto-reward coins for writing a blog post
  const COIN_REWARD = 5;
  let wallet = await prisma.wallet.findUnique({ where: { userId: authUser.sub } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: authUser.sub, coins: 0, balance: 0 } });
  }
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { coins: { increment: COIN_REWARD } }
  });
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "EARNING",
      amount: COIN_REWARD,
      description: "Blog məqaləsi yazıldığına görə hədiyyə",
      status: "COMPLETED"
    }
  });

  return Response.json({ post }, { status: 201 });
}
