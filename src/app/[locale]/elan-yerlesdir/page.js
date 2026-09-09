"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import StoreCreateWizard from "@/components/dashboard/store/StoreCreateWizard";
import { useRouter } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";

/**
 * Elan Yerləşdir — 2026-09-10 qərarı:
 * Köhnə "qonaq elanı" modulu tamamilə ləğv edilib.
 * Elan vermək üçün aktiv MAĞAZA mütləqdir:
 *  - Mağazası olmayan istifadəçi burada mağaza açır (şərtlər + düzgün ad + xəritə konumu).
 *  - Mağazası olan istifadəçi dərhal panelinə yönləndirilir.
 */
export default function PostListingGatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => {
    const localUser = getUser();
    if (!localUser) { setLoading(false); return; }

    apiFetch("/api/users/me")
      .then((d) => {
        const u = d.user;
        setUser(u);
        if (u?.ownedStores?.some(s => s.isActive) || u?.store) {
          setHasStore(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded-xl w-2/3 mx-auto" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  // Login deyil
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto">
          <Icon name="store" size={40} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mt-4">Elan yerləşdirmək üçün mağaza lazımdır</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Artıq qeydiyyatsız (qonaq) elan yoxdur. Elan vermək üçün hesabınıza daxil olun, mağaza açın və satışa başlayın.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <a href="/login" className="btn-primary px-6 py-3 rounded-xl font-bold">Daxil Ol</a>
          <a href="/register" className="btn-secondary px-6 py-3 rounded-xl font-bold">Qeydiyyat</a>
        </div>
      </div>
    );
  }

  // Mağazası var — dərhal panelə
  if (hasStore) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
          <Icon name="check" size={40} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mt-4">Mağazanız hazırdır!</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Elanlarınızı idarəetmə panelindən yerləşdirin: məhsul əlavə et, qiymət düzəlt, sifarişləri izlə.
        </p>
        <button onClick={() => router.push("/dashboard")} className="btn-primary px-6 py-3 rounded-xl font-bold mt-6">
          Panelə Get →
        </button>
      </div>
    );
  }

  // Mağazası yoxdur — mağaza aç (şərtlər + ad + unvan + xəritə)
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-gray-900">Elan vermək üçün əvvəlcə mağaza açın</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Mağazasız elan yerləşdirmək mümkün deyil. Mağazanızı yaradın — elanlarınız, sifarişləriniz və satışlarınız hamısı bir yerdə.
        </p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
        <StoreCreateWizard
          user={user}
          onCreated={() => router.push("/dashboard?storeCreated=1")}
        />
      </div>
    </div>
  );
}
