"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

const DAYS_LIST = [
  { key: "mon", label: "Bazar ertəsi" },
  { key: "tue", label: "Çərşənbə axşamı" },
  { key: "wed", label: "Çərşənbə" },
  { key: "thu", label: "Cümə axşamı" },
  { key: "fri", label: "Cümə" },
  { key: "sat", label: "Şənbə" },
  { key: "sun", label: "Bazar" },
];

const AZ_REGIONS = [
  "Bütün Azərbaycan",
  "Bakı",
  "Sumqayıt",
  "Gəncə",
  "Naxçıvan",
  "Lənkəran",
  "Şəki",
  "Quba",
  "Bərdə",
  "Şamaxı",
  "Yevlax",
  "Mingəçevir",
];

export default function StoreSettings({ store, onSave, loading = false }) {
  // Accordion state
  const [openSections, setOpenSections] = useState({
    general: true,
    contact: false,
    social: false,
    hours: false,
    delivery: false,
    finance: false,
  });

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    supportEmail: "",
    supportPhone: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    address: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
    youtube: "",
    telegram: "",
    workingHours: DAYS_LIST.reduce((acc, day) => {
      acc[day.key] = { open: "09:00", close: "18:00", isClosed: false };
      return acc;
    }, {}),
    deliveryRegions: [],
    bankName: "",
    bankAccount: "",
    iban: "",
    taxInfo: "",
  });

  useEffect(() => {
    if (store) {
      let parsedHours = {};
      if (typeof store.workingHours === "object" && store.workingHours !== null) {
        parsedHours = store.workingHours;
      } else if (typeof store.workingHours === "string") {
        try {
          parsedHours = JSON.parse(store.workingHours);
        } catch {
          parsedHours = {};
        }
      }

      let parsedRegions = [];
      if (Array.isArray(store.deliveryRegions)) {
        parsedRegions = store.deliveryRegions;
      } else if (typeof store.deliveryRegions === "string") {
        try {
          parsedRegions = JSON.parse(store.deliveryRegions);
        } catch {
          parsedRegions = store.deliveryRegions.split(",").map((s) => s.trim());
        }
      }

      setFormData({
        name: store.name || "",
        slug: store.slug || "",
        description: store.description || "",
        supportEmail: store.supportEmail || "",
        supportPhone: store.supportPhone || "",
        phone: store.phone || "",
        whatsapp: store.whatsapp || "",
        email: store.email || "",
        website: store.website || "",
        address: store.address || "",
        facebook: store.facebook || "",
        instagram: store.instagram || "",
        tiktok: store.tiktok || "",
        linkedin: store.linkedin || "",
        youtube: store.youtube || "",
        telegram: store.telegram || "",
        workingHours: {
          ...DAYS_LIST.reduce((acc, day) => {
            acc[day.key] = { open: "09:00", close: "18:00", isClosed: false };
            return acc;
          }, {}),
          ...parsedHours,
        },
        deliveryRegions: parsedRegions,
        bankName: store.bankName || "",
        bankAccount: store.bankAccount || "",
        iban: store.iban || "",
        taxInfo: store.taxInfo || "",
      });
    }
  }, [store]);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleHoursChange(dayKey, subKey, val) {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [dayKey]: {
          ...prev.workingHours[dayKey],
          [subKey]: val,
        },
      },
    }));
  }

  function toggleRegion(region) {
    setFormData((prev) => {
      const exists = prev.deliveryRegions.includes(region);
      if (exists) {
        return {
          ...prev,
          deliveryRegions: prev.deliveryRegions.filter((r) => r !== region),
        };
      } else {
        return {
          ...prev,
          deliveryRegions: [...prev.deliveryRegions, region],
        };
      }
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (onSave) onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">Mağaza Tənzimləmələri</h2>
          <p className="text-xs text-gray-500">
            Mağazanızın məlumatlarını, əlaqə və maliyyə rekvizitlərini idarə edin.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="save" size={16} />
          )}
          <span>Saxla</span>
        </button>
      </div>

      {/* 1. ÜMUMİ SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("general")}
          className="w-full p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="store" size={18} className="text-brand-600" />
            <span className="font-extrabold text-sm text-gray-900">
              1. Ümumi Məlumatlar
            </span>
          </div>
          <Icon
            name={openSections.general ? "chevronUp" : "chevronDown"}
            size={18}
            className="text-gray-400"
          />
        </button>

        {openSections.general && (
          <div className="p-4 md:p-6 space-y-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Mağaza Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Məsələn: Quba Alması Mağazası"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Slug (URL Keçid)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="quba-almasi-store"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Mağaza Təsviri (Haqqında)
                </label>
                <span className="text-[10px] text-gray-400 font-semibold">
                  {formData.description.length}/500
                </span>
              </div>
              <textarea
                maxLength={500}
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Mağazanız, təqdim etdiyiniz məhsullar və üstünlükləriniz haqqında qısa məlumat..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Dəstək E-poçtu
                </label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  placeholder="support@magaza.az"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Dəstək Telefonu
                </label>
                <input
                  type="text"
                  value={formData.supportPhone}
                  onChange={(e) => handleChange("supportPhone", e.target.value)}
                  placeholder="+994 50 123 45 67"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. ƏLAQƏ SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("contact")}
          className="w-full p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="phone" size={18} className="text-blue-600" />
            <span className="font-extrabold text-sm text-gray-900">
              2. Əlaqə Məlumatları
            </span>
          </div>
          <Icon
            name={openSections.contact ? "chevronUp" : "chevronDown"}
            size={18}
            className="text-gray-400"
          />
        </button>

        {openSections.contact && (
          <div className="p-4 md:p-6 space-y-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+994 50 000 00 00"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  WhatsApp Nömrəsi
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  placeholder="+994 50 000 00 00"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  E-poçt
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="info@magaza.az"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Veb Sayt
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://magaza.az"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Fiziki Ünvan
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Bakı ş., Nərimanov r., Atatürk pr. 45"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. SOSİAL SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("social")}
          className="w-full p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="share" size={18} className="text-purple-600" />
            <span className="font-extrabold text-sm text-gray-900">
              3. Sosial Şəbəkələr
            </span>
          </div>
          <Icon
            name={openSections.social ? "chevronUp" : "chevronDown"}
            size={18}
            className="text-gray-400"
          />
        </button>

        {openSections.social && (
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Facebook
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => handleChange("facebook", e.target.value)}
                placeholder="https://facebook.com/magazam"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                placeholder="https://instagram.com/magazam"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                TikTok
              </label>
              <input
                type="text"
                value={formData.tiktok}
                onChange={(e) => handleChange("tiktok", e.target.value)}
                placeholder="https://tiktok.com/@magazam"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                LinkedIn
              </label>
              <input
                type="text"
                value={formData.linkedin}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/magazam"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                YouTube
              </label>
              <input
                type="text"
                value={formData.youtube}
                onChange={(e) => handleChange("youtube", e.target.value)}
                placeholder="https://youtube.com/@magazam"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Telegram
              </label>
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => handleChange("telegram", e.target.value)}
                placeholder="https://t.me/magazam"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. İŞ SAATLARI SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("hours")}
          className="w-full p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="clock" size={18} className="text-amber-600" />
            <span className="font-extrabold text-sm text-gray-900">
              4. İş Saatları
            </span>
          </div>
          <Icon
            name={openSections.hours ? "chevronUp" : "chevronDown"}
            size={18}
            className="text-gray-400"
          />
        </button>

        {openSections.hours && (
          <div className="p-4 md:p-6 space-y-3 border-t border-gray-100">
            {DAYS_LIST.map((day) => {
              const dayState = formData.workingHours[day.key] || {
                open: "09:00",
                close: "18:00",
                isClosed: false,
              };

              return (
                <div
                  key={day.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <span className="text-xs font-bold text-gray-800 w-32">
                    {day.label}
                  </span>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        disabled={dayState.isClosed}
                        value={dayState.open}
                        onChange={(e) =>
                          handleHoursChange(day.key, "open", e.target.value)
                        }
                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs disabled:opacity-50"
                      />
                      <span className="text-xs text-gray-400">-</span>
                      <input
                        type="time"
                        disabled={dayState.isClosed}
                        value={dayState.close}
                        onChange={(e) =>
                          handleHoursChange(day.key, "close", e.target.value)
                        }
                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs disabled:opacity-50"
                      />
                    </div>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-2">
                      <input
                        type="checkbox"
                        checked={dayState.isClosed}
                        onChange={(e) =>
                          handleHoursChange(day.key, "isClosed", e.target.checked)
                        }
                        className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                      />
                      <span className="text-xs font-semibold text-gray-600">
                        Qapalıdır
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ÇATDIRILMA BÖLGƏLƏRİ SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("delivery")}
          className="w-full p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="truck" size={18} className="text-emerald-600" />
            <span className="font-extrabold text-sm text-gray-900">
              5. Çatdırılma Bölgələri
            </span>
          </div>
          <Icon
            name={openSections.delivery ? "chevronUp" : "chevronDown"}
            size={18}
            className="text-gray-400"
          />
        </button>

        {openSections.delivery && (
          <div className="p-4 md:p-6 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-500">
              Mağazanınızın xidmət göstərdiyi və çatdırılma etdiyi regionları seçin:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {AZ_REGIONS.map((region) => {
                const isSelected = formData.deliveryRegions.includes(region);
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleRegion(region)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-brand-600 text-white shadow-md scale-105"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {isSelected && <Icon name="check" size={14} />}
                    <span>{region}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. MALİYYƏ REKVİZİTLƏRİ SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("finance")}
          className="w-full p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="creditCard" size={18} className="text-indigo-600" />
            <span className="font-extrabold text-sm text-gray-900">
              6. Maliyyə & Bank Rekvizitləri
            </span>
          </div>
          <Icon
            name={openSections.finance ? "chevronUp" : "chevronDown"}
            size={18}
            className="text-gray-400"
          />
        </button>

        {openSections.finance && (
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Bank Adı
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="ABB, Kapital Bank, PASHA Bank və s."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Bank Hesab Nömrəsi
              </label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => handleChange("bankAccount", e.target.value)}
                placeholder="201010000000000000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                IBAN
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => handleChange("iban", e.target.value)}
                placeholder="AZ00000000000000000000000000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                VÖEN / Vergi ID
              </label>
              <input
                type="text"
                value={formData.taxInfo}
                onChange={(e) => handleChange("taxInfo", e.target.value)}
                placeholder="1234567891"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="save" size={18} />
          )}
          <span>Saxla</span>
        </button>
      </div>
    </form>
  );
}
