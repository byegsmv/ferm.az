"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect, use } from "react";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/home/Footer";
import SafeImage from "@/components/SafeImage";
import { apiFetch } from "@/lib/apiClient";

export default function CropDetailPage({ params }) {
  const { slug } = use(params);
  const [crop, setCrop] = useState(null);
  const [products, setProducts] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [pests, setPests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [problemType, setProblemType] = useState(""); // "" | "disease" | "pest"
  const [problemId, setProblemId] = useState("");

  useEffect(() => {
    // Initial fetch of crop and products
    apiFetch(`/api/crops/${slug}/products`)
      .then((res) => {
        if (res.crop) {
          setCrop(res.crop);
          setProducts(res.products);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch lists of diseases & pests for problem selection dropdowns
    apiFetch("/api/diseases").then(d => { if (d.diseases) setDiseases(d.diseases); });
    apiFetch("/api/pests").then(p => { if (p.pests) setPests(p.pests); });
  }, [slug]);

  // Fetch filtered products when filters change
  useEffect(() => {
    if (loading) return;
    setFiltering(true);
    const query = problemType && problemId
      ? `?problemType=${problemType}&problemId=${problemId}`
      : "";

    apiFetch(`/api/crops/${slug}/products${query}`)
      .then((res) => {
        if (res.products) {
          setProducts(res.products);
        }
        setFiltering(false);
      })
      .catch(() => {
        setFiltering(false);
      });
  }, [problemType, problemId, slug]);

  const handleProblemTypeChange = (type) => {
    setProblemType(type);
    setProblemId("");
  };

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
            <p className="text-gray-400 text-xs font-semibold">Məlumatlar yüklənir...</p>
          </div>
        ) : !crop ? (
          <div className="text-center py-10">Bitki tapılmadı.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Title banner */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
                  Bitki Mühafizə bələdçisi
                </span>
                <h1 className="text-3xl font-black text-gray-900 mt-2">
                  {crop.nameAz} Mühafizəsi
                </h1>
                <p className="text-gray-500 mt-1">
                  Bitki üçün qeydiyyatdan keçmiş dərmanların və gübrələrin tam siyahısı.
                </p>
              </div>
              <div className="bg-brand-50 w-16 h-16 rounded-2xl flex items-center justify-center text-brand-600"><Icon name="wheat" size={32} /></div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:w-auto">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wide block mb-2">Problem növü</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProblemTypeChange("")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                      problemType === "" ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    Bütün Məhsullar
                  </button>
                  <button
                    onClick={() => handleProblemTypeChange("disease")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                      problemType === "disease" ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    Xəstəlik
                  </button>
                  <button
                    onClick={() => handleProblemTypeChange("pest")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                      problemType === "pest" ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    Zərərverici
                  </button>
                </div>
              </div>

              {problemType && (
                <div className="w-full md:w-64 md:ml-auto">
                  <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wide block mb-2">
                    {problemType === "disease" ? "Xəstəliyi seçin" : "Zərərvericini seçin"}
                  </span>
                  <select
                    value={problemId}
                    onChange={(e) => setProblemId(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm font-semibold"
                  >
                    <option value="">Hamısı</option>
                    {problemType === "disease" ? (
                      diseases.map(d => <option key={d.id} value={d.slug}>{d.nameAz}</option>)
                    ) : (
                      pests.map(p => <option key={p.id} value={p.slug}>{p.nameAz}</option>)
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Products grid */}
            <div>
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-black text-gray-900">
                  Tövsiyə edilən Mühafizə Məhsulları ({products.length})
                </h3>
                {filtering && (
                  <span className="text-xs font-semibold text-brand-600 animate-pulse">Süzgəclənir...</span>
                )}
              </div>

              {products.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                  <Icon name="wheat" size={32} className="text-brand-600" />
                  <p className="text-gray-400 text-sm mt-3 font-medium">Bu kateqoriyada məhsul tapılmadı.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="bg-white rounded-3xl border border-gray-100 hover:border-brand-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col text-left group"
                    >
                      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                        {p.coverImage ? (
                          <SafeImage
                            src={p.coverImage}
                            alt={p.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-30 text-gray-400"><Icon name="package" size={36} /></div>
                        )}
                      </div>
                      <div className="p-4 flex-grow flex flex-col">
                        <span className="text-[9px] font-extrabold uppercase text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded self-start">
                          {p.store ? p.store.name : "Klassik Elan"}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm mt-1.5 line-clamp-2 leading-snug min-h-[40px]">
                          {p.title}
                        </h4>
                        
                        {p.activeIngredients && p.activeIngredients.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.activeIngredients.map((ai, index) => (
                              <span key={index} className="text-[9px] font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded">
                                {ai.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="font-black text-brand-700 mt-auto pt-3 text-base">
                          ₼{p.price.toLocaleString("az-AZ")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
