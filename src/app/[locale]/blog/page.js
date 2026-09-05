import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import SideBanner from "@/components/Banners/SideBanner";
import { blogExcerpt } from "@/lib/blogContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bloq — FermerMarket",
  description: "Kənd təsərrüfatı haqqında faydalı məqalələr, aqronomun məsləhətləri, bazar xəbərləri",
};

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

export default async function BlogPage() {
  let posts = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { fullName: true } } },
    });
  } catch (e) {
    console.error("Blog fetch error:", e.message);
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1600px] mx-auto flex gap-6 px-4 py-8">
        <SideBanner position="left" />
        <div className="flex-1 min-w-0 w-full">
          <main className="max-w-6xl mx-auto pb-28 md:pb-10">
            {/* Premium header */}
            <div className="card p-6 sm:p-8 mb-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand-50 blur-2xl" aria-hidden="true"></div>
              <div className="relative flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full mb-3">
                    <Icon name="newspaper" size={13} /> FermerMarket Bloq
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                    Bloq & Xəbərlər
                  </h1>
                  <p className="text-gray-500 text-sm mt-1.5 max-w-xl">
                    Kənd təsərrüfatı, aqronomiya və bazar xəbərləri — fermerlər üçün faydalı məqalələr
                  </p>
                </div>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
                  <Icon name="fileText" size={24} />
                </div>
                <p className="font-semibold text-gray-900">Hələ bloq yazısı yoxdur</p>
                <p className="text-sm text-gray-400 mt-1">Tezliklə yeni məqalələr əlavə olunacaq</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="card-hover flex flex-col group"
                  >
                    {/* Cover */}
                    {post.coverUrl ? (
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={post.coverUrl}
                          alt={post.titleAz}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                        {post.category && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/45 backdrop-blur px-2.5 py-1 rounded-full">
                            <Icon name={CATEGORY_ICONS[post.category] || "fileText"} size={11} />
                            {CATEGORY_LABELS[post.category] || post.category}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative h-36 bg-gradient-to-br from-brand-50 to-emerald-100 flex items-center justify-center">
                        <Icon
                          name={CATEGORY_ICONS[post.category] || "leaf"}
                          size={28}
                          className="text-brand-400"
                        />
                        {post.category && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-white/80 backdrop-blur px-2.5 py-1 rounded-full">
                            <Icon name={CATEGORY_ICONS[post.category] || "fileText"} size={11} />
                            {CATEGORY_LABELS[post.category] || post.category}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      <h2 className="font-bold text-[15px] sm:text-base text-gray-900 line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
                        {post.titleAz}
                      </h2>
                      {post.contentAz && (
                        <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-3 mt-2">
                          {blogExcerpt(post.contentAz, 130)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-auto pt-4 text-[11px] text-gray-400">
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center text-white font-bold text-[9px]">
                          {(post.author?.fullName || "F")[0].toUpperCase()}
                        </span>
                        <span className="font-medium">{post.author?.fullName || "FermerMarket"}</span>
                        <span className="ml-auto inline-flex items-center gap-1 text-brand-600 font-semibold group-hover:gap-1.5 transition-all">
                          Oxu <Icon name="arrowRight" size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
        <SideBanner position="right" />
      </div>
    </div>
  );
}
