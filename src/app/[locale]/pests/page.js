"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/home/Footer";
import SafeImage from "@/components/SafeImage";
import { apiFetch } from "@/lib/apiClient";

export default function PestsPage() {
  const [pests, setPests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/api/pests")
      .then((data) => {
        if (data.pests) {
          setPests(data.pests);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filtered = search
    ? pests.filter(p => 
        p.nameAz.toLowerCase().includes(search.toLowerCase()) || 
        p.nameEn.toLowerCase().includes(search.toLowerCase())
      )
    : pests;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <span className="flex items-center gap-2"><Icon name="bug" size={24} className="text-emerald-600" /> Zərərvericilər Kataloqu</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Təsərrüfatınıza ziyan vuran cücü və digər zərərvericiləri tapın, həyat dövrünü öyrənin və mübarizə aparın.
            </p>
          </div>
          <div className="w-full md:w-64">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zərərverici adı axtar..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-800 text-sm transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-brand-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-gray-400 text-xs font-semibold">Zərərvericilər yüklənir...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm max-w-md mx-auto mt-10">
            <Icon name="bug" size={32} className="text-emerald-600" />
            <p className="text-gray-400 text-sm mt-3 font-medium">Heç bir zərərverici tapılmadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <Link
                key={p.id}
                href={`/pests/${p.slug}`}
                className="bg-white rounded-3xl border border-gray-100 hover:border-brand-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col text-left group"
              >
                <div className="relative w-full aspect-video bg-gray-50 overflow-hidden">
                  {p.images && p.images.length > 0 ? (
                    <SafeImage
                      src={p.images[0]}
                      alt={p.nameAz}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30 text-emerald-600"><Icon name="bug" size={36} /></div>
                  )}
                </div>
                <div className="p-5 flex-grow flex flex-col">
                  <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded self-start">
                    Zərərverici
                  </span>
                  <h3 className="text-lg font-black text-gray-800 mt-2 line-clamp-1">{p.nameAz}</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-1">Elmi adı: {p.nameEn}</p>
                  <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed">
                    {p.symptoms || "Simptomlar barədə məlumat daxil edilməyib."}
                  </p>
                  {p.affectedCrops && p.affectedCrops.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-gray-50 flex flex-wrap gap-1.5">
                      {p.affectedCrops.map(c => (
                        <span key={c} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
