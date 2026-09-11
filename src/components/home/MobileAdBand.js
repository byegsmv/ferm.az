"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Mobil + kiçik ekranlar üçün üfüqi premium reklam bandı (slider-hazır).
 * Yan raylar (SideAdRails ≥1800px) və SideBanner (≥xl) göstərilməyəndə,
 * bu band ana səhifədə "Yeni Elanlar" bölməsindən əvvəl görünür.
 * Gələcəkdə reklam satıldıqda BANNERS massivinə yeni kart əlavə etmək
 * kifayətdir — avtomatik slider (nöqtələr + svayp + 6sn) işə düşər.
 * Tek kart varsa sadə statik band kimi davranır. Elgün istəyi (2026-09-11).
 */

const WHATSAPP_URL = "https://wa.me/994102238989";
const AUTOPLAY_MS = 6000;

const BANNERS = [
  {
    id: "placeholder",
    eyebrow: "Premium",
    title: "Burada Sizin Reklamınız Ola Bilər",
    bg: "/img/ad-rail-bg.png",
    ctaLabel: "223 89 89",
    href: WHATSAPP_URL,
  },
  // Gələcək reklam kartları bura əlavə olunacaq:
  // { id: "-client-", eyebrow: "...", title: "...", bg: "...", href: "https://..." },
];

function WhatsappIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="white" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.024-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function MobileAdBand() {
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
  const count = BANNERS.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(count, 1)), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % Math.max(count, 1)), [count]);

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, next]);

  if (!count) return null;

  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-4 mt-8 sm:mt-10 xl:hidden" aria-label="Premium reklam">
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-md bg-emerald-950"
        onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
          if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
          touchX.current = null;
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {BANNERS.map((b) => (
            <div key={b.id} className="w-full shrink-0 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.bg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
              <div className="relative h-full flex flex-col items-center justify-center text-center px-4 py-7 sm:py-9">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-amber-300/90">{b.eyebrow}</p>
                <h3 className="mt-2 text-lg sm:text-2xl md:text-3xl font-black leading-tight text-white drop-shadow-md">{b.title}</h3>
                <div className="mx-auto mt-3 h-px w-10 bg-amber-400/80" />
                <a
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Reklam üçün WhatsApp"
                  className="mt-5 inline-flex flex-col items-center gap-1.5 rounded-xl bg-[#25D366] px-7 py-3 shadow-lg shadow-emerald-950/50 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <WhatsappIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="text-sm font-black tracking-wide text-white">{b.ctaLabel}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5">
            {BANNERS.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Reklam ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-amber-400" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
