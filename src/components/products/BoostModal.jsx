"use client";

import React, { useState, useEffect } from 'react';
import {
  Rocket, Crown, Sparkles, Image, Check, AlertCircle,
  ShieldCheck, Wallet, ArrowRight, X, Loader2, Smartphone, Copy
} from 'lucide-react';
import { apiFetch, getUser } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import { Link } from '@/i18n/routing';

export default function BoostModal({ isOpen, onClose, targetType = "PRODUCT", targetItem, onSuccess }) {
  const { toast, ToastContainer } = useToast();
  const [promotions, setPromotions] = useState({});
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [boosting, setBoosting] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState(null);
  const [copiedM10, setCopiedM10] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const user = getUser();

    Promise.all([
      apiFetch("/api/config/promotions").then(d => {
        if (d?.promotions) setPromotions(d.promotions);
      }).catch(() => {}),
      user ? apiFetch("/api/wallet").then(d => setWallet(d.wallet)).catch(() => {}) : Promise.resolve(),
      apiFetch("/api/config/payment-methods").then(d => setPaymentAccounts(d?.paymentAccounts || null)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const userBalance = Number(wallet?.balance || 0);

  // Filter relevant promotions for product or store
  const availablePromos = Object.values(promotions).filter(p => {
    if (p.active === false) return false;
    if (targetType === "PRODUCT") {
      return ["PRODUCT_BOOST", "PRODUCT_BANNER"].includes(p.type);
    }
    if (targetType === "STORE") {
      return ["STORE_BOOST", "STORE_BANNER"].includes(p.type);
    }
    return false;
  });

  const selectedPromo = promotions[selectedKey];
  const m10Number = paymentAccounts?.m10Number || "+994 10 223 89 89";
  const waPhone = (paymentAccounts?.m10Number || "+994 10 223 89 89").replace(/[^\d]/g, "");
  const m10WaMessage = selectedPromo
    ? encodeURIComponent(
        `Salam! "${targetItem?.titleAz || targetItem?.name || "Elan"}" üçün ${selectedPromo.days} günlük "${selectedPromo.name}" paketini seçdim (${selectedPromo.price} ₼). M10-dan ${m10Number} nömrəsinə ödəniş edib dekontu göndərirəm.`
      )
    : "";
  const m10WaLink = `https://wa.me/${waPhone}?text=${m10WaMessage}`;
  const copyM10 = () => {
    navigator.clipboard?.writeText(m10Number.replace(/\s+/g, "")).catch(() => {});
    setCopiedM10(true);
    setTimeout(() => setCopiedM10(false), 1600);
  };

  const handleBoost = async () => {
    if (!selectedKey) {
      toast("Zəhmət olmasa bir paket seçin", "error");
      return;
    }

    if (selectedPromo && selectedPromo.price > userBalance) {
      toast(`Balansınız kifayət etmir (${userBalance.toFixed(2)} ₼). M10 ilə ödəyib dekontu WhatsApp-dan göndərə bilərsiniz.`, "error");
      return;
    }

    setBoosting(true);
    try {
      const res = await apiFetch("/api/promotions/boost", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId: targetItem.id,
          promotionKey: selectedKey,
        }),
      });

      toast(res.message || "Xidmət uğurla aktivləşdirildi!", "success");
      if (onSuccess) onSuccess(res);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      toast(error.message || "Aktivləşdirilərkən xəta baş verdi", "error");
    } finally {
      setBoosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <ToastContainer />
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-brand-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {targetType === "PRODUCT" ? "Elanı Önə Çıxar & VIP Et" : "Mağazanı VIP & Vitrinə Çıxar"}
              </h3>
              <p className="text-xs text-white/80 line-clamp-1">{targetItem?.titleAz || targetItem?.name || "Məhsul"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl font-bold">✕</button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Wallet Balance Bar */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-gray-700">Cari Balansınız:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-gray-900">{userBalance.toFixed(2)} ₼</span>
              <Link
                href="/dashboard?tab=wallet"
                className="text-[10px] font-bold text-brand-600 hover:text-brand-700 underline"
              >
                Artır
              </Link>
            </div>
          </div>

          {/* Promotion Packages List */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
              <p>Paketlər yüklənir...</p>
            </div>
          ) : availablePromos.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              Aktiv paket tapılmadı
            </div>
          ) : (
            <div className="space-y-2.5">
              {availablePromos.map((promo) => {
                const isSelected = selectedKey === promo.id;
                const isVIP = promo.id.includes("vip");
                const isBanner = promo.id.includes("banner");

                return (
                  <div
                    key={promo.id}
                    onClick={() => setSelectedKey(promo.id)}
                    className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/40 shadow-xs ring-2 ring-brand-600/10"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isVIP
                          ? "bg-purple-100 text-purple-700"
                          : isBanner
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {isVIP ? <Crown className="w-5 h-5" /> : isBanner ? <Image className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-xs">{promo.name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">({promo.days} gün)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{promo.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-brand-700">{promo.price} ₼</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* M10 İLƏ ÖDƏ — dekontu WhatsApp-dan göndər */}
          {selectedPromo && (
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  M10 ilə Ödə
                </span>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  {selectedPromo.price} ₼
                </span>
              </div>

              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                1) M10 tətbiqində <strong>{m10Number}</strong> nömrəsinə{" "}
                <strong>{selectedPromo.price} ₼</strong> köçürün.{" "}
                2) Aşağıdakı düymə ilə ödəniş qəbzini (dekontu) WhatsApp-dan göndərin.{" "}
                3) Administrator qəbzi təsdiqləyən kimi paketiniz aktivləşəcək.
              </p>

              <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">M10 Nömrəsi</p>
                  <p className="text-sm font-mono font-black text-gray-900 tracking-wider">{m10Number}</p>
                </div>
                <button
                  type="button"
                  onClick={copyM10}
                  className="p-2 bg-gray-100 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors"
                >
                  {copiedM10 ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <a
                href={m10WaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1eb856] text-white text-xs font-bold transition-colors"
              >
                Dekontu WhatsApp-dan Göndər
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div>
            {selectedPromo && (
              <span className="text-xs text-gray-500">
                Yekun: <strong className="text-brand-700 text-sm font-black">{selectedPromo.price} ₼</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Bağla
            </button>

            <button
              type="button"
              disabled={boosting || !selectedKey}
              onClick={handleBoost}
              className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {boosting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Aktivləşdirilir...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  <span>İndi Aktivləşdir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
