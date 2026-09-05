"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";

// /dashboard/products/new — the "Yeni məhsul" button in the store dashboard
// previously linked here but no page existed (404). This page creates a
// product that is automatically attached to the owner's store (via
// /api/stores/me) and supports retail + wholesale pricing.
export default function StoreNewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

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
      .then((data) => {
        // /api/categories returns { categories: [ { ...parent, children: [...] } ] }.
        // Flatten to parent + child options for a simple <select>.
        const flat = [];
        (data?.categories || []).forEach((cat) => {
          if (cat.children && cat.children.length > 0) {
            cat.children.forEach((ch) => flat.push({ ...ch, name: `${cat.name} › ${ch.name}` }));
          } else {
            flat.push(cat);
          }
        });
        setCategories(flat);
      })
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

  const inputCls = "w-full p-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Yeni Məhsul Əlavə Et</h1>
      {storeName && (
        <p className="text-sm text-gray-500 mb-6">
          Mağaza: <span className="font-medium text-gray-700">{storeName}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Məhsulun adı</label>
          <input type="text" required value={formData.titleAz} onChange={set("titleAz")}
            className={inputCls} placeholder="Məs: EvroHim KAS-32 maye azot gübrəsi (1L)" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kateqoriya</label>
          <select required value={formData.categoryId} onChange={set("categoryId")} className={inputCls}>
            <option value="">Kateqoriya seçin</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pərakəndə qiymət (AZN)</label>
            <input type="number" step="0.01" required value={formData.price} onChange={set("price")}
              className={inputCls} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-red-700">Endirimli qiymət (AZN, opsional)</label>
            <input type="number" step="0.01" value={formData.discountedPrice} onChange={set("discountedPrice")}
              className={inputCls + " !border-red-200 focus:!border-red-400"} placeholder="0.00" />
            <p className="text-xs text-gray-400 mt-1">Boş saxlansanız endirim göstərilmir. Normal qiymətdən aşağı olmalıdır.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vahid</label>
          <input type="text" value={formData.unit} onChange={set("unit")}
            className={inputCls} placeholder="ədəd / kq / litr" />
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-4">
          <p className="text-sm font-medium text-amber-800">Topdan satış (opsional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-amber-900">Topdan qiymət (AZN)</label>
              <input type="number" step="0.01" value={formData.wholesalePrice} onChange={set("wholesalePrice")}
                className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-amber-900">Minimum say</label>
              <input type="number" min="1" value={formData.wholesaleMinQty} onChange={set("wholesaleMinQty")}
                className={inputCls} placeholder="məs: 10" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stok sayı</label>
          <input type="number" min="0" required value={formData.stock} onChange={set("stock")}
            className={inputCls} placeholder="1" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Təsvir</label>
          <textarea rows={4} value={formData.descriptionAz} onChange={set("descriptionAz")}
            className={inputCls} placeholder="Məhsul haqqında məlumat..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Şəkillər</label>
          <ImageUploader value={images} onChange={setImages} max={8} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition">
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
