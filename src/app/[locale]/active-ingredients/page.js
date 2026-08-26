"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/home/Footer";
import { apiFetch } from "@/lib/apiClient";

export default function ActiveIngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/api/active-ingredients")
      .then((data) => {
        if (data.activeIngredients) {
          setIngredients(data.activeIngredients);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filtered = search
    ? ingredients.filter(i => 
        i.nameAz.toLowerCase().includes(search.toLowerCase()) || 
        i.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        (i.cas && i.cas.includes(search))
      )
    : ingredients;

  // Group by first letter of nameAz
  const groups = {};
  filtered.forEach(ing => {
    const char = ing.nameAz.trim().charAt(0).toUpperCase();
    if (!groups[char]) groups[char] = [];
    groups[char].push(ing);
  });

  const sortedLetters = Object.keys(groups).sort();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <span className="flex items-center gap-2"><Icon name="flask" size={24} className="text-purple-600" /> Aktiv Maddələr Kataloqu</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Herbisid, fungisid və digər pestisidlərin təsir edici maddələrini və onların oxşarlarını müqayisə edin.
            </p>
          </div>
          <div className="w-full md:w-64">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Aktiv maddə və ya CAS nömrəsi..."
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
            <p className="text-gray-400 text-xs font-semibold">Aktiv maddələr yüklənir...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm max-w-md mx-auto mt-10">
            <Icon name="flask" size={32} className="text-purple-600" />
            <p className="text-gray-400 text-sm mt-3 font-medium">Heç bir aktiv maddə tapılmadı.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {sortedLetters.map(letter => (
              <div key={letter} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-2xl font-black text-brand-700 border-b border-gray-100 pb-3 mb-4">{letter}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups[letter].map(ing => (
                    <Link
                      key={ing.id}
                      href={`/active-ingredients/${ing.id}`}
                      className="p-4 rounded-2xl hover:bg-brand-50/50 border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all flex flex-col gap-1 text-left"
                    >
                      <div className="flex justify-between items-start w-full gap-2">
                        <h4 className="font-extrabold text-gray-800 text-sm">{ing.nameAz}</h4>
                        <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded flex-shrink-0">
                          {ing.productCount} məhsul
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold">{ing.nameEn} {ing.cas ? `• CAS: ${ing.cas}` : ""}</p>
                      {ing.group && (
                        <p className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded self-start mt-2">
                          Kimyəvi qrup: {ing.group}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
