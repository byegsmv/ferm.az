"use client";
import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";
import { useSiteTexts } from "@/lib/siteTexts";

export default function BlogSection({ posts }) {
  const { t } = useSiteTexts();

  const categoryLabels = {
    tips: t('homepage.blogCatTips', 'Tövsiyyələr'),
    news: t('homepage.blogCatNews', 'Xəbərlər'),
    market: t('homepage.blogCatMarket', 'Bazar'),
    agronomy: t('homepage.blogCatAgronomy', 'Aqronomiya'),
  };

  function readTime(body) {
    if (!body) return `2 ${t('homepage.minReadUnit', 'dəq')}`;
    const words = body.split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 200))} ${t('homepage.minReadUnit', 'dəq')}`;
  }

  if (!posts || posts.length === 0) return null;
  return (
    <section className="animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            {t('homepage.blogTitle', 'Fermer Məsləhətləri')}
          </h2>
          <p className="section-subtitle mt-1">{t('homepage.blogSubtitle', 'Kənd təsərrüfatı haqqında faydalı məqalələr')}</p>
        </div>
        <Link href="/blog" className="text-sm text-brand-600 font-semibold hover:text-brand-700">
          <span className="flex items-center gap-1">{t('homepage.blogSeeAll', 'Hamısı')} <Icon name="arrowRight" size={14} /></span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="card-hover overflow-hidden flex flex-col group"
          >
            {/* Cover */}
            <div className="h-36 bg-gradient-to-br from-brand-50 to-emerald-100 flex items-center justify-center text-5xl">
              <Icon name={post.category === "tips" ? "lightbulb" : post.category === "news" ? "newspaper" : post.category === "market" ? "trendingUp" : "leaf"} size={16} />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              {post.category && (
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full w-fit mb-2">
                  {categoryLabels[post.category] || post.category}
                </span>
              )}
              <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
                {post.titleAz}
              </h3>
              <div className="flex items-center gap-2 mt-auto pt-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Icon name="pencil" size={12} /> {post.author?.fullName || t('homepage.blogDefaultAuthor', 'FermerMarket')}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Icon name="clock" size={12} /> {readTime(post.contentAz)}</span>
                <span>·</span>
                <span suppressHydrationWarning>{new Date(post.createdAt).toLocaleDateString("az-AZ")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
