"use client";

import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import ImageUploadField from "@/components/ui/ImageUploadField";
import {
  Plus, Edit3, Trash2, ArrowUp, ArrowDown, Image as ImageIcon,
  CheckCircle2, XCircle, Sparkles, Layout, Eye, Save
} from "lucide-react";

const SLOT_KEYS = [
  "HOMEPAGE_TOP",
  "SIDEBAR_LEFT",
  "SIDEBAR_RIGHT",
  "LIST_TOP",
  "INFEED_SPONSORED",
  "DETAIL_SIDEBAR",
  "FOOTER_STRIP",
];

const AD_SLOT_LABELS = {
  HOMEPAGE_TOP: "Ana Səhifə — Yuxarı Banner",
  LIST_TOP: "Elan Siyahısı — Yuxarı Banner",
  INFEED_SPONSORED: "Elan Axını — Sponsorlu Kart",
  DETAIL_SIDEBAR: "Məhsul Detalı — Yan Panel",
  FOOTER_STRIP: "Footer — Zolaq Banner",
  SIDEBAR_LEFT: "Ana Səhifə — Sol Yan Banner",
  SIDEBAR_RIGHT: "Ana Səhifə — Sağ Yan Banner",
};

const CAMPAIGN_TYPES = [
  "HOMEPAGE_BANNER",
  "CATEGORY_BANNER",
  "STORE_PROMOTION",
  "FLASH_SALE",
  "DAILY_DEAL",
  "SPONSORED_PRODUCT",
  "REGIONAL",
];

const CAMPAIGN_TYPE_LABELS = {
  HOMEPAGE_BANNER: "Ana Səhifə Banneri",
  CATEGORY_BANNER: "Kateqoriya Banneri",
  STORE_PROMOTION: "Mağaza Promosyonu",
  FLASH_SALE: "Flash Endirim",
  DAILY_DEAL: "Gündəlik Təklif",
  SPONSORED_PRODUCT: "Sponsorlu Məhsul",
  REGIONAL: "Regional",
};

export default function AdminBannersPage() {
  const [activeTab, setActiveTab] = useState("slides"); // 'slides' | 'adslots'
  const { toast, ToastContainer } = useToast();

  // Slides state
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [savingSlide, setSavingSlide] = useState(false);
  const [slideForm, setSlideForm] = useState({
    tag: "",
    title: "",
    subtitle: "",
    cta: "Bax",
    href: "/products",
    bg: "from-brand-800 via-brand-700 to-emerald-800",
    emoji: "🌾",
    imageUrl: "",
    isActive: true
  });

  // Ad Slots state
  const [slots, setSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Fetch Slides
  const fetchSlides = async () => {
    setLoadingSlides(true);
    try {
      const data = await apiFetch("/api/slides?all=1");
      setSlides(data.slides || []);
    } catch (err) {
      toast(err.message || "Slayderlər yüklənmədi", "error");
    } finally {
      setLoadingSlides(false);
    }
  };

  // Fetch Slots
  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const data = await apiFetch("/api/ad-slots?includeCode=1");
      const arr = data.slots || [];
      const obj = Array.isArray(arr) ? Object.fromEntries(arr.map(s => [s.key, s])) : arr;
      setSlots(obj);
    } catch (err) {
      toast(err.message || "Reklam yerləri yüklənmədi", "error");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlides();
    fetchSlots();
  }, []);

  const openCreateSlide = () => {
    setEditingSlide(null);
    setSlideForm({
      tag: "YENİ TƏKLİF",
      title: "",
      subtitle: "",
      cta: "Kataloqa Bax",
      href: "/products",
      bg: "from-brand-800 via-brand-700 to-emerald-800",
      emoji: "🌾",
      imageUrl: "",
      isActive: true
    });
    setShowSlideModal(true);
  };

  const openEditSlide = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      tag: slide.tag || "",
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      cta: slide.cta || "Bax",
      href: slide.href || "/products",
      bg: slide.bg || "from-brand-800 via-brand-700 to-emerald-800",
      emoji: slide.emoji || "🌾",
      imageUrl: slide.imageUrl || "",
      isActive: slide.isActive ?? true
    });
    setShowSlideModal(true);
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!slideForm.title.trim() || !slideForm.href.trim()) {
      toast("Başlıq və Link mütləq daxil edilməlidir", "error");
      return;
    }

    setSavingSlide(true);
    try {
      if (editingSlide) {
        await apiFetch(`/api/slides/${editingSlide.id}`, {
          method: "PATCH",
          body: JSON.stringify(slideForm)
        });
        toast("Slayder yeniləndi", "success");
      } else {
        await apiFetch("/api/slides", {
          method: "POST",
          body: JSON.stringify(slideForm)
        });
        toast("Yeni slayder yaradıldı", "success");
      }
      setShowSlideModal(false);
      fetchSlides();
    } catch (err) {
      toast(err.message || "Xəta baş verdi", "error");
    } finally {
      setSavingSlide(false);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (!window.confirm("Bu slayderi silmək istədiyinizdən əminsiniz?")) return;
    try {
      await apiFetch(`/api/slides/${id}`, { method: "DELETE" });
      toast("Slayder silindi", "success");
      fetchSlides();
    } catch (err) {
      toast(err.message || "Silinmədi", "error");
    }
  };

  const handleMoveSlide = async (index, direction) => {
    const newSlides = [...slides];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(targetIndex, 0, moved);
    setSlides(newSlides);

    // Save reorder
    const orderPayload = newSlides.map((s, idx) => ({ id: s.id, sortOrder: idx }));
    try {
      await apiFetch("/api/slides", {
        method: "PUT",
        body: JSON.stringify({ order: orderPayload })
      });
      toast("Sıralama yadda saxlanıldı", "success");
    } catch (err) {
      toast("Sıralama yenilənmədi", "error");
      fetchSlides();
    }
  };

  const handleSaveSlot = async (slotKey, slotData) => {
    try {
      await apiFetch(`/api/ad-slots/${slotKey}`, {
        method: "PATCH",
        body: JSON.stringify(slotData)
      });
      toast("Reklam yeri yeniləndi", "success");
      fetchSlots();
    } catch (err) {
      toast(err.message || "Yenilənmədi", "error");
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Slayder & Reklam Bannerləri</h1>
              <p className="text-xs text-gray-500">Ana səhifə slayderləri, promosyonlar və reklam yerlərinin idarəsi</p>
            </div>
          </div>
        </div>

        {activeTab === "slides" && (
          <button
            onClick={openCreateSlide}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Slayder Əlavə Et</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-200/60 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab("slides")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "slides" ? "bg-white text-brand-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Ana Səhifə Slayderləri ({slides.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("adslots")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "adslots" ? "bg-white text-brand-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Reklam Yerləri ({SLOT_KEYS.length})</span>
        </button>
      </div>

      {/* Tab 1: Slides Management */}
      {activeTab === "slides" && (
        <div className="space-y-4">
          {loadingSlides ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-400">
              Slayderlər yüklənir...
            </div>
          ) : slides.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">Heç bir slayder tapılmadı</h3>
              <p className="text-xs text-gray-400 mt-1">Ana səhifədə göstərmək üçün yeni slayder əlavə edin</p>
              <button
                onClick={openCreateSlide}
                className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md"
              >
                İlk Slayderi Yarat
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    slide.isActive ? "border-gray-200/80" : "border-gray-200 bg-gray-50/60 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col gap-1 text-gray-400">
                      <button
                        onClick={() => handleMoveSlide(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20"
                        title="Yuxarı"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(idx, 1)}
                        disabled={idx === slides.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20"
                        title="Aşağı"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview Badge / Thumbnail */}
                    <div className="w-20 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-800 flex items-center justify-center text-white shrink-0 overflow-hidden shadow-sm">
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{slide.emoji || "🌾"}</span>
                      )}
                    </div>

                    {/* Content info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {slide.tag && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-brand-100 text-brand-800 uppercase tracking-wide">
                            {slide.tag}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-gray-900 truncate">{slide.title}</h4>
                        {!slide.isActive && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
                            Deaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{slide.subtitle || "Açıqlama yoxdur"}</p>
                      <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
                        <span>Düymə: {slide.cta}</span>
                        <span>Link: {slide.href}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                    <button
                      onClick={() => openEditSlide(slide)}
                      className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                      title="Düzəliş et"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: AdSlots Management */}
      {activeTab === "adslots" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {SLOT_KEYS.map(key => {
              const slot = slots[key] || { mode: "off" };
              return (
                <div key={key} className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{AD_SLOT_LABELS[key] || key}</h4>
                      <p className="text-xs text-gray-400 font-mono">Slot key: {key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={slot.mode || "off"}
                        onChange={(e) => handleSaveSlot(key, { ...slot, mode: e.target.value })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white"
                      >
                        <option value="off">Deaktiv</option>
                        <option value="internal">Daxili Kampaniya</option>
                        <option value="external">Xarici Kod (AdSense)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Slide Modal */}
      {showSlideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-brand-700 to-emerald-700 text-white flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black tracking-tight">
                {editingSlide ? "Slayderi Redaktə Et" : "Yeni Slayder Əlavə Et"}
              </h3>
              <button onClick={() => setShowSlideModal(false)} className="text-white/80 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tag (Üst Etiket)</label>
                <input
                  type="text"
                  value={slideForm.tag}
                  onChange={(e) => setSlideForm(p => ({ ...p, tag: e.target.value }))}
                  placeholder="Məs: YENİ MÖVSÜM, XÜSUSİ TƏKLİF"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Əsas Başlıq <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slideForm.title}
                  onChange={(e) => setSlideForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Məs: Kənd Təsərrüfatı Məhsullarının Rəqəmsal Bazarı"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Alt Açıqlama Mətni</label>
                <textarea
                  rows={2}
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Məs: Toxum, gübrə, dərman və texnika bir ünvanda"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Düymə Mətni (CTA)</label>
                  <input
                    type="text"
                    value={slideForm.cta}
                    onChange={(e) => setSlideForm(p => ({ ...p, cta: e.target.value }))}
                    placeholder="Məs: Kataloqa Bax"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Keçid Linki (Href) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slideForm.href}
                    onChange={(e) => setSlideForm(p => ({ ...p, href: e.target.value }))}
                    placeholder="/products"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Image Upload with Direct File Upload & URL */}
              <ImageUploadField
                label="Slayder Şəkli / Banneri (İstəyə görə)"
                value={slideForm.imageUrl || ""}
                onChange={(val) => setSlideForm(p => ({ ...p, imageUrl: val }))}
                placeholder="https://example.com/banner.png"
              />

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slideForm.isActive}
                    onChange={(e) => setSlideForm(p => ({ ...p, isActive: e.target.checked }))}
                    className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                  <span className="font-bold text-gray-800">Slayder aktiv olsun</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSlideModal(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={savingSlide}
                  className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md hover:bg-brand-700 disabled:opacity-50"
                >
                  {savingSlide ? "Saxlanılır..." : "Yadda Saxla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
