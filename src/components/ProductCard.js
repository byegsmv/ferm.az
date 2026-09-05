"use client";
import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import SafeImage from "@/components/SafeImage";
import { apiFetch } from "@/lib/apiClient";
import { getToken } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";
import CompareButton from "@/components/CompareButton";
import { useSiteTexts } from "@/lib/siteTexts";
import { addToCart } from "@/lib/cartClient";

const TIER_CONFIG = {
  VIP:      { label: "VIP",      bg: "bg-purple-600 text-white" },
  PREMIUM:  { label: "PREMIUM",  bg: "bg-amber-500 text-white" },
  FEATURED: { label: "ÖNE ÇIXAN", bg: "bg-sky-500 text-white" },
};

export default function ProductCard({ product, tier, compact = false, initialFavorited = false }) {
  const router = useRouter();
  const isLoggedIn = !!getToken();
  const productId = product?.id || product?.slug || product?.title;
  const { t } = useSiteTexts();

  const [favorited, setFavorited] = useState(initialFavorited);

  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  function quickAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      addToCart(
        {
          id: product.id,
          title: product.titleAz || product.title,
          price: product.price,
          coverImage: product.coverImage || product.images?.[0]?.url || null,
          isCorporate: !!product.isCorporate,
          minOrderQty: product.minOrderQty || 1,
          allowRetail: product.allowRetail,
          wholesalePrice: product.wholesalePrice,
          wholesaleMinQty: product.wholesaleMinQty,
          unit: product.unit,
        },
        1
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {}
  }

  useEffect(() => {
    // Check local storage on mount to avoid hydration mismatch
    try {
      const cached = localStorage.getItem("fmk_favorites");
      if (cached) {
        const ids = JSON.parse(cached);
        if (Array.isArray(ids) && ids.includes(productId)) {
          setFavorited(true);
        }
      }
    } catch (e) {}

    if (!isLoggedIn) return;

    if (window._fmk_fetching_favs) {
      const interval = setInterval(() => {
        if (window._fmk_favs_loaded) {
          try {
            const cached = localStorage.getItem("fmk_favorites");
            if (cached) {
              const ids = JSON.parse(cached);
              if (Array.isArray(ids)) {
                setFavorited(ids.includes(productId));
              }
            }
          } catch {}
          clearInterval(interval);
        }
      }, 100);

      const handleUpdate = (e) => {
        const ids = e.detail;
        if (Array.isArray(ids)) {
          setFavorited(ids.includes(productId));
        }
      };
      window.addEventListener("fmk_favs_updated", handleUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("fmk_favs_updated", handleUpdate);
      };
    } else {
      window._fmk_fetching_favs = true;
    }

    apiFetch("/api/favorites")
      .then((data) => {
        const ids = (data.favorites || []).map((f) => f.productId);
        localStorage.setItem("fmk_favorites", JSON.stringify(ids));
        window._fmk_favs_loaded = true;
        setFavorited(ids.includes(productId));
        window.dispatchEvent(new CustomEvent("fmk_favs_updated", { detail: ids }));
      })
      .catch(() => {
        // Mark as loaded even on failure to prevent infinite setInterval polling loops
        window._fmk_favs_loaded = true;
        window._fmk_fetching_favs = false;
      });

    const handleUpdate = (e) => {
      const ids = e.detail;
      if (Array.isArray(ids)) {
        setFavorited(ids.includes(productId));
      }
    };
    window.addEventListener("fmk_favs_updated", handleUpdate);
    return () => {
      window.removeEventListener("fmk_favs_updated", handleUpdate);
    };
  }, [isLoggedIn, productId]);

  async function toggleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const nextFavorited = !favorited;
    setFavorited(nextFavorited);

    try {
      const cached = localStorage.getItem("fmk_favorites");
      let ids = cached ? JSON.parse(cached) : [];
      if (!Array.isArray(ids)) ids = [];
      if (nextFavorited) {
        if (!ids.includes(productId)) ids.push(productId);
      } else {
        ids = ids.filter(id => id !== productId);
      }
      localStorage.setItem("fmk_favorites", JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent("fmk_favs_updated", { detail: ids }));
    } catch (e) {}

    setLoading(true);
    try {
      await apiFetch("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ productId: productId }),
      });
    } catch (err) {
      setFavorited(!nextFavorited);
      try {
        const cached = localStorage.getItem("fmk_favorites");
        let ids = cached ? JSON.parse(cached) : [];
        if (!Array.isArray(ids)) ids = [];
        if (!nextFavorited) {
          if (!ids.includes(productId)) ids.push(productId);
        } else {
          ids = ids.filter(id => id !== productId);
        }
        localStorage.setItem("fmk_favorites", JSON.stringify(ids));
        window.dispatchEvent(new CustomEvent("fmk_favs_updated", { detail: ids }));
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  }

  const badge = tier && tier !== "STANDARD" ? TIER_CONFIG[tier] : null;
  const hasDiscount = product.discountedPrice && Number(product.discountedPrice) > 0 && Number(product.discountedPrice) < Number(product.price);
  const discountPercent = hasDiscount ? Math.round((1 - Number(product.discountedPrice) / Number(product.price)) * 100) : 0;

  return (
    <div className="group card-hover flex flex-col relative bg-white rounded-2xl border border-gray-100 hover:border-brand-300 shadow-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden h-full">
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-0"
        aria-label={product.titleAz || product.title}
      />

      {/* Image Container — subtle gradient backdrop instead of flat gray */}
      <div className="relative w-full bg-gradient-to-br from-gray-50 via-white to-brand-50/40 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {product.coverImage ? (
          <SafeImage
            src={product.coverImage}
            alt={product.titleAz || product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Icon name="sprout" size={48} strokeWidth={1.2} />
          </div>
        )}

        {/* Bottom fade so quick-add button + wholesale ribbon feel anchored to the image */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {hasDiscount && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-black tracking-wide text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-md shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {badge && (
            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] uppercase font-extrabold tracking-wider rounded-md shadow-sm ${badge.bg}`}>
              {badge.label === "ÖNE ÇIXAN" ? t('products.featuredBadge', 'ÖNE ÇIXAN') : badge.label}
            </span>
          )}
          {product.isCorporate && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] uppercase font-extrabold tracking-wider rounded-md shadow-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white">
              <Icon name="building" size={9} /> Korporativ
            </span>
          )}
        </div>

        {/* Quick add-to-cart — floating pill, bottom-right of the image */}
        <button
          onClick={quickAddToCart}
          className={`absolute bottom-2 right-2 z-10 flex items-center justify-center w-9 h-9 rounded-full shadow-lg border transition-all duration-300 active:scale-90 pointer-events-auto ${
            added
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "bg-white/95 border-white text-brand-700 hover:bg-brand-600 hover:text-white hover:scale-110"
          }`}
          aria-label="Səbətə əlavə et"
          title="Səbətə əlavə et"
        >
          {added ? <Icon name="check" size={17} /> : <Icon name="cart" size={17} />}
        </button>
      </div>

      {/* Floating Action Buttons (top-right) */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
        <button
          onClick={toggleFavorite}
          disabled={loading}
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/95 shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all duration-300 active:scale-90 ${favorited ? "text-red-500" : ""}`}
          aria-label="Add to favorites"
        >
          {loading ? (
            <span className="block w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-brand-500 animate-spin" />
          ) : (
            <Icon name="heart" size={16} className={favorited ? "fill-current" : ""} />
          )}
        </button>
        <div className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-auto">
           <CompareButton productId={productId} iconOnly={true} />
        </div>
      </div>

      {/* Content Container */}
      <div className={`flex flex-col flex-1 z-10 pointer-events-none ${compact ? "p-2.5" : "p-3 sm:p-4"}`}>

        {/* Title - Fixed minimum height for 2 lines to prevent jagged grids */}
        <h3 className={`font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-brand-600 transition-colors ${compact ? "text-[13px] leading-tight min-h-[30px]" : "text-[14px] sm:text-[15px] leading-snug min-h-[42px]"}`} title={product.titleAz || product.title}>
          {product.titleAz || product.title}
        </h3>

        {/* Pricing Area */}
        <div className="mt-1 mb-1 flex flex-col justify-end min-h-[44px]">
          {hasDiscount ? (
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400 line-through font-medium leading-none mb-0.5">
                {Number(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₼
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-brand-600 text-lg sm:text-xl tracking-tight">
                  {Number(product.discountedPrice).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                </span>
                <span className="font-semibold text-brand-600 text-[11px] uppercase">{product.currency || 'AZN'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-brand-700 text-lg sm:text-xl tracking-tight">
                {Number(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </span>
              <span className="font-semibold text-brand-700 text-[11px] uppercase">{product.currency || 'AZN'}</span>
            </div>
          )}
        </div>

        {/* Wholesale/corporate price — premium ribbon-style callout instead of a plain pill */}
        {product.wholesalePrice ? (
          <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 px-2 py-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white shrink-0">
              <Icon name="package" size={11} />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[10px] font-bold text-amber-800">
                Topdan {Number(product.wholesalePrice).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₼
              </span>
              {product.wholesaleMinQty ? (
                <span className="text-[9px] text-amber-600/80 font-medium truncate">min {product.wholesaleMinQty} {product.unit || "ədəd"}-dən</span>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Metadata Row (Min Qty, Location) - Pushed to absolute bottom */}
        <div className="mt-auto pt-2 flex flex-wrap items-center gap-1.5 border-t border-gray-50 min-h-[28px]">
          {product.isCorporate && product.minOrderQty && (
            <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 rounded-full">
              <Icon name="package" size={9} /> Min: {product.minOrderQty}
            </span>
          )}

          {(product.city || product.region) && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 font-medium ml-auto">
              <Icon name="mapPin" size={10} className="text-gray-300" />
              <span className="truncate max-w-[70px]">{product.city || product.region}</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
