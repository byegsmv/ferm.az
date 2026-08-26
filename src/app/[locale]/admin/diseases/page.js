"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";

export default function DiseasesPage() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", nameAz: "", symptoms: "", causes: "", prevention: "", treatment: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/diseases");
      setDiseases(data.diseases || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/diseases", { method: "POST", body: JSON.stringify(form) });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (d) => {
    setForm({ ...d });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Silmək istədiyinizə əminsiniz?")) return;
    try {
      await apiFetch(`/api/diseases?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Yüklənir...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Xəstəliklər</h1>
        <button
          onClick={() => { setForm({ id: "", name: "", nameAz: "", symptoms: "", causes: "", prevention: "", treatment: "" }); setShowModal(true); }}
          className="bg-brand-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-brand-700"
        >
          <Icon name="plus" size={20} /> Yenisini əlavə et
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Adı (EN)</th>
              <th className="p-4 font-medium text-gray-500">Adı (AZ)</th>
              <th className="p-4 font-medium text-gray-500">Əlamətləri</th>
              <th className="p-4 font-medium text-gray-500">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {diseases.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="p-4">{d.name}</td>
                <td className="p-4 font-medium">{d.nameAz}</td>
                <td className="p-4 truncate max-w-[200px]">{d.symptoms}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(d)} className="text-blue-500 hover:text-blue-700 p-2"><Icon name="edit" size={18} /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 p-2"><Icon name="trash-2" size={18} /></button>
                </td>
              </tr>
            ))}
            {diseases.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">Xəstəlik tapılmadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{form.id ? "Düzəliş et" : "Yeni xəstəlik"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Adı (EN)</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Adı (AZ)</label>
                  <input type="text" value={form.nameAz} onChange={(e) => setForm({ ...form, nameAz: e.target.value })} className="w-full border p-2 rounded" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Əlamətləri</label>
                <textarea value={form.symptoms || ""} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="w-full border p-2 rounded" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Yaranma Səbəbləri</label>
                <textarea value={form.causes || ""} onChange={(e) => setForm({ ...form, causes: e.target.value })} className="w-full border p-2 rounded" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Qarşısının alınması</label>
                <textarea value={form.prevention || ""} onChange={(e) => setForm({ ...form, prevention: e.target.value })} className="w-full border p-2 rounded" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Mübarizə tədbirləri (Müalicə)</label>
                <textarea value={form.treatment || ""} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className="w-full border p-2 rounded" rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl hover:bg-gray-50">Ləğv et</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700">Yadda Saxla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
