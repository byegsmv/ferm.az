"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

const GROUPS = [
  { id: "all", label: "Hamısı", icon: "grid", color: "bg-gray-500" },
  { id: "homepage", label: "Ana Səhifə", icon: "home", color: "bg-brand-500" },
  { id: "products", label: "Məhsullar", icon: "package", color: "bg-blue-500" },
  { id: "nav", label: "Naviqasiya", icon: "menu", color: "bg-purple-500" },
  { id: "header", label: "Header", icon: "layout", color: "bg-amber-500" },
  { id: "footer", label: "Footer", icon: "fileText", color: "bg-green-500" },
  { id: "admin", label: "Admin", icon: "shield", color: "bg-red-500" },
  { id: "role", label: "Rollar", icon: "user", color: "bg-teal-500" },
  { id: "city", label: "Şəhər", icon: "mapPin", color: "bg-orange-500" },
];

export default function ContentHub() {
  const { toast, ToastContainer } = useToast();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [edited, setEdited] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [editingInline, setEditingInline] = useState(null); // {id, field, value}

  const loadTexts = useCallback(async (group) => {
    setLoading(true);
    try {
      const params = group !== "all" ? `?group=${group}` : "";
      const data = await apiFetch(`/api/admin/site-texts${params}`);
      setTexts(data.siteTexts || []);
    } catch {
      toast("Mətnlər yüklənmədi", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTexts(activeGroup);
  }, [activeGroup, loadTexts]);

  const filtered = texts.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.key?.toLowerCase().includes(q) || t.label?.toLowerCase().includes(q) || t.valueAz?.toLowerCase().includes(q);
  });

  const handleFieldChange = (id, field, value) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
    setEdited((prev) => new Set(prev).add(id));
  };

  const handleSave = async () => {
    if (edited.size === 0) {
      toast("Dəyişiklik yoxdur", "info");
      return;
    }
    setSaving(true);
    try {
      const updates = texts.filter((t) => edited.has(t.id)).map((t) => ({
        id: t.id,
        valueAz: t.valueAz,
        valueEn: t.valueEn || null,
        valueRu: t.valueRu || null,
      }));
      await apiFetch("/api/admin/site-texts", {
        method: "PUT",
        body: JSON.stringify({ texts: updates }),
      });
      toast(`${updates.length} mətn saxlanıldı`, "success");
      setEdited(new Set());
    } catch {
      toast("Saxlama xətası", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, key) => {
    if (!confirm(`"${key}" açarını silmək istədiyinizdən əminsiniz?`)) return;
    try {
      await apiFetch(`/api/admin/site-texts?key=${key}`, { method: "DELETE" });
      setTexts((prev) => prev.filter((t) => t.id !== id));
      toast("Mətn silindi", "success");
    } catch {
      toast("Silmə xətası", "error");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const key = form.key.value.trim();
    const label = form.label.value.trim();
    const group = form.group.value;
    const valueAz = form.valueAz.value.trim();
    if (!key || !valueAz) {
      toast("Açar və AZ dəyəri tələb olunur", "error");
      return;
    }
    try {
      const data = await apiFetch("/api/admin/site-texts", {
        method: "POST",
        body: JSON.stringify({ key, label: label || key, group, valueAz, valueEn: form.valueEn?.value || null, valueRu: form.valueRu?.value || null }),
      });
      if (data.siteText) {
        setTexts((prev) => [...prev, data.siteText].sort((a, b) => a.key.localeCompare(b.key)));
        toast("Yeni mətn əlavə edildi", "success");
        setShowAdd(false);
      }
    } catch (err) {
      toast(err.message || "Əlavə xətası", "error");
    }
  };

  const groupCounts = {};
  for (const t of texts) {
    groupCounts[t.group] = (groupCounts[t.group] || 0) + 1;
  }
  const totalCount = texts.length;

  return (
    <div className="space-y-4">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Icon name="fileText" size={20} /> Məzmun İdarəsi
          </h2>
          <p className="text-sm text-gray-500">{totalCount} açar tapıldı</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="btn-icon"
            title={viewMode === "grid" ? "Cədvəl görünüşü" : "Kart görünüşü"}
          >
            <Icon name={viewMode === "grid" ? "list" : "grid"} size={18} />
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-brand-50 text-brand-700 text-sm font-bold rounded-xl hover:bg-brand-100 transition flex items-center gap-1.5"
          >
            <Icon name="plus" size={16} /> Yeni
          </button>
          <button
            onClick={handleSave}
            disabled={saving || edited.size === 0}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition flex items-center gap-1.5"
          >
            <Icon name="save" size={16} /> {saving ? "Saxlanılır..." : `Saxla${edited.size > 0 ? ` (${edited.size})` : ""}`}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="font-bold text-sm">Yeni Mətn Əlavə Et</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Açar (key) *</label>
              <input name="key" type="text" placeholder="products.myNewKey" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Qrup</label>
              <select name="group" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none">
                {GROUPS.filter((g) => g.id !== "all").map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Etiket (admin üçün)</label>
              <input name="label" type="text" placeholder="Yeni mətn başlığı" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Azərbaycan dili *</label>
              <textarea name="valueAz" required rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">English (optional)</label>
              <input name="valueEn" type="text" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Русский (optional)</label>
              <input name="valueRu" type="text" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition">Əlavə Et</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition">Ləğv Et</button>
            </div>
          </form>
        </div>
      )}

      {/* Group Filter + Search */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeGroup === g.id
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${g.color}`} />
              {g.label}
              {groupCounts[g.id] && <span className="text-[10px] opacity-70">({groupCounts[g.id]})</span>}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Açar, etiket və ya dəyər axtar..."
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm flex-1 min-w-[200px] outline-none focus:border-brand-500"
        />
      </div>

      {/* Texts List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Icon name="search" size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Heç bir mətn tapılmadı</p>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Açar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qrup</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">AZ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">EN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">RU</th>
                <th className="w-16 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <tr key={t.id} className={`hover:bg-gray-50 ${edited.has(t.id) ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-4 py-2">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t.key}</code>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-xs text-gray-500">{t.group}</span>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={t.valueAz || ""}
                      onChange={(e) => handleFieldChange(t.id, "valueAz", e.target.value)}
                      className={`w-full px-2 py-1 rounded border text-sm outline-none ${edited.has(t.id) ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}
                    />
                  </td>
                  <td className="px-4 py-2 hidden lg:table-cell">
                    <input type="text" value={t.valueEn || ""} onChange={(e) => handleFieldChange(t.id, "valueEn", e.target.value)} className="w-full px-2 py-1 rounded border text-sm outline-none border-gray-200" />
                  </td>
                  <td className="px-4 py-2 hidden lg:table-cell">
                    <input type="text" value={t.valueRu || ""} onChange={(e) => handleFieldChange(t.id, "valueRu", e.target.value)} className="w-full px-2 py-1 rounded border text-sm outline-none border-gray-200" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => handleDelete(t.id, t.key)} className="text-red-400 hover:text-red-600 transition" title="Sil">
                      <Icon name="trash2" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid/Card View */
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className={`bg-white rounded-2xl border border-gray-100 p-3 hover:border-gray-200 transition ${edited.has(t.id) ? 'border-amber-300 bg-amber-50/30' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{t.key}</span>
                  {t.group && <span className="text-xs text-gray-400">[{t.group}]</span>}
                  {t.label && t.label !== t.key.split('.').slice(1).join('.') && <span className="text-xs text-gray-500">{t.label}</span>}
                </div>
                <button
                  onClick={() => handleDelete(t.id, t.key)}
                  className="text-red-400 hover:text-red-600 transition"
                  title="Sil"
                >
                  <Icon name="trash2" size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> AZ</label>
                  <input
                    type="text"
                    value={t.valueAz || ""}
                    onChange={(e) => handleFieldChange(t.id, "valueAz", e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none ${edited.has(t.id) ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> EN</label>
                  <input type="text" value={t.valueEn || ""} onChange={(e) => handleFieldChange(t.id, "valueEn", e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none ${edited.has(t.id) ? "border-amber-300 bg-amber-50" : "border-gray-200"}`} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> RU</label>
                  <input type="text" value={t.valueRu || ""} onChange={(e) => handleFieldChange(t.id, "valueRu", e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none ${edited.has(t.id) ? "border-amber-300 bg-amber-50" : "border-gray-200"}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
