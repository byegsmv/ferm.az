"use client";
import { useRef, useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";
import { useSiteTexts } from "@/lib/siteTexts";

// Pixels per frame for auto-scroll (~30px/sec at 60fps) — moves right → left
const AUTO_SPEED = 0.5;
const RESUME_DELAY = 1500;

function formatPostDate(d) {
  const date = d ? new Date(d) : null;
  if (!date || isNaN(date.getTime())) return "";
  try {
    const day = new Intl.DateTimeFormat("az", { day: "numeric", month: "long", year: "numeric" }).format(date);
    const time = new Intl.DateTimeFormat("az", { hour: "2-digit", minute: "2-digit" }).format(date);
    return `${day}, ${time}`;
  } catch {
    return "";
  }
}

export default function BlogSection({ posts }) {
  const { t } = useSiteTexts();
  const scrollRef = useRef(null);

  // Infinite-marquee state (kept in refs so the RAF loop never re-creates)
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const dragMovedRef = useRef(false);
  const rafRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const setWidthRef = useRef(0); // width of ONE full set of cards (loop period)

  const categoryLabels = {
    tips: t('homepage.blogCatTips', 'Tövsiyyələr'),
    news: t('homepage.blogCatNews', 'Xəbərlər'),
    market: t('homepage.blogCatMarket', 'Bazar'),
    agronomy: t('homepage.blogCatAgronomy', 'Aqronomiya'),
  };

  // Duplicate the card set so the track is wider than any screen and the
  // loop point is invisible. More copies for few posts (5 posts × 4 copies
  // ≈ 5000px) so it never looks empty on wide monitors.
  const repeat = posts && posts.length > 0 ? (posts.length <= 6 ? 4 : 2) : 1;
  const cards = [];
  if (posts) for (let c = 0; c < repeat; c++) for (const p of posts) cards.push({ post: p, copy: c });

  // Measure one set width + respect reduced-motion preference
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => { setWidthRef.current = el.scrollWidth / repeat; };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [posts, repeat]);

  // Continuous right → left auto-scroll with seamless wrap-around:
  // when we've scrolled exactly one full set, jump back by one set —
  // visually identical frames, so the motion looks infinite.
  useEffect(() => {
    if (!scrollRef.current || !posts || posts.length === 0) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reducedMotion) return;

    const step = () => {
      const el = scrollRef.current;
      if (el && !pausedRef.current && !draggingRef.current && setWidthRef.current > 0) {
        el.scrollLeft += AUTO_SPEED;
        if (el.scrollLeft >= setWidthRef.current) el.scrollLeft -= setWidthRef.current;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [posts?.length]);

  if (!posts || posts.length === 0) return null;

  const pauseAutoplayThenResume = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => { pausedRef.current = false; }, RESUME_DELAY);
  };

  // Wrap any target scroll position into [0, setWidth) so arrows/drag
  // behave identically everywhere in the infinite track.
  const wrapScroll = (target) => {
    const w = setWidthRef.current;
    if (!w) return target;
    return ((target % w) + w) % w;
  };

  const scrollLeftBtn = () => {
    const el = scrollRef.current;
    if (el) {
      pauseAutoplayThenResume();
      el.scrollTo({ left: wrapScroll(el.scrollLeft - 300), behavior: "smooth" });
    }
  };
  const scrollRightBtn = () => {
    const el = scrollRef.current;
    if (el) {
      pauseAutoplayThenResume();
      el.scrollTo({ left: wrapScroll(el.scrollLeft + 300), behavior: "smooth" });
    }
  };

  const handleMouseEnter = () => { pausedRef.current = true; };
  const handleMouseLeave = () => { pausedRef.current = false; draggingRef.current = false; };
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    draggingRef.current = true;
    dragMovedRef.current = false;
    dragStartXRef.current = e.pageX;
    dragStartScrollRef.current = scrollRef.current.scrollLeft;
  };
  const handleMouseMove = (e) => {
    if (!draggingRef.current || !scrollRef.current) return;
    const delta = e.pageX - dragStartXRef.current;
    if (Math.abs(delta) > 3) dragMovedRef.current = true;
    // Wrap-aware dragging: dragging left past the loop point continues seamlessly
    scrollRef.current.scrollLeft = wrapScroll(dragStartScrollRef.current - delta);
  };
  const handleMouseUp = () => {
    draggingRef.current = false;
    pauseAutoplayThenResume();
  };
  const handleClickCapture = (e) => {
    if (dragMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      dragMovedRef.current = false;
    }
  };

  return (
    <section className="animate-fade-in-up relative" style={{ animationDelay: "0.45s" }}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            {t('homepage.blogTitle', 'Fermer Məsləhətləri')}
          </h2>
          <p className="section-subtitle mt-1">{t('homepage.blogSubtitle', 'Kənd təsərrüfatı haqqında faydalı məqalələr')}</p>
        </div>
        <Link href="/blog" className="text-xs sm:text-sm text-brand-600 font-semibold hover:text-brand-700">
          <span className="flex items-center gap-1">{t('homepage.blogSeeAll', 'Hamısı')} <Icon name="arrowRight" size={14} /></span>
        </Link>
      </div>

      <div className="relative">
        {/* Left Arrow (always visible — infinite track) */}
        <button
          onClick={scrollLeftBtn}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-label="Əvvəlki məqalələr"
          className="absolute -left-1 sm:-left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-all z-20"
        >
          <Icon name="arrowLeft" size={18} />
        </button>

        {/* Infinite right → left auto-scrolling slider */}
        <div
          ref={scrollRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClickCapture={handleClickCapture}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1 cursor-grab active:cursor-grabbing select-none"
        >
          {cards.map(({ post, copy }) => {
            const dateLabel = formatPostDate(post.publishedAt || post.createdAt);
            return (
              <Link
                key={`${post.id}-${copy}`}
                href={`/blog/${post.slug}`}
                draggable={false}
                className="card-hover overflow-hidden flex flex-col group shrink-0 w-64 sm:w-72 md:w-80"
              >
                {/* Cover */}
                {post.coverUrl ? (
                  <div className="relative h-36 overflow-hidden">
                    <img src={post.coverUrl} alt={post.titleAz} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    {post.category && (
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-white bg-black/45 backdrop-blur px-2 py-0.5 rounded-full">
                        {categoryLabels[post.category] || post.category}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative h-36 bg-gradient-to-br from-brand-50 to-emerald-100 flex items-center justify-center">
                    <Icon name={post.category === "tips" ? "lightbulb" : post.category === "news" ? "newspaper" : post.category === "market" ? "trendingUp" : "leaf"} size={28} className="text-brand-400" />
                    {post.category && (
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-brand-700 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full">
                        {categoryLabels[post.category] || post.category}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
                    {post.titleAz}
                  </h3>
                  <div className="flex items-center gap-2 mt-auto pt-3 text-[11px] text-gray-400 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center text-white font-bold text-[9px] shrink-0">
                      {(post.author?.fullName || "F")[0].toUpperCase()}
                    </span>
                    <span className="font-medium truncate">{post.author?.fullName || t('homepage.blogDefaultAuthor', 'FermerMarket')}</span>
                    {dateLabel && (
                      <span className="inline-flex items-center gap-1 ml-auto whitespace-nowrap">
                        <Icon name="calendar" size={11} /> {dateLabel}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right Arrow (always visible — infinite track) */}
        <button
          onClick={scrollRightBtn}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-label="Növbəti məqalələr"
          className="absolute -right-1 sm:-right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-all z-20"
        >
          <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </section>
  );
}
