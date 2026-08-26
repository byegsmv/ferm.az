"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";

export default function TranslationsPage() {
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    entityType: "category",
    entityId: "",
    field: "name",
    locale: "EN",
    value: "",
  });

  useEffect(() => {
    fetchTranslations();
  }, []);

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/translations");
      setTranslations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/translations", { method: "POST", body: JSON.stringify(form) });
      fetchTranslations();
      setForm({ ...form, value: "" }); // reset value
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Silmək istədiyinizə əminsiniz?")) return;
    try {
      await apiFetch(`/api/admin/translations?id=${id}`, { method: "DELETE" });
      fetchTranslations();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Yüklənir...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tərcümələr İdarə Paneli</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Yeni Tərcümə Əlavə Et</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Növ</label>
            <select
              value={form.entityType}
              onChange={(e) => setForm({ ...form, entityType: e.target.value })}
              className="w-full border p-2 rounded"
              required
            >
              <option value="category">Kateqoriya</option>
              <option value="product">Məhsul</option>
              <option value="disease">Xəstəlik</option>
              <option value="pest">Zərərverici</option>
              <option value="crop">Bitki</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Obyekt ID (Entity ID)</label>
            <input
              type="text"
              value={form.entityId}
              onChange={(e) => setForm({ ...form, entityId: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Sahə (Field)</label>
            <input
              type="text"
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              className="w-full border p-2 rounded"
              placeholder="e.g. name, description"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Dil</label>
            <select
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value })}
              className="w-full border p-2 rounded"
              required
            >
              <option value="EN">İngilis (EN)</option>
              <option value="RU">Rus (RU)</option>
              <option value="AZ">Azərbaycan (AZ)</option>
            </select>
          </div>
          <div className="md:col-span-5">
            <label className="block text-sm text-gray-500 mb-1">Tərcümə edilmiş mətn</label>
            <textarea
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="w-full border p-2 rounded"
              rows={3}
              required
            />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-xl font-medium">
              Yadda Saxla
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Obyekt Növü</th>
              <th className="p-4 font-medium text-gray-500">ID</th>
              <th className="p-4 font-medium text-gray-500">Sahə</th>
              <th className="p-4 font-medium text-gray-500">Dil</th>
              <th className="p-4 font-medium text-gray-500">Mətn</th>
              <th className="p-4 font-medium text-gray-500">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {translations.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-4">{t.entityType}</td>
                <td className="p-4 text-xs font-mono">{t.entityId}</td>
                <td className="p-4">{t.field}</td>
                <td className="p-4 font-bold">{t.locale}</td>
                <td className="p-4 max-w-xs truncate">{t.value}</td>
                <td className="p-4">
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">
                    <Icon name="trash-2" size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {translations.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">Heç bir tərcümə tapılmadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
