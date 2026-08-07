"use client";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";
import SafeImage from "@/components/SafeImage";
import ProductCard from "@/components/ProductCard";
import { useSiteTexts } from "@/lib/siteTexts";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useSiteTexts();

  useEffect(() => {
    apiFetch("/api/brands?withProducts=true")
      .then((data) => setBrands(data.brands || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-2">
        <Icon name="tag" size={28} /> {t('products.brandsTitle', 'Brendlər')}
      </h1>
      <p className="text-gray-500 mb-6">{t('products.brandsSubtitle', 'Rəsmi distribütor brendləri və istehsalçılar')}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-brand-200 transition-all duration-200 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors overflow-hidden">
              {brand.logoUrl ? (
                <SafeImage src={brand.logoUrl} alt={brand.name} fill className="object-contain p-1" />
              ) : (
                <span className="text-2xl font-black text-brand-600">{brand.name[0]}</span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors text-sm">{brand.name}</h3>
            {brand.country && <p className="text-xs text-gray-400 mt-1">{brand.country}</p>}
            {brand._count?.products > 0 && (
              <p className="text-xs text-brand-600 font-medium mt-2">{brand._count.products} {t('products.productsCountLabel', 'məhsul')}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
