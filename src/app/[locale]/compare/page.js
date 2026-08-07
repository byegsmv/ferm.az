"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/apiClient";
import SafeImage from "@/components/SafeImage";
import Icon from "@/components/ui/Icon";
import { getCompareList, removeFromCompare } from "@/lib/compareUtils";
import { useSiteTexts } from "@/lib/siteTexts";

function CompareContent() {
  const searchParams = useSearchParams();
  const { t } = useSiteTexts();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback to localStorage if no search params
  const [idsToCompare, setIdsToCompare] = useState([]);

  useEffect(() => {
    let ids = searchParams.get("ids");
    if (!ids) {
      try {
        const stored = getCompareList();
        if (stored && stored.length > 0) {
          ids = stored.join(",");
        }
      } catch (e) {}
    }

    if (ids) {
      setIdsToCompare(ids.split(","));
      apiFetch(`/api/products/compare?ids=${ids}`)
        .then((data) => {
          if (data.products) {
            setProducts(data.products);
          } else if (data.error) {
            setError(data.error);
          }
        })
        .catch((e) => setError(t('products.errorLoadingProducts', 'Məhsulları yükləmək mümkün olmadı.')))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams, t]);

  const removeProduct = (id) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    const updatedIds = updatedProducts.map(p => p.id);
    setIdsToCompare(updatedIds);
    removeFromCompare(id);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">{t('products.loading', 'Yüklənir...')}</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <Icon name="tag" size={48} strokeWidth={1} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('products.emptyCompareTitle', 'Müqayisə siyahısı boşdur')}</h2>
        <p className="text-gray-500 max-w-sm mx-auto mb-8">
          {t('products.emptyCompareDesc', 'Müqayisə etmək üçün məhsul səhifəsindən "Müqayisə et" düyməsinə klikləyin.')}
        </p>
        <Link href="/products" className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors">
          {t('products.viewProductsBtn', 'Məhsullara bax')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-6 bg-gray-50 border-b border-r border-gray-100 w-1/4 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <h2 className="text-xl font-extrabold text-gray-900">{t('products.compareTableTitle', 'Məhsul Müqayisəsi')}</h2>
                <p className="text-sm text-gray-500 mt-1">{products.length} {t('products.productsCountLabel', 'məhsul')}</p>
              </th>
              {products.map((p) => (
                <th key={p.id} className="p-6 border-b border-gray-100 min-w-[250px] w-[250px] align-top relative">
                  <button 
                    onClick={() => removeProduct(p.id)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    title={t('products.removeFromCompareTitle', 'Müqayisədən sil')}
                  >
                    <Icon name="close" size={16} />
                  </button>
                  <Link href={`/products/${p.slug}`} className="block group">
                    <div className="relative w-full h-40 bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-100">
                      {p.coverImage ? (
                        <SafeImage src={p.coverImage} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Icon name="sprout" size={48} />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">{p.title}</h3>
                    <p className="text-xl font-extrabold text-brand-700 mt-2">
                      {p.price} <span className="text-sm font-semibold">{p.currency}</span>
                    </p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {/* Mağaza */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareStoreSeller', 'Mağaza / Satıcı')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  {p.store ? (
                    <Link href={`/stores/${p.store.slug}`} className="text-brand-600 font-semibold hover:underline">
                      {p.store.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">{t('products.notSpecified', 'Qeyd edilməyib')}</span>
                  )}
                </td>
              ))}
            </tr>
            
            {/* Stok */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareStockStatus', 'Stok Vəziyyəti')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  {p.stock > 0 ? (
                    <span className="text-green-600 font-medium">{t('products.inStock', 'Anbarda var')} ({p.stock})</span>
                  ) : (
                    <span className="text-red-500 font-medium">{t('products.outOfStock', 'Bitib')}</span>
                  )}
                </td>
              ))}
            </tr>

            {/* İstehsalçı */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareManufacturer', 'İstehsalçı')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-gray-900">{p.manufacturer || "-"}</td>
              ))}
            </tr>

            {/* İstehsalçı ölkə */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareCountryOfOrigin', 'İstehsalçı Ölkə')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-gray-900">{p.countryOfOrigin || "-"}</td>
              ))}
            </tr>

            {/* Aktiv Maddələr */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareActiveIngredients', 'Aktiv Maddələr')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-gray-900">
                  {p.activeIngredients?.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {p.activeIngredients.map((ai, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold w-fit">
                          {ai.name} {ai.concentration && <span className="opacity-70 font-normal">({ai.concentration})</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              ))}
            </tr>

            {/* Preparativ forma */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.comparePreparativeForm', 'Preparativ Forma')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-gray-900">{p.preparativeForm || "-"}</td>
              ))}
            </tr>

            {/* Tətbiq norması */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareUseNorm', 'Tətbiq Norması')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-gray-900 font-medium">{p.useNorm || "-"}</td>
              ))}
            </tr>

            {/* Hektar xərci (Avtomatik hesablama) */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                {t('products.compareEstHectareCost', 'Təxmini Hektar Xərci')}
                <span className="block text-xs font-normal text-gray-500 mt-0.5">{t('products.compareNormTimesPrice', 'Norma × Qiymət')}</span>
              </td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  {p.costPerHectare ? (
                    <span className="font-extrabold text-orange-600">
                      {p.costPerHectare.toFixed(2)} {p.currency}/ha
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Gözləmə müddəti */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareWaitingPeriodDays', 'Gözləmə Müddəti (gün)')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-gray-900">
                  {p.waitingPeriod ? <span className="font-semibold">{p.waitingPeriod} {t('products.unitDays', 'gün')}</span> : "-"}
                </td>
              ))}
            </tr>

            {/* Maksimum tətbiq */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareMaxApplications', 'Maks. Tətbiq Sayı')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-gray-900">{p.maxApplications || "-"}</td>
              ))}
            </tr>
            
            {/* Orqanik */}
            <tr>
              <td className="p-4 bg-gray-50 border-r border-gray-100 font-bold text-gray-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{t('products.compareIsOrganic', 'Orqanik Məhsul?')}</td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  {p.isOrganic ? (
                    <span className="text-green-600 font-bold flex items-center gap-1"><Icon name="check" size={16} /> {t('products.yesLabel', 'Bəli')}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { t } = useSiteTexts();
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{t('products.comparePageTitle', 'Müqayisə Cədvəli')}</h1>
        <p className="text-gray-500">{t('products.comparePageDesc', 'Məhsulların xüsusiyyətlərini yan-yana müqayisə edin və ən uyğununu seçin.')}</p>
      </div>
      <Suspense fallback={<div className="p-12 text-center text-gray-500">{t('products.loadingCompareData', 'Müqayisə məlumatları yüklənir...')}</div>}>
        <CompareContent />
      </Suspense>
    </main>
  );
}
