"use client";
import { useState, useEffect } from "react";
import { apiFetch, getUser } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

export default function DeliveryDashboard() {
  const t = useTranslations();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!user || (user.role !== "DELIVERY_PARTNER" && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      router.push("/dashboard");
      return;
    }
    fetchOrders();
  }, [user, router]);

  async function fetchOrders() {
    try {
      const data = await apiFetch("/api/orders?view=delivering");
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(id, newStatus) {
    if (!confirm("Statusu dəyişmək istədiyinizə əminsiniz?")) return;
    try {
      await apiFetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (err) {
      alert("Xəta baş verdi: " + err.message);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Yüklənir...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Çatdırılma Sifarişləri</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-2xl text-gray-500">
          Sizə təyin edilmiş sifariş yoxdur.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5 border border-gray-100 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-500">#{order.id.slice(-8).toUpperCase()}</span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-1 rounded-md">
                    {order.deliveryMethod}
                  </span>
                </div>
                
                <div className="text-sm">
                  <p><span className="text-gray-500">Alıcı:</span> {order.buyer?.fullName} ({order.buyer?.phone})</p>
                  <p><span className="text-gray-500">Ünvan:</span> {order.shippingCity}, {order.shippingRegion}, {order.shippingAddress}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[200px]">
                {order.status === 'PROCESSING' && (
                  <button onClick={() => updateOrderStatus(order.id, 'SHIPPED')} className="btn-primary w-full text-sm">
                    Yola Çıxdı İşarələ
                  </button>
                )}
                {order.status === 'SHIPPED' && (
                  <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl transition text-sm">
                    Çatdırıldı İşarələ
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
