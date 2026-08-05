"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { apiFetch } from "@/lib/apiClient";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiFetch("/api/users/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Xəta baş verdi");
      } else {
        setMessage(data.message || "Sıfırlama linki göndərilmişdir.");
      }
    } catch {
      setError("Şəbəkə xətası. Sonra yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-green-50/40 to-white">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 15a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Şifrəni Unutdum</h1>
              <p className="text-sm text-gray-500 mt-1 text-center">
                E-poçt, telefon nömrənizi və ya istifadəçi adınızı daxil edin. Sıfırlama linki e-poçt ünvanınıza göndəriləcək.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-poçt / Telefon / İstifadəçi adı
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nümunə: email@fermermarket.az, 0501234567"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Göndərilir..." : "Sıfırlama Linki Göndər"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="text-green-600 hover:underline font-medium">
                ← Giriş səhifəsinə qayıt
              </Link>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
