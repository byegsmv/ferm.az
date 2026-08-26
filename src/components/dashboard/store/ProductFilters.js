"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

export default function ProductFilters({ onFilterChange, categories = [] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [view, setView] = useState("grid");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({ search, category, status, sort, view });
    }
  }, [search, category, status, sort, view]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6 space-y-3">
      {/* Top Header Bar for Desktop & Mobile Toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
          <Icon
            name="search"
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Məhsul axtar..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        {/* Mobile Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="sm:hidden flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <Icon name="filter" size={16} />
          <span>Filtrlər</span>
          <Icon name={isMobileOpen ? "chevronUp" : "chevronDown"} size={14} />
        </button>

        {/* Desktop Controls (Always visible on sm+) */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          {/* Category Select */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="">Bütün kateqoriyalar</option>
            {categories.map((cat) => {
              const id = typeof cat === "object" ? cat.id || cat.slug : cat;
              const name =
                typeof cat === "object"
                  ? cat.titleAz || cat.nameAz || cat.name || cat.title || id
                  : cat;
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>

          {/* Status Select */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="">Hamısı (Status)</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="DRAFT">Passiv</option>
            <option value="EXPIRED">Arxivlənmiş</option>
            <option value="PENDING_REVIEW">Gözləyən</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Sort Select */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="-createdAt">Ən yeni</option>
            <option value="createdAt">Ən köhnə</option>
            <option value="-viewCount">Ən çox baxılan</option>
            <option value="price_asc">Qiymət (Artan)</option>
            <option value="price_desc">Qiymət (Azalan)</option>
          </select>

          {/* Grid / List View Toggle */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                view === "grid"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Tor görünüşü"
            >
              <Icon name="grid" size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-all ${
                view === "list"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Siyahı görünüşü"
            >
              <Icon name="layers" size={16} />
            </button>
          </div>

          {/* 'Yeni Məhsul' Button */}
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg shrink-0"
          >
            <Icon name="plus" size={16} />
            <span>Yeni Məhsul</span>
          </Link>
        </div>
      </div>

      {/* Mobile Collapsible Panel */}
      {isMobileOpen && (
        <div className="sm:hidden pt-3 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
                Kateqoriya
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700"
              >
                <option value="">Bütün kateqoriyalar</option>
                {categories.map((cat) => {
                  const id = typeof cat === "object" ? cat.id || cat.slug : cat;
                  const name =
                    typeof cat === "object"
                      ? cat.titleAz || cat.nameAz || cat.name || cat.title || id
                      : cat;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700"
                >
                  <option value="">Hamısı</option>
                  <option value="ACTIVE">Aktiv</option>
                  <option value="DRAFT">Passiv</option>
                  <option value="EXPIRED">Arxivlənmiş</option>
                  <option value="PENDING_REVIEW">Gözləyən</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
                  Sıralama
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700"
                >
                  <option value="-createdAt">Ən yeni</option>
                  <option value="createdAt">Ən köhnə</option>
                  <option value="-viewCount">Ən çox baxılan</option>
                  <option value="price_asc">Qiymət ↑</option>
                  <option value="price_desc">Qiymət ↓</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    view === "grid"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    view === "list"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  Siyahı
                </button>
              </div>

              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow"
              >
                <Icon name="plus" size={14} />
                <span>Yeni Məhsul</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
