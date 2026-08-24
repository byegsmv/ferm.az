"use client";
import { useEffect, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Icon from "@/components/ui/Icon";

// images: [{ url, altText? }]
export default function ProductGallery({ images = [], title }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const list = images.length ? images : [{ url: null }];

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIdx((i) => (i + 1) % list.length);
      if (e.key === "ArrowLeft") setActiveIdx((i) => (i - 1 + list.length) % list.length);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, list.length]);

  return (
    <div>
      <button
        type="button"
        onClick={() => list[activeIdx]?.url && setLightboxOpen(true)}
        className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 block"
        aria-label="Şəkli böyüt"
      >
        {list[activeIdx]?.url ? (
          <>
            <SafeImage src={list[activeIdx].url} alt={title} fill className="object-cover" />
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[11px] px-2 py-1 rounded-full inline-flex items-center gap-1"><Icon name="zoomIn" size={13} /> Böyüt</span>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-300"><Icon name="sprout" size={42} strokeWidth={1.2} /></div>
        )}
      </button>

      {list.length > 1 && (
        <div className="flex gap-1.5 sm:gap-2 mt-2 overflow-x-auto pb-1">
          {list.map((img, idx) => (
            <button
              key={img.url + idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden border-2 ${
                idx === activeIdx ? "border-brand-600" : "border-transparent"
              }`}
            >
              <SafeImage src={img.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center"
            aria-label="Bağla"
          >
            <Icon name="close" size={20} />
          </button>

          {list.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + list.length) % list.length); }}
              className="absolute left-2 md:left-6 text-white text-4xl leading-none w-12 h-12 flex items-center justify-center bg-white/10 rounded-full"
              aria-label="Əvvəlki"
            >
              ‹
            </button>
          )}

          <img
            src={list[activeIdx]?.url}
            alt={title}
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {list.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % list.length); }}
              className="absolute right-2 md:right-6 text-white text-4xl leading-none w-12 h-12 flex items-center justify-center bg-white/10 rounded-full"
              aria-label="Sonrakı"
            >
              ›
            </button>
          )}

          {list.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-3 py-1 rounded-full">
              {activeIdx + 1} / {list.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
