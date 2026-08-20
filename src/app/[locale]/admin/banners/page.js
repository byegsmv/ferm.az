"use client";
import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── AdSlotEditor Component ───────────────────────────────────────────────────

function AdSlotEditor({ slotKey, slot, onSaved, toast }) {
  const [mode, setMode] = useState(slot.mode || "off");
  const [campaignType, setCampaignType] = useState(slot.campaignType || "HOMEPAGE_BANNER");
  const [externalCode, setExternalCode] = useState(slot.externalCode || "");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasCampaign = slot.hasLiveCampaign;

  // Reset local state when slot data changes (e.g. after reload)
  useEffect(() => {
    if (slot && slot.key) {
      setMode(slot.mode || "off");
      setCampaignType(slot.campaignType || "HOMEPAGE_BANNER");
      setExternalCode(slot.externalCode || "");
    }
  }, [slot.key, slot.mode, slot.campaignType, slot.externalCode]);

  async function save() {
    setSaving(true);
    try {
      const body = {
        mode,
        campaignType: mode === "internal" ? campaignType : null,
        externalCode: mode === "external" ? externalCode : null,
      };
      await apiFetch(`/api/ad-slots/${slotKey}`, { method: "PATCH", body: JSON.stringify(body) });
      toast("Reklam yeri yeniləndi", "success");
      setOpen(false);
      onSaved();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function modeBadge() {
    if (mode === "off") return <span className="badge badge-gray inline-flex items-center gap-1"><Icon name="closeCircle" size={12} />Deaktiv</span>;
    if (mode === "internal") {
      if (hasCampaign) return <span className="badge badge-green inline-flex items-center gap-1"><Icon name="checkCircle" size={12} />Aktiv kampaniya</span>;
      return <span className="badge badge-yellow inline-flex items-center gap-1"><Icon name="alert" size={12} />Kampaniya yoxdur</span>;
    }
    // external
    return <span className="badge badge-blue inline-flex items-center gap-1"><Icon name="checkCircle" size={12} />Xarici kod</span>;
  }

  function previewContent() {
    if (mode === "off") return <p className="text-sm text-gray-400 italic">Bu slot deaktivdir — heç nə göstərilmir.</p>;
    if (mode === "external" && externalCode) {
      return (
        <div className="w-full min-h-[120px] bg-gray-50 rounded-lg p-4 overflow-auto">
          <div dangerouslySetInnerHTML={{ __html: externalCode }} />
        </div>
      );
    }
    if (mode === "internal") {
      if (hasCampaign) {
        return (
          <div className="w-full min-h-[120px] bg-gradient-to-br from-brand-600 to-brand-800 rounded-lg p-6 text-white">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Reklam</span>
            <h3 className="mt-3 font-bold text-xl">{slot.liveCampaignTitle || "Kampaniya"}</h3>
            <p className="text-sm text-white/80 mt-1">Daxili kampaniya aktivdir</p>
          </div>
        );
      }
      return (
        <div className="w-full min-h-[120px] bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Icon name="alert" size={24} className="text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-yellow-700 font-medium">Aktiv kampaniya tapılmadı</p>
          <p className="text-xs text-yellow-600 mt-1">"{CAMPAIGN_TYPE_LABELS[campaignType] || campaignType}" tipində aktiv kampaniya yaradın.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header — click to expand */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">{AD_SLOT_LABELS[slotKey] || slotKey.replace(/_/g, " ")}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{slotKey}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          {modeBadge()}
          <button onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }} className="text-gray-400 hover:text-brand-600 transition-colors p-1" title="Önizləmə">
            <Icon name="eye" size={18} />
          </button>
          <Icon name="chevronDown" size={18} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-4">
          {/* Mode selector */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Rejim</label>
            <div className="flex gap-2">
              {[
                { value: "off", label: "Deaktiv", desc: "Heç nə göstərilmir" },
                { value: "internal", label: "Daxili Kampaniya", desc: "Sistem kampaniyasından banner" },
                { value: "external", label: "Xarici Kod", desc: "AdSense və s." },
              ].map(m => (
                <button key={m.value} onClick={() => setMode(m.value)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                    mode === m.value
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}>
                  <span className="block">{m.label}</span>
                  <span className={`block text-xs mt-0.5 ${mode === m.value ? "text-white/70" : "text-gray-400"}`}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Internal mode config */}
          {mode === "internal" && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Kampaniya Tipi</label>
              <select value={campaignType} onChange={e => setCampaignType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                {CAMPAIGN_TYPES.map(t => (
                  <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t] || t.replace(/_/g, " ")}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                Bu slotda göstərilməsi üçün <strong>Kampaniyalar</strong> bölməsində bu tipdə <strong>AKTİV</strong> bir kampaniya olmalıdır.
              </p>
              {hasCampaign && (
                <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <Icon name="checkCircle" size={14} /> Aktiv kampaniya tapıldı: {slot.liveCampaignTitle}
                </p>
              )}
            </div>
          )}

          {/* External mode config */}
          {mode === "external" && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Embed Kodu (HTML/JS)</label>
              <textarea
                value={externalCode}
                onChange={e => setExternalCode(e.target.value)}
                rows={6}
                placeholder='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle" ...></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-y"
              />
              <p className="text-xs text-gray-400 mt-1">
                Google AdSense, Ad Manager və ya digər şəbəkələrin HTML/JS kodunu bura yapışdırın.
              </p>
            </div>
          )}

          {/* Save button */}
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="check" size={16} />}
              {saving ? "Saxlanılır..." : "Yadda Saxla"}
            </button>
            <button onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              Bağla
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{AD_SLOT_LABELS[slotKey] || slotKey} — Önizləmə</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <Icon name="x" size={24} />
              </button>
            </div>
            <div className="p-5">
              {previewContent()}
            </div>
            <div className="px-5 pb-5 flex justify-end">
              <button onClick={() => setPreviewOpen(false)} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBannersPage() {
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();

  function load() {
    setLoading(true);
    apiFetch("/api/ad-slots?includeCode=1")
      .then(d => {
        const arr = d.slots || [];
        const obj = Array.isArray(arr) ? Object.fromEntries(arr.map(s => [s.key, s])) : arr;
        setSlots(obj);
      })
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // Summary stats
  const slotValues = Object.values(slots);
  const activeCount = slotValues.filter(s => s.mode !== "off").length;
  const internalCount = slotValues.filter(s => s.mode === "internal").length;
  const externalCount = slotValues.filter(s => s.mode === "external").length;
  const offCount = slotValues.filter(s => s.mode === "off").length;
  const liveCampaigns = slotValues.filter(s => s.hasLiveCampaign).length;

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Page header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Bannerlər / Reklam Yerləri</h1>
          <p className="text-gray-500 mt-1">Saytdakı bütün reklam yerlərini idarə edin: daxili kampaniya, xarici kod (AdSense) və ya deaktiv.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors" title="Yenilə">
          <Icon name="refresh" size={16} /> Yenilə
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{SLOT_KEYS.length}</p>
          <p className="text-xs text-gray-500 mt-1">Ümumi Slot</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">Aktiv</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{internalCount}</p>
          <p className="text-xs text-gray-500 mt-1">Daxili</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{externalCount}</p>
          <p className="text-xs text-gray-500 mt-1">Xarici</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{liveCampaigns}</p>
          <p className="text-xs text-gray-500 mt-1">Aktiv Kampaniya</p>
        </div>
      </div>

      {/* Slot editors */}
      {loading ? (
        <div className="space-y-3">
          {SLOT_KEYS.map(k => (
            <div key={k} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {SLOT_KEYS.map(key => (
            <AdSlotEditor
              key={key}
              slotKey={key}
              slot={slots[key] || { mode: "off" }}
              onSaved={load}
              toast={toast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
