import Icon from "@/components/ui/Icon";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { normalizeBlogContent, blogExcerpt } from "@/lib/blogContent";

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
    description: blogExcerpt(post.contentAz, 155),
    openGraph: {
      title: post.titleAz,
      description: blogExcerpt(post.contentAz, 155),
      ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
    },
  };
}

const CATEGORY_LABELS = {
  tips: "Tövsiyyələr",
  news: "Xəbərlər",
  market: "Bazar",
  agronomy: "Aqronomiya",
};

const CATEGORY_ICONS = {
  tips: "lightbulb",
  news: "newspaper",
  market: "trendingUp",
  agronomy: "leaf",
};

export default async function BlogPostPage({ params }) {
  const p = await params;
  const post = await getPost(p.slug);
  if (!post) notFound();

  const content = normalizeBlogContent(post.contentAz);
  const category = post.category && (CATEGORY_LABELS[post.category] || post.category);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="max-w-3xl mx-auto px-4 py-6 pb-28 md:py-10 md:pb-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-600 bg-white border border-gray-100 shadow-sm rounded-full px-4 py-2 mb-6 transition-colors"
        >
          <Icon name="arrowLeft" size={16} /> Bloqa qayıt
        </Link>

        <article className="card overflow-hidden">
          {/* Hero cover */}
          {post.coverUrl && (
            <div className="relative">
              <img
                src={post.coverUrl}
                alt={post.titleAz}
                className="w-full h-52 sm:h-72 md:h-80 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
              {category && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg">
                  <Icon name={CATEGORY_ICONS[post.category] || "fileText"} size={13} />
                  {category}
                </span>
              )}
            </div>
          )}

          <div className="p-5 sm:p-8 md:p-10">
            {!post.coverUrl && category && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full mb-4">
                <Icon name={CATEGORY_ICONS[post.category] || "fileText"} size={13} />
                {category}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-[2rem] font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
              {post.titleAz}
            </h1>

            <div className="flex items-center gap-2.5 pb-5 mb-6 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {(post.author?.fullName || "F")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {post.author?.fullName || "FermerMarket"}
                </p>
                <p className="text-xs text-gray-400">FermerMarket Bloq</p>
              </div>
            </div>

            {/* Sanitized + normalized HTML content */}
            <div
              className="blog-content text-gray-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </article>
      </main>
    </div>
  );
}
