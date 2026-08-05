"use client";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

export default function AdminProfile() {
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.newPassword !== form.confirmPassword) {
      showToast("Yeni şifrələr uyğun gəlmir", "error");
      return;
    }
    
    if (form.newPassword.length < 8) {
      showToast("Şifrə ən azı 8 simvol olmalıdır", "error");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/users/password-reset/request", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      showToast("Şifrə uğurla dəyişdirildi", "success");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast("Xəta: " + (err.message || "Şifrə dəyişdirilə bilmədi"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <ToastContainer />
      <div>
        <h2 className="font-bold text-lg flex items-center gap-2 mb-1">
          <Icon name="user" size={20} /> Profil & Təhlükəsizlik
        </h2>
        <p className="text-sm text-gray-500">Şifrə dəyişdir və hesab tənzimləmələrini idarə et</p>
      </div>

      {/* Password Change Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Icon name="lock" size={16} className="text-brand-600" /> Şifrə Dəyişdir
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Cari şifrə</label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Yeni şifrə</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              placeholder="Ən azı 8 simvol"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Yeni şifrə (təkrar)</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition"
          >
            {loading ? "Yüklənir..." : "Şifrəni Dəyişdir"}
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
        <h3 className="font-bold text-sm flex items-center gap-2 text-amber-700">
          <Icon name="shield" size={16} /> Təhlükəsizlik Məsləhətləri
        </h3>
        <ul className="text-xs text-amber-600 space-y-1.5 ml-6 list-disc">
          <li>Şifrənizi mütəmadi olaraq dəyişdirin (3-6 ayda bir)</li>
          <li>Böyük/kiçik hərf, rəqəm və xüsusi simvoldan istifadə edin</li>
          <li>Eyni şifrəni fərqli platformalarda istifadə etməyin</li>
          <li>Şübhəli fəaliyyət görsəniz dərhal şifrə dəyişdirin</li>
        </ul>
      </div>
    </div>
  );
}
