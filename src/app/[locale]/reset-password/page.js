"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { apiFetch } from "@/lib/apiClient";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Sıfırlama tokeni tapılmadı. Linkin düzgün olduğundan əmin olun.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }
    if (newPassword.length < 6) {
      setError("Şifrə ən azı 6 simvol olmalıdır");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/users/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Xəta baş verdi");
      } else {
        setSuccess(true);
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0.55 0 1-0.45 1-1V6c0-0.55-0.45-1-1-1s-1 0.45-1 1v4c0 0.55 0.45 1 1 1zm6 0c0.55 0 1-0.45 1-1V6c0-0.55-0.45-1-1-1s-1 0.45-1 1v4c0 0.55 0.45 1 1 1z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Yeni Şifrə Təyin Et</h1>
            </div>

            {success ? (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
                  Şifrəniz uğurla dəyişdirildi! İndi yeni şifrə ilə daxil ola bilərsiniz.
                </div>
                <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition">
                  Giriş səhifəsinə keç
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yeni şifrə</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ən azı 6 simvol"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şifrəni təsdiqlə</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Şifrəni təkrar daxil edin"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Dəyişdirilir..." : "Şifrəni Dəyiş"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
