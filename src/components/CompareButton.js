"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useRouter } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";
import { getCompareList, addToCompare, removeFromCompare } from "@/lib/compareUtils";
import { useSiteTexts } from "@/lib/siteTexts";

export default function CompareButton({ productId, iconOnly = false, className = "" }) {
  const [inCompare, setInCompare] = useState(false);
  const [count, setCount] = useState(0);
  const router = useRouter();
  const { t } = useSiteTexts();

  useEffect(() => {
    const ids = getCompareList();
    setInCompare(ids.includes(productId));
    setCount(ids.length);
  }, [productId]);

  const toggleCompare = () => {
    const currentIds = getCompareList();
    const wasIn = currentIds.includes(productId);

    if (wasIn) {
      removeFromCompare(productId);
      setInCompare(false);
      setCount(getCompareList().length);
      toast.success(t('products.removedFromCompare', 'Müqayisədən çıxarıldı'));
    } else {
      if (currentIds.length >= 5) {
        toast.error(t('products.maxCompareLimit', 'Maksimum 5 məhsul müqayisə edilə bilər'));
        return;
      }
      addToCompare(productId);
      setInCompare(true);
      const newCount = getCompareList().length;
      setCount(newCount);
      toast.success(t('products.addedToCompare', 'Müqayisəyə əlavə edildi'));

      if (newCount >= 2) {
        setTimeout(() => router.push(`/compare?ids=${getCompareList().join(",")}`), 400);
      }
    }
  };

  if (iconOnly) {
    return (
      <button
        onClick={toggleCompare}
        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 border ${
          inCompare
            ? "bg-brand-50 text-brand-600 border-brand-200"
            : "bg-white/90 text-gray-500 border-gray-200 hover:bg-gray-50 backdrop-blur-sm"
        } ${className}`}
        title={inCompare ? t('products.removeFromCompare', 'Müqayisədən çıxar') : t('products.compare', 'Müqayisə et')}
        aria-label={inCompare ? t('products.removeFromCompare', 'Müqayisədən çıxar') : t('products.compare', 'Müqayisə et')}
      >
        <Icon name="search" size={16} strokeWidth={2} />
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleCompare}
        className={`font-semibold rounded-xl px-5 py-2.5 text-sm transition-all active:scale-95 flex items-center gap-1.5 ${
          inCompare
            ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        <Icon name="search" size={16} strokeWidth={2} />
        {inCompare ? t('products.removeFromCompare', 'Müqayisədən çıxar') : t('products.compare', 'Müqayisə et')}
      </button>
      {inCompare && count > 0 && (
        <Link
          href={`/compare?ids=${getCompareList().join(",")}`}
          className="text-sm font-bold text-brand-600 hover:underline"
        >
          <span className="flex items-center gap-1">{t('products.view', 'Bax')} <Icon name="arrowRight" size={14} /> ({count})</span>
        </Link>
      )}
    </div>
  );
}
