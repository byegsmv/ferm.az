"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";
import StoreDashboard from "@/components/dashboard/store/StoreDashboard";
import BuyerPanel from "@/components/dashboard/BuyerPanel";
import DeliveryPanel from "@/components/dashboard/DeliveryPanel";

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MODERATOR: "Moderator",
  FARMER: "Fermer", STORE: "Mağaza", AGRONOMIST: "Aqronom",
  BUYER: "Alıcı", DELIVERY_PARTNER: "Çatdırılma Partnyor",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fermerCoin, setFermerCoin] = useState('0.00');

  useEffect(() => {
    const localUser = getUser();
    if (!localUser) { router.push("/login"); return; }
    
    apiFetch("/api/wallet")
      .then(d => {
        if (d?.wallet) {
          setFermerCoin(Number(d.wallet.coins || 0).toFixed(0));
        }
      })
      .catch(() => {});

    apiFetch("/api/users/me")
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-xl w-48" />
          <div className="h-4 bg-gray-100 rounded w-64" />
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const hasStore = true; // All non-admin users get store + buyer features

  const isAdminLevel = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role); // Admins manage platform at /admin, dashboard is their personal view

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap bg-gradient-to-r from-brand-600 to-green-500 rounded-3xl p-6 text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-black">
            Salam, {user.fullName?.split(" ")[0]} <Icon name="hand" size={20} className="inline text-amber-500 ml-1" />
          </h1>
          <p className="text-sm opacity-90 mt-1">
            {user.email}
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-brand-700 shadow-sm">
              {roleLabel}
            </span>
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/30 text-right">
          <p className="text-xs uppercase font-bold tracking-wider opacity-90">FermerCoin Balansınız</p>
          <div className="text-2xl font-black flex items-center gap-1.5 justify-end">
            <Icon name="coins" size={18} className="text-amber-400 inline" /> 
            {fermerCoin}
          </div>
        </div>
      </div>

                  {!isAdminLevel && <DeliveryPanel user={user} />}
      
      <div className="space-y-4">
        {hasStore && (
           <StoreDashboard user={user} />
        )}
        <BuyerPanel user={user} />
      </div>
    </div>
  );
}
