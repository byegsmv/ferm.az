"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { getCart, cartTotal, clearCart } from "@/lib/cartClient";
import { apiFetch, getUser } from "@/lib/apiClient";
import ImageUploadField from "@/components/ui/ImageUploadField";
import {
  CreditCard, Smartphone, Wallet as WalletIcon, Banknote,
  CheckCircle, Copy, Check, AlertCircle, Upload, ShieldCheck, Loader2
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [paymentAccounts, setPaymentAccounts] = useState(null);
  
  const [form, setForm] = useState({
    shippingAddress: "",
    shippingRegion: "",
    shippingCity: "",
    couponCode: "",
    deliveryMethod: "STANDARD",
    paymentMethod: "BANK_CARD", // BANK_CARD, M10, WALLET, CASH_ON_DELIVERY
    receiptUrl: "",
    transactionNote: "",
  });

  const [copiedField, setCopiedField] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Coupon state
  const [couponResult, setCouponResult] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    setItems(getCart());

    // Fetch user wallet
    apiFetch("/api/wallet")
      .then((d) => setWallet(d.wallet))
      .catch(() => {});

    // Fetch platform payment accounts
    apiFetch("/api/config/payment-methods")
      .then((d) => {
        if (d?.paymentAccounts) setPaymentAccounts(d.paymentAccounts);
      })
      .catch(() => {});
  }, [router]);

  async function handleValidateCoupon() {
    if (!form.couponCode.trim()) {
      setCouponResult(null);
      return;
    }
    setValidating(true);
    setCouponResult(null);
    try {
      const data = await apiFetch("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: form.couponCode.trim(), orderSubtotal: cartTotal(items) }),
      });
      setCouponResult(data);
    } catch (e) {
      setCouponResult({ valid: false, reason: e.message });
    } finally {
      setValidating(false);
    }
  }

  function getDeliveryCost() {
    return form.deliveryMethod === "EXPRESS" ? 10 : form.deliveryMethod === "STANDARD" ? 5 : 0;
  }

  function getDiscount() {
    return couponResult && couponResult.valid ? couponResult.discount : 0;
  }

  const subtotal = cartTotal(items);
  const deliveryCost = getDeliveryCost();
  const discount = getDiscount();
  const total = subtotal - discount + deliveryCost;

  const copyToClipboard = (text, fieldName) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validate receipt for bank card / M10 transfer
    if (["BANK_CARD", "M10"].includes(form.paymentMethod) && !form.receiptUrl && !form.transactionNote) {
      setError("Zəhmət olmasa ödəniş etdikdən sonra qəbzin şəklini yükləyin və ya ödəniş qeydini yazın.");
      return;
    }

    if (form.paymentMethod === "WALLET" && Number(wallet?.balance || 0) < total) {
      setError(`Daxili balansınız kifayət etmir (${Number(wallet?.balance || 0).toFixed(2)} AZN). Zəhmət olmasa başqa ödəniş üsulu seçin və ya balansınızı artırın.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ...(couponResult && couponResult.valid ? { couponCode: form.couponCode.trim() } : {}),
        shippingAddress: form.shippingAddress,
        shippingRegion: form.shippingRegion,
        shippingCity: form.shippingCity,
        deliveryMethod: form.deliveryMethod,
        paymentMethod: form.paymentMethod,
        receiptUrl: form.receiptUrl || undefined,
        transactionNote: form.transactionNote || undefined,
      };

      const data = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });

      const earnedCoin = (subtotal * 0.02).toFixed(2);
      if (typeof window !== "undefined") {
        const current = parseFloat(localStorage.getItem("fermerCoin") || "0");
        localStorage.setItem("fermerCoin", (current + parseFloat(earnedCoin)).toFixed(2));
      }

      clearCart();
      setSuccess({ ...data.order, earnedCoin, paymentMethod: form.paymentMethod });
    } catch (err) {
      setError(err.message || "Sifariş göndərilərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Sifarişiniz Uğurla Qəbul Edildi!</h1>
        <p className="text-gray-500 mt-2 text-sm">Sifariş nömrəniz: <strong className="text-gray-900 font-mono">#{success.id?.slice(-8).toUpperCase()}</strong></p>
        <p className="text-brand-700 font-black text-xl mt-1.5">{Number(success.total || 0).toFixed(2)} AZN</p>

        {success.paymentMethod === "WALLET" ? (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            ✅ Ödəniş daxili balansınızdan dərhal çıxıldı və sifarişiniz təsdiqləndi.
          </div>
        ) : ["BANK_CARD", "M10"].includes(success.paymentMethod) ? (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
            ⏳ Ödəniş qəbziniz sistemə daxil edildi. Administrator təsdiqlədikdən sonra məhsul çatdırılmaya çıxarılacaqdır.
          </div>
        ) : (
          <div className="mt-4 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium">
            📦 Sifarişiniz qapıda nağd ödənişlə çatdırılacaqdır.
          </div>
        )}

        <div className="mt-6 bg-gradient-to-r from-yellow-100 to-amber-50 border border-amber-200 p-4 rounded-2xl text-left">
          <p className="text-sm text-amber-900 font-bold flex items-center gap-1.5">
            <Icon name="coins" size={18} className="text-amber-500" /> Təbriklər! Keşbek qazandınız
          </p>
          <p className="text-xs text-amber-700 mt-1">Bu sifarişdən <strong>+{success.earnedCoin} FermerCoin</strong> qazandınız.</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/dashboard" className="btn-primary flex-1 text-center py-3 text-sm font-bold">
            Sifarişlərimə Bax
          </Link>
          <Link href="/products" className="btn-secondary flex-1 text-center py-3 text-sm font-bold">
            Alış-verişə Davam Et
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Icon name="cart" size={48} className="mx-auto mb-3 text-gray-300" strokeWidth={1.4} />
        <p className="text-gray-500 font-medium text-sm">Səbətiniz boşdur.</p>
        <Link href="/products" className="btn-primary inline-block mt-5 text-sm font-bold">
          Elanlara bax
        </Link>
      </div>
    );
  }

  const bankCard = paymentAccounts?.bankCardNumber || "4169 7388 1234 5678";
  const bankCardHolder = paymentAccounts?.bankCardHolder || "Fermer Market MMC";
  const bankName = paymentAccounts?.bankName || "ABB Bank / Kapital Bank";
  const m10Num = paymentAccounts?.m10Number || "+994 10 521 09 09";
  const m10Holder = paymentAccounts?.m10Holder || "Fermer Market";
  const payInstructions = paymentAccounts?.instructions || "Ödəniş etdikdən sonra qəbzin şəklini yükləyin.";

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6">Sifarişi Rəsmiləşdir</h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 columns: Shipping & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Ünvan və Çatdırılma */}
          <div className="card p-5 sm:p-6 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <h2 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs font-black flex items-center justify-center">1</span>
              Çatdırılma və Ünvan Məlumatları
            </h2>
            
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Dəqiq Çatdırılma Ünvanı *</label>
              <input
                required
                className="input-field text-xs"
                placeholder="Məs. Nərimanov r., Atatürk pr. 45, mənzil 12"
                value={form.shippingAddress}
                onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Region *</label>
                <input
                  required
                  className="input-field text-xs"
                  placeholder="Bakı, Gəncə, Quba..."
                  value={form.shippingRegion}
                  onChange={(e) => setForm({ ...form, shippingRegion: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Şəhər / Qəsəbə *</label>
                <input
                  required
                  className="input-field text-xs"
                  placeholder="Nərimanov, Mərdəkan..."
                  value={form.shippingCity}
                  onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Çatdırılma Növü</label>
              <select
                className="input-field text-xs bg-white"
                value={form.deliveryMethod}
                onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
              >
                <option value="STANDARD">Standart Çatdırılma (5.00 AZN · 1-2 iş günü)</option>
                <option value="EXPRESS">Sürətli Çatdırılma (10.00 AZN · Eyni gün)</option>
                <option value="PICKUP">Özüm Götürəcəm (0.00 AZN · Pulsuz)</option>
              </select>
            </div>
          </div>

          {/* 2. ÖDƏNİŞ ÜSULU VƏ HESABLAR */}
          <div className="card p-5 sm:p-6 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <h2 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs font-black flex items-center justify-center">2</span>
              Ödəniş Üsulu & Qəbz Yükləmə
            </h2>

            {/* Ödəniş Üsulu Seçimləri */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Bank Kartı */}
              <button
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: "BANK_CARD" })}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                  form.paymentMethod === "BANK_CARD"
                    ? "border-brand-600 bg-brand-50/40 shadow-xs ring-2 ring-brand-600/10"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <CreditCard className={`w-5 h-5 ${form.paymentMethod === "BANK_CARD" ? "text-brand-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-bold text-xs text-gray-900">Bank Kartı</p>
                  <p className="text-[10px] text-gray-400">Köçürmə ilə</p>
                </div>
              </button>

              {/* M10 */}
              <button
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: "M10" })}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                  form.paymentMethod === "M10"
                    ? "border-purple-600 bg-purple-50/40 shadow-xs ring-2 ring-purple-600/10"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <Smartphone className={`w-5 h-5 ${form.paymentMethod === "M10" ? "text-purple-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-bold text-xs text-gray-900">M10 Pul Kisəsi</p>
                  <p className="text-[10px] text-gray-400">Mobil ödəniş</p>
                </div>
              </button>

              {/* Daxili Balans */}
              <button
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: "WALLET" })}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                  form.paymentMethod === "WALLET"
                    ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-600/10"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <WalletIcon className={`w-5 h-5 ${form.paymentMethod === "WALLET" ? "text-emerald-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-bold text-xs text-gray-900">Daxili Balans</p>
                  <p className="text-[10px] text-emerald-600 font-bold">₼{Number(wallet?.balance || 0).toFixed(2)}</p>
                </div>
              </button>

              {/* Qapıda Nağd */}
              <button
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: "CASH_ON_DELIVERY" })}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                  form.paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-amber-600 bg-amber-50/40 shadow-xs ring-2 ring-amber-600/10"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <Banknote className={`w-5 h-5 ${form.paymentMethod === "CASH_ON_DELIVERY" ? "text-amber-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-bold text-xs text-gray-900">Qapıda Nağd</p>
                  <p className="text-[10px] text-gray-400">Təhvil alarkən</p>
                </div>
              </button>
            </div>

            {/* BANK KARTI MƏLUMATLARI & QƏBZ */}
            {form.paymentMethod === "BANK_CARD" && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-brand-50/30 border border-brand-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Bank Kartı Hesab Məlumatı</span>
                  <span className="text-[11px] font-bold text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full">{bankName}</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Kart Nömrəsi</p>
                    <p className="text-sm sm:text-base font-mono font-black text-gray-900 tracking-wider mt-0.5">{bankCard}</p>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">Sahibi: <strong>{bankCardHolder}</strong></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankCard.replace(/\s+/g, ""), "card")}
                    className="p-2.5 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedField === "card" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === "card" ? "Kopyalandı" : "Kopyala"}</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500 font-medium">{payInstructions}</p>

                {/* Qəbz Yükləmə */}
                <div>
                  <ImageUploadField
                    label="Ödəniş Qəbzinin Şəkli (Skrinşot və ya Foto) *"
                    value={form.receiptUrl}
                    onChange={(url) => setForm({ ...form, receiptUrl: url })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Əlavə Qeyd / Tranzaksiya Kodu (istəyə bağlı)</label>
                  <input
                    className="input-field text-xs bg-white"
                    placeholder="Məs. Əməliyyat kodu və ya ad-soyad"
                    value={form.transactionNote}
                    onChange={(e) => setForm({ ...form, transactionNote: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* M10 MƏLUMATLARI & QƏBZ */}
            {form.paymentMethod === "M10" && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-purple-50/30 border border-purple-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">M10 Pul Kisəsi Məlumatı</span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">M10</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">M10 Mobil Nömrə</p>
                    <p className="text-sm sm:text-base font-mono font-black text-gray-900 tracking-wider mt-0.5">{m10Num}</p>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">Qəbul edən: <strong>{m10Holder}</strong></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(m10Num.replace(/\s+/g, ""), "m10")}
                    className="p-2.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedField === "m10" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === "m10" ? "Kopyalandı" : "Kopyala"}</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500 font-medium">{payInstructions}</p>

                {/* Qəbz Yükləmə */}
                <div>
                  <ImageUploadField
                    label="M10 Ödəniş Qəbzinin Şəkli (Skrinşot) *"
                    value={form.receiptUrl}
                    onChange={(url) => setForm({ ...form, receiptUrl: url })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">M10 Tranzaksiya Kodu / Qeyd</label>
                  <input
                    className="input-field text-xs bg-white"
                    placeholder="Məs. M10 qəbzindəki əməliyyat nömrəsi"
                    value={form.transactionNote}
                    onChange={(e) => setForm({ ...form, transactionNote: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* DAXİLİ BALANS MƏLUMATI */}
            {form.paymentMethod === "WALLET" && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Cari Pul Kisəsi Balansınız:</span>
                  <span className="font-black text-emerald-700 text-sm">{Number(wallet?.balance || 0).toFixed(2)} AZN</span>
                </div>
                {Number(wallet?.balance || 0) < total ? (
                  <p className="text-xs text-red-600 font-bold">
                    Balansınız kifayət etmir ({Number(wallet?.balance || 0).toFixed(2)} AZN &lt; {total.toFixed(2)} AZN). Zəhmət olmasa kart və ya M10 seçin.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">
                    Sifarişi təsdiqlədikdə {total.toFixed(2)} AZN məbləğ dərhal balansınızdan çıxılacaq və sifarişiniz anında təsdiqlənəcəkdir.
                  </p>
                )}
              </div>
            )}

            {/* QAPIDA NAĞD */}
            {form.paymentMethod === "CASH_ON_DELIVERY" && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs text-amber-800 font-medium">
                Məhsulu kuryerdən təhvil alarkən nağd şəkildə <strong>{total.toFixed(2)} AZN</strong> ödəyəcəksiniz.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 column: Order Summary & Checkout Action */}
        <div className="card p-5 sm:p-6 space-y-4 bg-gray-50 border border-gray-200 rounded-3xl sticky top-24">
          <h2 className="text-base font-extrabold text-gray-900 border-b border-gray-200 pb-3">Sifariş Xülasəsi</h2>
          
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs py-1">
                <span className="text-gray-700 font-medium truncate max-w-[170px]">{item.title || item.name || `Məhsul #${idx + 1}`}</span>
                <span className="font-bold text-gray-900 shrink-0">{item.quantity} × {Number(item.price).toFixed(2)} ₼</span>
              </div>
            ))}
          </div>

          {/* Kupon Kodu */}
          <div className="pt-2 border-t border-gray-200">
            <label className="text-xs font-bold text-gray-700 block mb-1">Kupon Kodu</label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1 text-xs uppercase"
                placeholder="Kupon kodunuz"
                value={form.couponCode}
                onChange={(e) => { setForm({ ...form, couponCode: e.target.value }); setCouponResult(null); }}
              />
              <button
                type="button"
                onClick={handleValidateCoupon}
                disabled={validating}
                className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {validating ? "..." : "Tətbiq et"}
              </button>
            </div>
            {couponResult && !couponResult.valid && (
              <p className="text-[11px] text-red-600 mt-1">❌ {couponResult.reason}</p>
            )}
            {couponResult && couponResult.valid && (
              <p className="text-[11px] text-emerald-600 font-bold mt-1">✅ Kupon tətbiq edildi: -{couponResult.discount.toFixed(2)} ₼</p>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Qiymət Cəmi */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Məhsulların qiyməti</span>
              <span className="font-bold text-gray-900">{subtotal.toFixed(2)} AZN</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Kupon Endirimi</span>
                <span>-{discount.toFixed(2)} AZN</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Çatdırılma Haqqı</span>
              <span className="font-bold text-gray-900">{deliveryCost.toFixed(2)} AZN</span>
            </div>
            <div className="flex items-center justify-between text-sm font-black pt-3 border-t border-gray-200">
              <span className="text-gray-900">Yekun Məbləğ</span>
              <span className="text-brand-700 text-lg font-black">{total.toFixed(2)} AZN</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sifariş Göndərilir...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Sifarişi Təsdiqlə ({total.toFixed(2)} ₼)</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> 100% Təhlükəsiz və Zəmanətli Sifariş
          </p>
        </div>
      </form>
    </div>
  );
}
