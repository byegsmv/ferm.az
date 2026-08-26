"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import {
  Globe, Share2, Phone, Mail, MapPin, Settings, ShoppingBag,
  FileText, ShieldCheck, Check, Save, RefreshCw, Coins, Rocket, CreditCard
} from "lucide-react";

const SECTION_ORDER = [
  { key: "social", label: "Sosial Şəbəkələr & Əlaqə", icon: <Share2 className="w-4 h-4 text-pink-500" /> },
  { key: "pricing", label: "Qiymətlər & Paketlər (Boost)", icon: <Coins className="w-4 h-4 text-amber-500" /> },
  { key: "payments", label: "Ödəniş Hesabları (Bank & M10)", icon: <CreditCard className="w-4 h-4 text-emerald-600" /> },
  { key: "general", label: "Ümumi Ayarlar", icon: <Settings className="w-4 h-4 text-blue-500" /> },
  { key: "commerce", label: "Ticarət & Bazarlıq", icon: <ShoppingBag className="w-4 h-4 text-emerald-500" /> },
  { key: "content", label: "Məzmun & Modullar", icon: <FileText className="w-4 h-4 text-purple-500" /> },
  { key: "access", label: "Təhlükəsizlik & İcazələr", icon: <ShieldCheck className="w-4 h-4 text-amber-500" /> },
];

const FIELD_DEFS = {
  social: [
    { key: "facebook", label: "Facebook Profil / Səhifə Linki", type: "text", placeholder: "https://facebook.com/..." },
    { key: "instagram", label: "Instagram Hesab Linki", type: "text", placeholder: "https://instagram.com/..." },
    { key: "whatsapp", label: "WhatsApp Nömrəsi / Linki", type: "text", placeholder: "+994 50 123 45 67 və ya https://wa.me/..." },
    { key: "tiktok", label: "TikTok Profil Linki", type: "text", placeholder: "https://tiktok.com/@..." },
    { key: "telegram", label: "Telegram Kanalı / Qrupu", type: "text", placeholder: "https://t.me/..." },
    { key: "youtube", label: "YouTube Kanalı", type: "text", placeholder: "https://youtube.com/@..." },
    { key: "phone", label: "Əlaqə Telefon Nömrəsi", type: "text", placeholder: "+994 10 521 09 09" },
    { key: "email", label: "Rəsmi Əlaqə E-maili", type: "text", placeholder: "info@fermermarket.az" },
    { key: "address", label: "Şirkət Ünvanı", type: "text", placeholder: "Bakı şəhəri, Azərbaycan" },
  ],
  pricing: [
    { key: "tier_1_day_price", label: "1 Günlük Elan Qiyməti (₼)", type: "number", placeholder: "0" },
    { key: "tier_1_day_active", label: "1 Günlük Elan Paketi Aktivdir", type: "toggle" },
    { key: "tier_15_days_price", label: "15 Günlük Elan Qiyməti (₼)", type: "number", placeholder: "7" },
    { key: "tier_15_days_active", label: "15 Günlük Elan Paketi Aktivdir", type: "toggle" },
    { key: "tier_30_days_price", label: "30 Günlük Elan Qiyməti (₼)", type: "number", placeholder: "15" },
    { key: "tier_30_days_active", label: "30 Günlük Elan Paketi Aktivdir", type: "toggle" },
    { key: "product_featured_price", label: "Önə Çıxan Elan (FEATURED) Qiyməti (₼)", type: "number", placeholder: "5" },
    { key: "product_featured_active", label: "Önə Çıxan Elan Xidməti Aktivdir", type: "toggle" },
    { key: "product_premium_price", label: "Premium Elan (PREMIUM) Qiyməti (₼)", type: "number", placeholder: "10" },
    { key: "product_premium_active", label: "Premium Elan Xidməti Aktivdir", type: "toggle" },
    { key: "product_vip_price", label: "VIP Vitrin & Baş Səhifə Qiyməti (₼)", type: "number", placeholder: "20" },
    { key: "product_vip_active", label: "VIP Vitrin Xidməti Aktivdir", type: "toggle" },
    { key: "product_banner_price", label: "Baş Səhifə Reklam Banneri Qiyməti (₼)", type: "number", placeholder: "30" },
    { key: "product_banner_active", label: "Reklam Banneri Xidməti Aktivdir", type: "toggle" },
    { key: "store_verified_vip_price", label: "VIP Təsdiqlənmiş Mağaza Qiyməti (₼)", type: "number", placeholder: "25" },
    { key: "store_verified_vip_active", label: "VIP Mağaza Xidməti Aktivdir", type: "toggle" },
    { key: "store_banner_ad_price", label: "Mağaza Banner Reklamı Qiyməti (₼)", type: "number", placeholder: "40" },
    { key: "store_banner_ad_active", label: "Mağaza Banner Reklamı Aktivdir", type: "toggle" },
  ],
  payments: [
    { key: "bankName", label: "Bank Adı", type: "text", placeholder: "ABB Bank / Kapital Bank" },
    { key: "bankCardNumber", label: "Bank Kart Nömrəsi (16 rəqəm)", type: "text", placeholder: "4169 7388 0000 0000" },
    { key: "bankCardHolder", label: "Kart Sahibi (Ad Soyad / Şirkət)", type: "text", placeholder: "Fermer Market MMC" },
    { key: "m10Number", label: "M10 Mobil Nömrəsi", type: "text", placeholder: "+994 10 521 09 09" },
    { key: "m10Holder", label: "M10 Qəbul Edən Şəxs / Mağaza", type: "text", placeholder: "Fermer Market" },
    { key: "paymentInstructions", label: "Ödəniş Təlimatı", type: "text", placeholder: "Ödəniş etdikdən sonra qəbzin şəklini yükləyin." },
    { key: "allowCardTransfer", label: "Bank Kartı ilə ödəniş aktivdir", type: "toggle" },
    { key: "allowM10", label: "M10 ilə ödəniş aktivdir", type: "toggle" },
    { key: "allowCash", label: "Qapıda Nağd ödəniş aktivdir", type: "toggle" },
    { key: "allowWallet", label: "Daxili Pul Kisəsi ilə ödəniş aktivdir", type: "toggle" },
  ],
  general: [
    { key: "siteName", label: "Sayt adı", type: "text" },
    { key: "tagline", label: "Açıqlama şüarı", type: "text" },
    { key: "currency", label: "Valyuta", type: "text" },
    { key: "locale", label: "Varsayılan Dil", type: "select", options: ["AZ", "EN", "RU"] },
    { key: "maintenanceMode", label: "Texniki Qulluq Rejimi (Maintenance)", type: "toggle" },
  ],
  commerce: [
    { key: "allowRegistration", label: "Qeydiyyat açıqdır", type: "toggle" },
    { key: "allowListings", label: "Elan yerləşdirməyə icazə", type: "toggle" },
    { key: "allowReviews", label: "Rəy yazmağa icazə", type: "toggle" },
    { key: "allowWallet", label: "Pul kisəsi aktivdir", type: "toggle" },
    { key: "allowCoupons", label: "Kupon sistemi aktivdir", type: "toggle" },
    { key: "allowBundles", label: "Bağlamalar aktivdir", type: "toggle" },
  ],
  content: [
    { key: "allowBlog", label: "Bloq aktivdir", type: "toggle" },
    { key: "allowPush", label: "Push bildirişləri aktivdir", type: "toggle" },
    { key: "allowCampaigns", label: "Kampaniyalar aktivdir", type: "toggle" },
    { key: "allowStores", label: "Mağaza moderasiyası aktivdir", type: "toggle" },
    { key: "showAnalytics", label: "Analitika göstərilsin", type: "toggle" },
  ],
  access: [
    { key: "enableAdminAudit", label: "Admin audit log", type: "toggle" },
    { key: "require2FA", label: "2FA tələb et", type: "toggle" },
  ],
};

export default function NoCodeAdminStudio() {
  const [config, setConfig] = useState(null);
  const [selectedSection, setSelectedSection] = useState("social");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/studio");
      setConfig(data.config || {});
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const data = await apiFetch("/api/admin/studio", {
        method: "POST",
        body: JSON.stringify(config)
      });
      setConfig(data.config || config);
      toast("Bütün tənzimləmələr və sosial linklər uğurla yadda saxlanıldı!", "success");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function updateField(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const summary = useMemo(() => {
    if (!config) return [];
    return [
      { label: "Sayt", value: config.siteName || "FermerMarket" },
      { label: "Facebook", value: config.facebook ? "Təyin edilib" : "Yoxdur" },
      { label: "Instagram", value: config.instagram ? "Təyin edilib" : "Yoxdur" },
      { label: "WhatsApp", value: config.whatsapp || "Təyin edilməyib" },
    ];
  }, [config]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
        <span className="text-sm font-bold">Tənzimləmələr yüklənir...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Sistem Tənzimləmələri & Sosial Media İdarəsi</h2>
          <p className="text-xs text-gray-500 mt-1">Sosial şəbəkə profilləri, əlaqə məlumatları və sistem qaydalarını birbaşa buradan dəyişin.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "Yadda saxlanılır..." : "Yadda Saxla"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary.map((item) => (
          <div key={item.label} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">{item.label}</p>
            <p className="mt-1 font-extrabold text-sm text-gray-900 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[240px,1fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-3 h-fit space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-2">Bölmələr</p>
          {SECTION_ORDER.map((section) => (
            <button
              key={section.key}
              onClick={() => setSelectedSection(section.key)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                selectedSection === section.key
                  ? "bg-brand-50 text-brand-700 shadow-xs"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {SECTION_ORDER.filter(s => s.key === selectedSection).map((section) => (
            <div key={section.key} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                {section.icon}
                <h3 className="font-extrabold text-sm text-gray-900">{section.label}</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {FIELD_DEFS[section.key].map((field) => {
                  const value = config?.[field.key];
                  return (
                    <div key={field.key} className="flex flex-col gap-1.5 rounded-2xl border border-gray-100 p-4 bg-gray-50/60">
                      <label className="text-xs font-bold text-gray-700">{field.label}</label>
                      {field.type === "toggle" ? (
                        <button
                          type="button"
                          onClick={() => updateField(field.key, !value)}
                          className={`inline-flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                            value ? "bg-emerald-500 text-white shadow-xs" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          <span>{value ? "Aktivdir" : "Deaktivdir"}</span>
                          {value ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="w-3 h-3 rounded-full border border-gray-400 inline-block" />}
                        </button>
                      ) : field.type === "select" ? (
                        <select
                          value={value || ""}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white outline-none focus:border-brand-500"
                        >
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || "text"}
                          value={value ?? ""}
                          placeholder={field.placeholder || ""}
                          onChange={(e) => updateField(field.key, field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white outline-none focus:border-brand-500 font-medium"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
