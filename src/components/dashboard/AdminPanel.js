"use client";
import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import StatCard from "@/components/ui/StatCard";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import NoCodeAdminStudio from "@/components/dashboard/NoCodeAdminStudio";
import EmailManager from "./EmailManager";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ["BUYER","FARMER","STORE","AGRONOMIST","DELIVERY_PARTNER","MODERATOR","ADMIN","SUPER_ADMIN"];
const ORDER_STATUS_LABELS = { PENDING:"Gözləyir",PAID:"Ödənilib",PROCESSING:"Hazırlanır",SHIPPED:"Göndərilib",DELIVERED:"Çatdırılıb",CANCELLED:"Ləğv edilib",REFUNDED:"Geri qaytarılıb" };
const ORDER_STATUS_COLORS = { PENDING:"badge-yellow",PAID:"badge-blue",PROCESSING:"badge-purple",SHIPPED:"badge-blue",DELIVERED:"badge-green",CANCELLED:"badge-red",REFUNDED:"badge-gray" };
const PRODUCT_STATUS_COLORS = { PENDING_REVIEW:"badge-yellow",ACTIVE:"badge-green",REJECTED:"badge-red",SOLD:"badge-blue",DRAFT:"badge-gray",EXPIRED:"badge-gray" };

const SIDEBAR_GROUPS = [
  { label:"Əsas", items:[
    { id:"stats",     icon:"dashboard", label:"İdarə Paneli" },
    { id:"activity",  icon:"zap", label:"Son Fəaliyyət" },
  ]},
  { label:"Analitika", items:[
    { id:"analytics", icon:"trendingUp", label:"Analitika Paneli" },
  ]},
  { label:"Marketplace", items:[
    { id:"pending",   icon:"clock", label:"Moderasiya", badge:"pending" },
    { id:"all-listings",icon:"clipboard",label:"Bütün Elanlar" },
    { id:"corporate", icon:"building", label:"Korporativ" },
    { id:"categories",icon:"grid", label:"Kateqoriyalar" },
    { id:"stores",    icon:"store", label:"Mağazalar" },
  ]},
  { label:"Sifarişlər & Maliyyə", items:[
    { id:"orders",    icon:"package", label:"Sifarişlər" },
    { id:"wallet",    icon:"wallet", label:"Pul Kisəsi" },
    { id:"coupons",   icon:"tag", label:"Kuponlar" },
  ]},
  { label:"İcma", items:[
    { id:"users",     icon:"user", label:"İstifadəçilər" },
    { id:"reviews",   icon:"star", label:"Rəylər", badge:"reviews" },
    { id:"bundles",   icon:"gift", label:"Bağlamalar" },
  ]},
  { label:"Məzmun & Reklam", items:[
    { id:"blog",      icon:"fileText", label:"Bloq" },
    { id:"campaigns", icon:"bell", label:"Kampaniyalar" },
    { id:"adslots",   icon:"image", label:"Reklam Yerləri" },
    { id:"notify",    icon:"bell", label:"Push Bildirişi" },
    { id:"slider",    icon:"image", label:"Slider İdarəsi" },
  ]},
  { label:"Sistem", items:[
    { id:"emails", icon:"mail", label:"E-poçt" },
    { id:"user-modules", icon:"settings", label:"Rol Modulları" },
    { id:"studio", icon:"component", label:"No-Code Studio" },
  ]},
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AdminSidebar({ tab, setTab, badges, collapsed, setCollapsed }) {
  return (
    <aside className={`${collapsed?"w-16":"w-64"} hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-200 max-h-screen overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        {!collapsed && <span className="font-extrabold text-gray-900 text-sm">Admin Panel</span>}
        <button onClick={()=>setCollapsed(v=>!v)} className="btn-icon ml-auto">
          <Icon name={collapsed ? "arrowRight" : "arrowLeft"} size={16} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {SIDEBAR_GROUPS.map(group=>(
          <div key={group.label}>
            {!collapsed && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">{group.label}</p>}
            {group.items.map(item=>{
              const badgeNum = item.badge === "pending" ? badges?.pendingProducts : item.badge === "reviews" ? badges?.pendingReviews : 0;
              return (
                <button key={item.id} onClick={()=>setTab(item.id)}
                  className={`w-full flex items-center ${collapsed?"justify-center":"gap-3"} px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${tab===item.id?"bg-brand-50 text-brand-700 font-semibold":"text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <Icon name={item.icon} size={18} className="shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && badgeNum>0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badgeNum}</span>
                  )}
                  {collapsed && badgeNum>0 && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
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
  const allItems = SIDEBAR_GROUPS.flatMap(g=>g.items);
  return (
    <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
      <div className="flex px-2 py-1.5 gap-1 min-w-max">
        {allItems.map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab===item.id?"bg-brand-50 text-brand-700":"text-gray-500"}`}>
            <Icon name={item.icon} size={16} />{item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
function DashboardStats({ stats, loading }) {
  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4,5,6,7,8].map(i=><SkeletonCard key={i}/>)}</div>;
  if (!stats) return null;
  const cards = [
    { icon:"user", label:"Ümumi İstifadəçi", value:stats.users.total, change: null, color:"brand" },
    { icon:"checkCircle", label:"Aktiv Elan", value:stats.products.active, color:"brand" },
    { icon:"clock", label:"Moderasiya Gözləyir", value:stats.products.pending, color:"amber" },
    { icon:"package", label:"Ümumi Sifariş", value:stats.orders.total, color:"blue" },
    { icon:"wallet", label:"Bu Ay Gəlir (AZN)", value:stats.revenue.thisMonth, suffix:"", prefix:"₼", color:"brand", change:stats.revenue.growth },
    { icon:"store", label:"Mağazalar", value:stats.stores.total, color:"purple" },
    { icon:"star", label:"Gözləyən Rəy", value:stats.reviews.pending, color:"amber" },
    { icon:"bell", label:"Aktiv Kampaniya", value:stats.campaigns.active, color:"blue" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title mb-1">İdarə Paneli</h2>
        <p className="section-subtitle">Real vaxt iş göstəriciləri</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {cards.map(c=><StatCard key={c.label} {...c} />)}
      </div>
      {/* Revenue highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-5 md:col-span-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ümumi Dövriyyə</p>
            <p className="text-3xl font-extrabold text-brand-700 mt-1">₼{Number(stats.revenue.total).toLocaleString("az-AZ")}</p>
            <p className="text-xs text-gray-500 mt-1">Bu ay: ₼{Number(stats.revenue.thisMonth).toLocaleString("az-AZ")} <span className={`ml-2 font-semibold ${Number(stats.revenue.growth)>=0?"text-emerald-600":"text-red-500"}`}><Icon name={Number(stats.revenue.growth)>=0 ? "arrowUp" : "arrowDown"} size={12} className="inline mr-0.5" />{Math.abs(Number(stats.revenue.growth))}%</span></p>
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
  const ACTION_ICONS = { REVIEW_CREATED:"star", REVIEW_APPROVED:"checkCircle", REVIEW_REJECTED:"closeCircle", ORDER_CREATED:"package", USER_BANNED:"ban", PRODUCT_APPROVED:"checkCircle", LOGIN:"key" };
  return (
    <div className="space-y-4">
      <h2 className="section-title">Son Fəaliyyət</h2>
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {activity.map(log=>(
            <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <span className="shrink-0 mt-0.5 text-gray-500"><Icon name={ACTION_ICONS[log.action]||"info"} size={18} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g," ")}</p>
                <p className="text-xs text-gray-500 truncate">{log.user?.fullName||"System"} · {log.entity}</p>
              </div>
              <p className="text-[11px] text-gray-400 shrink-0">{new Date(log.createdAt).toLocaleTimeString("az-AZ",{hour:"2-digit",minute:"2-digit"})}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pending Products (Moderation) ───────────────────────────────────────────
function PendingProducts() {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const { toast, ToastContainer } = useToast();
  const load = useCallback(()=>{
    setLoading(true);
    apiFetch("/api/products?status=PENDING_REVIEW&pageSize=50").then(d=>setItems(d.products||[])).catch(e=>toast(e.message,"error")).finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{ load(); },[load]);
  async function decide(id,status) {
    try { await apiFetch(`/api/products/${id}`,{method:"PATCH",body:JSON.stringify({status})}); toast(status==="ACTIVE"?"Elan təsdiqləndi":"Elan rədd edildi","success"); load(); } catch(e){ toast(e.message,"error"); }
  }
  if (loading) return <SkeletonList count={5} />;
  if (!items.length) return <EmptyState icon="checkCircle" title="Moderasiya gözləyən elan yoxdur" subtitle="Bütün elanlar yoxlanılmışdır" />;
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <div className="flex items-center justify-between">
        <h2 className="section-title">Moderasiya Növbəsi</h2>
        <span className="badge badge-yellow">{items.length} gözləyir</span>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="table-header">
            <tr><th className="table-cell text-left">Məhsul</th><th className="table-cell text-left hidden md:table-cell">Satıcı</th><th className="table-cell text-left hidden sm:table-cell">Qiymət</th><th className="table-cell text-right">Əməl</th></tr>
          </thead>
          <tbody>
            {items.map(p=>(
              <tr key={p.id} className="table-row">
                <td className="table-cell"><p className="font-medium line-clamp-1">{p.titleAz}</p><p className="caption">{p.category?.nameAz}</p></td>
                <td className="table-cell hidden md:table-cell text-gray-600">{p.seller?.fullName||"—"}</td>
                <td className="table-cell hidden sm:table-cell font-semibold text-brand-700">₼{Number(p.price).toLocaleString("az-AZ")}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={()=>decide(p.id,"ACTIVE")} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12} />Təsdiqlə</button>
                    <button onClick={()=>decide(p.id,"REJECTED")} className="btn-danger btn-xs flex items-center gap-1"><Icon name="close" size={12} />Rədd et</button>
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
  const [users,setUsers]=useState([]); const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState(""); const [roleFilter,setRoleFilter]=useState("");
  const [editUser,setEditUser]=useState(null);
  const [pwUser,setPwUser]=useState(null);
  const [pwValue,setPwValue]=useState("");
  const [walletUser,setWalletUser]=useState(null);
  const [walletData,setWalletData]=useState({balance:0,coins:0,loading:false});
  const [walletSaving,setWalletSaving]=useState(false);
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{
    setLoading(true);
    const q=new URLSearchParams({pageSize:100, ...(search&&{search}), ...(roleFilter&&{role:roleFilter})});
    apiFetch(`/api/admin/users?${q}`).then(d=>setUsers(d.users||[])).catch(e=>toast(e.message,"error")).finally(()=>setLoading(false));
  },[search,roleFilter]);
  async function updateUser(id,data){
    try{ await apiFetch(`/api/admin/users/${id}`,{method:"PATCH",body:JSON.stringify(data)}); toast("Güncəlləndi"); setUsers(p=>p.map(u=>u.id===id?{...u,...data}:u)); }catch(e){toast(e.message,"error");}
  }
  async function deleteUser(id){
    if(!confirm("Bu istifadəçini və bütün məlumatlarını silmək istədiyinizə əminsiniz? Bu geri alına bilməz!"))return;
    try{
      await apiFetch(`/api/admin/users/${id}`,{method:"DELETE"});
      setUsers(p=>p.filter(u=>u.id!==id));
      toast("İstifadəçi silindi");
    }catch(e){toast(e.message,"error");}
  }
  async function saveEdit(){
    if(!editUser)return;
    try{
      const res = await apiFetch(`/api/admin/users/${editUser.id}`,{method:"PATCH",body:JSON.stringify({
        fullName: editUser.fullName, email: editUser.email, phone: editUser.phone||null, username: editUser.username||null
      })});
      const updated = res?.user||{};
      setUsers(p=>p.map(u=>u.id===editUser.id?{...u,...updated, fullName:editUser.fullName, email:editUser.email, phone:editUser.phone, username:editUser.username}:u));
      toast("Profil güncəlləndi");
      setEditUser(null);
    }catch(e){toast(e.message,"error");}
  }
  async function changePassword(){
    if(!pwUser||!pwValue)return;
    if(pwValue.length<6){toast("Şifrə ən azı 6 simvol olmalıdır","error");return;}
    try{
      await apiFetch(`/api/admin/users/${pwUser.id}`,{method:"PATCH",body:JSON.stringify({newPassword:pwValue})});
      toast("Şifrə dəyişdirildi");
      setPwUser(null);
      setPwValue("");
    }catch(e){toast(e.message,"error");}
  }
  async function openWallet(user){
    setWalletUser(user);
    setWalletData({balance:0,coins:0,loading:true});
    try{
      const res = await apiFetch(`/api/admin/users/${user.id}/wallet`);
      setWalletData({balance:Number(res.wallet?.balance||0),coins:Number(res.wallet?.coins||0),loading:false});
    }catch(e){
      toast(e.message,"error");
      setWalletData({balance:0,coins:0,loading:false});
    }
  }
  async function saveWallet(){
    if(!walletUser)return;
    setWalletSaving(true);
    try{
      await apiFetch(`/api/admin/users/${walletUser.id}/wallet`,{method:"PATCH",body:JSON.stringify({
        balance:walletData.balance,
        coins:walletData.coins
      })});
      toast("Balans güncəlləndi");
      setWalletUser(null);
    }catch(e){toast(e.message,"error");}
    finally{setWalletSaving(false);}
  }
  const STATUS_COLOR = { ACTIVE:"badge-green",PENDING_VERIFICATION:"badge-yellow",SUSPENDED:"badge-yellow",BANNED:"badge-red" };
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">İstifadəçilər</h2>
        <span className="badge badge-gray">{users.length} nəticə</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <input placeholder="Ad, email axtar..." value={search} onChange={e=>setSearch(e.target.value)} className="input-sm flex-1 min-w-48" />
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="select-field w-auto text-xs py-2">
          <option value="">Bütün rollar</option>
          {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      {loading ? <SkeletonList count={6}/> : !users.length ? <EmptyState icon="user" title="İstifadəçi tapılmadı"/> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="table-header"><tr>
              <th className="table-cell text-left">İstifadəçi</th>
              <th className="table-cell text-left">Rol</th>
              <th className="table-cell text-left">Status</th>
              <th className="table-cell text-right">Əməl</th>
            </tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">{u.fullName?.[0]}</div>
                      <div><p className="font-medium text-sm">{u.fullName}</p><p className="caption">{u.email}</p>{u.phone&&<p className="caption text-brand-600">{u.phone}</p>}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <select defaultValue={u.role} onChange={e=>updateUser(u.id,{role:e.target.value})} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400">
                      {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="table-cell"><span className={`badge ${STATUS_COLOR[u.status]||"badge-gray"}`}>{u.status}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5 justify-end flex-wrap">
                      <button onClick={()=>setEditUser({...u})} className="btn-secondary btn-xs flex items-center gap-1"><Icon name="edit" size={12}/>Redaktə</button>
                      {u.status!=="BANNED"&&<button onClick={()=>updateUser(u.id,{status:"BANNED"})} className="btn-danger btn-xs">Ban</button>}
                      {u.status==="BANNED"&&<button onClick={()=>updateUser(u.id,{status:"ACTIVE"})} className="btn-secondary btn-xs">Aktivləşdir</button>}
                      {u.status==="ACTIVE"&&<button onClick={()=>updateUser(u.id,{status:"SUSPENDED"})} className="btn-secondary btn-xs">Dondurul</button>}
                      <button onClick={()=>{setPwUser(u);setPwValue("");}} className="btn-secondary btn-xs flex items-center gap-1"><Icon name="lock" size={12}/>Şifrə</button><button onClick={()=>openWallet(u)} className="btn-secondary btn-xs flex items-center gap-1"><Icon name="wallet" size={12}/>Balans</button><button onClick={()=>deleteUser(u.id)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12}/>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Profil Redaktə</h3>
              <button onClick={()=>setEditUser(null)} className="btn-icon"><Icon name="x" size={18}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Ad Soyad</label>
                <input value={editUser.fullName||""} onChange={e=>setEditUser({...editUser,fullName:e.target.value})} className="input-sm w-full" placeholder="Ad Soyad"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
                <input value={editUser.email||""} onChange={e=>setEditUser({...editUser,email:e.target.value})} className="input-sm w-full" placeholder="email@example.com"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Telefon</label>
                <input value={editUser.phone||""} onChange={e=>setEditUser({...editUser,phone:e.target.value})} className="input-sm w-full" placeholder="+994..."/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">İstifadəçi adı</label>
                <input value={editUser.username||""} onChange={e=>setEditUser({...editUser,username:e.target.value})} className="input-sm w-full" placeholder="username"/>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button onClick={()=>setEditUser(null)} className="btn-secondary px-4 py-2 text-sm rounded-xl">İmtina</button>
              <button onClick={saveEdit} className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-1"><Icon name="check" size={14}/>Yadda saxla</button>
            </div>
          </div>
        </div>
      )}
      {pwUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>{setPwUser(null);setPwValue("");}}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Şifrə Dəyiş</h3>
              <button onClick={()=>{setPwUser(null);setPwValue("");}} className="btn-icon"><Icon name="x" size={18}/></button>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">İstifadəçi: <strong>{pwUser.fullName}</strong> ({pwUser.email})</p>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Yeni şifrə</label>
              <input type="password" value={pwValue} onChange={e=>setPwValue(e.target.value)} className="input-sm w-full" placeholder="Ən azı 6 simvol" minLength={6}/>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button onClick={()=>{setPwUser(null);setPwValue("");}} className="btn-secondary px-4 py-2 text-sm rounded-xl">İmtina</button>
              <button onClick={changePassword} className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-1"><Icon name="check" size={14}/>Şifrəni Dəyiş</button>
            </div>
          </div>
        </div>
      )}
      {walletUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setWalletUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Balans İdarəetmə</h3>
              <button onClick={()=>setWalletUser(null)} className="btn-icon"><Icon name="x" size={18}/></button>
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
                      onChange={e=>setWalletData({...walletData,balance:parseFloat(e.target.value)||0})}
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
                      onChange={e=>setWalletData({...walletData,coins:parseFloat(e.target.value)||0})}
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
                <button onClick={()=>setWalletUser(null)} className="btn-secondary px-4 py-2 text-sm rounded-xl">İmtina</button>
                <button onClick={saveWallet} disabled={walletSaving} className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-1 disabled:opacity-50">
                  <Icon name="check" size={14}/>{walletSaving?"Saxlanılır...":"Yadda saxla"}
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
  const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true);
  const [statusFilter,setStatusFilter]=useState("");
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ load(); },[statusFilter]);
  function load(){
    setLoading(true);
    const q=new URLSearchParams({pageSize:100,...(statusFilter&&{status:statusFilter})});
    apiFetch(`/api/orders?${q}`).then(d=>setOrders(d.orders||[])).catch(e=>toast(e.message,"error")).finally(()=>setLoading(false));
  }
  async function changeStatus(id,status){
    try{ await apiFetch(`/api/orders/${id}`,{method:"PATCH",body:JSON.stringify({status})}); toast("Status dəyişdirildi"); load(); }catch(e){toast(e.message,"error");}
  }
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Sifarişlər</h2>
      </div>
      <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="select-field w-auto">
        <option value="">Bütün statuslar</option>
        {Object.entries(ORDER_STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select>
      {loading ? <SkeletonList count={5}/> : !orders.length ? <EmptyState icon="package" title="Sifariş tapılmadı"/> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead className="table-header"><tr>
              <th className="table-cell text-left">Sifariş</th>
              <th className="table-cell text-left hidden sm:table-cell">Alıcı</th>
              <th className="table-cell text-left">Məbləğ</th>
              <th className="table-cell text-left">Status</th>
              <th className="table-cell text-right">Dəyişdir</th>
            </tr></thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o.id} className="table-row">
                  <td className="table-cell"><p className="font-mono text-xs text-gray-500">#{o.id.slice(-8)}</p><p className="caption">{new Date(o.createdAt).toLocaleDateString("az-AZ")}</p></td>
                  <td className="table-cell hidden sm:table-cell">{o.buyer?.fullName||"—"}</td>
                  <td className="table-cell font-semibold text-brand-700">₼{Number(o.total).toLocaleString("az-AZ")}</td>
                  <td className="table-cell"><span className={`badge ${ORDER_STATUS_COLORS[o.status]||"badge-gray"}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
                  <td className="table-cell">
                    <select defaultValue={o.status} onChange={e=>changeStatus(o.id,e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400">
                      {Object.entries(ORDER_STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Reviews Manager ──────────────────────────────────────────────────────────
function ReviewsManager() {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("pending");
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ load(); },[filter]);
  function load(){
    setLoading(true);
    apiFetch(`/api/admin/reviews?filter=${filter}`)
      .then(d=>setItems(d.reviews||[])).catch(e=>toast(e.message,"error")).finally(()=>setLoading(false));
  }
  async function approve(id){ try{ await apiFetch(`/api/reviews/${id}`,{method:"PATCH",body:JSON.stringify({isApproved:true})}); toast("Rəy təsdiqləndi"); setItems(p=>p.map(r=>r.id===id?{...r,isApproved:true}:r)); }catch(e){toast(e.message,"error");} }
  async function reject(id){ try{ await apiFetch(`/api/reviews/${id}`,{method:"PATCH",body:JSON.stringify({isApproved:false})}); toast("Rəy geri çəkildi"); setItems(p=>p.map(r=>r.id===id?{...r,isApproved:false}:r)); }catch(e){toast(e.message,"error");} }
  async function del(id){ if(!confirm("Bu rəyi silmək istədiyinizə əminsiniz?"))return; try{ await apiFetch(`/api/reviews/${id}`,{method:"DELETE"}); setItems(p=>p.filter(r=>r.id!==id)); toast("Rəy silindi"); }catch(e){toast(e.message,"error");} }
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Rəylər</h2>
        {filter==="pending"&&items.length>0&&<span className="badge badge-yellow">{items.length} gözləyir</span>}
      </div>
      <div className="flex gap-1">
        {[["pending","Gözləyən"],["approved","Aktiv"],["all","Hamısı"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className={`btn-sm ${filter===v?"btn-primary":"btn-secondary"}`}>{l}</button>
        ))}
      </div>
      {loading?<SkeletonList count={4}/>:!items.length?<EmptyState icon="star" title="Rəy tapılmadı"/>:(
        <div className="space-y-2">
          {items.map(r=>(
            <div key={r.id} className={`card p-4 border-l-4 ${r.isApproved?"border-l-emerald-400":"border-l-amber-400"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{r.author?.fullName}</span>
                    <span className="text-amber-500 text-sm">{Array.from({length: 5}).map((_, i) => <Icon key={i} name="star" size={14} className={i < r.rating ? "fill-amber-400 text-amber-500 inline" : "text-gray-300 inline"} />)}</span>
                    <span className={`badge ${r.isApproved?"badge-green":"badge-yellow"}`}>{r.isApproved?"Aktiv":"Gözləmədə"}</span>
                  </div>
                  <p className="caption truncate">{r.product?.titleAz}</p>
                  {r.comment&&<p className="text-sm text-gray-700 mt-1">{r.comment}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!r.isApproved?<button onClick={()=>approve(r.id)} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12} />Təsdiqlə</button>:<button onClick={()=>reject(r.id)} className="btn-secondary btn-xs">Geri çək</button>}
                  <button onClick={()=>del(r.id)} className="text-[11px] text-red-500 hover:underline">Sil</button>
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
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({nameAz:"",slug:"",icon:"",isActive:true,parentId:""});
  const [msg,setMsg]=useState(""); const [err,setErr]=useState("");
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ apiFetch("/api/categories").then(d=>setItems(d.categories||[])).finally(()=>setLoading(false)); },[]);
  async function create(e){ e.preventDefault(); setErr(""); try{ const d=await apiFetch("/api/categories",{method:"POST",body:JSON.stringify(form)}); setItems(p=>[...p,d.category]); setForm({nameAz:"",slug:"",icon:"",isActive:true,parentId:""}); toast("Kateqoriya əlavə edildi"); }catch(e){setErr(e.message);} }
  async function toggleActive(id,val){ try{ await apiFetch(`/api/categories/${id}`,{method:"PATCH",body:JSON.stringify({isActive:val})}); setItems(p=>p.map(c=>c.id===id?{...c,isActive:val}:c)); toast("Yeniləndi"); }catch(e){toast(e.message,"error");} }
  const parents=items.filter(c=>!c.parentId);
  return (
    <div className="space-y-5">
      <ToastContainer/>
      <h2 className="section-title">Kateqoriyalar</h2>
      <form onSubmit={create} className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><label className="label">Ad (AZ)</label><input required value={form.nameAz} onChange={e=>setForm(p=>({...p,nameAz:e.target.value}))} className="input-field"/></div>
        <div><label className="label">Slug</label><input required value={form.slug} onChange={e=>setForm(p=>({...p,slug:e.target.value}))} className="input-field" placeholder="meyvə-tərəvəz"/></div>
        <div><label className="label">İkon</label><input value={form.icon} onChange={e=>setForm(p=>({...p,icon:e.target.value}))} className="input-field" placeholder="sprout"/></div>
        <div className="col-span-2 md:col-span-1"><label className="label">Valideyn kateqoriya</label>
          <select value={form.parentId} onChange={e=>setForm(p=>({...p,parentId:e.target.value}))} className="select-field">
            <option value="">— Ana kateqoriya —</option>
            {parents.map(c=><option key={c.id} value={c.id}>{c.icon} {c.nameAz}</option>)}
          </select>
        </div>
        {err&&<p className="col-span-full text-sm text-red-600">{err}</p>}
        <div className="col-span-full"><button type="submit" className="btn-primary">Əlavə et</button></div>
      </form>
      {loading?<SkeletonList count={4}/>:(
        <div className="card overflow-x-auto">
          <table className="w-full"><thead className="table-header"><tr><th className="table-cell text-left">Kateqoriya</th><th className="table-cell text-left hidden sm:table-cell">Slug</th><th className="table-cell text-left hidden md:table-cell">Tip</th><th className="table-cell text-right">Status</th></tr></thead>
          <tbody>{items.map(c=>(
            <tr key={c.id} className="table-row">
              <td className="table-cell font-medium">{c.icon} {c.nameAz}</td>
              <td className="table-cell hidden sm:table-cell"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{c.slug}</code></td>
              <td className="table-cell hidden md:table-cell"><span className={`badge ${c.parentId?"badge-blue":"badge-purple"}`}>{c.parentId?"Alt":"Ana"}</span></td>
              <td className="table-cell text-right">
                <button onClick={()=>toggleActive(c.id,!c.isActive)} className={`badge cursor-pointer ${c.isActive?"badge-green":"badge-gray"}`}>{c.isActive ? "Aktiv" : "Deaktiv"}</button>
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
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("PENDING");
  const { toast, ToastContainer } = useToast();

  useEffect(()=>{ load(); },[filter]);
  function load(){
    setLoading(true);
    apiFetch(`/api/admin/wallet-withdrawals?status=${filter}`)
      .then(d=>setItems(d.transactions||[]))
      .catch(e=>toast(e.message,"error"))
      .finally(()=>setLoading(false));
  }
  async function decide(id,action){
    try{
      await apiFetch(`/api/admin/wallet-withdrawals/${id}`,{method:"PATCH",body:JSON.stringify({action})});
      toast(action==="approve"?"Ödəniş təsdiqləndi":"Ödəniş rədd edildi — məbləğ geri qaytarıldı");
      setItems(p=>p.filter(r=>r.id!==id));
    }catch(e){toast(e.message,"error");}
  }

  const totalAmount = items.reduce((s,r)=>s+Number(r.amount),0);

  return (
    <div className="space-y-4">
      <ToastContainer/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Pul Kisəsi — Çıxarış Tələbləri</h2>
          {items.length>0&&<p className="caption">Cəmi: <span className="font-bold text-brand-700">₼{totalAmount.toLocaleString("az-AZ")}</span></p>}
        </div>
        <div className="flex gap-2">
          {[["PENDING","Gözləyən"],["COMPLETED","Tamamlanmış"],["REJECTED","Rədd edilmiş"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} className={`btn-xs ${filter===v?"btn-primary":"btn-secondary"}`}>{l}</button>
          ))}
        </div>
      </div>
      {loading?<SkeletonList count={3}/>:!items.length?<EmptyState icon="wallet" title="Tələb tapılmadı"/>:(
        <div className="space-y-3">
          {items.map(r=>(
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold shrink-0">
                    {r.wallet?.user?.fullName?.[0]||"?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.wallet?.user?.fullName||"—"}</p>
                    <p className="caption">{r.wallet?.user?.email}</p>
                    <p className="caption">{r.wallet?.user?.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-brand-700">₼{Number(r.amount).toLocaleString("az-AZ")}</p>
                  <p className="caption">{new Date(r.createdAt).toLocaleDateString("az-AZ")}</p>
                  {r.description&&<p className="text-xs text-gray-400 mt-1 max-w-48">{r.description}</p>}
                </div>
              </div>
              {filter==="PENDING"&&(
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={()=>decide(r.id,"approve")} className="btn-primary btn-xs flex-1 flex items-center justify-center gap-1"><Icon name="check" size={12}/>Təsdiqlə</button>
                  <button onClick={()=>decide(r.id,"reject")} className="btn-danger btn-xs flex-1 flex items-center justify-center gap-1"><Icon name="close" size={12}/>Rədd et</button>
                </div>
              )}
              {filter!=="PENDING"&&(
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className={`badge ${filter==="COMPLETED"?"badge-green":"badge-red"}`}>
                    {filter==="COMPLETED" ? <span className="flex items-center gap-1 text-emerald-600"><Icon name="checkCircle" size={14}/>Tamamlandı</span> : <span className="flex items-center gap-1 text-red-500"><Icon name="closeCircle" size={14}/>Rədd edildi</span>}
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
  const [posts,setPosts]=useState([]); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({titleAz:"",contentAz:"",category:"tips",isPublished:false});
  const [creating,setCreating]=useState(false);
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ apiFetch("/api/blog?pageSize=50").then(d=>setPosts(d.posts||[])).finally(()=>setLoading(false)); },[]);
  async function create(e){
    e.preventDefault(); setCreating(true);
    try{ const d=await apiFetch("/api/blog",{method:"POST",body:JSON.stringify(form)}); setPosts(p=>[d.post,...p]); setForm({titleAz:"",contentAz:"",category:"tips",isPublished:false}); toast("Bloq yazısı əlavə edildi"); }catch(e){toast(e.message,"error");}finally{setCreating(false);}
  }
  async function del(id){ if(!confirm("Silmək istədiyinizə əminsiniz?"))return; try{ await apiFetch(`/api/blog/${id}`,{method:"DELETE"}); setPosts(p=>p.filter(x=>x.id!==id)); toast("Silindi"); }catch(e){toast(e.message,"error");} }
  return (
    <div className="space-y-5">
      <ToastContainer/>
      <h2 className="section-title">Bloq İdarəetmə</h2>
      <form onSubmit={create} className="card p-5 space-y-3">
        <p className="heading-sm">Yeni Yazı</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Başlıq (AZ)</label><input required value={form.titleAz} onChange={e=>setForm(p=>({...p,titleAz:e.target.value}))} className="input-field"/></div>
          
          <div className="col-span-2"><label className="label">Kateqoriya</label>
            <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="select-field">
              <option value="tips">Tövsiyyə</option><option value="news">Xəbər</option><option value="market">Bazar</option><option value="agronomy">Aqronomiya</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">Məzmun (AZ)</label><textarea required rows={4} value={form.contentAz} onChange={e=>setForm(p=>({...p,contentAz:e.target.value}))} className="input-field"/></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="pub" checked={form.isPublished} onChange={e=>setForm(p=>({...p,isPublished:e.target.checked}))}/><label htmlFor="pub" className="text-sm font-medium">Dərc et</label></div>
        </div>
        <button type="submit" disabled={creating} className="btn-primary">{creating?"Yüklənir...":"Əlavə et"}</button>
      </form>
      {loading?<SkeletonList count={3}/>:!posts.length?<EmptyState icon="fileText" title="Bloq yazısı yoxdur"/>:(
        <div className="space-y-2">
          {posts.map(p=>(
            <div key={p.id} className="card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{p.titleAz}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${p.isPublished?"badge-green":"badge-gray"}`}>{p.isPublished?"Dərc edilib":"Qaralama"}</span>
                  <span className="caption">{new Date(p.createdAt).toLocaleDateString("az-AZ")}</span>
                </div>
              </div>
              <button onClick={()=>del(p.id)} className="btn-icon text-red-500"><Icon name="trash" size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Push Notify ──────────────────────────────────────────────────────────────
function PushBroadcastManager() {
  const [title,setTitle]=useState(""); const [body,setBody]=useState(""); const [sending,setSending]=useState(false);
  const { toast, ToastContainer } = useToast();
  async function send(e){
    e.preventDefault(); setSending(true);
    try{ const d=await apiFetch("/api/admin/push/broadcast",{method:"POST",body:JSON.stringify({title,body})}); toast(`${d.sent||0} abunəçiyə göndərildi`); setTitle(""); setBody(""); }catch(e){toast(e.message,"error");}finally{setSending(false);}
  }
  return (
    <div className="space-y-5">
      <ToastContainer/>
      <h2 className="section-title">Push Bildirişi Göndər</h2>
      <form onSubmit={send} className="card p-5 space-y-4 max-w-md">
        <div><label className="label">Başlıq</label><input required value={title} onChange={e=>setTitle(e.target.value)} className="input-field"/></div>
        <div><label className="label">Məzmun</label><textarea required rows={3} value={body} onChange={e=>setBody(e.target.value)} className="input-field"/></div>
        <button type="submit" disabled={sending} className="btn-primary">{sending?"Göndərilir...":<span className="flex items-center gap-1"><Icon name="upload" size={16}/>Hamıya Göndər</span>}</button>
      </form>
    </div>
  );
}

// ─── Stores Manager ───────────────────────────────────────────────────────────
function StoresManager() {
  const [stores,setStores]=useState([]); const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ 
    setLoading(true);
    apiFetch("/api/stores?all=1&includeStats=1").then(d=>setStores(d.stores||[])).finally(()=>setLoading(false)); 
  },[]);
  async function toggle(id,field,val){ 
    try{ 
      const res = await apiFetch(`/api/stores/${id}`,{method:"PATCH",body:JSON.stringify({[field]:val})}); 
      const updatedStore = res?.store;
      setStores(p=>p.map(s=>s.id===id?(updatedStore?{...s,...updatedStore}:{...s,[field]:val}):s)); 
      toast(val?"Aktivləşdirildi":"Deaktiv edildi"); 
    }catch(e){toast(e.message,"error");} 
  }
  async function deleteStore(id, name) {
    if (!confirm(`"${name}" mağazasını silmək istədiyinizə əminsiniz? Məhsullar silinməyəcək, yalnız mağaza bağlantısı qaldırılacaq.`)) return;
    try {
      await apiFetch(`/api/stores/${id}`, {method: "DELETE"});
      setStores(p => p.filter(s => s.id !== id));
      toast("Mağaza silindi");
    } catch(e) { toast(e.message, "error"); }
  }
  const filtered = search ? stores.filter(s=>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner?.fullName?.toLowerCase().includes(search.toLowerCase())
  ) : stores;
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Mağazalar</h2>
        <span className="badge badge-gray">{stores.length} mağaza</span>
      </div>
      <input placeholder="Mağaza adı, sahib axtar..." value={search} onChange={e=>setSearch(e.target.value)} className="input-sm w-full"/>
      {loading?<SkeletonList count={4}/>:!filtered.length?<EmptyState icon="store" title="Mağaza tapılmadı"/>:(
        <div className="space-y-3">
          {filtered.map(s=>(
            <div key={s.id} className="card p-4">
              <div className="flex items-start gap-3 flex-wrap">
                {s.logoUrl&&<img src={s.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e)=>{e.target.style.display='none';}}/>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <div className="flex gap-1">
                      {s.isVerified&&<span className="badge badge-green text-[10px] inline-flex items-center gap-1"><Icon name="check" size={10}/>Verified</span>}
                      {!s.isVerified&&<span className="badge badge-gray text-[10px]">Təsdiqlənməyib</span>}
                      <span className={`badge text-[10px] ${s.isActive?"badge-green":"badge-red"}`}>{s.isActive?"Aktiv":"Deaktiv"}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 inline-flex items-center gap-1"><Icon name="user" size={12}/>{s.owner?.fullName||"—"} {s.owner?.phone&&<span className="text-brand-600 font-medium">· {s.owner.phone}</span>}</p>
                  <p className="caption">{s.owner?.email}</p>
                  {s.description&&<p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.description}</p>}
                  {s._count&&<p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1"><Icon name="package" size={12}/>{s._count.products||0} məhsul</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {!s.isVerified&&<button onClick={()=>toggle(s.id,"isVerified",true)} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12}/>Doğrula</button>}
                    {s.isVerified&&<button onClick={()=>toggle(s.id,"isVerified",false)} className="btn-secondary btn-xs">Doğrulanmağı çıxar</button>}
                    <button onClick={()=>toggle(s.id,"isActive",!s.isActive)} className={`btn-xs ${s.isActive?"btn-danger":"btn-primary"}`}>{s.isActive?"Deaktiv et":"Aktivləşdir"}</button>
                    <button onClick={()=>deleteStore(s.id, s.name)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12}/>Sil</button>
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
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({code:"",discountType:"PERCENTAGE",discountValue:"10",maxUses:"",isActive:true});
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ apiFetch("/api/coupons").then(d=>setItems(d.coupons||[])).finally(()=>setLoading(false)); },[]);
  async function create(e){ e.preventDefault(); try{ const d=await apiFetch("/api/coupons",{method:"POST",body:JSON.stringify({...form,discountValue:parseFloat(form.discountValue),maxUses:form.maxUses?parseInt(form.maxUses):null})}); setItems(p=>[d.coupon,...p]); toast("Kupon əlavə edildi"); }catch(e){toast(e.message,"error");} }
  return (
    <div className="space-y-5">
      <ToastContainer/>
      <h2 className="section-title">Kuponlar</h2>
      <form onSubmit={create} className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><label className="label">Kod</label><input required value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} className="input-field font-mono" placeholder="YENI20"/></div>
        <div><label className="label">Tip</label><select value={form.discountType} onChange={e=>setForm(p=>({...p,discountType:e.target.value}))} className="select-field"><option value="PERCENTAGE">% Faiz</option><option value="FIXED">₼ Sabit</option></select></div>
        <div><label className="label">Dəyər</label><input required type="number" value={form.discountValue} onChange={e=>setForm(p=>({...p,discountValue:e.target.value}))} className="input-field"/></div>
        <div><label className="label">Max istifadə</label><input type="number" value={form.maxUses} onChange={e=>setForm(p=>({...p,maxUses:e.target.value}))} className="input-field" placeholder="Limitsiz"/></div>
        <div className="col-span-full"><button type="submit" className="btn-primary">Əlavə et</button></div>
      </form>
      {loading?<SkeletonList count={3}/>:!items.length?<EmptyState icon="tag" title="Kupon yoxdur"/>:(
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="table-header"><tr><th className="table-cell text-left">Kod</th><th className="table-cell text-left">Endirim</th><th className="table-cell text-left hidden sm:table-cell">İstifadə</th><th className="table-cell text-left">Status</th></tr></thead>
            <tbody>{items.map(c=>(
              <tr key={c.id} className="table-row">
                <td className="table-cell"><code className="font-mono font-bold">{c.code}</code></td>
                <td className="table-cell">{c.discountType==="PERCENTAGE"?`${c.discountValue}%`:`₼${c.discountValue}`}</td>
                <td className="table-cell hidden sm:table-cell">{c.usedCount}/{c.maxUses||"∞"}</td>
                <td className="table-cell"><span className={`badge ${c.isActive?"badge-green":"badge-gray"}`}>{c.isActive?"Aktiv":"Deaktiv"}</span></td>
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
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ apiFetch("/api/bundles").then(d=>setItems(d.bundles||[])).finally(()=>setLoading(false)); },[]);
  async function toggleActive(id,val){ try{ await apiFetch(`/api/bundles/${id}`,{method:"PATCH",body:JSON.stringify({isActive:val})}); setItems(p=>p.map(b=>b.id===id?{...b,isActive:val}:b)); toast("Yeniləndi"); }catch(e){toast(e.message,"error");} }
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <h2 className="section-title">Bağlamalar</h2>
      {loading?<SkeletonList count={3}/>:!items.length?<EmptyState icon="gift" title="Bağlama tapılmadı"/>:(
        <div className="space-y-2">
          {items.map(b=>(
            <div key={b.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1"><p className="font-semibold text-sm">{b.title}</p><p className="caption">{b.seller?.fullName} · {b.discountType==="PERCENTAGE"?`${b.discountValue}% endirim`:`₼${b.discountValue} endirim`}</p></div>
              <button onClick={()=>toggleActive(b.id,!b.isActive)} className={`badge cursor-pointer ${b.isActive?"badge-green":"badge-gray"}`}>{b.isActive?"Aktiv":"Deaktiv"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── All Listings ─────────────────────────────────────────────────────────────
function AllListingsManager() {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState(""); const [statusFilter,setStatusFilter]=useState("PENDING_REVIEW");
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{ load(); },[search,statusFilter]);
  function load(){
    setLoading(true);
    const q=new URLSearchParams({pageSize:100,...(search&&{search}),...(statusFilter&&{status:statusFilter})});
    apiFetch(`/api/products?${q}`).then(d=>setItems(d.products||[])).catch(e=>toast(e.message,"error")).finally(()=>setLoading(false));
  }
  async function changeStatus(id,status){ 
    try{ 
      await apiFetch(`/api/products/${id}`,{method:"PATCH",body:JSON.stringify({status})}); 
      setItems(p=>p.map(x=>x.id===id?{...x,status}:x)); 
      toast(status==="ACTIVE"?"Elan təsdiqləndi":"Elan rədd edildi"); 
    }catch(e){toast(e.message,"error");} 
  }
  async function del(id){ if(!confirm("Bu elanı silmək istədiyinizə əminsiniz?"))return; try{ await apiFetch(`/api/products/${id}`,{method:"DELETE"}); setItems(p=>p.filter(x=>x.id!==id)); toast("Silindi"); }catch(e){toast(e.message,"error");} }
  const STATUSES=["ACTIVE","PENDING_REVIEW","REJECTED","SOLD","DRAFT","EXPIRED"];
  const pendingCount = items.filter(p=>p.status==="PENDING_REVIEW").length;
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Bütün Elanlar</h2>
          {pendingCount>0&&statusFilter==="PENDING_REVIEW"&&<p className="text-xs text-amber-600 font-medium mt-0.5 inline-flex items-center gap-1"><Icon name="clock" size={12}/>{pendingCount} elan təsdiq gözləyir</p>}
        </div>
        <span className="badge badge-gray">{items.length} nəticə</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <input placeholder="Ad, region, satıcı axtar..." value={search} onChange={e=>setSearch(e.target.value)} className="input-sm flex-1 min-w-40"/>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="select-field w-auto text-xs py-2">
          <option value="">Bütün statuslar</option>
          {STATUSES.map(s=><option key={s} value={s}>{s==="PENDING_REVIEW"?"Gözləyən":s==="ACTIVE"?"Aktiv":s==="REJECTED"?"Rədd":s==="SOLD"?"Satılıb":s==="DRAFT"?"Qaralama":"Bitmib"}</option>)}
        </select>
      </div>
      {loading?<SkeletonList count={5}/>:!items.length?<EmptyState icon="clipboard" title="Elan tapılmadı"/>:(
        <div className="space-y-2">
          {items.map(p=>(
            <div key={p.id} className={`card p-4 ${p.status==="PENDING_REVIEW"?"border-l-4 border-amber-400":""}`}>
              <div className="flex items-start gap-3">
                {(p.coverImage||p.images?.[0]?.url)&&<img src={p.coverImage||p.images[0].url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{p.titleAz}</p>
                      <p className="caption">₼{Number(p.price).toLocaleString("az-AZ")} · {p.region||""} {p.city||""}</p>
                      <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1"><Icon name="user" size={12}/>{p.seller?.fullName||"—"} {p.seller?.phone&&<span className="text-brand-600 font-medium">· {p.seller.phone}</span>}</p>
                      <p className="text-[11px] text-gray-400">{new Date(p.createdAt).toLocaleDateString("az-AZ")}</p>
                    </div>
                    <span className={`badge flex-shrink-0 ${PRODUCT_STATUS_COLORS[p.status]||"badge-gray"}`}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {p.status==="PENDING_REVIEW"&&(
                      <>
                        <button onClick={()=>changeStatus(p.id,"ACTIVE")} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12}/>Təsdiqlə</button>
                        <button onClick={()=>changeStatus(p.id,"REJECTED")} className="btn-danger btn-xs flex items-center gap-1"><Icon name="close" size={12}/>Rədd et</button>
                      </>
                    )}
                    {p.status!=="PENDING_REVIEW"&&(
                      <select defaultValue={p.status} onChange={e=>changeStatus(p.id,e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                        {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                    <a href={`/products/${p.slug}`} target="_blank" rel="noopener" className="btn-secondary btn-xs flex items-center gap-1"><Icon name="eye" size={12}/>Bax</a>
                    <button onClick={()=>del(p.id)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12}/>Sil</button>
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

// ─── Corporate Listings ───────────────────────────────────────────────────────
function CorporateListingsManager() {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const { toast, ToastContainer } = useToast();
  useEffect(()=>{
    apiFetch("/api/products?corporate=1&pageSize=50").then(d=>setItems(d.products||[])).finally(()=>setLoading(false));
  },[]);
  async function updateMinQty(id,minOrderQty){ try{ await apiFetch(`/api/products/${id}`,{method:"PATCH",body:JSON.stringify({minOrderQty:parseInt(minOrderQty)})}); toast("Min sifariş güncəlləndi"); }catch(e){toast(e.message,"error");} }
  return (
    <div className="space-y-4">
      <ToastContainer/>
      <h2 className="section-title">Korporativ Elanlar</h2>
      {loading?<SkeletonList count={3}/>:!items.length?<EmptyState icon="building" title="Korporativ elan yoxdur"/>:(
        <div className="space-y-2">
          {items.map(p=>(
            <div key={p.id} className="card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-40"><p className="font-semibold text-sm">{p.titleAz}</p><p className="caption">₼{Number(p.price).toLocaleString("az-AZ")} · {p.seller?.fullName}</p></div>
              <div className="flex items-center gap-2">
                <label className="caption">Min sifariş:</label>
                <input type="number" defaultValue={p.minOrderQty||1} onBlur={e=>updateMinQty(p.id,e.target.value)} className="input-sm w-20"/>
              </div>
              <span className={`badge ${PRODUCT_STATUS_COLORS[p.status]||"badge-gray"}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Campaigns & AdSlots (simple) ────────────────────────────────────────────
function CampaignsManager() {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({title:"",type:"HOMEPAGE_BANNER",targetUrl:"",imageUrl:"",startDate:"",endDate:"",status:"ACTIVE"});
  const [showForm,setShowForm]=useState(false);
  const { toast, ToastContainer } = useToast();
  const TYPES=["HOMEPAGE_BANNER","CATEGORY_BANNER","STORE_PROMOTION","FLASH_SALE","DAILY_DEAL","SPONSORED_PRODUCT","REGIONAL"];
  const CAMPAIGN_STATUS_LABELS={"ACTIVE":"Aktiv","PAUSED":"Dayandırılıb","ENDED":"Bitib","SCHEDULED":"Planlanmış"};
  useEffect(()=>{ apiFetch("/api/campaigns?all=1").then(d=>setItems(d.campaigns||[])).finally(()=>setLoading(false)); },[]);
  async function create(e){ 
    e.preventDefault(); 
    const payload={...form,
      startDate:form.startDate?new Date(form.startDate+"T00:00:00").toISOString():undefined,
      endDate:form.endDate?new Date(form.endDate+"T23:59:59").toISOString():undefined,
      targetUrl:form.targetUrl||undefined,imageUrl:form.imageUrl||undefined,
    };
    try{ 
      const d=await apiFetch("/api/campaigns",{method:"POST",body:JSON.stringify(payload)}); 
      setItems(p=>[d.campaign,...p]); 
      toast("Kampaniya əlavə edildi"); 
      setShowForm(false);
      setForm({title:"",type:"HOMEPAGE_BANNER",targetUrl:"",imageUrl:"",startDate:"",endDate:"",status:"ACTIVE"});
    }catch(e){toast(e.message,"error");}
  }
  async function toggleStatus(id,currentStatus){ 
    const newStatus=currentStatus==="ACTIVE"?"PAUSED":"ACTIVE";
    try{ 
      await apiFetch(`/api/campaigns/${id}`,{method:"PATCH",body:JSON.stringify({status:newStatus})}); 
      setItems(p=>p.map(c=>c.id===id?{...c,status:newStatus}:c)); 
      toast(newStatus==="ACTIVE"?"Kampaniya aktivləşdirildi":"Kampaniya dayandırıldı"); 
    }catch(e){toast(e.message,"error");}
  }
  async function deleteCampaign(id){ 
    if(!confirm("Kampaniyanı silmək istədiyinizə əminsiniz?"))return; 
    try{ 
      await apiFetch(`/api/campaigns/${id}`,{method:"DELETE"}); 
      setItems(p=>p.filter(c=>c.id!==id)); 
      toast("Silindi"); 
    }catch(e){toast(e.message,"error");}
  }
  return (
    <div className="space-y-5">
      <ToastContainer/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Kampaniyalar</h2>
        <button onClick={()=>setShowForm(p=>!p)} className="btn-primary btn-sm">{showForm ? <span className="flex items-center gap-1"><Icon name="close" size={14}/>Bağla</span> : <span className="flex items-center gap-1"><Icon name="plus" size={14}/>Yeni Kampaniya</span>}</button>
      </div>
      {showForm&&(
        <form onSubmit={create} className="card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Başlıq *</label><input required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="input-field" placeholder="Payız Kampaniyası"/></div>
            <div><label className="label">Tip</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="select-field">{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Status</label><select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="select-field"><option value="ACTIVE">Aktiv</option><option value="SCHEDULED">Planlanmış</option><option value="PAUSED">Dayandırılmış</option></select></div>
            <div><label className="label">Başlama *</label><input type="date" required value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} className="input-field"/></div>
            <div><label className="label">Bitmə *</label><input type="date" required value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} className="input-field"/></div>
            <div className="col-span-2"><label className="label">Hədəf URL</label><input value={form.targetUrl} onChange={e=>setForm(p=>({...p,targetUrl:e.target.value}))} className="input-field" placeholder="https://..."/></div>
            <div className="col-span-2"><label className="label">Banner Şəkli URL (istəyə bağlı)</label><input value={form.imageUrl} onChange={e=>setForm(p=>({...p,imageUrl:e.target.value}))} className="input-field" placeholder="https://..."/></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1">Kampaniya Yarat</button>
            <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Ləğv et</button>
          </div>
        </form>
      )}
      {loading?<SkeletonList count={3}/>:!items.length?<EmptyState icon="bell" title="Kampaniya tapılmadı"/>:(
        <div className="space-y-3">
          {items.map(c=>(
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3 flex-wrap">
                {c.imageUrl&&<img src={c.imageUrl} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <p className="font-semibold text-sm">{c.title}</p>
                    <span className={`badge flex-shrink-0 ${c.status==="ACTIVE"?"badge-green":c.status==="PAUSED"?"badge-yellow":"badge-gray"}`}>{CAMPAIGN_STATUS_LABELS[c.status]||c.status}</span>
                  </div>
                  <p className="caption">{c.type}</p>
                  <p className="text-xs text-gray-400">{new Date(c.startDate).toLocaleDateString("az-AZ")} – {new Date(c.endDate).toLocaleDateString("az-AZ")}</p>
                  {c.targetUrl&&<p className="text-xs text-brand-600 truncate">{c.targetUrl}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <p className="text-xs text-gray-500 inline-flex items-center gap-2"><span className="inline-flex items-center gap-1"><Icon name="eye" size={12}/>{c.impressions||0} göstəriş</span> · <span className="inline-flex items-center gap-1"><Icon name="link" size={12}/>{c.clicks||0} klik</span></p>
                    {c.clicks>0&&c.impressions>0&&<p className="text-xs font-medium text-brand-600">CTR: {((c.clicks/c.impressions)*100).toFixed(1)}%</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={()=>toggleStatus(c.id,c.status)} className={`btn-xs flex-1 ${c.status==="ACTIVE"?"btn-secondary":"btn-primary"}`}>
                  {c.status==="ACTIVE"?<span className="flex items-center gap-1"><Icon name="pause" size={12}/>Dayandır</span>:<span className="flex items-center gap-1"><Icon name="check" size={12}/>Aktivləşdir</span>}
                </button>
                <button onClick={()=>deleteCampaign(c.id)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12}/>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdSlotsManager() {
  const [slots,setSlots]=useState({}); const [loading,setLoading]=useState(true);
  const { toast, ToastContainer } = useToast();
  const SLOT_KEYS=["HOMEPAGE_TOP","LIST_TOP","INFEED_SPONSORED","DETAIL_SIDEBAR","FOOTER_STRIP"];
  useEffect(()=>{ apiFetch("/api/ad-slots?includeCode=1").then(d=>{
      const arr=d.slots||[];
      const obj=Array.isArray(arr)?Object.fromEntries(arr.map(s=>[s.key,s])):arr;
      setSlots(obj);
    }).finally(()=>setLoading(false)); },[]);
  async function save(key,data){ try{ await apiFetch(`/api/ad-slots/${key}`,{method:"PATCH",body:JSON.stringify(data)}); toast("Reklam yeri yeniləndi"); }catch(e){toast(e.message,"error");} }
  return (
    <div className="space-y-5">
      <ToastContainer/>
      <h2 className="section-title">Reklam Yerləri</h2>
      {loading?<SkeletonList count={5}/>:(
        <div className="space-y-3">
          {SLOT_KEYS.map(key=>{
            const slot=slots[key]||{};
            const hasCampaign=slot.hasLiveCampaign;
            return (
              <div key={key} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{key.replace(/_/g," ")}</p>
                  <span className={`badge ${hasCampaign?"badge-green":"badge-yellow"} inline-flex items-center gap-1`}>{hasCampaign?<><Icon name="checkCircle" size={12}/>Aktiv kampaniya</>:<><Icon name="alert" size={12}/>Boş</>}</span>
                </div>
                {hasCampaign&&<p className="caption">Kampaniya: {slot.liveCampaignTitle}</p>}
              </div>
            );
          })}
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
  const [form, setForm] = useState({ tag: "", title: "", subtitle: "", cta: "Bax", href: "/products", bg: "from-brand-700 to-brand-500", emoji: "sprout" });
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const { toast, ToastContainer } = useToast();

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
      setForm({ tag: "", title: "", subtitle: "", cta: "Bax", href: "/products", bg: "from-brand-700 to-brand-500", emoji: "sprout" });
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
      body: JSON.stringify({ order: ordered.map((s,i) => ({ id: s.id, sortOrder: i })) }),
    }).then(() => toast("Sıralama saxlanıldı", "success")).catch(() => {});
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
      <ToastContainer/>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2"><Icon name="image" size={20}/>Slider İdarəsi</h2>
          <p className="text-sm text-gray-500">Slide-ları sürükləyərək sırasını dəyişin</p>
        </div>
      </div>

      {/* Create form */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon name="plus" size={18}/>Yeni Slide Əlavə Et</h3>
        <form onSubmit={createSlide} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input-field" placeholder="Etiket (məs: Kampaniya)" value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))} />
          <input className="input-field" placeholder="Başlıq *" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
          <input className="input-field md:col-span-2" placeholder="Alt başlıq" value={form.subtitle} onChange={e=>setForm(f=>({...f,subtitle:e.target.value}))} />
          <input className="input-field" placeholder="Link (məs: /products) *" required value={form.href} onChange={e=>setForm(f=>({...f,href:e.target.value}))} />
          <input className="input-field" placeholder="Düymə mətni (məs: Bax)" value={form.cta} onChange={e=>setForm(f=>({...f,cta:e.target.value}))} />
          <input className="input-field" placeholder="İkon (məs: sprout)" value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} />
          <select className="input-field" value={form.bg} onChange={e=>setForm(f=>({...f,bg:e.target.value}))}>
            {BG_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="submit" disabled={saving} className="btn-primary md:col-span-2">{saving?"Əlavə olunur...":"Slide əlavə et"}</button>
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
              className={`card p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all duration-150 ${
                overIdx === idx && dragIdx !== idx ? "border-brand-400 bg-brand-50 scale-[1.01] shadow-md" : ""
              } ${dragIdx === idx ? "opacity-40" : ""}`}
            >
              <span className="text-gray-300 text-lg select-none" title="Sürüklə"><Icon name="grid" size={16} /></span>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${slide.bg} flex items-center justify-center text-xl shrink-0`}>
                {slide.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{slide.title}</p>
                <p className="text-xs text-gray-400 truncate">{slide.href} · {slide.cta}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(slide)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${slide.isActive ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600" : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
                >
                  {slide.isActive ? <span className="inline-flex items-center gap-1 text-emerald-600"><Icon name="checkCircle" size={14}/>Aktiv</span> : <span className="inline-flex items-center gap-1 text-gray-500"><Icon name="pause" size={14}/>Deaktiv</span>}
                </button>
                <button onClick={() => deleteSlide(slide.id)} className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"><Icon name="trash" size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const { toast, ToastContainer } = useToast();

  useEffect(()=>{
    apiFetch("/api/admin/stats")
      .then(d=>{ setStats(d.stats); setActivity(d.recentActivity||[]); })
      .catch(e=>toast(e.message,"error"))
      .finally(()=>setStatsLoading(false));
  },[]);

  const badges = { pendingProducts: stats?.products?.pending||0, pendingReviews: stats?.reviews?.pending||0 };

  // Lazy render: only create the active panel component (avoids all useEffects firing at once)
  function renderPanel() {
    switch(tab) {
      case "stats":       return <DashboardStats stats={stats} loading={statsLoading}/>;
      case "activity":    return <RecentActivity activity={activity} loading={statsLoading}/>;
      case "pending":     return <PendingProducts/>;
      case "all-listings": return <AllListingsManager/>;
      case "corporate":   return <CorporateListingsManager/>;
      case "categories":  return <CategoriesManager/>;
      case "stores":      return <StoresManager/>;
      case "orders":      return <OrdersAll/>;
      case "wallet":      return <WalletWithdrawalsManager/>;
      case "coupons":     return <CouponsManager/>;
      case "users":       return <UsersManager/>;
      case "reviews":     return <ReviewsManager/>;
      case "bundles":     return <BundlesManager/>;
      case "blog":        return <BlogManager/>;
      case "campaigns":   return <CampaignsManager/>;
      case "adslots":     return <AdSlotsManager/>;
      case "notify":      return <PushBroadcastManager/>;
      case "slider":      return <SliderManager/>;
      case "analytics":   return (
        <div className="space-y-4"><h2 className="font-bold text-lg flex items-center gap-2"><Icon name="trendingUp" size={20}/>Analitika Paneli</h2><AnalyticsPanel mode="admin" /></div>
      );
      case "emails": return <EmailManager/>;
      case "user-modules": return <UserModulesPanel/>;
      case "studio":      return <NoCodeAdminStudio />;
      default:            return <EmptyState icon="clock" title="Gəlir..."/>;
    }
  }

  return (
    <div className="md:grid md:grid-cols-[auto_1fr] h-full">
      <ToastContainer/>
      {/* Desktop sidebar — fixed height, own scroll */}
      <AdminSidebar tab={tab} setTab={setTab} badges={badges} collapsed={collapsed} setCollapsed={setCollapsed}/>
      {/* Content area */}
      <div className="flex flex-col min-w-0">
        {/* Mobile horizontal tab nav */}
        <AdminMobileNav tab={tab} setTab={setTab}/>
        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-5xl animate-fade-in-up">
            {renderPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}
