import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { blogUpdateSchema } from "@/lib/validators";

// Resolves the [slug] segment as either a real slug or a cuid — lets admin
// UIs address a post by id while public pages use the slug.
async function findPost(identifier) {
  return prisma.blogPost.findFirst({
    where: { OR: [{ slug: identifier }, { id: identifier }] },
    include: { author: { select: { fullName: true } } },
  });
}

// GET /api/blog/:slug — public detail, increments view count. Unpublished
// posts 404 for everyone here — admin UIs use ?all=1 on the list route.
export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const post = await findPost(resolvedParams.slug);
  if (!post || !post.isPublished) {
    return Response.json({ error: "Yazı tapılmadı" }, { status: 404 });
  }

  await prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return Response.json({ post });
}

export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const post = await findPost(resolvedParams.slug);
  if (!post) return Response.json({ error: "Yazı tapılmadı" }, { status: 404 });

  const isAuthor = post.authorId === authUser.sub;
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  if (!isAuthor && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = blogUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = { ...parsed.data };
  if (data.isPublished && !post.publishedAt) data.publishedAt = new Date();

  const updated = await prisma.blogPost.update({ where: { id: post.id }, data });
  return Response.json({ post: updated });
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const post = await findPost(resolvedParams.slug);
  if (!post) return Response.json({ error: "Yazı tapılmadı" }, { status: 404 });

  const isAuthor = post.authorId === authUser.sub;
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  if (!isAuthor && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.blogPost.delete({ where: { id: post.id } });
  return Response.json({ success: true });
}
