'use client';

import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, Plus, Trash2, Edit3,
  Layers, Search, ArrowUp, ArrowDown,
  ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
  FolderTree, X, Check, AlertTriangle, ExternalLink
} from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {isActive ? 'Aktiv' : 'Deaktiv'}
    </span>
  );
}

// ── Child row inside expanded module ─────────────────────────
function ChildRow({ child, childIndex, totalChildren, onToggle, onRemove, onMove, onPromote }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-gray-400 text-xs">└</span>
        <span className="text-[13px] font-medium text-gray-700 truncate">{child.name}</span>
        <span className="text-[10px] font-mono text-gray-400 truncate hidden sm:block">{child.slug}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <StatusBadge status={child.status} />

        {/* ↑ ↓ Reorder within parent */}
        <button
          onClick={() => onMove(child.id, 'up')}
          disabled={childIndex === 0}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-20"
          title="Yuxarı"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onMove(child.id, 'down')}
          disabled={childIndex === totalChildren - 1}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-20"
          title="Aşağı"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        {/* Promote to top-level */}
        <button
          onClick={() => onPromote(child)}
          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
          title="Üst menüya çıxar"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* Toggle active */}
        <button
          onClick={() => onToggle(child.id)}
          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
          title={child.status === 'ACTIVE' ? 'Deaktiv et' : 'Aktiv et'}
        >
          {child.status === 'ACTIVE'
            ? <ToggleRight className="w-4 h-4 text-emerald-600" />
            : <ToggleLeft className="w-4 h-4" />}
        </button>

        {/* Remove */}
        <button
          onClick={() => onRemove(child.id)}
          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          title="Alt-modulu sil"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ModuleToggleSystem() {
  const { toast, ToastContainer } = useToast();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [modalTarget, setModalTarget] = useState(null); // null = top-level, parentId = child
  const [moduleForm, setModuleForm] = useState({
    id: '', name: '', slug: '/admin/', description: '',
    icon: 'Layers', category: 'GENERAL', status: 'ACTIVE', badge: ''
  });

  // ── Add child modal ──
  const [showChildModal, setShowChildModal] = useState(false);
  const [childTarget, setChildTarget] = useState(null); // parent module id
  const [childForm, setChildForm] = useState({ name: '', slug: '/admin/', icon: 'FolderTree' });

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/modules');
      if (data?.modules) setModules(data.modules);
    } catch (e) {
      toast('Modullar yüklənmədi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  const saveModules = async (updated, successMsg = 'Modul strukturu yeniləndi') => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/modules', {
        method: 'POST',
        body: JSON.stringify({ modules: updated, action: successMsg })
      });
      setModules(updated);
      toast(successMsg, 'success');
    } catch (e) {
      toast('Yadda saxlanılmadı', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle top-level module status ──
  const handleToggleModule = (modId) => {
    const updated = modules.map(m =>
      m.id === modId ? { ...m, status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : m
    );
    saveModules(updated, `Modul statusu dəyişdirildi`);
  };

  // ── Toggle child status ──
  const handleToggleChild = (parentId, childId) => {
    const updated = modules.map(m => {
      if (m.id !== parentId) return m;
      return {
        ...m,
        children: (m.children || []).map(c =>
          c.id === childId ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c
        )
      };
    });
    saveModules(updated, 'Alt-modul statusu dəyişdirildi');
  };

  // ── Remove child ──
  const handleRemoveChild = (parentId, childId) => {
    if (!window.confirm('Bu alt-modulu silmək istəyirsiniz?')) return;
    const updated = modules.map(m => {
      if (m.id !== parentId) return m;
      return { ...m, children: (m.children || []).filter(c => c.id !== childId) };
    });
    saveModules(updated, 'Alt-modul silindi');
  };

  // ── Move child up/down within parent ──
  const handleMoveChild = (parentId, childId, dir) => {
    const updated = modules.map(m => {
      if (m.id !== parentId) return m;
      const children = [...(m.children || [])];
      const idx = children.findIndex(c => c.id === childId);
      if (idx === -1) return m;
      const newIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= children.length) return m;
      [children[idx], children[newIdx]] = [children[newIdx], children[idx]];
      return { ...m, children };
    });
    saveModules(updated, 'Alt-modul sırası yeniləndi');
  };

  // ── Promote child to top-level module ──
  const handlePromoteChild = (parentId, child) => {
    if (!window.confirm(`"${child.name}" modulu üst menüya çıxarılsın?`)) return;
    // Remove from parent
    const withRemoved = modules.map(m => {
      if (m.id !== parentId) return m;
      return { ...m, children: (m.children || []).filter(c => c.id !== child.id) };
    });
    // Find parent index, insert after it as top-level
    const parentIdx = withRemoved.findIndex(m => m.id === parentId);
    const newTopLevel = {
      ...child,
      id: child.id.startsWith('sub-') ? child.id.replace('sub-', 'mod-') : `mod-${child.id}`,
      children: [],
      isSystem: false,
      category: 'GENERAL',
    };
    withRemoved.splice(parentIdx + 1, 0, newTopLevel);
    saveModules(withRemoved, `"${child.name}" üst menüya çıxarıldı`);
  };

  // ── Add child ──
  const handleAddChild = (e) => {
    e.preventDefault();
    if (!childForm.name.trim() || !childTarget) return;
    const newChild = {
      id: `sub-${Date.now()}`,
      name: childForm.name,
      slug: childForm.slug,
      icon: childForm.icon || 'FolderTree',
      status: 'ACTIVE'
    };
    const updated = modules.map(m => {
      if (m.id !== childTarget) return m;
      return { ...m, children: [...(m.children || []), newChild] };
    });
    saveModules(updated, `"${newChild.name}" alt-modulu əlavə edildi`);
    setShowChildModal(false);
    setChildForm({ name: '', slug: '/admin/', icon: 'FolderTree' });
  };

  // ── Move module up/down ──
  const handleMove = (modId, dir) => {
    const idx = modules.findIndex(m => m.id === modId);
    if (idx === -1) return;
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= modules.length) return;
    const updated = [...modules];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    saveModules(updated, 'Modul sırası yeniləndi');
  };

  // ── Delete top-level module ──
  const handleDelete = (modId, modName) => {
    if (!window.confirm(`"${modName}" modulunu tamamilə silmək istəyirsiniz?`)) return;
    saveModules(modules.filter(m => m.id !== modId), `"${modName}" silindi`);
  };

  // ── Save edit form ──
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!moduleForm.name.trim()) { toast('Modul adı tələb olunur', 'error'); return; }
    let updated;
    if (editingModule) {
      updated = modules.map(m => m.id === editingModule.id ? { ...m, ...moduleForm } : m);
    } else {
      updated = [...modules, { ...moduleForm, children: [] }];
    }
    saveModules(updated, editingModule ? `"${moduleForm.name}" yeniləndi` : `"${moduleForm.name}" əlavə edildi`);
    setShowModal(false);
  };

  const openCreate = () => {
    setEditingModule(null);
    setModuleForm({ id: `mod-${Date.now()}`, name: '', slug: '/admin/', description: '', icon: 'Layers', category: 'GENERAL', status: 'ACTIVE', badge: '' });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditingModule(m);
    setModuleForm({ id: m.id, name: m.name, slug: m.slug || '', description: m.description || '', icon: m.icon || 'Layers', category: m.category || 'GENERAL', status: m.status || 'ACTIVE', badge: m.badge || '' });
    setShowModal(true);
  };

  const filtered = modules.filter(m =>
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-gray-900">Modul İdarəetmə Mərkəzi</h1>
          <p className="text-xs text-gray-500 mt-0.5">Modulları yaradın, sıralayın, aktiv/deaktiv edin, alt-modulları idarə edin</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Yeni Modul
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Modul axtar..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400"
        />
      </div>

      {/* Modules list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          <p className="text-sm">Modullar yüklənir...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m, displayIdx) => {
            const realIdx = modules.findIndex(x => x.id === m.id);
            const isExpanded = expandedId === m.id;
            const hasChildren = m.children && m.children.length > 0;
            const isActive = m.status === 'ACTIVE';

            return (
              <div key={m.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isActive ? 'border-gray-200 shadow-sm' : 'border-dashed border-gray-200 opacity-60'
                }`}>

                {/* Module row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors shrink-0"
                  >
                    {hasChildren
                      ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
                      : <span className="w-4 h-4 block" />}
                  </button>

                  {/* Icon + info */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Layers className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{m.name}</span>
                      {m.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700">{m.badge}</span>
                      )}
                      {m.category && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">{m.category}</span>
                      )}
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">{m.slug}</p>
                    {hasChildren && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{m.children.length} alt-modul</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleMove(m.id, 'up')} disabled={realIdx === 0}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-20"
                      title="Yuxarı">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleMove(m.id, 'down')} disabled={realIdx === modules.length - 1}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-20"
                      title="Aşağı">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleToggleModule(m.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isActive
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={isActive ? 'Deaktiv et' : 'Aktiv et'}>
                      {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(m)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                      title="Redaktə">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(m.id, m.name)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Sil">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded children */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-3 pt-2">
                    <div className="space-y-0.5">
                      {(m.children || []).length === 0 && (
                        <p className="text-xs text-gray-400 py-2 px-3 italic">Alt-modul yoxdur</p>
                      )}
                      {(m.children || []).map((child, childIndex) => (
                        <ChildRow
                          key={child.id}
                          child={child}
                          childIndex={childIndex}
                          totalChildren={(m.children || []).length}
                          onToggle={(cid) => handleToggleChild(m.id, cid)}
                          onRemove={(cid) => handleRemoveChild(m.id, cid)}
                          onMove={(cid, dir) => handleMoveChild(m.id, cid, dir)}
                          onPromote={(c) => handlePromoteChild(m.id, c)}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => { setChildTarget(m.id); setShowChildModal(true); }}
                      className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-xl hover:bg-brand-50 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Alt-modul əlavə et
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Heç bir modul tapılmadı</p>
            </div>
          )}
        </div>
      )}

      {/* ── Edit / Create Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-brand-700 to-brand-500 text-white flex justify-between items-center">
              <h3 className="font-black text-base">{editingModule ? 'Modulu Redaktə Et' : 'Yeni Modul Yarat'}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Modul Adı *</label>
                <input required value={moduleForm.name} onChange={e => setModuleForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                  placeholder="Məs: Analitika, Kateqoriyalar" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL (Slug) *</label>
                  <input required value={moduleForm.slug} onChange={e => setModuleForm(p => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-mono"
                    placeholder="/admin/..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kateqoriya</label>
                  <input value={moduleForm.category} onChange={e => setModuleForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                    placeholder="GENERAL, CUSTOM..." />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Açıqlama</label>
                <textarea rows={2} value={moduleForm.description} onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 resize-none"
                  placeholder="Bu modulun təyinatı..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nişan (Badge)</label>
                  <input value={moduleForm.badge} onChange={e => setModuleForm(p => ({ ...p, badge: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                    placeholder="PRO, NEW, BETA" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select value={moduleForm.status} onChange={e => setModuleForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-brand-500">
                    <option value="ACTIVE">Aktiv</option>
                    <option value="INACTIVE">Deaktiv</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                  Ləğv et
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60">
                  {saving ? 'Saxlanılır...' : (editingModule ? 'Yenilə' : 'Yarat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Child Modal ── */}
      {showChildModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Alt-Modul Əlavə Et</h3>
              <button onClick={() => setShowChildModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddChild} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ad *</label>
                <input required value={childForm.name} onChange={e => setChildForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                  placeholder="Məs: Kateqoriyalar" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">URL (Slug) *</label>
                <input required value={childForm.slug} onChange={e => setChildForm(p => ({ ...p, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-mono"
                  placeholder="/admin/categories" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowChildModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">Ləğv</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl disabled:opacity-60">
                  Əlavə Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
