"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";
import Icon from "@/components/ui/Icon";
import MessagingPanel from "@/components/chat/MessagingPanel";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import CatalogPanel from "@/components/dashboard/CatalogPanel";
import BoostModal from "@/components/products/BoostModal";
import { csvToObjects, downloadCsvTemplate } from "@/lib/bulkCsv";

const STATUS_LABELS = {
  DRAFT: "Qaralama",
  PENDING_REVIEW: "Təsdiq gözləyir",
  ACTIVE: "Aktiv",
  SOLD: "Satılıb",
  EXPIRED: "Vaxtı bitib",
  REJECTED: "Rədd edilib",
};
const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-brand-100 text-brand-800",
  SOLD: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-gray-100 text-gray-500",
  REJECTED: "bg-red-100 text-red-700",
};
const ORDER_STATUS_LABELS = {
  PENDING: "Gözləyir",
  PAID: "Ödənilib",
  PROCESSING: "Hazırlanır",
  SHIPPED: "Göndərilib",
  DELIVERED: "Çatdırılıb",
  CANCELLED: "Ləğv edilib",
  REFUNDED: "Geri qaytarılıb",
};
const NEXT_STATUS = {
  PAID: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};


// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState("idle"); // idle, loading, success, error

  async function handleSubscribePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("error");
      return;
    }
    setPushStatus("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5bsyNxYEuaYEQR74Gcw2bM" // mock VAPID key
        });
      }
      
      const res = await apiFetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("p256dh")))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("auth"))))
          }
        })
      });
      if (res.subscription) setPushStatus("success");
    } catch (err) {
      console.error(err);
      setPushStatus("error");
    }
  }

  useEffect(() => {
    apiFetch("/api/farmer/stats")
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-4 animate-pulse h-20 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  );

  if (!stats) return <div className="card p-6 text-center text-gray-400">Statistika yüklənmədi</div>;

  const maxRevenue = Math.max(...(stats.monthlyRevenue || []).map(m => m.revenue), 1);

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-700">₼{Number(stats.totalRevenue||0).toLocaleString("az-AZ")}</p>
          <p className="caption mt-1">Pul Kisəsi Balansı</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.activeListings||0}</p>
          <p className="caption mt-1">Aktiv Elan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.monthlyOrderCount||0}</p>
          <p className="caption mt-1">Bu Ay Sifariş</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{stats.avgRating||"—"}</p>
          <p className="caption mt-1">Ortalama Reytinq</p>
        </div>
      </div>

      {/* Push Notification Banner */}
      {pushStatus !== "success" && (
        <div className="card p-4 bg-brand-50 border border-brand-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-brand-900">Yeni Sifariş və Mesaj Bildirişləri</h3>
            <p className="text-xs text-brand-700 mt-1">Tarayıcıda bildirişləri açaraq yeniliklərdən dərhal xəbərdar olun.</p>
          </div>
          <button 
            onClick={handleSubscribePush} 
            disabled={pushStatus === "loading"}
            className="btn-primary text-xs px-4 py-2 shrink-0 shadow-sm"
          >
            {pushStatus === "loading" ? "Gözləyin..." : pushStatus === "error" ? "Xəta oldu" : "Bildirişləri Aç"}
          </button>
        </div>
      )}

      {/* Monthly Revenue Chart */}
      {stats.monthlyRevenue?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4">Aylıq Gəlir (son 6 ay)</h3>
          <div className="space-y-2">
            {stats.monthlyRevenue.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-12 shrink-0">{m.month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 5 : 0)}%` }}
                  >
                    {m.revenue > 0 && <span className="text-white text-[10px] font-bold">₼{Math.round(m.revenue)}</span>}
                  </div>
                </div>
                <span className="text-xs font-semibold w-16 text-right text-gray-600">{m.count} sif.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      {stats.topProducts?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">Ən Çox Satan Məhsullar</h3>
          <div className="space-y-2">
            {stats.topProducts.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">{i+1}</span>
                  <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-700">₼{Number(p.revenue).toFixed(0)}</p>
                  <p className="text-[10px] text-gray-400">{p.sold} satıldı</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {stats.recentOrders?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">Son Sifarişlər</h3>
          <div className="space-y-2">
            {stats.recentOrders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{o.buyer?.fullName||"—"}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("az-AZ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-brand-700">₼{Number(o.totalAmount).toFixed(2)}</p>
                  <span className={`badge badge-xs ${o.status==="DELIVERED"?"badge-green":o.status==="SHIPPED"?"badge-blue":"badge-yellow"}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {stats.recentReviews?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">Son Rəylər</h3>
          <div className="space-y-3">
            {stats.recentReviews.map(r => (
              <div key={r.id} className="pb-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{r.user?.fullName}</p>
                  <span className="inline-flex gap-0.5">{[1,2,3,4,5].map(n => <Icon key={n} name="star" size={12} className={n <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />)}</span>
                </div>
                <p className="text-xs text-gray-500">{r.comment}</p>
                <p className="text-[10px] text-gray-400 mt-1">{r.product?.titleAz} • {new Date(r.createdAt).toLocaleDateString("az-AZ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FarmerPanel({ user }) {
  const [tab, setTab] = useState("products");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [aiError, setAiError] = useState("");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ titleAz: "", price: "", discountedPrice: "", stock: 1, categoryId: "", region: "", city: "", descriptionAz: "", images: [], isCorporate: false, minOrderQty: "", tags: [], allowInstallment: false });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [bulkAllowed, setBulkAllowed] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkErr, setBulkErr] = useState("");
  const [myProducts, setMyProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [walletMsg, setWalletMsg] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [bundles, setBundles] = useState([]);
  const [bundlesLoading, setBundlesLoading] = useState(false);
  const [bundlesError, setBundlesError] = useState("");
  const [bundlesMsg, setBundlesMsg] = useState("");
  const [bundleForm, setBundleForm] = useState({
    title: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    productIds: [],
  });
  const [bundleSubmitting, setBundleSubmitting] = useState(false);
  const [promoteModal, setPromoteModal] = useState(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const _store = user?.store || user?.ownedStores?.[0];
  const [storeSettingsForm, setStoreSettingsForm] = useState({ 
    name: _store?.name || "",
    description: _store?.description || "",
    address: _store?.address || "",
    phone: _store?.phone || "",
    whatsapp: _store?.whatsapp || "",
    installmentEnabled: _store?.installmentEnabled || false, 
    installmentWhatsapp: _store?.installmentWhatsapp || "",
    logoUrl: _store?.logoUrl || "",
  });
  const [storeSettingsLoading, setStoreSettingsLoading] = useState(false);
  const [storeSettingsMsg, setStoreSettingsMsg] = useState("");
  const [storeSettingsError, setStoreSettingsError] = useState("");

  useEffect(() => {
    apiFetch("/api/categories").then((d) => {
      // Include both parent and child categories for product creation
      const flat = [];
      (d.categories || []).forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          cat.children.forEach((ch) => flat.push({ ...ch, name: `${cat.name} › ${ch.name}` }));
        } else {
          flat.push(cat);
        }
      });
      setCategories(flat);
    }).catch(() => {});
    loadMyProducts();
  }, []);

  useEffect(() => {
    // Bulk upload module: only visible if the user is ADMIN/SUPER_ADMIN or has
    // the BULK_CSV module granted from the admin permissions section.
    apiFetch("/api/products/bulk-upload")
      .then(() => setBulkAllowed(true))
      .catch(() => setBulkAllowed(false));
  }, []);

  useEffect(() => {
    if (tab === "orders") loadOrders();
    if (tab === "wallet") loadWallet();
    if (tab === "bundles") loadBundles();
    // messages and analytics lazy-load within their own components
  }, [tab]);

  function loadMyProducts() {
    apiFetch("/api/products?mine=1&pageSize=50").then((d) => {
      setMyProducts(d.products);
    }).catch(() => {});
  }

  function loadOrders() {
    setOrdersLoading(true);
    setOrdersError("");
    apiFetch("/api/orders?view=selling")
      .then((d) => setOrders(d.orders || []))
      .catch((e) => setOrdersError(e.message))
      .finally(() => setOrdersLoading(false));
  }

  async function handleAiAssist() {
    if (!form.titleAz) { setError("Əvvəlcə məhsul adını yazın"); return; }
    setAiLoading(true);
    setError("");
    try {
      const catName = categories.find((c) => c.id === form.categoryId)?.name || "";
      const data = await apiFetch("/api/ai/suggest-listing", {
        method: "POST",
        body: JSON.stringify({ title: form.titleAz, category: catName, price: form.price, region: form.region }),
      });
      setForm((f) => ({
        ...f,
        descriptionAz: data.description || f.descriptionAz,
        tags: data.tags || f.tags || [],
      }));
      setMsg("AI təsvir yaratdı!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

    async function handleAiSubmit(e) {
    e.preventDefault();
    if (!aiDescription.trim()) {
      setAiError("Zəhmət olmasa, məhsulunuzu qısaca təsvir edin");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const data = await apiFetch("/api/ai/suggest-listing", {
        method: "POST",
        body: JSON.stringify({ description: aiDescription, category: aiCategory }),
      });
      setForm((f) => ({
        ...f,
        titleAz: data.titleAz || f.titleAz,
        descriptionAz: data.descriptionAz || f.descriptionAz,
        tags: data.tags || f.tags || [],
        price: data.suggestedPrice !== undefined ? String(data.suggestedPrice) : f.price,
      }));
      setIsAiModalOpen(false);
      setAiDescription("");
      setAiCategory("");
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        storeId: (_store?.id || user?.store?.id) || undefined,
        titleAz: form.titleAz,
        price: form.price ? Number(form.price) : 0,
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : null,
        stock: form.stock !== "" && form.stock !== null ? Number(form.stock) : 1,
        categoryId: form.categoryId,
        region: form.region || undefined,
        city: form.city || undefined,
        descriptionAz: form.descriptionAz || undefined,
        images: form.images || [],
        isCorporate: !!form.isCorporate,
        minOrderQty: form.isCorporate && form.minOrderQty ? parseInt(form.minOrderQty, 10) : null,
        tags: form.tags || [],
        allowInstallment: !!form.allowInstallment,
      };
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });
      await apiFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      setMsg("Elan yaradıldı! Admin təsdiqindən sonra aktivləşəcək.");
      setForm({ titleAz: "", price: "", discountedPrice: "", stock: 1, categoryId: "", region: "", city: "", descriptionAz: "", images: [], isCorporate: false, minOrderQty: "", allowInstallment: false });
      loadMyProducts();
    } catch (err) {
      const details = err.details ? Object.values(err.details).flat().join(" · ") : "";
      setError(details || err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditForm({ titleAz: p.titleAz || p.title, price: p.price, discountedPrice: p.discountedPrice ?? "", stock: p.stock, region: p.region || "", city: p.city || "", images: p.images || (p.coverImage ? [{ url: p.coverImage }] : []), allowInstallment: p.allowInstallment || false });
  }

  async function saveEdit(id) {
    setError("");
    try {
      const payload = {
        storeId: (_store?.id || user?.store?.id) || undefined,
        titleAz: editForm.titleAz,
        price: editForm.price ? Number(editForm.price) : 0,
        discountedPrice: editForm.discountedPrice ? Number(editForm.discountedPrice) : null,
        stock: editForm.stock !== "" && editForm.stock !== null ? Number(editForm.stock) : 1,
        region: editForm.region || undefined,
        city: editForm.city || undefined,
        images: editForm.images || [],
        allowInstallment: !!editForm.allowInstallment,
      };
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });
      await apiFetch(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMsg("Elan yeniləndi (yenidən təsdiqə göndərildi).");
      setEditingId(null);
      loadMyProducts();
    } catch (err) {
      const details = err.details ? Object.values(err.details).flat().join(" · ") : "";
      setError(details || err.message);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Bu elanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      setMyProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleProductStatus(id, status) {
    setError("");
    try {
      const { product } = await apiFetch(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMyProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: product.status } : p)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function promoteProduct(packageId) {
    setPromoteLoading(true);
    setError("");
    try {
      await apiFetch(`/api/products/${promoteModal}/promote`, {
        method: "POST",
        body: JSON.stringify({ packageId })
      });
      setMsg("Elan Premium edildi!");
      setPromoteModal(null);
      setTimeout(() => setMsg(""), 3000);
      loadMyProducts();
      loadWallet();
    } catch(err) {
      setError(err.message);
    } finally {
      setPromoteLoading(false);
    }
  }

  async function advanceOrderStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await apiFetch(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      loadOrders();
    } catch (err) {
      setOrdersError(err.message);
    }
  }

  function loadWallet() {
    setWalletLoading(true);
    setWalletError("");
    apiFetch("/api/wallet")
      .then((d) => setWallet(d.wallet))
      .catch((e) => setWalletError(e.message))
      .finally(() => setWalletLoading(false));
  }

  async function submitWithdraw(e) {
    e.preventDefault();
    setWalletError("");
    setWalletMsg("");
    setWithdrawSubmitting(true);
    try {
      await apiFetch("/api/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount: Number(withdrawAmount), note: withdrawNote || undefined }),
      });
      setWalletMsg("Çıxarış tələbiniz göndərildi, admin təsdiqini gözləyin.");
      setWithdrawAmount("");
      setWithdrawNote("");
      loadWallet();
      setTimeout(() => setWalletMsg(""), 4000);
    } catch (err) {
      setWalletError(err.message);
    } finally {
      setWithdrawSubmitting(false);
    }
  }

  function loadBundles() {
    setBundlesLoading(true);
    setBundlesError("");
    apiFetch("/api/bundles?sellerId=" + user.id)
      .then((d) => setBundles(d.bundles))
      .catch((e) => setBundlesError(e.message))
      .finally(() => setBundlesLoading(false));
  }

  function toggleBundleProduct(productId) {
    setBundleForm((f) => {
      const has = f.productIds.includes(productId);
      return { ...f, productIds: has ? f.productIds.filter((id) => id !== productId) : [...f.productIds, productId] };
    });
  }

  async function submitBundle(e) {
    e.preventDefault();
    setBundlesError("");
    setBundlesMsg("");
    if (bundleForm.productIds.length < 2) {
      setBundlesError("Bağlamada ən azı 2 məhsul seçilməlidir.");
      return;
    }
    setBundleSubmitting(true);
    try {
      await apiFetch("/api/bundles", {
        method: "POST",
        body: JSON.stringify({
          title: bundleForm.title,
          description: bundleForm.description || undefined,
          discountType: bundleForm.discountType,
          discountValue: Number(bundleForm.discountValue),
          productIds: bundleForm.productIds,
        }),
      });
      setBundlesMsg("Bağlama yaradıldı");
      setBundleForm({ title: "", description: "", discountType: "PERCENTAGE", discountValue: "", productIds: [] });
      loadBundles();
      setTimeout(() => setBundlesMsg(""), 3000);
    } catch (err) {
      setBundlesError(err.message);
    } finally {
      setBundleSubmitting(false);
    }
  }

  async function toggleBundleActive(bundle) {
    try {
      await apiFetch(`/api/bundles/${bundle.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !bundle.isActive }),
      });
      loadBundles();
    } catch (err) {
      setBundlesError(err.message);
    }
  }

  async function deleteBundle(bundleId) {
    try {
      await apiFetch(`/api/bundles/${bundleId}`, { method: "DELETE" });
      loadBundles();
    } catch (err) {
      setBundlesError(err.message);
    }
  }


  async function createStore(e) {
    e.preventDefault();
    setStoreSettingsError("");
    setStoreSettingsMsg("");
    setStoreSettingsLoading(true);
    try {
      const data = await apiFetch("/api/stores", {
        method: "POST",
        body: JSON.stringify({
          name: storeSettingsForm.name,
          description: storeSettingsForm.description || undefined,
          address: storeSettingsForm.address || undefined,
          phone: storeSettingsForm.phone || undefined,
          whatsapp: storeSettingsForm.whatsapp || undefined,
          logoUrl: storeSettingsForm.logoUrl || undefined,
        }),
      });
      setStoreSettingsMsg("Mağaza uğurla yaradıldı!");
      // Update user object with new store
      if (user) {
        user.store = data.store;
        user.ownedStores = user.ownedStores || [];
        if (!user.ownedStores.find(s => s.id === data.store.id)) user.ownedStores.push(data.store);
        // Role stays as BUYER — all users can create stores
      }
      // Force page reload to pick up new store data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setStoreSettingsError(err.message || "Mağaza yaradıla bilmədi");
    } finally {
      setStoreSettingsLoading(false);
    }
  }

  async function saveStoreSettings(e) {
    e.preventDefault();
    setStoreSettingsError("");
    setStoreSettingsMsg("");
    setStoreSettingsLoading(true);
    try {
      await apiFetch(`/api/stores/${user.store.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: storeSettingsForm.name || undefined,
          description: storeSettingsForm.description || undefined,
          address: storeSettingsForm.address || undefined,
          phone: storeSettingsForm.phone || undefined,
          whatsapp: storeSettingsForm.whatsapp || undefined,
          installmentEnabled: storeSettingsForm.installmentEnabled,
          installmentWhatsapp: storeSettingsForm.installmentWhatsapp || null,
          logoUrl: storeSettingsForm.logoUrl || null,
        }),
      });
      setStoreSettingsMsg("Mağaza ayarları yadda saxlanıldı");
      setTimeout(() => setStoreSettingsMsg(""), 3000);
      
      // Update local user state or just let it be, Next.js dashboard might fetch it later.
      if (user && user.store) {
        user.store.name = storeSettingsForm.name;
        user.store.description = storeSettingsForm.description;
        user.store.address = storeSettingsForm.address;
        user.store.phone = storeSettingsForm.phone;
        user.store.whatsapp = storeSettingsForm.whatsapp;
        user.store.installmentEnabled = storeSettingsForm.installmentEnabled;
        user.store.installmentWhatsapp = storeSettingsForm.installmentWhatsapp;
        user.store.logoUrl = storeSettingsForm.logoUrl;
      }
    } catch (err) {
      setStoreSettingsError(err.message);
    } finally {
      setStoreSettingsLoading(false);
    }
  }

  const WALLET_TX_LABELS = {
    EARNING: "Qazanc", WITHDRAWAL: "Çıxarış", REFUND: "Geri qaytarma", ADJUSTMENT: "Düzəliş",
  };
  const WALLET_STATUS_LABELS = {
    PENDING: "Gözləyir", COMPLETED: "Tamamlandı", REJECTED: "Rədd edildi",
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "overview", label: "Ümumi Baxış" },
          { id: "products", label: "Elanlarım" },
          ...(bulkAllowed ? [{ id: "bulkUpload", label: "Toplu Yüklə" }] : []),
          { id: "orders", label: "Sifarişlərim" },
          { id: "bundles", label: "Bağlamalar" },
          { id: "wallet", label: "Pul Kisəm" },
          { id: "messages", label: "Mesajlar" },
          { id: "analytics", label: "Analitika" },
          ...((user?.store || user?.ownedStores?.length > 0) ? [{ id: "catalog", label: "Məhsullarım" }] : []),
          ...((user?.store || user?.ownedStores?.length > 0) ? [{ id: "settings", label: "Mağazam" }] : []),
          ...((!user?.store && !user?.ownedStores?.length) ? [{ id: "create-store", label: "Mağaza Aç" }] : []),
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>


      {tab === "overview" && (
        <OverviewTab user={user} />
      )}

      {tab === "catalog" && (
        <CatalogPanel user={user} />
      )}

      {tab === "products" && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Icon name="plus" size={20} /> Yeni Elan Yerləşdir</h2>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">{error}</p>}
            {msg && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg p-2 mb-3">{msg}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2 items-center">
                <input required placeholder="Məhsul adı" className="input-field flex-1" value={form.titleAz} onChange={(e) => setForm({ ...form, titleAz: e.target.value })} />
                <button type="button" onClick={() => setIsAiModalOpen(true)} className="btn-secondary !py-2.5 px-3 flex items-center gap-1 text-sm shrink-0 whitespace-nowrap bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 rounded-lg">
                  AI ilə yaz
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input required type="number" step="0.01" placeholder="Qiymət (AZN)" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <input type="number" step="0.01" placeholder="Endirimli qiymət (₼)" className="input-field !border-red-200 focus:!border-red-400" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })} />
                <input required type="number" placeholder="Stok" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <select required className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Kateqoriya seçin</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Region" className="input-field" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                <input placeholder="Şəhər" className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <ImageUploader value={form.images} onChange={(images) => setForm({ ...form, images })} />
              <div className="relative">
                <textarea placeholder="Təsvir" rows={3} className="input-field" value={form.descriptionAz} onChange={(e) => setForm({ ...form, descriptionAz: e.target.value })} />
                <button type="button" onClick={handleAiAssist} disabled={aiLoading} className="text-xs text-brand-700 font-semibold mt-1 flex items-center gap-1">
                  {aiLoading ? (
                    <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>AI yazır...</>
                  ) : "AI ilə avtomatik yaz"}
                </button>
              </div>

              {/* Tags */}
              <div>
                <label className="label">Etiketlər (hashtags)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(form.tags || []).map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full font-medium">
                      #{tag}
                      <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_,j) => j !== i) }))} className="text-brand-400 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Etiket əlavə et (Enter ilə)"
                  className="input-field text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.trim().toLowerCase().replace(/^#+/, "");
                      if (val && !(form.tags || []).includes(val) && (form.tags || []).length < 10) {
                        setForm(f => ({ ...f, tags: [...(f.tags || []), val] }));
                        e.target.value = "";
                      }
                    }
                  }}
                />
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1"><Icon name="sparkles" size={13} className="text-amber-500" /> AI avtomatik etiket təklif edir. Enter ilə özünüz də əlavə edə bilərsiniz.</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={form.isCorporate} onChange={(e) => setForm({ ...form, isCorporate: e.target.checked, minOrderQty: "" })} className="rounded" />
                  <span>Korporativ elan (toplu satış)</span>
                </label>
                {form.isCorporate && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">Minimum alış miqdarı:</label>
                    <input type="number" min={1} placeholder="məs. 50" className="input-field !py-1.5 !text-sm w-32"
                      value={form.minOrderQty} onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })} />
                    <span className="text-xs text-gray-400">ədəd</span>
                  </div>
                )}
              </div>
              
              {_store?.installmentEnabled && (
                <div className="rounded-lg border border-brand-200 p-3 bg-brand-50">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-brand-900">
                    <input type="checkbox" checked={form.allowInstallment} onChange={(e) => setForm({ ...form, allowInstallment: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500" />
                    <span>Hissəli satışa icazə ver (Kreditlə)</span>
                  </label>
                  <p className="text-[11px] text-brand-700 mt-1 pl-6">Müştərilər bu məhsulu kreditlə almaq üçün müraciət edə biləcəklər.</p>
                </div>
              )}

              <button disabled={loading} className="btn-primary w-full">{loading ? "Göndərilir..." : "Elanı Yerləşdir"}</button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-3">Mənim Elanlarım</h2>
            {myProducts.length === 0 ? (
              <p className="text-sm text-gray-400">Hələ elanınız yoxdur.</p>
            ) : (
              <div className="space-y-3">
                {myProducts.map((p) => (
                  <div key={p.id} className="border-b border-gray-100 pb-3">
                    {editingId === p.id ? (
                      <div className="space-y-2">
                        <input className="input-field" value={editForm.titleAz} onChange={(e) => setEditForm({ ...editForm, titleAz: e.target.value })} />
                        <div className="grid grid-cols-3 gap-2">
                          <input type="number" step="0.01" className="input-field" placeholder="Qiymət" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                          <input type="number" step="0.01" className="input-field !border-red-200 focus:!border-red-400" placeholder="Endirim" value={editForm.discountedPrice} onChange={(e) => setEditForm({ ...editForm, discountedPrice: e.target.value })} />
                          <input type="number" className="input-field" placeholder="Stok" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Region" className="input-field" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
                          <input placeholder="Şəhər" className="input-field" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                        </div>
                        <ImageUploader value={editForm.images} onChange={(images) => setEditForm({ ...editForm, images })} />
                        
                        {_store?.installmentEnabled && (
                          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mt-2 bg-brand-50 p-2 rounded-lg border border-brand-100">
                            <input type="checkbox" checked={editForm.allowInstallment} onChange={(e) => setEditForm({ ...editForm, allowInstallment: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500" />
                            <span className="text-brand-900">Hissəli satışa icazə ver (Kreditlə)</span>
                          </label>
                        )}

                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveEdit(p.id)} className="btn-primary text-sm px-3 py-1.5">Yadda saxla</button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary text-sm px-3 py-1.5">Ləğv et</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.title || p.titleAz}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`tag-badge ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                              {STATUS_LABELS[p.status] || p.status}
                            </span>
                            <span className="text-xs text-gray-400">Stok: {p.stock}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-brand-700">{p.price} AZN</span>
                            <a href={`/dashboard/products/${p.id}/edit`} className="text-xs font-semibold text-gray-600 hover:text-brand-700">Redaktə</a>
                            <button onClick={() => deleteProduct(p.id)} className="text-xs font-semibold text-red-600 hover:text-red-800">Sil</button>
                          </div>
                          {["ACTIVE", "SOLD", "EXPIRED"].includes(p.status) && (
                            <div className="flex items-center gap-2">
                              {p.status === "ACTIVE" && (
                                <button onClick={() => setPromoteModal(p.id)} className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                  Premium et
                                </button>
                              )}
                              {p.status !== "SOLD" && (
                                <button onClick={() => toggleProductStatus(p.id, "SOLD")} className="text-[11px] font-semibold text-blue-700 hover:text-blue-900">Satıldı kimi qeyd et</button>
                              )}
                              {p.status !== "EXPIRED" && (
                                <button onClick={() => toggleProductStatus(p.id, "EXPIRED")} className="text-[11px] font-semibold text-gray-500 hover:text-gray-700">Deaktiv et</button>
                              )}
                              {p.status !== "ACTIVE" && (
                                <button onClick={() => toggleProductStatus(p.id, "ACTIVE")} className="text-[11px] font-semibold text-brand-700 hover:text-brand-900">Aktivləşdir</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "bulkUpload" && (
        <div className="card p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><Icon name="upload" size={20} /> Toplu Məhsul Yüklə</h2>
          <p className="text-sm text-gray-500">CSV faylı ilə birdən çox məhsul əlavə edin. Məhsullar admin təsdiqindən sonra aktivləşəcək.</p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold cursor-pointer hover:bg-brand-700 transition">
              📄 CSV faylı seç
              <input type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBulkErr(""); setBulkResults(null);
                  const reader = new FileReader();
                  reader.onload = () => setBulkCsv(String(reader.result || ""));
                  reader.readAsText(file);
                }} />
            </label>
            <button type="button" onClick={downloadCsvTemplate}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              ⬇ Şablonu yüklə
            </button>
          </div>

          <textarea rows={5} className="input-field font-mono text-xs"
            placeholder="və ya CSV mətnini buraya yapışdırın..."
            value={bulkCsv}
            onChange={(e) => { setBulkCsv(e.target.value); setBulkResults(null); }} />
          <p className="text-[11px] text-gray-500">Məcburi sütunlar: titleAz, price, categorySlug. İstəyə bağlı: descriptionAz, discountedPrice, wholesalePrice, wholesaleMinQty, unit, stock, region, city, imageUrl.</p>

          {bulkErr && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{bulkErr}</p>}

          <button type="button" disabled={bulkUploading}
            onClick={async () => {
              setBulkErr(""); setBulkResults(null);
              if (!bulkCsv.trim()) { setBulkErr("CSV mətni boşdur"); return; }
              let rows;
              try { rows = csvToObjects(bulkCsv).map(({ _rowNumber, ...rest }) => rest); }
              catch (e) { setBulkErr(e.message); return; }
              if (!rows.length) { setBulkErr("CSV-də məlumat sətri yoxdur"); return; }
              setBulkUploading(true);
              try {
                const d = await apiFetch("/api/products/bulk-upload", {
                  method: "POST",
                  body: JSON.stringify({ target: { type: "personal" }, products: rows }),
                });
                setBulkResults(d);
              } catch (e) { setBulkErr(e.message); }
              finally { setBulkUploading(false); }
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold transition">
            {bulkUploading ? "Yüklənir..." : "Toplu Yüklə"}
          </button>

          {bulkResults && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                <span className="text-green-700">✓ {bulkResults.createdCount} yaradıldı</span>
                {bulkResults.failed > 0 && <span className="text-red-600"> · ✗ {bulkResults.failed} xəta</span>}
              </p>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 text-sm">
                {bulkResults.results.map((r) => (
                  <div key={r.row} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-gray-600">Sətir {r.row}: <span className="font-medium text-gray-800">{r.title || "(adsız)"}</span></span>
                    {r.success
                      ? <span className="text-green-600 text-xs font-bold">OK</span>
                      : <span className="text-xs text-red-600 text-right max-w-[50%]">{r.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="card p-5">
          <h2 className="font-bold mb-3">Mənə Gələn Sifarişlər</h2>
          {ordersError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">{ordersError}</p>}
          {ordersLoading ? (
            <p className="text-sm text-gray-400">Yüklənir...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400">Hələ sifariş yoxdur.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const myItems = o.items;
                const orderTotal = myItems.reduce((s, it) => s + Number(it.unitPrice) * it.quantity, 0);
                return (
                  <div key={o.id} className={`border rounded-2xl p-4 ${o.status==="PENDING"?"border-amber-200 bg-amber-50":o.status==="DELIVERED"?"border-green-200 bg-green-50":"border-gray-100"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-sm">#{o.id.slice(-8)}</p>
                        <p className="text-[11px] text-gray-400">{new Date(o.createdAt).toLocaleDateString("az-AZ", {day:"numeric",month:"long"})}</p>
                      </div>
                      <div className="text-right">
                        <span className={`badge text-[11px] ${o.status==="DELIVERED"?"badge-green":o.status==="SHIPPED"?"badge-blue":o.status==="PAID"||o.status==="PROCESSING"?"badge-yellow":"badge-gray"}`}>{ORDER_STATUS_LABELS[o.status] || o.status}</span>
                        <p className="font-bold text-brand-700 text-sm mt-1">₼{orderTotal.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(o.buyer?.fullName||"?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{o.buyer?.fullName || "—"}</p>
                        {o.buyer?.phone && <a href={`tel:${o.buyer.phone}`} className="text-[11px] text-brand-600 font-medium">{o.buyer.phone}</a>}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 space-y-1.5 mb-2">
                      {myItems.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {it.product?.images?.[0]?.url && <img src={it.product.images[0].url} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0"/>}
                            <span className="text-gray-700 line-clamp-1">{it.product?.titleAz || "—"} <span className="text-gray-400">×{it.quantity}</span></span>
                          </div>
                          <span className="font-semibold text-brand-700 flex-shrink-0">₼{(Number(it.unitPrice)*it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {NEXT_STATUS[o.status] && (
                      <button onClick={() => advanceOrderStatus(o)} className="btn-primary text-xs w-full py-2">
                        <span className="flex items-center gap-1"><Icon name="check" size={14} /> {ORDER_STATUS_LABELS[NEXT_STATUS[o.status]]} kimi qeyd et</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "create-store" && !user?.store && !user?.ownedStores?.length && (
        <div className="card p-5">
          <h2 className="font-bold mb-4">Mağaza Aç</h2>
          <p className="text-sm text-gray-500 mb-4">
            Öz mağazanızı açaraq məhsullarınızı bir yerdə təqdim edin, brendinizi qurun və daha çox alıcıya çatın.
          </p>
          {storeSettingsError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">{storeSettingsError}</p>}
          {storeSettingsMsg && <p className="text-sm text-green-700 bg-green-50 rounded-lg p-2 mb-3">{storeSettingsMsg}</p>}
          
          <form onSubmit={createStore} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-sm">Mağaza Adı *</label>
                <input 
                  value={storeSettingsForm.name} 
                  onChange={e=>setStoreSettingsForm(f=>({...f,name:e.target.value}))} 
                  className="input-field" 
                  placeholder="Məs: Ağsu Fermer Mağazası"
                  required 
                />
              </div>
              <div>
                <label className="label-sm">Ünvan</label>
                <input 
                  value={storeSettingsForm.address} 
                  onChange={e=>setStoreSettingsForm(f=>({...f,address:e.target.value}))} 
                  className="input-field" 
                  placeholder="Məs: Ağsu rayonu, Kənd təsərrüfatı bazarı"
                />
              </div>
            </div>

            <div>
              <label className="label-sm">Haqqında (Qısa təsvir)</label>
              <textarea 
                value={storeSettingsForm.description} 
                onChange={e=>setStoreSettingsForm(f=>({...f,description:e.target.value}))} 
                className="input-field" 
                rows="2"
                placeholder="Mağazanız haqqında qısa məlumat..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-sm">Əlaqə Nömrəsi</label>
                <input 
                  value={storeSettingsForm.phone} 
                  onChange={e=>setStoreSettingsForm(f=>({...f,phone:e.target.value}))} 
                  className="input-field" 
                  placeholder="+994501234567"
                />
              </div>
              <div>
                <label className="label-sm">WhatsApp Nömrəsi</label>
                <input 
                  value={storeSettingsForm.whatsapp} 
                  onChange={e=>setStoreSettingsForm(f=>({...f,whatsapp:e.target.value}))} 
                  className="input-field" 
                  placeholder="+994501234567"
                />
              </div>
            </div>

            <div>
              <label className="label-sm">Logo URL (istəyə görə)</label>
              <input 
                value={storeSettingsForm.logoUrl} 
                onChange={e=>setStoreSettingsForm(f=>({...f,logoUrl:e.target.value}))} 
                className="input-field" 
                placeholder="https://..."
              />
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 mt-4">
              <p className="text-sm text-brand-800 font-medium">
                İlk mağazanız avtomatik aktivləşdiriləcək. Əlavə mağazalar üçün admin təsdiqi lazımdır.
              </p>
            </div>

            <button type="submit" disabled={storeSettingsLoading} className="btn-primary w-full mt-4">
              {storeSettingsLoading ? "Yaradılır..." : "Mağaza Yarat"}
            </button>
          </form>
        </div>
      )}

      {tab === "settings" && (user?.store || user?.ownedStores?.length > 0) && (
        <div className="card p-5">
          <h2 className="font-bold mb-4">Mağaza Ayarları</h2>
          {storeSettingsError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">{storeSettingsError}</p>}
          {storeSettingsMsg && <p className="text-sm text-green-700 bg-green-50 rounded-lg p-2 mb-3">{storeSettingsMsg}</p>}
          
          <form onSubmit={saveStoreSettings} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-sm">Mağaza Adı</label>
                <input value={storeSettingsForm.name} onChange={e=>setStoreSettingsForm(f=>({...f,name:e.target.value}))} className="input-field" required />
              </div>
              <div>
                <label className="label-sm">Ünvan</label>
                <input value={storeSettingsForm.address} onChange={e=>setStoreSettingsForm(f=>({...f,address:e.target.value}))} className="input-field" />
              </div>
            </div>

            <div>
              <label className="label-sm">Haqqında (Qısa təsvir)</label>
              <textarea value={storeSettingsForm.description} onChange={e=>setStoreSettingsForm(f=>({...f,description:e.target.value}))} className="input-field" rows="2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-sm">Əlaqə Nömrəsi</label>
                <input value={storeSettingsForm.phone} onChange={e=>setStoreSettingsForm(f=>({...f,phone:e.target.value}))} className="input-field" />
              </div>
              <div>
                <label className="label-sm">Mağaza WhatsApp Nömrəsi</label>
                <input value={storeSettingsForm.whatsapp} onChange={e=>setStoreSettingsForm(f=>({...f,whatsapp:e.target.value}))} className="input-field" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={storeSettingsForm.installmentEnabled} 
                  onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, installmentEnabled: e.target.checked })}
                  className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold text-gray-800">Hissəli Satış Modulu (Kredit)</span>
                  <p className="text-xs text-gray-500 mt-0.5">Aktiv etsəniz, məhsullarınıza "Kreditlə Al" imkanı əlavə edə bilərsiniz.</p>
                </div>
              </label>
            </div>

            {storeSettingsForm.installmentEnabled && (
              <div>
                <label className="label-sm">Kredit Müraciətləri üçün WhatsApp Nömrəsi</label>
                <input 
                  required
                  placeholder="+994501234567"
                  className="input-field w-full"
                  value={storeSettingsForm.installmentWhatsapp}
                  onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, installmentWhatsapp: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Müştərilərin vəsiqə şəkillərini göndərəcəyi WhatsApp nömrəsi. Nömrəni beynəlxalq formatda (+994) yazın.
                </p>
              </div>
            )}

            <button type="submit" disabled={storeSettingsLoading} className="btn-primary w-full mt-4">
              {storeSettingsLoading ? "Yadda saxlanılır..." : "Yadda Saxla"}
            </button>
          </form>
        </div>
      )}

      {tab === "bundles" && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold mb-1">Yeni Bağlama Yarat</h2>
            <p className="text-xs text-gray-500 mb-3">Ən azı 2 öz elanınızı seçib birgə endirimli qiymətə təklif edin. Bağlama aktiv elanlarınız arasında görünür və ana səhifədə "Bağlamalar" bölməsində alıcılara göstərilir.</p>
            {bundlesMsg && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg p-2 mb-3">{bundlesMsg}</p>}
            {bundlesError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">{bundlesError}</p>}
            <form onSubmit={submitBundle} className="space-y-3">
              <input
                required
                placeholder="Bağlama adı (məs: Payız Kombosu)"
                className="input-field"
                value={bundleForm.title}
                onChange={(e) => setBundleForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                placeholder="Qısa açıqlama (istəyə bağlı)"
                className="input-field"
                rows={2}
                value={bundleForm.description}
                onChange={(e) => setBundleForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="flex gap-2">
                <select
                  className="input-field"
                  value={bundleForm.discountType}
                  onChange={(e) => setBundleForm((f) => ({ ...f, discountType: e.target.value }))}
                >
                  <option value="PERCENTAGE">Endirim %</option>
                  <option value="FIXED">Endirim (məbləğ AZN)</option>
                </select>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={bundleForm.discountType === "PERCENTAGE" ? "məs: 10" : "məs: 5"}
                  className="input-field"
                  value={bundleForm.discountValue}
                  onChange={(e) => setBundleForm((f) => ({ ...f, discountValue: e.target.value }))}
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Bağlamaya daxil ediləcək elanlar (ən azı 2):</p>
                {myProducts.filter((p) => p.status === "ACTIVE").length === 0 ? (
                  <p className="text-xs text-gray-400">Bağlama yaratmaq üçün əvvəlcə aktiv elanınız olmalıdır.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {myProducts.filter((p) => p.status === "ACTIVE").map((p) => (
                      <label key={p.id} className="flex items-center gap-2 card p-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bundleForm.productIds.includes(p.id)}
                          onChange={() => toggleBundleProduct(p.id)}
                        />
                        <span className="truncate">{p.title || p.titleAz}</span>
                        <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">{Number(p.price).toFixed(2)} AZN</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn-primary w-full" disabled={bundleSubmitting}>
                {bundleSubmitting ? "Yaradılır..." : "Bağlama Yarat"}
              </button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-3">Bağlamalarım</h2>
            {bundlesLoading ? (
              <p className="text-sm text-gray-400">Yüklənir...</p>
            ) : bundles.length === 0 ? (
              <p className="text-sm text-gray-400">Hələ bağlama yaratmamısınız.</p>
            ) : (
              <div className="space-y-2.5">
                {bundles.map((b) => (
                  <div key={b.id} className="card p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{b.title}</span>
                      <span className={`tag-badge ${b.isActive ? "bg-brand-100 text-brand-800" : "bg-gray-100 text-gray-500"}`}>
                        {b.isActive ? "Aktiv" : "Deaktiv"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{b.items.length} məhsul · {b.discountType === "PERCENTAGE" ? `${Number(b.discountValue)}% endirim` : `${Number(b.discountValue)} AZN endirim`}</p>
                    <p className="text-sm">
                      <span className="line-through text-gray-400 mr-2">{b.subtotal.toFixed(2)} AZN</span>
                      <span className="font-bold text-brand-700">{b.finalPrice.toFixed(2)} AZN</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => toggleBundleActive(b)} className="btn-secondary text-xs px-3 py-1.5 flex-1">
                        {b.isActive ? "Deaktiv et" : "Aktiv et"}
                      </button>
                      <button onClick={() => deleteBundle(b.id)} className="btn-secondary text-xs px-3 py-1.5 text-red-600">
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "wallet" && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold mb-1">Balans</h2>
            {walletLoading ? (
              <p className="text-sm text-gray-400">Yüklənir...</p>
            ) : walletError ? (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{walletError}</p>
            ) : (
              <div className="flex gap-6 items-end mt-1">
                <p className="text-3xl font-extrabold text-brand-700">
                  {Number(wallet?.balance || 0).toFixed(2)} <span className="text-base font-semibold text-gray-500">AZN</span>
                </p>
                <p className="text-2xl font-extrabold text-amber-500">
                  {Number(wallet?.coins || 0).toFixed(0)} <span className="text-sm font-semibold text-gray-500">Coin</span>
                </p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-3">Çıxarış Tələbi</h2>
            {walletMsg && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg p-2 mb-3">{walletMsg}</p>}
            {walletError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">{walletError}</p>}
            <form onSubmit={submitWithdraw} className="space-y-3">
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                max={wallet?.balance || undefined}
                placeholder="Məbləğ (AZN)"
                className="input-field"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <input
                placeholder="Qeyd (istəyə bağlı, məs: kart nömrəsi)"
                className="input-field"
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
              />
              <button className="btn-primary w-full" disabled={withdrawSubmitting || !wallet?.balance}>
                {withdrawSubmitting ? "Göndərilir..." : "Tələb Göndər"}
              </button>
              {!walletLoading && !wallet?.balance && (
                <p className="text-xs text-gray-400">Çıxarış üçün balansınızda vəsait olmalıdır.</p>
              )}
            </form>
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-3">Əməliyyat Tarixçəsi</h2>
            {!wallet?.transactions?.length ? (
              <p className="text-sm text-gray-400">Hələ əməliyyat yoxdur.</p>
            ) : (
              <div className="space-y-2.5">
                {wallet.transactions.map((t) => (
                  <div key={t.id} className="card p-3 flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.description || WALLET_TX_LABELS[t.type] || t.type}</p>
                      <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("az-AZ")} · {WALLET_STATUS_LABELS[t.status] || t.status}</p>
                    </div>
                    <span className={`font-bold whitespace-nowrap ${t.type === "WITHDRAWAL" ? "text-red-600" : "text-brand-700"}`}>
                      {t.type === "WITHDRAWAL" ? "-" : "+"}{Number(t.amount).toFixed(2)} AZN
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "messages" && <MessagingPanel />}

      {tab === "analytics" && (
        <div className="card p-5">
          <h2 className="font-bold mb-4">Satış Analitikam</h2>
          <AnalyticsPanel mode="farmer" />
        </div>
      )}
            {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => {
                setIsAiModalOpen(false);
                setAiError("");
                setAiDescription("");
                setAiCategory("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-1.5">
              <span className="flex items-center gap-1.5"><Icon name="sparkles" size={16} className="text-amber-500" /> AI ilə Elan Yaz</span>
            </h3>
            {aiError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">
                {aiError}
              </p>
            )}
            <form onSubmit={handleAiSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Məhsulunuzu qısaca təsvir edin (az. dildə)
                </label>
                <textarea
                  required
                  rows={4}
                  className="input-field"
                  placeholder="Məsələn: Gədəbəydən təbii kartof satıram, dadlıdır, kisələrlə çatdırılma var"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kateqoriya
                </label>
                <select
                  className="input-field"
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                >
                  <option value="">Seçin (istəyə bağlı)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={aiLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analiz edilir...
                  </>
                ) : (
                  "Analiz et"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <BoostModal
        isOpen={!!promoteModal}
        onClose={() => setPromoteModal(null)}
        targetType="PRODUCT"
        targetItem={myProducts.find(p => p.id === promoteModal) || { id: promoteModal }}
        onSuccess={() => {
          apiFetch("/api/products?mine=1").then((d) => setMyProducts(d.products || [])).catch(() => {});
        }}
      />
    </div>
  );
}
