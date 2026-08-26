"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import {
  Users, UserCheck, Shield, Key, Wallet, Ban,
  CheckCircle2, Trash2, Edit3, Plus, Search, Filter,
  RefreshCw, X, Lock, Phone, Mail, User
} from 'lucide-react';

const STATUS_COLOR = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200",
  BANNED: "bg-rose-50 text-rose-700 border-rose-200"
};

const ROLE_BADGE = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-300 font-black",
  ADMIN: "bg-blue-100 text-blue-800 border-blue-300 font-bold",
  STORE: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
  FARMER: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
  BUYER: "bg-gray-100 text-gray-700 border-gray-200 font-medium"
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit User Modal
  const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "BUYER",
    status: "ACTIVE",
    newPassword: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Wallet Modal
  const [walletModal, setWalletModal] = useState(null);
  const [walletData, setWalletData] = useState({ balance: 0, coins: 0 });
  const [walletLoading, setWalletLoading] = useState(false);

  const { toast, ToastContainer } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      pageSize: 150,
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
      ...(statusFilter && { status: statusFilter })
    });
    apiFetch(`/api/admin/users?${q}`)
      .then(d => setUsers(d.users || []))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openEditModal = (u) => {
    setEditModalUser(u);
    setEditForm({
      fullName: u.fullName || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "BUYER",
      status: u.status || "ACTIVE",
      newPassword: ""
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;
    setSavingEdit(true);

    const payload = {
      fullName: editForm.fullName,
      email: editForm.email || null,
      phone: editForm.phone || null,
      role: editForm.role,
      status: editForm.status
    };

    if (editForm.newPassword.trim()) {
      payload.newPassword = editForm.newPassword.trim();
    }

    try {
      await apiFetch(`/api/admin/users/${editModalUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      toast("İstifadəçi məlumatları yeniləndi", "success");
      setEditModalUser(null);
      load();
    } catch (e) {
      toast(e.message || "Yenilənmədi", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`'${name || "Bu istifadəçi"}' profilini tamamilə silmək istədiyinizdən əminsiniz?`)) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      toast("İstifadəçi silindi", "success");
      load();
    } catch (e) {
      toast(e.message || "Silinmədi", "error");
    }
  };

  const openWallet = async (u) => {
    setWalletModal(u);
    setWalletLoading(true);
    try {
      const data = await apiFetch(`/api/admin/users/${u.id}/wallet`);
      setWalletData({
        balance: data.wallet?.balance || 0,
        coins: data.wallet?.coins || 0
      });
    } catch (e) {
      toast("Balans yüklənə bilmədi", "error");
    } finally {
      setWalletLoading(false);
    }
  };

  const saveWallet = async (e) => {
    e.preventDefault();
    if (!walletModal) return;
    try {
      await apiFetch(`/api/admin/users/${walletModal.id}/wallet`, {
        method: "PATCH",
        body: JSON.stringify({
          balance: parseFloat(walletData.balance) || 0,
          coins: parseFloat(walletData.coins) || 0
        })
      });
      toast("Balans uğurla yeniləndi", "success");
      setWalletModal(null);
    } catch (e) {
      toast(e.message, "error");
    }
  };

  // Stats
  const superAdminCount = users.filter(u => u.role === 'SUPER_ADMIN').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const storeCount = users.filter(u => u.role === 'STORE').length;
  const farmerCount = users.filter(u => u.role === 'FARMER').length;

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">İstifadəçilər & İcazələr</h1>
            <p className="text-xs text-gray-500">Bütün istifadəçi profilləri, rollar, icazələr və balans idarəsi</p>
          </div>
        </div>

        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Yenilə</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <span className="text-[11px] font-bold uppercase text-purple-600">Super Adminlər</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{superAdminCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <span className="text-[11px] font-bold uppercase text-blue-600">Adminlər</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{adminCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Mağazalar</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{storeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <span className="text-[11px] font-bold uppercase text-amber-600">Fermerlər</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{farmerCount}</p>
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ad, soyad, email və ya telefon nömrəsi ilə axtar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 font-medium"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-xl text-xs font-bold px-3 py-2.5 bg-gray-50 outline-none focus:bg-white focus:border-brand-500"
          >
            <option value="">Bütün Rollar</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STORE">STORE (Mağaza)</option>
            <option value="FARMER">FARMER (Fermer)</option>
            <option value="BUYER">BUYER (Alıcı)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl text-xs font-bold px-3 py-2.5 bg-gray-50 outline-none focus:bg-white focus:border-brand-500"
          >
            <option value="">Bütün Statuslar</option>
            <option value="ACTIVE">AKTİV</option>
            <option value="PENDING_VERIFICATION">TƏSDİQ GÖZLƏYİR</option>
            <option value="SUSPENDED">DONDURULUB</option>
            <option value="BANNED">BLOKLANIB</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[750px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">İstifadəçi</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Əlaqə</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400">
                    İstifadəçilər yüklənir...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400">
                    Axtarışa uyğun istifadəçi tapılmadı.
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200 shrink-0">
                        {u.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.fullName || "Adsız İstifadəçi"}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          ID: {u.id.substring(0, 12)}... • {new Date(u.createdAt).toLocaleDateString("az-AZ")}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">{u.phone || "—"}</p>
                    <p className="text-gray-400 font-mono text-[11px]">{u.email || "—"}</p>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] border ${ROLE_BADGE[u.role] || "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLOR[u.status] || "bg-gray-100 text-gray-700"}`}>
                      {u.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-brand-50 text-gray-700 hover:text-brand-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                        title="Düzəliş et & Şifrə yenilə"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Redaktə</span>
                      </button>

                      <button
                        onClick={() => openWallet(u)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                        title="Balans və Coin"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Balans</span>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Toplam {users.length} istifadəçi</span>
        </div>
      </div>

      {/* ── Edit User Modal ── */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-brand-700 to-emerald-700 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black">İstifadəçi Profilini Redaktə Et</h3>
                <p className="text-xs text-white/80 mt-0.5">{editModalUser.fullName} ({editModalUser.email || editModalUser.phone})</p>
              </div>
              <button onClick={() => setEditModalUser(null)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Ad və Soyad</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">İstifadəçi Rolu</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 bg-white font-bold"
                  >
                    <option value="BUYER">BUYER (Alıcı)</option>
                    <option value="FARMER">FARMER (Fermer)</option>
                    <option value="STORE">STORE (Mağaza)</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Tam Səlahiyyət)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hesab Statusu</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 bg-white font-bold"
                  >
                    <option value="ACTIVE">AKTİV</option>
                    <option value="PENDING_VERIFICATION">TƏSDİQ GÖZLƏYİR</option>
                    <option value="SUSPENDED">DONDURULUB</option>
                    <option value="BANNED">BLOKLANIB</option>
                  </select>
                </div>
              </div>

              {/* Password Reset */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block font-bold text-gray-700 mb-1">
                  Yeni Şifrə Təyin Et (Boş qoysanız dəyişməz)
                </label>
                <input
                  type="password"
                  placeholder="Yeni şifrə daxil edin..."
                  value={editForm.newPassword}
                  onChange={e => setEditForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md hover:bg-brand-700 disabled:opacity-50"
                >
                  {savingEdit ? "Saxlanılır..." : "Yadda Saxla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Wallet Modal ── */}
      {walletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border border-gray-100">
            <button
              onClick={() => setWalletModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
            <h3 className="text-base font-black text-gray-900 mb-1">Balans & Coin İdarəsi</h3>
            <p className="text-xs text-gray-500 mb-4">{walletModal.fullName} ({walletModal.email || walletModal.phone})</p>

            {walletLoading ? (
              <p className="text-xs text-gray-400 text-center py-4">Yüklənir...</p>
            ) : (
              <form onSubmit={saveWallet} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">AZN Balansı (₼)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-bold"
                    value={walletData.balance}
                    onChange={e => setWalletData(d => ({ ...d, balance: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hədiyyə Coin</label>
                  <input
                    type="number"
                    step="1"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 font-bold"
                    value={walletData.coins}
                    onChange={e => setWalletData(d => ({ ...d, coins: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-600 text-white font-bold py-2.5 rounded-xl hover:bg-brand-700 shadow-md transition-colors"
                >
                  Balansı Yadda Saxla
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
