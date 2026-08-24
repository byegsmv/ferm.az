"use client";
import { useState, Suspense } from "react";
import { useRouter, Link, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";

import { apiFetch, saveSession } from "@/lib/apiClient";
import PasswordInput from "@/components/PasswordInput";
import Icon from "@/components/ui/Icon";

function LoginContent() {
  const router = useRouter();
  const locale = useLocale();
  const [form, setForm] = useState({ login: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      
      // Use callbackUrl if present, otherwise go to dashboard
      const callbackUrl = searchParams.get("callbackUrl");
      let target = callbackUrl || "/dashboard";
      
      // With localePrefix: 'as-needed', the default locale 'az' doesn't need
      // a prefix. Strip any /az, /en, /ru prefix to avoid a double redirect
      // (e.g. /az/dashboard -> /dashboard) which causes ERR_FAILED in browsers
      // when a Service Worker intercepts the navigation.
      target = target.replace(/^\/(az|en|ru)(\/|$)/, "/");
      
      window.location.href = target;
    } catch (err) {
      const msg = err?.code === "DB_CONN"
        ? "Sunucu bağlantısı hatası. Lütfen yöneticinizle iletişime geçin."
        : err.message || "Giriş mümkün olmadı";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-3 sm:px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <Icon name="sprout" size={28} className="text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">FermerMarket</h1>
          <p className="text-gray-500 text-sm mt-1">Kabinetinizə daxil olun</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
              <Icon name="alert" size={16} className="shrink-0" /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giriş (E-poçt, telefon və ya istifadəçi adı)</label>
              <input
                type="text" required
                className="input-field mt-1"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                placeholder="Nümunə: 0501234567, email, və s."
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700">Şifrə</label>
                <a href="/forgot-password" className="text-xs text-brand-600 hover:underline font-medium text-green-600">Şifrəni unutdum?</a>
              </div>

              <PasswordInput
                id="password"
                name="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="input-field mt-1"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {loading ? "Yüklənir..." : "Daxil ol"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Hesabınız yoxdur?{" "}
            <Link href="/register" className="text-green-600 font-semibold hover:underline">Qeydiyyat</Link>
          </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm p-8 text-center text-gray-400">Yüklənir...</div>}>
      <LoginContent />
    </Suspense>
  );
}
