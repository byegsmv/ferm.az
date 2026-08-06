"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [walletModal, setWalletModal] = useState(null);
  const [walletData, setWalletData] = useState({ balance: 0, coins: 0 });
  const [walletLoading, setWalletLoading] = useState(false);
  const { toast, ToastContainer } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ pageSize: 100, ...(search && { search }), ...(roleFilter && { role: roleFilter }) });
    apiFetch(`/api/admin/users?${q}`).then(d => setUsers(d.users || [])).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  async function updateUser(id, data) {
    try { 
      await apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }); 
      toast("Güncəlləndi", "success"); 
      setUsers(p => p.map(u => u.id === id ? { ...u, ...data } : u)); 
    } catch(e) {
      toast(e.message, "error");
    }
  }

  async function openWallet(u) {
    setWalletModal(u);
    setWalletLoading(true);
    try {
      const data = await apiFetch(`/api/admin/users/${u.id}/wallet`);
      setWalletData({ balance: data.wallet.balance || 0, coins: data.wallet.coins || 0 });
    } catch(e) {
      toast("Balans yüklənə bilmədi", "error");
    } finally {
      setWalletLoading(false);
    }
  }

  async function saveWallet(e) {
    e.preventDefault();
    if (!walletModal) return;
    try {
      await apiFetch(`/api/admin/users/${walletModal.id}/wallet`, {
        method: "PATCH",
        body: JSON.stringify({ balance: walletData.balance, coins: walletData.coins })
      });
      toast("Balans güncəlləndi", "success");
      setWalletModal(null);
    } catch(e) {
      toast(e.message, "error");
    }
  }

  const STATUS_COLOR = { ACTIVE: "bg-green-100 text-green-700", PENDING_VERIFICATION: "bg-amber-100 text-amber-700", SUSPENDED: "bg-amber-100 text-amber-700", BANNED: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">İstifadəçilər</h1>
          <p className="text-gray-500 mt-1">Sistemdəki bütün istifadəçi və rolları idarə edin.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="p-4 border-b border-gray-100 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Ad, email, telefon axtar..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Icon name="search" size={16} />
            </div>
          </div>
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)} 
            className="border border-gray-200 rounded-lg text-sm px-4 py-2 bg-white outline-none focus:border-brand-500"
          >
            <option value="">Bütün Rollar</option>
            <option value="BUYER">Alıcı (BUYER)</option>
            <option value="FARMER">Fermer (FARMER)</option>
            <option value="STORE">Mağaza (STORE)</option>
            <option value="ADMIN">Admin (ADMIN)</option>
            <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
          </select>
        </div>

        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">İstifadəçi</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Əlaqə</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Rol</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-40 whitespace-nowrap">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Yüklənir...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Heç bir istifadəçi tapılmadı.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {u.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{u.fullName || "Adsız"}</p>
                      <p className="text-xs text-gray-500">Qeydiyyat: {new Date(u.createdAt).toLocaleDateString("az-AZ")}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{u.phone || "—"}</p>
                  <p className="text-xs text-gray-500">{u.email || "—"}</p>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={u.role} 
                    onChange={e => updateUser(u.id, { role: e.target.value })}
                    className="border border-gray-200 rounded text-xs px-2 py-1 bg-white"
                  >
                    <option value="BUYER">BUYER</option>
                    <option value="FARMER">FARMER</option>
                    <option value="STORE">STORE</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={u.status} 
                    onChange={e => updateUser(u.id, { status: e.target.value })}
                    className={`border border-gray-100 rounded-full text-xs font-bold px-2 py-1 outline-none ${STATUS_COLOR[u.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    <option value="ACTIVE">AKTİV</option>
                    <option value="PENDING_VERIFICATION">TƏSDİQ GÖZLƏYİR</option>
                    <option value="SUSPENDED">DONDURULUB</option>
                    <option value="BANNED">BLOKLANIB</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => openWallet(u)} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                    Balans
                  </button>
                  {u.status !== "BANNED" ? (
                    <button onClick={() => updateUser(u.id, { status: "BANNED" })} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                      Blokla
                    </button>
                  ) : (
                    <button onClick={() => updateUser(u.id, { status: "ACTIVE" })} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                      Bərpa et
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <p className="text-sm text-gray-500">Göstərilir {users.length} istifadəçi</p>
        </div>
      </div>

      {walletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setWalletModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Balans İdarəetməsi</h3>
            <p className="text-sm text-gray-500 mb-4">{walletModal.fullName} ({walletModal.email})</p>
            {walletLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">Yüklənir...</p>
            ) : (
              <form onSubmit={saveWallet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AZN Balansı</label>
                  <input
                    type="number" step="0.01" required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-500"
                    value={walletData.balance}
                    onChange={e => setWalletData(d => ({ ...d, balance: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hədiyyə Coin</label>
                  <input
                    type="number" step="0.01" required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-500"
                    value={walletData.coins}
                    onChange={e => setWalletData(d => ({ ...d, coins: e.target.value }))}
                  />
                </div>
                <button type="submit" className="w-full bg-brand-600 text-white font-bold py-2 rounded-lg hover:bg-brand-700 transition-colors">
                  Yadda saxla
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
