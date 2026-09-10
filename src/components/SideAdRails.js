"use client";
import { usePathname } from "next/navigation";
import AdBanner from "@/components/AdBanner";

/**
 * Sol/sağ sabit reklam rayları (yalnız ≥1800px geniş ekranda görünür).
 * - Slot aktiv + kampaniya varsa → gerçek banner (AdBanner)
 * - Slot aktiv + kampaniya yoxdursa → "Burada sizin reklamınız ola bilər"
 *   animasyonlu (GIF-benzeri) WhatsApp yönləndirmə kartı (wa.me)
 * - Slot admin tərəfindən söndürülübsə → heç nə göstərilir
 */
export default function SideAdRails({ left, right, whatsappUrl }) {
  const pathname = usePathname();
  const isPanel = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
  if (isPanel) return null;
  if (!left?.on && !right?.on) return null;

  const placeholder = (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Reklam üçün WhatsApp"
      className="fm-ad-rail group block w-[160px] h-[600px] rounded-2xl overflow-hidden shadow-sm bg-white transition-shadow duration-300 hover:shadow-xl"
    >
      <style>{`
        @keyframes fmAdPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes fmAdRipple { 0% { transform: scale(1); opacity: .45; } 100% { transform: scale(1.9); opacity: 0; } }
        @keyframes fmAdLine { 0%,10% { opacity: 0; transform: translateY(10px); } 20%,72% { opacity: 1; transform: translateY(0); } 82%,100% { opacity: 0; transform: translateY(-6px); } }
        @keyframes fmAdShimmer { 0% { background-position: -180% 0; } 100% { background-position: 180% 0; } }
        @keyframes fmAdBorder { 0%,100% { border-color: rgb(167 243 208); } 50% { border-color: rgb(37 211 102); } }
        .fm-ad-rail { border: 2px dashed rgb(167 243 208); animation: fmAdBorder 2.6s ease-in-out infinite; }
        .fm-ad-icon-wrap { animation: fmAdPulse 2.2s ease-in-out infinite; }
        .fm-ad-ripple { animation: fmAdRipple 2.2s ease-out infinite; }
        .fm-ad-line { opacity: 0; animation: fmAdLine 6s ease-in-out infinite; }
        .fm-ad-line-2 { animation-delay: .7s; }
        .fm-ad-line-3 { animation-delay: 1.4s; }
        .fm-ad-cta {
          background: linear-gradient(110deg, #25D366 35%, #4ade80 50%, #25D366 65%);
          background-size: 200% 100%;
          animation: fmAdShimmer 2.8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .fm-ad-rail, .fm-ad-icon-wrap, .fm-ad-ripple, .fm-ad-line, .fm-ad-cta { animation: none; }
          .fm-ad-line { opacity: 1; }
        }
      `}</style>
      <div className="h-full flex flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="relative w-14 h-14 flex items-center justify-center">
          <span className="fm-ad-ripple absolute inset-0 rounded-full bg-[#25D366]" aria-hidden="true"></span>
          <span className="fm-ad-icon-wrap relative w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>
        </span>
        <p className="text-[15px] font-extrabold text-gray-700 leading-tight flex flex-col gap-1.5">
          <span className="fm-ad-line">Burada sizin</span>
          <span className="fm-ad-line fm-ad-line-2">reklamınız</span>
          <span className="fm-ad-line fm-ad-line-3 text-[#25D366]">ola bilər</span>
        </p>
        <span className="fm-ad-cta inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold text-white">
          Reklam üçün WhatsApp
          <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-white fill-none" strokeWidth="3"><path d="M7 17L17 7M17 7H9M17 7v8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </div>
    </a>
  );

  const rail = (data, side) =>
    !data?.on ? null : (
      <div
        className={`hidden [@media(min-width:1800px)]:block fixed top-1/2 -translate-y-1/2 z-30 ${
          side === "left" ? "left-3" : "right-3"
        }`}
      >
        {data.content ? (
          <AdBanner content={data.content} imgClassName="w-[160px] h-[600px] object-cover" />
        ) : (
          placeholder
        )}
      </div>
    );

  return (
    <>
      {rail(left, "left")}
      {rail(right, "right")}
    </>
  );
}
