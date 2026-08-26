"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    titleAz: "",
    descriptionAz: "",
    price: "",
    stock: "1",
    categoryId: "",
    images: "",
  });

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/dashboard");
    }

    // Fetch categories
    apiFetch("/api/categories")
      .then(data => setCategories(data || []))
      .catch(console.error);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = getUser();
      
      const payload = {
        titleAz: formData.titleAz,
        descriptionAz: formData.descriptionAz,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        sellerId: user.id,
        status: "PENDING_REVIEW" // goes to admin approval
      };

      if (formData.images) {
        payload.images = formData.images.split(",").map(url => ({ url: url.trim() }));
      }

      await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      alert("Məhsul uğurla əlavə edildi və təsdiq üçün adminə göndərildi.");
      router.push("/dashboard");
    } catch (err) {
      alert("Xəta baş verdi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Yeni Məhsul Əlavə Et</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        
        <div>
          <label className="block text-sm font-medium mb-1">Məhsulun adı (AZ)</label>
          <input 
            type="text" required
            value={formData.titleAz}
            onChange={e => setFormData({...formData, titleAz: e.target.value})}
            className="w-full p-2.5 border border-gray-200 rounded-xl"
            placeholder="Məs: Qlifosat 48%"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kateqoriya</label>
          <select 
            required
            value={formData.categoryId}
            onChange={e => setFormData({...formData, categoryId: e.target.value})}
            className="w-full p-2.5 border border-gray-200 rounded-xl"
          >
            <option value="">Kateqoriya seçin</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.nameAz}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Qiymət (AZN)</label>
            <input 
              type="number" step="0.01" required
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              className="w-full p-2.5 border border-gray-200 rounded-xl"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stok sayı</label>
            <input 
              type="number" required
              value={formData.stock}
              onChange={e => setFormData({...formData, stock: e.target.value})}
              className="w-full p-2.5 border border-gray-200 rounded-xl"
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Təsvir (AZ)</label>
          <textarea 
            rows="4"
            value={formData.descriptionAz}
            onChange={e => setFormData({...formData, descriptionAz: e.target.value})}
            className="w-full p-2.5 border border-gray-200 rounded-xl"
            placeholder="Məhsul haqqında ətraflı məlumat..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Şəkil URL-ləri (vergüllə ayırın)</label>
          <input 
            type="text" 
            value={formData.images}
            onChange={e => setFormData({...formData, images: e.target.value})}
            className="w-full p-2.5 border border-gray-200 rounded-xl"
            placeholder="https://...image1.jpg, https://...image2.jpg"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Gözləyin..." : "Təsdiqə Göndər"}
        </button>

      </form>
    </div>
  );
}
