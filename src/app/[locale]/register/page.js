"use client";
import { useState } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { apiFetch, saveSession } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", confirmPassword: "", fullName: "", phone: "", });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Şifrələr uyğun gəlmir"); return;
    }
    setLoading(true); setError("");
    try {
      const { confirmPassword, ...payload } = form;
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Qeydiyyat mümkün olmadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8 pb-24">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Icon name="sprout" size={26} className="text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Qeydiyyat</h1>
          <p className="text-gray-500 text-sm mt-1">FermerMarket ailəsinə qoşulun</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
              <Icon name="alert" size={16} className="shrink-0" /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ad Soyad</label>
              <input type="text" required className="input-field" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Əli Həsənov" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">İstifadəçi adı (Login)</label>
              <input type="text" className="input-field" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Nümunə: user123" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email (İstəyə bağlı)</label>
              <input type="email" className="input-field" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
              <input type="tel" className="input-field" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+994501234567" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Şifrə</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} required className="input-field pr-11" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Ən azı 8 simvol, 1 böyük hərf, 1 rəqəm" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPass ? "Şifrəni gizlət" : "Şifrəni göstər"}>
                  <EyeIcon visible={showPass} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Şifrəni təkrarla</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} required className="input-field pr-11" value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Şifrəni yenidən yazın" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirm ? "Şifrəni gizlət" : "Şifrəni göstər"}>
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60">
              {loading ? "Yüklənir..." : "Qeydiyyatdan keç"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Hesabınız var?{" "}
            <Link href="/login" className="text-green-600 font-semibold hover:underline">Daxil ol</Link>
          </p>
          </div>
        </div>
      </div>
    </main>
  );
}
