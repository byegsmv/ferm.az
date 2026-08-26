"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";
import SafeImage from "@/components/SafeImage";

const AUTO_SPEED = 0.5;

export default function BrandsSlider({ brands, title, subtitle }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const dragMovedRef = useRef(false);
  const rafRef = useRef(null);
  const directionRef = useRef(1);
  const resumeTimeoutRef = useRef(null);

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
  }, [brands, checkScroll]);

  useEffect(() => {
    if (!scrollRef.current || !brands || brands.length === 0) return;

    const step = () => {
      const el = scrollRef.current;
      if (el && !pausedRef.current && !draggingRef.current) {
        el.scrollLeft += AUTO_SPEED * directionRef.current;

        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxScroll = scrollWidth - clientWidth;

        if (scrollLeft >= maxScroll - 1) directionRef.current = -1;
        if (scrollLeft <= 1) directionRef.current = 1;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [brands?.length]);

  if (!brands || brands.length === 0) return null;

  const pauseAutoplayThenResume = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 1500);
  };

  const scrollLeftBtn = () => {
    if (scrollRef.current) {
      pauseAutoplayThenResume();
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRightBtn = () => {
    if (scrollRef.current) {
      pauseAutoplayThenResume();
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
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
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-8 sm:mt-10 relative z-10">
      <div className="flex flex-col items-start mb-4 sm:mb-5 px-1 gap-1">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {title || 'Populyar brendlər'}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 font-medium">{subtitle}</p>
        )}
      </div>

      <div className="relative group/slider flex items-center bg-white py-4 px-2 shadow-sm rounded-lg">
        <div
          ref={scrollRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClickCapture={handleClickCapture}
          className="flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none w-full items-center"
        >
          {brands.map((b, i) => (
            <Link
              key={b.id || i}
              href={`/products?brand=${b.slug}`}
              draggable={false}
              className="shrink-0 w-32 h-20 sm:w-48 sm:h-24 bg-white border border-gray-100 shadow-sm rounded-lg group/card flex items-center justify-center p-4 transition-all duration-300 hover:shadow-md hover:border-brand-200"
            >
              {b.logoUrl ? (
                <div className="relative w-full h-full">
                  <SafeImage src={b.logoUrl} alt={b.name} fill className="object-contain filter grayscale group-hover/card:grayscale-0 transition duration-300 group-hover/card:scale-105" />
                </div>
              ) : (
                <span className="text-sm font-bold text-gray-700 text-center">{b.name}</span>
              )}
            </Link>
          ))}
        </div>

        <button
          onClick={scrollRightBtn}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white border border-gray-200 shadow rounded-full flex items-center justify-center text-pink-600 hover:bg-gray-50 hover:text-pink-700 transition-all z-20"
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
    </section>
  );
}
