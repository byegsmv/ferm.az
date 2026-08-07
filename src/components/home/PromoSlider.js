"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { useSiteTexts } from "@/lib/siteTexts";

const getBgStyle = (bg) => {
  if (!bg) return { background: "linear-gradient(90deg, #047857 0%, #10B981 100%)" };
  const bgLower = bg.toLowerCase();
  if (bgLower.includes("brand") || bgLower.includes("green") || bgLower.includes("emerald")) {
    return { background: "linear-gradient(90deg, #047857 0%, #10B981 100%)" };
  }
  if (bgLower.includes("amber") || bgLower.includes("yellow") || bgLower.includes("orange")) {
    return { background: "linear-gradient(90deg, #d97706 0%, #fbbf24 100%)" };
  }
  if (bgLower.includes("sky") || bgLower.includes("blue") || bgLower.includes("indigo")) {
    return { background: "linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%)" };
  }
  return { background: "linear-gradient(90deg, #047857 0%, #10B981 100%)" };
};

export default function PromoSlider() {
  const { t } = useSiteTexts();

  const fallbackSlides = [
    { id: "1", tag: t('homepage.promoTag1', 'Kampaniya'), iconName: "flame", title: t('homepage.promoTitle1', 'Yaz Mövsümü Endirimləri'), subtitle: t('homepage.promoSubtitle1', 'Toxum, gübrə və aqrar avadanlıqlarda 30%-ə qədər endirim'), cta: t('homepage.promoCta1', 'İndi Bax'), href: "/products", bg: "from-brand-700 to-brand-500" },
    { id: "2", tag: t('homepage.promoTag2', 'Premium'), iconName: "star", title: t('homepage.promoTitle2', 'Premium Elanlar'), subtitle: t('homepage.promoSubtitle2', 'Seçilmiş satıcıların keyfiyyətli məhsulları bir yerdə'), cta: t('homepage.promoCta2', 'Kəşf Et'), href: "/products", bg: "from-amber-600 to-amber-400" },
    { id: "3", tag: t('homepage.promoTag3', 'Yeni Xüsusiyyət'), iconName: "bot", title: t('homepage.promoTitle3', 'AI Aqronom'), subtitle: t('homepage.promoSubtitle3', 'Bitkinizdəki xəstəlikləri şəkil göndərərək analiz etdirin'), cta: t('homepage.promoCta3', 'Sınayın'), href: "/agronom", bg: "from-sky-700 to-sky-500" },
  ];

  const [slides, setSlides] = useState(fallbackSlides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/slides")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.slides?.length) setSlides(d.slides.map(s => ({ ...s, iconName: s.iconName || "flame" }))); })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next, paused, slides.length]);

  // Reset index if slides change
  useEffect(() => { setCurrent(0); }, [slides.length]);

  const slide = slides[current] || slides[0];
  if (!slide) return null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl h-44 md:h-52 cursor-pointer select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 flex items-center px-8 md:px-12 transition-all duration-500 ${
            i === current ? "opacity-100 translate-x-0" : i < current ? "opacity-0 -translate-x-full" : "opacity-0 translate-x-full"
          }`}
          style={s.imageUrl ? undefined : getBgStyle(s.bg)}
        >
          {s.imageUrl && (
            <>
              <img src={s.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
            </>
          )}
          <div className="flex-1 text-white relative">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-white">{s.tag}</span>
            <h3 className="text-xl md:text-2xl font-extrabold mt-2 mb-1 leading-tight text-white">{s.title}</h3>
            <p className="text-white/95 text-sm max-w-sm font-medium">{s.subtitle}</p>
            <Link
              href={s.href}
              className="inline-block mt-4 bg-white text-gray-900 text-xs font-bold px-5 py-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <>{s.cta || t('homepage.promoViewBtn', 'Bax')} <Icon name="arrowRight" size={14} className="inline ml-1" /></>
            </Link>
          </div>
          <div className="opacity-20"><Icon name={s.iconName || "flame"} size={80} className="text-white" strokeWidth={1.5} /></div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors text-sm z-10">‹</button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors text-sm z-10">›</button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
