"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function ModeratorPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [rejectReason, setRejectReason] = useState({});
  const [processing, setProcessing] = useState(null);

  useEffect(() => { fetchProducts(); }, [tab]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const status = tab === "pending" ? "PENDING_REVIEW" : tab === "approved" ? "ACTIVE" : "REJECTED";
      const data = await apiFetch(`/api/products?status=${status}&limit=50`);
      setProducts(data.products || data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(productId, action) {
    setProcessing(productId);
    try {
      const body = action === "ACTIVE"
        ? { status: "ACTIVE" }
        : { status: "REJECTED", adminNote: rejectReason[productId] || "Rədd edildi" };
      await apiFetch(`/api/products/${productId}`, { method: "PATCH", body: JSON.stringify(body) });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setProcessing(null);
    }
  }

  const TABS = [
    { key: "pending", label: "Gözləyən", icon: "clock" },
    { key: "approved", label: "Təsdiqlənmiş", icon: "checkCircle" },
    { key: "rejected", label: "Rədd edilmiş", icon: "closeCircle" },
  ];

  return (
    <div>
      {/* Stats header */}
      <div className="mb-5 p-4 bg-brand-50 border border-brand-100 rounded-xl">
        <p className="text-sm font-semibold text-brand-700 flex items-center gap-1.5"><Icon name="shieldCheck" size={18} /> Moderator Paneli</p>
        <p className="text-xs text-brand-600 mt-0.5">Elanları yoxla, təsdiqlə və ya rədd et</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500"
            }`}>
            <span className="flex items-center gap-1.5">
              {t.icon && <Icon name={t.icon} size={16} />}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Yüklənir...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-3 text-gray-300 flex justify-center"><Icon name="clipboard" size={48} /></div>
          <p className="text-gray-500 font-medium">
            {tab === "pending" ? "Gözləyən elan yoxdur" : tab === "approved" ? "Təsdiqlənmiş elan yoxdur" : "Rədd edilmiş elan yoxdur"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className="card p-4">
              <div className="flex gap-3">
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400"><Icon name="package" size={28} /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{product.titleAz}</p>
                  <p className="text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Icon name="dollar" size={13} /> ₼{Number(product.price).toFixed(2)}</span> · <span className="inline-flex items-center gap-1"><Icon name="package" size={13} /> {product.stock} ədəd</span>
                  </p>
                  {product.seller && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Icon name="user" size={13} /> {product.seller.fullName}</p>
                  )}
                  {product.descriptionAz && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.descriptionAz}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(product.createdAt).toLocaleDateString("az-AZ")}
                  </p>
                </div>
              </div>

              {tab === "pending" && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <input
                    value={rejectReason[product.id] || ""}
                    onChange={e => setRejectReason(prev => ({ ...prev, [product.id]: e.target.value }))}
                    placeholder="Rədd səbəbi (rədd etmək istəyirsinizsə yazın)"
                    className="input-field text-sm mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(product.id, "ACTIVE")}
                      disabled={processing === product.id}
                      className="btn-primary text-sm py-1.5 px-4 flex-1 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-1"><Icon name="check" size={14} /> Təsdiqlə</span>
                    </button>
                    <button
                      onClick={() => handleAction(product.id, "REJECTED")}
                      disabled={processing === product.id}
                      className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-1.5 text-sm font-semibold hover:bg-red-100 transition flex-1 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-1"><Icon name="close" size={14} /> Rədd et</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
