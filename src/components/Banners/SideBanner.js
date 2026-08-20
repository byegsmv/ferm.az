"use client";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { sanitizeAdCode } from "@/lib/security/adSanitizer";

export default function SideBanner({ position = "left" }) {
  const [ad, setAd] = useState(null);
  const [slotExists, setSlotExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const externalRef = useRef(null);

  useEffect(() => {
    const slotKey = position === "left" ? "SIDEBAR_LEFT" : "SIDEBAR_RIGHT";
    fetch(`/api/ad-slots/${slotKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setAd(d.content || null);
          setSlotExists(!!d.slotExists);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [position]);

  if (loading) return null;

  // Admin explicitly configured this slot (off, or internal/external with no
  // current match) — respect that and render nothing instead of the fallback.
  if (slotExists && !ad) return null;

  // Admin-configured external embed (e.g. AdSense)
  if (ad?.mode === "external" && ad.externalCode) {
    const cleanCode = sanitizeAdCode(ad.externalCode);
    return (
      <div className="hidden xl:block w-[160px] flex-shrink-0 sticky top-24 h-[600px] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div ref={externalRef} dangerouslySetInnerHTML={{ __html: cleanCode }} />
      </div>
    );
  }

  // Admin-configured internal campaign
  if (ad?.mode === "internal" && ad.campaign) {
    return (
      <div className="hidden xl:block w-[160px] flex-shrink-0 sticky top-24 h-[600px] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <a href={ad.campaign.targetUrl} className="block w-full h-full relative group">
          {ad.campaign.bannerUrl && (
            <img src={ad.campaign.bannerUrl} alt={ad.campaign.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Reklam</span>
            <h3 className="mt-2 font-black text-white text-lg leading-tight">{ad.campaign.title}</h3>
            <span className="inline-block bg-white text-brand-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm mt-2">
              Ətraflı
            </span>
          </div>
        </a>
      </div>
    );
  }

  // Slot was never configured by admin at all — show the built-in default
  // promo so the layout isn't empty before anyone touches "Reklam Yerləri".
  return (
    <div className="hidden xl:block w-[160px] flex-shrink-0 sticky top-24 h-[600px] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <Link href="/campaigns" className="block w-full h-full relative group">
        <div className="absolute inset-0 bg-brand-900/10 group-hover:bg-brand-900/0 transition-colors z-10" />
        <div className="flex flex-col h-full justify-between p-4 relative z-20">
          <div>
            <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Reklam</span>
            <h3 className="mt-4 font-black text-brand-800 text-xl leading-tight">Mövsümün<br/>Fürsəti!</h3>
            <p className="mt-2 text-xs text-gray-600 font-medium">Bütün gübrələrdə 20% endirim</p>
          </div>
          <div className="text-center">
            <span className="inline-block bg-white text-brand-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm border border-brand-100 group-hover:scale-105 transition-transform">
              Ətraflı
            </span>
          </div>
        </div>
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-brand-600">
            <path d="M0,100 C30,80 70,120 100,60 L100,100 Z" />
          </svg>
        </div>
      </Link>
    </div>
  );
}
