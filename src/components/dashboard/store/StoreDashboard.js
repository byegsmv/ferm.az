"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { apiFetch } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";

import ImageUploader from "@/components/ImageUploader";
// Existing subcomponents
import StoreProfileHeader from "@/components/dashboard/store/StoreProfileHeader";
import StoreAnalytics from "@/components/dashboard/store/StoreAnalytics";
import MessagingPanel from "@/components/chat/MessagingPanel";

// Created subcomponents
import StoreSidebar from "@/components/dashboard/store/StoreSidebar";
import ProductFilters from "@/components/dashboard/store/ProductFilters";
import ProductGrid from "@/components/dashboard/store/ProductGrid";
import StoreSettings from "@/components/dashboard/store/StoreSettings";

export default function StoreDashboard({ user }) {
  const router = useRouter();

  const [store, setStore] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    sort: "-createdAt",
    view: "grid",
  });

  const [toastMsg, setToastMsg] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ titleAz: "", price: "", stock: "1", categoryId: "", region: "", city: "", descriptionAz: "", images: [], tags: [], isCorporate: false, minOrderQty: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }
  // ─── Create Product ───
  async function handleCreateProduct(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const payload = {
        storeId: store?.id || undefined,
        titleAz: createForm.titleAz,
        price: createForm.price ? Number(createForm.price) : 0,
        stock: createForm.stock ? Number(createForm.stock) : 1,
        categoryId: createForm.categoryId,
        region: createForm.region || undefined,
        city: createForm.city || undefined,
        descriptionAz: createForm.descriptionAz || undefined,
        images: createForm.images || [],
        tags: createForm.tags || [],
        isCorporate: !!createForm.isCorporate,
        minOrderQty: createForm.isCorporate && createForm.minOrderQty ? parseInt(createForm.minOrderQty, 10) : null,
      };
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
      await apiFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      setCreateSuccess("Elan yaradıldı! Admin təsdiqindən sonra aktivləşəcək.");
      setCreateForm({ titleAz: "", price: "", stock: "1", categoryId: "", region: "", city: "", descriptionAz: "", images: [], tags: [], isCorporate: false, minOrderQty: "" });
      loadProducts();
      setTimeout(() => { setShowCreateForm(false); setCreateSuccess(""); }, 2000);
    } catch (err) {
      const details = err.details ? Object.values(err.details).flat().join(" · ") : "";
      setCreateError(details || err.message || "Xəta baş verdi");
    } finally {
      setCreating(false);
    }
  }

  // Tag input handler
  function handleTagInput(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.target.value.trim().toLowerCase().replace(/^#+/, "");
      if (val && !createForm.tags.includes(val) && createForm.tags.length < 10) {
        setCreateForm(f => ({ ...f, tags: [...f.tags, val] }));
        e.target.value = "";
      }
    }
  }



  // Load initial store, stats, categories, products
  useEffect(() => {
    async function loadInitialData() {
      setLoadingStore(true);
      try {
        const storeRes = await apiFetch("/api/stores/me");
        if (storeRes?.store) {
          setStore(storeRes.store);
        }
      } catch (err) {
        console.error("Error loading store:", err);
      } finally {
        setLoadingStore(false);
      }

      try {
        const statsRes = await apiFetch("/api/stores/me/stats");
        if (statsRes) {
          setStats(statsRes);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      }

      try {
        const catRes = await apiFetch("/api/categories");
        if (Array.isArray(catRes)) {
          setCategories(catRes);
        } else if (catRes?.categories) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }

      loadProducts();
    }

    loadInitialData();
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const prodRes = await apiFetch("/api/products?mine=1&pageSize=100");
      if (prodRes?.products) {
        setProducts(prodRes.products);
      } else if (Array.isArray(prodRes)) {
        setProducts(prodRes);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }

  // Handle product actions
  async function handleProductAction(action, target) {
    if (action === "edit") {
      router.push(`/dashboard/products/${target.id}/edit`);
    } else if (action === "preview") {
      if (typeof window !== "undefined") {
        window.open(`/products/${target.slug || target.id}`, "_blank");
      }
    } else if (action === "archive") {
      try {
        await apiFetch(`/api/products/${target.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "EXPIRED" }),
        });
        showToast("Məhsul arxivləşdirildi");
        loadProducts();
      } catch (err) {
        showToast(err.message || "Xəta baş verdi");
      }
    } else if (action === "toggle-status") {
      const newStatus = target.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
      try {
        await apiFetch(`/api/products/${target.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        });
        showToast(
          newStatus === "ACTIVE"
            ? "Məhsul aktivləşdirildi"
            : "Məhsul passivləşdirildi"
        );
        loadProducts();
      } catch (err) {
        showToast(err.message || "Xəta baş verdi");
      }
    } else if (action === "share") {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/products/${target.slug || target.id}`
          : "";
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(shareUrl);
        showToast("Məhsul keçidi kopyalandı!");
      }
    } else if (action === "delete") {
      if (!confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) return;
      try {
        await apiFetch(`/api/products/${target.id}`, {
          method: "DELETE",
        });
        showToast("Məhsul silindi");
        setSelectedProductIds((prev) => prev.filter((id) => id !== target.id));
        loadProducts();
      } catch (err) {
        showToast(err.message || "Xəta baş verdi");
      }
    } else if (action === "bulk") {
      const { action: bulkAction, ids } = target;
      try {
        await apiFetch("/api/products/bulk", {
          method: "POST",
          body: JSON.stringify({ ids, action: bulkAction }),
        });
        showToast("Toplu əməliyyat uğurla icra olundu!");
        setSelectedProductIds([]);
        loadProducts();
      } catch (err) {
        showToast(err.message || "Toplu əməliyyatda xəta baş verdi");
      }
    }
  }

  // Handle Save Settings
  async function handleSaveSettings(formData) {
    setSavingSettings(true);
    try {
      const res = await apiFetch("/api/stores/me", {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      if (res?.store) {
        setStore(res.store);
      }
      showToast("Tənzimləmələr uğurla saxlanıldı!");
    } catch (err) {
      console.error("Save settings error:", err);
      showToast(err.message || "Məlumatlar saxlanılarkən xəta baş verdi");
    } finally {
      setSavingSettings(false);
    }
  }

  // Filtered & Sorted products calculation
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const title = (prod.titleAz || prod.title || prod.name || "").toLowerCase();
          if (!title.includes(q)) return false;
        }
        if (filters.category) {
          const catId = prod.categoryId || prod.category?.id || prod.category;
          if (catId !== filters.category) return false;
        }
        if (filters.status) {
          if (prod.status !== filters.status) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sort === "-createdAt") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (filters.sort === "createdAt") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (filters.sort === "-viewCount") {
          return (b.viewCount || 0) - (a.viewCount || 0);
        }
        if (filters.sort === "price_asc") {
          return Number(a.price || 0) - Number(b.price || 0);
        }
        if (filters.sort === "price_desc") {
          return Number(b.price || 0) - Number(a.price || 0);
        }
        return 0;
      });
  }, [products, filters]);

  // Loading skeleton state for entire store dashboard
  if (loadingStore && !store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-3xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="h-96 bg-gray-200 rounded-3xl" />
          <div className="lg:col-span-3 space-y-4">
            <div className="h-12 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No store found — show create store form
  if (!store) {
    return <CreateStoreForm user={user} onCreated={(s) => setStore(s)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-bounce">
          <Icon name="checkCircle" size={18} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP: Store Profile Header */}
      <StoreProfileHeader
        store={store}
        user={user}
        stats={stats}
        onEdit={() => setActiveTab("settings")}
      />

      {/* MAIN CONTENT: Sidebar + Tab Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <StoreSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          store={store}
          user={user}
        />

        {/* Right Tab Content */}
        <div className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold">Məhsullar</span>
                    <Icon name="package" size={18} className="text-brand-600" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.totalProducts ?? products.length}
                  </div>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    {stats?.activeProducts ?? 0} aktiv məhsul
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold">Baxışlar</span>
                    <Icon name="eye" size={18} className="text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.totalViews ?? store?.storeViewCount ?? 0}
                  </div>
                  <p className="text-[10px] text-gray-400">Ümumi baxış</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold">Bəyənmələr</span>
                    <Icon name="heart" size={18} className="text-rose-500" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.totalFavorites ?? 0}
                  </div>
                  <p className="text-[10px] text-gray-400">Alıcı seçimləri</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold">Reytinq</span>
                    <Icon name="star" size={18} className="text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.averageRating
                      ? Number(stats.averageRating).toFixed(1)
                      : "5.0"}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {stats?.reviewCount ?? 0} rəy əsasında
                  </p>
                </div>
              </div>

              {/* Recent 4 Products Section */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      Son Əlavə Olunan Məhsullar
                    </h3>
                    <p className="text-xs text-gray-500">
                      Mağazanızdakı ən son elanlar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("products")}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Hamısına bax</span>
                    <Icon name="arrowRight" size={14} />
                  </button>
                </div>

                <ProductGrid
                  products={products.slice(0, 4)}
                  loading={loadingProducts}
                  onProductAction={handleProductAction}
                  selectedIds={[]}
                  onSelectChange={() => {}}
                  view="grid"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === "products" && (
            <div className="space-y-4">
              {/* YENI ELAN DUYMESI */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900">Məhsullarım</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(s => !s)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <Icon name="plus" size={18} />
                  Yeni Elan
                </button>
              </div>

              {/* YENI ELAN FORMASI */}
              {showCreateForm && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Icon name="plus" size={20} className="text-brand-600" />
                      Yeni Elan Yerləşdir
                    </h3>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
                      <Icon name="close" size={20} />
                    </button>
                  </div>

                  {createError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                      {createError}
                    </div>
                  )}
                  {createSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                      <Icon name="checkCircle" size={16} /> {createSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    {/* Başlıq */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Məhsulun adı *</label>
                      <input
                        type="text" required
                        placeholder="Məs: Qlifosat 48%"
                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        value={createForm.titleAz}
                        onChange={e => setCreateForm({...createForm, titleAz: e.target.value})}
                      />
                    </div>

                    {/* Kateqoriya */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kateqoriya *</label>
                      <select
                        required
                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        value={createForm.categoryId}
                        onChange={e => setCreateForm({...createForm, categoryId: e.target.value})}
                      >
                        <option value="">Kateqoriya seçin</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name || c.nameAz}</option>
                        ))}
                      </select>
                    </div>

                    {/* Qiymət + Stok */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Qiymət (AZN) *</label>
                        <input
                          type="number" step="0.01" required
                          placeholder="0.00"
                          className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          value={createForm.price}
                          onChange={e => setCreateForm({...createForm, price: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Stok sayı</label>
                        <input
                          type="number" required
                          placeholder="1"
                          className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          value={createForm.stock}
                          onChange={e => setCreateForm({...createForm, stock: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Region + Şəhər */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Region</label>
                        <input
                          type="text"
                          placeholder="Məs: Bakı"
                          className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          value={createForm.region}
                          onChange={e => setCreateForm({...createForm, region: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Şəhər</label>
                        <input
                          type="text"
                          placeholder="Məs: Bakı"
                          className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          value={createForm.city}
                          onChange={e => setCreateForm({...createForm, city: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Şəkil yükləmə */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Şəkillər</label>
                      <ImageUploader value={createForm.images} onChange={(images) => setCreateForm({...createForm, images})} max={5} />
                    </div>

                    {/* Təsvir */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Təsvir</label>
                      <textarea
                        rows="3"
                        placeholder="Məhsul haqqında ətraflı məlumat..."
                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                        value={createForm.descriptionAz}
                        onChange={e => setCreateForm({...createForm, descriptionAz: e.target.value})}
                      />
                    </div>

                    {/* Etiketlər */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Etiketlər (hashtags)</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {createForm.tags.map((tag, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full font-medium">
                            #{tag}
                            <button type="button" onClick={() => setCreateForm(f => ({...f, tags: f.tags.filter((_, j) => j !== i)}))} className="text-brand-400 hover:text-red-500">×</button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Etiket əlavə et (Enter ilə)"
                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
                        onKeyDown={handleTagInput}
                      />
                    </div>

                    {/* Korporativ */}
                    <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="checkbox" checked={createForm.isCorporate} onChange={e => setCreateForm({...createForm, isCorporate: e.target.checked, minOrderQty: ""})} className="rounded" />
                        <span>Korporativ elan (toplu satış)</span>
                      </label>
                      {createForm.isCorporate && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600 whitespace-nowrap">Minimum alış miqdarı:</label>
                          <input type="number" min="1" placeholder="məs: 50"
                            className="w-32 p-1.5 border border-gray-200 rounded-lg text-sm"
                            value={createForm.minOrderQty}
                            onChange={e => setCreateForm({...createForm, minOrderQty: e.target.value})}
                          />
                          <span className="text-xs text-gray-400">ədəd</span>
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                      {creating ? "Göndərilir..." : "Elanı Yerləşdir"}
                    </button>
                  </form>
                </div>
              )}

              <ProductFilters
                onFilterChange={setFilters}
                categories={categories}
              />
              <ProductGrid
                products={filteredProducts}
                loading={loadingProducts}
                onProductAction={handleProductAction}
                selectedIds={selectedProductIds}
                onSelectChange={setSelectedProductIds}
                view={filters.view}
              />
            </div>
          )}

          {/* TAB 3: ANALYTICS */}
          {activeTab === "analytics" && (
            <StoreAnalytics storeId={store?.id} />
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <StoreSettings
              store={store}
              onSave={handleSaveSettings}
              loading={savingSettings}
            />
          )}

          {/* TAB 5: MESSAGES */}
          {activeTab === "messages" && (
            <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
              <MessagingPanel />
            </div>
          )}

          {/* TAB 6: WALLET */}
          {activeTab === "wallet" && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Balans & Maliyyə Kisəsi
                  </h3>
                  <p className="text-xs text-gray-500">
                    Hesab balansınız və məxaric əməliyyatları
                  </p>
                </div>
                <Icon name="wallet" size={24} className="text-brand-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-brand-600 to-emerald-600 text-white p-5 rounded-2xl shadow-lg space-y-2">
                  <span className="text-xs font-semibold opacity-90">
                    Ümumi Balans
                  </span>
                  <div className="text-3xl font-black">
                    {stats?.totalRevenue ? Number(stats.totalRevenue).toFixed(2) : "0.00"} ₼
                  </div>
                  <p className="text-[10px] opacity-80">
                    Çıxarış üçün əlçatan məbləğ
                  </p>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Gözləyən Ödənişlər
                  </span>
                  <div className="text-2xl font-black text-gray-900">0.00 ₼</div>
                  <p className="text-[10px] text-gray-400">Tranzit hesabda</p>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Xidmət Haqqı
                  </span>
                  <div className="text-2xl font-black text-gray-900">0%</div>
                  <p className="text-[10px] text-gray-400">Komissiyasız tarif</p>
                </div>
              </div>
            </div>
          )}

          {/* OTHER TABS PLACEHOLDER */}
          {![
            "overview",
            "products",
            "analytics",
            "settings",
            "messages",
            "wallet",
          ].includes(activeTab) && (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                <Icon name="dashboard" size={32} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-extrabold text-gray-900 capitalize">
                  {activeTab} Bölməsi
                </h3>
                <p className="text-xs text-gray-500">
                  Bu bölmə hazırda aktiv şəkildə yenilənir və tezliklə tam funksionallıqla istifadəyə veriləcək.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Create Store Form (shown when user has no store) ───────────────────
export function CreateStoreForm({ user, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", address: "", phone: "", whatsapp: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Mağaza adı tələb olunur"); return; }
    setCreating(true);
    setError("");
    try {
      const res = await apiFetch("/api/stores", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.store) {
        onCreated(res.store);
      } else if (res?.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message || "Mağaza yaradılarkən xəta baş verdi");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <Icon name="store" size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Mağaza Yarat</h2>
          <p className="text-sm text-gray-500">Öz mağazanızı yaradın və məhsullarınızı satışa çıxarın</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mağaza Adı *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Məsələn: Agro Tədarük MMC"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Təsvir</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mağazanız haqqında qısa məlumat..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Telefon</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+994 50 123 45 67"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">WhatsApp</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+994 50 123 45 67"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ünvan</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Bakı, Azərbaycan"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95"
          >
            {creating ? "Yaradılır..." : "Mağaza Yarat"}
          </button>
        </form>
      </div>
    </div>
  );
}
