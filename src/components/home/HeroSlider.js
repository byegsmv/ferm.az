"use client";
import { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

// Slayd mətnləri əvvəllər sabit (yalnız Azərbaycanca) idi — /en və /ru-da
// da eyni Azərbaycanca mətn göstərilirdi. İndi hər dil üçün ayrıca mətn var,
// iconName/bg/href dillər arasında ortaqdır.
const SHARED = [
  { iconName: "cart", bg: "from-brand-700 via-brand-600 to-brand-500", href: "/products" },
  { iconName: "bot", bg: "from-sky-600 via-blue-600 to-indigo-600", href: "/agronom" },
  { iconName: "sparkles", bg: "from-amber-500 via-orange-500 to-red-500", href: "/elan-yerlesdir" },
  { iconName: "creditCard", bg: "from-emerald-500 via-green-600 to-teal-600", href: "/products" },
];

const TEXT_BY_LOCALE = {
  az: [
    { title: "Kənd Təsərrüfatının Rəqəmsal Bazarı", text: "Fermerlər, mağazalar və alıcılar üçün vahid ekosistem. Alış-verişə indi başlayın.", btn: "Elanları Gör" },
    { title: "Süni İntellekt Dəstəyi", text: "Aqronom asistanı ilə məhsul, xəstəlik və çeşidləmə ilə bağlı 24/7 pulsuz cavablar alın.", btn: "Aqronoma Soruş" },
    { title: "Premium Təcrübə & Satış", text: "Sürətli axtarış, premium elanlar və 24/7 onlayn sifariş sistemi ilə satışınızı artırın.", btn: "Mağaza Aç" },
    { title: "İndi Al, Hissə-Hissə Ödə!", text: "Təklif olunan məhsulları Birbank vasitəsilə hissəli ödənişlə asanlıqla əldə edin. Tək şəxsiyyət vəsiqəsi ilə WhatsApp-dan müraciət edin.", btn: "Məhsullara Bax" },
  ],
  en: [
    { title: "The Digital Marketplace for Agriculture", text: "A unified ecosystem for farmers, stores and buyers. Start shopping now.", btn: "See Listings" },
    { title: "AI-Powered Support", text: "Get free 24/7 answers about crops, diseases and selection from our agronomist assistant.", btn: "Ask the Agronomist" },
    { title: "Premium Experience & Sales", text: "Boost your sales with fast search, premium listings and a 24/7 online ordering system.", btn: "Open a Store" },
    { title: "Buy Now, Pay in Installments!", text: "Get featured products easily via Birbank installment payments. Apply on WhatsApp with just your ID.", btn: "Browse Products" },
  ],
  ru: [
    { title: "Цифровой рынок сельского хозяйства", text: "Единая экосистема для фермеров, магазинов и покупателей. Начните покупки прямо сейчас.", btn: "Смотреть объявления" },
    { title: "Поддержка искусственного интеллекта", text: "Получайте бесплатные ответы 24/7 об урожае, болезнях и выборе от нашего агроном-ассистента.", btn: "Спросить агронома" },
    { title: "Премиум-опыт и продажи", text: "Увеличьте продажи с быстрым поиском, премиум-объявлениями и системой онлайн-заказов 24/7.", btn: "Открыть магазин" },
    { title: "Купите сейчас, платите частями!", text: "Легко приобретайте товары через рассрочку Birbank. Обратитесь в WhatsApp, имея при себе удостоверение личности.", btn: "Смотреть товары" },
  ],
};

function getDefaultSlides(locale) {
  const texts = TEXT_BY_LOCALE[locale] || TEXT_BY_LOCALE.az;
  return SHARED.map((s, i) => ({ ...s, ...texts[i] }));
}

export default function HeroSlider() {
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [dbSlides, setDbSlides] = useState([]);

  useEffect(() => {
    fetch("/api/slides")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.slides?.length) {
          setDbSlides(d.slides.map(s => ({
            title: s.title,
            text: s.subtitle,
            iconName: "flame",
            bg: getHeroBg(s.bg),
            imageUrl: s.imageUrl || null,
            href: s.href || "/products",
            btn: s.cta || "İndi Bax"
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Default slaydlar locale dəyişəndə yenidən lokallaşdırılır; DB slaydları
  // (admin-in əlavə etdiyi, hələ tək dilli sahələr) olduğu kimi qalır.
  const slides = useMemo(() => [...getDefaultSlides(locale), ...dbSlides], [locale, dbSlides]);

  function getHeroBg(bg) {
    if (!bg) return "from-brand-700 via-brand-600 to-brand-500";
    const bgLower = bg.toLowerCase();
    if (bgLower.includes("amber") || bgLower.includes("yellow") || bgLower.includes("orange")) {
      return "from-amber-500 via-orange-500 to-red-500";
    }
    if (bgLower.includes("sky") || bgLower.includes("blue") || bgLower.includes("indigo")) {
      return "from-sky-600 via-blue-600 to-indigo-600";
    }
    return "from-brand-700 via-brand-600 to-brand-500";
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative overflow-hidden w-full min-h-[320px] sm:min-h-[380px] md:h-[440px] bg-gray-900 group mb-4 sm:mb-6 rounded-2xl shadow-xl">
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${slide.imageUrl ? "bg-gray-900" : `bg-gradient-to-br ${slide.bg}`} flex items-center justify-center text-center px-4 pt-4 pb-12 md:pb-14 ${
            current === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
           {slide.imageUrl && (
             <>
               <img data-ve-img={`slide-${slide.id}`} 
                 src={slide.imageUrl} 
                 alt="" 
                 className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${current === idx ? "scale-100" : "scale-110"}`}
               />
               <div className={`absolute inset-0 bg-black/45 transition-opacity duration-[2000ms] ${current === idx ? "opacity-100" : "opacity-0"}`} />
             </>
           )}
           {/* Decorative circles animated */}
           {!slide.imageUrl && (
             <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
               <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl transition-transform duration-[8000ms] ease-out ${current === idx ? "translate-x-0 translate-y-0 scale-100" : "translate-x-10 translate-y-10 scale-90"}`} />
               <div className={`absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl transition-transform duration-[8000ms] ease-out ${current === idx ? "translate-x-0 translate-y-0 scale-100" : "-translate-x-10 -translate-y-10 scale-90"}`} />
             </div>
           )}

           <div className="relative max-w-2xl mx-auto flex flex-col items-center px-3 sm:px-4">
              <span className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-[2rem] bg-white/20 text-2xl sm:text-3xl md:text-4xl shadow-lg backdrop-blur-md mb-4 sm:mb-5 animate-fade-in-up">
                <Icon name={slide.iconName} size={28} className="text-white" strokeWidth={1.8} />
              </span>
              <h2 className="text-xl sm:text-2xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-md tracking-tight leading-tight animate-fade-in-up" style={{animationDelay: "0.1s"}}>
                {slide.title}
              </h2>
              <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-lg mb-6 sm:mb-8 animate-fade-in-up" style={{animationDelay: "0.2s"}}>
                {slide.text}
              </p>

              <Link
                href={slide.href}
                className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-xl animate-fade-in-up min-h-[44px]"
                style={{animationDelay: "0.3s"}}
              >
                {slide.btn}
              </Link>
           </div>
        </div>
      ))}

      {/* Prev / Next arrows (desktop, hidden on touch/mobile) */}
      <button
        type="button"
        onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
        aria-label="Əvvəlki slayd"
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/25 active:scale-95 transition-all duration-300"
      >
        <Icon name="arrowLeft" size={20} strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={() => setCurrent((c) => (c + 1) % slides.length)}
        aria-label="Növbəti slayd"
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/25 active:scale-95 transition-all duration-300"
      >
        <Icon name="arrowRight" size={20} strokeWidth={2.4} />
      </button>

      {/* Dots (44px touch target, small visual dot) */}
      <div className="absolute bottom-5 md:bottom-8 left-0 right-0 z-20 flex justify-center gap-1">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-label={`Slayd ${idx + 1}`}
            aria-current={current === idx}
            className="flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11 shrink-0"
          >
            <span className={`block h-2 rounded-full transition-all duration-300 ${current === idx ? "bg-white w-7 shadow-md" : "bg-white/40 w-2 hover:bg-white/60"}`} />
          </button>
        ))}
      </div>
      
      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-6 md:h-10">
          <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#F8FAFC" />
        </svg>
      </div>
    </section>
  );
}
