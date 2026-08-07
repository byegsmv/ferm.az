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
      .catch(() => {});

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

  return (
    <div className="group card-hover overflow-hidden flex flex-col relative h-full bg-white rounded-2xl border border-gray-100">
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-0"
        aria-label={product.titleAz || product.title}
      />
      {/* Image */}
      <div className="relative w-full bg-gray-50 overflow-hidden pointer-events-none" style={{ aspectRatio: "4/3" }}>
        {product.coverImage ? (
          <SafeImage
            src={product.coverImage}
            alt={product.titleAz || product.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-300"><Icon name="sprout" size={42} strokeWidth={1.2} /></div>
        )}

        {/* Tier badge */}
        {badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${badge.bg}`}>
            {badge.label === "ÖNE ÇIXAN" ? t('products.featuredBadge', 'ÖNE ÇIXAN') : badge.label}
          </span>
        )}
      </div>

      {/* Favorite btn - Always visible on mobile, visible on hover on desktop */}
      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={`absolute top-2 right-2 w-9 h-9 sm:w-10 sm:h-10 z-10 rounded-full bg-white/80 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-sm transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 ${
          favorited ? "opacity-100" : "opacity-100 md:opacity-0 group-hover:opacity-100"
        }`}
        aria-label={favorited ? t('products.inFavorites', 'Sevimlilərə əlavə edilib') : t('products.addToFavorites', 'Sevimlilərə əlavə et')}
      >
        {loading ? (
          <span className="block w-4 h-4 rounded-full border-2 border-gray-200 border-t-brand-500 animate-spin" />
        ) : (
          <Icon name="heart" size={17} className={favorited ? "text-red-500 fill-red-500" : "text-gray-500"} />
        )}
      </button>

      {/* Compare button - absolute positioned similar to favorite button */}
      <div 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} 
        className="absolute top-12 right-2 z-10 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <CompareButton productId={productId} iconOnly={true} />
      </div>

      {/* Info */}
      <div className={`flex-1 flex flex-col pointer-events-none z-10 bg-white ${compact ? "p-2.5 gap-0.5" : "p-3 gap-1"}`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-2 leading-snug ${compact ? "text-xs" : "text-sm"}`}>
          {product.titleAz || product.title}
        </h3>
        {product.isCorporate && (
          <span className="self-start text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md">
            <Icon name="building" size={11} /> {t('products.corporateBadge', 'Korporativ')}
          </span>
        )}
        <p className={`font-extrabold text-brand-700 mt-auto ${compact ? "text-sm" : "text-base"}`}>
          {Number(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} <span className="font-semibold text-xs">{product.currency || t('products.currencyAzn', 'AZN')}</span>
        </p>
        {product.isCorporate && product.minOrderQty && (
          <p className="text-[10px] text-orange-600 font-medium">{t('products.minOrderLabel', 'Min:')} {product.minOrderQty} {t('products.unitPiece', 'ədəd')}</p>
        )}
        {product.allowInstallment && (
          <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
            <Icon name="creditCard" size={12} /> {t('products.installmentLabel', 'Hissəli ödəniş')}
          </p>
        )}
        {(product.region || product.city) && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Icon name="mapPin" size={13} />
            {product.city || product.region}
          </p>
        )}
        {product.store && (
          <p className="text-[11px] text-brand-600 font-medium flex items-center gap-1 truncate">
            <Icon name="store" size={13} />
            {product.store.name}
          </p>
        )}
      {/* Hashtags — max 3 */}
      {product.tags && product.tags.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mt-1">
          {product.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full font-medium">#{tag}</span>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
