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
  const [step, setStep] = useState(1); // 1 = identifier input, 2 = OTP + new password (phone)

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
        setMessage(data.message || "Sıfırlama təlimatları göndərilmişdir.");
        // If SMS method with OTP required, show OTP step
        if (data.otpRequired) {
          setStep(2);
        }
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
                {step === 1
                  ? "E-poçt, telefon nömrənizi və ya istifadəçi adınızı daxil edin."
                  : "Telefonunuzdakı 6 rəqəmli kodu və yeni şifrənizi daxil edin."}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}
            {message && step === 1 && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
                {message}
              </div>
            )}

            {step === 1 ? (
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
                  <p className="text-xs text-gray-400 mt-1">
                    📧 E-poçt ilə → sıfırlama linki e-poçta gələcək
                    <br />
                    📱 Telefon ilə → 6 rəqəmli SMS kodu gələcək
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Göndərilir..." : "Sıfırlama Təlimatları Göndər"}
                </button>

                <div className="mt-6 text-center text-sm text-gray-500">
                  <Link href="/login" className="text-green-600 hover:underline font-medium">
                    ← Giriş səhifəsinə qayıt
                  </Link>
                </div>
              </form>
            ) : (
              <OtpResetForm identifier={identifier} />
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

// OTP + new password entry form (for phone-based reset)
function OtpResetForm({ identifier }) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

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
        body: JSON.stringify({ token: otp, newPassword }),
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

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
          Şifrəniz uğurla dəyişdirildi! İndi yeni şifrə ilə daxil ola bilərsiniz.
        </div>
        <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition">
          Giriş səhifəsinə keç
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SMS Kodu (6 rəqəm)</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          required
          maxLength={6}
          pattern="\d{6}"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-bold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Yeni şifrə</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Ən azı 6 simvol, 1 rəqəm"
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
        disabled={loading || otp.length !== 6}
        className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Dəyişdirilir..." : "Şifrəni Dəyiş"}
      </button>
    </form>
  );
}
