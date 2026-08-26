"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";

const STATUS_LABELS = {
  PENDING: "Gözləyir",
  PAID: "Ödənilib",
  PROCESSING: "Hazırlanır",
  SHIPPED: "Çatdırılmada",
  DELIVERED: "Çatdırıldı",
  CANCELLED: "Ləğv edildi",
};

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function DeliveryPanel({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [tab, setTab] = useState("active");

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await apiFetch("/api/orders");
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function markDelivered(orderId) {
    setUpdating(orderId);
    try {
      await apiFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "DELIVERED" } : o));
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setUpdating(null);
    }
  }

  const activeOrders = orders.filter(o => ["SHIPPED", "PROCESSING", "PAID"].includes(o.status));
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
  const todayDelivered = deliveredOrders.filter(o => {
    const d = new Date(o.updatedAt || o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const displayed = tab === "active" ? activeOrders : deliveredOrders;

  const TABS = [
    { key: "active", label: `Aktiv (${activeOrders.length})`, icon: "truck" },
    { key: "delivered", label: `Çatdırıldı (${deliveredOrders.length})`, icon: "checkCircle" },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Aktiv Sifarişlər", value: activeOrders.length, color: "text-orange-600" },
          { label: "Bu gün çatdırıldı", value: todayDelivered.length, color: "text-green-600" },
          { label: "Cəmi çatdırıldı", value: deliveredOrders.length, color: "text-brand-600" },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500"
            }`}>
            <span className="flex items-center gap-1.5">
              <Icon name={t.icon} size={16} />
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Yüklənir...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-3 text-gray-300 flex justify-center">
            <Icon name={tab === "active" ? "truck" : "package"} size={48} />
          </div>
          <p className="text-gray-500 font-medium">
            {tab === "active" ? "Aktiv sifariş yoxdur" : "Hələ çatdırılmış sifariş yoxdur"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(order => (
            <div key={order.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm text-gray-900">#{order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  {order.deliveryAddress && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Icon name="mapPin" size={13} className="shrink-0 text-gray-400" /> {order.deliveryAddress}
                    </p>
                  )}
                  {order.buyer && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Icon name="user" size={13} className="shrink-0 text-gray-400 inline mr-1" />{order.buyer.fullName || order.buyer.email}
                      {order.buyer.phone && <span className="inline-flex items-center gap-1 ml-1"> · <Icon name="phone" size={13} className="shrink-0 text-gray-400" />{order.buyer.phone}</span>}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(order.items || []).slice(0, 3).map((item, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                        {item.product?.titleAz || "Məhsul"} × {item.quantity}
                      </span>
                    ))}
                    {(order.items || []).length > 3 && (
                      <span className="text-xs text-gray-400">+{order.items.length - 3}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                    {" · "}
                    <strong className="text-gray-700">₼{Number(order.total).toFixed(2)}</strong>
                  </p>
                </div>
                {order.status === "SHIPPED" && (
                  <button
                    onClick={() => markDelivered(order.id)}
                    disabled={updating === order.id}
                    className="btn-primary text-sm py-2 px-4 shrink-0 disabled:opacity-50"
                  >
                    {updating === order.id ? "..." : <span className="flex items-center gap-1.5"><Icon name="check" size={16} /> Çatdırıldı</span>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
