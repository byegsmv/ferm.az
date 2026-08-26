"use client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useCallback, useState, useEffect } from "react";
import CategorySelector from "@/components/ui/CategorySelector";
import Icon from "@/components/ui/Icon";

// ── Azərbaycanın bütün şəhər və rayonları ──────────────────────────
const AZ_REGIONS = [
  // Böyük şəhərlər
  { label: "Bakı", group: "Şəhər" },
  { label: "Gəncə", group: "Şəhər" },
  { label: "Sumqayıt", group: "Şəhər" },
  { label: "Naxçıvan", group: "Şəhər" },
  { label: "Mingəçevir", group: "Şəhər" },
  { label: "Şirvan", group: "Şəhər" },
  { label: "Lənkəran", group: "Şəhər" },
  { label: "Naftalan", group: "Şəhər" },
  // Abşeron iqtisadi rayonu
  { label: "Abşeron", group: "Abşeron" },
  { label: "Xızı", group: "Abşeron" },
  { label: "Xüsusi iqtisadi bölgə (Pirallahı)", group: "Abşeron" },
  // Aran iqtisadi rayonu
  { label: "Ağcabədi", group: "Aran" },
  { label: "Ağdam", group: "Aran" },
  { label: "Bərdə", group: "Aran" },
  { label: "Beyləqan", group: "Aran" },
  { label: "Biləsuvar", group: "Aran" },
  { label: "Füzuli", group: "Aran" },
  { label: "Hacıqabul", group: "Aran" },
  { label: "İmişli", group: "Aran" },
  { label: "Kürdəmir", group: "Aran" },
  { label: "Saatlı", group: "Aran" },
  { label: "Sabirabad", group: "Aran" },
  { label: "Salyan", group: "Aran" },
  { label: "Ucar", group: "Aran" },
  { label: "Zərdab", group: "Aran" },
  // Dağlıq Şirvan iqtisadi rayonu
  { label: "Ağsu", group: "Dağlıq Şirvan" },
  { label: "Goranboy", group: "Dağlıq Şirvan" },
  { label: "Göygöl", group: "Dağlıq Şirvan" },
  { label: "Samux", group: "Dağlıq Şirvan" },
  { label: "Daşkəsən", group: "Dağlıq Şirvan" },
  // Gəncə-Qazax iqtisadi rayonu
  { label: "Ağstafa", group: "Gəncə-Qazax" },
  { label: "Qazax", group: "Gəncə-Qazax" },
  { label: "Şəmkir", group: "Gəncə-Qazax" },
  { label: "Tovuz", group: "Gəncə-Qazax" },
  { label: "Gədəbəy", group: "Gəncə-Qazax" },
  // Quba-Xaçmaz iqtisadi rayonu
  { label: "Dəvəçi (Şabran)", group: "Quba-Xaçmaz" },
  { label: "Quba", group: "Quba-Xaçmaz" },
  { label: "Qusar", group: "Quba-Xaçmaz" },
  { label: "Siyəzən", group: "Quba-Xaçmaz" },
  { label: "Xaçmaz", group: "Quba-Xaçmaz" },
  // Lənkəran iqtisadi rayonu
  { label: "Astara", group: "Lənkəran" },
  { label: "Cəlilabad", group: "Lənkəran" },
  { label: "Lerik", group: "Lənkəran" },
  { label: "Masallı", group: "Lənkəran" },
  { label: "Yardımlı", group: "Lənkəran" },
  // Naxçıvan MR
  { label: "Babək", group: "Naxçıvan MR" },
  { label: "Culfa", group: "Naxçıvan MR" },
  { label: "Kəngərli", group: "Naxçıvan MR" },
  { label: "Ordubad", group: "Naxçıvan MR" },
  { label: "Sədərək", group: "Naxçıvan MR" },
  { label: "Şahbuz", group: "Naxçıvan MR" },
  { label: "Şərur", group: "Naxçıvan MR" },
  // Şəki-Zaqatala iqtisadi rayonu
  { label: "Balakən", group: "Şəki-Zaqatala" },
  { label: "Qax", group: "Şəki-Zaqatala" },
  { label: "Qəbələ", group: "Şəki-Zaqatala" },
  { label: "Oğuz", group: "Şəki-Zaqatala" },
  { label: "Şəki", group: "Şəki-Zaqatala" },
  { label: "Zaqatala", group: "Şəki-Zaqatala" },
  // Şirvan iqtisadi rayonu
  { label: "Ağdaş", group: "Şirvan" },
  { label: "Göyçay", group: "Şirvan" },
  { label: "İsmayıllı", group: "Şirvan" },
  { label: "Qobustan", group: "Şirvan" },
  { label: "Şamaxı", group: "Şirvan" },
  { label: "Yevlax", group: "Şirvan" },
  // Yukari Qarabag
  { label: "Xankəndi", group: "Qarabağ" },
  { label: "Xocavənd", group: "Qarabağ" },
  { label: "Şuşa", group: "Qarabağ" },
  { label: "Laçın", group: "Qarabağ" },
  { label: "Kəlbəcər", group: "Qarabağ" },
  { label: "Ağdərə", group: "Qarabağ" },
  { label: "Xocaəsgər", group: "Qarabağ" },
  { label: "Zəngilan", group: "Qarabağ" },
  { label: "Qubadlı", group: "Qarabağ" },
  // Həştərxan-Xəzər
  { label: "Neft Daşları", group: "Bakı" },
];

const ALL_REGION_NAMES = AZ_REGIONS.map(r => r.label);
const REGION_GROUPS = [...new Set(AZ_REGIONS.map(r => r.group))];

export default function AdvancedFilterSidebar({ categories }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    regions: searchParams.get("regions")
      ? searchParams.get("regions").split(",")
      : searchParams.get("region")
      ? [searchParams.get("region")]
      : [],
    sort: searchParams.get("sort") || "",
    isCorporate: searchParams.get("isCorporate") || "",
    isOrganic: searchParams.get("isOrganic") === "true",
    isDiscounted: searchParams.get("isDiscounted") === "true",
    hasInstallment: searchParams.get("hasInstallment") === "true",
    hasDelivery: searchParams.get("hasDelivery") === "true",
    tags: searchParams.get("tags") || "",
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [isRegionOpen, setIsRegionOpen] = useState(true);
  const [activeGroup, setActiveGroup] = useState("Hamısı");

  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      regions: searchParams.get("regions")
        ? searchParams.get("regions").split(",")
        : searchParams.get("region")
        ? [searchParams.get("region")]
        : [],
      sort: searchParams.get("sort") || "",
      isCorporate: searchParams.get("isCorporate") || "",
      isOrganic: searchParams.get("isOrganic") === "true",
      isDiscounted: searchParams.get("isDiscounted") === "true",
      hasInstallment: searchParams.get("hasInstallment") === "true",
      hasDelivery: searchParams.get("hasDelivery") === "true",
      tags: searchParams.get("tags") || "",
    });
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      const params = new URLSearchParams();
      Object.entries(updated).forEach(([key, value]) => {
        if (key === "regions") {
          if (value && value.length > 0) params.set(key, value.join(","));
        } else if (value) {
          params.set(key, value);
        }
      });
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [filters, router]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    updateFilters({ [name]: value });
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateFilters({ [e.target.name]: e.target.value });
    }
  };

  const handleRegionToggle = (regionLabel) => {
    const already = filters.regions.includes(regionLabel);
    let newRegions = already
      ? filters.regions.filter((r) => r !== regionLabel)
      : [...filters.regions, regionLabel];
    updateFilters({ regions: newRegions });
  };

  const clearAll = () => {
    const cleared = {
      search: "", category: "", minPrice: "", maxPrice: "", regions: [],
      sort: "", isCorporate: "", isOrganic: false, isDiscounted: false,
      hasInstallment: false, hasDelivery: false, tags: "",
    };
    setFilters(cleared);
    router.push("/products");
  };

  // Filtered regions by search + active group tab
  const visibleRegions = AZ_REGIONS.filter((r) => {
    const matchSearch = r.label.toLowerCase().includes(regionSearch.toLowerCase());
    const matchGroup = activeGroup === "Hamısı" || r.group === activeGroup;
    return matchSearch && matchGroup;
  });

  const activeFilterCount = [
    filters.regions.length > 0,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.isDiscounted,
    filters.hasInstallment,
    filters.hasDelivery,
    filters.isOrganic,
    filters.isCorporate,
    filters.tags,
  ].filter(Boolean).length;

  // ── SIDEBAR CONTENT ───────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Icon name="filter" size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">Filtrlər</h2>
            {activeFilterCount > 0 && (
              <p className="text-xs text-brand-600 font-medium">{activeFilterCount} aktiv filter</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              Sıfırla
            </button>
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>

      {/* Selected region chips */}
      {filters.regions.length > 0 && (
        <div className="px-5 pt-3 pb-0 flex flex-wrap gap-1.5">
          {filters.regions.map((r) => (
            <button
              key={r}
              onClick={() => handleRegionToggle(r)}
              className="inline-flex items-center gap-1 bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-brand-700 transition-colors"
            >
              {r}
              <span className="ml-0.5 opacity-70 hover:opacity-100">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Axtarış */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Axtarış</label>
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              value={filters.search}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Məhsul adı..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
        </div>

        {/* Kateqoriya */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Kateqoriya</label>
          <CategorySelector
            categories={categories}
            defaultValue={filters.category}
            onChange={(slug) => updateFilters({ category: slug })}
          />
        </div>

        {/* Qiymət aralığı */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Qiymət (₼)</label>
          <div className="flex items-center gap-2">
            <input
              name="minPrice"
              type="number"
              value={filters.minPrice}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Min"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
            <span className="text-gray-400 font-medium flex-shrink-0">—</span>
            <input
              name="maxPrice"
              type="number"
              value={filters.maxPrice}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Max"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
        </div>

        {/* Əlavə seçimlər */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Xüsusiyyətlər</label>
          <div className="space-y-1">
            {[
              { key: "isDiscounted", label: "Endirimli", icon: "tag" },
              { key: "hasInstallment", label: "Taksitli ödəniş", icon: "creditCard" },
              { key: "hasDelivery", label: "Çatdırılma edilir", icon: "truck" },
              { key: "isOrganic", label: "Orqanik", icon: "leaf" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  filters[key]
                    ? "bg-brand-50 border border-brand-200"
                    : "bg-gray-50 border border-transparent hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    filters[key]
                      ? "bg-brand-600 border-brand-600"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {filters[key] && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={filters[key]}
                  onChange={(e) => updateFilters({ [key]: e.target.checked })}
                />
                <span className="text-sm text-gray-700 font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── ŞƏHƏRlər / RAYONLAR ─────────────────────────────────── */}
        <div>
          <button
            onClick={() => setIsRegionOpen((v) => !v)}
            className="w-full flex items-center justify-between group"
          >
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer">
              <span className="flex items-center gap-1.5"><Icon name="mapPin" size={14} className="text-brand-600" /> Şəhər / Rayon</span>
              {filters.regions.length > 0 && (
                <span className="ml-2 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {filters.regions.length}
                </span>
              )}
            </label>
            <span
              className={`text-gray-400 transition-transform duration-200 ${isRegionOpen ? "rotate-180" : ""}`}
            >
              <Icon name="chevronDown" size={16} />
            </span>
          </button>

          {isRegionOpen && (
            <div className="mt-3 space-y-3">
              {/* Axtarış input */}
              <div className="relative">
                <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  placeholder="Şəhər axtar..."
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                />
              </div>

              {/* Qrup tabları — yalnız axtarış boş olanda göstər */}
              {!regionSearch && (
                <div className="flex gap-1.5 flex-wrap">
                  {["Hamısı", ...REGION_GROUPS].map((g) => (
                    <button
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all whitespace-nowrap ${
                        activeGroup === g
                          ? "bg-brand-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {/* Bölgə chipləri */}
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                {visibleRegions.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Nəticə tapılmadı</p>
                ) : (
                  visibleRegions.map((r) => {
                    const isSelected = filters.regions.includes(r.label);
                    return (
                      <button
                        key={r.label}
                        onClick={() => handleRegionToggle(r.label)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-brand-400 hover:text-brand-600"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Hamısını sıfırla */}
              {filters.regions.length > 0 && (
                <button
                  onClick={() => updateFilters({ regions: [] })}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Bölgə seçimini sıfırla ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sıralama */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Sıralama</label>
          <select
            name="sort"
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all appearance-none"
          >
            <option value="">Standart</option>
            <option value="price_asc">Qiymət: aşağıdan yuxarı</option>
            <option value="price_desc">Qiymət: yuxarıdan aşağı</option>
            <option value="newest">Ən yeni</option>
            <option value="popular">Ən populyar</option>
          </select>
        </div>

        {/* Teqlər */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Teqlər</label>
          <div className="relative">
            <Icon name="tag" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="tags"
              value={filters.tags}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="orqanik, toxum..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
        </div>

      </div>

      {/* Footer — apply button on mobile */}
      <div className="md:hidden border-t border-gray-100 p-4">
        <button
          onClick={() => setIsMobileOpen(false)}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {activeFilterCount > 0 ? `${activeFilterCount} filter tətbiq edildi — Göstər` : "Filtrlər tətbiq et"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBİL TRIGGER ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden w-full mb-4 bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between font-semibold text-gray-700 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Icon name="filter" size={18} className="text-brand-600" />
          <span>Filtrlər</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <Icon name="arrowRight" size={18} className="text-gray-400" />
      </button>

      {/* ── MOBİL OVERLAY ─────────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── SİDEBAR ───────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[300px] bg-white shadow-2xl transition-transform duration-300 ease-in-out
          md:relative md:w-72 md:translate-x-0 md:shadow-sm md:border md:border-gray-100 md:rounded-2xl md:z-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
