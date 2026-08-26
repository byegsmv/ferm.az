"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/home/Footer";
import SafeImage from "@/components/SafeImage";
import { apiFetch } from "@/lib/apiClient";

export default function CropsPage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/crops")
      .then((data) => {
        if (data.crops) {
          setCrops(data.crops);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon name="wheat" size={24} className="text-brand-600" /> Bitki Mühafizəsi bələdçisi</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Becərdiyiniz bitkini seçərək ona uyğun xəstəlik və zərərverici həllərini, eləcə də gübrələri tapın.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-brand-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-gray-400 text-xs font-semibold">Bitki növləri yüklənir...</p>
          </div>
        ) : crops.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm max-w-md mx-auto mt-10">
            <Icon name="wheat" size={32} className="text-brand-600" />
            <p className="text-gray-400 text-sm mt-3 font-medium">Heç bir bitki növü tapılmadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {crops.map(c => (
              <Link
                key={c.id}
                href={`/crops/${c.slug}`}
                className="bg-white rounded-3xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all flex flex-col items-center text-center group"
              >
                <div className="relative w-16 h-16 rounded-2xl bg-brand-50/50 overflow-hidden flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                  {c.image ? (
                    <SafeImage src={c.image} alt={c.name} fill className="object-cover" />
                  ) : (
                    "sprout"
                  )}
                </div>
                <h4 className="font-extrabold text-gray-800 text-xs line-clamp-1">{c.name}</h4>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
