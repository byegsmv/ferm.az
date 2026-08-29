"use client";
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

export default function AdminOrdersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);
  const { toast, ToastContainer } = useToast();

  async function loadOrders() {
    setLoading(true);
    setError(null);
    setAuthError(false);
    try {
      const d = await apiFetch("/api/orders?view=all");
      if (d && Array.isArray(d.orders)) {
        setItems(d.orders);
      } else {
        setItems([]);
        setError("Məlumatlar yüklənə bilmədi");
      }
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        setAuthError(true);
        setError(e.message || "Bu səhifəyə giriş icazəniz yoxdur. Admin kimi daxil olun.");
      } else {
        setError(e.message || "Sifarişlər yüklənərkən xəta baş verdi");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(id, st) {
    try {
      await apiFetch(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status: st }) });
      setItems(p => p.map(o => o.id === id ? { ...o, status: st } : o));
      toast("Sifariş statusu yeniləndi", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const STATUS_LABELS = { PENDING: "Gözləyir", PAID: "Ödənilib", PROCESSING: "Hazırlanır", SHIPPED: "Göndərilib", DELIVERED: "Çatdırılıb", CANCELLED: "Ləğv edilib", REFUNDED: "Geri qaytarılıb" };
  const STATUS_COLORS = { PENDING: "bg-yellow-100 text-yellow-700", PAID: "bg-blue-100 text-blue-700", PROCESSING: "bg-purple-100 text-purple-700", SHIPPED: "bg-blue-100 text-blue-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700", REFUNDED: "bg-gray-100 text-gray-700" };

  const [receiptModal, setReceiptModal] = useState(null);

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Sifarişlər</h1>
          <p className="text-gray-500 mt-1">Platforma üzərindən olan bütün sifarişləri idarə edin.</p>
        </div>
        <div className="text-sm text-gray-500">
          Cəmi: <span className="font-bold text-gray-900">{items.length}</span>
        </div>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-red-700 mb-2">Giriş icazəsi yoxdur</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = "/login"}
            className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-700"
          >
            Daxil ol
          </button>
        </div>
      )}

      {!authError && error && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-amber-700 mb-2">Xəta baş verdi</h3>
          <p className="text-sm text-amber-600 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-amber-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-amber-700"
          >
            Yenidən cəhd et
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sifariş №</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Müştəri</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Məbləğ</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ödəniş & Qəbz</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarix</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-12 text-center"><div className="animate-pulse text-gray-400">Yüklənir...</div></td></tr>
            ) : !authError && !error && items.length === 0 ? (
              <tr><td colSpan="6" className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-2">📦</div>
                <p className="font-medium">Heç bir sifariş tapılmadı</p>
                <p className="text-sm text-gray-400 mt-1">Sifarişlər gəldikcə burada görünəcək</p>
              </td></tr>
            ) : !authError && !error && items.map(o => {
              const receiptUrl = o.payment?.rawResponse?.receiptUrl || (o.payment?.providerRef?.startsWith("http") || o.payment?.providerRef?.startsWith("/uploads") ? o.payment?.providerRef : null);
              const note = o.payment?.rawResponse?.transactionNote || (!receiptUrl ? o.payment?.providerRef : null);
              return (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-700">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{o.buyer?.fullName || "—"}</p>
                    {o.buyer?.phone && <p className="text-xs text-gray-500">{o.buyer.phone}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-700">{Number(o.total || 0).toLocaleString("az-AZ")} ₼</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                        {o.payment?.provider || 'NAĞD'}
                      </span>
                      {receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setReceiptModal({ url: receiptUrl, note, orderId: o.id, total: o.total, paymentMethod: o.payment?.provider })}
                          className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline flex items-center gap-1 block"
                        >
                          🧾 Qəbzə bax
                        </button>
                      ) : note ? (
                        <p className="text-[10px] text-gray-500 italic truncate max-w-[120px]">Qeyd: {note}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString("az-AZ", { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className={`inline-block rounded-full text-xs font-bold px-3 py-1 outline-none cursor-pointer ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}
                    >
                      {Object.keys(STATUS_LABELS).map(k => (
                        <option key={k} value={k}>{STATUS_LABELS[k]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal Preview */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setReceiptModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Ödəniş Qəbzi</h3>
                <p className="text-xs text-gray-500">Sifariş: #{receiptModal.orderId?.slice(-8).toUpperCase()} · ₼{Number(receiptModal.total).toFixed(2)}</p>
              </div>
              <button onClick={() => setReceiptModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><Icon name="close" size={18} /></button>
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center min-h-[250px]">
              <img
                src={receiptModal.url}
                alt="Ödəniş Qəbzi"
                className="max-h-[450px] w-auto object-contain rounded-xl"
              />
            </div>

            {receiptModal.note && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
                <span className="font-bold block text-gray-900 mb-0.5">Müştərinin qeydi / Tranzaksiya kodu:</span>
                {receiptModal.note}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <a
                href={receiptModal.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Orijinal faylı aç
              </a>
              <button onClick={() => setReceiptModal(null)} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl">
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
