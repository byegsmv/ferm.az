import Icon from "@/components/ui/Icon";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getPost(slug) {
  try {
    return await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
      include: { author: { select: { fullName: true } } },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const p = await params;
  const post = await getPost(p.slug);
  if (!post) return { title: "Bloq yazısı tapılmadı — FermerMarket" };
  return {
    title: `${post.titleAz} — FermerMarket Bloq`,
    description: (post.contentAz || post.titleAz).slice(0, 155),
    openGraph: {
      title: post.titleAz,
      description: (post.contentAz || "").slice(0, 155),
      ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
    },
  };
}

const CATEGORY_LABELS = {
  tips: "Tövsiyyələr ",
  news: "Xəbərlər ",
  market: "Bazar ",
  agronomy: "Aqronomiya ",
};

export default async function BlogPostPage({ params }) {
  const p = await params;
  const post = await getPost(p.slug);
  if (!post) notFound();
  return (
    <>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10">
        <Link href="/blog" className="text-sm text-brand-700 hover:underline mb-4 inline-block">
          <span className="flex items-center gap-1.5"><Icon name="arrowLeft" size={16} /> Bloqa qayıt</span>
        </Link>

        {post.category && (
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
            {CATEGORY_LABELS[post.category] || post.category}
          </span>
        )}

        <h1 className="text-2xl font-extrabold mt-3 mb-2 leading-snug">{post.titleAz}</h1>

        {post.coverUrl && (
          <img
            src={post.coverUrl}
            alt={post.titleAz}
            className="w-full rounded-2xl object-cover max-h-64 mb-4"
          />
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
          <span className="flex items-center gap-1"><Icon name="pencil" size={14} /> {post.author?.fullName || "FermerMarket"}</span>
          <span>·</span>
          <span>
            {new Date(post.createdAt).toLocaleDateString("az-AZ", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-line">
          {post.contentAz}
        </div>
      </main>
    </>
  );
}
