'use client';

import { useState, useEffect } from 'react';
import {
  ToggleLeft, Save, RefreshCw, Plus, Trash2, Edit3,
  Layers, Check, Sparkles, Shield, Search, ArrowRight,
  FolderTree, ShoppingBag, Activity, Database, Layout
} from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

export default function ModuleToggleSystem() {
  const { toast, ToastContainer } = useToast();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // New / Edit Module Modal
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({
    id: '',
    name: '',
    slug: '/admin/custom',
    description: '',
    icon: 'Layers',
    category: 'CUSTOM',
    status: 'ACTIVE',
    badge: ''
  });

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/modules');
      if (data && data.modules) {
        setModules(data.modules);
      }
    } catch (error) {
      toast(error.message || 'Modullar yüklənmədi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const saveModules = async (updatedModules) => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/modules', {
        method: 'POST',
        body: JSON.stringify({ modules: updatedModules, action: 'Update Module Registry' })
      });
      setModules(updatedModules);
      toast('Modul strukturu uğurla yeniləndi', 'success');
    } catch (error) {
      toast(error.message || 'Yadda saxlanılmadı', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModule = (modId) => {
    const updated = modules.map(m => {
      if (m.id === modId) {
        return { ...m, status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
      }
      return m;
    });
    saveModules(updated);
  };

  const openCreateModal = () => {
    setEditingModule(null);
    setModuleForm({
      id: `mod-${Date.now()}`,
      name: '',
      slug: '/admin/yeni-modul',
      description: 'Super Admin tərəfindən yaradılmış dinamik modul',
      icon: 'Layers',
      category: 'CUSTOM',
      status: 'ACTIVE',
      badge: 'NEW'
    });
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setEditingModule(m);
    setModuleForm({
      id: m.id,
      name: m.name,
      slug: m.slug || '',
      description: m.description || '',
      icon: m.icon || 'Layers',
      category: m.category || 'GENERAL',
      status: m.status || 'ACTIVE',
      badge: m.badge || ''
    });
    setShowModal(true);
  };

  const handleSaveModuleForm = (e) => {
    e.preventDefault();
    if (!moduleForm.name.trim()) {
      toast('Modul adı mütləq daxil edilməlidir', 'error');
      return;
    }

    let updated = [];
    if (editingModule) {
      updated = modules.map(m => m.id === editingModule.id ? { ...m, ...moduleForm } : m);
    } else {
      updated = [...modules, { ...moduleForm, children: [] }];
    }

    saveModules(updated);
    setShowModal(false);
  };

  const handleDeleteModule = (modId, modName) => {
    if (!window.confirm(`'${modName}' modulunu tamamilə silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarılmır.`)) {
      return;
    }
    const updated = modules.filter(m => m.id !== modId);
    saveModules(updated);
    toast(`'${modName}' modulu tamamilə silindi`, 'success');
  };

  const categories = ['ALL', ...new Set(modules.map(m => m.category || 'GENERAL'))];

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(search.toLowerCase()) ||
                          m.description?.toLowerCase().includes(search.toLowerCase()) ||
                          m.slug?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || (m.category || 'GENERAL') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Super Admin Modul İdarəetmə Mərkəzi</h1>
            <p className="text-xs text-gray-500">Sistemdəki bütün modulları yaradın, redaktə edin, aktiv/deaktiv edin və ya tamamilə silin</p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Modul Yarat</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Modul adı, açıqlaması və ya slug ilə axtar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'Hamısı' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
          <p className="text-xs font-bold">Modullar yüklənir...</p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Heç bir modul tapılmadı</h3>
          <p className="text-xs text-gray-400 mt-1">Axtarışa uyğun modul yoxdur və ya yeni modul yarada bilərsiniz</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md"
          >
            İlk Modulu Yarat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((m) => {
            const isActive = m.status === 'ACTIVE';

            return (
              <div
                key={m.id}
                className={`bg-white rounded-3xl border p-5 shadow-sm transition-all flex flex-col justify-between gap-4 ${
                  isActive ? 'border-gray-200/90' : 'border-gray-200 bg-gray-50/60 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isActive ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{m.name}</h4>
                        <span className="text-[10px] font-mono text-gray-400">{m.slug}</span>
                      </div>
                    </div>

                    {m.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 uppercase">
                        {m.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">{m.description || 'Xüsusi sistem modulu'}</p>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleModule(m.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isActive ? 'Aktivdir' : 'Deaktivdir'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                      title="Redaktə et"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(m.id, m.name)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Tamamilə Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Module Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-700 to-brand-700 text-white flex items-center justify-between">
              <h3 className="text-base font-black">
                {editingModule ? 'Modulu Redaktə Et' : 'Yeni Super Admin Modulu Yarat'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleSaveModuleForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Modul Adı <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Kənd Təsərrüfatı Analitikası, Xüsusi Sifarişlər"
                  value={moduleForm.name}
                  onChange={e => setModuleForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">URL Path (Slug)</label>
                  <input
                    type="text"
                    required
                    placeholder="/admin/analytics"
                    value={moduleForm.slug}
                    onChange={e => setModuleForm(p => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kateqoriya</label>
                  <input
                    type="text"
                    placeholder="Məs: Marketinq, Əsas, Satış"
                    value={moduleForm.category}
                    onChange={e => setModuleForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Açıqlama</label>
                <textarea
                  rows={2}
                  placeholder="Bu modulun təyinatı..."
                  value={moduleForm.description}
                  onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nişan (Badge)</label>
                  <input
                    type="text"
                    placeholder="Məs: PRO, NEW, BETA"
                    value={moduleForm.badge}
                    onChange={e => setModuleForm(p => ({ ...p, badge: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={moduleForm.status}
                    onChange={e => setModuleForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 bg-white font-bold"
                  >
                    <option value="ACTIVE">AKTİV</option>
                    <option value="INACTIVE">DEAKTİV</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saxlanılır...' : 'Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
