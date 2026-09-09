"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch, getUser } from "@/lib/apiClient";

/**
 * Toplu Məhsul Əlavəsi — 2026-09-10
 * Axın: 150 şəkil seç → brauzer sıxışdırır və avtomatik qruplarla yükləyir →
 * hər şəkil qaralama məhsul olur → "AI ilə doldur" başlıq/təsvir/kateqoriya düzəldir →
 * qiyməti yaz → "Yayımla".
 */

async function compressImage(file, maxDim = 1200, quality = 0.72) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const k = maxDim / Math.max(width, height);
    width = Math.round(width * k); height = Math.round(height * k);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);
  const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

export default function BulkProductPage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [defaultCat, setDefaultCat] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [progress, setProgress] = useState(null); // {done, total}
  const [aiBusy, setAiBusy] = useState(null); // productId
  const [aiBulkBusy, setAiBulkBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(u.role)) {
      setReady(true);
      return;
    }
    setUser(u);
    Promise.all([
      apiFetch("/api/categories"),
      apiFetch("/api/admin/bulk-upload"),
    ]).then(([catData, draftData]) => {
      const cats = (catData.categories || []).filter(c => !c.parentId);
      setCategories(cats);
      setDrafts(draftData.products || []);
      setDefaultCat(localStorage.getItem("bulkDefaultCat") || "");
    }).catch(() => {}).finally(() => setReady(true));
  }, []);

  function updateDraft(id, patch) {
    setDrafts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (!defaultCat) { setUploadMsg("Əvvəlcə standart kateqoriyanı seçin."); return; }
    setUploading(true);
    setUploadMsg("");
    setProgress({ done: 0, total: files.length });
    const BATCH = 8;
    let created = 0, failed = 0;
    for (let i = 0; i < files.length; i += BATCH) {
      const slice = files.slice(i, i + BATCH);
      const fd = new FormData();
      fd.append("categoryId", defaultCat);
      for (const f of slice) {
        try {
          fd.append("files", await compressImage(f));
        } catch { failed++; }
      }
      try {
        const res = await apiFetch("/api/admin/bulk-upload", { method: "POST", body: fd });
        created += res.count || 0;
        if (res.created) {
          const newOnes = res.created.filter(c => c.ok).map(c => c.product);
          setDrafts(prev => [...newOnes, ...prev]);
        }
      } catch (err) {
        failed += slice.length;
        setUploadMsg("Xəta: " + err.message);
      }
      setProgress({ done: Math.min(i + BATCH, files.length), total: files.length });
    }
    setUploadMsg(`${created} məhsul qaralaması yaradıldı${failed ? `, ${failed} uğursuz` : ""}. İndi "AI ilə doldur" düyməsini basın.`);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function aiFill(id) {
    setAiBusy(id);
    try {
      const res = await apiFetch("/api/admin/ai-analyze", { method: "POST", body: JSON.stringify({ productId: id }) });
      if (res.product) {
        setDrafts(prev => prev.map(p => p.id === id ? { ...res.product, _priceInput: p._priceInput } : p));
      }
    } catch (err) {
      updateDraft(id, { _aiError: err.message });
    } finally { setAiBusy(null); }
  }

  async function aiFillAll() {
    setAiBulkBusy(true);
    const targets = drafts.filter(p => !p._aiDone);
    for (const p of targets) {
      await aiFill(p.id);
      updateDraft(p.id, { _aiDone: true });
    }
    setAiBulkBusy(false);
  }

  async function saveProduct(p) {
    try {
      const payload = { titleAz: p.titleAz, descriptionAz: p.descriptionAz || "", categoryId: p.categoryId, unit: "ədəd" };
      if (p._priceInput) payload.price = Number(p._priceInput);
      const res = await apiFetch(`/api/products/${p.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (p._priceInput) updateDraft(p.id, { price: Number(p._priceInput), _saved: true });
      else updateDraft(p.id, { _saved: true });
    } catch (err) {
      updateDraft(p.id, { _aiError: err.message });
    }
  }

  async function publish(p) {
    const price = Number(p._priceInput || p.price);
    if (!price || price <= 0) { updateDraft(p.id, { _aiError: "Yayımlamazdan əvvəl qiymət yazın" }); return; }
    try {
      await apiFetch(`/api/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ titleAz: p.titleAz, descriptionAz: p.descriptionAz || "", categoryId: p.categoryId, price, status: "ACTIVE", unit: "ədəd" }),
      });
      setDrafts(prev => prev.filter(x => x.id !== p.id));
    } catch (err) {
      updateDraft(p.id, { _aiError: err.message });
    }
  }

  if (!ready) return <div className="max-w-6xl mx-auto px-4 py-10"><div className="animate-pulse h-8 bg-gray-200 rounded-xl w-64" /></div>;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-black text-gray-900">Bu səhifə yalnız adminlər üçündür</h1>
        <a href="/login" className="btn-primary inline-block px-6 py-3 rounded-xl font-bold mt-4">Daxil Ol</a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="package" size={24} className="text-brand-600" />
        <h1 className="text-2xl font-black text-gray-900">Toplu Məhsul Əlavəsi</h1>
      </div>
      <p className="text-sm text-gray-500 -mt-3">Şəkilləri seçin — sistem hər şəkil üçün qaralama yaradır, AI məlumatları doldurur. Siz yalnız qiyməti yazıb yayımlayırsınız.</p>

      {/* Yükləmə paneli */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label-sm">Standart kateqoriya (şəkillər bura düşəcək)</label>
            <select value={defaultCat} onChange={(e) => { setDefaultCat(e.target.value); localStorage.setItem("bulkDefaultCat", e.target.value); }} className="input-field">
              <option value="">— seçin —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nameAz}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <label className={`btn-primary px-5 py-3 rounded-xl font-bold cursor-pointer flex items-center gap-2 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <Icon name="upload" size={16} />
              {uploading ? "Yüklənir..." : "Şəkilləri Seç və Yüklə"}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
            </label>
          </div>
        </div>
        {uploading && progress && (
          <div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress.done} / {progress.total} şəkil...</p>
          </div>
        )}
        {uploadMsg && <p className="text-sm text-brand-700 bg-brand-50 rounded-xl p-3">{uploadMsg}</p>}
        {drafts.length > 0 && (
          <button onClick={aiFillAll} disabled={aiBulkBusy} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            <Icon name="ai" size={15} /> {aiBulkBusy ? "AI doldurur..." : `Hamısını AI ilə doldur (${drafts.filter(p => !p._aiDone).length})`}
          </button>
        )}
      </div>

      {/* Qaralamalar */}
      {drafts.length === 0 && !uploading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Hələ qaralamalar yoxdur — şəkilləri seçin.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drafts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="w-full aspect-square bg-gray-50 relative">
                {p.images?.[0] ? (
                  <img src={p.images[0].url} alt={p.titleAz} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Icon name="package" size={40} /></div>
                )}
                <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">QARALAMA</span>
              </div>
              <div className="p-4 space-y-2.5 flex-1 flex flex-col">
                <input
                  value={p.titleAz}
                  onChange={(e) => updateDraft(p.id, { titleAz: e.target.value })}
                  className="input-field text-sm font-bold"
                  placeholder="Məhsul adı"
                />
                <textarea
                  value={p.descriptionAz || ""}
                  onChange={(e) => updateDraft(p.id, { descriptionAz: e.target.value })}
                  className="input-field text-xs" rows="2" placeholder="Təsvir"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" step="0.01" min="0"
                    value={p._priceInput ?? ""}
                    onChange={(e) => updateDraft(p.id, { _priceInput: e.target.value })}
                    className="input-field text-sm" placeholder="Qiymət ₼"
                  />
                  <select value={p.categoryId} onChange={(e) => updateDraft(p.id, { categoryId: e.target.value })} className="input-field text-xs">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nameAz}</option>)}
                  </select>
                </div>
                {p._aiError && <p className="text-[11px] text-red-600">{p._aiError}</p>}
                {p._saved && <p className="text-[11px] text-emerald-600">Yadda saxlanıldı ✓</p>}
                <div className="flex gap-2 mt-auto pt-2">
                  <button onClick={() => aiFill(p.id)} disabled={aiBusy === p.id} className="flex-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
                    <Icon name="ai" size={13} /> {aiBusy === p.id ? "..." : "AI ilə doldur"}
                  </button>
                  <button onClick={() => saveProduct(p)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2 text-xs font-bold">Saxla</button>
                  <button onClick={() => publish(p)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-xs font-bold">Yayımla</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
