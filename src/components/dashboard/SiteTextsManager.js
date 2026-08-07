"use client";

import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

const GROUPS = [
  { id: "all", label: "Hamısı", icon: "grid" },
  { id: "homepage", label: "Ana Səhifə", icon: "home" },
  { id: "navigation", label: "Navigasiya", icon: "menu" },
  { id: "footer", label: "Footer", icon: "fileText" },
  { id: "products", label: "Məhsullar", icon: "package" },
  { id: "blog", label: "Bloq", icon: "edit" },
  { id: "stores", label: "Mağazalar", icon: "store" },
  { id: "general", label: "Ümumi", icon: "settings" },
    { id: "admin", label: "Admin Panel", icon: "shield" },
];

export default function SiteTextsManager() {
  const { showToast, ToastContainer } = useToast();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState({ key: "", group: "general", label: "", valueAz: "", valueEn: "", valueRu: "" });
  const [edited, setEdited] = useState(new Set());

  // Store showToast in a ref so it's NEVER a useEffect dependency.
  // This completely eliminates any possibility of an infinite re-render loop
  // caused by showToast reference changing between renders.
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Only depends on [activeGroup] — never on showToast or any function.
  // This effect runs ONLY on mount and when activeGroup changes. Period.
  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    setLoading(true);

    const params = activeGroup !== "all" ? `?group=${encodeURIComponent(activeGroup)}` : "";

    apiFetch(`/api/admin/site-texts${params}`, { signal: controller.signal })
      .then((data) => {
        if (isCurrent) {
          setTexts(data.siteTexts || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent && err.name !== "AbortError" && err.name !== "CanceledError") {
          showToastRef.current("Mətnlər yüklənmədi", "error");
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup]);

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
      showToast("Dəyişiklik yoxdur", "info");
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
      showToast(`${updates.length} mətn saxlanıldı`, "success");
      setEdited(new Set());
    } catch {
      showToast("Saxlama xətası", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, key) => {
    if (!confirm(`"${key}" açarını silmək istədiyinizdən əminsiniz?`)) return;
    try {
      await apiFetch(`/api/admin/site-texts?key=${key}`, { method: "DELETE" });
      setTexts((prev) => prev.filter((t) => t.id !== id));
      showToast("Mətn silindi", "success");
    } catch {
      showToast("Silmə xətası", "error");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newText.key || !newText.valueAz) {
      showToast("Açar və AZ dəyəri tələb olunur", "error");
      return;
    }
    try {
      const data = await apiFetch("/api/admin/site-texts", {
        method: "POST",
        body: JSON.stringify(newText),
      });
      if (data.siteText) {
        setTexts((prev) => [...prev, data.siteText].sort((a, b) => a.group.localeCompare(b.group) || a.key.localeCompare(b.key)));
        showToast("Yeni mətn əlavə edildi", "success");
        setNewText({ key: "", group: "general", label: "", valueAz: "", valueEn: "", valueRu: "" });
        setShowAdd(false);
      }
    } catch (err) {
      showToast(err.message || "Əlavə xətası", "error");
    }
  };

  return (
    <div className="space-y-4">
      {ToastContainer}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Icon name="fileText" size={20} /> Məzmun İdarəsi
          </h2>
          <p className="text-sm text-gray-500">Saytdakı bütün yazıları buradan idarə edin</p>
        </div>
        <div className="flex gap-2">
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

      {/* Add New Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="font-bold text-sm">Yeni Mətn Əlavə Et</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Açar (key)</label>
              <input
                type="text"
                value={newText.key}
                onChange={(e) => setNewText({ ...newText, key: e.target.value })}
                placeholder="home.hero.title"
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Qrup</label>
              <select
                value={newText.group}
                onChange={(e) => setNewText({ ...newText, group: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
              >
                {GROUPS.filter((g) => g.id !== "all").map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Etiket (admin üçün)</label>
              <input
                type="text"
                value={newText.label}
                onChange={(e) => setNewText({ ...newText, label: e.target.value })}
                placeholder="Ana səhifə hero başlığı"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Azərbaycan dili *</label>
              <textarea
                value={newText.valueAz}
                onChange={(e) => setNewText({ ...newText, valueAz: e.target.value })}
                required
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">English (optional)</label>
              <input
                type="text"
                value={newText.valueEn}
                onChange={(e) => setNewText({ ...newText, valueEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Русский (optional)</label>
              <input
                type="text"
                value={newText.valueRu}
                onChange={(e) => setNewText({ ...newText, valueRu: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
              />
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeGroup === g.id
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Axtar..."
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm flex-1 min-w-[150px] outline-none focus:border-brand-500"
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
          <Icon name="fileText" size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Mətn tapılmadı</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-3 hover:border-gray-200 transition">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{t.key}</span>
                  {t.group && <span className="text-xs text-gray-400">{t.group}</span>}
                  {t.label && <span className="text-xs text-gray-400">— {t.label}</span>}
                </div>
                <button
                  onClick={() => handleDelete(t.id, t.key)}
                  className="text-red-400 hover:text-red-600 transition"
                >
                  <Icon name="trash2" size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">AZ</label>
                  <input
                    type="text"
                    value={t.valueAz || ""}
                    onChange={(e) => handleFieldChange(t.id, "valueAz", e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none ${
                      edited.has(t.id) ? "border-amber-300 bg-amber-50" : "border-gray-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">EN</label>
                  <input
                    type="text"
                    value={t.valueEn || ""}
                    onChange={(e) => handleFieldChange(t.id, "valueEn", e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none ${
                      edited.has(t.id) ? "border-amber-300 bg-amber-50" : "border-gray-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">RU</label>
                  <input
                    type="text"
                    value={t.valueRu || ""}
                    onChange={(e) => handleFieldChange(t.id, "valueRu", e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none ${
                      edited.has(t.id) ? "border-amber-300 bg-amber-50" : "border-gray-200"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
