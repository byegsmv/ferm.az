"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/home/Footer";
import SafeImage from "@/components/SafeImage";
import { apiFetch } from "@/lib/apiClient";

export default function ActiveIngredientDetailPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/active-ingredients/${id}`)
      .then((res) => {
        if (res.activeIngredient) {
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
  }, [id]);

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
          <div className="text-center py-10">Aktiv maddə tapılmadı.</div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Header / Info card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
                  Kimyəvi Tərkib Hissəsi
                </span>
                <h1 className="text-3xl font-black text-gray-900 mt-2">
                  {data.activeIngredient.nameAz}
                </h1>
                <p className="text-gray-400 font-bold text-sm mt-1">
                  Beynəlxalq adı: {data.activeIngredient.nameEn} {data.activeIngredient.cas ? `• CAS: ${data.activeIngredient.cas}` : ""}
                </p>
                {data.activeIngredient.group && (
                  <p className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full self-start inline-block mt-3">
                    Kimyəvi qrup: {data.activeIngredient.group}
                  </p>
                )}
              </div>
              <div className="text-left md:text-right">
                <span className="text-3xl font-black text-brand-700 block">
                  {data.products.length}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Qeydiyyatlı Məhsul
                </span>
              </div>
            </div>

            {/* Description & Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Description */}
              <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                  Kimyəvi təsviri
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {data.activeIngredient.description || "Bu təsir edici maddə üçün ətraflı məlumat hələ daxil edilməyib."}
                </p>
              </div>

              {/* Right Column: Matching Products */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <h3 className="text-xl font-black text-gray-900 px-1">
                  Bu maddəni saxlayan məhsullar
                </h3>

                {data.products.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-sm font-medium">Bu aktiv maddəyə sahib heç bir məhsul tapılmadı.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all flex gap-4 text-left"
                      >
                        <div className="relative w-20 h-20 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                          {p.coverImage ? (
                            <SafeImage src={p.coverImage} alt={p.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-600"><Icon name="sprout" size={32} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[9px] font-extrabold uppercase text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded self-start">
                            {p.store ? p.store.name : "Klassik Elan"}
                          </span>
                          <h4 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2 leading-snug">
                            {p.title}
                          </h4>
                          {p.concentration && (
                            <span className="text-[10px] text-gray-400 font-semibold mt-1">Konsentrasiya: {p.concentration}</span>
                          )}
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
