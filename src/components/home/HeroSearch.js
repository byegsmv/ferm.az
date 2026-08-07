"use client";
import Icon from "@/components/ui/Icon";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useSiteTexts } from "@/lib/siteTexts";

const TRENDING = [
  "Pomidor toxumu", "Azot gübrəsi", "Dana satılır",
  "Traktor kirayəsi", "Arı ailəsi", "Qoyun satılır",
];

export default function HeroSearch() {
  const { t } = useSiteTexts();
  const [value, setValue] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const fetchSuggestions = useCallback((q) => {
    if (!q || q.length < 2) { setResults(null); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data || null);
      } catch { setResults(null); }
      finally { setFetching(false); }
    }, 300);
  }, []);

  useEffect(() => { fetchSuggestions(value); }, [value, fetchSuggestions]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function submit(q) {
    const term = q || value;
    if (!term.trim()) return;
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(term.trim())}`);
  }

  const showTrending = open && value.length < 2;
  const showResults = open && value.length >= 2;

  const hasAnyResults = results && (
    (results.products?.length || 0) > 0 ||
    (results.ingredients?.length || 0) > 0 ||
    (results.diseases?.length || 0) > 0 ||
    (results.pests?.length || 0) > 0 ||
    (results.companies?.length || 0) > 0
  );

  return (
    <div className="relative max-w-xl mx-auto">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex rounded-2xl overflow-hidden shadow-xl shadow-black/20 bg-white"
        style={{ height: 52 }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={t('homepage.heroSearchPlaceholder', 'Nə axtarırsınız? (məs: Pomidor toxumu)')}
          className="flex-1 min-w-0 px-5 text-gray-900 text-sm focus:outline-none"
          autoComplete="off"
        />
        {fetching && (
          <div className="flex items-center px-3">
            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        )}
        <button
          type="submit"
          className="shrink-0 h-full px-5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="hidden sm:inline">{t('homepage.heroSearchBtn', 'Axtar')}</span>
        </button>
      </form>

      {/* Dropdown */}
      {(showTrending || showResults) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[450px] overflow-y-auto">
          {showTrending && (
            <>
              <p className="text-[11px] font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide"><span className="flex items-center gap-1"><Icon name="flame" size={14} className="text-amber-500" /> {t('homepage.heroSearchTrending', 'Trend Axtarışlar')}</span></p>
              {TRENDING.map((s) => (
                <button key={s} type="button" onMouseDown={() => submit(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 text-left transition-colors">
                  <Icon name="search" size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{s}</span>
                </button>
              ))}
            </>
          )}

          {showResults && !hasAnyResults && !fetching && (
            <p className="text-sm text-gray-400 px-4 py-4 text-center">{t('homepage.heroSearchNoResults', 'Nəticə tapılmadı')}</p>
          )}

          {showResults && hasAnyResults && (
            <div className="divide-y divide-gray-100">
              {/* Products Section */}
              {results.products && results.products.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 px-4 pt-2.5 pb-1 uppercase tracking-wider bg-gray-50/50">{t('homepage.heroSearchProducts', 'Məhsullar')}</p>
                  {results.products.map((p) => (
                    <button key={p.id} type="button" onMouseDown={() => router.push(`/products/${p.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-brand-50 text-left transition-colors">
                      {p.coverImage ? (
                        <img src={p.coverImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0"><Icon name="package" size={18} /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{p.titleAz}</p>
                        <p className="text-[10px] text-brand-600 font-extrabold">₼{p.price.toLocaleString("az-AZ")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Active Ingredients Section */}
              {results.ingredients && results.ingredients.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 px-4 pt-2.5 pb-1 uppercase tracking-wider bg-gray-50/50"><span className="flex items-center gap-1"><Icon name="flask" size={14} className="text-purple-500" /> {t('homepage.heroSearchIngredients', 'Aktiv Maddələr')}</span></p>
                  {results.ingredients.map((ing) => (
                    <button key={ing.id} type="button" onMouseDown={() => router.push(`/active-ingredients/${ing.id}`)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-brand-50 text-left transition-colors text-xs font-semibold text-gray-700">
                      <span>{ing.nameAz} ({ing.name})</span>
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{ing.productCount} {t('homepage.heroSearchProductCountUnit', 'məhsul')}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Diseases Section */}
              {results.diseases && results.diseases.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 px-4 pt-2.5 pb-1 uppercase tracking-wider bg-gray-50/50"><span className="flex items-center gap-1"><Icon name="bug" size={14} className="text-red-500" /> {t('homepage.heroSearchDiseases', 'Xəstəliklər')}</span></p>
                  {results.diseases.map((d) => (
                    <button key={d.id} type="button" onMouseDown={() => router.push(`/diseases/${d.slug}`)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-brand-50 text-left transition-colors text-xs font-semibold text-gray-700">
                      <Icon name="bug" size={16} className="text-red-500" />
                      <span>{d.nameAz}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Pests Section */}
              {results.pests && results.pests.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 px-4 pt-2.5 pb-1 uppercase tracking-wider bg-gray-50/50"><span className="flex items-center gap-1"><Icon name="bug" size={14} className="text-emerald-500" /> {t('homepage.heroSearchPests', 'Zərərvericilər')}</span></p>
                  {results.pests.map((pest) => (
                    <button key={pest.id} type="button" onMouseDown={() => router.push(`/pests/${pest.slug}`)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-brand-50 text-left transition-colors text-xs font-semibold text-gray-700">
                      <Icon name="bug" size={16} className="text-emerald-500" />
                      <span>{pest.nameAz}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Companies Section */}
              {results.companies && results.companies.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 px-4 pt-2.5 pb-1 uppercase tracking-wider bg-gray-50/50"><span className="flex items-center gap-1"><Icon name="store" size={14} className="text-blue-500" /> {t('homepage.heroSearchStores', 'Mağazalar')}</span></p>
                  {results.companies.map((store) => (
                    <button key={store.id} type="button" onMouseDown={() => router.push(`/stores/${store.slug}`)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-brand-50 text-left transition-colors text-xs font-semibold text-gray-700">
                      <Icon name="store" size={16} className="text-blue-500" />
                      <span>{store.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
