"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch, getToken } from "@/lib/apiClient";
import StatCard from "@/components/ui/StatCard";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import NoCodeAdminStudio from "@/components/dashboard/NoCodeAdminStudio";
import EmailManager from "./EmailManager";
import MessagingPanel from "@/components/chat/MessagingPanel";
import AdminProfile from "@/components/dashboard/AdminProfile";
import ContentHub from "@/components/dashboard/ContentHub";
import AIAgentPanel from "@/components/dashboard/AIAgentPanel";
import AdminSupport from "@/components/dashboard/AdminSupport";
import AISettingsManager from "@/components/dashboard/AISettingsManager";
import EmptyState from "@/components/ui/EmptyState";
import SafeImage from "@/components/SafeImage";
import { SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { csvToObjects, downloadCsvTemplate } from "@/lib/bulkCsv";
import ImageUploader from "@/components/ImageUploader";
import ImageUploadField from "@/components/ui/ImageUploadField";
import BoostModal from "@/components/products/BoostModal";
import { useSiteTexts } from "@/lib/siteTexts";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ["BUYER", "FARMER", "STORE", "AGRONOMIST", "DELIVERY_PARTNER", "MODERATOR", "ADMIN", "SUPER_ADMIN"];
function getOrderStatusLabel(status, t) { const labels = { PENDING: "admin.order.pending", PAID: "admin.order.paid", PROCESSING: "admin.order.processing", SHIPPED: "admin.order.shipped", DELIVERED: "admin.order.delivered", CANCELLED: "admin.order.cancelled", REFUNDED: "admin.order.refunded" }; return t(labels[status] || status, status); }
const ORDER_STATUS_COLORS = { PENDING: "badge-yellow", PAID: "badge-blue", PROCESSING: "badge-purple", SHIPPED: "badge-blue", DELIVERED: "badge-green", CANCELLED: "badge-red", REFUNDED: "badge-gray" };
const ORDER_STATUS_LABELS = { PENDING: "Gözləyir", PAID: "Ödənilib", PROCESSING: "Hazırlanır", SHIPPED: "Göndərilib", DELIVERED: "Çatdırılıb", CANCELLED: "Ləğv edilib", REFUNDED: "Geri qaytarılıb" };
const PRODUCT_STATUS_COLORS = { PENDING_REVIEW: "badge-yellow", ACTIVE: "badge-green", REJECTED: "badge-red", SOLD: "badge-blue", DRAFT: "badge-gray", EXPIRED: "badge-gray" };

const SIDEBAR_GROUPS_DEF = [
  {
    label: "Əsas", items: [
      { id: "stats", icon: "dashboard", label: "Statistika" },
      { id: "activity", icon: "zap", label: "Fəaliyyət" },
    ]
  },
  {
    label: "Analitika", items: [
      { id: "analytics", icon: "trendingUp", label: "Analitika" },
    ]
  },
  {
    label: "Marketpleys", items: [
      { id: "pending", icon: "clock", label: "Gözləyən", badge: "pending" },
      { id: "allListings", icon: "clipboard", label: "Bütün Elanlar" },
      { id: "corporate", icon: "building", label: "Korporativ" },
      { id: "categories", icon: "grid", label: "Kateqoriyalar" },
      { id: "brands", icon: "tag", label: "Brendlər" },
      { id: "stores", icon: "store", label: "Mağazalar" },
      { id: "bulkUpload", icon: "upload", label: "Toplu Yükləmə" },
    ]
  },
  {
    label: "Xidmətlər", items: [
      { id: "agro_services", icon: "clipboard", label: "Xidmət Müraciətləri" },
    ]
  },
  {
    label: "Sifarişlər", items: [
      { id: "orders", icon: "package", label: "Sifarişlər" },
      { id: "wallet", icon: "wallet", label: "Cüzdan" },
      { id: "coupons", icon: "tag", label: "Kuponlar" },
    ]
  },
  {
    label: "İcmalar", items: [
      { id: "users", icon: "user", label: "İstifadəçilər" },
      { id: "reviews", icon: "star", label: "Rəylər", badge: "reviews" },
      { id: "bundles", icon: "gift", label: "Paketlər" },
    ]
  },
  {
    label: "Məzmun", items: [
      { id: "blog", icon: "fileText", label: "Bloq" },
      { id: "campaigns", icon: "bell", label: "Kampaniyalar" },
      { id: "adslots", icon: "image", label: "Reklam Yeri" },
      { id: "notify", icon: "bell", label: "Bildirişlər" },
      { id: "slider", icon: "image", label: "Slayder" },
      { id: "site-texts", icon: "edit", label: "Məzmun İdarəsi" },
    ]
  },
  {
    label: "Sistem", items: [
      { id: "ai-agent", icon: "zap", label: "AI Köməkçi" },
      { id: "ai-settings", icon: "bot", label: "AI Parametrləri" },
      { id: "emails", icon: "mail", label: "E-poçtlar" },
      { id: "user-modules", icon: "settings", label: "Modullar" },
      { id: "studio", icon: "component", label: "Studiya" },
      { id: "messages", icon: "message", label: "Mesajlar" },
      { id: "profile", icon: "user", label: "Profil" },
      { id: "support", icon: "info", label: "Dəstək" },
    ]
  },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AdminSidebar({ tab, setTab, badges, collapsed, setCollapsed, t }) {
  return (
    <aside className={`${collapsed ? "w-[72px]" : "w-64"} hidden md:flex flex-col bg-white border-r border-[var(--border)] transition-all duration-300 ease-in-out shrink-0 sticky top-0 z-20 overflow-hidden`} style={{ height: '100vh' }}>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-4"} py-4 border-b border-[var(--border)] shrink-0`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Icon name="shield" size={16} strokeWidth={2} />
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">Admin</span>
          </div>
        )}
        <button onClick={() => setCollapsed(v => !v)} className="p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700" aria-label="Toggle Sidebar">
          <Icon name={collapsed ? "arrowRight" : "arrowLeft"} size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-0.5 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
        {SIDEBAR_GROUPS_DEF.map(group => (
          <div key={group.label} className="mb-1.5">
            {!collapsed && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5">{t(group.label, group.label)}</p>}
            {group.items.map(item => {
              const badgeNum = item.badge === "pending" ? badges?.pendingProducts : item.badge === "reviews" ? badges?.pendingReviews : 0;
              return (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    tab === item.id
                      ? "bg-brand-50 text-brand-700 font-semibold shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}>
                  <Icon name={item.icon} size={18} className={`shrink-0 ${tab === item.id ? "text-brand-600" : "text-gray-400"}`} strokeWidth={tab === item.id ? 2 : 1.8} />
                  {!collapsed && <span className="flex-1 text-left truncate">{t(item.label, item.label)}</span>}
                  {!collapsed && badgeNum > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{badgeNum}</span>
                  )}
                  {collapsed && badgeNum > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ─── Mobile Tab Bar ───────────────────────────────────────────────────────────
function AdminMobileNav({ tab, setTab }) {
  const allItems = SIDEBAR_GROUPS_DEF.flatMap(g => g.items);
  return (
    <div className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[var(--border)] overflow-x-auto no-scrollbar">
      <div className="flex px-2 py-2 gap-1.5 min-w-max">
        {allItems.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              tab === item.id
                ? "bg-brand-50 text-brand-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}>
            <Icon name={item.icon} size={14} />{item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
function DashboardStats({ stats, loading }) {
  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">{[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}</div>;
  if (!stats) return null;
  const cards = [
    { icon: "user", label: "Ümumi İstifadəçi", value: stats.users.total, change: null, color: "brand" },
    { icon: "checkCircle", label: "Aktiv Elan", value: stats.products.active, color: "brand" },
    { icon: "clock", label: "Moderasiya Gözləyir", value: stats.products.pending, color: "amber" },
    { icon: "package", label: "Ümumi Sifariş", value: stats.orders.total, color: "blue" },
    { icon: "wallet", label: "Bu Ay Gəlir (AZN)", value: stats.revenue.thisMonth, suffix: "", prefix: "₼", color: "brand", change: stats.revenue.growth },
    { icon: "store", label: "Mağazalar", value: stats.stores.total, color: "purple" },
    { icon: "star", label: "Gözləyən Rəy", value: stats.reviews.pending, color: "amber" },
    { icon: "bell", label: "Aktiv Kampaniya", value: stats.campaigns.active, color: "blue" },
  ];
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="section-title mb-1">İdarə Paneli</h2>
        <p className="section-subtitle">Real vaxt iş göstəriciləri</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
      {/* Revenue highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
        <div className="card p-4 sm:p-5 md:col-span-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ümumi Dövriyyə</p>
            <p className="text-3xl font-extrabold text-brand-700 mt-1">₼{Number(stats.revenue.total).toLocaleString("az-AZ")}</p>
            <p className="text-xs text-gray-500 mt-1">Bu ay: ₼{Number(stats.revenue.thisMonth).toLocaleString("az-AZ")} <span className={`ml-2 font-semibold ${Number(stats.revenue.growth) >= 0 ? "text-emerald-600" : "text-red-500"}`}><Icon name={Number(stats.revenue.growth) >= 0 ? "arrowUp" : "arrowDown"} size={12} className="inline mr-0.5" />{Math.abs(Number(stats.revenue.growth))}%</span></p>
          </div>
          <div className="text-gray-300 opacity-20"><Icon name="trendingUp" size={48} /></div>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">İstifadəçi Durumu</p>
          <div className="mt-3 space-y-2.5">
            <div className="flex justify-between items-center text-sm"><span className="text-gray-600">Aktiv</span><span className="font-bold text-emerald-600">{stats.users.active}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-600">Askıya alınmış</span><span className="font-bold text-amber-600">{stats.users.suspended}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-600">Banlı</span><span className="font-bold text-red-600">{stats.users.banned}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────
function RecentActivity({ activity, loading }) {
  if (loading) return <SkeletonList />;
  if (!activity?.length) return <EmptyState icon="zap" title="Fəaliyyət yoxdur" />;
  const ACTION_ICONS = { REVIEW_CREATED: "star", REVIEW_APPROVED: "checkCircle", REVIEW_REJECTED: "closeCircle", ORDER_CREATED: "package", USER_BANNED: "ban", PRODUCT_APPROVED: "checkCircle", LOGIN: "key" };
  return (
    <div className="space-y-4">
      <h2 className="section-title">Son Fəaliyyət</h2>
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {activity.map(log => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <span className="shrink-0 mt-0.5 text-gray-500"><Icon name={ACTION_ICONS[log.action] || "info"} size={18} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500 truncate">{log.user?.fullName || "System"} · {log.entity}</p>
              </div>
              <p className="text-[11px] text-gray-400 shrink-0">{new Date(log.createdAt).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pending Products (Moderation) ───────────────────────────────────────────
function PendingProducts({ onRefreshStats }) {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();
  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/api/products?status=PENDING_REVIEW&pageSize=50").then(d => {
      setItems(d.products || []);
      if (onRefreshStats) onRefreshStats();
    }).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }, [onRefreshStats]);
  useEffect(() => { load(); }, [load]);
  async function decide(id, status) {
    try {
      await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast(status === "ACTIVE" ? "Elan təsdiqləndi" : "Elan rədd edildi", "success");
      load();
      if (onRefreshStats) onRefreshStats();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  if (loading) return <SkeletonList count={5} />;
  if (!items.length) return <EmptyState icon="checkCircle" title="Moderasiya gözləyən elan yoxdur" subtitle="Bütün elanlar yoxlanılmışdır" />;
  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <h2 className="section-title">Moderasiya Növbəsi</h2>
        <span className="badge badge-yellow">{items.length} gözləyir</span>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left min-w-[200px]">Məhsul</th>
              <th className="table-cell text-left hidden md:table-cell w-44">Satıcı</th>
              <th className="table-cell text-left hidden sm:table-cell w-28">Qiymət</th>
              <th className="table-cell text-right w-40 whitespace-nowrap">Əməl</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="table-row">
                <td className="table-cell"><p className="font-medium line-clamp-1">{p.titleAz}</p><p className="caption">{p.category?.nameAz}</p></td>
                <td className="table-cell hidden md:table-cell text-gray-600">{p.seller?.fullName || "—"}</td>
                <td className="table-cell hidden sm:table-cell font-semibold text-brand-700">₼{Number(p.price).toLocaleString("az-AZ")}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => decide(p.id, "ACTIVE")} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12} />Təsdiqlə</button>
                    <button onClick={() => decide(p.id, "REJECTED")} className="btn-danger btn-xs flex items-center gap-1"><Icon name="close" size={12} />Rədd et</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Users Manager ────────────────────────────────────────────────────────────
function UsersManager() {
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [roleFilter, setRoleFilter] = useState(""); const [statusFilter, setStatusFilter] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [pwUser, setPwUser] = useState(null);
  const [pwValue, setPwValue] = useState("");
  const [walletUser, setWalletUser] = useState(null);
  const [walletData, setWalletData] = useState({ balance: 0, coins: 0, loading: false });
  const [walletSaving, setWalletSaving] = useState(false);
  const { toast, ToastContainer } = useToast();
  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ pageSize: 100, ...(search && { search }), ...(roleFilter && { role: roleFilter }), ...(statusFilter && { status: statusFilter }) });
    apiFetch(`/api/admin/users?${q}`).then(d => setUsers(d.users || [])).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);
  async function updateUser(id, data) {
    try { await apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }); toast("Güncəlləndi"); setUsers(p => p.map(u => u.id === id ? { ...u, ...data } : u)); } catch (e) { toast(e.message, "error"); }
  }
  async function deleteUser(id) {
    if (!confirm("Bu istifadəçini və bütün məlumatlarını silmək istədiyinizə əminsiniz? Bu geri alına bilməz!")) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      setUsers(p => p.filter(u => u.id !== id));
      toast("İstifadəçi silindi");
    } catch (e) { toast(e.message, "error"); }
  }
  async function saveEdit() {
    if (!editUser) return;
    try {
      const res = await apiFetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH", body: JSON.stringify({
          fullName: editUser.fullName, email: editUser.email, phone: editUser.phone || null, username: editUser.username || null
        })
      });
      const updated = res?.user || {};
      setUsers(p => p.map(u => u.id === editUser.id ? { ...u, ...updated, fullName: editUser.fullName, email: editUser.email, phone: editUser.phone, username: editUser.username } : u));
      toast("Profil güncəlləndi");
      setEditUser(null);
    } catch (e) { toast(e.message, "error"); }
  }
  async function changePassword() {
    if (!pwUser || !pwValue) return;
    if (pwValue.length < 6) { toast("Şifrə ən azı 6 simvol olmalıdır", "error"); return; }
    try {
      await apiFetch(`/api/admin/users/${pwUser.id}`, { method: "PATCH", body: JSON.stringify({ newPassword: pwValue }) });
      toast("Şifrə dəyişdirildi");
      setPwUser(null);
      setPwValue("");
    } catch (e) { toast(e.message, "error"); }
  }
  async function openWallet(user) {
    setWalletUser(user);
    setWalletData({ balance: 0, coins: 0, loading: true });
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/wallet`);
      setWalletData({ balance: Number(res.wallet?.balance || 0), coins: Number(res.wallet?.coins || 0), loading: false });
    } catch (e) {
      toast(e.message, "error");
      setWalletData({ balance: 0, coins: 0, loading: false });
    }
  }
  async function saveWallet() {
    if (!walletUser) return;
    setWalletSaving(true);
    try {
      await apiFetch(`/api/admin/users/${walletUser.id}/wallet`, {
        method: "PATCH", body: JSON.stringify({
          balance: walletData.balance,
          coins: walletData.coins
        })
      });
      toast("Balans güncəlləndi");
      setWalletUser(null);
    } catch (e) { toast(e.message, "error"); }
    finally { setWalletSaving(false); }
  }
  const STATUS_COLOR = { ACTIVE: "badge-green", PENDING_VERIFICATION: "badge-yellow", SUSPENDED: "badge-yellow", BANNED: "badge-red" };
  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">İstifadəçilər</h2>
        <span className="badge badge-gray">{users.length} nəticə</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <input placeholder="Ad, email axtar..." value={search} onChange={e => setSearch(e.target.value)} className="input-sm flex-1 min-w-48" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select-field w-auto text-xs py-2">
          <option value="">Bütün rollar</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-auto text-xs py-2">
          <option value="">Bütün statuslar</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="PENDING_VERIFICATION">Gözləyir</option>
          <option value="SUSPENDED">Dondurulub</option>
          <option value="BANNED">Banlı</option>
        </select>
      </div>
      {loading ? <SkeletonList count={6} /> : !users.length ? <EmptyState icon="user" title="İstifadəçi tapılmadı" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="table-header"><tr>
              <th className="table-cell text-left min-w-[200px]">İstifadəçi</th>
              <th className="table-cell text-left w-36 whitespace-nowrap">Rol</th>
              <th className="table-cell text-left w-32 whitespace-nowrap">Status</th>
              <th className="table-cell text-right w-auto whitespace-nowrap">Əməl</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">{u.fullName?.[0]}</div>
                      <div className="min-w-0"><p className="font-medium text-sm truncate">{u.fullName}</p><p className="caption truncate">{u.email}</p>{u.phone && <p className="caption text-brand-600 truncate">{u.phone}</p>}</div>
                    </div>
                  </td>
                  <td className="table-cell w-36 whitespace-nowrap">
                    <select defaultValue={u.role} onChange={e => updateUser(u.id, { role: e.target.value })} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="table-cell w-32 whitespace-nowrap">
                    <select defaultValue={u.status} onChange={e => updateUser(u.id, { status: e.target.value })} className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 ${u.status === "ACTIVE" ? "bg-green-50 border-green-200 text-green-700" : u.status === "BANNED" ? "bg-red-50 border-red-200 text-red-700" : u.status === "SUSPENDED" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
                      <option value="ACTIVE">Aktiv</option>
                      <option value="PENDING_VERIFICATION">Gözləyir</option>
                      <option value="SUSPENDED">Dondurulub</option>
                      <option value="BANNED">Banlı</option>
                    </select>
                  </td>
                  <td className="table-cell text-right whitespace-nowrap">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => setEditUser({ ...u })} className="btn-secondary btn-xs flex items-center gap-1 shrink-0" title="Profil Redaktə"><Icon name="edit" size={12} />Redaktə</button>
                      {u.status !== "BANNED" && <button onClick={() => updateUser(u.id, { status: "BANNED" })} className="btn-danger btn-xs shrink-0">Ban</button>}
                      {u.status === "BANNED" && <button onClick={() => updateUser(u.id, { status: "ACTIVE" })} className="btn-secondary btn-xs shrink-0">Aktivləşdir</button>}
                      {u.status === "ACTIVE" && <button onClick={() => updateUser(u.id, { status: "SUSPENDED" })} className="btn-secondary btn-xs shrink-0">Dondurul</button>}
                      <button onClick={() => { setPwUser(u); setPwValue(""); }} className="btn-secondary btn-xs flex items-center gap-1 shrink-0" title="Şifrəni Dəyiş"><Icon name="lock" size={12} />Şifrə</button>
                      <button onClick={() => openWallet(u)} className="btn-secondary btn-xs flex items-center gap-1 shrink-0" title="Balans"><Icon name="wallet" size={12} />Balans</button>
                      <button onClick={() => deleteUser(u.id)} className="btn-danger btn-xs flex items-center gap-1 shrink-0" title="Sil"><Icon name="trash" size={12} />Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Profil Redaktə</h3>
              <button onClick={() => setEditUser(null)} className="btn-icon"><Icon name="x" size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Ad Soyad</label>
                <input value={editUser.fullName || ""} onChange={e => setEditUser({ ...editUser, fullName: e.target.value })} className="input-sm w-full" placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
                <input value={editUser.email || ""} onChange={e => setEditUser({ ...editUser, email: e.target.value })} className="input-sm w-full" placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Telefon</label>
                <input value={editUser.phone || ""} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} className="input-sm w-full" placeholder="+994..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">İstifadəçi adı</label>
                <input value={editUser.username || ""} onChange={e => setEditUser({ ...editUser, username: e.target.value })} className="input-sm w-full" placeholder="username" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setEditUser(null)} className="btn-secondary px-4 py-2 text-sm rounded-xl">İmtina</button>
              <button onClick={saveEdit} className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-1"><Icon name="check" size={14} />Yadda saxla</button>
            </div>
          </div>
        </div>
      )}
      {pwUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setPwUser(null); setPwValue(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Şifrə Dəyiş</h3>
              <button onClick={() => { setPwUser(null); setPwValue(""); }} className="btn-icon"><Icon name="x" size={18} /></button>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">İstifadəçi: <strong>{pwUser.fullName}</strong> ({pwUser.email})</p>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Yeni şifrə</label>
              <input type="password" value={pwValue} onChange={e => setPwValue(e.target.value)} className="input-sm w-full" placeholder="Ən azı 6 simvol" minLength={6} />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button onClick={() => { setPwUser(null); setPwValue(""); }} className="btn-secondary px-4 py-2 text-sm rounded-xl">İmtina</button>
              <button onClick={changePassword} className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-1"><Icon name="check" size={14} />Şifrəni Dəyiş</button>
            </div>
          </div>
        </div>
      )}
      {walletUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setWalletUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Balans İdarəetmə</h3>
              <button onClick={() => setWalletUser(null)} className="btn-icon"><Icon name="x" size={18} /></button>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-3">İstifadəçi: <strong>{walletUser.fullName}</strong> ({walletUser.email})</p>
              {walletData.loading ? (
                <div className="text-sm text-gray-400 py-4 text-center">Balans yüklənir...</div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Balans (AZN)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={walletData.balance}
                      onChange={e => setWalletData({ ...walletData, balance: parseFloat(e.target.value) || 0 })}
                      className="input-sm w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Coin / Bonus xal</label>
                    <input
                      type="number"
                      step="0.01"
                      value={walletData.coins}
                      onChange={e => setWalletData({ ...walletData, coins: parseFloat(e.target.value) || 0 })}
                      className="input-sm w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                    ⚠ Dəyişiklik audit log-a yazılacaq. Mənfi balans təyin etmək mümkündür, diqqətli olun.
                  </div>
                </div>
              )}
            </div>
            {!walletData.loading && (
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button onClick={() => setWalletUser(null)} className="btn-secondary px-4 py-2 text-sm rounded-xl">İmtina</button>
                <button onClick={saveWallet} disabled={walletSaving} className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-1 disabled:opacity-50">
                  <Icon name="check" size={14} />{walletSaving ? "Saxlanılır..." : "Yadda saxla"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders Manager ───────────────────────────────────────────────────────────
function OrdersAll() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [receiptModal, setReceiptModal] = useState(null); // { url, note, orderId, total, paymentMethod }
  const { toast, ToastContainer } = useToast();
  useEffect(() => { load(); }, [statusFilter]);
  function load() {
    setLoading(true);
    const q = new URLSearchParams({ pageSize: 100, ...(statusFilter && { status: statusFilter }) });
    apiFetch(`/api/orders?${q}`).then(d => setOrders(d.orders || [])).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }
  async function changeStatus(id, status) {
    try { await apiFetch(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); toast("Status dəyişdirildi"); load(); } catch (e) { toast(e.message, "error"); }
  }

  const getPayMethodBadge = (provider) => {
    switch (provider) {
      case "BANK_CARD": return <span className="badge badge-blue">💳 Bank Kartı</span>;
      case "M10": return <span className="badge badge-purple">📱 M10</span>;
      case "WALLET": return <span className="badge badge-green">👛 Daxili Balans</span>;
      case "CASH_ON_DELIVERY": return <span className="badge badge-yellow">💵 Qapıda Nağd</span>;
      default: return <span className="badge badge-gray">{provider || "Nağd"}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Sifarişlər</h2>
      </div>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-auto">
        <option value="">Bütün statuslar</option>
        {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {loading ? <SkeletonList count={5} /> : !orders.length ? <EmptyState icon="package" title="Sifariş tapılmadı" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="table-header"><tr>
              <th className="table-cell text-left w-32">Sifariş</th>
              <th className="table-cell text-left hidden sm:table-cell min-w-[140px]">Alıcı</th>
              <th className="table-cell text-left w-24">Məbləğ</th>
              <th className="table-cell text-left w-44">Ödəniş & Qəbz</th>
              <th className="table-cell text-left w-28">Status</th>
              <th className="table-cell text-right w-36">Dəyişdir</th>
            </tr></thead>
            <tbody>
              {orders.map(o => {
                const receiptUrl = o.payment?.rawResponse?.receiptUrl || (o.payment?.providerRef?.startsWith("http") || o.payment?.providerRef?.startsWith("/uploads") ? o.payment?.providerRef : null);
                const note = o.payment?.rawResponse?.transactionNote || (!receiptUrl ? o.payment?.providerRef : null);
                return (
                  <tr key={o.id} className="table-row">
                    <td className="table-cell w-32">
                      <p className="font-mono text-xs font-bold text-gray-800">#{o.id.slice(-8).toUpperCase()}</p>
                      <p className="caption">{new Date(o.createdAt).toLocaleDateString("az-AZ")}</p>
                    </td>
                    <td className="table-cell hidden sm:table-cell min-w-[140px]">
                      <p className="font-semibold text-xs text-gray-900">{o.buyer?.fullName || "—"}</p>
                      {o.buyer?.phone && <p className="text-[11px] text-gray-500">{o.buyer?.phone}</p>}
                      {o.shippingCity && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{o.shippingCity}, {o.shippingAddress}</p>}
                    </td>
                    <td className="table-cell font-bold text-brand-700 w-24">
                      ₼{Number(o.total).toLocaleString("az-AZ")}
                    </td>
                    <td className="table-cell w-44">
                      <div className="space-y-1">
                        <div>{getPayMethodBadge(o.payment?.provider)}</div>
                        {receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setReceiptModal({ url: receiptUrl, note, orderId: o.id, total: o.total, paymentMethod: o.payment?.provider })}
                            className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline flex items-center gap-1"
                          >
                            🧾 Qəbzə bax
                          </button>
                        ) : note ? (
                          <p className="text-[10px] text-gray-500 italic truncate max-w-[120px]">Qeyd: {note}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="table-cell w-28">
                      <span className={`badge ${ORDER_STATUS_COLORS[o.status] || "badge-gray"}`}>{ORDER_STATUS_LABELS[o.status] || o.status}</span>
                    </td>
                    <td className="table-cell text-right w-36">
                      <select defaultValue={o.status} onChange={e => changeStatus(o.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400">
                        {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Modal Preview */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setReceiptModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Ödəniş Qəbzi</h3>
                <p className="text-xs text-gray-500">Sifariş: #{receiptModal.orderId?.slice(-8).toUpperCase()} · ₼{Number(receiptModal.total).toFixed(2)}</p>
              </div>
              <button onClick={() => setReceiptModal(null)} className="btn-icon"><Icon name="x" size={18} /></button>
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
                className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
              >
                Orijinal faylı aç
              </a>
              <button onClick={() => setReceiptModal(null)} className="btn-primary px-4 py-2 text-xs font-bold rounded-xl">
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reviews Manager ──────────────────────────────────────────────────────────
function ReviewsManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const { toast, ToastContainer } = useToast();
  useEffect(() => { load(); }, [filter]);
  function load() {
    setLoading(true);
    apiFetch(`/api/admin/reviews?filter=${filter}`)
      .then(d => setItems(d.reviews || [])).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }
  async function approve(id) { try { await apiFetch(`/api/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ isApproved: true }) }); toast("Rəy təsdiqləndi"); setItems(p => p.map(r => r.id === id ? { ...r, isApproved: true } : r)); } catch (e) { toast(e.message, "error"); } }
  async function reject(id) { try { await apiFetch(`/api/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ isApproved: false }) }); toast("Rəy geri çəkildi"); setItems(p => p.map(r => r.id === id ? { ...r, isApproved: false } : r)); } catch (e) { toast(e.message, "error"); } }
  async function del(id) { if (!confirm("Bu rəyi silmək istədiyinizə əminsiniz?")) return; try { await apiFetch(`/api/reviews/${id}`, { method: "DELETE" }); setItems(p => p.filter(r => r.id !== id)); toast("Rəy silindi"); } catch (e) { toast(e.message, "error"); } }
  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Rəylər</h2>
        {filter === "pending" && items.length > 0 && <span className="badge badge-yellow">{items.length} gözləyir</span>}
      </div>
      <div className="flex gap-1">
        {[["pending", "Gözləyən"], ["approved", "Aktiv"], ["all", "Hamısı"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`btn-sm ${filter === v ? "btn-primary" : "btn-secondary"}`}>{l}</button>
        ))}
      </div>
      {loading ? <SkeletonList count={4} /> : !items.length ? <EmptyState icon="star" title="Rəy tapılmadı" /> : (
        <div className="space-y-2">
          {items.map(r => (
            <div key={r.id} className={`card p-4 border-l-4 ${r.isApproved ? "border-l-emerald-400" : "border-l-amber-400"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{r.author?.fullName}</span>
                    <span className="text-amber-500 text-sm">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" size={14} className={i < r.rating ? "fill-amber-400 text-amber-500 inline" : "text-gray-300 inline"} />)}</span>
                    <span className={`badge ${r.isApproved ? "badge-green" : "badge-yellow"}`}>{r.isApproved ? "Aktiv" : "Gözləmədə"}</span>
                  </div>
                  <p className="caption truncate">{r.product?.titleAz}</p>
                  {r.comment && <p className="text-sm text-gray-700 mt-1">{r.comment}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!r.isApproved ? <button onClick={() => approve(r.id)} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12} />Təsdiqlə</button> : <button onClick={() => reject(r.id)} className="btn-secondary btn-xs">Geri çək</button>}
                  <button onClick={() => del(r.id)} className="text-[11px] text-red-500 hover:underline">Sil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Categories Manager ───────────────────────────────────────────────────────
function CategoriesManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nameAz: "", slug: "", icon: "", isActive: true, parentId: "" });
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const { toast, ToastContainer } = useToast();
  useEffect(() => { apiFetch("/api/categories?all=true").then(d => setItems(d.categories || [])).finally(() => setLoading(false)); }, []);
  async function create(e) { e.preventDefault(); setErr(""); try { const d = await apiFetch("/api/categories", { method: "POST", body: JSON.stringify(form) }); setItems(p => [...p, d.category]); setForm({ nameAz: "", slug: "", icon: "", isActive: true, parentId: "" }); toast("Kateqoriya əlavə edildi"); } catch (e) { setErr(e.message); } }
  async function toggleActive(id, val) { try { await apiFetch(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: val }) }); setItems(p => p.map(c => c.id === id ? { ...c, isActive: val } : c)); toast("Yeniləndi"); } catch (e) { toast(e.message, "error"); } }
  async function deleteCategory(id, name) { if (!confirm(`"${name}" kateqoriyasını silmək istədiyinizə əminsiniz?`)) return; try { const d = await apiFetch(`/api/categories/${id}`, { method: "DELETE" }); setItems(p => p.filter(c => c.id !== id)); if (d.note) { toast(d.note, "error"); } else { toast("Kateqoriya silindi"); } } catch (e) { toast(e.message, "error"); } }
  const parents = items.filter(c => !c.parentId);
  return (
    <div className="space-y-5">
      <ToastContainer />
      <h2 className="section-title">Kateqoriyalar</h2>
      <form onSubmit={create} className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><label className="label">Ad (AZ)</label><input required value={form.nameAz} onChange={e => setForm(p => ({ ...p, nameAz: e.target.value }))} className="input-field" /></div>
        <div><label className="label">Slug</label><input required value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="input-field" placeholder="meyvə-tərəvəz" /></div>
        <div><label className="label">İkon</label><input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="input-field" placeholder="sprout" /></div>
        <div className="col-span-2 md:col-span-1"><label className="label">Valideyn kateqoriya</label>
          <select value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))} className="select-field">
            <option value="">— Ana kateqoriya —</option>
            {parents.map(c => <option key={c.id} value={c.id}>{c.icon} {c.nameAz}</option>)}
          </select>
        </div>
        {err && <p className="col-span-full text-sm text-red-600">{err}</p>}
        <div className="col-span-full"><button type="submit" className="btn-primary">Əlavə et</button></div>
      </form>
      {loading ? <SkeletonList count={4} /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[500px] text-left"><thead className="table-header"><tr><th className="table-cell text-left min-w-[180px]">Kateqoriya</th><th className="table-cell text-left hidden sm:table-cell w-40">Slug</th><th className="table-cell text-left hidden md:table-cell w-28">Tip</th><th className="table-cell text-right w-28">Status</th><th className="table-cell text-center w-20">Əməliyyat</th></tr></thead>
            <tbody>{items.map(c => (
              <tr key={c.id} className="table-row">
                <td className="table-cell min-w-[180px] font-medium">{c.icon} {c.nameAz}</td>
                <td className="table-cell hidden sm:table-cell w-40"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{c.slug}</code></td>
                <td className="table-cell hidden md:table-cell w-28"><span className={`badge ${c.parentId ? "badge-blue" : "badge-purple"}`}>{c.parentId ? "Alt" : "Ana"}</span></td>
                <td className="table-cell text-right w-28">
                  <button onClick={() => toggleActive(c.id, !c.isActive)} className={`badge cursor-pointer ${c.isActive ? "badge-green" : "badge-gray"}`}>{c.isActive ? "Aktiv" : "Deaktiv"}</button>
                </td>
                <td className="table-cell text-center w-20">
                  <button onClick={() => deleteCategory(c.id, c.nameAz)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Sil"><Icon name="trash" size={16} /></button>
                </td>
              </tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ─── Wallet Withdrawals ───────────────────────────────────────────────────────
function WalletWithdrawalsManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const { toast, ToastContainer } = useToast();

  useEffect(() => { load(); }, [filter]);
  function load() {
    setLoading(true);
    apiFetch(`/api/admin/wallet-withdrawals?status=${filter}`)
      .then(d => setItems(d.transactions || []))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }
  async function decide(id, action) {
    try {
      await apiFetch(`/api/admin/wallet-withdrawals/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
      toast(action === "approve" ? "Ödəniş təsdiqləndi" : "Ödəniş rədd edildi — məbləğ geri qaytarıldı");
      setItems(p => p.filter(r => r.id !== id));
    } catch (e) { toast(e.message, "error"); }
  }

  const totalAmount = items.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Pul Kisəsi — Çıxarış Tələbləri</h2>
          {items.length > 0 && <p className="caption">Cəmi: <span className="font-bold text-brand-700">₼{totalAmount.toLocaleString("az-AZ")}</span></p>}
        </div>
        <div className="flex gap-2">
          {[["PENDING", "Gözləyən"], ["COMPLETED", "Tamamlanmış"], ["REJECTED", "Rədd edilmiş"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`btn-xs ${filter === v ? "btn-primary" : "btn-secondary"}`}>{l}</button>
          ))}
        </div>
      </div>
      {loading ? <SkeletonList count={3} /> : !items.length ? <EmptyState icon="wallet" title="Tələb tapılmadı" /> : (
        <div className="space-y-3">
          {items.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold shrink-0">
                    {r.wallet?.user?.fullName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.wallet?.user?.fullName || "—"}</p>
                    <p className="caption">{r.wallet?.user?.email}</p>
                    <p className="caption">{r.wallet?.user?.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-brand-700">₼{Number(r.amount).toLocaleString("az-AZ")}</p>
                  <p className="caption">{new Date(r.createdAt).toLocaleDateString("az-AZ")}</p>
                  {r.description && <p className="text-xs text-gray-400 mt-1 max-w-48">{r.description}</p>}
                </div>
              </div>
              {filter === "PENDING" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => decide(r.id, "approve")} className="btn-primary btn-xs flex-1 flex items-center justify-center gap-1"><Icon name="check" size={12} />Təsdiqlə</button>
                  <button onClick={() => decide(r.id, "reject")} className="btn-danger btn-xs flex-1 flex items-center justify-center gap-1"><Icon name="close" size={12} />Rədd et</button>
                </div>
              )}
              {filter !== "PENDING" && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className={`badge ${filter === "COMPLETED" ? "badge-green" : "badge-red"}`}>
                    {filter === "COMPLETED" ? <span className="flex items-center gap-1 text-emerald-600"><Icon name="checkCircle" size={14} />Tamamlandı</span> : <span className="flex items-center gap-1 text-red-500"><Icon name="closeCircle" size={14} />Rədd edildi</span>}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Blog Manager ─────────────────────────────────────────────────────────────
function BlogManager() {
  const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ titleAz: "", contentAz: "", category: "tips", isPublished: false });
  const [creating, setCreating] = useState(false);
  const { toast, ToastContainer } = useToast();
  useEffect(() => { apiFetch("/api/blog?pageSize=50").then(d => setPosts(d.posts || [])).finally(() => setLoading(false)); }, []);
  async function create(e) {
    e.preventDefault(); setCreating(true);
    try { const d = await apiFetch("/api/blog", { method: "POST", body: JSON.stringify(form) }); setPosts(p => [d.post, ...p]); setForm({ titleAz: "", contentAz: "", category: "tips", isPublished: false }); toast("Bloq yazısı əlavə edildi"); } catch (e) { toast(e.message, "error"); } finally { setCreating(false); }
  }
  async function del(id) { if (!confirm("Silmək istədiyinizə əminsiniz?")) return; try { await apiFetch(`/api/blog/${id}`, { method: "DELETE" }); setPosts(p => p.filter(x => x.id !== id)); toast("Silindi"); } catch (e) { toast(e.message, "error"); } }
  return (
    <div className="space-y-5">
      <ToastContainer />
      <h2 className="section-title">Bloq İdarəetmə</h2>
      <form onSubmit={create} className="card p-5 space-y-3">
        <p className="heading-sm">Yeni Yazı</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Başlıq (AZ)</label><input required value={form.titleAz} onChange={e => setForm(p => ({ ...p, titleAz: e.target.value }))} className="input-field" /></div>

          <div className="col-span-2"><label className="label">Kateqoriya</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="select-field">
              <option value="tips">Tövsiyyə</option><option value="news">Xəbər</option><option value="market">Bazar</option><option value="agronomy">Aqronomiya</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">Məzmun (AZ)</label><textarea required rows={4} value={form.contentAz} onChange={e => setForm(p => ({ ...p, contentAz: e.target.value }))} className="input-field" /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="pub" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} /><label htmlFor="pub" className="text-sm font-medium">Dərc et</label></div>
        </div>
        <button type="submit" disabled={creating} className="btn-primary">{creating ? "Yüklənir..." : "Əlavə et"}</button>
      </form>
      {loading ? <SkeletonList count={3} /> : !posts.length ? <EmptyState icon="fileText" title="Bloq yazısı yoxdur" /> : (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{p.titleAz}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${p.isPublished ? "badge-green" : "badge-gray"}`}>{p.isPublished ? "Dərc edilib" : "Qaralama"}</span>
                  <span className="caption">{new Date(p.createdAt).toLocaleDateString("az-AZ")}</span>
                </div>
              </div>
              <button onClick={() => del(p.id)} className="btn-icon text-red-500"><Icon name="trash" size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Push Notify ──────────────────────────────────────────────────────────────
function PushBroadcastManager() {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [sending, setSending] = useState(false);
  const { toast, ToastContainer } = useToast();
  async function send(e) {
    e.preventDefault(); setSending(true);
    try { const d = await apiFetch("/api/admin/push/broadcast", { method: "POST", body: JSON.stringify({ title, body }) }); toast(`${d.sent || 0} abunəçiyə göndərildi`); setTitle(""); setBody(""); } catch (e) { toast(e.message, "error"); } finally { setSending(false); }
  }
  return (
    <div className="space-y-5">
      <ToastContainer />
      <h2 className="section-title">Push Bildirişi Göndər</h2>
      <form onSubmit={send} className="card p-5 space-y-4 max-w-md">
        <div><label className="label">Başlıq</label><input required value={title} onChange={e => setTitle(e.target.value)} className="input-field" /></div>
        <div><label className="label">Məzmun</label><textarea required rows={3} value={body} onChange={e => setBody(e.target.value)} className="input-field" /></div>
        <button type="submit" disabled={sending} className="btn-primary">{sending ? "Göndərilir..." : <span className="flex items-center gap-1"><Icon name="upload" size={16} />Hamıya Göndər</span>}</button>
      </form>
    </div>
  );
}

// ─── Brands Manager ───────────────────────────────────────────────────────────
function BrandsManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", logoUrl: "", country: "", website: "", description: "", isActive: true });
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { toast, ToastContainer } = useToast();
  useEffect(() => { apiFetch("/api/brands?all=true").then(d => setItems(d.brands || [])).finally(() => setLoading(false)); }, []);
  async function handleSubmit(e) {
    e.preventDefault(); setErr("");
    try {
      const payload = {
        name: form.name.trim(),
        logoUrl: form.logoUrl?.trim() || undefined,
        country: form.country?.trim() || undefined,
        website: form.website?.trim() || undefined,
        description: form.description?.trim() || undefined,
        isActive: form.isActive
      };
      if (editingId) {
        const d = await apiFetch(`/api/brands/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setItems(p => p.map(b => b.id === editingId ? { ...b, ...d.brand } : b));
        toast("Brend yeniləndi", "success");
      } else {
        const d = await apiFetch("/api/brands", { method: "POST", body: JSON.stringify(payload) });
        if (d?.brand) {
          setItems(p => [...p, d.brand]);
        }
        toast("Brend əlavə edildi", "success");
      }
      setForm({ name: "", logoUrl: "", country: "", website: "", description: "", isActive: true });
      setEditingId(null); setShowModal(false);
    } catch (e) {
      setErr(e.message || "Xəta baş verdi");
      toast(e.message || "Xəta baş verdi", "error");
    }
  }
  function openEdit(b) { setEditingId(b.id); setForm({ name: b.name || "", logoUrl: b.logoUrl || "", country: b.country || "", website: b.website || "", description: b.description || "", isActive: b.isActive ?? true }); setErr(""); setShowModal(true); }
  function openCreate() { setEditingId(null); setForm({ name: "", logoUrl: "", country: "", website: "", description: "", isActive: true }); setErr(""); setShowModal(true); }
  async function toggleActive(id, val) { try { await apiFetch(`/api/brands/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: val }) }); setItems(p => p.map(b => b.id === id ? { ...b, isActive: val } : b)); toast("Yeniləndi"); } catch (e) { toast(e.message, "error"); } }
  async function deleteBrand(id, name) { if (!confirm(`"${name}" brendini silmək istədiyinizə əminsiniz?`)) return; try { await apiFetch(`/api/brands/${id}`, { method: "DELETE" }); setItems(p => p.filter(b => b.id !== id)); toast("Brend silindi"); } catch (e) { toast(e.message, "error"); } }
  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <h2 className="section-title">Brendlər</h2>
        <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1.5"><Icon name="plus" size={14} />Yeni Brend</button>
      </div>
      {loading ? <SkeletonList count={4} /> : !items.length ? <EmptyState icon="tag" title="Brend tapılmadı" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="table-header"><tr>
              <th className="table-cell text-left min-w-[180px]">Ad</th>
              <th className="table-cell text-left w-32">Ölkə</th>
              <th className="table-cell text-left w-40 hidden md:table-cell">Vebsayt</th>
              <th className="table-cell text-left w-24">Status</th>
              <th className="table-cell text-right w-48 whitespace-nowrap">Əməl</th>
            </tr></thead>
            <tbody>
              {items.map(b => (
                <tr key={b.id} className="table-row">
                  <td className="table-cell min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <span className="text-xs font-black text-brand-600">{b.name?.[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0"><p className="font-medium text-sm truncate">{b.name}</p><p className="caption truncate">{b.slug}</p></div>
                    </div>
                  </td>
                  <td className="table-cell w-32 text-gray-600">{b.country || "—"}</td>
                  <td className="table-cell w-40 hidden md:table-cell">{b.website ? <a href={b.website} target="_blank" rel="noopener" className="text-brand-600 hover:underline truncate block">{b.website}</a> : "—"}</td>
                  <td className="table-cell w-24 whitespace-nowrap">{b.isActive ? <span className="badge badge-green">Aktiv</span> : <span className="badge badge-red">Deaktiv</span>}</td>
                  <td className="table-cell text-right whitespace-nowrap">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(b)} className="btn-secondary btn-xs flex items-center gap-1"><Icon name="edit" size={12} />Redaktə</button>
                      <button onClick={() => toggleActive(b.id, !b.isActive)} className="btn-secondary btn-xs">{b.isActive ? "Deaktiv" : "Aktiv"}</button>
                      <button onClick={() => deleteBrand(b.id, b.name)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12} />Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? "Brendi Redaktə Et" : "Yeni Brend"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Icon name="close" size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{err}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 outline-none" placeholder="Məs: John Deere" />
              </div>

              {/* Direct File / Local Computer Upload or URL */}
              <ImageUploadField
                label="Brend Logosu (Kompüterdən və ya URL)"
                value={form.logoUrl}
                onChange={(val) => setForm(p => ({ ...p, logoUrl: val }))}
                placeholder="https://..."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ölkə</label>
                  <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 outline-none" placeholder="Məs: ABŞ, Almaniya" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vebsayt</label>
                  <input type="url" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 outline-none" placeholder="https://..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 outline-none resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-brand-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">{form.isActive ? "Aktiv" : "Deaktiv"}</span>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">Ləğv et</button>
                <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700">{editingId ? "Yenilə" : "Yarat"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stores Manager ───────────────────────────────────────────────────────────
function StoresManager() {
  const [stores, setStores] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast, ToastContainer } = useToast();
  useEffect(() => {
    setLoading(true);
    apiFetch("/api/stores?all=1&includeStats=1").then(d => setStores(d.stores || [])).finally(() => setLoading(false));
  }, []);
  async function toggle(id, field, val) {
    try {
      const res = await apiFetch(`/api/stores/${id}`, { method: "PATCH", body: JSON.stringify({ [field]: val }) });
      const updatedStore = res?.store;
      setStores(p => p.map(s => s.id === id ? (updatedStore ? { ...s, ...updatedStore } : { ...s, [field]: val }) : s));
      toast(val ? "Aktivləşdirildi" : "Deaktiv edildi");
    } catch (e) { toast(e.message, "error"); }
  }
  async function deleteStore(id, name) {
    if (!confirm(`"${name}" mağazasını silmək istədiyinizə əminsiniz? Məhsullar silinməyəcək, yalnız mağaza bağlantısı qaldırılacaq.`)) return;
    try {
      await apiFetch(`/api/stores/${id}`, { method: "DELETE" });
      setStores(p => p.filter(s => s.id !== id));
      toast("Mağaza silindi");
    } catch (e) { toast(e.message, "error"); }
  }
  const filtered = search ? stores.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner?.fullName?.toLowerCase().includes(search.toLowerCase())
  ) : stores;
  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Mağazalar</h2>
        <span className="badge badge-gray">{stores.length} mağaza</span>
      </div>
      <input placeholder="Mağaza adı, sahib axtar..." value={search} onChange={e => setSearch(e.target.value)} className="input-sm w-full" />
      {loading ? <SkeletonList count={4} /> : !filtered.length ? <EmptyState icon="store" title="Mağaza tapılmadı" /> : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start gap-3 flex-wrap">
                {s.logoUrl && <img src={s.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <div className="flex gap-1">
                      {s.isVerified && <span className="badge badge-green text-[10px] inline-flex items-center gap-1"><Icon name="check" size={10} />Verified</span>}
                      {!s.isVerified && <span className="badge badge-gray text-[10px]">Təsdiqlənməyib</span>}
                      <span className={`badge text-[10px] ${s.isActive ? "badge-green" : "badge-red"}`}>{s.isActive ? "Aktiv" : "Deaktiv"}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 inline-flex items-center gap-1"><Icon name="user" size={12} />{s.owner?.fullName || "—"} {s.owner?.phone && <span className="text-brand-600 font-medium">· {s.owner.phone}</span>}</p>
                  <p className="caption">{s.owner?.email}</p>
                  {s.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.description}</p>}
                  {s._count && <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1"><Icon name="package" size={12} />{s._count.products || 0} məhsul</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {!s.isVerified && <button onClick={() => toggle(s.id, "isVerified", true)} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12} />Doğrula</button>}
                    {s.isVerified && <button onClick={() => toggle(s.id, "isVerified", false)} className="btn-secondary btn-xs">Doğrulanmağı çıxar</button>}
                    <button onClick={() => toggle(s.id, "isActive", !s.isActive)} className={`btn-xs ${s.isActive ? "btn-danger" : "btn-primary"}`}>{s.isActive ? "Deaktiv et" : "Aktivləşdir"}</button>
                    <button onClick={() => deleteStore(s.id, s.name)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12} />Sil</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Coupons Manager ──────────────────────────────────────────────────────────
function CouponsManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", discountType: "PERCENTAGE", discountValue: "10", maxUses: "", isActive: true });
  const { toast, ToastContainer } = useToast();
  useEffect(() => { apiFetch("/api/coupons").then(d => setItems(d.coupons || [])).finally(() => setLoading(false)); }, []);
  async function create(e) { e.preventDefault(); try { const d = await apiFetch("/api/coupons", { method: "POST", body: JSON.stringify({ ...form, discountValue: parseFloat(form.discountValue), maxUses: form.maxUses ? parseInt(form.maxUses) : null }) }); setItems(p => [d.coupon, ...p]); toast("Kupon əlavə edildi"); } catch (e) { toast(e.message, "error"); } }
  return (
    <div className="space-y-5">
      <ToastContainer />
      <h2 className="section-title">Kuponlar</h2>
      <form onSubmit={create} className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><label className="label">Kod</label><input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="input-field font-mono" placeholder="YENI20" /></div>
        <div><label className="label">Tip</label><select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))} className="select-field"><option value="PERCENTAGE">% Faiz</option><option value="FIXED">₼ Sabit</option></select></div>
        <div><label className="label">Dəyər</label><input required type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} className="input-field" /></div>
        <div><label className="label">Max istifadə</label><input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} className="input-field" placeholder="Limitsiz" /></div>
        <div className="col-span-full"><button type="submit" className="btn-primary">Əlavə et</button></div>
      </form>
      {loading ? <SkeletonList count={3} /> : !items.length ? <EmptyState icon="tag" title="Kupon yoxdur" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[440px] text-left">
            <thead className="table-header"><tr><th className="table-cell text-left w-36">Kod</th><th className="table-cell text-left w-28">Endirim</th><th className="table-cell text-left hidden sm:table-cell w-28">İstifadə</th><th className="table-cell text-right w-28">Status</th><th className="table-cell text-center w-20">Əməliyyat</th></tr></thead>
            <tbody>{items.map(c => (
              <tr key={c.id} className="table-row">
                <td className="table-cell w-36"><code className="font-mono font-bold">{c.code}</code></td>
                <td className="table-cell w-28">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₼${c.discountValue}`}</td>
                <td className="table-cell hidden sm:table-cell w-28">{c.usedCount}/{c.maxUses || "∞"}</td>
                <td className="table-cell text-right w-28"><span className={`badge ${c.isActive ? "badge-green" : "badge-gray"}`}>{c.isActive ? "Aktiv" : "Deaktiv"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Bundles Manager ──────────────────────────────────────────────────────────
function BundlesManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();
  useEffect(() => { apiFetch("/api/bundles").then(d => setItems(d.bundles || [])).finally(() => setLoading(false)); }, []);
  async function toggleActive(id, val) { try { await apiFetch(`/api/bundles/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: val }) }); setItems(p => p.map(b => b.id === id ? { ...b, isActive: val } : b)); toast("Yeniləndi"); } catch (e) { toast(e.message, "error"); } }
  return (
    <div className="space-y-4">
      <ToastContainer />
      <h2 className="section-title">Bağlamalar</h2>
      {loading ? <SkeletonList count={3} /> : !items.length ? <EmptyState icon="gift" title="Bağlama tapılmadı" /> : (
        <div className="space-y-2">
          {items.map(b => (
            <div key={b.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1"><p className="font-semibold text-sm">{b.title}</p><p className="caption">{b.seller?.fullName} · {b.discountType === "PERCENTAGE" ? `${b.discountValue}% endirim` : `₼${b.discountValue} endirim`}</p></div>
              <button onClick={() => toggleActive(b.id, !b.isActive)} className={`badge cursor-pointer ${b.isActive ? "badge-green" : "badge-gray"}`}>{b.isActive ? "Aktiv" : "Deaktiv"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── All Listings ─────────────────────────────────────────────────────────────
function AllListingsManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [statusFilter, setStatusFilter] = useState("");
  const [editProduct, setEditProduct] = useState(null);
  const [boostProduct, setBoostProduct] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast, ToastContainer } = useToast();

  useEffect(() => { load(); }, [search, statusFilter]);

  function load() {
    setLoading(true);
    const q = new URLSearchParams({ pageSize: 100, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
    apiFetch(`/api/products?${q}`).then(d => setItems(d.products || [])).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }

  async function changeStatus(id, status) {
    try {
      await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setItems(p => p.map(x => x.id === id ? { ...x, status } : x));
      toast(status === "ACTIVE" ? "Elan aktivləşdirildi" : "Elan statusu dəyişdirildi", "success");
    } catch (e) { toast(e.message, "error"); }
  }

  async function saveProductEdit(e) {
    e.preventDefault();
    if (!editProduct) return;
    setSavingEdit(true);
    try {
      const payload = {
        titleAz: editProduct.titleAz,
        price: parseFloat(editProduct.price),
        discountedPrice: editProduct.discountedPrice ? parseFloat(editProduct.discountedPrice) : null,
        stock: parseInt(editProduct.stock) || 1,
        city: editProduct.city || null,
        region: editProduct.region || null,
        unit: editProduct.unit || "ədəd",
        isCorporate: !!editProduct.isCorporate,
        minOrderQty: editProduct.minOrderQty ? parseInt(editProduct.minOrderQty) : null,
        status: editProduct.status,
        descriptionAz: editProduct.descriptionAz || "",
      };
      await apiFetch(`/api/products/${editProduct.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      toast("Məhsul məlumatları yeniləndi", "success");
      setEditProduct(null);
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function del(id) {
    if (!confirm("Bu elanı silmək istədiyinizə əminsiniz? Bu geri qaytarıla bilməz!")) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      setItems(p => p.filter(x => x.id !== id));
      toast("Elan silindi", "success");
    } catch (e) { toast(e.message, "error"); }
  }

  const STATUSES = ["ACTIVE", "PENDING_REVIEW", "REJECTED", "SOLD", "DRAFT", "EXPIRED"];
  const pendingCount = items.filter(p => p.status === "PENDING_REVIEW").length;

  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Bütün Elanlar & İdarəetmə</h2>
          <p className="section-subtitle">Admin səlahiyyətləri ilə elanları tam redaktə edin, VIP/Premium təyin edin və ya silin</p>
          {pendingCount > 0 && <p className="text-xs text-amber-600 font-bold mt-1 inline-flex items-center gap-1"><Icon name="clock" size={12} />{pendingCount} elan təsdiq gözləyir</p>}
        </div>
        <span className="badge badge-gray">{items.length} nəticə</span>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2 flex-wrap">
        <input
          placeholder="Məhsul adı, kateqoriya, satıcı və ya şəhər axtar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-sm flex-1 min-w-48"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-auto text-xs py-2">
          <option value="">Bütün statuslar</option>
          <option value="PENDING_REVIEW">⏳ Moderasiyada olanlar (Gözləyən)</option>
          <option value="ACTIVE">✅ Aktiv Elanlar</option>
          <option value="REJECTED">❌ Rədd edilmiş</option>
          <option value="SOLD">💰 Satılmış</option>
          <option value="EXPIRED">⌛ Vaxtı bitmiş</option>
          <option value="DRAFT">📝 Qaralamalar</option>
        </select>
      </div>

      {loading ? <SkeletonList count={5} /> : !items.length ? <EmptyState icon="clipboard" title="Elan tapılmadı" /> : (
        <div className="space-y-3">
          {items.map(p => {
            const hasDiscount = p.discountedPrice && Number(p.discountedPrice) > 0 && Number(p.discountedPrice) < Number(p.price);
            return (
              <div key={p.id} className={`card p-4 transition-all hover:border-brand-300 ${p.status === "PENDING_REVIEW" ? "border-l-4 border-amber-400 bg-amber-50/20" : "bg-white"}`}>
                <div className="flex items-start gap-4">
                  {(p.coverImage || p.images?.[0]?.url) ? (
                    <img src={p.coverImage || p.images[0].url} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><Icon name="sprout" size={24} /></div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-gray-900 line-clamp-1">{p.titleAz}</p>
                          {p.isCorporate && (
                            <span className="badge badge-purple text-[10px]">🏢 Korporativ (Min: {p.minOrderQty || 1})</span>
                          )}
                          {p.tier && p.tier !== "STANDARD" && (
                            <span className="badge badge-green text-[10px]">✨ {p.tier}</span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-2 mt-0.5">
                          {hasDiscount ? (
                            <>
                              <span className="text-xs font-black text-brand-700">₼{Number(p.discountedPrice).toLocaleString("az-AZ")}</span>
                              <span className="text-[11px] text-gray-400 line-through">₼{Number(p.price).toLocaleString("az-AZ")}</span>
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 rounded">-{Math.round((1 - Number(p.discountedPrice) / Number(p.price)) * 100)}%</span>
                            </>
                          ) : (
                            <span className="text-xs font-black text-brand-700">₼{Number(p.price).toLocaleString("az-AZ")}</span>
                          )}
                          <span className="text-[11px] text-gray-400">· Stok: {p.stock} {p.unit || "ədəd"} · {p.city || p.region || "Məkan yoxdur"}</span>
                        </div>

                        <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                          <Icon name="user" size={12} />
                          <strong>{p.seller?.fullName || p.guestName || "Fərdi elan"}</strong>
                          {p.seller?.phone && <span className="text-brand-600 font-medium">· {p.seller.phone}</span>}
                          {p.store && <span className="text-purple-600 font-medium">· 🏪 {p.store.name}</span>}
                        </p>
                      </div>

                      <span className={`badge shrink-0 ${PRODUCT_STATUS_COLORS[p.status] || "badge-gray"}`}>{p.status}</span>
                    </div>

                    {/* Admin Action Bar */}
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100 flex-wrap">
                      {p.status === "PENDING_REVIEW" && (
                        <>
                          <button onClick={() => changeStatus(p.id, "ACTIVE")} className="btn-primary btn-xs flex items-center gap-1">
                            <Icon name="check" size={12} /> Təsdiqlə
                          </button>
                          <button onClick={() => changeStatus(p.id, "REJECTED")} className="btn-danger btn-xs flex items-center gap-1">
                            <Icon name="close" size={12} /> Rədd et
                          </button>
                        </>
                      )}

                      {/* Status Dropdown */}
                      <select
                        value={p.status}
                        onChange={e => changeStatus(p.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      {/* Boost / VIP Button */}
                      <button
                        type="button"
                        onClick={() => setBoostProduct(p)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        🚀 Boost / VIP Et
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditProduct({ ...p, price: p.price.toString(), discountedPrice: p.discountedPrice ? p.discountedPrice.toString() : "" })}
                        className="btn-secondary btn-xs flex items-center gap-1"
                      >
                        <Icon name="edit" size={12} /> Redaktə
                      </button>

                      {/* View Link */}
                      <a href={`/products/${p.slug}`} target="_blank" rel="noopener" className="btn-secondary btn-xs flex items-center gap-1">
                        <Icon name="eye" size={12} /> Bax
                      </a>

                      {/* Delete Button */}
                      <button onClick={() => del(p.id)} className="btn-danger btn-xs flex items-center gap-1 ml-auto">
                        <Icon name="trash" size={12} /> Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Boost Modal for Product */}
      {boostProduct && (
        <BoostModal
          isOpen={true}
          onClose={() => setBoostProduct(null)}
          targetType="PRODUCT"
          targetItem={boostProduct}
          onSuccess={() => {
            setBoostProduct(null);
            load();
          }}
        />
      )}

      {/* Admin Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setEditProduct(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Icon name="edit" size={18} className="text-brand-600" /> Elanı Redaktə Et (Admin)
              </h3>
              <button onClick={() => setEditProduct(null)} className="btn-icon"><Icon name="x" size={18} /></button>
            </div>

            <form onSubmit={saveProductEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Məhsulun Adı (Başlıq) *</label>
                <input
                  required
                  value={editProduct.titleAz || ""}
                  onChange={e => setEditProduct({ ...editProduct, titleAz: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Standart Qiymət (₼) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editProduct.price || ""}
                    onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Endirimli Qiymət (₼)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="İstəyə bağlı"
                    value={editProduct.discountedPrice || ""}
                    onChange={e => setEditProduct({ ...editProduct, discountedPrice: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Stok Miqdarı</label>
                  <input
                    type="number"
                    value={editProduct.stock || 1}
                    onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Şəhər / Rayon</label>
                  <input
                    value={editProduct.city || ""}
                    onChange={e => setEditProduct({ ...editProduct, city: e.target.value })}
                    className="input-field text-xs"
                    placeholder="Bakı, Gəncə..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Ölçü Vahidi</label>
                  <input
                    value={editProduct.unit || "ədəd"}
                    onChange={e => setEditProduct({ ...editProduct, unit: e.target.value })}
                    className="input-field text-xs"
                    placeholder="ədəd, kq, litr, ton..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                  <select
                    value={editProduct.status}
                    onChange={e => setEditProduct({ ...editProduct, status: e.target.value })}
                    className="input-field text-xs bg-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Korporativ Ayarlar */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-purple-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editProduct.isCorporate}
                    onChange={e => setEditProduct({ ...editProduct, isCorporate: e.target.checked })}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>🏢 Korporativ / Toplu Satış Elanıdır</span>
                </label>
                {editProduct.isCorporate && (
                  <div>
                    <label className="text-xs font-bold text-purple-800 block mb-1">Minimum Sifariş Miqdarı (ədəd)</label>
                    <input
                      type="number"
                      value={editProduct.minOrderQty || 1}
                      onChange={e => setEditProduct({ ...editProduct, minOrderQty: e.target.value })}
                      className="input-field text-xs bg-white max-w-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Açıqlama / Təsvir</label>
                <textarea
                  rows={4}
                  value={editProduct.descriptionAz || ""}
                  onChange={e => setEditProduct({ ...editProduct, descriptionAz: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Məhsul haqqında ətraflı məlumat..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setEditProduct(null)} className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl">
                  İmtina
                </button>
                <button type="submit" disabled={savingEdit} className="btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                  <Icon name="check" size={14} />
                  <span>{savingEdit ? "Saxlanılır..." : "Yadda Saxla"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Corporate Listings ───────────────────────────────────────────────────────
function CorporateListingsManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();
  useEffect(() => {
    apiFetch("/api/products?corporate=1&pageSize=50").then(d => setItems(d.products || [])).finally(() => setLoading(false));
  }, []);
  async function updateMinQty(id, minOrderQty) { try { await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ minOrderQty: parseInt(minOrderQty) }) }); toast("Min sifariş güncəlləndi"); } catch (e) { toast(e.message, "error"); } }
  return (
    <div className="space-y-4">
      <ToastContainer />
      <h2 className="section-title">Korporativ Elanlar</h2>
      {loading ? <SkeletonList count={3} /> : !items.length ? <EmptyState icon="building" title="Korporativ elan yoxdur" /> : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-40"><p className="font-semibold text-sm">{p.titleAz}</p><p className="caption">₼{Number(p.price).toLocaleString("az-AZ")} · {p.seller?.fullName}</p></div>
              <div className="flex items-center gap-2">
                <label className="caption">Min sifariş:</label>
                <input type="number" defaultValue={p.minOrderQty || 1} onBlur={e => updateMinQty(p.id, e.target.value)} className="input-sm w-20" />
              </div>
              <span className={`badge ${PRODUCT_STATUS_COLORS[p.status] || "badge-gray"}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Campaigns & AdSlots (simple) ────────────────────────────────────────────
function CampaignsManager() {
  const { t } = useSiteTexts();
  const CAMPAIGN_STATUS_LABELS = { ACTIVE: t('admin.campaign.active', 'Aktiv'), PAUSED: t('admin.campaign.paused', 'Dayandırılıb'), SCHEDULED: t('admin.campaign.scheduled', 'Planlanmış') };
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", type: "HOMEPAGE_BANNER", targetUrl: "", imageUrl: "", startDate: "", endDate: "", status: "ACTIVE" });
  const [showForm, setShowForm] = useState(false);
  const { toast, ToastContainer } = useToast();
  const TYPES = ["HOMEPAGE_BANNER", "CATEGORY_BANNER", "STORE_PROMOTION", "FLASH_SALE", "DAILY_DEAL", "SPONSORED_PRODUCT", "REGIONAL"];
  function getCampaignStatusLabel(status, t) { const labels = { ACTIVE: "admin.campaign.active", PAUSED: "admin.campaign.paused", SCHEDULED: "admin.campaign.scheduled" }; return t(labels[status] || status, status); }
  useEffect(() => { apiFetch("/api/campaigns?all=1").then(d => setItems(d.campaigns || [])).finally(() => setLoading(false)); }, []);
  async function create(e) {
    e.preventDefault();
    const payload = {
      ...form,
      startDate: form.startDate ? new Date(form.startDate + "T00:00:00").toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate + "T23:59:59").toISOString() : undefined,
      targetUrl: form.targetUrl || undefined, imageUrl: form.imageUrl || undefined,
    };
    try {
      const d = await apiFetch("/api/campaigns", { method: "POST", body: JSON.stringify(payload) });
      setItems(p => [d.campaign, ...p]);
      toast("Kampaniya əlavə edildi");
      setShowForm(false);
      setForm({ title: "", type: "HOMEPAGE_BANNER", targetUrl: "", imageUrl: "", startDate: "", endDate: "", status: "ACTIVE" });
    } catch (e) { toast(e.message, "error"); }
  }
  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      setItems(p => p.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast(newStatus === "ACTIVE" ? "Kampaniya aktivləşdirildi" : "Kampaniya dayandırıldı");
    } catch (e) { toast(e.message, "error"); }
  }
  async function deleteCampaign(id) {
    if (!confirm("Kampaniyanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
      setItems(p => p.filter(c => c.id !== id));
      toast("Silindi");
    } catch (e) { toast(e.message, "error"); }
  }
  return (
    <div className="space-y-5">
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">{t("admin.title.campaigns", "Kampaniyalar")}</h2>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary btn-sm">{showForm ? <span className="flex items-center gap-1"><Icon name="close" size={14} />Bağla</span> : <span className="flex items-center gap-1"><Icon name="plus" size={14} />Yeni Kampaniya</span>}</button>
      </div>
      {showForm && (
        <form onSubmit={create} className="card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Başlıq *</label><input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="Payız Kampaniyası" /></div>
            <div><label className="label">Tip</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="select-field">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Status</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="select-field"><option value="ACTIVE">Aktiv</option><option value="SCHEDULED">Planlanmış</option><option value="PAUSED">Dayandırılmış</option></select></div>
            <div><label className="label">Başlama *</label><input type="date" required value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Bitmə *</label><input type="date" required value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field" /></div>
            <div className="col-span-2"><label className="label">Hədəf URL</label><input value={form.targetUrl} onChange={e => setForm(p => ({ ...p, targetUrl: e.target.value }))} className="input-field" placeholder="https://..." /></div>
            <div className="col-span-2"><label className="label">Banner Şəkli URL (istəyə bağlı)</label><input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} className="input-field" placeholder="https://..." /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1">Kampaniya Yarat</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Ləğv et</button>
          </div>
        </form>
      )}
      {loading ? <SkeletonList count={3} /> : !items.length ? <EmptyState icon="bell" title="Kampaniya tapılmadı" /> : (
        <div className="space-y-3">
          {items.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3 flex-wrap">
                {c.imageUrl && <img src={c.imageUrl} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <p className="font-semibold text-sm">{c.title}</p>
                    <span className={`badge flex-shrink-0 ${c.status === "ACTIVE" ? "badge-green" : c.status === "PAUSED" ? "badge-yellow" : "badge-gray"}`}>{CAMPAIGN_STATUS_LABELS[c.status] || c.status}</span>
                  </div>
                  <p className="caption">{c.type}</p>
                  <p className="text-xs text-gray-400">{new Date(c.startDate).toLocaleDateString("az-AZ")} – {new Date(c.endDate).toLocaleDateString("az-AZ")}</p>
                  {c.targetUrl && <p className="text-xs text-brand-600 truncate">{c.targetUrl}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <p className="text-xs text-gray-500 inline-flex items-center gap-2"><span className="inline-flex items-center gap-1"><Icon name="eye" size={12} />{c.impressions || 0} göstəriş</span> · <span className="inline-flex items-center gap-1"><Icon name="link" size={12} />{c.clicks || 0} klik</span></p>
                    {c.clicks > 0 && c.impressions > 0 && <p className="text-xs font-medium text-brand-600">CTR: {((c.clicks / c.impressions) * 100).toFixed(1)}%</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => toggleStatus(c.id, c.status)} className={`btn-xs flex-1 ${c.status === "ACTIVE" ? "btn-secondary" : "btn-primary"}`}>
                  {c.status === "ACTIVE" ? <span className="flex items-center gap-1"><Icon name="pause" size={12} />Dayandır</span> : <span className="flex items-center gap-1"><Icon name="check" size={12} />Aktivləşdir</span>}
                </button>
                <button onClick={() => deleteCampaign(c.id)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12} />Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const AD_SLOT_LABELS = {
  HOMEPAGE_TOP: "Ana Səhifə — Yuxarı Banner",
  LIST_TOP: "Elan Siyahısı — Yuxarı Banner",
  INFEED_SPONSORED: "Elan Axını — Sponsorlu Kart",
  DETAIL_SIDEBAR: "Məhsul Detalı — Yan Panel",
  FOOTER_STRIP: "Footer — Zolaq Banner",
  SIDEBAR_LEFT: "Ana Səhifə — Sol Yan Banner",
  SIDEBAR_RIGHT: "Ana Səhifə — Sağ Yan Banner",
};
const CAMPAIGN_TYPES = ["HOMEPAGE_BANNER", "CATEGORY_BANNER", "STORE_PROMOTION", "FLASH_SALE", "DAILY_DEAL", "SPONSORED_PRODUCT", "REGIONAL"];

function AdSlotEditor({ slotKey, slot, onSaved, toast }) {
  const [mode, setMode] = useState(slot.mode || "off");
  const [campaignType, setCampaignType] = useState(slot.campaignType || "HOMEPAGE_BANNER");
  const [externalCode, setExternalCode] = useState(slot.externalCode || "");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const hasCampaign = slot.hasLiveCampaign;

  async function save() {
    setSaving(true);
    try {
      const body = { mode, campaignType: mode === "internal" ? campaignType : null, externalCode: mode === "external" ? externalCode : null };
      await apiFetch(`/api/ad-slots/${slotKey}`, { method: "PATCH", body: JSON.stringify(body) });
      toast("Reklam yeri yeniləndi", "success");
      setOpen(false);
      onSaved();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div>
          <p className="font-semibold text-sm">{AD_SLOT_LABELS[slotKey] || slotKey.replace(/_/g, " ")}</p>
          <p className="caption text-gray-400">{slotKey}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${mode === "off" ? "badge-gray" : mode === "internal" ? (hasCampaign ? "badge-green" : "badge-yellow") : "badge-blue"} inline-flex items-center gap-1`}>
            {mode === "off" && <><Icon name="closeCircle" size={12} />Deaktiv</>}
            {mode === "internal" && (hasCampaign ? <><Icon name="checkCircle" size={12} />Aktiv kampaniya</> : <><Icon name="alert" size={12} />Slot aktivdir (Kampaniya yoxdur)</>)}
            {mode === "external" && <><Icon name="checkCircle" size={12} />Xarici kod</>}
          </span>
          <Icon name="chevronDown" size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {mode === "internal" && hasCampaign && <p className="caption mb-2">Kampaniya: {slot.liveCampaignTitle}</p>}

      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Rejim</label>
            <div className="flex gap-2">
              {["off", "internal", "external"].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${mode === m ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {m === "off" ? "Deaktiv" : m === "internal" ? "Daxili Kampaniya" : "Xarici Kod (AdSense və s.)"}
                </button>
              ))}
            </div>
          </div>

          {mode === "internal" && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Kampaniya Tipi</label>
              <select value={campaignType} onChange={e => setCampaignType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Bu slotda göstərilməsi üçün "Kampaniyalar" bölməsində bu tipdə AKTİV bir kampaniya olmalıdır.</p>
            </div>
          )}

          {mode === "external" && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Embed Kodu (HTML/JS)</label>
              <textarea value={externalCode} onChange={e => setExternalCode(e.target.value)} rows={4}
                placeholder="<script>...</script> və ya <img src=... />"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
          )}

          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="check" size={14} />}
            Saxla
          </button>
        </div>
      )}
    </div>
  );
}

function AdSlotsManager() {
  const { t } = useSiteTexts();
  const [slots, setSlots] = useState({}); const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();
  const SLOT_KEYS = ["HOMEPAGE_TOP", "SIDEBAR_LEFT", "SIDEBAR_RIGHT", "LIST_TOP", "INFEED_SPONSORED", "DETAIL_SIDEBAR", "FOOTER_STRIP"];

  function load() {
    setLoading(true);
    apiFetch("/api/ad-slots?includeCode=1").then(d => {
      const arr = d.slots || [];
      const obj = Array.isArray(arr) ? Object.fromEntries(arr.map(s => [s.key, s])) : arr;
      setSlots(obj);
    }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <ToastContainer />
      <div>
        <h2 className="section-title">{t("admin.title.adSlots", "Reklam Yerləri")}</h2>
        <p className="caption text-gray-500">Hər bir reklam yerini klikləyərək daxili kampaniya, xarici kod (AdSense və s.) təyin edin və ya deaktiv edin.</p>
      </div>
      {loading ? <SkeletonList count={7} /> : (
        <div className="space-y-3">
          {SLOT_KEYS.map(key => (
            <AdSlotEditor key={key} slotKey={key} slot={slots[key] || { mode: "off" }} onSaved={load} toast={toast} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────

// ─── SLIDER MANAGER (Drag-to-reorder + CRUD) ─────────────────────────────────
function SliderManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ tag: "", title: "", subtitle: "", cta: "Bax", href: "/products", bg: "from-brand-700 to-brand-500", emoji: "sprout", imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const { toast, ToastContainer } = useToast();

  async function uploadSlideImage(file, onDone) {
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const token = getToken();
      const res = await fetch("/api/upload", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükləmə xətası");
      onDone(data.images[0].url);
    } catch (err) { toast(err.message, "error"); }
    finally { setUploadingImg(false); }
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      // Admin GET: all slides (active + inactive)
      const d = await apiFetch("/api/slides?all=1");
      setSlides(d.slides || []);
    } catch { setSlides([]); }
    finally { setLoading(false); }
  }

  async function createSlide(e) {
    e.preventDefault();
    if (!form.title || !form.href) return;
    setSaving(true);
    try {
      await apiFetch("/api/slides", { method: "POST", body: JSON.stringify(form) });
      setForm({ tag: "", title: "", subtitle: "", cta: "Bax", href: "/products", bg: "from-brand-700 to-brand-500", emoji: "sprout", imageUrl: "" });
      await load();
      toast("Slide əlavə edildi", "success");
    } catch (err) { toast(err.message, "error"); }
    finally { setSaving(false); }
  }

  async function toggleActive(slide) {
    try {
      await apiFetch(`/api/slides/${slide.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !slide.isActive }) });
      await load();
    } catch (err) { toast(err.message, "error"); }
  }

  async function deleteSlide(id) {
    if (!confirm("Bu slide-ı silmək istəyirsiniz?")) return;
    try {
      await apiFetch(`/api/slides/${id}`, { method: "DELETE" });
      await load();
      toast("Slide silindi", "success");
    } catch (err) { toast(err.message, "error"); }
  }

  function updateSlideImage(slideId, file) {
    uploadSlideImage(file, async (url) => {
      try {
        await apiFetch(`/api/slides/${slideId}`, { method: "PATCH", body: JSON.stringify({ imageUrl: url }) });
        await load();
        toast("Şəkil yeniləndi", "success");
      } catch (err) { toast(err.message, "error"); }
    });
  }

  // Drag-drop handlers
  function onDragStart(e, idx) { setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; }
  function onDragOver(e, idx) { e.preventDefault(); setOverIdx(idx); }
  function onDrop(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { resetDrag(); return; }
    const next = [...slides];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    // Reassign sortOrder
    const ordered = next.map((s, i) => ({ ...s, sortOrder: i }));
    setSlides(ordered);
    // Save new order to DB
    apiFetch("/api/slides", {
      method: "PUT",
      body: JSON.stringify({ order: ordered.map((s, i) => ({ id: s.id, sortOrder: i })) }),
    }).then(() => toast("Sıralama saxlanıldı", "success")).catch(() => { });
    resetDrag();
  }
  function resetDrag() { setDragIdx(null); setOverIdx(null); }

  const BG_OPTIONS = [
    { value: "from-brand-700 to-brand-500", label: "Yaşıl" },
    { value: "from-amber-600 to-amber-400", label: "Sarı" },
    { value: "from-sky-700 to-sky-500", label: "Mavi" },
    { value: "from-orange-600 to-orange-400", label: "Narıncı" },
    { value: "from-red-700 to-red-500", label: "Qırmızı" },
    { value: "from-purple-700 to-purple-500", label: "Bənövşəyi" },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2"><Icon name="image" size={20} />Slider İdarəsi</h2>
          <p className="text-sm text-gray-500">Slide-ları sürükləyərək sırasını dəyişin</p>
        </div>
      </div>

      {/* Create form */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon name="plus" size={18} />Yeni Slide Əlavə Et</h3>
        <form onSubmit={createSlide} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input-field" placeholder="Etiket (məs: Kampaniya)" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
          <input className="input-field" placeholder="Başlıq *" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="input-field md:col-span-2" placeholder="Alt başlıq" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          <input className="input-field" placeholder="Link (məs: /products) *" required value={form.href} onChange={e => setForm(f => ({ ...f, href: e.target.value }))} />
          <input className="input-field" placeholder="Düymə mətni (məs: Bax)" value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} />
          <input className="input-field" placeholder="İkon (məs: sprout)" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
          <select className="input-field" value={form.bg} onChange={e => setForm(f => ({ ...f, bg: e.target.value }))}>
            {BG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Slide Şəkli (istəyə bağlı — əlavə etsəniz rəngli fon yerinə şəkil göstərilir)</label>
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 cursor-pointer hover:border-brand-400 hover:text-brand-600 transition-colors">
                  <Icon name="upload" size={16} />
                  {uploadingImg ? "Yüklənir..." : "Şəkil seç"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImg}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadSlideImage(f, url => setForm(fm => ({ ...fm, imageUrl: url }))); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary md:col-span-2">{saving ? "Əlavə olunur..." : "Slide əlavə et"}</button>
        </form>
      </div>

      {/* Slide list with drag-drop */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Yüklənir...</div>
      ) : slides.length === 0 ? (
        <EmptyState icon="image" title="Hələ slide yoxdur" subtitle="Yuxarıdakı formdan birini əlavə edin" />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 flex items-center gap-1">Sürükləyin — dəyişiklik avtomatik saxlanılır</p>
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={resetDrag}
              className={`card p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all duration-150 ${overIdx === idx && dragIdx !== idx ? "border-brand-400 bg-brand-50 scale-[1.01] shadow-md" : ""
                } ${dragIdx === idx ? "opacity-40" : ""}`}
            >
              <span className="text-gray-300 text-lg select-none" title="Sürüklə"><Icon name="grid" size={16} /></span>
              <label className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${slide.bg} flex items-center justify-center text-xl shrink-0 cursor-pointer overflow-hidden group`} title="Şəkli dəyişmək üçün klikləyin">
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  slide.emoji
                )}
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Icon name="upload" size={12} className="text-white opacity-0 group-hover:opacity-100" />
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) updateSlideImage(slide.id, f); e.target.value = ""; }} />
              </label>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{slide.title}</p>
                <p className="text-xs text-gray-400 truncate">{slide.href} · {slide.cta}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(slide)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${slide.isActive ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600" : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
                >
                  {slide.isActive ? <span className="inline-flex items-center gap-1 text-emerald-600"><Icon name="checkCircle" size={14} />Aktiv</span> : <span className="inline-flex items-center gap-1 text-gray-500"><Icon name="pause" size={14} />Deaktiv</span>}
                </button>
                <button onClick={() => deleteSlide(slide.id)} className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"><Icon name="trash" size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── AI Quick Add (şəkil + qısa məlumat → hazır elan) ──────────────────────────
function AiQuickAddPanel({ storeId }) {
  const [images, setImages] = useState([]);
  const [infoText, setInfoText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [draft, setDraft] = useState(null);
  const [categories, setCategories] = useState([]);
  const [missing, setMissing] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const { toast } = useToast();

  async function analyze() {
    setAiErr(""); setSuccess(null);
    if (!infoText.trim() && !images.length) {
      setAiErr("Şəkil yükləyin və ya qısa məlumat yazın");
      return;
    }
    setAnalyzing(true);
    try {
      const d = await apiFetch("/api/ai/analyze-product", {
        method: "POST",
        body: JSON.stringify({
          infoText,
          imageUrl: images[0]?.url || null,
        }),
      });
      setDraft(d.draft);
      setCategories(d.categories || []);
      setMissing(d.missing || []);
      if (!d.draft?.titleAz) setAiErr("AI cavab vermədi, yenidən cəhd edin");
    } catch (e) {
      setAiErr(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function upd(field, val) { setDraft((p) => ({ ...p, [field]: val })); }

  async function publish() {
    setAiErr("");
    if (!draft?.titleAz?.trim()) { setAiErr("Başlıq boş ola bilməz"); return; }
    if (!(Number(draft.price) > 0)) { setAiErr("Qiymət daxil edin (müsbət rəqəm)"); return; }
    if (!draft.categorySlug) { setAiErr("Kateqoriya seçin"); return; }

    setSaving(true);
    try {
      const d = await apiFetch("/api/products/bulk-upload", {
        method: "POST",
        body: JSON.stringify({
          target: { type: storeId ? "store" : "personal", storeId: storeId || undefined },
          products: [{
            titleAz: draft.titleAz,
            descriptionAz: draft.descriptionAz,
            price: draft.price,
            ...(draft.discountedPrice ? { discountedPrice: draft.discountedPrice } : {}),
            ...(draft.wholesalePrice ? { wholesalePrice: draft.wholesalePrice, wholesaleMinQty: draft.wholesaleMinQty || 1 } : {}),
            unit: draft.unit,
            stock: draft.stock || 1,
            categorySlug: draft.categorySlug,
            imageUrls: images.map((i) => i.url),
          }],
        }),
      });
      const r = (d.results || [])[0];
      if (r?.success) {
        setSuccess(r);
        setDraft(null); setImages([]); setInfoText(""); setMissing([]);
        toast(`"${r.title}" dərhal AKTİV olaraq yayımlandı`, "success");
      } else {
        setAiErr(r?.error || "Elan yerləşdirilə bilmədi");
      }
    } catch (e) {
      setAiErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Step 1: image + short info */}
      <div className="card p-4 space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-800 mb-1">1. Şəkil və qısa məlumat</p>
          <p className="text-xs text-gray-500">Məhsul şəklini yüklə, qısa məlumatı yaz (WhatsApp&apos;da yazdığın kimi) — AI avtomatik başlıq, açıqlama və kateqoriya hazırlayacaq.</p>
        </div>
        <ImageUploader value={images} onChange={(v) => { setImages(v); setSuccess(null); }} max={8} />
        <textarea
          rows={3}
          className="input-field"
          placeholder="Məsələn: EvroHim KAS-32 maye azot gübrəsi, 3.50 AZN, toptan 2.80 min 10 ədəd, 50 stok"
          value={infoText}
          onChange={(e) => { setInfoText(e.target.value); setSuccess(null); }}
        />
        {aiErr && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{aiErr}</div>}
        <button onClick={analyze} disabled={analyzing || !images.length && !infoText.trim()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white font-bold transition disabled:opacity-60">
          {analyzing ? "🤖 AI analiz edir..." : "🤖 AI ilə analiz et"}
        </button>
      </div>

      {/* Step 2: editable draft */}
      {draft && (
        <div className="card p-4 space-y-3 border-2 border-purple-200">
          <div>
            <p className="text-sm font-bold text-gray-800 mb-1">2. AI hazırlığı — yoxla və düzəlt</p>
            <p className="text-xs text-gray-500">AI tərəfindən hazırlanan elan mətni. İstədiyin kimi redaktə edə və dərhal yayımlaya bilərsən.</p>
          </div>

          {missing.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm space-y-1">
              <p className="font-bold text-amber-800">AI sualları:</p>
              {missing.map((m, i) => (
                <p key={i} className="text-amber-700">• {m.question}</p>
              ))}
            </div>
          )}

          <input className="input-field font-semibold" placeholder="Başlıq" value={draft.titleAz} onChange={(e) => upd("titleAz", e.target.value)} />
          <textarea rows={4} className="input-field" placeholder="Açıqlama" value={draft.descriptionAz} onChange={(e) => upd("descriptionAz", e.target.value)} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input type="number" step="0.01" className="input-field" placeholder="Qiymət (AZN) *" value={draft.price} onChange={(e) => upd("price", e.target.value)} />
            <input type="number" step="0.01" className="input-field" placeholder="Endirimli" value={draft.discountedPrice} onChange={(e) => upd("discountedPrice", e.target.value)} />
            <input type="number" step="0.01" className="input-field" placeholder="Toptan qiymət" value={draft.wholesalePrice} onChange={(e) => upd("wholesalePrice", e.target.value)} />
            <input type="number" className="input-field" placeholder="Toptan min. say" value={draft.wholesaleMinQty} onChange={(e) => upd("wholesaleMinQty", e.target.value)} />
            <input type="number" className="input-field" placeholder="Stok" value={draft.stock} onChange={(e) => upd("stock", e.target.value)} />
            <input className="input-field" placeholder="Vahid (ədəd/kq/litr)" value={draft.unit} onChange={(e) => upd("unit", e.target.value)} />
          </div>

          <select className="input-field" value={draft.categorySlug || ""} onChange={(e) => {
            const cat = categories.find((c) => c.slug === e.target.value);
            setDraft((p) => ({ ...p, categorySlug: cat?.slug || null }));
          }}>
            <option value="">Kateqoriya seçin... *</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={publish} disabled={saving}
              className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:opacity-60">
              {saving ? "Yerləşdirilir..." : "✅ Elanı yerləşdir (dərhal AKTİV)"}
            </button>
            <span className="text-xs text-gray-500">
              {storeId ? "Seçilmiş mağazaya əlavə olunacaq" : "Fərdi elan kimi admin hesabınıza əlavə olunacaq"}
            </span>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="card p-4 bg-green-50 border border-green-200">
          <p className="font-bold text-green-700">✓ &quot;{success.title}&quot; dərhal AKTİF olaraq yayımlandı!</p>
          <p className="text-xs text-gray-500 mt-1">Yeni elan əlavə etmək üçün şəkil və məlumatı yenidən göndərin.</p>
        </div>
      )}
    </div>
  );
}

// ─── Bulk Upload Panel (Toplu Məhsul Yükləmə) ────────────────────────────────
function BulkUploadPanel() {
  const [mode, setMode] = useState("store");
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    apiFetch("/api/stores?all=1&includeStats=1")
      .then((d) => setStores(d.stores || []))
      .catch(() => {});
  }, []);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setResults(null);
    const reader = new FileReader();
    reader.onload = () => { setCsvText(String(reader.result || "")); setFileName(file.name); };
    reader.readAsText(file);
  }

  async function submit() {
    setErr(""); setResults(null);
    if (!csvText.trim()) { setErr("CSV faylı seçin və ya mətni yapışdırın"); return; }
    if (mode === "store" && !storeId) { setErr("Mağaza seçin"); return; }

    let rows;
    try {
      rows = csvToObjects(csvText).map(({ _rowNumber, ...rest }) => rest);
    } catch (e) { setErr(e.message); return; }
    if (!rows.length) { setErr("CSV-də məlumat sətri yoxdur"); return; }

    setUploading(true);
    try {
      const d = await apiFetch("/api/products/bulk-upload", {
        method: "POST",
        body: JSON.stringify({ target: { type: mode, storeId }, products: rows }),
      });
      setResults(d);
      toast(`${d.createdCount} məhsul yaradıldı${d.failed ? `, ${d.failed} xəta` : ""}`, d.failed ? "error" : "success");
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-lg flex items-center gap-2"><Icon name="upload" size={20} />Toplu Məhsul Yükləmə</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          CSV faylı ilə bir dəfəyə yüzlərlə məhsul əlavə edin. İcazə sadəcə ADMIN/SUPER_ADMIN-ə açıqdır — digər istifadəçilərə &quot;Modullar&quot; bölməsindən &quot;Toplu Məhsul Yükləmə&quot; icazəsi verilə bilər.
        </p>
      </div>

      {/* Target mode */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode("store")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${mode === "store" ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
            🏬 Mağazaya yüklə
          </button>
          <button onClick={() => setMode("personal")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${mode === "personal" ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
            👤 Fərdi (şəxsi) yüklə
          </button>
          <button onClick={() => setMode("ai")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${mode === "ai" ? "bg-gradient-to-r from-purple-600 to-brand-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"}`}>
            🤖 AI ilə əlavə et
          </button>
        </div>

        {(mode === "store" || mode === "ai") && (
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="input-field max-w-md">
            <option value="">Mağaza seçin...{mode === "ai" ? " (seçməsəniz fərdi elan kimi)" : ""}</option>
            {stores.map((st) => (
              <option key={st.id} value={st.id}>{st.name}{st.status ? ` (${st.status})` : ""}</option>
            ))}
          </select>
        )}
        {mode === "personal" && (
          <p className="text-xs text-gray-500">Məhsullar admin hesabınıza fərdi elan kimi əlavə olunacaq və dərhal aktivləşəcək.</p>
        )}
      </div>

      {/* AI quick-add panel */}
      {mode === "ai" && (
        <AiQuickAddPanel storeId={storeId} stores={stores} />
      )}

      {/* CSV input */}
      {mode !== "ai" && (<div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold cursor-pointer hover:bg-brand-700 transition">
            📄 CSV faylı seç
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>
          <button onClick={downloadCsvTemplate}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            ⬇ Şablonu yüklə
          </button>
          {fileName && <span className="text-xs text-gray-500 font-medium">{fileName}</span>}
        </div>
        <textarea
          rows={5}
          className="input-field font-mono text-xs"
          placeholder="və ya CSV mətnini buraya yapışdırın..."
          value={csvText}
          onChange={(e) => { setCsvText(e.target.value); setResults(null); }}
        />
        <div className="text-[11px] text-gray-500">
          Məcburi sütunlar: <span className="font-bold text-gray-700">titleAz, price, categorySlug</span>. İstəyə bağlı: descriptionAz, discountedPrice, wholesalePrice, wholesaleMinQty, unit, stock, region, city, imageUrl.
        </div>
        {err && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{err}</div>}
        <button onClick={submit} disabled={uploading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold transition">
          {uploading ? "Yüklənir..." : "Toplu Yüklə (aktivləşdir)"}
        </button>
      </div>)}

      {/* Results */}
      {mode !== "ai" && results && (
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="badge-green">✓ {results.createdCount} yaradıldı</span>
            {results.failed > 0 && <span className="badge-red">✗ {results.failed} xəta</span>}
            <span className="badge-gray">Cəmi: {results.total}</span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {results.results.map((r) => (
              <div key={r.row} className="flex items-start justify-between gap-3 py-2 text-sm">
                <span className="text-gray-600">Sətir {r.row}: <span className="font-medium text-gray-800">{r.title || "(adsız)"}</span></span>
                {r.success
                  ? <span className="badge-green shrink-0">OK</span>
                  : <span className="text-xs text-red-600 shrink-0 max-w-[50%] text-right">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Modules Panel (Rol Modulları) ──────────────────────────────────────
function UserModulesPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModules, setUserModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const ALL_MODULES = [
    { key: "WALLET", label: "Pul Kisəsi", icon: "wallet" },
    { key: "BLOG", label: "Bloq", icon: "fileText" },
    { key: "BUNDLES", label: "Bağlamalar", icon: "gift" },
    { key: "CORPORATE_LISTINGS", label: "Korporativ Elanlar", icon: "building" },
    { key: "AI_AGRONOM", label: "AI Aqronom", icon: "bot" },
    { key: "ANALYTICS", label: "Analitika", icon: "trendingUp" },
    { key: "CAMPAIGNS", label: "Kampaniyalar", icon: "bell" },
    { key: "BULK_CSV", label: "Toplu Məhsul Yükləmə", icon: "upload" },
    { key: "DELIVERY", label: "Çatdırılma", icon: "truck" },
    { key: "LEADERBOARD", label: "Liderlər Lövhəsi", icon: "trophy" },
    { key: "CATEGORIES_SLIDER", label: "Kateqoriya Slider", icon: "layers" },
    { key: "HERO_SECTION", label: "Hero Bölməsi", icon: "image" },
    { key: "PROMO_BANNER", label: "Promo Banner", icon: "tag" },
    { key: "PRODUCTS_GRID", label: "Məhsul Grid", icon: "grid" },
    { key: "BLOG_SECTION", label: "Bloq Bölməsi", icon: "edit" },
    { key: "TESTIMONIALS", label: "Rəylər", icon: "star" },
    { key: "NEWSLETTER_SIGNUP", label: "Bülleten Abunəliyi", icon: "mail" },
    { key: "WEATHER_WIDGET", label: "Hava Durumu", icon: "cloud" },
    { key: "AGRONOMIST_AI", label: "Aqronom AI", icon: "bot" },
    { key: "COMPARISON_TOOL", label: "Müqayisə Aləti", icon: "gitCompare" },
    { key: "FAVORITES", label: "Seçilmişlər", icon: "heart" },
    { key: "DIRECT_MESSAGING", label: "Mesajlaşma", icon: "message" },
    { key: "WALLET_SYSTEM", label: "Pul Kisəsi Sistemi", icon: "wallet" },
    { key: "STORE_RATINGS", label: "Mağaza Reytinqi", icon: "star" },
  ];

  useEffect(() => {
    apiFetch("/api/admin/users?pageSize=100")
      .then(d => setUsers(d.users || []))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  function selectUser(user) {
    setSelectedUser(user);
    setModulesLoading(true);
    apiFetch(`/api/admin/user-modules?userId=${user.id}`)
      .then(d => {
        const activeModules = new Set((d.modules || []).map(m => m.module));
        setUserModules(ALL_MODULES.map(m => ({ ...m, enabled: activeModules.has(m.key) })));
      })
      .catch(e => toast(e.message, "error"))
      .finally(() => setModulesLoading(false));
  }

  function toggleModule(key) {
    setUserModules(prev => prev.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m));
  }

  async function saveModules() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      // Send all modules with their enabled state
      const modulesToUpdate = userModules.map(m => ({ module: m.key, enabled: m.enabled }));
      await apiFetch(`/api/admin/user-modules`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedUser.id, modules: modulesToUpdate }),
      });
      toast("Modullar yeniləndi", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-lg flex items-center gap-2"><Icon name="settings" size={20} />Rol Modulları</h2>
        <p className="text-sm text-gray-500 mt-0.5">İstifadəçilər üçün modul icazələrini idarə edin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User list */}
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">İstifadəçilər</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => selectUser(u)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedUser?.id === u.id ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                  {u.fullName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate font-semibold">{u.fullName || "Adsız"}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase">{u.role?.split("_")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module toggles */}
        <div className="card p-4">
          {selectedUser ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">{selectedUser.fullName} — Modullar</h3>
                <button
                  onClick={saveModules}
                  disabled={saving}
                  className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                >
                  {saving ? "Saxlanılır..." : "Yadda saxla"}
                </button>
              </div>
              {modulesLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}</div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {userModules.map(m => (
                    <button
                      key={m.key}
                      onClick={() => toggleModule(m.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${m.enabled ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <Icon name={m.icon} size={16} className={m.enabled ? "text-brand-600" : "text-gray-400"} />
                      <span className="flex-1 text-left">{m.label}</span>
                      <span className={`w-10 h-5 rounded-full relative transition-colors ${m.enabled ? "bg-brand-600" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${m.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              <div className="text-center">
                <Icon name="user" size={32} className="mx-auto mb-2 opacity-50" />
                <p>Modulları idarə etmək üçün istifadəçi seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Agro Services Manager ───────────────────────────────────────────────────
function AgroServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    apiFetch("/api/agro-services")
      .then(d => setServices(d.services || []))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonList />;
  if (services.length === 0) return <EmptyState icon="clipboard" title="Müraciət tapılmadı" />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center bg-gray-50/50">
        <h2 className="font-bold text-gray-900">Xidmət Müraciətləri</h2>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {services.map(s => (
          <div key={s.id} className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-gray-900">{s.serviceType === "satinalma" ? "Satınalma Xidməti" : s.serviceType === "mehsul_qeydiyyati" ? "Məhsul Qeydiyyatı" : s.serviceType}</span>
                <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString("az-AZ")}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <p><span className="font-medium">Məhsul/Növ:</span> {s.cropType || "-"}</p>
                  <p><span className="font-medium">Miqdar/Büdcə:</span> {s.area || "-"}</p>
                </div>
                <div>
                  <p><span className="font-medium">Müştəri:</span> {s.user?.fullName || "-"}</p>
                  <p><span className="font-medium">Telefon:</span> {s.contactPhone || "-"}</p>
                </div>
              </div>
              {s.notes && (
                <div className="text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-700">Qeydlər:</span> {s.notes}
                </div>
              )}
            </div>
            <div className="shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status === "PENDING" ? "bg-amber-100 text-amber-700" : s.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {s.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { t } = useSiteTexts();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'stats';
  const setTab = (t) => { window.history.pushState(null, '', `?tab=${t}`); };
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const { toast, ToastContainer } = useToast();

  const refreshStats = useCallback(() => {
    apiFetch("/api/admin/stats")
      .then(d => { setStats(d.stats); setActivity(d.recentActivity || []); })
      .catch(e => toast(e.message, "error"))
      .finally(() => setStatsLoading(false));
  }, []);

  const [activeModules, setActiveModules] = useState([]);

  useEffect(() => {
    refreshStats();
    apiFetch("/api/admin/modules").then(d => {
       const active = [];
       const traverse = (arr) => {
         for (const m of arr) {
           if (m.slug && m.slug.includes('?tab=')) {
              active.push(m.slug.split('?tab=')[1]);
           } else if (m.slug) {
              active.push(m.slug.split('/').pop()); // e.g. /admin/campaigns -> campaigns
           }
           if (m.children) traverse(m.children);
         }
       };
       if (d.modules) traverse(d.modules);
       setActiveModules(active);
    }).catch(() => {});
  }, [refreshStats]);

  const badges = { pendingProducts: stats?.products?.pending || 0, pendingReviews: stats?.reviews?.pending || 0 };

  // Lazy render: only create the active panel component (avoids all useEffects firing at once)
  function renderPanel() {
    const restrictedTabs = ['emails', 'notify', 'slider', 'campaigns']; // Modullar hissəsindən deaktiv edilə bilən əsas tablar
    if (restrictedTabs.includes(tab) && activeModules.length > 0 && !activeModules.includes(tab)) {
       return (
         <div className="flex items-center justify-center h-[60vh]">
            <EmptyState icon="lock" title="Modul Deaktivdir" description="Bu modul sistem tənzimləmələrindən deaktiv edilmişdir. Admin paneldən və ya AI vasitəsilə aktivləşdirin." />
         </div>
       );
    }

    switch (tab) {
      case "stats": return <DashboardStats stats={stats} loading={statsLoading} />;
      case "activity": return <RecentActivity activity={activity} loading={statsLoading} />;
      case "pending": return <PendingProducts onRefreshStats={refreshStats} />;
      case "allListings":
      case "all-listings": return <AllListingsManager />;
      case "corporate": return <CorporateListingsManager />;
      case "categories": return <CategoriesManager />;
      case "brands": return <BrandsManager />;
      case "stores": return <StoresManager />;
      case "bulkUpload": return <BulkUploadPanel />;
      case "agro_services": return <AgroServicesManager />;
      case "orders": return <OrdersAll />;
      case "wallet": return <WalletWithdrawalsManager />;
      case "coupons": return <CouponsManager />;
      case "users": return <UsersManager />;
      case "reviews": return <ReviewsManager />;
      case "bundles": return <BundlesManager />;
      case "blog": return <BlogManager />;
      case "campaigns": return <CampaignsManager />;
      case "adslots": return <AdSlotsManager />;
      case "notify": return <PushBroadcastManager />;
      case "slider": return <SliderManager />;
      case "analytics": return (
        <div className="space-y-4"><h2 className="font-bold text-lg flex items-center gap-2"><Icon name="trendingUp" size={20} />Analitika Paneli</h2><AnalyticsPanel mode="admin" /></div>
      );
      case "emails": return <EmailManager />;
      case "user-modules": return <UserModulesPanel />;
      case "studio": return <NoCodeAdminStudio />;
      case "messages": return (
        <div className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Icon name="message" size={20} />Mesajlar</h2>
          <MessagingPanel />
        </div>
      );
      case "profile": return <AdminProfile />;
      case "support": return <AdminSupport />;
      case "site-texts": return <ContentHub />;
      case "ai-agent": return <AIAgentPanel />;
      case "ai-settings": return <AISettingsManager />;
      default: return <EmptyState icon="clock" title="Gəlir..." />;
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <ToastContainer />
      {/* Desktop sidebar — sticky, full height, own scroll */}
      {/* AdminSidebar Removed */}
      {/* Content area */}
      <div className="flex flex-col min-w-0 flex-1">
        {/* Mobile horizontal tab nav */}
        {/* AdminMobileNav Removed */}
        {/* Main content — proper padding, no extra whitespace */}
        <main className="flex-1 py-4 md:py-6 px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="w-full max-w-[1440px] mx-auto space-y-5">
            {renderPanel()}
          </div>
        </main>
      </div>
    </div>
  );
}
