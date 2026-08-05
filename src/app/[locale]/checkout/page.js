"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { getCart, cartTotal, clearCart } from "@/lib/cartClient";
import { apiFetch, getUser } from "@/lib/apiClient";

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ shippingAddress: "", shippingRegion: "", shippingCity: "", couponCode: "", deliveryMethod: "STANDARD" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(getCart());
    if (!getUser()) {
      router.push("/login");
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const totalVal = cartTotal(items);
      const payload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ...(form.couponCode ? { couponCode: form.couponCode } : {}),
        shippingAddress: form.shippingAddress,
        shippingRegion: form.shippingRegion,
        shippingCity: form.shippingCity,
        deliveryMethod: form.deliveryMethod,
      };
      const data = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      
      const earnedCoin = (totalVal * 0.02).toFixed(2);
      if (typeof window !== 'undefined') {
        const current = parseFloat(localStorage.getItem('fermerCoin') || '0');
        localStorage.setItem('fermerCoin', (current + parseFloat(earnedCoin)).toFixed(2));
      }
      
      clearCart();
      setSuccess({ ...data.order, earnedCoin });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Icon name="checkCircle" size={36} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-black">Sifariş qəbul edildi!</h1>
        <p className="text-gray-500 mt-2">Sifariş nömrəniz: {success.id?.slice(0, 8)}</p>
        <p className="text-brand-700 font-bold text-lg mt-1">{Number(success.total || 0).toFixed(2)} AZN</p>
        
        <div className="mt-6 bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-200 p-4 rounded-2xl">
          <p className="text-sm text-yellow-800 font-bold">Təbriklər!</p>
          <p className="text-xs text-yellow-700 mt-1">Bu alış-verişdən <strong className="text-lg"><span className="inline-flex items-center gap-1">+{success.earnedCoin} <Icon name="coins" size={18} className="text-amber-500" /></span></strong> FermerCoin qazandınız. Balansınızı Panelinizdən yoxlaya bilərsiniz.</p>
        </div>

        <a href="/dashboard" className="btn-primary inline-block mt-6 w-full text-center">Panelimə keç</a>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Icon name="cart" size={44} className="mx-auto mb-3 text-gray-300" strokeWidth={1.4} />
        <p className="text-gray-500 font-medium">Səbətiniz boşdur.</p>
        <a href="/products" className="btn-primary inline-block mt-5">Elanlara bax</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Sifarişi tamamla</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left 2 columns: Delivery & Shipping details */}
        <div className="md:col-span-2 card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Çatdırılma və Ünvan Məlumatları</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
          <div>
            <label className="text-sm font-semibold text-gray-700">Ünvan</label>
            <input className="input-field mt-1" placeholder="Məs. Nərimanov r., Atatürk pr. 45" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Region</label>
              <input className="input-field mt-1" placeholder="Bakı" value={form.shippingRegion} onChange={(e) => setForm({ ...form, shippingRegion: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Şəhər / Qəsəbə</label>
              <input className="input-field mt-1" placeholder="Nərimanov" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Çatdırılma üsulu</label>
            <select className="input-field mt-1" value={form.deliveryMethod} onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}>
              <option value="STANDARD">Standart Çatdırılma (5 AZN)</option>
              <option value="EXPRESS">Sürətli Çatdırılma (10 AZN)</option>
              <option value="PICKUP">Özüm götürəcəm (Pulsuz)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Kupon kodu (istəyə bağlı)</label>
            <input className="input-field mt-1" placeholder="XOSGELDIN10" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} />
          </div>
        </div>

        {/* Right 1 column: Order Summary & Action */}
        <div className="md:col-span-1 card p-6 space-y-4 bg-gray-50 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">Sifariş Xülasəsi</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm py-1">
                <span className="text-gray-700 truncate max-w-[150px]">{item.title || item.name || `Məhsul #${item.productId?.slice(0, 6) || idx + 1}`}</span>
                <span className="font-semibold text-gray-900">{item.quantity} × {item.price} AZN</span>
              </div>
            ))}
          </div>
          <hr className="border-gray-200" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Məhsul məbləği</span>
              <span>{cartTotal(items).toFixed(2)} AZN</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Çatdırılma</span>
              <span>{(form.deliveryMethod === "EXPRESS" ? 10 : form.deliveryMethod === "STANDARD" ? 5 : 0).toFixed(2)} AZN</span>
            </div>
            <div className="flex items-center justify-between font-black text-lg pt-3 border-t border-gray-200">
              <span>Cəmi</span>
              <span className="text-brand-700">
                {(cartTotal(items) + (form.deliveryMethod === "EXPRESS" ? 10 : form.deliveryMethod === "STANDARD" ? 5 : 0)).toFixed(2)} AZN
              </span>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base font-bold shadow-lg">
            {loading ? "Göndərilir..." : "Sifarişi təsdiqlə"}
          </button>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Ödəniş: qapıda nağd / bank köçürməsi (kart ödənişi tezliklə)
          </p>
        </div>
      </form>
    </div>
  );
}
