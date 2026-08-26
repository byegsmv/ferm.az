"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const STATUS_CONFIG = {
  ACTIVE: { label: "Aktiv", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  DRAFT: { label: "Passiv", color: "bg-gray-100 text-gray-700 border-gray-200" },
  EXPIRED: { label: "Arxivlənmiş", color: "bg-amber-100 text-amber-800 border-amber-200" },
  PENDING_REVIEW: { label: "Gözləyən", color: "bg-blue-100 text-blue-800 border-blue-200" },
  REJECTED: { label: "Ləğv edilib", color: "bg-red-100 text-red-800 border-red-200" },
};

export default function ProductGrid({
  products = [],
  loading = false,
  onProductAction,
  selectedIds = [],
  onSelectChange,
  view = "grid",
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const totalPages = Math.ceil(products.length / pageSize) || 1;
  const paginatedProducts = products.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Checkbox handlers
  function toggleSelect(id) {
    if (!onSelectChange) return;
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  }

  function toggleSelectAll() {
    if (!onSelectChange) return;
    if (selectedIds.length === products.length) {
      onSelectChange([]);
    } else {
      onSelectChange(products.map((p) => p.id));
    }
  }

  // Helper for image URL
  function getImageUrl(product) {
    if (product.images && product.images.length > 0) {
      const first = product.images[0];
      return typeof first === "string" ? first : first.url || "/placeholder.svg";
    }
    return product.image || "/placeholder.svg";
  }

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div
          className={
            view === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              : "space-y-3"
          }
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-3 animate-pulse space-y-3"
            >
              <div className="aspect-square bg-gray-200 rounded-xl w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-5 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-4 my-6 shadow-sm">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto">
          <Icon name="package" size={32} />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold text-gray-900">Məhsul tapılmadı</h3>
          <p className="text-xs text-gray-500">
            Axtarış filterlərinizə uyğun heç bir məhsul mövcud deyil və ya hələ məhsul əlavə etməmisiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* GRID VIEW */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {paginatedProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            const statusInfo =
              STATUS_CONFIG[product.status] || STATUS_CONFIG.ACTIVE;
            const title =
              product.titleAz || product.title || product.name || "Məhsul";
            const categoryName =
              product.category?.nameAz ||
              product.categoryName ||
              product.category ||
              "Ümumi";
            const regionName = product.region || product.city || "";

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden relative group flex flex-col justify-between ${
                  isSelected
                    ? "border-brand-500 ring-2 ring-brand-500/20 shadow-md"
                    : "border-gray-100 hover:shadow-lg hover:border-gray-200"
                }`}
              >
                {/* Image & Overlay Badges — fixed height (not aspect-ratio) so the box
                    never collapses/expands unpredictably inside a flex-col card, which
                    was causing broken-image alt text to overlap the title below it. */}
                <div className="relative w-full h-32 sm:h-36 shrink-0 bg-gray-50 overflow-hidden">
                  <img
                    src={getImageUrl(product)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      if (e.target.dataset.fallback) return; // avoid infinite loop if placeholder itself fails
                      e.target.dataset.fallback = "1";
                      e.target.src = "/placeholder.svg";
                    }}
                  />

                  {/* Checkbox Overlay (Top-Left) */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer shadow-sm"
                    />
                  </div>

                  {/* Status Badge (Bottom-Left) */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md shadow-sm ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    {/* Category + Region */}
                    <div className="text-[10px] font-medium text-gray-400 truncate flex items-center gap-1">
                      <span>{categoryName}</span>
                      {regionName && (
                        <>
                          <span>•</span>
                          <span>{regionName}</span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mt-0.5 group-hover:text-brand-600 transition-colors">
                      {title}
                    </h4>
                  </div>

                  {/* Price & Stats */}
                  <div className="space-y-1.5 pt-1 border-t border-gray-50">
                    <div className="text-sm font-black text-brand-600">
                      {product.price} ₼
                      {product.unit ? (
                        <span className="text-[10px] font-normal text-gray-500 ml-1">
                          / {product.unit}
                        </span>
                      ) : null}
                    </div>

                    {/* Mini Stats: Eye + Views, Heart + Favs, Star + Rating */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5" title="Baxış sayı">
                        <Icon name="eye" size={11} className="text-gray-400" />
                        {product.viewCount ?? product.views ?? 0}
                      </span>
                      <span className="flex items-center gap-0.5" title="Bəyənmə">
                        <Icon name="heart" size={11} className="text-rose-400" />
                        {product.favCount ?? product._count?.favorites ?? 0}
                      </span>
                      <span className="flex items-center gap-0.5 font-semibold text-amber-500" title="Reytinq">
                        <Icon name="star" size={11} className="fill-amber-400 text-amber-400" />
                        {product.avgRating ? Number(product.avgRating).toFixed(1) : "5.0"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => onProductAction?.("edit", product)}
                      title="Düzəliş et"
                      className="w-7 h-7 rounded-lg text-gray-600 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon name="pencil" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("preview", product)}
                      title="Baxış"
                      className="w-7 h-7 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon name="eye" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("toggle-status", product)}
                      title="Aktiv/Passiv et"
                      className="w-7 h-7 rounded-lg text-gray-600 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon name="refresh" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("archive", product)}
                      title="Arxivlə"
                      className="w-7 h-7 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon name="box" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("share", product)}
                      title="Paylaş"
                      className="w-7 h-7 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon name="share" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("delete", product)}
                      title="Sil"
                      className="w-7 h-7 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="space-y-3">
          {paginatedProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            const statusInfo =
              STATUS_CONFIG[product.status] || STATUS_CONFIG.ACTIVE;
            const title =
              product.titleAz || product.title || product.name || "Məhsul";
            const categoryName =
              product.category?.nameAz ||
              product.categoryName ||
              product.category ||
              "Ümumi";
            const regionName = product.region || product.city || "";

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border p-3 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-200 ${
                  isSelected
                    ? "border-brand-500 ring-2 ring-brand-500/20 shadow-md"
                    : "border-gray-100 hover:shadow-md hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(product.id)}
                    className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer shrink-0"
                  />

                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                    <img
                      src={getImageUrl(product)}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {categoryName} {regionName ? `• ${regionName}` : ""}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                      {title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Icon name="eye" size={12} />
                        {product.viewCount ?? product.views ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="heart" size={12} className="text-rose-400" />
                        {product.favCount ?? product._count?.favorites ?? 0}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-amber-500">
                        <Icon name="star" size={12} className="fill-amber-400" />
                        {product.avgRating ? Number(product.avgRating).toFixed(1) : "5.0"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <div className="text-base font-black text-brand-600">
                    {product.price} ₼
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onProductAction?.("edit", product)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-brand-600 hover:bg-brand-50 cursor-pointer"
                      title="Düzəliş et"
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("preview", product)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                      title="Baxış"
                    >
                      <Icon name="eye" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("toggle-status", product)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                      title="Aktiv/Passiv"
                    >
                      <Icon name="refresh" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("archive", product)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                      title="Arxivlə"
                    >
                      <Icon name="box" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("share", product)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      title="Paylaş"
                    >
                      <Icon name="share" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onProductAction?.("delete", product)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Sil"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BULK ACTION BAR (Sticky Bottom) */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 z-30 bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 flex-wrap border border-gray-800">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold">məhsul seçilib</span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs text-gray-300 hover:text-white underline ml-2 cursor-pointer"
            >
              {selectedIds.length === products.length ? "Hamsını ləğv et" : "Bütününü seç"}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                onProductAction?.("bulk", { action: "activate", ids: selectedIds })
              }
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Icon name="checkCircle" size={14} />
              <span>Aktiv et</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onProductAction?.("bulk", { action: "deactivate", ids: selectedIds })
              }
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Icon name="pause" size={14} />
              <span>Deaktiv et</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onProductAction?.("bulk", { action: "archive", ids: selectedIds })
              }
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Icon name="box" size={14} />
              <span>Arxivlə</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onProductAction?.("bulk", { action: "delete", ids: selectedIds })
              }
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Icon name="trash" size={14} />
              <span>Sil</span>
            </button>
          </div>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 font-medium">
            Səhifə {currentPage} / {totalPages} (Cəmi {products.length} məhsul)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Icon name="arrowLeft" size={14} />
              <span>Əvvəlki</span>
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Növbəti</span>
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
