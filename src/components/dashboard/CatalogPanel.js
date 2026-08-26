"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";

// ─── Catalog Product Card ──────────────────────────────────────────────────────
function CatalogProductCard({ product, onEdit, onDelete, isOwner }) {
  const img = product.images?.[0]?.url;
  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    PENDING_REVIEW: "bg-amber-100 text-amber-800",
    DRAFT: "bg-gray-100 text-gray-600",
    REJECTED: "bg-red-100 text-red-800",
  };
  const statusLabels = {
    ACTIVE: "Aktiv",
    PENDING_REVIEW: "Gözlənir",
    DRAFT: "Qaralama",
    REJECTED: "Rədd edilib",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* Image */}
      <div className="relative h-44 bg-gray-50">
        {img ? (
          <img src={img} alt={product.titleAz} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><Icon name="package" size={48} /></div>
        )}
        {product.status && (
          <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${statusColors[product.status] || "bg-gray-100 text-gray-600"}`}>
            {statusLabels[product.status] || product.status}
          </span>
        )}
        {product.productCode && (
          <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-black/60 text-white px-2 py-0.5 rounded-lg">
            SKU: {product.productCode}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1">{product.category?.nameAz || ""}</p>
        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-snug mb-2">
          {product.titleAz}
        </h3>
        {product.store && (
          <p className="text-xs text-brand-600 mb-1 flex items-center gap-1"><Icon name="store" size={14} /> {product.store.name}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-black text-brand-700">₼{Number(product.price).toFixed(2)}</span>
            {product.unit && <span className="text-xs text-gray-400 ml-1">/ {product.unit}</span>}
          </div>
          <span className="text-xs text-gray-500">Stok: {product.stock ?? "—"}</span>
        </div>
        {product.packaging && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Icon name="package" size={14} /> {product.packaging}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Link href={`/products/${product.slug}`} className="flex-1 text-center text-xs py-2 border border-brand-200 text-brand-700 rounded-xl hover:bg-brand-50 transition-colors font-semibold">
          Bax
        </Link>
        {isOwner && onEdit && (
          <button onClick={() => onEdit(product)} className="flex-1 text-center text-xs py-2 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 transition-colors font-semibold">
            Düzəlt
          </button>
        )}
        {isOwner && onDelete && (
          <button onClick={() => onDelete(product.id)} className="text-xs py-2 px-3 text-red-500 hover:text-red-700 transition-colors">
            <Icon name="trash" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit Product Modal ──────────────────────────────────────────────────
function CatalogProductModal({ editProduct, categories, storeId, onClose, onSaved }) {
  const isEdit = !!editProduct;
  const [form, setForm] = useState({
    titleAz: editProduct?.titleAz || "",
    descriptionAz: editProduct?.descriptionAz || "",
    price: editProduct?.price || "",
    stock: editProduct?.stock ?? 0,
    unit: editProduct?.unit || "ədəd",
    categoryId: editProduct?.categoryId || "",
    productCode: editProduct?.productCode || "",
    barcode: editProduct?.barcode || "",
    packaging: editProduct?.packaging || "",
    manufacturer: editProduct?.manufacturer || "",
    countryOfOrigin: editProduct?.countryOfOrigin || "",
    labelPdfUrl: editProduct?.labelPdfUrl || "",
    instructionPdfUrl: editProduct?.instructionPdfUrl || "",
    wholesalePrice: editProduct?.wholesalePrice || "",
    wholesaleMinQty: editProduct?.wholesaleMinQty || "",
    useNorm: editProduct?.useNorm || "",
    waitingPeriod: editProduct?.waitingPeriod || "",
    safetyInfo: editProduct?.safetyInfo || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { ...form, storeId };
      // Clean empty strings → null/undefined
      Object.keys(payload).forEach(k => {
        if (payload[k] === "") payload[k] = undefined;
      });
      if (payload.price) payload.price = Number(payload.price);
      if (payload.stock !== undefined) payload.stock = Number(payload.stock);
      if (payload.wholesalePrice) payload.wholesalePrice = Number(payload.wholesalePrice);
      if (payload.wholesaleMinQty) payload.wholesaleMinQty = Number(payload.wholesaleMinQty);
      if (payload.waitingPeriod) payload.waitingPeriod = Number(payload.waitingPeriod);

      if (isEdit) {
        await apiFetch(`/api/products/${editProduct.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/catalog", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-black text-lg text-gray-900">
            {isEdit ? <span className="flex items-center gap-1.5"><Icon name="pencil" size={18} /> Məhsulu Düzəlt</span> : <span className="flex items-center gap-1.5"><Icon name="plus" size={18} /> Yeni Katalog Məhsulu</span>}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

          {/* Basic Info */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Icon name="clipboard" size={16} /> Əsas Məlumatlar</h3>
            <div className="space-y-3">
              <div>
                <label className="label-sm">Məhsul Adı *</label>
                <input value={form.titleAz} onChange={e => set("titleAz", e.target.value)} className="input-field" required placeholder="Məs. Roundup 360 SL" />
              </div>
              <div>
                <label className="label-sm">Kateqoriya *</label>
                <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className="input-field" required>
                  <option value="">Kateqoriya seçin</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nameAz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-sm">Təsvir</label>
                <textarea value={form.descriptionAz} onChange={e => set("descriptionAz", e.target.value)} className="input-field" rows="3" placeholder="Məhsul haqqında..." />
              </div>
            </div>
          </section>

          {/* Price & Stock */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Icon name="dollar" size={16} /> Qiymət & Stok</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Qiymət (₼) *</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} className="input-field" required placeholder="0.00" />
              </div>
              <div>
                <label className="label-sm">Stok miqdarı</label>
                <input type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label-sm">Vahid</label>
                <select value={form.unit} onChange={e => set("unit", e.target.value)} className="input-field">
                  {["ədəd", "kq", "q", "L", "mL", "ton", "m", "m²", "paket", "qutu"].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-sm">Topdan Qiymət (₼)</label>
                <input type="number" min="0" step="0.01" value={form.wholesalePrice} onChange={e => set("wholesalePrice", e.target.value)} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="label-sm">Topdan Min. Miqdar</label>
                <input type="number" min="1" value={form.wholesaleMinQty} onChange={e => set("wholesaleMinQty", e.target.value)} className="input-field" placeholder="10" />
              </div>
              <div>
                <label className="label-sm">Qablaşdırma</label>
                <input value={form.packaging} onChange={e => set("packaging", e.target.value)} className="input-field" placeholder="1L, 5L, 20L" />
              </div>
            </div>
          </section>

          {/* Product Codes */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Icon name="tag" size={16} /> Məhsul Kodları</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">SKU / Məhsul Kodu</label>
                <input value={form.productCode} onChange={e => set("productCode", e.target.value)} className="input-field" placeholder="RND-360-1L" />
              </div>
              <div>
                <label className="label-sm">Barkod</label>
                <input value={form.barcode} onChange={e => set("barcode", e.target.value)} className="input-field" placeholder="8690123456789" />
              </div>
            </div>
          </section>

          {/* Production Info */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Icon name="building" size={16} /> İstehsal Məlumatları</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">İstehsalçı</label>
                <input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} className="input-field" placeholder="Bayer CropScience" />
              </div>
              <div>
                <label className="label-sm">İstehsal Ölkəsi</label>
                <input value={form.countryOfOrigin} onChange={e => set("countryOfOrigin", e.target.value)} className="input-field" placeholder="Almaniya" />
              </div>
            </div>
          </section>

          {/* Agro Technical Info */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Icon name="leaf" size={16} /> Aqrotexniki Məlumatlar</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">İstifadə norması</label>
                <input value={form.useNorm} onChange={e => set("useNorm", e.target.value)} className="input-field" placeholder="0.5-1 L/ha" />
              </div>
              <div>
                <label className="label-sm">Gözləmə müddəti (gün)</label>
                <input type="number" min="0" value={form.waitingPeriod} onChange={e => set("waitingPeriod", e.target.value)} className="input-field" placeholder="7" />
              </div>
              <div className="col-span-2">
                <label className="label-sm">Təhlükəsizlik məlumatları</label>
                <textarea value={form.safetyInfo} onChange={e => set("safetyInfo", e.target.value)} className="input-field" rows="2" placeholder="Ehtiyat tədbirləri..." />
              </div>
            </div>
          </section>

          {/* PDF Links */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Icon name="fileText" size={16} /> PDF Sənədlər</h3>
            <div className="space-y-3">
              <div>
                <label className="label-sm">Etiket PDF URL</label>
                <input value={form.labelPdfUrl} onChange={e => set("labelPdfUrl", e.target.value)} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="label-sm">Təlimat PDF URL</label>
                <input value={form.instructionPdfUrl} onChange={e => set("instructionPdfUrl", e.target.value)} className="input-field" placeholder="https://..." />
              </div>
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Ləğv et
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? "Yadda saxlanır..." : isEdit ? "Yenilə" : "Əlavə et"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main CatalogPanel ─────────────────────────────────────────────────────────
export default function CatalogPanel({ user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);
  const storeId = user?.store?.id;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ mine: "1" });
      if (search) params.set("search", search);
      const data = await apiFetch(`/api/catalog?${params}`);
      setProducts(data.products || []);
      setTotal(data.pagination?.total || 0);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    apiFetch("/api/categories?pageSize=100")
      .then(d => setCategories(d.categories || d || []))
      .catch(() => {});
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(productId) {
    if (!confirm("Məhsulu silmək istədiyinizdən əminsiniz?")) return;
    try {
      await apiFetch(`/api/products/${productId}`, { method: "DELETE" });
      fetchProducts();
    } catch (err) { alert(err.message || "Silinə bilmədi"); }
  }

  function openEdit(product) {
    setEditProduct(product);
    setShowModal(true);
  }

  function openNew() {
    setEditProduct(null);
    setShowModal(true);
  }

  function onSaved() {
    setShowModal(false);
    setEditProduct(null);
    fetchProducts();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-xl text-gray-900 flex items-center gap-2"><Icon name="package" size={22} className="text-brand-600" /> Katalog Məhsullarım</h2>
          <p className="text-sm text-gray-500 mt-0.5">Mağazanızın sabit ürün kataloğu — stok, SKU, qiymət idarəetməsi</p>
        </div>
        {(storeId || isAdmin) && (
          <button onClick={openNew} className="btn-primary shrink-0">
            + Məhsul Əlavə Et
          </button>
        )}
      </div>

      {/* No store warning */}
      {!storeId && !isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
          <span className="flex items-center gap-1.5"><Icon name="alert" size={16} className="text-amber-600 shrink-0" /> Katalog məhsulu əlavə etmək üçün əvvəlcə <strong>mağaza yaratmalısınız</strong>.</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Məhsul adı, SKU və ya barkod ilə axtar..."
          className="input-field pl-9"
        />
      </div>

      {/* Stats */}
      {!loading && (
        <p className="text-sm text-gray-500">Ümumi: <strong>{total}</strong> məhsul</p>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="mb-3 text-gray-300 flex justify-center"><Icon name="package" size={54} /></div>
          <p className="font-semibold text-gray-600">Katalogda məhsul yoxdur</p>
          <p className="text-sm mt-1">İlk məhsulunuzu əlavə edin</p>
          {(storeId || isAdmin) && (
            <button onClick={openNew} className="btn-primary mt-4">+ Məhsul Əlavə Et</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <CatalogProductCard
              key={p.id}
              product={p}
              onEdit={openEdit}
              onDelete={handleDelete}
              isOwner={true}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CatalogProductModal
          editProduct={editProduct}
          categories={categories}
          storeId={storeId}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
