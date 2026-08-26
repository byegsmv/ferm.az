"use client";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";

export default function ProcurementServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    cropType: "",
    area: "",
    notes: "",
    contactPhone: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/api/agro-services", {
        method: "POST",
        body: JSON.stringify({
          serviceType: "satinalma",
          cropType: form.cropType,
          area: form.area,
          notes: form.notes,
          contactPhone: form.contactPhone,
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="check" size={40} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Müraciətiniz qəbul edildi!</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Satınalma xidməti ilə bağlı müraciətiniz uğurla göndərildi. Əməkdaşlarımız tezliklə sizinlə əlaqə saxlayacaqlar.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/xidmetler" className="btn-primary w-full">
              Xidmətlərə qayıt
            </Link>
            <Link href="/" className="btn-secondary w-full">
              Ana səhifəyə qayıt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Breadcrumb & Back */}
        <Link href="/xidmetler" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-6">
          <Icon name="arrowLeft" size={16} /> Xidmətlərə qayıt
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Icon name="shoppingBag" size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Satınalma Xidməti</h1>
            <p className="text-gray-500 leading-relaxed">
              Biznesiniz üçün lazımi məhsulların ən yaxşı qiymətə tapılması və alınmasında sizə köməklik edirik. 
              Tələblərinizi aşağıdakı formaya qeyd edin.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Müraciət Forması</h2>
          
          {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl font-medium border border-red-100">{error}</div>}

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tələb olunan məhsul (Növü)</label>
              <input
                required
                placeholder="Məs: Gübrə, Toxum, Avadanlıq..."
                className="input-field"
                value={form.cropType}
                onChange={(e) => setForm({ ...form, cropType: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Təxmini miqdar və ya büdcə</label>
              <input
                placeholder="Məs: 10 ton və ya 5000 AZN"
                className="input-field"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Əlaqə nömrəniz</label>
            <input
              required
              type="tel"
              placeholder="+994"
              className="input-field"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1.5">Sizinlə əlaqə saxlamağımız üçün aktiv nömrənizi qeyd edin.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Əlavə qeydlər (istəyə bağlı)</label>
            <textarea
              placeholder="Xüsusi tələbləriniz və ya qeydləriniz..."
              className="input-field min-h-32"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-10 py-3">
              {loading ? "Göndərilir..." : "Müraciət et"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
