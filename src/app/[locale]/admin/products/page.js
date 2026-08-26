"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast, ToastContainer } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    // Fetch pending and all active products
    apiFetch("/api/products?pageSize=100").then(d => setItems(d.products || [])).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id, status) {
    try { 
      await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); 
      toast(status === "ACTIVE" ? "Elan təsdiqləndi" : "Status dəyişdirildi", "success"); 
      load(); 
    } catch(e) { 
      toast(e.message, "error"); 
    }
  }
  
  async function removeProduct(id) {
    if (!confirm("Bu elanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      toast("Elan silindi", "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const filteredItems = items.filter(p => 
    (p.titleAz || "").toLowerCase().includes(search.toLowerCase()) || 
    (p.titleEn || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Məhsullar</h1>
          <p className="text-gray-500 mt-1">Platformadakı bütün elanları idarə edin.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Elan axtar..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Icon name="search" size={16} />
            </div>
          </div>
          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
            Yeni Məhsul
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Məhsul ID / Adı</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategoriyası</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qiymət</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Yüklənir...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Heç bir elan tapılmadı.</td></tr>
            ) : filteredItems.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {p.images && (p.images[0]?.url || p.coverImage) ? (
                      <img src={p.images[0]?.url || p.coverImage} alt={p.titleAz} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400">
                        <Icon name="image" size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1" title={p.titleAz}>{p.titleAz || "Adsız"}</p>
                      <p className="text-xs text-gray-500">Satıcı: {p.seller?.fullName || "Bilinmir"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.category?.nameAz || "—"}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{Number(p.price).toLocaleString("az-AZ")} {p.currency || "AZN"}</td>
                <td className="px-6 py-4">
                  {p.status === "ACTIVE" ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Aktiv</span>
                  ) : p.status === "PENDING_REVIEW" ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Gözləyir</span>
                  ) : p.status === "REJECTED" ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rədd Edilib</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{p.status}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Link href={`/admin/products/${p.id}/edit`} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                    Düzəliş et
                  </Link>
                  {p.status === "PENDING_REVIEW" && (
                    <button onClick={() => decide(p.id, "ACTIVE")} className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors">
                      Təsdiqlə
                    </button>
                  )}
                  {p.status === "ACTIVE" && (
                    <button onClick={() => decide(p.id, "REJECTED")} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors">
                      Deaktiv et
                    </button>
                  )}
                  <button onClick={() => removeProduct(p.id)} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors ml-1">
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <p className="text-sm text-gray-500">Göstərilir {filteredItems.length} (Cəmi {items.length})</p>
        </div>
      </div>
    </div>
  );
}
