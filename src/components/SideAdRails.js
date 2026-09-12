"use client";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AdBanner from "@/components/AdBanner";

/**
 * Sol/sağ sabit reklam rayları (yalnız ≥1350px geniş ekranda görünür).
 * - Slot aktiv + kampaniya varsa → gerçek banner (AdBanner)
 * - Slot aktiv + kampaniya yoxdursa → premium "REKLAM Burada Ola Bilər"
 *   banner şəkli (FermerMarket logo + WhatsApp CTA, wa.me link)
 * - Slot admin tərəfindən söndürülübsə → heç nə göstərilir
 *
 * Mövqe: header və footer dinamik izlənilir (ResizeObserver + scroll),
 * ray bunların arasında saxlanılır və heç vaxt üstlərinə çıxmır.
 */
function useSafeTop(railRef) {
  const [top, setTop] = useState(null);

  useLayoutEffect(() => {
    let raf = null;
    const gap = 20;

    function compute() {
      const el = railRef.current;
      if (!el) return;
      const header = document.querySelector("header");
      const footer = document.querySelector("footer");
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
      const vh = window.innerHeight;
      const railH = el.offsetHeight || 600;

      const minTop = Math.max(headerBottom + gap, gap);
      const idealTop = (vh - railH) / 2;
      const maxTop = Math.min(vh - railH - gap, footerTop - railH - gap);
      const nextTop = Math.min(Math.max(minTop, idealTop), maxTop);
      setTop(nextTop);
    }

    function onFrame() {
      raf = null;
      compute();
    }
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(onFrame);
    }

    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const ro = new ResizeObserver(schedule);
    if (railRef.current) ro.observe(railRef.current);
    const headerEl = document.querySelector("header");
    if (headerEl) ro.observe(headerEl);
    const footerEl = document.querySelector("footer");
    if (footerEl) ro.observe(footerEl);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [railRef]);

  return top;
}

function CurtainReveal({ children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl">
      {children}
      <div
        className="absolute inset-0 z-20 pointer-events-none rounded-3xl animate-curtain-reveal bg-gradient-to-br from-[#4d7c0f] via-[#3f6212] to-[#ca8a04] shadow-xl"
        style={{ animationDelay: "550ms" }}
      />
    </div>
  );
}

function RailShell({ side, children }) {
  const railRef = useRef(null);
  const top = useSafeTop(railRef);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), side === "left" ? 120 : 260);
    return () => clearTimeout(t);
  }, [side]);

  return (
    <div
      ref={railRef}
      style={{
        top: top == null ? "50%" : `${top}px`,
        transition: "top 0.35s ease-out",
        "--content-gap": "calc((100vw - 1200px) / 2)",
        "--rail-w": "clamp(56px, calc(var(--content-gap) - 8px), 190px)",
        width: "var(--rail-w)",
        [side === "left" ? "left" : "right"]: "calc(var(--content-gap) - var(--rail-w))",
      }}
      className={`hidden [@media(min-width:1350px)]:block fixed z-30 ${
        entered ? (side === "left" ? "animate-rail-in-left" : "animate-rail-in-right") : "opacity-0"
      }`}
    >
      <CurtainReveal>{children}</CurtainReveal>
    </div>
  );
}

export default function SideAdRails({ left, right, whatsappUrl }) {
  const pathname = usePathname();
  const isPanel = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
  if (isPanel) return null;
  if (!left?.on && !right?.on) return null;

  const placeholder = (side) => (
    <div
      className="group relative block w-full aspect-[160/600] rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.035] hover:-translate-y-0.5 animate-banner-pulse ring-1 ring-amber-300/30"
      style={{ containerType: "inline-size" }}
    >
      {/* Marka rəngli qradient — FermerMarket loqosunun zeytun-yaşıl + qızılı-sarı tonları (Elgün istəyi: tünd yaşıl yox) */}
      <div className={`absolute inset-0 bg-gradient-to-b from-[#4d7c0f] via-[#65a30d] to-[#ca8a04] animate-rail-float ${side === "right" ? "-scale-x-100" : ""}`} />

      {/* İncə buğday sünbülü naxışı — dekorativ */}
      <svg className={`absolute inset-0 w-full h-full opacity-[0.18] ${side === "right" ? "-scale-x-100" : ""}`} viewBox="0 0 160 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round">
          {[20, 140].map((cx, i) => (
            <g key={i} transform={`translate(${cx},20)`}>
              <path d="M0,0 L0,560" />
              {Array.from({ length: 16 }).map((_, n) => (
                <g key={n}>
                  <path d={`M0,${20 + n * 34} q14,-8 22,3`} />
                  <path d={`M0,${20 + n * 34} q-14,-8 -22,3`} />
                </g>
              ))}
            </g>
          ))}
        </g>
      </svg>

      {/* İncə şimmer keçidi — premium canlılıq */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay animate-shimmer-sweep pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 35%, rgba(255,255,255,.55) 50%, transparent 65%)",
        }}
      />

      {/* Üst-alt vinyet — mətnin oxunaqlılığı üçün */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />

      {/* Zərif işıq halqası — kənarlarda parıltı */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/15 pointer-events-none" />

      {/* Davamlı "açılış-bağlanış" pərdə keçidi — diqqəti daim çəksin (Elgün istəyi 2026-09-12) */}
      <div className="absolute inset-0 z-10 pointer-events-none animate-curtain-cycle bg-gradient-to-b from-[#365314] via-[#4d7c0f] to-[#a16207]" />

      {/* Yazı katmanı — HTML (Elgün istəyi: mətn şəklin üzərinə bişirilmir, real mətn) */}
      <div className="relative h-full flex flex-col items-center justify-center gap-[10cqw] px-[12cqw] text-center animate-rail-float">
        <div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <h3 className="text-[13.5cqw] font-black leading-[1.15] text-white drop-shadow-md">
            Burada Sizin Reklamınız Ola Bilər
          </h3>
          <div className="mx-auto mt-[4.5cqw] h-px w-[7.5cqw] bg-amber-300/90" />
        </div>
        <div className="flex flex-col items-center gap-[6cqw]">
          {[
            { key: "wa", title: "WhatsApp", href: "https://wa.me/994102238989", path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.024-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
            { key: "ig", title: "Instagram", href: "https://instagram.com/fermermarket.az", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
            { key: "fb", title: "Facebook", href: "https://www.facebook.com/share/1LDQEgQBcd/?mibextid=wwXIfr", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
            { key: "tt", title: "TikTok", href: "https://tiktok.com/@fermermarket.az", path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
          ].map((s, i) => (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.title}
              className="icon-spin-on-hover flex items-center justify-center w-[15cqw] h-[15cqw] min-w-[34px] min-h-[34px] rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-200 hover:scale-125 hover:bg-white/30 active:scale-95 animate-fade-in-up"
              style={{ animationDelay: `${220 + i * 60}ms` }}
            >
              <svg viewBox="0 0 24 24" className="h-[8.5cqw] w-[8.5cqw] min-w-[16px] min-h-[16px] fill-white drop-shadow-md" aria-hidden="true"><path d={s.path} /></svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  const rail = (data, side) =>
    !data?.on ? null : (
      <RailShell side={side}>
        {data.content ? (
          <div className="animate-rail-float">
            <AdBanner content={data.content} imgClassName="w-full h-full object-cover" />
          </div>
        ) : (
          placeholder(side)
        )}
      </RailShell>
    );

  return (
    <>
      {rail(left, "left")}
      {rail(right, "right")}
    </>
  );
}
