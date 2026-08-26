"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect, use } from "react";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/home/Footer";
import SafeImage from "@/components/SafeImage";
import { apiFetch } from "@/lib/apiClient";

export default function PestDetailPage({ params }) {
  const { slug } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/pests/${slug}`)
      .then((res) => {
        if (res.pest) {
          setData(res);
        } else if (res.error) {
          setError(res.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Məlumatı yükləmək mümkün olmadı");
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-brand-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-gray-400 text-xs font-semibold">Yüklənir...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 max-w-lg mx-auto text-center mt-10">
            <p className="font-bold mb-2 flex items-center gap-1.5"><Icon name="alert" size={16} /> Xəta</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : !data ? (
          <div className="text-center py-10">Zərərverici tapılmadı.</div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Header info */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
                  Zərərverici
                </span>
                <h1 className="text-3xl font-black text-gray-900 mt-2">
                  {data.pest.nameAz}
                </h1>
                <p className="text-gray-400 font-bold text-sm mt-1">
                  Elmi adı: {data.pest.nameEn}
                </p>
                {data.pest.affectedCrops && data.pest.affectedCrops.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-xs text-gray-400 font-bold self-center mr-1">Təsir etdiyi bitkilər:</span>
                    {data.pest.affectedCrops.map(c => (
                      <span key={c} className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-left md:text-right">
                <span className="text-3xl font-black text-brand-700 block">
                  {data.products.length}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Tövsiyə edilən Mübarizəvi Məhsul
                </span>
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Symptoms, Prevention, Lifecycle */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Image gallery */}
                {data.pest.images && data.pest.images.length > 0 && (
                  <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-sm">
                    <SafeImage src={data.pest.images[0]} alt={data.pest.nameAz} fill className="object-cover" />
                  </div>
                )}

                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
                  {data.pest.symptoms && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1.5"><Icon name="search" size={16} /> Simptomlar və Zədələnmə</span>
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{data.pest.symptoms}</p>
                    </div>
                  )}

                  {data.pest.lifecycle && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1.5"><Icon name="refresh" size={16} /> Həyat Dövrü</span>
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{data.pest.lifecycle}</p>
                    </div>
                  )}

                  {data.pest.prevention && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1.5"><Icon name="shieldCheck" size={16} /> Mübarizə və Profilaktika</span>
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{data.pest.prevention}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Cure Products */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <h3 className="text-xl font-black text-gray-900 px-1">
                  Mübarizə üçün İnsektisid və Dərmanlar
                </h3>

                {data.products.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-sm font-medium">Bu zərərverici üçün hələ heç bir məhsul əlavə edilməyib.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {data.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all flex gap-4 text-left"
                      >
                        <div className="relative w-16 h-16 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                          {p.coverImage ? (
                            <SafeImage src={p.coverImage} alt={p.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-600"><Icon name="sprout" size={24} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[9px] font-extrabold uppercase text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded self-start">
                            {p.store ? p.store.name : "Klassik Elan"}
                          </span>
                          <h4 className="font-bold text-gray-900 text-sm mt-1 line-clamp-1 leading-snug">
                            {p.title}
                          </h4>
                          <p className="font-extrabold text-brand-700 mt-auto text-sm">
                            ₼{p.price.toLocaleString("az-AZ")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
