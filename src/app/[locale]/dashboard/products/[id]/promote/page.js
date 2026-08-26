"use client";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";

export default function UserPromoteProductPage({ params }) {
  const { id } = params;
  const router = useRouter();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [selectedTier, setSelectedTier] = useState("PREMIUM");
  const [selectedDays, setSelectedDays] = useState(30);

  const TIERS = [
    { id: "FEATURED", label: "Önə Çıxan (Featured)", price: 5, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    { id: "PREMIUM", label: "Premium ", price: 15, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    { id: "VIP", label: "VIP ", price: 30, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" }
  ];

  useEffect(() => {
    apiFetch(`/api/products/${id}`)
      .then(d => {
        const p = d.product;
        const currentUser = getUser();
        if (!currentUser || p.sellerId !== currentUser.id) {
          throw new Error("Siz yalnız öz məhsullarınızı önə çıxara bilərsiniz.");
        }
        if (p.status !== "ACTIVE") {
          throw new Error("Yalnız aktiv elanları önə çıxarmaq olar.");
        }
        setProduct(p);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePromote() {
    setPromoting(true);
    setError("");
    try {
      // In a real app, this would deduct from wallet or redirect to a payment gateway
      await apiFetch(`/api/products/${id}/promote`, {
        method: "POST",
        body: JSON.stringify({ tier: selectedTier, days: selectedDays })
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPromoting(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Yüklənir...</div>;

  if (error && !product) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-bold">{error}</div>
      <Link href="/dashboard" className="text-brand-600 font-bold hover:underline">Geri qayıt</Link>
    </div>
  );

  const selectedTierInfo = TIERS.find(t => t.id === selectedTier);
  const totalPrice = selectedTierInfo.price * (selectedDays / 30);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
          <Icon name="arrowLeft" size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Elanı Önə Çıxar</h1>
          <p className="text-gray-500 text-sm">Elanınızı milyonlarla alıcıya daha tez çatdırın</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl mb-6 text-center shadow-sm">
          <div className="text-4xl mb-2"></div>
          <h2 className="text-xl font-bold mb-1">Təbrik edirik!</h2>
          <p className="text-sm">Elanınız uğurla "{selectedTierInfo.label}" statusuna keçirildi.</p>
          <p className="text-xs text-gray-500 mt-2">İdarə panelinə yönləndirilirsiniz...</p>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">{error}</div>}

      {!success && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Elan Məlumatı</h3>
              <div className="flex items-center gap-3">
                {product.images && product.images[0] ? (
                  <img src={product.images[0].url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Icon name="image" size={24} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm line-clamp-2">{product.titleAz}</p>
                  <p className="text-brand-700 font-bold mt-1">{product.price} AZN</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900">Paket Seçimi</h3>
              <div className="space-y-3">
                {TIERS.map(t => (
                  <label key={t.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTier === t.id ? t.border + ' ' + t.bg : 'border-gray-100 hover:border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="tier" 
                      value={t.id} 
                      checked={selectedTier === t.id}
                      onChange={() => setSelectedTier(t.id)}
                      className="mt-1 w-4 h-4 text-brand-600"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${t.color}`}>{t.label}</span>
                        <span className="font-bold text-gray-900">{t.price} ₼ <span className="text-xs text-gray-500 font-normal">/ ay</span></span>
                      </div>
                      <p className="text-xs text-gray-500">Ana səhifədə müvafiq bölmədə görünür</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900">Müddət</h3>
              <div className="flex gap-2">
                {[7, 15, 30].map(d => (
                  <button 
                    key={d} 
                    onClick={() => setSelectedDays(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedDays === d ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {d} gün
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-xl h-fit sticky top-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Ödəniş Məlumatı</h3>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Seçilmiş Paket:</span>
                <span className="font-medium text-gray-900">{selectedTierInfo.label}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Müddət:</span>
                <span className="font-medium text-gray-900">{selectedDays} gün</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Vahid qiymət:</span>
                <span className="font-medium text-gray-900">{selectedTierInfo.price} ₼ / 30 gün</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                <span>Cəmi Ödəniş:</span>
                <span className="text-brand-700">{totalPrice.toFixed(2)} ₼</span>
              </div>
            </div>

            <button 
              onClick={handlePromote} 
              disabled={promoting}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
            >
              {promoting ? "İşlənilir..." : "Ödəniş Et və Önə Çıxar"}
            </button>
            <p className="text-xs text-center text-gray-400 mt-4">
              * Test üçün ödəniş simulyasiya edilir və birbaşa təsdiqlənir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
