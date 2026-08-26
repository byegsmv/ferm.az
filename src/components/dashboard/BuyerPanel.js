"use client";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/apiClient";
import MessagingPanel from "@/components/chat/MessagingPanel";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import Icon from "@/components/ui/Icon";

const ORDER_STATUS_LABELS = {
  PENDING:    "Gözləyir",
  PAID:       "Ödənilib",
  PROCESSING: "Hazırlanır",
  SHIPPED:    "Göndərilib",
  DELIVERED:  "Çatdırılıb",
  CANCELLED:  "Ləğv edilib",
  REFUNDED:   "Geri qaytarılıb",
};

const ORDER_STATUS_COLORS = {
  PENDING:    "bg-amber-100 text-amber-800",
  PAID:       "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED:    "bg-indigo-100 text-indigo-800",
  DELIVERED:  "bg-emerald-100 text-emerald-800",
  CANCELLED:  "bg-red-100 text-red-800",
  REFUNDED:   "bg-gray-100 text-gray-600",
};

const ORDER_STATUS_ICONS = {
  PENDING:    "clock",
  PAID:       "creditCard",
  PROCESSING: "settings",
  SHIPPED:    "truck",
  DELIVERED:  "checkCircle",
  CANCELLED:  "close",
  REFUNDED:   "closeCircle",
};


function BuyerStats() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/orders?limit=200"),
      apiFetch("/api/favorites"),
    ]).then(([ordersData, favsData]) => {
      const allOrders = ordersData.orders || [];
      setOrders(allOrders);
      const delivered = allOrders.filter(o => o.status === "DELIVERED");
      const totalSpent = delivered.reduce((s, o) => s + Number(o.total || 0), 0);
      const categories = {};
      delivered.forEach(o => {
        (o.items || []).forEach(item => {
          const cat = item.product?.category?.nameAz || "Digər";
          categories[cat] = (categories[cat] || 0) + Number(item.unitPrice || 0) * (item.quantity || 1);
        });
      });
      const topCats = Object.entries(categories).sort((a,b) => b[1]-a[1]).slice(0,5);
      setStats({
        total: allOrders.length,
        delivered: delivered.length,
        totalSpent,
        favs: (favsData.favorites || []).length,
        topCats,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>;
  if (!stats) return <p className="text-center text-gray-400 py-8">Məlumat yüklənmədi</p>;

  const maxCat = Math.max(...stats.topCats.map(c=>c[1]), 1);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="dashboard" size={20} className="text-brand-600" /> Alıcı Statistikam</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Ümumi sifariş", value: stats.total, icon: "package" },
          { label: "Tamamlanan", value: stats.delivered, icon: "checkCircle" },
          { label: "Ümumi xərc", value: `₼${stats.totalSpent.toFixed(2)}`, icon: "creditCard" },
          { label: "Sevimlilər", value: stats.favs, icon: "heart" },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="flex justify-center mb-1 text-brand-600">
              <Icon name={s.icon} size={24} />
            </div>
            <div className="text-xl font-black text-brand-700">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      {stats.topCats.length > 0 && (
        <div className="card p-5">
          <p className="font-bold text-sm mb-3">Ən çox xərclədiyim kateqoriyalar</p>
          <div className="space-y-2">
            {stats.topCats.map(([cat, amt], i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-20 text-[11px] text-gray-600 truncate text-right flex-shrink-0">{cat}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{width:`${(amt/maxCat)*100}%`}}/>
                </div>
                <div className="text-[11px] font-semibold text-gray-700 w-14 text-right flex-shrink-0">₼{amt.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order: o }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${expanded?"border-brand-300 shadow-md":"border-gray-100 hover:border-brand-200"}`}>
      {/* Header */}
      <button onClick={() => setExpanded(p=>!p)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-xs text-gray-400">#{o.id.slice(-8)}</span>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(o.createdAt).toLocaleDateString("az-AZ", {day:"numeric",month:"long",year:"numeric"})}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${ORDER_STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>
            <Icon name={ORDER_STATUS_ICONS[o.status] || "clock"} size={14} />
            {ORDER_STATUS_LABELS[o.status] || o.status}
          </span>
        </div>
        {/* Product thumbnails row */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex -space-x-2">
            {(o.items||[]).slice(0,4).map((item,i)=>
              item.product?.images?.[0]?.url ? (
                <img key={i} src={item.product.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover border-2 border-white"/>
              ) : (
                <div key={i} className="w-8 h-8 rounded-lg bg-brand-100 border-2 border-white flex items-center justify-center">
                  <Icon name="sprout" size={16} className="text-brand-600" />
                </div>
              )
            )}
          </div>
          <p className="text-xs text-gray-500 flex-1 min-w-0 line-clamp-1">
            {(o.items||[]).map(it=>it.product?.titleAz||"Məhsul").join(", ")}
          </p>
          <p className="font-bold text-brand-700 text-sm flex-shrink-0">₼{Number(o.total).toFixed(2)}</p>
        </div>
      </button>
      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          {(o.items||[]).map(item=>(
            <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
              {item.product?.images?.[0]?.url ? (
                <img src={item.product.images[0].url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="sprout" size={28} className="text-brand-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.product?.titleAz||"Məhsul"}</p>
                <p className="text-xs text-gray-500">{item.quantity} ədəd × ₼{Number(item.unitPrice).toFixed(2)}</p>
                {item.product?.seller?.fullName&&<p className="text-[11px] text-gray-400 mt-0.5">Satıcı: {item.product.seller.fullName}</p>}
              </div>
              <p className="font-bold text-brand-700 text-sm flex-shrink-0">₼{(item.quantity*Number(item.unitPrice)).toFixed(2)}</p>
            </div>
          ))}
          {/* Status timeline */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {["PENDING","PAID","PROCESSING","SHIPPED","DELIVERED"].map((s,i)=>{
                const statuses=["PENDING","PAID","PROCESSING","SHIPPED","DELIVERED"];
                const idx=statuses.indexOf(o.status);
                const done=i<=idx;
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 ${done?"bg-brand-600 text-white":"bg-gray-200 text-gray-400"}`}>
                      <Icon name={ORDER_STATUS_ICONS[s] || "check"} size={10} />
                    </div>
                    {i<4&&<div className={`flex-1 h-0.5 ${done&&i<idx?"bg-brand-400":"bg-gray-200"}`}/>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuyerPanel({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    apiFetch("/api/orders")
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "favorites") {
      setFavLoading(true);
      apiFetch("/api/favorites")
        .then((d) => setFavorites(d.favorites || []))
        .catch(() => {})
        .finally(() => setFavLoading(false));
    }
  }, [tab]);

  async function removeFavorite(productId) {
    try {
      await apiFetch(`/api/favorites/${productId}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.productId !== productId));
    } catch {}
  }

  const tabs = [
    { id: "orders", label: "Sifarişlər", icon: "package" },
    { id: "favorites", label: "Sevimlilər", icon: "heart" },
    ...(user?.store ? [] : [{ id: "messages", label: "Mesajlar", icon: "message" }]),
    { id: "analytics", label: "Statistika", icon: "dashboard" },
    ...(user?.store || user?.ownedStores?.length > 0 ? [] : [{ id: "store", label: "Mağazam", icon: "store" }]),
    { id: "profile", label: "Profil", icon: "user" },
  ];
  tabs.push({ id: "agro", label: "Aqronom", icon: "sprout" });

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === t.id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.icon && <Icon name={t.icon} size={16} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {tab === "orders" && (
        <div className="card p-5">
          <h2 className="font-bold mb-4 text-gray-900">Sifariş Tarixçəsi</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <div className="flex justify-center mb-3">
                <Icon name="package" size={48} className="text-brand-300" />
              </div>
              <p className="text-gray-400 text-sm mb-4">Hələ sifarişiniz yoxdur.</p>
              <Link href="/products" className="btn-primary inline-block">Elanlara bax</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorites */}
      {tab === "favorites" && (
        <div className="card p-5">
          <h2 className="font-bold mb-4 text-gray-900">Sevimli Elanlar</h2>
          {favLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-10">
              <div className="flex justify-center mb-3">
                <Icon name="heart" size={48} className="text-brand-300" />
              </div>
              <p className="text-gray-400 text-sm mb-4">Hələ sevimli elanınız yoxdur.</p>
              <Link href="/products" className="btn-primary inline-block">Elanlara bax</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favorites.map((fav) => (
                <div key={fav.id} className="border border-gray-100 rounded-2xl p-3 hover:border-brand-200 transition-colors">
                  <Link href={`/products/${fav.product?.slug || fav.productId}`} className="block">
                    {fav.product?.images?.[0]?.url && (
                      <img
                        src={fav.product.images[0].url}
                        alt={fav.product?.title || ""}
                        className="w-full h-20 object-cover rounded-xl mb-2"
                      />
                    )}
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {fav.product?.title || fav.product?.titleAz || "Məhsul"}
                    </p>
                    <p className="text-brand-700 font-bold text-sm">₼{Number(fav.product?.price || 0).toFixed(2)}</p>
                  </Link>
                  <button
                    onClick={() => removeFavorite(fav.productId)}
                    className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <Icon name="close" size={12} /> Çıxart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {tab === "messages" && <MessagingPanel />}

      {/* Analytics */}
      {tab === "analytics" && <BuyerStats />}

      {/* Store Creation */}
      {tab === "store" && (
        <div className="card p-5">
          <h2 className="font-bold mb-4 text-gray-900 flex items-center gap-2"><Icon name="store" size={20} className="text-brand-600" /> Mağaza Yarat</h2>
          <p className="text-sm text-gray-500 mb-6">Öz mağazanızı yaradaraq məhsullarınızı satmağa başlayın. Mağaza yaratdıqdan sonra satıcı panelinə keçid edəcəksiniz.</p>
          <StoreCreateForm />
        </div>
      )}

      {/* Agronomist section */}
      {tab === "agro" && (
        <div className="card p-5">
          <h2 className="font-bold mb-2">Aqronom Profili</h2>
          <p className="text-sm text-gray-500 mb-4">
            Konsultasiya idarəetməsi tezliklə əlavə olunacaq.
          </p>
          <Link href="/agronom" className="btn-primary inline-flex items-center gap-2"><Icon name="sprout" size={18} /> AI Aqronom Alətini Sınadın</Link>
        </div>
      )}

      {/* Profile Settings */}
      {tab === "profile" && <ProfileSettings user={user} />}
    </div>
  );
}

// ─── Profile Settings ─────────────────────────────────────────────────────────
function ProfileSettings({ user }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    region: user?.region || "",
    city: user?.city || "",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true); setMsg(""); setError("");
    try {
      await apiFetch("/api/users/me", { method: "PATCH", body: JSON.stringify(form) });
      setMsg("Profil güncəlləndi");
    } catch (err) {
      setError(err.message || "Xəta baş verdi");
    } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("Yeni şifrələr uyğun gəlmir"); return; }
    if (pwForm.newPassword.length < 6) { setPwError("Şifrə ən az 6 simvol olmalıdır"); return; }
    setSavingPw(true); setPwMsg(""); setPwError("");
    try {
      await apiFetch("/api/users/me", { method: "PATCH", body: JSON.stringify({ oldPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      setPwMsg("Şifrə dəyişdirildi");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwError(err.message || "Cari şifrə yanlışdır");
    } finally { setSavingPw(false); }
  }

  const initials = (user?.fullName || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-bold text-lg">{user?.fullName}</p>
          <p className="caption">{user?.email}</p>
          <span className="badge badge-blue mt-1">{user?.role}</span>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-5">
        <h3 className="font-bold mb-4">Profil Məlumatları</h3>
        <form onSubmit={saveProfile} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
          {msg && <p className="text-sm text-green-600 bg-green-50 rounded-xl p-3">{msg}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label-sm">Ad Soyad</label>
              <input value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))} className="input-field" required />
            </div>
            <div>
              <label className="label-sm">Telefon</label>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="input-field" placeholder="+994..." />
            </div>
            <div>
              <label className="label-sm">Region</label>
              <input value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))} className="input-field" placeholder="Bakı" />
            </div>
            <div>
              <label className="label-sm">Şəhər/Rayon</label>
              <input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} className="input-field" placeholder="Abşeron" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Yadda saxlanır..." : "Yadda saxla"}</button>
        </form>
      </div>

      {/* Password Change */}
      <div className="card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="settings" size={18} className="text-brand-600" /> Şifrə Dəyişdir</h3>
        <form onSubmit={changePassword} className="space-y-3">
          {pwError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{pwError}</p>}
          {pwMsg && <p className="text-sm text-green-600 bg-green-50 rounded-xl p-3">{pwMsg}</p>}
          <div>
            <label className="label-sm">Cari Şifrə</label>
            <input type="password" value={pwForm.currentPassword} onChange={e=>setPwForm(f=>({...f,currentPassword:e.target.value}))} className="input-field" required />
          </div>
          <div>
            <label className="label-sm">Yeni Şifrə</label>
            <input type="password" value={pwForm.newPassword} onChange={e=>setPwForm(f=>({...f,newPassword:e.target.value}))} className="input-field" required />
          </div>
          <div>
            <label className="label-sm">Yeni Şifrəni Təkrarla</label>
            <input type="password" value={pwForm.confirmPassword} onChange={e=>setPwForm(f=>({...f,confirmPassword:e.target.value}))} className="input-field" required />
          </div>
          <button type="submit" disabled={savingPw} className="btn-secondary w-full">{savingPw ? "Dəyişdirilir..." : "Şifrəni Dəyiştir"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Store Creation Form ──────────────────────────────────────────────────────
function StoreCreateForm() {
  const [form, setForm] = useState({ name: "", description: "", address: "", phone: "", whatsapp: "", website: "" });
  const [extra, setExtra] = useState({ voen: "", authorizedPerson: "", taxOffice: "", legalAddress: "" });
  const [showExtra, setShowExtra] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  async function onSubmit(e) {
    e.preventDefault();
    setCreating(true); setError("");
    try {
      // Build payload — skip empty strings
      const payload = {};
      Object.keys(form).forEach((key) => {
        if (form[key] !== "" && form[key] !== null && form[key] !== undefined) {
          payload[key] = form[key];
        }
      });
      // Extra business info stored in description as structured text (backwards compatible)
      const extraLines = [];
      if (extra.voen) extraLines.push(`VÖEN: ${extra.voen}`);
      if (extra.authorizedPerson) extraLines.push(`Səlahiyyətli: ${extra.authorizedPerson}`);
      if (extra.taxOffice) extraLines.push(`Vergi Dairəsi: ${extra.taxOffice}`);
      if (extra.legalAddress) extraLines.push(`Hüquqi ünvan: ${extra.legalAddress}`);
      if (extraLines.length > 0 && payload.description) {
        payload.description = payload.description + "\n\n---\n" + extraLines.join("\n");
      } else if (extraLines.length > 0) {
        payload.description = extraLines.join("\n");
      }

      await apiFetch("/api/stores", { method: "POST", body: JSON.stringify(payload) });

      // Refresh token so role updates from BUYER→STORE immediately
      try {
        const { getRefreshToken, saveSession } = await import("@/lib/apiClient");
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const res = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (res.ok) {
            const data = await res.json();
            saveSession({ accessToken: data.accessToken, user: data.user });
          }
        }
      } catch(_) {}

      setSuccess(true);
      // Reload after short delay so user sees success message
      setTimeout(() => { window.location.reload(); }, 1500);
    } catch(err) {
      if (err.status === 409) {
        setError("Artıq mağazanız mövcuddur. Mağaza ayarlarını düzəltmək üçün 'Mağazam' sekmesine keçin.");
      } else {
        setError(err.message || "Xəta baş verdi");
      }
    } finally {
      setCreating(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="flex justify-center mb-2"><Icon name="checkCircle" size={48} className="text-brand-600" /></div>
        <h3 className="font-bold text-lg text-brand-700">Mağazanız yaradıldı!</h3>
        <p className="text-sm text-gray-500">Səhifə yenilənir...</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
      
      {/* Required fields */}
      <div>
        <label className="label-sm">Mağaza Adı *</label>
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-field" required placeholder="FermerMarket MMC" />
      </div>
      <div>
        <label className="label-sm">Haqqında (Qısa təsvir)</label>
        <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="input-field" rows="2" placeholder="Biznesiniz haqqında..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label-sm">Ünvan *</label>
          <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="input-field" required placeholder="Məs. Bakı ş., Nərimanov r." />
        </div>
        <div>
          <label className="label-sm">Əlaqə Nömrəsi</label>
          <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="input-field" placeholder="+994..." />
        </div>
        <div>
          <label className="label-sm">WhatsApp Nömrəsi</label>
          <input value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} className="input-field" placeholder="994501234567" />
        </div>
        <div>
          <label className="label-sm">Veb Sayt</label>
          <input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} className="input-field" placeholder="https://..." />
        </div>
      </div>

      {/* Optional extra business info toggle */}
      <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExtra(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2"><Icon name="clipboard" size={16} /> Əlavə Biznes Məlumatları (İsteğe Bağlı)</span>
          <span className="text-gray-400">{showExtra ? <span className="flex items-center gap-1"><Icon name="chevronDown" size={14} className="rotate-180" /> Bağla</span> : <span className="flex items-center gap-1"><Icon name="chevronDown" size={14} /> Aç</span>}</span>
        </button>
        {showExtra && (
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 border-t border-gray-100">
            <p className="col-span-full text-xs text-gray-400 pt-3">Bu məlumatlar isteğe bağlıdır. Rəsmi sənəd tələb olunmur.</p>
            <div>
              <label className="label-sm">VÖEN</label>
              <input value={extra.voen} onChange={e=>setExtra(f=>({...f,voen:e.target.value}))} className="input-field" placeholder="1234567890" />
            </div>
            <div>
              <label className="label-sm">Səlahiyyətli Şəxs</label>
              <input value={extra.authorizedPerson} onChange={e=>setExtra(f=>({...f,authorizedPerson:e.target.value}))} className="input-field" placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="label-sm">Vergi Dairəsi</label>
              <input value={extra.taxOffice} onChange={e=>setExtra(f=>({...f,taxOffice:e.target.value}))} className="input-field" placeholder="Bakı Vergi Dairəsi" />
            </div>
            <div>
              <label className="label-sm">Hüquqi Ünvan</label>
              <input value={extra.legalAddress} onChange={e=>setExtra(f=>({...f,legalAddress:e.target.value}))} className="input-field" placeholder="Qeydiyyat ünvanı" />
            </div>
          </div>
        )}
      </div>

      <button type="submit" disabled={creating} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
        {creating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Yaradılır...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Icon name="store" size={18} /> Mağaza Yarat
          </span>
        )}
      </button>
    </form>
  );
}
