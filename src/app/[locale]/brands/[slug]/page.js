"use client";
import { useState, useEffect, use } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";
import SafeImage from "@/components/SafeImage";
import ProductCard from "@/components/ProductCard";
import { useSiteTexts } from "@/lib/siteTexts";

export default function BrandDetailPage() {
  const params = useParams();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useSiteTexts();

  useEffect(() => {
    if (!params.slug) return;
    // First get brand list, find by slug
    apiFetch("/api/brands")
      .then(async (data) => {
        const found = (data.brands || []).find(b => b.slug === params.slug);
        if (found) {
          const detail = await apiFetch(`/api/brands/${found.id}`);
          setBrand(detail.brand);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">{t('products.loading', 'Yüklənir...')}</div>;
  }

  if (!brand) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Icon name="tag" size={48} strokeWidth={1} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{t('products.brandNotFound', 'Brend tapılmadı')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-brand-50 to-green-50 rounded-3xl p-6 md:p-8 mb-8 border border-brand-100">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
            {brand.logoUrl ? (
              <SafeImage src={brand.logoUrl} alt={brand.name} fill className="object-contain p-2" />
            ) : (
              <span className="text-3xl font-black text-brand-600">{brand.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">{brand.name}</h1>
            {brand.country && <p className="text-gray-500 mt-1 flex items-center gap-1"><Icon name="mapPin" size={16} /> {brand.country}</p>}
            {brand.description && <p className="text-sm text-gray-600 mt-2 max-w-xl">{brand.description}</p>}
            {brand.website && <a href={brand.website} target="_blank" rel="noopener" className="text-brand-600 text-sm font-medium hover:underline mt-2 inline-block">{brand.website}</a>}
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">{brand.name} {t('products.brandProductsSuffix', 'məhsulları')}</h2>
      {brand.products?.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {brand.products.map((p) => (
            <ProductCard key={p.id} product={{
              ...p,
              title: p.titleAz,
              coverImage: p.images?.[0]?.url,
              currency: p.currency || "AZN",
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Icon name="package" size={48} strokeWidth={1} className="mx-auto mb-3" />
          <p>{t('products.noProductsForBrand', 'Bu brendin məhsulu yoxdur')}</p>
        </div>
      )}
    </div>
  );
}
