"use client";
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

export default function AdminCouponsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const { toast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    code: '', discountType: 'PERCENTAGE', discountValue: 0,
    minOrderValue: '', maxUses: '', startsAt: '', expiresAt: '',
    isActive: true,
  });

  useEffect(() => { loadCoupons(); }, []);

  async function loadCoupons() {
    try {
      const d = await apiFetch("/api/coupons");
      setItems(d.coupons || []);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const body = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await apiFetch(`/api/coupons/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
        toast("Kupon yeniləndi", "success");
      } else {
        await apiFetch("/api/coupons", { method: "POST", body: JSON.stringify(body) });
        toast("Kupon yaradıldı", "success");
      }
      resetForm();
      loadCoupons();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  function resetForm() {
    setForm({ code: '', discountType: 'PERCENTAGE', discountValue: 0, minOrderValue: '', maxUses: '', startsAt: '', expiresAt: '', isActive: true });
    setShowForm(false);
    setEditing(null);
  }

  function editCoupon(c) {
    setEditing(c.id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : '',
      maxUses: c.maxUses ?? '',
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 16) : '',
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '',
      isActive: c.isActive,
    });
    setShowForm(true);
  }

  async function toggleActive(id, currentActive) {
    try {
      await apiFetch(`/api/coupons/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !currentActive }) });
      toast(currentActive ? "Kupon deaktiv edildi" : "Kupon aktiv edildi", "success");
      loadCoupons();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function deleteCoupon(id) {
    if (!confirm('Bu kuponu silmək istədiyinizə əminsiniz?')) return;
    try {
      await apiFetch(`/api/coupons/${id}`, { method: "DELETE" });
      toast("Kupon silindi", "success");
      loadCoupons();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const expired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();
  const usagePercent = (c) => c.maxUses ? Math.round((c.usedCount / c.maxUses) * 100) : 0;

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Kuponlar</h1>
          <p className="text-gray-500 mt-1">Endirim kuponlarını idarə edin.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Icon name="plus" size={18} /> Yeni Kupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Kuponu Redaktə Et' : 'Yeni Kupon Yarat'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kupon Kodu *</label>
              <input type="text" required disabled={!!editing} value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} className="input-field uppercase" placeholder="YAZ2026" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endirim Növü *</label>
              <select value={form.discountType} onChange={e => setForm(f => ({...f, discountType: e.target.value}))} className="input-field">
                <option value="PERCENTAGE">Faiz (%)</option>
                <option value="FIXED">Sabit məbləğ (AZN)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endirim Dəyəri *</label>
              <input type="number" required min="0" step="0.01" value={form.discountValue} onChange={e => setForm(f => ({...f, discountValue: e.target.value}))} className="input-field" placeholder={form.discountType === 'PERCENTAGE' ? '10' : '5'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Sifariş (AZN)</label>
              <input type="number" min="0" step="0.01" value={form.minOrderValue} onChange={e => setForm(f => ({...f, minOrderValue: e.target.value}))} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max İstifadə Sayı</label>
              <input type="number" min="0" value={form.maxUses} onChange={e => setForm(f => ({...f, maxUses: e.target.value}))} className="input-field" placeholder="Limitsiz" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlama Tarixi</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({...f, startsAt: e.target.value}))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitmə Tarixi</label>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({...f, expiresAt: e.target.value}))} className="input-field" />
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">{form.isActive ? 'Aktiv' : 'Deaktiv'}</span>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary flex-1">{editing ? 'Yenilə' : 'Yarat'}</button>
              <button type="button" onClick={resetForm} className="btn-outline">Ləğv Et</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-full text-center py-12 text-gray-400">Yüklənir...</p>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🎟️</div>
            <p className="font-medium">Heç bir kupon yoxdur</p>
            <p className="text-sm text-gray-400 mt-1">"Yeni Kupon" düyməsini klikləyin</p>
          </div>
        ) : items.map(c => (
          <div key={c.id} className={`bg-white rounded-2xl border p-5 transition-all ${!c.isActive ? 'opacity-60 border-gray-200' : expired(c) ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:shadow-md'}`}>
            <div className="flex justify-between items-start mb-3">
              <code className="text-lg font-bold bg-gray-100 px-2 py-1 rounded">{c.code}</code>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.isActive ? 'Aktiv' : 'Deaktiv'}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>
                <span className="font-semibold text-gray-900">
                  {c.discountType === 'PERCENTAGE' ? `%${c.discountValue}` : `${c.discountValue} ₼`}
                </span> endirim
              </p>
              {c.minOrderValue && <p>Min. sifariş: <strong>{c.minOrderValue} ₼</strong></p>}
              {c.maxUses ? (
                <p>
                  İstifadə: <strong>{c.usedCount}/{c.maxUses}</strong>
                  <span className="ml-1 text-xs text-gray-400">({usagePercent(c)}%)</span>
                </p>
              ) : (
                <p>İstifadə: <strong>{c.usedCount}</strong> <span className="text-xs text-gray-400">(limitsiz)</span></p>
              )}
              {c.expiresAt && (
                <p className={expired(c) ? 'text-red-600 font-medium' : ''}>
                  {expired(c) ? '⚠️ Müddəti bitib: ' : 'Bitmə: '}{new Date(c.expiresAt).toLocaleDateString('az-AZ')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => editCoupon(c)} className="btn-outline text-xs py-1.5 px-3 flex-1" title="Redaktə et">
                ✏️ Redaktə
              </button>
              <button onClick={() => toggleActive(c.id, c.isActive)} className={`text-xs py-1.5 px-3 flex-1 rounded-lg border font-medium ${c.isActive ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                {c.isActive ? '🔴 Deaktiv' : '🟢 Aktiv'}
              </button>
              <button onClick={() => deleteCoupon(c.id)} className="border border-red-200 text-red-600 hover:bg-red-50 text-xs py-1.5 px-3 rounded-lg font-medium" title="Sil">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
