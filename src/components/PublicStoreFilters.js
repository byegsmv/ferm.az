"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/ui/Icon";
import ProductCard from "@/components/ProductCard";
import { Link, useRouter } from "@/i18n/routing";

export default function PublicStoreFilters({ products = [], storeSlug }) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'in_stock' | 'out_of_stock'
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Extract unique categories from products
  const categories = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const map = new Map();
    products.forEach((p) => {
      if (!p) return;
      if (p.category) {
        const slug = typeof p.category === "object" ? (p.category.slug || p.category.nameAz) : p.category;
        const nameAz = typeof p.category === "object" ? (p.category.nameAz || p.category.name || p.category.slug) : p.category;
        if (slug && !map.has(slug)) {
          map.set(slug, { slug, nameAz });
        }
      } else if (p.categorySlug || p.categoryName) {
        const slug = p.categorySlug || p.categoryName;
        const nameAz = p.categoryName || p.categorySlug;
        if (slug && !map.has(slug)) {
          map.set(slug, { slug, nameAz });
        }
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products
      .filter((p) => {
        if (!p) return false;

        // Search filter (titleAz case-insensitive)
        if (search.trim()) {
          const query = search.trim().toLowerCase();
          const title = (p.titleAz || p.title || "").toLowerCase();
          if (!title.includes(query)) return false;
        }

        // Min price
        const price = Number(p.price);
        if (minPrice !== "" && !isNaN(Number(minPrice))) {
          if (isNaN(price) || price < Number(minPrice)) return false;
        }

        // Max price
        if (maxPrice !== "" && !isNaN(Number(maxPrice))) {
          if (isNaN(price) || price > Number(maxPrice)) return false;
        }

        // Stock filter
        const isAvailable = (typeof p.stock === "number" ? p.stock > 0 : true) && p.status !== "OUT_OF_STOCK";
        if (stockFilter === "in_stock" && !isAvailable) return false;
        if (stockFilter === "out_of_stock" && isAvailable) return false;

        // Category filter
        if (selectedCategory !== "all") {
          const catSlug = p.category?.slug || p.category?.nameAz || p.categorySlug || p.category;
          if (catSlug !== selectedCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "price_asc") {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        }
        if (sortBy === "price_desc") {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        }
        if (sortBy === "views") {
          if (a.views !== undefined || b.views !== undefined) {
            return (Number(b.views) || 0) - (Number(a.views) || 0);
          }
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        // default: newest
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [products, search, minPrice, maxPrice, stockFilter, selectedCategory, sortBy]);

  // Check if any filter is active
  const hasActiveFilters =
    search.trim() !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    stockFilter !== "all" ||
    selectedCategory !== "all" ||
    sortBy !== "newest";

  const handleReset = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setStockFilter("all");
    setSelectedCategory("all");
    setSortBy("newest");
  };

  const selectedCategoryObj = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="w-full">
      {/* Filter Bar Container */}
      <div className="card p-4 mb-6 space-y-4">
        {/* Main Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon name="search" size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Axtarış..."
              className="input-field pl-9 pr-8 text-xs sm:text-sm py-2"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Təmizlə"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 min-w-[180px]">
            <div className="relative w-full">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-field text-xs sm:text-sm py-2 pr-8 pl-3 appearance-none font-medium text-gray-700 cursor-pointer"
              >
                <option value="newest">Ən yenilər</option>
                <option value="oldest">Ən köhnələr</option>
                <option value="price_asc">Qiymət: Ucuzdan bahaya</option>
                <option value="price_desc">Qiymət: Bahadan ucuza</option>
                <option value="views">Ən çox baxılanlar</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
                <Icon name="chevronDown" size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Controls Row: Price Range & Stock Filter */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          {/* Price Range Inputs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Icon name="dollar" size={14} /> Qiymət:
            </span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="number"
                min="0"
                placeholder="Min ₼"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input-sm w-20 text-xs py-1.5"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                min="0"
                placeholder="Max ₼"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-sm w-20 text-xs py-1.5"
              />
            </div>
          </div>

          {/* Stock Filter Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1 mr-1">
              <Icon name="package" size={14} /> Stok:
            </span>
            <button
              type="button"
              onClick={() => setStockFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                stockFilter === "all"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
              }`}
            >
              Hamısı
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("in_stock")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                stockFilter === "in_stock"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
              }`}
            >
              Stokda var
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("out_of_stock")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                stockFilter === "out_of_stock"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
              }`}
            >
              Stokda yoxdur
            </button>
          </div>
        </div>

        {/* Category Filter Pills (if products span multiple categories) */}
        {categories.length > 1 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="tag" size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">Kateqoriya:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                }`}
              >
                Hamısı
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-brand-600 text-white"
                      : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {cat.nameAz}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Bar & Active Filter Chips */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">
              {filteredProducts.length} məhsul tapıldı
            </span>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {search.trim() && (
                <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full text-[11px] font-medium">
                  Axtarış: &quot;{search}&quot;
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="hover:text-brand-900 transition-colors"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}

              {minPrice !== "" && (
                <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full text-[11px] font-medium">
                  Min: {minPrice} ₼
                  <button
                    type="button"
                    onClick={() => setMinPrice("")}
                    className="hover:text-brand-900 transition-colors"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}

              {maxPrice !== "" && (
                <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full text-[11px] font-medium">
                  Max: {maxPrice} ₼
                  <button
                    type="button"
                    onClick={() => setMaxPrice("")}
                    className="hover:text-brand-900 transition-colors"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}

              {stockFilter !== "all" && (
                <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full text-[11px] font-medium">
                  Stok: {stockFilter === "in_stock" ? "Stokda var" : "Stokda yoxdur"}
                  <button
                    type="button"
                    onClick={() => setStockFilter("all")}
                    className="hover:text-brand-900 transition-colors"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}

              {selectedCategory !== "all" && selectedCategoryObj && (
                <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full text-[11px] font-medium">
                  Kateqoriya: {selectedCategoryObj.nameAz}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className="hover:text-brand-900 transition-colors"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="text-gray-500 hover:text-red-600 underline text-[11px] font-medium ml-1 transition-colors"
              >
                Sıfırla
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id || product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Icon name="package" size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Axtarışınıza uyğun məhsul tapılmadı
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Filtrləri dəyişərək və ya sıfırlayaraq yenidən cəhd edin.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Icon name="close" size={14} />
              Filtrləri sıfırla
            </button>
          )}
        </div>
      )}
    </div>
  );
}
