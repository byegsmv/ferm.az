"use client";
import Icon from "@/components/ui/Icon";
import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function ReportModal({ productId, productTitle }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submitReport(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Fake API request for reporting
      // await apiFetch("/api/reports", { method: "POST", body: JSON.stringify({ productId, reason, details }) });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setReason("");
        setDetails("");
      }, 2500);
    } catch(e) {
      alert("Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="text-[11px] text-gray-400 hover:text-red-500 flex items-center justify-end gap-1 font-semibold transition"
      >
        Şikayət et
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold">×</button>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">Şikayət Et</h3>
            <p className="text-xs text-gray-500 mb-5 font-medium">{productTitle}</p>
            
            {success ? (
              <div className="text-center py-6">
                <Icon name="checkCircle" size={48} className="text-green-500" />
                <p className="font-bold mt-3 text-gray-800">Şikayət göndərildi</p>
                <p className="text-xs text-gray-500 mt-1">Moderatorlar qısa zamanda baxacaq.</p>
              </div>
            ) : (
              <form onSubmit={submitReport} className="space-y-4">
                <div>
                  <label className="label text-xs">Səbəb</label>
                  <select required className="input-field !text-sm" value={reason} onChange={e => setReason(e.target.value)}>
                    <option value="">Seçin</option>
                    <option value="spam">Spam / Təkrar elan</option>
                    <option value="fake">Saxta / Dələduzluq</option>
                    <option value="wrong_category">Yanlış kateqoriya</option>
                    <option value="inappropriate">Uyğunsuz məzmun</option>
                    <option value="other">Digər</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Əlavə məlumat (istəyə bağlı)</label>
                  <textarea rows={3} className="input-field !text-sm" value={details} onChange={e => setDetails(e.target.value)} placeholder="Ətraflı izah edin..." />
                </div>
                <button disabled={loading} className="btn-primary w-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-600/30">
                  {loading ? "Göndərilir..." : "Şikayəti Təsdiqlə"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
