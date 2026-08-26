"use client";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { apiFetch, getUser, getToken } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";

export default function UserEditProductPage({ params }) {
  const { id } = params;
  const router = useRouter();
  
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    titleAz: "",
    categoryId: "",
    price: "",
    stock: 1,
    region: "",
    city: "",
    descriptionAz: "",
    images: [],
    tags: [],
    unit: "ədəd",
    isCorporate: false,
    wholesalePrice: "",
    wholesaleMinQty: "",
    allowRetail: true,
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [selectedSubSubCat, setSelectedSubSubCat] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/categories"),
      apiFetch(`/api/products/${id}`)
    ])
    .then(([catData, prodData]) => {
      setCategories(catData.categories || []);
      const p = prodData.product;
      
      const currentUser = getUser();
      if (!currentUser || p.sellerId !== currentUser.id) {
        throw new Error("Siz yalnız öz məhsullarınıza düzəliş edə bilərsiniz.");
      }

      setForm({
        titleAz: p.titleAz || "",
        categoryId: p.categoryId || "",
        price: p.price || "",
        stock: p.stock || 1,
        region: p.region || "",
        city: p.city || "",
        descriptionAz: p.descriptionAz || "",
        images: p.images || [],
        tags: p.tags || [],
        unit: p.unit || "ədəd",
        isCorporate: p.isCorporate || false,
        wholesalePrice: p.wholesalePrice || "",
        wholesaleMinQty: p.wholesaleMinQty || "",
        allowRetail: p.allowRetail !== false,
      });
    })
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
  }, [id]);

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
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !form.tags.includes(trimmed)) {
        if (form.tags.length >= 10) return;
        setForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
        setTagInput("");
      }
    }
  };

  const removeTag = (indexToRemove) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== indexToRemove) }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        titleAz: form.titleAz,
        price: Number(form.price),
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

      if (form.isCorporate && !form.allowRetail) {
        payload.price = Number(form.wholesalePrice);
      }

      await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      const details = err.details ? Object.values(err.details).filter(Boolean).flat().join(" · ") : "";
      setError(details || err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Yüklənir...</div>;

  if (error && !form.titleAz) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-bold">{error}</div>
      <Link href="/dashboard" className="text-brand-600 font-bold hover:underline">Geri qayıt</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
          <Icon name="arrowLeft" size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Elanımı Redaktə Et</h1>
          <p className="text-gray-500 text-sm">Dəyişikliklər admin yoxlanışına göndəriləcək</p>
        </div>
      </div>

      {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 font-bold">Dəyişikliklər yadda saxlanıldı və yoxlanışa göndərildi! Yönləndirilirsiniz...</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Elanın adı</label>
          <input required className="input-field" value={form.titleAz} onChange={e => setForm({...form, titleAz: e.target.value})} />
        </div>

        {/* Category Update */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Yeni Kateqoriya Seçimi (Dəyişmək istəyirsinizsə)</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="input-field" value={selectedMainCat} onChange={(e) => { setSelectedMainCat(e.target.value); setSelectedSubCat(""); setSelectedSubSubCat(""); setForm({ ...form, categoryId: e.target.value || form.categoryId }); }}>
              <option value="">Ana kateqoriyanı seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedMainCat && categories.find(c => c.id === selectedMainCat)?.children?.length > 0 && (
              <select className="input-field" value={selectedSubCat} onChange={(e) => { setSelectedSubCat(e.target.value); setSelectedSubSubCat(""); setForm({ ...form, categoryId: e.target.value || form.categoryId }); }}>
                <option value="">Alt kateqoriyanı seçin</option>
                {categories.find(c => c.id === selectedMainCat).children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {selectedSubCat && categories.find(c => c.id === selectedMainCat)?.children?.find(ch => ch.id === selectedSubCat)?.children?.length > 0 && (
              <select className="input-field" value={selectedSubSubCat} onChange={(e) => { setSelectedSubSubCat(e.target.value); setForm({ ...form, categoryId: e.target.value || form.categoryId }); }}>
                <option value="">Daha dəqiq kateqoriyanı seçin</option>
                {categories.find(c => c.id === selectedMainCat).children.find(ch => ch.id === selectedSubCat).children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Stok</label>
            <input required type="number" min="0" className="input-field" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ölçü vahidi</label>
            <select className="input-field" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
              <option value="ədəd">Ədəd</option>
              <option value="kg">Kiloqram (kg)</option>
              <option value="ton">Ton</option>
              <option value="litr">Litr</option>
              <option value="qutu">Qutu</option>
              <option value="bağlama">Bağlama</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Qiymət (AZN)</label>
            <input required type="number" min="0" step="0.01" className="input-field" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-200 p-4 rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-brand-900 mb-3">
            <input type="checkbox" className="w-4 h-4 rounded text-brand-600" checked={form.isCorporate} onChange={e => setForm({...form, isCorporate: e.target.checked})} />
            Korporativ (Topdan)
          </label>
          {form.isCorporate && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-brand-700 mb-1">Topdan Qiymət (AZN)</label>
                <input required type="number" step="0.01" className="input-field bg-white" value={form.wholesalePrice} onChange={e => setForm({...form, wholesalePrice: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 mb-1">Min Miqdar</label>
                <input required type="number" min="1" className="input-field bg-white" value={form.wholesaleMinQty} onChange={e => setForm({...form, wholesaleMinQty: e.target.value})} />
              </div>
              <label className="col-span-2 flex items-center gap-2 text-sm bg-white p-3 rounded-lg border border-brand-100">
                <input type="checkbox" className="w-4 h-4 rounded text-brand-600" checked={form.allowRetail} onChange={e => setForm({...form, allowRetail: e.target.checked})} />
                Pərakəndə satışa da icazə
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bölgə</label>
            <input className="input-field" value={form.region} onChange={e => setForm({...form, region: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Şəhər/Rayon</label>
            <input className="input-field" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Ətraflı Təsvir</label>
          <textarea className="input-field min-h-[100px]" value={form.descriptionAz} onChange={e => setForm({...form, descriptionAz: e.target.value})} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Şəkillər (Maksimum 5)</label>
          <div className="flex flex-wrap gap-2">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img src={img.url} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"><Icon name="close" size={12} /></button>
              </div>
            ))}
            {form.images.length < 5 && (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50 flex flex-col items-center justify-center gap-1 text-gray-400 cursor-pointer">
                {uploading ? <span className="animate-spin block w-5 h-5 border-2 border-gray-300 border-t-brand-600 rounded-full" /> : <Icon name="image" size={24} />}
                <span className="text-[10px] font-medium">Yüklə</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Hashtag-lər (Maks. 10)</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map((tag, idx) => (
              <span key={idx} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                #{tag}
                <button type="button" onClick={() => removeTag(idx)}><Icon name="close" size={12} /></button>
              </span>
            ))}
          </div>
          <input placeholder="Teq əlavə edin (Enter basın)" className="input-field" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button disabled={saving} className="bg-brand-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-700 transition-colors">
            {saving ? "Yadda saxlanılır..." : "Yadda Saxla"}
          </button>
        </div>
      </form>
    </div>
  );
}
