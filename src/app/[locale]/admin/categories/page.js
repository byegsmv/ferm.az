"use client";
import React, { useState, useEffect } from 'react';
import Icon, { ICONS } from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

const defaultForm = {
  nameAz: "",
  nameEn: "",
  nameRu: "",
  icon: "",
  description: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...defaultForm });
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const d = await apiFetch("/api/categories?all=true");
      setItems(d.categories || []);
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

  function openEdit(cat) {
    setEditingId(cat.id);
    setForm({
      nameAz: cat.nameAz || "",
      nameEn: cat.nameEn || "",
      nameRu: cat.nameRu || "",
      icon: cat.icon || "",
      description: cat.description || "",
      parentId: cat.parentId || "",
      sortOrder: cat.sortOrder ?? 0,
      isActive: cat.isActive ?? true,
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
        nameAz: form.nameAz,
        nameEn: form.nameEn || undefined,
        nameRu: form.nameRu || undefined,
        icon: form.icon || undefined,
        description: form.description || undefined,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };

      let result;
      if (editingId) {
        result = await apiFetch(`/api/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast("Kateqoriya yeniləndi", "success");
      } else {
        result = await apiFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast("Kateqoriya əlavə edildi", "success");
      }

      closeModal();
      fetchCategories();
    } catch (e) {
      setErr(e.message);
      toast(e.message, "error");
    }
  }

  async function handleDelete(id) {
    if (deletingId === id) return; // prevent double-click
    setDeletingId(id);
    try {
      const result = await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      toast(result.note || "Kateqoriya silindi", "success");
      fetchCategories();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(id, val) {
    try {
      await apiFetch(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: val }),
      });
      setItems(p => p.map(c => c.id === id ? { ...c, isActive: val } : c));
      toast(val ? "Aktiv edildi" : "Deaktiv edildi", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const parents = items.filter(c => !c.parentId);

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Kateqoriyalar</h1>
          <p className="text-gray-500 mt-1">Sistemdəki bütün məhsul kateqoriyalarını idarə edin.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
        >
          <Icon name="plus" size={16} />
          Yeni Kateqoriya
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">İkon / Ad</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Təsvir</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Növ</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Yüklənir...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Heç bir kateqoriya tapılmadı.</td></tr>
            ) : items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                      <Icon name={c.icon || "grid"} size={20} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{c.name}</span>
                      {c.nameEn && c.nameEn !== c.nameAz && (
                        <div className="text-xs text-gray-400">EN: {c.nameEn}</div>
                      )}
                      {c.nameRu && c.nameRu !== c.nameAz && (
                        <div className="text-xs text-gray-400">RU: {c.nameRu}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate hidden md:table-cell">
                  {c.description || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.slug}</td>
                <td className="px-6 py-4 text-sm">
                  {c.parentId ? (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Alt Kateqoriya</span>
                  ) : (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">Əsas</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {c.isActive ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Aktiv</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Deaktiv</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Redaktə et"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(c.id, !c.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${c.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                      {c.isActive ? "Deaktiv et" : "Aktiv et"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Sil"
                    >
                      <Icon name={deletingId === c.id ? "loader" : "trash"} size={16} />
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
                {editingId ? "Kateqoriyanı Redaktə Et" : "Yeni Kateqoriya Əlavə Et"}
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

              {/* Multi-language names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad (AZ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.nameAz}
                    onChange={e => setForm(p => ({ ...p, nameAz: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="Məs: Traktorlar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad (EN)</label>
                  <input
                    value={form.nameEn}
                    onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="e.g. Tractors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad (RU)</label>
                  <input
                    value={form.nameRu}
                    onChange={e => setForm(p => ({ ...p, nameRu: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="Напр.: Тракторы"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
                  placeholder="Kateqoriya haqqında qısa məlumat..."
                />
              </div>

              {/* Icon + Parent + SortOrder */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative group hover:z-50 focus-within:z-50">
                  <label className="block text-sm font-medium text-gray-700 mb-1">İkon</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Icon name={form.icon || "search"} size={16} />
                    </div>
                    <input
                      value={form.icon}
                      onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      placeholder="İkon adı (məs: tractor)"
                    />
                  </div>
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl p-3 z-50 hidden group-focus-within:block hover:block transition-all max-h-60 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Mövcud İkonlar</p>
                    <div className="grid grid-cols-6 gap-1">
                      {Object.keys(ICONS).map(iconName => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => {
                            setForm(p => ({ ...p, icon: iconName }));
                            document.activeElement.blur();
                          }}
                          title={iconName}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95 ${form.icon === iconName ? 'bg-brand-100 text-brand-700 border border-brand-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 border border-transparent'}`}
                        >
                          <Icon name={iconName} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valideyn Kateqoriya</label>
                  <select
                    value={form.parentId}
                    onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  >
                    <option value="">— Əsas Kateqoriya —</option>
                    {parents.filter(p => p.id !== editingId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

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
