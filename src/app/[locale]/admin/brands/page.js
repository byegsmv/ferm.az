"use client";
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import SafeImage from '@/components/SafeImage';
import ImageUploadField from '@/components/ui/ImageUploadField';

const defaultForm = {
  name: "",
  logoUrl: "",
  country: "",
  website: "",
  description: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminBrandsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...defaultForm });
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    setLoading(true);
    try {
      const d = await apiFetch("/api/brands?all=true");
      setItems(d.brands || []);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...defaultForm });
    setErr("");
    setShowModal(true);
  }

  function openEdit(brand) {
    setEditingId(brand.id);
    setForm({
      name: brand.name || "",
      logoUrl: brand.logoUrl || "",
      country: brand.country || "",
      website: brand.website || "",
      description: brand.description || "",
      isActive: brand.isActive ?? true,
      sortOrder: brand.sortOrder ?? 0,
    });
    setErr("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setErr("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        name: form.name.trim(),
        logoUrl: form.logoUrl.trim() || undefined,
        country: form.country.trim() || undefined,
        website: form.website.trim() || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };

      let result;
      if (editingId) {
        result = await apiFetch(`/api/brands/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast("Brend yeniləndi", "success");
      } else {
        result = await apiFetch("/api/brands", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast("Brend əlavə edildi", "success");
      }

      closeModal();
      fetchBrands();
    } catch (e) {
      setErr(e.message);
      toast(e.message, "error");
    }
  }

  async function handleDelete(id) {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      const result = await apiFetch(`/api/brands/${id}`, { method: "DELETE" });
      toast("Brend silindi", "success");
      fetchBrands();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(id, val) {
    try {
      await apiFetch(`/api/brands/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: val }),
      });
      setItems(p => p.map(b => b.id === id ? { ...b, isActive: val } : b));
      toast(val ? "Aktiv edildi" : "Deaktiv edildi", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Brendlər</h1>
          <p className="text-gray-500 mt-1">Məhsul brendlərini idarə edin.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
        >
          <Icon name="plus" size={16} />
          Yeni Brend
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Logo / Ad</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Ölkə</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vebsayt</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Yüklənir...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Heç bir brend tapılmadı.</td></tr>
            ) : items.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {b.logoUrl ? (
                        <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <span className="text-lg font-black text-brand-600">{b.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{b.name}</span>
                      {b.description && (
                        <div className="text-xs text-gray-400 truncate max-w-xs">{b.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                  {b.country || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                  {b.website ? (
                    <a href={b.website} target="_blank" rel="noopener" className="text-brand-600 hover:underline truncate block max-w-xs">{b.website}</a>
                  ) : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{b.slug}</td>
                <td className="px-6 py-4">
                  {b.isActive ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Aktiv</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Deaktiv</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Redaktə et"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(b.id, !b.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${b.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                      {b.isActive ? "Deaktiv et" : "Aktiv et"}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Sil"
                    >
                      <Icon name={deletingId === b.id ? "loader" : "trash"} size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Brendi Redaktə Et" : "Yeni Brend Əlavə Et"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {err && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {err}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder="Məs: John Deere"
                />
              </div>

              {/* Logo Upload + Country */}
              <div className="space-y-4">
                <ImageUploadField
                  label="Brend Logosu"
                  value={form.logoUrl}
                  onChange={(val) => setForm(p => ({ ...p, logoUrl: val }))}
                  placeholder="https://example.com/logo.png"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ölkə</label>
                  <input
                    value={form.country}
                    onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="Məs: ABŞ, Almaniya, Azərbaycan"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vebsayt</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder="https://example.com"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
                  placeholder="Brend haqqında qısa məlumat..."
                />
              </div>

              {/* SortOrder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sıra Nömrəsi</label>
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              {/* isActive toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-brand-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {form.isActive ? "Aktiv" : "Deaktiv"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  {editingId ? "Yenilə" : "Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
