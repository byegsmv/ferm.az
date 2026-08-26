"use client";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

export default function AdminSupport() {
  const { showToast, ToastContainer } = useToast();
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      showToast("Mövzu və mesaj tələb olunur", "error");
      return;
    }
    setLoading(true);
    try {
      const { getUser } = await import("@/lib/apiClient");
      const user = getUser();
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: user?.fullName || "Admin İstifadəçi",
          email: user?.email || "admin@fermermarket.az",
          subject: form.subject,
          message: `[Prioritet: ${form.priority}] ${form.message}`,
        }),
      });
      showToast("Sorğunuz göndərildi", "success");
      setForm({ subject: "", message: "", priority: "normal" });
    } catch (err) {
      showToast("Göndərmə xətası", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <ToastContainer />
      <div>
        <h2 className="font-bold text-lg flex items-center gap-2 mb-1">
          <Icon name="info" size={20} /> Dəstək & Yardım
        </h2>
        <p className="text-sm text-gray-500">Texniki dəstək komandasına müraciət edin</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a href="https://docs.base44.com" target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-brand-200 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Icon name="fileText" size={18} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sənədlər</h3>
              <p className="text-xs text-gray-500">Texniki dokumentasiya</p>
            </div>
          </div>
        </a>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Icon name="mail" size={18} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">E-poçt Dəstək</h3>
              <p className="text-xs text-gray-500">admin@fermermarket.az</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-sm">Dəstək Sorğusu Göndər</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Mövzu</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              placeholder="Problemin qısası təsviri"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Prioritet</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            >
              <option value="low">Aşağı</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksək</option>
              <option value="urgent">Təcili</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Mesaj</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none resize-none"
              placeholder="Problemi ətraflı təsvir edin..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition"
          >
            {loading ? "Göndərilir..." : "Sorğunu Göndər"}
          </button>
        </form>
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3">
        <h3 className="font-bold text-sm">Tez-tez Verilən Suallar</h3>
        <div className="space-y-2">
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-brand-600">
              Sistem yavaş işləyirsə nə etməli?
            </summary>
            <p className="text-xs text-gray-500 mt-1 ml-4">Vercel status səhifəsini yoxlayın və lazım gəlsə brauzer keşini təmizləyin.</p>
          </details>
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-brand-600">
              Yeni modul necə aktivləşdirilir?
            </summary>
            <p className="text-xs text-gray-500 mt-1 ml-4">Admin Panel → Sistem → Rol Modulları bölməsinə keçin və lazımi modulu aktivləşdirin.</p>
          </details>
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-brand-600">
              Şifrəmi unutdum, nə etməli?
            </summary>
            <p className="text-xs text-gray-500 mt-1 ml-4">Login səhifəsində "Şifrəni unutdum" linkinə klikləyin və e-poçt ilə sıfırlama linki alın.</p>
          </details>
        </div>
      </div>
    </div>
  );
}
