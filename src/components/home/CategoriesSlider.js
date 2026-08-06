"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

const CATEGORY_ICONS = {
  "bitki-muhafize-vasiteleri": "bug",
  "bitki-muhafize": "bug",
  "gubreler": "sprout",
  "toxumlar": "leaf",
  "toxum-ting": "leaf",
  "aqrotexnika": "tractor",
  "texnika": "tractor",
  "heyvandarliq": "🐄",
  "qusculuq": "🐔",
  "ariciliq": "🍯",
  "terkibine-gore": "droplet",
  "aqro-xidmetler": "grid",
  "kampaniyalar": "tag",
};

const CATEGORY_THEMES = {
  "bitki-muhafize-vasiteleri": { bg: "from-emerald-50 to-teal-50/40 hover:from-emerald-100/80 hover:to-teal-100/50", border: "border-emerald-200/60 hover:border-emerald-300", iconBg: "bg-emerald-100 text-emerald-700", text: "text-emerald-950" },
  "bitki-muhafize": { bg: "from-emerald-50 to-teal-50/40 hover:from-emerald-100/80 hover:to-teal-100/50", border: "border-emerald-200/60 hover:border-emerald-300", iconBg: "bg-emerald-100 text-emerald-700", text: "text-emerald-950" },
  "gubreler": { bg: "from-teal-50 to-cyan-50/40 hover:from-teal-100/80 hover:to-cyan-100/50", border: "border-teal-200/60 hover:border-teal-300", iconBg: "bg-teal-100 text-teal-700", text: "text-teal-950" },
  "toxumlar": { bg: "from-green-50 to-emerald-50/40 hover:from-green-100/80 hover:to-emerald-100/50", border: "border-green-200/60 hover:border-green-300", iconBg: "bg-green-100 text-green-700", text: "text-green-950" },
  "toxum-ting": { bg: "from-green-50 to-emerald-50/40 hover:from-green-100/80 hover:to-emerald-100/50", border: "border-green-200/60 hover:border-green-300", iconBg: "bg-green-100 text-green-700", text: "text-green-950" },
  "aqrotexnika": { bg: "from-blue-50 to-indigo-50/40 hover:from-blue-100/80 hover:to-indigo-100/50", border: "border-blue-200/60 hover:border-blue-300", iconBg: "bg-blue-100 text-blue-700", text: "text-blue-950" },
  "texnika": { bg: "from-sky-50 to-blue-50/40 hover:from-sky-100/80 hover:to-blue-100/50", border: "border-sky-200/60 hover:border-sky-300", iconBg: "bg-sky-100 text-sky-700", text: "text-sky-950" },
  "heyvandarliq": { bg: "from-amber-50 to-orange-50/40 hover:from-amber-100/80 hover:to-orange-100/50", border: "border-amber-200/60 hover:border-amber-300", iconBg: "bg-amber-100 text-amber-700", text: "text-amber-950" },
  "qusculuq": { bg: "from-orange-50 to-red-50/40 hover:from-orange-100/80 hover:to-red-100/50", border: "border-orange-200/60 hover:border-orange-300", iconBg: "bg-orange-100 text-orange-700", text: "text-orange-950" },
  "ariciliq": { bg: "from-yellow-50 to-amber-50/40 hover:from-yellow-100/80 hover:to-amber-100/50", border: "border-yellow-200/60 hover:border-yellow-300", iconBg: "bg-yellow-100 text-yellow-800", text: "text-yellow-950" },
  "aqro-xidmetler": { bg: "from-indigo-50 to-purple-50/40 hover:from-indigo-100/80 hover:to-purple-100/50", border: "border-indigo-200/60 hover:border-indigo-300", iconBg: "bg-indigo-100 text-indigo-700", text: "text-indigo-950" },
  "kampaniyalar": { bg: "from-rose-50 to-pink-50/40 hover:from-rose-100/80 hover:to-pink-100/50", border: "border-rose-200/60 hover:border-rose-300", iconBg: "bg-rose-100 text-rose-700", text: "text-rose-950" },
  "terkibine-gore": { bg: "from-cyan-50 to-sky-50/40 hover:from-cyan-100/80 hover:to-cyan-100/50", border: "border-cyan-200/60 hover:border-cyan-300", iconBg: "bg-cyan-100 text-cyan-700", text: "text-cyan-950" },
};

const PALETTES = [
  { bg: "from-emerald-50 to-teal-50/40 hover:from-emerald-100/80 hover:to-teal-100/50", border: "border-emerald-200/60 hover:border-emerald-300", iconBg: "bg-emerald-100 text-emerald-700", text: "text-emerald-950" },
  { bg: "from-amber-50 to-orange-50/40 hover:from-amber-100/80 hover:to-orange-100/50", border: "border-amber-200/60 hover:border-amber-300", iconBg: "bg-amber-100 text-amber-700", text: "text-amber-950" },
  { bg: "from-blue-50 to-indigo-50/40 hover:from-blue-100/80 hover:to-indigo-100/50", border: "border-blue-200/60 hover:border-blue-300", iconBg: "bg-blue-100 text-blue-700", text: "text-blue-950" },
  { bg: "from-purple-50 to-pink-50/40 hover:from-purple-100/80 hover:to-pink-100/50", border: "border-purple-200/60 hover:border-purple-300", iconBg: "bg-purple-100 text-purple-700", text: "text-purple-950" },
  { bg: "from-yellow-50 to-amber-50/40 hover:from-yellow-100/80 hover:to-amber-100/50", border: "border-yellow-200/60 hover:border-yellow-300", iconBg: "bg-yellow-100 text-yellow-800", text: "text-yellow-950" },
  { bg: "from-teal-50 to-cyan-50/40 hover:from-teal-100/80 hover:to-cyan-100/50", border: "border-teal-200/60 hover:border-teal-300", iconBg: "bg-teal-100 text-teal-700", text: "text-teal-950" },
];

function getCategoryIcon(c) {
  if (c.image) return c.image;
  if (c.icon) return c.icon;
  if (c.slug && CATEGORY_ICONS[c.slug]) return CATEGORY_ICONS[c.slug];
  const slug = c.slug || "";
  if (slug.includes("bitki") || slug.includes("muhafize")) return "bug";
  if (slug.includes("gubre")) return "sprout";
  if (slug.includes("toxum") || slug.includes("ting")) return "leaf";
  if (slug.includes("texnika") || slug.includes("aqrotexnika")) return "tractor";
  if (slug.includes("heyvan")) return "🐄";
  if (slug.includes("qus")) return "🐔";
  if (slug.includes("ari")) return "🍯";
  if (slug.includes("meyve") || slug.includes("terevvez")) return "apple";
  if (slug.includes("su") || slug.includes("damci") || slug.includes("terkib")) return "droplet";
  if (slug.includes("xidmet")) return "grid";
  if (slug.includes("kampaniya")) return "tag";
  return "sprout";
}

// Pixels per frame for auto-scroll (~30px/sec at 60fps)
const AUTO_SPEED = 0.5;

export default function CategoriesSlider({ categories = [], title, subtitle }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Auto-scroll / drag state in refs (RAF loop reads fresh values without re-creation)
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const dragMovedRef = useRef(false);
  const rafRef = useRef(null);
  const directionRef = useRef(1); // 1 = scroll right, -1 = scroll left (ping-pong)

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories, checkScroll]);

  // Continuous auto-scroll with ping-pong (bounce at edges, no duplication)
  useEffect(() => {
    if (!scrollRef.current || !categories || categories.length === 0) return;

    const step = () => {
      const el = scrollRef.current;
      if (el && !pausedRef.current && !draggingRef.current) {
        el.scrollLeft += AUTO_SPEED * directionRef.current;

        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxScroll = scrollWidth - clientWidth;

        // Bounce at right edge
        if (scrollLeft >= maxScroll - 1) {
          directionRef.current = -1;
        }
        // Bounce at left edge
        if (scrollLeft <= 1) {
          directionRef.current = 1;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [categories?.length]);

  if (!categories || categories.length === 0) {
    return null;
  }

  const scrollLeftBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };

  const scrollRightBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: "smooth" });
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
    scrollRef.current.scrollLeft = dragStartScrollRef.current - delta;
  };
  const handleMouseUp = () => { draggingRef.current = false; };

  const handleClickCapture = (e) => {
    if (dragMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      dragMovedRef.current = false;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 mt-6 relative z-10">
      <div className="flex flex-col items-center justify-center text-center mb-5 px-1 gap-1">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
            <Icon name="layers" size={18} />
          </span>
          {title || "Kateqoriyalar"}
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          {subtitle || "Məhsul növünü seçin"}
        </p>
        <Link
          href="/products"
          className="text-sm text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1 group transition-colors mt-1"
        >
          <span>Bütün kateqoriyalar</span>
          <Icon name="arrowRight" size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="relative group/slider">
        {/* Left Arrow — always visible */}
        <button
          onClick={scrollLeftBtn}
          aria-label="Əvvəlki"
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-all z-20 opacity-100"
        >
          <Icon name="arrowLeft" size={20} />
        </button>

        {/* Scroll Container — no duplication, each category appears once */}
        <div
          ref={scrollRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClickCapture={handleClickCapture}
          className="flex gap-3.5 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
        >
          {categories.map((c, i) => {
            const theme = CATEGORY_THEMES[c.slug] || PALETTES[i % PALETTES.length];
            const iconName = getCategoryIcon(c);

            return (
              <Link
                key={c.id || c.slug || i}
                href={`/products?category=${c.slug}`}
                draggable={false}
                className={`shrink-0 w-60 sm:w-64 group/card flex items-center gap-3.5 p-4 rounded-2xl border bg-gradient-to-br ${theme.bg} ${theme.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
              >
                <span
                  className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center p-2 shadow-sm ${theme.iconBg} group-hover/card:scale-110 transition-transform duration-300`}
                >
                  <Icon name={iconName} size={24} />
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-sm font-bold leading-snug ${theme.text} line-clamp-2`}>
                    {c.nameAz}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right Arrow — always visible */}
        <button
          onClick={scrollRightBtn}
          aria-label="Növbəti"
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-all z-20 opacity-100"
        >
          <Icon name="arrowRight" size={20} />
        </button>
      </div>
    </section>
  );
}
