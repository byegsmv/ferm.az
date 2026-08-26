"use client";
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

const TYPES = [
  { value: "HOMEPAGE_BANNER", label: "Ana Səhifə Banneri" },
  { value: "CATEGORY_BANNER", label: "Kateqoriya Banneri" },
  { value: "STORE_PROMOTION", label: "Mağaza Promosyonu" },
  { value: "FLASH_SALE", label: "Flash Endirim" },
  { value: "DAILY_DEAL", label: "Gündəlik Təklif" },
  { value: "SPONSORED_PRODUCT", label: "Sponsorlu Məhsul" },
  { value: "REGIONAL", label: "Regional" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Qaralama", color: "bg-gray-100 text-gray-700" },
  { value: "SCHEDULED", label: "Planlaşdırılıb", color: "bg-blue-100 text-blue-700" },
  { value: "ACTIVE", label: "Aktiv", color: "bg-green-100 text-green-700" },
  { value: "PAUSED", label: "Pauzadadır", color: "bg-amber-100 text-amber-700" },
  { value: "EXPIRED", label: "Müddəti Bitib", color: "bg-red-100 text-red-700" },
];

const emptyForm = () => ({
  title: "",
  type: "HOMEPAGE_BANNER",
  bannerUrl: "",
  targetUrl: "",
  storeId: "",
  categoryId: "",
  region: "",
  budget: "",
  costPerClick: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
});

export default function AdminCampaignsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    apiFetch("/api/campaigns?all=1")
      .then(d => setItems(d.campaigns || []))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch("/api/stores?all=1")
      .then(d => setStores(d.stores || []))
      .catch(() => {});
    apiFetch("/api/categories?all=true")
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    try {
      const body = {
        title: form.title,
        type: form.type,
        bannerUrl: form.bannerUrl || undefined,
        targetUrl: form.targetUrl || undefined,
        storeId: form.storeId || undefined,
        categoryId: form.categoryId || undefined,
        region: form.region || undefined,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        costPerClick: form.costPerClick ? parseFloat(form.costPerClick) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const d = await apiFetch("/api/campaigns", { method: "POST", body: JSON.stringify(body) });
      setItems(p => [d.campaign, ...p]);
      setShowForm(false);
      setForm(emptyForm());
      toast("Kampaniya əlavə edildi", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function updateCampaign(e) {
    e.preventDefault();
    if (!editingCampaign) return;
    try {
      const body = {};
      if (form.title) body.title = form.title;
      if (form.bannerUrl) body.bannerUrl = form.bannerUrl;
      if (form.targetUrl) body.targetUrl = form.targetUrl;
      if (form.storeId) body.storeId = form.storeId;
      if (form.categoryId) body.categoryId = form.categoryId;
      if (form.region) body.region = form.region;
      if (form.budget) body.budget = parseFloat(form.budget);
      if (form.costPerClick) body.costPerClick = parseFloat(form.costPerClick);
      if (form.startDate) body.startDate = new Date(form.startDate).toISOString();
      if (form.endDate) body.endDate = new Date(form.endDate).toISOString();
      if (form.status) body.status = form.status;
      if (form.type) body.type = form.type;

      const d = await apiFetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setItems(p => p.map(c => c.id === editingCampaign.id ? d.campaign : c));
      setShowEditModal(false);
      setEditingCampaign(null);
      setForm(emptyForm());
      toast("Kampaniya yeniləndi", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function deleteCampaign(id) {
    if (!confirm("Bu kampaniyanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
      setItems(p => p.filter(c => c.id !== id));
      toast("Kampaniya silindi", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  function openEdit(campaign) {
    setEditingCampaign(campaign);
    setForm({
      title: campaign.title || "",
      type: campaign.type || "HOMEPAGE_BANNER",
      bannerUrl: campaign.bannerUrl || "",
      targetUrl: campaign.targetUrl || "",
      storeId: campaign.storeId || "",
      categoryId: campaign.categoryId || "",
      region: campaign.region || "",
      budget: campaign.budget ? campaign.budget.toString() : "",
      costPerClick: campaign.costPerClick ? campaign.costPerClick.toString() : "",
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : "",
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : "",
      status: campaign.status || "DRAFT",
    });
    setShowEditModal(true);
  }

  function FormFields({ form, setForm, isEdit = false }) {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Başlıq *</label>
          <input
            required
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Kampaniyanın başlığı"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Növ *</label>
          <select
            value={form.type}
            onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            {TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Şəkil URL</label>
          <input
            value={form.bannerUrl}
            onChange={e => setForm(p => ({ ...p, bannerUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="https://example.com/banner.png"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hədəf URL</label>
          <input
            value={form.targetUrl}
            onChange={e => setForm(p => ({ ...p, targetUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="https://example.com/mahsul"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mağaza</label>
          <select
            value={form.storeId}
            onChange={e => setForm(p => ({ ...p, storeId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="">— Seçin —</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kateqoriya</label>
          <select
            value={form.categoryId}
            onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="">— Seçin —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
          <input
            value={form.region}
            onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Bakı, Gəncə, və s."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Büdcə (AZN)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.budget}
            onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="100.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bir Klikə Görə Xərc (AZN)</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={form.costPerClick}
            onChange={e => setForm(p => ({ ...p, costPerClick: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="0.05"
          />
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Başlama Tarixi</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bitmə Tarixi</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Kampaniyalar</h1>
          <p className="text-gray-500 mt-1">Sistemdəki bütün reklam və kampaniyaları idarə edin.</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setShowForm(!showForm); }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          {showForm ? "Ləğv Et" : "Yeni Kampaniya"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={create} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFields form={form} setForm={setForm} />
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700">
              Yarat
            </button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Kampaniyanı Redaktə Et</h2>
              <button onClick={() => { setShowEditModal(false); setEditingCampaign(null); setForm(emptyForm()); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <Icon name="x" size={24} />
              </button>
            </div>
            <form onSubmit={updateCampaign} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFields form={form} setForm={setForm} isEdit={true} />
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingCampaign(null); setForm(emptyForm()); }}
                  className="px-5 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Ləğv Et
                </button>
                <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
                  Yenilə
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kampaniya</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Növ</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Müddət</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Büdcə / CPC</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Yüklənir...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Heç bir kampaniya tapılmadı.</td></tr>
            ) : items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {c.bannerUrl ? (
                      <img src={c.bannerUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <Icon name="megaphone" size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.targetUrl || "Link yoxdur"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {TYPES.find(t => t.value === c.type)?.label || c.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : "Limitsiz"}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block border border-gray-100 rounded-full text-xs font-bold px-2 py-1 ${STATUS_OPTIONS.find(s => s.value === c.status)?.color || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_OPTIONS.find(s => s.value === c.status)?.label || c.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">
                    {c.budget ? `${c.budget} AZN` : "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.costPerClick ? `${c.costPerClick} AZN/klik` : ""}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Redaktə Et"
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Sil"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
