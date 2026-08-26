"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { apiFetch, getUser, getToken } from "@/lib/apiClient";

// Role-based restrictions removed — all users can post listings

export default function PostListingPage() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    titleAz: "",
    categoryId: "",
    price: "",
    discountedPrice: "",
    stock: 1,
    region: "",
    city: "",
    descriptionAz: "",
    images: [],
    guestName: "",
    guestPhone: "",
    tags: [],
    unit: "ədəd",
    isCorporate: false,
    wholesalePrice: "",
    wholesaleMinQty: "",
    allowRetail: true,
    brandId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI & Upload state
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Cascading Category States
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [selectedSubSubCat, setSelectedSubSubCat] = useState("");

  const [brands, setBrands] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [pricingConfig, setPricingConfig] = useState({
    tier_1_day: { days: 1, price: 0 },
    tier_15_days: { days: 15, price: 7 },
    tier_30_days: { days: 30, price: 15 },
  });

  useEffect(() => {
    setUser(getUser());
    Promise.all([
      apiFetch("/api/categories").then((d) => setCategories(d.categories || [])).catch(() => { }),
      apiFetch("/api/brands?withProducts=false").then((d) => setBrands(d.brands || [])).catch(() => { }),
      apiFetch("/api/config/listing-pricing").then((d) => {
        if (d?.pricing) setPricingConfig(d.pricing);
      }).catch(() => { })
    ]);
  }, []);

  const isSellerAccount = !!user;

  // Trigger toast notification
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 4000);
  };

  // AI autocomplete suggestion from Title onBlur
  const handleTitleBlur = async () => {
    if (!form.titleAz.trim()) return;
    setAiLoading(true);
    try {
      const selectedCategoryName = categories.find(c => c.id === form.categoryId)?.name || "";
      const res = await fetch("/api/ai/suggest-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.titleAz + " " + (form.descriptionAz || ""),
          category: selectedCategoryName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          descriptionAz: data.descriptionAz || data.description || prev.descriptionAz,
          tags: Array.from(new Set([...(prev.tags || []), ...(data.tags || [])])).slice(0, 10)
        }));
        triggerToast("AI təsvir yazıldı");
      }
    } catch (e) {
      console.error("AI Auto-suggest failed:", e);
    } finally {
      setAiLoading(false);
    }
  };

  // Image Upload using Blob storage
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (form.images.length + files.length > 5) {
      setError("Maksimum 5 şəkil əlavə edə bilərsiniz");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const token = getToken();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükləmə xətası");

      const newImages = [...form.images, ...data.images].slice(0, 5);
      setForm(prev => ({ ...prev, images: newImages }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Tags Hashtag handling
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !form.tags.includes(trimmed)) {
        if (form.tags.length >= 10) {
          setError("Maksimum 10 teq əlavə edə bilərsiniz");
          return;
        }
        setForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
        setTagInput("");
      }
    }
  };

  const removeTag = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== indexToRemove)
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        titleAz: form.titleAz,
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
        stock: Number(form.stock),
        categoryId: form.categoryId,
        region: form.region || undefined,
        city: form.city || undefined,
        descriptionAz: form.descriptionAz || undefined,
        images: form.images,
        tags: form.tags,
        unit: form.unit,
        isCorporate: form.isCorporate,
        allowRetail: form.isCorporate ? form.allowRetail : true,
        wholesalePrice: form.isCorporate && form.wholesalePrice ? Number(form.wholesalePrice) : undefined,
        wholesaleMinQty: form.isCorporate && form.wholesaleMinQty ? Number(form.wholesaleMinQty) : undefined,
      };

      // If corporate and retail is disabled, the standard price is the same as wholesale price
      if (form.isCorporate && !form.allowRetail) {
        payload.price = Number(form.wholesalePrice);
      }

      if (!isSellerAccount) {
        payload.guestName = form.guestName;
        payload.guestPhone = form.guestPhone;
      }
      payload.durationDays = selectedDuration;
      await apiFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      setSuccess(true);
    } catch (err) {
      const details = err.details ? Object.values(err.details).filter(Boolean).flat().join(" · ") : "";
      setError(details || err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4"></div>
        <h1 className="text-xl font-extrabold mb-2">Elanınız qəbul edildi!</h1>
        <p className="text-gray-600 text-sm">
          Admin yoxlamasından keçdikdən sonra elanınız saytda görünəcək. Bu adətən qısa müddət çəkir.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Link href="/products" className="btn-secondary text-sm">Elanlara bax</Link>
          {isSellerAccount && <Link href="/dashboard" className="btn-primary text-sm">Panelimə keç</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-brand-800 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Guest Sign up / Sign in Banner */}
      {!isSellerAccount && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex justify-between items-center text-sm">
          <div className="text-amber-800 font-medium">
            Qeydiyyatdan keç — daha çox imkan əldə et!
          </div>
          <Link href="/login" className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
            Daxil ol
          </Link>
        </div>
      )}

      <h1 className="text-xl font-extrabold mb-1">Elan Yerləşdir</h1>
      <p className="text-sm text-gray-500 mb-6">
        {isSellerAccount
          ? "Elanınız admin təsdiqindən sonra aktivləşəcək."
          : "Qeydiyyatdan keçmədən elan yerləşdirə bilərsiniz — sadəcə əlaqə məlumatlarınızı doldurun. Elan admin təsdiqindən sonra göstəriləcək."}
      </p>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-5 space-y-3">
        <div className="relative">
          <input
            required
            placeholder="Elanın adı (məs: Holştin cinsli inək satılır)"
            className="input-field pr-10"
            value={form.titleAz}
            onChange={(e) => setForm({ ...form, titleAz: e.target.value })}
            onBlur={handleTitleBlur}
          />
          {aiLoading && (
            <div className="absolute right-3 top-3">
              <svg className="animate-spin h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <label className="block text-xs font-semibold text-gray-500">KATEQORİYA SEÇİMİ</label>
          <select
            className="input-field"
            value={selectedMainCat}
            onChange={(e) => {
              setSelectedMainCat(e.target.value);
              setSelectedSubCat("");
              setSelectedSubSubCat("");
              setForm({ ...form, categoryId: "" });
            }}
          >
            <option value="">Ana kateqoriyanı seçin</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedMainCat && categories.find(c => c.id === selectedMainCat)?.children?.length > 0 && (
            <select
              className="input-field animate-fade-in"
              value={selectedSubCat}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSubCat(val);
                setSelectedSubSubCat("");

                const mainCat = categories.find(c => c.id === selectedMainCat);
                const subCat = mainCat?.children?.find(ch => ch.id === val);

                // If this sub-category doesn't have its own children, it's a leaf node.
                if (subCat && (!subCat.children || subCat.children.length === 0)) {
                  setForm({ ...form, categoryId: val });
                } else {
                  setForm({ ...form, categoryId: "" });
                }
              }}
            >
              <option value="">Alt kateqoriyanı seçin</option>
              {categories.find(c => c.id === selectedMainCat).children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {selectedSubCat && categories.find(c => c.id === selectedMainCat)?.children?.find(ch => ch.id === selectedSubCat)?.children?.length > 0 && (
            <select
              className="input-field animate-fade-in"
              value={selectedSubSubCat}
              onChange={(e) => {
                setSelectedSubSubCat(e.target.value);
                setForm({ ...form, categoryId: e.target.value });
              }}
            >
              <option value="">Daha dəqiq kateqoriyanı seçin</option>
              {categories.find(c => c.id === selectedMainCat).children.find(ch => ch.id === selectedSubCat).children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Stok (Mövcud Miqdar)
            </label>
            <input
              required
              type="number"
              min="1"
              className="input-field"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Ölçü vahidi
            </label>
            <select
              className="input-field"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              <option value="ədəd">Ədəd</option>
              <option value="kg">Kiloqram (kg)</option>
              <option value="ton">Ton</option>
              <option value="litr">Litr</option>
              <option value="qutu">Qutu</option>
              <option value="bağlama">Bağlama</option>
            </select>
          </div>

          {(!form.isCorporate || form.allowRetail) && (
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                {form.isCorporate ? "Pərakəndə Qiymət (AZN)" : "Qiymət (AZN)"}
              </label>
              <input
                required={!form.isCorporate || form.allowRetail}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Endirimli Qiymət və Brend Seçimi */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Endirimli Qiymət (AZN) — İstəyə bağlı
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Məs: 8.99"
              className="input-field"
              value={form.discountedPrice}
              onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
            />
            {form.discountedPrice && form.price && (
              <p className="text-[10px] text-green-600 mt-1">
                Endirim: {Math.round((1 - Number(form.discountedPrice) / Number(form.price)) * 100)}%
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Brend (İstehsalçı)
            </label>
            <select
              className="input-field"
              value={form.brandId}
              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
            >
              <option value="">Brend seçilməyib</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Corporate Ad Module Toggle */}
        <div className="bg-brand-50 border border-brand-200 p-4 rounded-xl mt-4">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-brand-900 mb-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-brand-600 rounded border-gray-300"
              checked={form.isCorporate}
              onChange={(e) => setForm({ ...form, isCorporate: e.target.checked })}
            />
            Bu məhsul Topdan (Korporativ) satılır?
          </label>

          {form.isCorporate && (
            <div className="space-y-4 border-t border-brand-200 pt-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-700 mb-1">
                    Topdan Qiymət (AZN)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Məs: 0.30"
                    className="input-field bg-white"
                    value={form.wholesalePrice}
                    onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-700 mb-1">
                    Minimum Miqdar ({form.unit})
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Məs: 100"
                    className="input-field bg-white"
                    value={form.wholesaleMinQty}
                    onChange={(e) => setForm({ ...form, wholesaleMinQty: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-brand-800 bg-white p-3 rounded-lg border border-brand-100 shadow-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-brand-600 rounded border-gray-300"
                  checked={form.allowRetail}
                  onChange={(e) => setForm({ ...form, allowRetail: e.target.checked })}
                />
                Pərakəndə satışa da icazə verirəm
              </label>
              {!form.allowRetail && (
                <p className="text-xs text-brand-600">
                  <Icon name="info" size={14} className="inline mr-1 text-blue-500" /> Məhsul yalnız {form.wholesaleMinQty || "..."} {form.unit} və daha yuxarı miqdarda sifariş edilə biləcək.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Bölgə"
            className="input-field"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          />
          <input
            placeholder="Şəhər/Rayon"
            className="input-field"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>

        <textarea
          placeholder="Ətraflı təsvir (istəyə bağlı)"
          className="input-field min-h-24"
          value={form.descriptionAz}
          onChange={(e) => setForm({ ...form, descriptionAz: e.target.value })}
        />

        {/* Custom Image Uploader */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Şəkillər (maksimum 5 şəkil əlavə edə bilərsiniz)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
            {form.images.length < 5 && (
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-600 transition-all cursor-pointer">
                {uploading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] font-medium">Yüklə</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Hashtags Section */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Hashtag-lər (Maksimum 10)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags?.map((tag, idx) => (
              <span key={idx} className="bg-brand-50 border border-brand-200 text-brand-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                #{tag}
                <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-600"><Icon name="close" size={12} /></button>
              </span>
            ))}
          </div>
          <input
            placeholder="Teq əlavə edin (Enter düyməsini basın)"
            className="input-field text-sm"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
        </div>

        {!isSellerAccount && (
          <div className="border-t border-gray-100 pt-3 mt-1 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Əlaqə məlumatları</p>
            <input
              required
              placeholder="Adınız"
              className="input-field"
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            />
            <input
              required
              placeholder="Telefon nömrəniz (məs: +994501234567)"
              className="input-field"
              value={form.guestPhone}
              onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
            />
          </div>
        )}

        {/* Duration Packages Selection */}
        <div className="border-t border-gray-100 pt-4 mt-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2.5">
            Elanın Yayımlanma Müddəti & Paketi
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1 Day Package */}
            <div
              onClick={() => setSelectedDuration(1)}
              className={`cursor-pointer rounded-2xl p-3 border-2 transition-all text-center flex flex-col justify-between ${
                selectedDuration === 1
                  ? "border-brand-600 bg-brand-50/50 shadow-xs"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-gray-500 block">1 Günlük</span>
                <span className="text-sm font-black text-brand-700 mt-1 block">
                  {pricingConfig?.tier_1_day?.price === 0 ? "Pulsuz" : `${pricingConfig?.tier_1_day?.price} ₼`}
                </span>
              </div>
              <span className="text-[9px] font-medium text-gray-400 mt-1.5 block">Sınaq</span>
            </div>

            {/* 15 Days Package */}
            <div
              onClick={() => setSelectedDuration(15)}
              className={`cursor-pointer rounded-2xl p-3 border-2 transition-all text-center flex flex-col justify-between relative ${
                selectedDuration === 15
                  ? "border-brand-600 bg-brand-50/50 shadow-xs"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                TÖVSİYƏ
              </span>
              <div>
                <span className="text-[11px] font-bold text-gray-500 block">15 Günlük</span>
                <span className="text-sm font-black text-brand-700 mt-1 block">
                  {pricingConfig?.tier_15_days?.price} ₼
                </span>
              </div>
              <span className="text-[9px] font-medium text-gray-400 mt-1.5 block">Standart</span>
            </div>

            {/* 30 Days Package */}
            <div
              onClick={() => setSelectedDuration(30)}
              className={`cursor-pointer rounded-2xl p-3 border-2 transition-all text-center flex flex-col justify-between relative ${
                selectedDuration === 30
                  ? "border-brand-600 bg-brand-50/50 shadow-xs"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                VIP
              </span>
              <div>
                <span className="text-[11px] font-bold text-gray-500 block">30 Günlük</span>
                <span className="text-sm font-black text-brand-700 mt-1 block">
                  {pricingConfig?.tier_30_days?.price} ₼
                </span>
              </div>
              <span className="text-[9px] font-medium text-gray-400 mt-1.5 block">Maksimum</span>
            </div>
          </div>
        </div>

        <button disabled={loading} className="btn-primary w-full mt-2">
          {loading ? "Göndərilir..." : "Elanı Göndər"}
        </button>

        {!isSellerAccount && (
          <p className="text-xs text-gray-400 text-center pt-1">
            Hesabınız var? <Link href="/login" className="text-brand-700 font-medium">Daxil olun</Link> — elanlarınızı idarə etmək üçün.
          </p>
        )}
      </form>
    </div>
  );
}
