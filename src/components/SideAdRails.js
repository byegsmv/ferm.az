"use client";
import { usePathname } from "next/navigation";
import AdBanner from "@/components/AdBanner";

/**
 * Sol/sağ sabit reklam rayları (yalnız ≥1800px geniş ekranda görünür).
 * - Slot aktiv + kampaniya varsa → gerçek banner (AdBanner)
 * - Slot aktiv + kampaniya yoxdursa → premium "REKLAM Burada Ola Bilər"
 *   banner şəkli (FermerMarket logo + WhatsApp CTA, wa.me link)
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
      className="group block w-[160px] h-[600px] rounded-2xl overflow-hidden shadow-md bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
    >
      {/* Onaylı premium reklam bandı — Elgün, 2026-09-11 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/ad-rail-premium.png"
        alt="Burada reklamınız ola bilər — FermerMarket"
        width={160}
        height={600}
        className="w-[160px] h-[600px] object-cover"
      />
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
