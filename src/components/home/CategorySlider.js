'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteTexts } from '@/lib/siteTexts';

export default function CategorySlider({ categories = [] }) {
  const { t } = useSiteTexts();
  const [isPaused, setIsPaused] = useState(false);
  const swiperRef = useState(null)[0];

  // Tekrar olmayan kategoriler (unique)
  const uniqueCategories = Array.from(
    new Map(categories.map(cat => [cat.id, cat])).values()
  );

  return (
    <section className="py-12 bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t('homepage.catSliderTitle', 'Kateqoriyalar')}</h2>
            <p className="text-slate-600 mt-1">{t('homepage.catSliderSubtitle', 'Bütün məhsulları kəşf edin')}</p>
          </div>
        </div>

        <div
          className="relative group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <Swiper
            modules={[Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView="auto"
            loop={false}
            autoplay={{
              delay: 3500, // 3.5 saniyə pause
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              nextEl: '.category-swiper-next',
              prevEl: '.category-swiper-prev',
              enabled: true,
            }}
            speed={800} // Yavaş geçiş (800ms)
            breakpoints={{
              320: {
                slidesPerView: 2,
                spaceBetween: 12,
              },
              640: {
                slidesPerView: 3,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 5,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 6,
                spaceBetween: 24,
              },
            }}
            onBeforeInit={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="categorySwiper"
          >
            {uniqueCategories.map((category) => (
              <SwiperSlide key={category.id}>
                <Link href={`/kategoriyalar/${category.slug}`}>
                  <div className="group/card cursor-pointer h-full">
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col items-center justify-center p-6 border border-slate-100 hover:border-emerald-300">
                      
                      {/* Kategori Icon/Image */}
                      <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={96}
                            height={96}
                            className="object-contain group-hover/card:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl">
                            🌾
                          </div>
                        )}
                      </div>

                      {/* Kategori Adı */}
                      <h3 className="text-center font-semibold text-slate-900 text-sm group-hover/card:text-emerald-600 transition-colors line-clamp-2">
                        {category.name}
                      </h3>

                      {/* Məhsul Sayısı */}
                      {category.productCount && (
                        <p className="text-xs text-slate-500 mt-2">
                          {category.productCount} {t('homepage.productUnit', 'məhsul')}
                        </p>
                      )}

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Öncəki Buton */}
          <button
            className="category-swiper-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-full p-3 shadow-md hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-x-14"
            aria-label={t('homepage.catSliderPrev', 'Əvvəlki kategoriya')}
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 hover:text-emerald-600" />
          </button>

          {/* Sonrakı Buton */}
          <button
            className="category-swiper-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-full p-3 shadow-md hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-14"
            aria-label={t('homepage.catSliderNext', 'Sonrakı kategoriya')}
          >
            <ChevronRight className="w-5 h-5 text-slate-700 hover:text-emerald-600" />
          </button>

          {/* Slider Göstəricisi */}
          <div className="mt-6 flex justify-center items-center gap-2">
            <div className="text-sm text-slate-600">
              {t('homepage.catSliderPauseHint', 'Üzərinə gəlin - slider dayanacaq')}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .categorySwiper :global(.swiper-slide) {
          width: auto;
          height: auto;
        }

        @media (max-width: 768px) {
          .category-swiper-prev,
          .category-swiper-next {
            opacity: 1 !important;
            transform: translate(0, -50%) !important;
          }
        }
      `}</style>
    </section>
  );
}
