"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";
import TermsCheckbox from "@/components/TermsCheckbox";

// /dashboard/products/new — the "Yeni məhsul" button in the store dashboard.
// Mirrors the /elan-yerlesdir flow: cascading category selection, same card
// design language, plus retail + wholesale pricing for stores.
export default function StoreNewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  // Cascading Category States (same as elan-yerlesdir)
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [selectedSubSubCat, setSelectedSubSubCat] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [formData, setFormData] = useState({
    titleAz: "",
    descriptionAz: "",
    price: "",
    discountedPrice: "",
    stock: "1",
    unit: "ədəd",
    categoryId: "",
    wholesalePrice: "",
    wholesaleMinQty: "",
  });

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/dashboard");
      return;
    }

    apiFetch("/api/categories")
      .then((data) => setCategories(data?.categories || []))
      .catch(console.error);

    // Auto-attach the product to the owner's store, if they have one.
    apiFetch("/api/stores/me")
      .then((data) => {
        if (data?.store) {
          setStoreId(data.store.id);
          setStoreName(data.store.name);
        }
      })
      .catch(() => {
        // No store — the product will still be created, just unattached.
      });
  }, [router]);

  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setTermsError("Məhsulu əlavə etmək üçün İstifadə Şərtlərini oxuyub qəbul etməlisiniz.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const payload = {
        titleAz: formData.titleAz,
        descriptionAz: formData.descriptionAz || "",
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock || "1", 10),
        unit: formData.unit || "ədəd",
        categoryId: formData.categoryId,
        durationDays: 1,
        images: images.map((img) => ({ url: img.url, altText: formData.titleAz })),
      };

      if (storeId) payload.storeId = storeId;

      if (formData.discountedPrice) {
        const disc = parseFloat(formData.discountedPrice);
        if (disc >= payload.price) {
          setError("Endirimli qiymət normal qiymətdən aşağı olmalıdır.");
          setLoading(false);
          return;
        }
        payload.discountedPrice = disc;
      }

      if (formData.wholesalePrice) {
        payload.wholesalePrice = parseFloat(formData.wholesalePrice);
        payload.wholesaleMinQty = parseInt(formData.wholesaleMinQty || "1", 10);
      }

      const result = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert(
        result?.status === "ACTIVE"
          ? "Məhsul uğurla əlavə edildi və dərhal aktivləşdirildi."
          : "Məhsul uğurla əlavə edildi və təsdiq üçün adminə göndərildi."
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-extrabold mb-1">Yeni Məhsul Əlavə Et</h1>
      <p className="text-sm text-gray-500 mb-6">
        {storeName ? (
          <>Mağaza: <span className="font-semibold text-gray-700">{storeName}</span> — məhsul avtomatik mağazanıza əlavə olunacaq.</>
        ) : (
          "Məhsul məlumatlarını doldurun — kateqoriya seçimi elan bölməsi ilə eyni qaydadadır."
        )}
      </p>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-5 space-y-3">
        {/* Title */}
        <input
          required
          placeholder="Məhsulun adı (məs: EvroHim KAS-32 maye azot gübrəsi (1L))"
          className="input-field"
          value={formData.titleAz}
          onChange={set("titleAz")}
        />

        {/* Cascading Category Selection — same as elan-yerlesdir */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <label className="block text-xs font-semibold text-gray-500">KATEQORİYA SEÇİMİ</label>
          <select
            className="input-field"
            value={selectedMainCat}
            onChange={(e) => {
              setSelectedMainCat(e.target.value);
              setSelectedSubCat("");
              setSelectedSubSubCat("");
              setFormData({ ...formData, categoryId: "" });
            }}
          >
            <option value="">Ana kateqoriyanı seçin</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name || c.nameAz}</option>
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
                  setFormData({ ...formData, categoryId: val });
                } else {
                  setFormData({ ...formData, categoryId: "" });
                }
              }}
            >
              <option value="">Alt kateqoriyanı seçin</option>
              {categories.find(c => c.id === selectedMainCat).children.map((c) => (
                <option key={c.id} value={c.id}>{c.name || c.nameAz}</option>
              ))}
            </select>
          )}

          {selectedSubCat && categories.find(c => c.id === selectedMainCat)?.children?.find(ch => ch.id === selectedSubCat)?.children?.length > 0 && (
            <select
              className="input-field animate-fade-in"
              value={selectedSubSubCat}
              onChange={(e) => {
                setSelectedSubSubCat(e.target.value);
                setFormData({ ...formData, categoryId: e.target.value });
              }}
            >
              <option value="">Daha dəqiq kateqoriyanı seçin</option>
              {categories.find(c => c.id === selectedMainCat).children.find(ch => ch.id === selectedSubCat).children.map((c) => (
                <option key={c.id} value={c.id}>{c.name || c.nameAz}</option>
              ))}
            </select>
          )}
        </div>

        {/* Retail + Discounted Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">PƏRAKƏNDƏ QİYMƏT (AZN)</label>
            <input type="number" step="0.01" required value={formData.price} onChange={set("price")}
              className="input-field" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-red-600 mb-1">ENDİRİMLİ QİYMƏT (OPSİONAL)</label>
            <input type="number" step="0.01" value={formData.discountedPrice} onChange={set("discountedPrice")}
              className="input-field" placeholder="0.00" />
          </div>
        </div>

        {/* Wholesale Price */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 space-y-3">
          <p className="text-xs font-bold text-amber-800">TOPDAN SATIŞ (OPSİONAL)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">Topdan qiymət (AZN)</label>
              <input type="number" step="0.01" value={formData.wholesalePrice} onChange={set("wholesalePrice")}
                className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">Minimum say</label>
              <input type="number" min="1" value={formData.wholesaleMinQty} onChange={set("wholesaleMinQty")}
                className="input-field" placeholder="məs: 10" />
            </div>
          </div>
          <p className="text-[11px] text-amber-700">
            Topdan qiymət minimum sayda alan müştərilərə şamil olunacaq.
          </p>
        </div>

        {/* Unit + Stock */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">VAHİD</label>
            <input type="text" value={formData.unit} onChange={set("unit")}
              className="input-field" placeholder="ədəd / kq / litr" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">STOK SAYI</label>
            <input type="number" min="0" required value={formData.stock} onChange={set("stock")}
              className="input-field" placeholder="1" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">TƏSVİR</label>
          <textarea rows={4} value={formData.descriptionAz} onChange={set("descriptionAz")}
            className="input-field" placeholder="Məhsul haqqında məlumat..." />
        </div>

        {/* Images */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">ŞƏKİLLƏR</label>
          <ImageUploader value={images} onChange={setImages} max={8} />
        </div>

        <div className="flex gap-3 pt-2">
          <TermsCheckbox
            checked={termsAccepted}
            onChange={(v) => { setTermsAccepted(v); if (v) setTermsError(""); }}
            error={termsError}
          />

          <button type="submit" disabled={loading || !termsAccepted}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all">
            {loading ? "Göndərilir..." : "Məhsulu Əlavə Et"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
            Geri
          </button>
        </div>
      </form>
    </div>
  );
}
